import React, { createContext, useContext, useState, useEffect } from "react";

const NovedadesContext = createContext();

const API_BASE_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

export function NovedadesProvider({ children }) {
  const [nuevasNovedades, setNuevasNovedades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetched, setFetched] = useState(false);

  const fetchNovedades = () => {
    if (fetched) return;
    setLoading(true);
    fetch(`${API_BASE_URL}/products/latest`)
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data.products || data.data || data.content || [];
        const sorted = [...list].sort(
          (a, b) => (b.id_producto || 0) - (a.id_producto || 0)
        );
        setNuevasNovedades(sorted);
        setFetched(true);
      })
      .catch((err) => console.error("Error cargando novedades", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchNovedades();
  }, []);

  return (
    <NovedadesContext.Provider value={{ nuevasNovedades, loading, fetchNovedades }}>
      {children}
    </NovedadesContext.Provider>
  );
}

export function useNovedades() {
  return useContext(NovedadesContext);
}
