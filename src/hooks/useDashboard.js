import { useState, useEffect, useCallback, useMemo } from "react";
import {
  DATE_PRESETS,
  buildDateQuery,
  resolveDateRange,
  getPreviousPeriod,
  formatPeriodLabel,
  isWithinRange,
  toDateParam,
} from "../lib/dashboard-date-range";
import {
  computeInventoryMetricsFromProducts,
  mergeBackendInventorySummary,
  getProductStock,
  isProductActive,
} from "../lib/inventory-metrics";
import {
  getSaleTotal,
  getSaleDate,
  buildTendenciaTemporal,
  buildTopClientes,
  normalizeBackendTopClientes,
} from "../lib/ventas-metrics";
import {
  computeCarteraMetrics,
  mergeBackendCarteraSummary,
} from "../lib/creditos-metrics";
import { computeLogisticaView } from "../lib/logistica-metrics";

const API_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
const TOP_CUSTOMERS_URL = "http://127.0.0.1:8080/api/sales/top-customers";

const getAuthToken = () =>
  localStorage.getItem("token") || sessionStorage.getItem("token") || null;

const authFetch = (path, options = {}) => {
  const token = getAuthToken();
  const url = path.startsWith("http")
    ? path
    : `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;

  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
};

const extractList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  for (const key of [
    "data",
    "content",
    "sales",
    "ventas",
    "orders",
    "pedidos",
    "products",
    "productos",
    "categories",
    "categorias",
    "returns",
    "devoluciones",
    "customers",
    "clientes",
    "credits",
    "creditos",
    "rutas",
    "routes",
    "zonas",
    "zones",
    "employees",
    "empleados",
    "rows",
    "items",
    "results",
  ]) {
    const value = payload[key];
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object") {
      const nested = extractList(value);
      if (nested.length > 0) return nested;
    }
  }

  return [];
};

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const startOfDay = (date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const daysBetween = (from, to) => {
  const ms = startOfDay(to) - startOfDay(from);
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
};

const getOrderStatus = (order) =>
  Number(order.idEstado ?? order.id_estado_pedido ?? 1);

const getOrderDate = (order) =>
  parseDate(
    order.fechaPedido ?? order.fecha_pedido ?? order.fecha ?? order.fechaCreacion,
  );

const getReturnDate = (item) =>
  parseDate(
    item.fechaDevolucion ??
      item.fecha_devolucion ??
      item.fechaCreacion ??
      item.fecha ??
      item.createdAt,
  );

const BRAND_COLORS = ["#dc2626", "#2563eb", "#16a34a", "#ea580c", "#7c3aed", "#6b7280"];

const extractInventorySummaryPayload = (payload) => {
  if (!payload || typeof payload !== "object") return null;
  return payload.data ?? payload.summary ?? payload;
};

const buildTopCustomersQuery = ({ from, to }) => {
  const params = new URLSearchParams({
    fechaDesde: toDateParam(from),
    fechaHasta: toDateParam(to),
  });
  return params.toString();
};

const fetchTopClientesFromBackend = async (range) => {
  try {
    const res = await authFetch(`${TOP_CUSTOMERS_URL}?${buildTopCustomersQuery(range)}`);
    if (!res.ok) return null;

    const list = extractList(await res.json());
    return list.length > 0 ? normalizeBackendTopClientes(list) : null;
  } catch {
    return null;
  }
};

const fetchInventorySummaryFromBackend = async () => {
  const paths = [
    "/products/inventory-summary",
    "/inventory/summary",
    "/products/inventory",
  ];

  for (const path of paths) {
    try {
      const res = await authFetch(path);
      if (!res.ok) continue;
      const body = await res.json();
      const summary = extractInventorySummaryPayload(body);
      if (summary && typeof summary === "object") return summary;
    } catch {
      // Intentar siguiente endpoint
    }
  }

  return null;
};

const filterByRange = (items, getDateFn, range) =>
  items.filter((item) => {
    const date = getDateFn(item);
    return isWithinRange(date, range.from, range.to);
  });

const aggregateSaleDetails = (sales, categoryMap) => {
  const salesByCategory = {};
  const unitsByCategory = {};
  const salesByBrand = {};
  let unitsSold = 0;

  sales.forEach((sale) => {
    const detalles =
      sale.pedido?.detalles ??
      sale.detalles ??
      sale.detalleVentas ??
      sale.detalle_ventas ??
      [];

    detalles.forEach((detalle) => {
      const producto = detalle.producto || {};
      const cantidad = Number(detalle.cantidad ?? detalle.cantidad_solicitada ?? 1);
      unitsSold += cantidad;

      const precio = Number(
        detalle.precio_unitario ??
          detalle.precio_venta ??
          detalle.precioVenta ??
          producto.precio_compra ??
          0,
      );
      const lineTotal = Number(
        detalle.subtotal_linea ?? detalle.subtotal ?? cantidad * precio,
      );

      const catId =
        producto.idCategoria ??
        producto.id_categoria ??
        detalle.id_categoria ??
        detalle.idCategoria;
      const catName =
        categoryMap[catId] || producto.categoria?.nombre || "Sin categoría";
      salesByCategory[catName] = (salesByCategory[catName] || 0) + lineTotal;
      unitsByCategory[catName] = (unitsByCategory[catName] || 0) + cantidad;

      const marca = (producto.marca || detalle.marca || "Sin marca").trim() || "Sin marca";
      salesByBrand[marca] = (salesByBrand[marca] || 0) + cantidad;
    });
  });

  return { salesByCategory, unitsByCategory, salesByBrand, unitsSold };
};

const buildMarcasPopulares = (salesByBrand, products) => {
  let brandSource = { ...salesByBrand };
  if (Object.keys(brandSource).length === 0) {
    products.forEach((product) => {
      if (!isProductActive(product)) return;
      const marca = (product.marca || "Sin marca").trim() || "Sin marca";
      brandSource[marca] = (brandSource[marca] || 0) + getProductStock(product);
    });
  }

  const brandTotal = Object.values(brandSource).reduce((sum, qty) => sum + qty, 0);
  if (brandTotal === 0) return [];

  return Object.entries(brandSource)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([marca, qty], index) => ({
      marca,
      porcentaje: Math.round((qty / brandTotal) * 100),
      color: BRAND_COLORS[index % BRAND_COLORS.length],
    }));
};

const computeVentasView = ({
  sales,
  orders,
  products,
  customers,
  categoryMap,
  range,
  previousRange,
  topClientesBackend,
}) => {
  const salesInRange = filterByRange(sales, getSaleDate, range);
  const salesPrevRange = filterByRange(sales, getSaleDate, previousRange);
  const ordersInRange = filterByRange(orders, getOrderDate, range);

  const totalVentas = salesInRange.reduce((sum, sale) => sum + getSaleTotal(sale), 0);
  const totalVentasPrev = salesPrevRange.reduce(
    (sum, sale) => sum + getSaleTotal(sale),
    0,
  );

  const clientsInRange = new Set();
  const clientsPrevRange = new Set();

  salesInRange.forEach((sale) => {
    const clientId =
      sale.pedido?.id_cliente ??
      sale.id_cliente ??
      sale.idCliente ??
      sale.cliente?.idCliente ??
      sale.cliente?.id_cliente;
    if (clientId) clientsInRange.add(String(clientId));
  });

  salesPrevRange.forEach((sale) => {
    const clientId =
      sale.pedido?.id_cliente ??
      sale.id_cliente ??
      sale.idCliente ??
      sale.cliente?.idCliente ??
      sale.cliente?.id_cliente;
    if (clientId) clientsPrevRange.add(String(clientId));
  });

  // Pedidos pendientes: todos los pedidos en estado "En Proceso" (id=1)
  // sin acotar al rango de fechas — refleja la carga de trabajo actual real.
  const pedidosPendientes = orders.filter(
    (order) => getOrderStatus(order) === 1,
  ).length;

  const procesoAges = ordersInRange
    .filter((order) => getOrderStatus(order) === 1)
    .map((order) => {
      const orderDate = getOrderDate(order);
      return orderDate ? daysBetween(orderDate, range.to) : 0;
    });

  const tiempoPromedio =
    procesoAges.length > 0
      ? Number((procesoAges.reduce((a, b) => a + b, 0) / procesoAges.length).toFixed(1))
      : 0;

  const { salesByCategory, salesByBrand } = aggregateSaleDetails(
    salesInRange,
    categoryMap,
  );

  const ventasPorCategoria = Object.entries(salesByCategory)
    .map(([categoria, ventas]) => ({ categoria, ventas: Math.round(ventas) }))
    .sort((a, b) => b.ventas - a.ventas)
    .slice(0, 8);

  const ventasTrend =
    totalVentasPrev > 0
      ? (((totalVentas - totalVentasPrev) / totalVentasPrev) * 100).toFixed(1)
      : null;

  const clientesTrend =
    clientsPrevRange.size > 0
      ? (
          ((clientsInRange.size - clientsPrevRange.size) / clientsPrevRange.size) *
          100
        ).toFixed(1)
      : null;

  const tendenciaTemporal = buildTendenciaTemporal(salesInRange, range);
  const daySpan =
    Math.ceil((startOfDay(range.to) - startOfDay(range.from)) / (1000 * 60 * 60 * 24)) + 1;
  const isMonthlyBuckets = daySpan > 62;

  const topClientesComputed = buildTopClientes(salesInRange, customers, orders);
  const topClientes =
    topClientesComputed.length > 0
      ? topClientesComputed
      : topClientesBackend ?? [];

  return {
    totalVentas,
    pedidosEnPeriodo: ordersInRange.length,
    pedidosPendientes,
    clientesAtendidos: clientsInRange.size,
    tiempoPromedio,
    promedioDiasProceso: tiempoPromedio,
    ventasPorCategoria,
    marcasPopulares: buildMarcasPopulares(salesByBrand, products),
    tendenciaTemporal,
    isMonthlyBuckets,
    topClientes,
    topClientesFromBackend:
      topClientesComputed.length === 0 && Boolean(topClientesBackend?.length),
    ventasTrend,
    clientesTrend,
  };
};

const fetchCarteraSummaryFromBackend = async () => {
  const paths = [
    "/credits/portfolio-summary",
    "/credits/cartera-summary",
    "/dashboard/cartera/summary",
  ];

  for (const path of paths) {
    try {
      const res = await authFetch(path);
      if (!res.ok) continue;
      const body = await res.json();
      const summary = body?.data ?? body?.summary ?? body;
      if (summary && typeof summary === "object") return summary;
    } catch {
      // siguiente endpoint
    }
  }

  return null;
};

const computeCarteraView = ({ credits, customers, carteraSummaryBackend }) => {
  const computed = computeCarteraMetrics(credits, customers);
  const merged = mergeBackendCarteraSummary(computed, carteraSummaryBackend);

  return {
    carteraTotalColocada: merged.carteraTotalColocada,
    cupoDisponibleGlobal: merged.cupoDisponibleGlobal,
    creditosEnAlerta: merged.creditosEnAlerta,
    totalLineasCredito: merged.totalLineasCredito,
    distribucionEstado: merged.distribucionEstado,
    topDeudaClientes: merged.topDeudaClientes,
    fromBackend: Boolean(merged.fromBackend),
  };
};

const computeInventarioView = ({ products, inventorySummary }) => {
  const computed = computeInventoryMetricsFromProducts(products);
  const merged = mergeBackendInventorySummary(computed, inventorySummary);

  return {
    valorTotalInventario: merged.valorTotalInventario,
    productosAgotadosCriticos: merged.productosAgotadosCriticos,
    mermaStockDefectuoso: merged.mermaStockDefectuoso,
    topMayorStock: merged.topMayorStock,
    alertasReabastecimiento: merged.alertasReabastecimiento,
    productosActivos: merged.productosActivos,
    calculatedFromBackend: Boolean(merged.fromBackend),
  };
};

export function useDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [datePreset, setDatePreset] = useState(DATE_PRESETS.TODAY);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [rawData, setRawData] = useState({
    sales: [],
    orders: [],
    products: [],
    returns: [],
    categoryMap: {},
    inventorySummary: null,
    customers: [],
    topClientesBackend: null,
    credits: [],
    carteraSummaryBackend: null,
    routes: [],
    zones: [],
    employees: [],
  });

  const dateRange = useMemo(
    () => resolveDateRange(datePreset, customFrom, customTo),
    [datePreset, customFrom, customTo],
  );

  const previousRange = useMemo(
    () => getPreviousPeriod(dateRange),
    [dateRange],
  );

  const periodLabel = useMemo(
    () => formatPeriodLabel(datePreset, dateRange),
    [datePreset, dateRange],
  );

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (!getAuthToken()) {
        throw new Error("Inicia sesión para ver el resumen del dashboard.");
      }

      const range = resolveDateRange(datePreset, customFrom, customTo);
      const query = buildDateQuery(range.from, range.to);
      const withQuery = (path) => `${path}${path.includes("?") ? "&" : "?"}${query}`;

      const [
        resSales,
        resOrders,
        resProducts,
        resCategories,
        resReturns,
        resCustomers,
        resCredits,
        resRoutes,
        resZones,
        resEmployees,
      ] = await Promise.all([
        authFetch(withQuery("/sales")),
        authFetch(withQuery("/orders")),
        authFetch("/products"),
        authFetch("/categories"),
        authFetch(withQuery("/returns")),
        authFetch("/customers"),
        authFetch("/credits"),
        authFetch(withQuery("/rutas")),
        authFetch("/zonas"),
        authFetch("/employees"),
      ]);

      if (!resSales.ok && !resOrders.ok && !resProducts.ok) {
        throw new Error("No se pudieron cargar los datos del dashboard.");
      }

      const sales = resSales.ok ? extractList(await resSales.json()) : [];
      let orders = resOrders.ok ? extractList(await resOrders.json()) : [];

      if (orders.length === 0) {
        const resPedidos = await authFetch(withQuery("/pedidos"));
        if (resPedidos.ok) {
          orders = extractList(await resPedidos.json());
        }
      }

      const products = resProducts.ok ? extractList(await resProducts.json()) : [];
      const categories = resCategories.ok ? extractList(await resCategories.json()) : [];
      const returns = resReturns.ok ? extractList(await resReturns.json()) : [];
      const customers = resCustomers.ok ? extractList(await resCustomers.json()) : [];
      const credits = resCredits.ok ? extractList(await resCredits.json()) : [];
      const routes = resRoutes.ok ? extractList(await resRoutes.json()) : [];
      const zones = resZones.ok ? extractList(await resZones.json()) : [];
      const employees = resEmployees.ok ? extractList(await resEmployees.json()) : [];
      const [inventorySummary, topClientesBackend, carteraSummaryBackend] = await Promise.all([
        fetchInventorySummaryFromBackend(),
        fetchTopClientesFromBackend(range),
        fetchCarteraSummaryFromBackend(),
      ]);

      const categoryMap = {};
      categories.forEach((cat) => {
        const id = cat.idCategoria ?? cat.id_categoria;
        if (id) {
          categoryMap[id] = cat.nombreCategoria ?? cat.nombre_categoria ?? cat.nombre;
        }
      });

      setRawData({
        sales,
        orders,
        products,
        returns,
        customers,
        categoryMap,
        inventorySummary,
        topClientesBackend,
        credits,
        carteraSummaryBackend,
        routes,
        zones,
        employees,
      });
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message || "Error al cargar el dashboard.");
    } finally {
      setLoading(false);
    }
  }, [datePreset, customFrom, customTo]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const ventas = useMemo(
    () =>
      computeVentasView({
        ...rawData,
        range: dateRange,
        previousRange,
      }),
    [rawData, dateRange, previousRange],
  );

  const inventario = useMemo(
    () =>
      computeInventarioView({
        products: rawData.products,
        inventorySummary: rawData.inventorySummary,
      }),
    [rawData.products, rawData.inventorySummary],
  );

  const cartera = useMemo(
    () =>
      computeCarteraView({
        credits: rawData.credits,
        customers: rawData.customers,
        carteraSummaryBackend: rawData.carteraSummaryBackend,
      }),
    [rawData.credits, rawData.customers, rawData.carteraSummaryBackend],
  );

  const logistica = useMemo(
    () =>
      computeLogisticaView({
        routes: rawData.routes,
        sales: rawData.sales,
        orders: rawData.orders,
        customers: rawData.customers,
        zones: rawData.zones,
        employees: rawData.employees,
        range: dateRange,
      }),
    [
      rawData.routes,
      rawData.sales,
      rawData.orders,
      rawData.customers,
      rawData.zones,
      rawData.employees,
      dateRange,
    ],
  );

  const cn = (...classes) => classes.filter(Boolean).join(" ");

  const formattedLastUpdated = useMemo(() => {
    if (!lastUpdated) return "—";
    return lastUpdated.toLocaleString("es-CO", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [lastUpdated]);

  const handlePresetChange = (preset) => {
    setDatePreset(preset);
    if (preset === DATE_PRESETS.CUSTOM && !customFrom && !customTo) {
      const today = new Date();
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      setCustomFrom(
        `${weekAgo.getFullYear()}-${String(weekAgo.getMonth() + 1).padStart(2, "0")}-${String(weekAgo.getDate()).padStart(2, "0")}`,
      );
      setCustomTo(
        `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`,
      );
    }
  };

  return {
    ventas,
    inventario,
    cartera,
    logistica,
    loading,
    error,
    lastUpdated: formattedLastUpdated,
    periodLabel,
    datePreset,
    setDatePreset: handlePresetChange,
    customFrom,
    customTo,
    setCustomFrom,
    setCustomTo,
    refresh: fetchDashboardData,
    cn,
  };
}
