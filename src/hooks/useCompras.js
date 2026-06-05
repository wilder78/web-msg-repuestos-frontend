import { useState, useEffect, useCallback } from "react";
import {
  fetchCompras,
  fetchCompraStatuses,
  updateCompraStatus,
  registerCompra,
  isComprasAdmin,
} from "../services/comprasService";

export const useCompras = () => {
  const [compras,   setCompras]   = useState([]);
  const [statuses,  setStatuses]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  /* ── Carga del listado de compras ─────────────────────────── */
  const fetchComprasData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const comprasFromApi = await fetchCompras();
      setCompras(comprasFromApi);
    } catch (err) {
      setCompras([]);
      setError(err.message || "Error al obtener el historial de compras.");
    } finally {
      setLoading(false);
    }
  }, []);

  /* ── Carga de estados (una sola vez) ───────────────────────── */
  const fetchStatuses = useCallback(async () => {
    try {
      const data = await fetchCompraStatuses();
      setStatuses(data);
    } catch {
      // Si la carga de estados falla, se mantendrá vacío — la tabla lo gestionará
    }
  }, []);

  useEffect(() => {
    fetchComprasData();
    fetchStatuses();
  }, [fetchComprasData, fetchStatuses]);

  /* ── Actualización de estado de una compra ─────────────────── */
  const updateStatus = useCallback(async (compra, nextStatusId) => {
    const idCompra = compra.idCompra ?? compra.id_compra ?? compra.id;
    await updateCompraStatus(idCompra, nextStatusId);

    // Actualización local optimista: reemplaza el idEstado en el array
    setCompras((prev) =>
      prev.map((c) => {
        const id = c.idCompra ?? c.id_compra ?? c.id;
        if (id !== idCompra) return c;
        return {
          ...c,
          idEstado:         nextStatusId,
          idEstadoCompra:   nextStatusId,
          id_estado_compra: nextStatusId,
          id_estado:        nextStatusId,
        };
      })
    );
  }, []);

  return {
    compras,
    setCompras,
    statuses,
    loading,
    error,
    refresh:       fetchComprasData,
    registerCompra,
    updateStatus,
    isAdmin:       isComprasAdmin,
  };
};
