import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import { 
  Calendar, 
  DollarSign, 
  CreditCard, 
  ChevronDown, 
  ChevronUp, 
  Package, 
  ShoppingBag, 
  Loader2, 
  AlertCircle,
  Printer
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import PrintableDocument from "./PrintableDocument";

const mapPrintableItems = (productos) => {
  if (!Array.isArray(productos) || productos.length === 0) return [];
  return productos.map((prod) => ({
    codigo: prod.productoReferencia || "—",
    descripcion: prod.productoNombre || "Repuesto",
    cantidad: prod.cantidad || 1,
    precioUnitario: prod.precioVenta || 0,
    subtotal: prod.subtotal || 0,
    descuento: 0,
    total: prod.subtotal || 0
  }));
};

const HistorialCompras = ({ idCliente, customer }) => {
  const { user } = useAuth();
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCompra, setExpandedCompra] = useState(null);
  const [printOrder, setPrintOrder] = useState(null);

  const handlePrintOrder = (compra) => {
    setPrintOrder(compra);
    window.setTimeout(() => window.print(), 100);
  };

  useEffect(() => {
    const fetchHistorial = async () => {
      if (!idCliente) return;
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(`/customers/${idCliente}/historial-compras`);
        if (response.data?.status === "success") {
          setCompras(response.data.data || []);
        } else {
          throw new Error("No se pudo obtener el historial.");
        }
      } catch (err) {
        console.error("Error cargando historial de compras:", err);
        setError(err.response?.data?.message || err.message || "Error al conectar con el servidor.");
      } finally {
        setLoading(false);
      }
    };

    fetchHistorial();
  }, [idCliente]);

  const toggleExpand = (idPedido) => {
    setExpandedCompra((prev) => (prev === idPedido ? null : idPedido));
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0
    }).format(val);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-CO", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-500 gap-3" id="historial-loading">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <p className="text-sm font-medium">Cargando historial de compras...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl shadow-sm my-4" id="historial-error">
        <AlertCircle className="h-5 w-5 shrink-0" />
        <div>
          <h4 className="font-semibold text-sm">Error al cargar datos</h4>
          <p className="text-xs mt-0.5">{error}</p>
        </div>
      </div>
    );
  }

  if (compras.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 border-dashed rounded-2xl text-slate-500 dark:text-zinc-400 gap-3" id="historial-empty">
        <ShoppingBag className="h-10 w-10 text-slate-400 dark:text-zinc-500" />
        <div className="text-center">
          <p className="text-base font-semibold text-slate-700 dark:text-zinc-300">Sin compras registradas</p>
          <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">Este cliente aún no ha realizado compras o pedidos en el sistema.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4" id="historial-compras-container">
      <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-100 tracking-tight flex items-center gap-2">
        <ShoppingBag className="h-5 w-5 text-slate-600 dark:text-zinc-400" />
        Historial de Pedidos y Compras
      </h3>
      
      <div className="space-y-3">
        {compras.map((compra) => {
          const isExpanded = expandedCompra === compra.idPedido;
          const hasVenta = !!compra.idVenta;
          
          return (
            <div 
              key={compra.idPedido}
              id={`compra-${compra.idPedido}`}
              className="bg-white dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800/80 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
            >
              {/* Encabezado de la Compra */}
              <div 
                onClick={() => toggleExpand(compra.idPedido)}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-zinc-800/40 transition-colors select-none"
                id={`compra-header-${compra.idPedido}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl shrink-0 ${
                    hasVenta 
                      ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400' 
                      : 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400'
                  }`}>
                    <Package className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-800 dark:text-zinc-100 text-base">
                        Pedido #{compra.idPedido}
                      </span>
                      {compra.idVenta && (
                        <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 rounded-full">
                          Facturado #{compra.idVenta}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center text-xs text-slate-500 dark:text-zinc-400 gap-y-1 mt-1 font-medium">
                      <span className="flex items-center gap-1 mr-3">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {formatDate(compra.fecha)}
                      </span>
                      <span className="flex items-center gap-1">
                        <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                        {compra.tipoPago}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-5 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-zinc-800">
                  <div className="text-left md:text-right">
                    <p className="text-xs text-slate-400 dark:text-zinc-500 font-medium">Total de Compra</p>
                    <p className="font-extrabold text-slate-900 dark:text-zinc-100 text-lg flex items-center">
                      {formatCurrency(compra.total)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span 
                      className="text-xs font-bold px-3 py-1 rounded-full shadow-sm"
                      style={{ 
                        backgroundColor: `${compra.estadoColor}15`, 
                        color: compra.estadoColor,
                        border: `1px solid ${compra.estadoColor}30`
                      }}
                    >
                      {compra.estadoPedido}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrintOrder(compra);
                      }}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 dark:text-zinc-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                      title="Imprimir Pedido"
                    >
                      <Printer className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-850 text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors"
                      id={`compra-toggle-btn-${compra.idPedido}`}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Detalle de Productos Expandido */}
              <div 
                className={`transition-all duration-300 ease-in-out border-t border-slate-100 dark:border-zinc-800 bg-slate-50/30 dark:bg-zinc-900/10 ${
                  isExpanded ? "max-h-[1000px] opacity-100 py-4 px-5" : "max-h-0 opacity-0 pointer-events-none"
                } overflow-hidden`}
                id={`compra-details-${compra.idPedido}`}
              >
                <div className="text-xs font-bold text-slate-400 dark:text-zinc-500 tracking-wider uppercase mb-3">
                  Detalle de Repuestos / Productos ({compra.productos.length})
                </div>
                
                <div className="border border-slate-100 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900/50 shadow-inner overflow-hidden">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-zinc-900/80 text-slate-500 dark:text-zinc-400 font-semibold text-xs border-b border-slate-100 dark:border-zinc-800">
                        <th className="px-4 py-3">Repuesto</th>
                        <th className="px-4 py-3 text-center">Referencia</th>
                        <th className="px-4 py-3 text-center">Cantidad</th>
                        <th className="px-4 py-3 text-right">Precio Unit.</th>
                        <th className="px-4 py-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                      {compra.productos.map((prod) => (
                        <tr 
                          key={prod.idDetallePedido} 
                          className="hover:bg-slate-50/45 dark:hover:bg-zinc-800/40 transition-colors"
                        >
                          <td className="px-4 py-3 font-semibold text-slate-700 dark:text-zinc-300">
                            {prod.productoNombre}
                          </td>
                          <td className="px-4 py-3 text-center text-slate-500 dark:text-zinc-400 font-mono text-xs font-medium">
                            {prod.productoReferencia || "N/A"}
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-slate-800 dark:text-zinc-200">
                            {prod.cantidad}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600 dark:text-zinc-400">
                            {formatCurrency(prod.precioVenta)}
                          </td>
                          <td className="px-4 py-3 text-right font-extrabold text-slate-900 dark:text-zinc-100">
                            {formatCurrency(prod.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {printOrder && (
        <PrintableDocument
          title="Comprobante de Pedido"
          folio={`PED-${String(printOrder.idPedido).padStart(4, "0")}`}
          date={
            printOrder.fecha
              ? new Date(printOrder.fecha).toLocaleDateString("es-CO")
              : new Date().toLocaleDateString("es-CO")
          }
          client={{
            name: customer?.razonSocial || "Cliente",
            id: customer?.numeroDocumento || "N/A",
            docType: customer?.tipoCliente || "NIT/CC",
            address: customer?.direccion || "",
            phone: customer?.telefono || "",
            email: customer?.email || ""
          }}
          concept={`Detalle del pedido #${printOrder.idPedido}`}
          items={mapPrintableItems(printOrder.productos)}
          totals={{
            subtotalSinDescuento: printOrder.productos.reduce((acc, item) => acc + Number(item.subtotal || 0), 0),
            descuentoTotal: 0,
            subtotalConDescuento: printOrder.productos.reduce((acc, item) => acc + Number(item.subtotal || 0), 0),
            ivaTotal: 0,
            total: Number(printOrder.total || 0)
          }}
          footerNote="Documento generado como soporte institucional del pedido solicitado por el cliente."
          type="sale"
          printedBy={user?.nombreUsuario || user?.email || "Administrador"}
        />
      )}
    </div>
  );
};

export default HistorialCompras;
