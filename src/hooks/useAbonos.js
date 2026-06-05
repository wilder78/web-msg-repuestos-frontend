import { useState, useEffect, useCallback } from "react";

const getAuthToken = () =>
  localStorage.getItem("token") || sessionStorage.getItem("token") || null;

const authFetch = (url, options = {}) => {
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

export const useAbonos = () => {
  const [abonos, setAbonos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8080/api").replace(/\/$/, "");

  const fetchAbonosData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch(`${API_URL}/abonos`);
      if (res.ok) {
        const data = await res.json();
        setAbonos(data);
      } else {
        throw new Error("Error al obtener los abonos del servidor.");
      }
    } catch (err) {
      setError(err.message || "Error interno al obtener los historiales de pago.");
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchAbonosData();
  }, [fetchAbonosData]);

  const getSimulatedUser = () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
          try {
              const u = JSON.parse(storedUser);
              return { idUsuario: u.idUsuario, nombre: u.nombre };
          } catch (e) { return { idUsuario: 1, nombre: "Admin" }; }
      }
      return { idUsuario: 1, nombre: "Administrador" };
  }

  return {
    abonos,
    setAbonos,
    loading,
    error,
    refresh: fetchAbonosData,
    authFetch,
    getSimulatedUser
  };
};
