import { useState, useEffect, useCallback } from "react";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:8080/api").replace(/\/$/, "");

const getAuthToken = () =>
  localStorage.getItem("token") || sessionStorage.getItem("token") || null;

export const authFetch = (url, options = {}) => {
  const token = getAuthToken();
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
};

const getListFromResponse = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.credits)) return payload.credits;
  if (Array.isArray(payload?.creditos)) return payload.creditos;
  if (Array.isArray(payload?.content)) return payload.content;
  return [];
};

/**
 * Normaliza un registro de crédito al shape estándar del frontend.
 * Campos reales del backend:
 *   idCredito, idCliente, cupoAprobado, cupoUtilizado, cupoDisponible,
 *   idEstado, fechaAprobacion, cliente { idCliente, numeroDocumento, razonSocial }
 */
export const normalizeCredit = (credit) => {
  const cliente = credit.cliente ?? credit.customer ?? {};

  const idCliente =
    credit.idCliente ??
    credit.id_cliente ??
    cliente.idCliente ??
    cliente.id_cliente ??
    null;

  const idCredito =
    credit.idCredito ??
    credit.id_credito ??
    credit.id ??
    null;

  const clienteNombre =
    credit.clienteNombre ??
    credit.razonSocial ??
    cliente.razonSocial ??
    cliente.razon_social ??
    cliente.nombre ??
    (idCliente ? `Cliente #${idCliente}` : "Cliente");

  const numeroDocumento =
    credit.numeroDocumento ??
    cliente.numeroDocumento ??
    cliente.numero_documento ??
    "";

  // Cupos — nombres reales del backend
  const cupoAprobado  = parseFloat(credit.cupoAprobado  ?? credit.cupo_aprobado  ?? credit.montoCredito ?? 0);
  const cupoUtilizado = parseFloat(credit.cupoUtilizado ?? credit.cupo_utilizado ?? 0);
  const cupoDisponible = cupoAprobado - cupoUtilizado;

  const idEstado = Number(
    credit.idEstado ??
    credit.id_estado ??
    cliente.idEstado ??
    1
  );

  return {
    // Preserva todos los campos originales
    ...credit,
    // Campos normalizados
    idCredito,
    idCliente,
    id_cliente: idCliente,
    clienteNombre,
    numeroDocumento,
    cupoAprobado,
    cupoUtilizado,
    cupoDisponible,
    // montoCredito alias para compatibilidad con componentes existentes
    montoCredito: cupoAprobado,
    idEstado,
    id_estado: idEstado,
    estado:
      credit.estado ??
      credit.nombreEstado ??
      (idEstado === 1 ? "Activo" : "Suspendido"),
    fechaAprobacion:
      credit.fechaAprobacion ??
      credit.fecha_aprobacion ??
      null,
    // Re-expone el objeto cliente normalizado
    cliente: {
      idCliente,
      numeroDocumento,
      razonSocial: clienteNombre,
      ...cliente,
    },
  };
};

export const useCreditos = () => {
  const [creditos, setCreditos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCreditosData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authFetch(`${API_BASE_URL}/credits`);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message ?? data.error ?? `Error ${response.status} al cargar créditos`);
      }

      setCreditos(getListFromResponse(data).map(normalizeCredit));
    } catch (err) {
      setError(err.message);
      setCreditos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /** Reemplaza la lista local sin hacer petición — útil tras crear/editar/eliminar */
  const saveToStorage = (newList) => {
    setCreditos(newList.map(normalizeCredit));
  };

  /** Agrega un crédito normalizado al inicio de la lista */
  const addCredit = (credit) => {
    setCreditos((prev) => [normalizeCredit(credit), ...prev]);
  };

  useEffect(() => {
    fetchCreditosData();
  }, [fetchCreditosData]);

  return {
    creditos,
    setCreditos,
    loading,
    error,
    refresh: fetchCreditosData,
    authFetch,
    saveToStorage,
    addCredit,
  };
};
