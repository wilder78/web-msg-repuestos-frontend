import React, { useState, useEffect, useMemo, useCallback } from "react";
import api from "../../api/axios";
import { ShoppingBag, Search } from "lucide-react";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import PageHeader from "../../components/shared/PageHeader";
import { ClientPurchaseHistoryTable } from "./components/ClientPurchaseHistoryTable";
import ClientPurchaseHistoryDetailsModal from "./components/ClientPurchaseHistoryDetailsModal";

const PAGE_SIZE = 8;

export default function ReporteHistorialCompras() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState(null);

  // Estados para el modal de detalles
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const fetchPurchasingCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/customers/purchasing-history");
      if (response.data?.status === "success") {
        setCustomers(response.data.data || []);
      } else {
        throw new Error("No se pudo obtener el reporte de compras.");
      }
    } catch (err) {
      console.error("Error al obtener reporte de historial de compras:", err);
      setError(err.message || "Error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPurchasingCustomers();
  }, [fetchPurchasingCustomers]);

  // Filtrado por buscador
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const term = searchTerm.toLowerCase();
      const name = (c.razonSocial || "").toLowerCase();
      const doc = (c.numeroDocumento || "").toLowerCase();
      return name.includes(term) || doc.includes(term);
    });
  }, [customers, searchTerm]);

  // Paginación
  const totalPages = Math.ceil(filteredCustomers.length / PAGE_SIZE);
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredCustomers.slice(start, start + PAGE_SIZE);
  }, [filteredCustomers, currentPage]);

  const showPagination = totalPages > 1;

  const handleViewDetails = (customer) => {
    setSelectedCustomer(customer);
    setIsDetailsModalOpen(true);
  };

  return (
    <div className="p-8 space-y-8 bg-slate-50 dark:bg-zinc-950 min-h-screen text-slate-900 dark:text-slate-100">
      <PageHeader
        icon={ShoppingBag}
        title="Historial de Compras de Clientes"
        subtitle="Reporte consolidado de compras y pedidos por cliente"
      />

      {error && !loading && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 px-5 py-3 rounded-lg flex items-center justify-between text-sm font-medium">
          <span>⚠️ {error}</span>
          <button
            onClick={fetchPurchasingCustomers}
            className="ml-4 text-red-600 underline hover:text-red-800"
          >
            Reintentar
          </button>
        </div>
      )}

      <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-slate-950/40 overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700/60">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                Clientes que han Comprado
              </h3>
              <p className="text-sm text-slate-400 dark:text-zinc-400 font-medium">
                {loading
                  ? "Sincronizando..."
                  : `${filteredCustomers.length} clientes encontrados`}
              </p>
            </div>
            <div className="relative w-full md:w-80">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500"
                size={18}
              />
              <Input
                placeholder="Buscar por Razón Social o NIT..."
                className="pl-10 bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-zinc-800 transition-all focus:ring-2 focus:ring-emerald-500/20"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
        </div>

        <ClientPurchaseHistoryTable
          customers={paginated}
          loading={loading}
          onViewDetails={handleViewDetails}
        />

        {showPagination && (
          <div className="p-4 bg-slate-50/50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-700/60 flex justify-center items-center gap-4 text-sm font-bold text-slate-600 dark:text-zinc-400">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="disabled:opacity-50 disabled:cursor-not-allowed hover:text-slate-900 dark:hover:text-white"
            >
              Anterior
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1.5 rounded-lg border shadow-sm ${
                  page === currentPage
                    ? "bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50"
                    : "bg-white dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border-slate-200 dark:border-zinc-700 hover:text-slate-800 dark:hover:text-white"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="disabled:opacity-50 disabled:cursor-not-allowed hover:text-slate-900 dark:hover:text-white"
            >
              Siguiente
            </button>
          </div>
        )}
      </Card>

      <ClientPurchaseHistoryDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        customer={selectedCustomer}
      />
    </div>
  );
}
