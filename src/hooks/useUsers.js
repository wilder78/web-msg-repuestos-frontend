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

const extractList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  for (const key of [
    "data",
    "usuarios",
    "users",
    "roles",
    "content",
    "rows",
    "items",
    "results",
  ]) {
    const value = payload[key];
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object") {
      const nested = extractList(value);
      if (nested.length > 0) return nested;
    }
  }

  return [];
};

const normalizeRole = (role) => {
  const idRol = role.idRol ?? role.idrol ?? role.id_rol ?? role.id;
  const nombreRol =
    role.nombreRol ||
    role.nombrerol ||
    role.nombre_rol ||
    role.nombre ||
    role.name ||
    "Usuario";

  return {
    ...role,
    idRol,
    id_rol: role.id_rol || idRol,
    nombreRol,
    nombre_rol: role.nombre_rol || nombreRol,
  };
};

const normalizeUser = (user) => {
  const idUsuario =
    user.idUsuario ?? user.idusuario ?? user.id_usuario ?? user.id;
  const nombreUsuario =
    user.nombreUsuario ||
    user.nombreusuario ||
    user.nombre_usuario ||
    user.nombre ||
    user.name ||
    "";
  const idEstado =
    user.idEstado ??
    user.idestado ??
    user.id_estado ??
    user.estado?.idEstado ??
    user.estado?.idestado ??
    1;
  const idRol =
    user.idRol ??
    user.idrol ??
    user.id_rol ??
    user.rol?.idRol ??
    user.rol?.idrol ??
    user.rol?.id_rol;
  const idCliente = user.idCliente ?? user.idcliente ?? user.id_cliente ?? null;
  const fechaCreacion =
    user.fechaCreacion || user.fechacreacion || user.fecha_creacion || "";

  return {
    ...user,
    idUsuario,
    idusuario: user.idusuario || idUsuario,
    nombreUsuario,
    nombreusuario: user.nombreusuario || nombreUsuario,
    idEstado,
    idestado: user.idestado || idEstado,
    id_estado: user.id_estado || idEstado,
    idRol,
    idrol: user.idrol || idRol,
    id_rol: user.id_rol || idRol,
    idCliente,
    idcliente: user.idcliente ?? idCliente,
    fechaCreacion,
  };
};

export const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [roleMap, setRoleMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsersData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [resUsers, resRoles] = await Promise.all([
        authFetch("/api/users"),
        authFetch("/api/roles"),
      ]);

      if (!resUsers.ok || !resRoles.ok) {
        throw new Error("Error fetching data from server");
      }

      const dataUsers = await resUsers.json();
      const dataRoles = await resRoles.json();

      // Normalización de la respuesta según tu Backend
      const userList = extractList(dataUsers).map(normalizeUser);
      const roleList = extractList(dataRoles).map(normalizeRole);

      setUsers(userList);
      setRoles(roleList);

      // Crear mapa de roles para acceso rápido: { 1: "Admin", 2: "Vendedor" }
      const map = {};
      roleList.forEach((role) => {
        if (role.idRol) map[role.idRol] = role.nombreRol;
      });
      setRoleMap(map);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsersData();
  }, [fetchUsersData]);

  return {
    users,
    setUsers,
    roles,
    roleMap,
    loading,
    error,
    refresh: fetchUsersData,
    authFetch,
  };
};
