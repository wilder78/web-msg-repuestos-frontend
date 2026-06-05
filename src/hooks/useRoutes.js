import { useState, useEffect, useCallback } from "react";

// Helper interno para peticiones con Token
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

export const useRoutes = () => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRoutesData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch("/api/rutas");

      if (!res.ok) {
        throw new Error("Error fetching data from server");
      }

      const data = await res.json();

      // Normalización de la respuesta según tu Backend
      const routesList = data.data || data.rutas || data.content || data || [];

      setRoutes(routesList);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoutesData();
  }, [fetchRoutesData]);

  return {
    routes,
    setRoutes,
    loading,
    error,
    refresh: fetchRoutesData,
    authFetch,
  };
};
