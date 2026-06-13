import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import HistorialCompras from "../../components/shared/HistorialCompras";
import { Users, Search, ShoppingBag } from "lucide-react";

const ReporteHistorialCompras = () => {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await api.get("/customers");
        // Check if response has data.data or similar
        const data = response.data?.data || response.data || [];
        setCustomers(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error al obtener lista de clientes:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter((customer) => {
    const term = searchTerm.toLowerCase();
    const doc = (customer.numeroDocumento || customer.numero_documento || "").toLowerCase();
    const name = (customer.razonSocial || customer.razon_social || "").toLowerCase();
    return doc.includes(term) || name.includes(term);
  });

  return (
    <div className="container mx-auto p-6 space-y-6" id="reporte-historial-compras-view">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-zinc-100 flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-emerald-600" />
            Reporte de Historial de Compras
          </h1>
          <p className="text-slate-500 dark:text-zinc-400 text-sm mt-1">
            Consulta y exporta el registro de compras, pedidos y detalles de repuestos de cada cliente.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel de Selección de Cliente */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 p-5 rounded-2xl shadow-sm h-fit">
          <h2 className="text-sm font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Users className="h-4.5 w-4.5 text-slate-500" />
            Seleccionar Cliente
          </h2>

          <div className="space-y-4">
            {/* Buscador */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o doc..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                id="cliente-search-input"
              />
            </div>

            {/* Listado de Clientes */}
            {loading ? (
              <p className="text-center text-xs text-slate-400 py-6">Cargando clientes...</p>
            ) : filteredCustomers.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-6">No se encontraron clientes.</p>
            ) : (
              <div 
                className="max-h-[350px] overflow-y-auto space-y-1.5 pr-1"
                id="clientes-list-container"
              >
                {filteredCustomers.map((customer) => {
                  const id = customer.idCliente || customer.id_cliente;
                  const name = customer.razonSocial || customer.razon_social;
                  const doc = customer.numeroDocumento || customer.numero_documento;
                  const isSelected = String(selectedCustomerId) === String(id);

                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setSelectedCustomerId(id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all text-xs flex flex-col gap-0.5 ${
                        isSelected
                          ? "bg-emerald-50/75 border-emerald-300 dark:bg-emerald-950/20 dark:border-emerald-800 text-emerald-900 dark:text-emerald-400 shadow-sm"
                          : "border-slate-100 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/40 text-slate-700 dark:text-zinc-300"
                      }`}
                      id={`btn-select-cliente-${id}`}
                    >
                      <span className="font-bold truncate text-sm">
                        {name}
                      </span>
                      <span className={`font-medium ${isSelected ? 'text-emerald-700 dark:text-emerald-500' : 'text-slate-400'}`}>
                        Documento: {doc}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Panel de Visualización del Historial */}
        <div className="lg:col-span-2">
          {selectedCustomerId ? (
            <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 p-6 rounded-2xl shadow-sm">
              <HistorialCompras idCliente={selectedCustomerId} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl shadow-sm text-center h-[300px]" id="no-client-selected">
              <Users className="h-12 w-12 text-slate-300 mb-3" />
              <h3 className="font-bold text-slate-700 dark:text-zinc-300 text-lg">Historial de Compras</h3>
              <p className="text-slate-400 dark:text-zinc-500 text-sm max-w-sm mt-1 mx-auto">
                Selecciona un cliente de la lista de la izquierda para ver su historial detallado de pedidos y compras.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReporteHistorialCompras;
