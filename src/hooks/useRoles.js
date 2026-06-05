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

export const useRoles = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRolesData = useCallback(async () => {
    setLoading(true);
    try {
      const [resRoles, resPerms] = await Promise.all([
        authFetch("/api/roles"),
        authFetch("/api/role-permissions/"),
      ]);

      if (resRoles.status === 401 || resPerms.status === 401) {
        setError("Sesión expirada. Por favor, inicia sesión nuevamente.");
        return;
      }
      if (!resRoles.ok || !resPerms.ok) throw new Error("Error en el servidor");

      setError(null);

      const dataRoles = await resRoles.json();
      const dataPerms = await resPerms.json();

      const roleList = dataRoles.data || dataRoles.roles || dataRoles || [];

      const formattedRoles = roleList.map((rol) => {
        const idActual = rol.idRol || rol.id_rol;

        const asignacionesDelRol = dataPerms.filter(
          (p) => p.idRol === idActual || p.id_rol === idActual,
        );

        let ultimaFecha = "N/A";

        if (asignacionesDelRol.length > 0) {
          const fechas = asignacionesDelRol
            .map((a) => new Date(a.fechaAsignacion))
            .filter((d) => !isNaN(d))
            .sort((a, b) => b - a);

          if (fechas.length > 0) {
            ultimaFecha = fechas[0].toLocaleDateString("es-ES", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            });
          }
        }

        // ✅ return dentro del map, con su cierre correcto
        return {
          id: idActual,
          nombre: rol.nombreRol || rol.nombre_rol || rol.nombre,
          descripcion:
            rol.descripcionRol ||
            rol.descripcion_rol ||
            rol.descripcion ||
            "Sin descripción",
          estado: rol.estado || "activo",
          idEstado: rol.idEstado || rol.id_estado || 1,
          fechaCreacion: ultimaFecha,
          permisosCount: asignacionesDelRol.length,
        };
      }); // ✅ cierre del .map()

      // ✅ setRoles va DESPUÉS del map, no dentro de él
      setRoles(formattedRoles);
    } catch (err) {
      console.error("Error al sincronizar datos:", err);
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRolesData();
  }, [fetchRolesData]);

  // ✅ setRoles y authFetch expuestos para actualizaciones
  return {
    roles,
    setRoles,
    loading,
    error,
    refresh: fetchRolesData,
    authFetch,
  };
};
