import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import {
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Users,
  DollarSign,
  Truck,
  RefreshCw,
  ChevronRight,
  Warehouse,
  Trash2,
  PackageX,
  CreditCard,
  Wallet,
  ShieldAlert,
} from "lucide-react";
import { useDashboard } from "../../hooks/useDashboard";
import DashboardDateRangeFilter from "./components/DashboardDateRangeFilter";
import InventarioTopStockChart from "./components/InventarioTopStockChart";
import InventarioRestockAlerts from "./components/InventarioRestockAlerts";
import VentasTendenciaChart from "./components/VentasTendenciaChart";
import VentasTopClientes from "./components/VentasTopClientes";
import CarteraTopDeudaChart from "./components/CarteraTopDeudaChart";
import CarteraEstadoDonut from "./components/CarteraEstadoDonut";
import LogisticaEfectividadDonut from "./components/LogisticaEfectividadDonut";
import LogisticaVentasPorZonaChart from "./components/LogisticaVentasPorZonaChart";
import LogisticaVendedorTable from "./components/LogisticaVendedorTable";
import {
  CurrencyChartTooltip,
  PercentChartTooltip,
} from "./components/DashboardChartTooltip";
import {
  KpiGridSkeleton,
  DashboardVentasSkeleton,
  DashboardInventarioSkeleton,
  DashboardCarteraSkeleton,
  DashboardLogisticaSkeleton,
} from "./components/DashboardSkeletons";
import { Skeleton } from "../../components/ui/skeleton";
import { formatCurrency } from "../../lib/format-currency";
import CompraCreateModal from "../Compras/components/CompraCreateModal";
import SuccessToast from "../../components/ui/SuccessToast";
import {
  buildCompraDraftFromProduct,
  registerCompra,
  isComprasAdmin,
} from "../../services/comprasService";

const INITIAL_COMPRA_STATE = {
  idProveedor: "",
  proveedorNombre: "",
  fechaCompra: new Date().toISOString().split("T")[0],
  numeroFactura: "",
  detalles: [],
};

const formatTrend = (value, suffix) => {
  if (value === null || value === undefined) return `Sin datos ${suffix}`;
  const num = Number(value);
  const sign = num > 0 ? "+" : "";
  return `${sign}${num}% ${suffix}`;
};

function KpiCard({ item, cn }) {
  const navigate = useNavigate();
  const isClickable = Boolean(item.to);

  const handleActivate = () => {
    if (!item.to) return;
    const params = item.estado ? `?estado=${encodeURIComponent(item.estado)}` : "";
    navigate(`${item.to}${params}`);
  };

  return (
    <Card
      role={isClickable ? "link" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={isClickable ? handleActivate : undefined}
      onKeyDown={(event) => {
        if (!isClickable) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleActivate();
        }
      }}
      className={cn(
        "border-none text-white bg-gradient-to-br shadow-lg transition-all duration-300",
        item.color,
        isClickable &&
          "cursor-pointer hover:scale-[1.02] hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 active:scale-[0.99]",
      )}
      title={isClickable ? item.actionHint || "Ver detalle" : undefined}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium opacity-90">{item.title}</CardTitle>
        <div className="flex items-center gap-1 opacity-80">
          <item.icon className="h-4 w-4" />
          {isClickable && <ChevronRight className="h-3.5 w-3.5" />}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{item.val}</div>
        <p className="text-xs mt-1 opacity-80 flex items-center">
          {item.trendUp ? (
            <TrendingUp className="h-3 w-3 mr-1 shrink-0" />
          ) : (
            <TrendingDown className="h-3 w-3 mr-1 shrink-0" />
          )}
          {item.sub}
        </p>
      </CardContent>
    </Card>
  );
}

function EmptyChartMessage({ children }) {
  return (
    <p className="text-sm text-slate-500 py-16 text-center">{children}</p>
  );
}

export default function DashboardContent() {
  const [activeTab, setActiveTab] = useState("ventas");
  const [compraModalOpen, setCompraModalOpen] = useState(false);
  const [compraFormData, setCompraFormData] = useState(INITIAL_COMPRA_STATE);
  const [compraSubmitting, setCompraSubmitting] = useState(false);
  const [purchaseLoadingId, setPurchaseLoadingId] = useState(null);
  const [toastConfig, setToastConfig] = useState({
    visible: false,
    title: "",
    message: "",
  });

  const showToast = useCallback((title, message) => {
    setToastConfig({ visible: true, title, message });
    setTimeout(() => {
      setToastConfig((prev) => ({ ...prev, visible: false }));
    }, 5500);
  }, []);

  const {
    ventas,
    inventario,
    cartera,
    logistica,
    loading,
    error,
    lastUpdated,
    periodLabel,
    datePreset,
    setDatePreset,
    customFrom,
    customTo,
    setCustomFrom,
    setCustomTo,
    refresh,
    cn,
  } = useDashboard();

  const ventasKpis = [
    {
      title: "Ventas del Periodo",
      val: formatCurrency(ventas.totalVentas),
      icon: DollarSign,
      color: "from-blue-600 to-blue-700",
      sub: formatTrend(ventas.ventasTrend, "vs periodo anterior"),
      trendUp: ventas.ventasTrend === null || Number(ventas.ventasTrend) >= 0,
      to: "/dashboard/sales",
      actionHint: "Ir al módulo de ventas",
    },
    {
      title: "Pedidos Pendientes",
      val: ventas.pedidosPendientes,
      icon: Package,
      color: "from-orange-500 to-orange-600",
      sub: `${ventas.pedidosEnPeriodo} registrados en el periodo`,
      trendUp: ventas.pedidosPendientes === 0,
      to: "/dashboard/pedidos",
      estado: "proceso",
      actionHint: "Ver pedidos en proceso",
    },
    {
      title: "Clientes Atendidos",
      val: ventas.clientesAtendidos,
      icon: Users,
      color: "from-emerald-500 to-emerald-600",
      sub: formatTrend(ventas.clientesTrend, "vs periodo anterior"),
      trendUp: ventas.clientesTrend === null || Number(ventas.clientesTrend) >= 0,
      to: "/dashboard/customers",
      actionHint: "Ir al listado de clientes",
    },
    {
      title: "Tiempo en Proceso",
      val: `${ventas.tiempoPromedio} días`,
      icon: Truck,
      color: "from-purple-600 to-purple-700",
      sub: `Promedio · ${periodLabel}`,
      trendUp: ventas.tiempoPromedio <= 2,
      to: "/dashboard/pedidos",
      estado: "proceso",
      actionHint: "Revisar pedidos en proceso",
    },
  ];

  const inventarioKpis = [
    {
      title: "Valor Total del Inventario",
      val: formatCurrency(inventario.valorTotalInventario),
      icon: Warehouse,
      color: "from-teal-600 to-teal-700",
      sub: inventario.calculatedFromBackend
        ? "Σ (stock × precio compra) · backend"
        : "Σ (stock × precio compra) · tiempo real",
      trendUp: true,
      to: "/dashboard/productos",
      actionHint: "Ver catálogo de productos",
    },
    {
      title: "Productos Agotados / Críticos",
      val: inventario.productosAgotadosCriticos,
      icon: PackageX,
      color: "from-red-600 to-red-700",
      sub: "Stock = 0 o bajo el mínimo",
      trendUp: inventario.productosAgotadosCriticos === 0,
      to: "/dashboard/productos",
      actionHint: "Revisar productos críticos",
    },
    {
      title: "Merma / Stock Defectuoso",
      val: inventario.mermaStockDefectuoso,
      icon: Trash2,
      color: "from-amber-600 to-amber-700",
      sub: `${inventario.productosActivos} productos activos en catálogo`,
      trendUp: inventario.mermaStockDefectuoso === 0,
      to: "/dashboard/devoluciones",
      actionHint: "Ir a devoluciones e inventario",
    },
  ];

  const carteraKpis = [
    {
      title: "Cartera Total Colocada",
      val: formatCurrency(cartera.carteraTotalColocada),
      icon: CreditCard,
      color: "from-violet-600 to-violet-700",
      sub: cartera.fromBackend
        ? "Σ Cupo_Utilizado · backend"
        : "Σ Cupo_Utilizado · tiempo real",
      trendUp: true,
      to: "/dashboard/creditos",
      actionHint: "Ver cartera de créditos",
    },
    {
      title: "Cupo Disponible Global",
      val: formatCurrency(cartera.cupoDisponibleGlobal),
      icon: Wallet,
      color: "from-emerald-600 to-emerald-700",
      sub: "Capital libre para financiación",
      trendUp: cartera.cupoDisponibleGlobal > 0,
      to: "/dashboard/creditos",
      actionHint: "Ver líneas de crédito",
    },
    {
      title: "Créditos en Alerta / Mora",
      val: cartera.creditosEnAlerta,
      icon: ShieldAlert,
      color: "from-red-600 to-red-700",
      sub: `Mora temprana o suspendidos · ${cartera.totalLineasCredito} líneas`,
      trendUp: cartera.creditosEnAlerta === 0,
      to: "/dashboard/creditos",
      actionHint: "Revisar créditos en mora",
    },
  ];

  const kpiSkeletonCount =
    activeTab === "ventas" ? 4 : activeTab === "logistica" ? 0 : 3;

  const activeKpis =
    activeTab === "ventas"
      ? ventasKpis
      : activeTab === "inventario"
        ? inventarioKpis
        : activeTab === "cartera"
          ? carteraKpis
          : [];

  const kpiGridClass =
    activeTab === "inventario" || activeTab === "cartera"
      ? "grid-cols-1 md:grid-cols-3"
      : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4";

  const handleGeneratePurchase = (product) => {
    setPurchaseLoadingId(product.idProducto);
    setCompraFormData(buildCompraDraftFromProduct(product));
    setCompraModalOpen(true);
    setPurchaseLoadingId(null);
  };

  const handleCompraSubmit = async () => {
    setCompraSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 500));
      const nuevaCompra = await registerCompra(compraFormData);
      setCompraModalOpen(false);
      setCompraFormData(INITIAL_COMPRA_STATE);
      showToast(
        "Orden de compra registrada",
        `Compra #${nuevaCompra.idCompra} creada por ${formatCurrency(nuevaCompra.montoTotal)}. Revise el módulo Compras.`,
      );
      refresh();
    } catch {
      showToast("Error", "No se pudo registrar la orden de compra.");
    } finally {
      setCompraSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <SuccessToast
        {...toastConfig}
        onClose={() => setToastConfig((prev) => ({ ...prev, visible: false }))}
      />
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Dashboard Principal
          </h1>
          <p className="text-slate-500 dark:text-zinc-400">
            Resumen ejecutivo de operaciones MSG Repuestos
            <span className="text-slate-400 dark:text-zinc-500"> · {periodLabel}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-zinc-900 p-2 rounded-xl border border-slate-100 dark:border-zinc-800 shadow-sm">
          <Badge
            className={cn(
              "border-none px-3",
              error
                ? "bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20"
                : "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20",
            )}
          >
            <span
              className={cn(
                "mr-1.5 h-2 w-2 rounded-full animate-pulse",
                error ? "bg-red-500" : "bg-emerald-500",
              )}
            />
            {error ? "Error de datos" : "Sistema Online"}
          </Badge>

          <DashboardDateRangeFilter
            preset={datePreset}
            onPresetChange={setDatePreset}
            customFrom={customFrom}
            customTo={customTo}
            onCustomFromChange={setCustomFrom}
            onCustomToChange={setCustomTo}
            disabled={loading}
            periodLabel={periodLabel}
          />

          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="p-2 rounded-lg text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-50"
            title="Actualizar datos"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </button>

          <div className="text-right border-l pl-4 border-slate-100 dark:border-zinc-800 min-w-[90px]">
            <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500">
              Actualizado
            </p>
            <div className="text-sm font-medium text-slate-700 dark:text-zinc-300 min-h-[20px]">
              {loading ? (
                <Skeleton className="inline-block h-4 w-16 align-middle" />
              ) : (
                lastUpdated
              )}
            </div>
          </div>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="bg-slate-100 dark:bg-zinc-800 p-1 h-auto text-slate-600 dark:text-zinc-400">
          <TabsTrigger
            value="ventas"
            className="data-[state=active]:bg-white data-[state=active]:dark:bg-zinc-900 data-[state=active]:shadow-sm px-6 py-2 data-[state=active]:text-slate-900 data-[state=active]:dark:text-white"
          >
            Ventas
          </TabsTrigger>
          <TabsTrigger
            value="inventario"
            className="data-[state=active]:bg-white data-[state=active]:dark:bg-zinc-900 data-[state=active]:shadow-sm px-6 py-2 data-[state=active]:text-slate-900 data-[state=active]:dark:text-white"
          >
            Inventario
          </TabsTrigger>
          <TabsTrigger
            value="cartera"
            className="data-[state=active]:bg-white data-[state=active]:dark:bg-zinc-900 data-[state=active]:shadow-sm px-6 py-2 data-[state=active]:text-slate-900 data-[state=active]:dark:text-white"
          >
            Créditos y Cartera
          </TabsTrigger>
          <TabsTrigger
            value="logistica"
            className="data-[state=active]:bg-white data-[state=active]:dark:bg-zinc-900 data-[state=active]:shadow-sm px-6 py-2 data-[state=active]:text-slate-900 data-[state=active]:dark:text-white"
          >
            Rutas y Logística
          </TabsTrigger>
        </TabsList>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <>
            {kpiSkeletonCount > 0 && (
              <KpiGridSkeleton count={kpiSkeletonCount} className={kpiGridClass} />
            )}
            {activeTab === "ventas" && <DashboardVentasSkeleton />}
            {activeTab === "inventario" && <DashboardInventarioSkeleton />}
            {activeTab === "cartera" && <DashboardCarteraSkeleton />}
            {activeTab === "logistica" && <DashboardLogisticaSkeleton />}
          </>
        ) : (
          <>
        {activeKpis.length > 0 && (
          <div
            key={`kpis-${activeTab}-${periodLabel}`}
            className={cn("grid gap-6 transition-opacity duration-300", kpiGridClass)}
          >
            {activeKpis.map((item, i) => (
              <KpiCard key={`${activeTab}-kpi-${i}`} item={item} cn={cn} />
            ))}
          </div>
        )}

        {activeTab === "ventas" && (
          <div
            key="ventas-charts"
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-300"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ventas por Categoría</CardTitle>
              </CardHeader>
              <CardContent>
                {ventas.ventasPorCategoria.length === 0 ? (
                  <EmptyChartMessage>
                    No hay ventas en {periodLabel.toLowerCase()} para este gráfico.
                  </EmptyChartMessage>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={ventas.ventasPorCategoria}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={document.documentElement.classList.contains("dark") ? "rgba(255,255,255,0.05)" : "#f1f5f9"} />
                      <XAxis dataKey="categoria" axisLine={false} tickLine={false} className="fill-slate-400 dark:fill-zinc-500" tick={{ fontSize: 11, fill: "currentColor" }} />
                      <YAxis axisLine={false} tickLine={false} className="fill-slate-500 dark:fill-zinc-400" tick={{ fontSize: 11, fill: "currentColor" }} />
                      <Tooltip
                        content={(props) => (
                          <CurrencyChartTooltip
                            {...props}
                            labelKey="categoria"
                            valueLabel="Ventas facturadas"
                          />
                        )}
                        cursor={{ fill: document.documentElement.classList.contains("dark") ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.02)" }}
                      />
                      <Bar
                        dataKey="ventas"
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                        barSize={40}
                        cursor="pointer"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Marcas con Mayor Rotación</CardTitle>
              </CardHeader>
              <CardContent>
                {ventas.marcasPopulares.length === 0 ? (
                  <EmptyChartMessage>
                    No hay rotación de marcas registrada en el periodo.
                  </EmptyChartMessage>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={ventas.marcasPopulares}
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="porcentaje"
                        nameKey="marca"
                      >
                        {ventas.marcasPopulares.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip content={(props) => <PercentChartTooltip {...props} />} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <VentasTendenciaChart
              data={ventas.tendenciaTemporal}
              periodLabel={periodLabel}
              isMonthlyBuckets={ventas.isMonthlyBuckets}
            />

            <VentasTopClientes
              data={ventas.topClientes}
              periodLabel={periodLabel}
            />
          </div>
        )}

        {activeTab === "inventario" && (
          <div
            key="inventario-charts"
            className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-in fade-in duration-300"
          >
            <InventarioTopStockChart data={inventario.topMayorStock} />
            <InventarioRestockAlerts
              items={inventario.alertasReabastecimiento}
              onGeneratePurchase={handleGeneratePurchase}
              purchaseLoadingId={purchaseLoadingId}
              isAdmin={isComprasAdmin()}
            />
          </div>
        )}

        {activeTab === "cartera" && (
          <div
            key="cartera-charts"
            className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-in fade-in duration-300"
          >
            <CarteraTopDeudaChart data={cartera.topDeudaClientes} />
            <CarteraEstadoDonut
              data={cartera.distribucionEstado}
              totalLineas={cartera.totalLineasCredito}
            />
          </div>
        )}

        {activeTab === "logistica" && (
          <div
            key="logistica-charts"
            className="space-y-6 animate-in fade-in duration-300"
          >
            <LogisticaEfectividadDonut
              distribucion={logistica.distribucion}
              resumenComparativo={logistica.resumenComparativo}
              totalVisitas={logistica.totalVisitas}
              efectividadPct={logistica.efectividadPct}
              visitasExitosas={logistica.visitasExitosas}
              visitasImprevistas={logistica.visitasImprevistas}
              periodLabel={periodLabel}
            />

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <LogisticaVentasPorZonaChart
                data={logistica.ventasPorZona}
                periodLabel={periodLabel}
              />
              <LogisticaVendedorTable
                data={logistica.rendimientoVendedores}
                periodLabel={periodLabel}
              />
            </div>
          </div>
        )}
          </>
        )}
      </Tabs>

      <CompraCreateModal
        isOpen={compraModalOpen}
        onClose={() => {
          setCompraModalOpen(false);
          setCompraFormData(INITIAL_COMPRA_STATE);
        }}
        formData={compraFormData}
        setFormData={setCompraFormData}
        onSubmit={handleCompraSubmit}
        loading={compraSubmitting}
      />
    </div>
  );
}
