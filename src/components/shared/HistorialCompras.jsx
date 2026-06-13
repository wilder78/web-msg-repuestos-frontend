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
  AlertCircle 
} from "lucide-react";

const HistorialCompras = ({ idCliente }) => {
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCompra, setExpandedCompra] = useState(null);

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
      <div className="flex flex-col items-center justify-center py-16 px-4 bg-slate-50 border border-slate-200 border-dashed rounded-2xl text-slate-500 gap-3" id="historial-empty">
        <ShoppingBag className="h-10 w-10 text-slate-400" />
        <div className="text-center">
          <p className="text-base font-semibold text-slate-700">Sin compras registradas</p>
          <p className="text-xs text-slate-400 mt-1">Este cliente aún no ha realizado compras o pedidos en el sistema.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4" id="historial-compras-container">
      <h3 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
        <ShoppingBag className="h-5 w-5 text-slate-600" />
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
              className="bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
            >
              {/* Encabezado de la Compra */}
              <div 
                onClick={() => toggleExpand(compra.idPedido)}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors select-none"
                id={`compra-header-${compra.idPedido}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl shrink-0 ${hasVenta ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                    <Package className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-800 text-base">
                        Pedido #{compra.idPedido}
                      </span>
                      {compra.idVenta && (
                        <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                          Facturado #{compra.idVenta}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center text-xs text-slate-500 gap-y-1 mt-1">
                      <span className="flex items-center gap-1 mr-3">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(compra.fecha)}
                      </span>
                      <span className="flex items-center gap-1">
                        <CreditCard className="h-3.5 w-3.5" />
                        {compra.tipoPago}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-5 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                  <div className="text-left md:text-right">
                    <p className="text-xs text-slate-400 font-medium">Total de Compra</p>
                    <p className="font-extrabold text-slate-900 text-lg flex items-center">
                      <DollarSign className="h-4.5 w-4.5 text-slate-500 -mr-1" />
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
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
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
                className={`transition-all duration-300 ease-in-out border-t border-slate-100 bg-slate-50/30 ${
                  isExpanded ? "max-h-[1000px] opacity-100 py-4 px-5" : "max-h-0 opacity-0 pointer-events-none"
                } overflow-hidden`}
                id={`compra-details-${compra.idPedido}`}
              >
                <div className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-3">
                  Detalle de Repuestos / Productos ({compra.productos.length})
                </div>
                
                <div className="border border-slate-100 rounded-xl bg-white shadow-inner overflow-hidden">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-semibold text-xs border-b border-slate-100">
                        <th className="px-4 py-3">Repuesto</th>
                        <th className="px-4 py-3 text-center">Referencia</th>
                        <th className="px-4 py-3 text-center">Cantidad</th>
                        <th className="px-4 py-3 text-right">Precio Unit.</th>
                        <th className="px-4 py-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {compra.productos.map((prod) => (
                        <tr 
                          key={prod.idDetallePedido} 
                          className="hover:bg-slate-50/45 transition-colors"
                        >
                          <td className="px-4 py-3 font-semibold text-slate-700">
                            {prod.productoNombre}
                          </td>
                          <td className="px-4 py-3 text-center text-slate-500 font-mono text-xs">
                            {prod.productoReferencia || "N/A"}
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-slate-800">
                            {prod.cantidad}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600">
                            {formatCurrency(prod.precioVenta)}
                          </td>
                          <td className="px-4 py-3 text-right font-extrabold text-slate-900">
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
    </div>
  );
};

export default HistorialCompras;
