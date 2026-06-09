import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

const readStoredUser = () => {
  try {
    const raw =
      localStorage.getItem("user") || sessionStorage.getItem("user");
    if (!raw) return null;
    const user = JSON.parse(raw);
    if (user) {
      const rawActive = user.is_active ?? user.isActive ?? user.is_Active;
      const isAct = rawActive === true || rawActive === 1 || rawActive === "1" || rawActive === "true";
      user.is_active = isAct;
      user.isActive = isAct;
    }
    return user;
  } catch {
    return null;
  }
};

const PERMS_CACHE_KEY = "user_permissions";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [isAuthenticated, setIsAuthenticated] = useState(!!readStoredUser());
  const [permisos, setPermisos] = useState([]);

  const tokenExistente = localStorage.getItem('token') || sessionStorage.getItem('token');
  const [loading, setLoading] = useState(!!tokenExistente);

  useEffect(() => {
    const verificarUsuarioYSeguridad = async () => {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const storedUserRaw = localStorage.getItem('user') || sessionStorage.getItem('user');

      if (!token || !storedUserRaw) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        sessionStorage.removeItem(PERMS_CACHE_KEY);
        setUser(null);
        setIsAuthenticated(false);
        setPermisos([]);
        setLoading(false);
        return;
      }

      try {
        // 1. Verificar el token con el endpoint de perfil
        const profileRes = await api.get("/users/profile");
        setIsAuthenticated(true);

        // 2. Cargar permisos y normalizar el usuario
        const parsedUser = JSON.parse(storedUserRaw);
        if (parsedUser) {
          const rawActive = parsedUser.is_active ?? parsedUser.isActive ?? parsedUser.is_Active;
          const isAct = rawActive === true || rawActive === 1 || rawActive === "1" || rawActive === "true";
          parsedUser.is_active = isAct;
          parsedUser.isActive = isAct;
          
          if (profileRes.data?.permisos) {
            parsedUser.permisos = profileRes.data.permisos;
            if (localStorage.getItem("user")) {
              localStorage.setItem("user", JSON.stringify(parsedUser));
            }
            if (sessionStorage.getItem("user")) {
              sessionStorage.setItem("user", JSON.stringify(parsedUser));
            }
          }
          setUser(parsedUser);
        }

        const roleId = Number(parsedUser?.idRol ?? parsedUser?.id_rol ?? parsedUser?.idrol);

        // CASO A: Es un cliente (Rol 4 o 7) -> No tiene acceso al Dashboard
        if (roleId === 4 || roleId === 7) {
          setPermisos([]);
          setLoading(false);
          return;
        }

        // CASO B: Es personal de Alta Gestión (Master) -> Acceso con Super-Permiso
        if (roleId === 1) {
          setPermisos(['*']);
          setLoading(false);
          return;
        }

        // CASO C: CUALQUIER OTRO ROL PRESENTE O FUTURO
        let names = profileRes.data?.permisos;
        
        if (!names || !Array.isArray(names) || names.length === 0) {
          const rolePermsRes = await api.get("/role-permissions/");
          const rolePerms = Array.isArray(rolePermsRes.data)
            ? rolePermsRes.data
            : rolePermsRes.data?.data ?? [];

          const myPerms = rolePerms.filter(
            (rp) => Number(rp.idRol ?? rp.id_rol) === roleId
          );

          names = myPerms
            .map((rp) => rp.permiso?.nombrePermiso ?? rp.nombrePermiso ?? null)
            .filter(Boolean);

          if (names.length === 0 && myPerms.length > 0) {
            const allPermsRes = await api.get("/permissions");
            const allPerms = Array.isArray(allPermsRes.data)
              ? allPermsRes.data
              : allPermsRes.data?.data ?? [];
            const allowedIds = myPerms.map(
              (rp) => Number(rp.idPermiso ?? rp.id_permiso ?? rp.id)
            );
            names = allPerms
              .filter((p) =>
                allowedIds.includes(Number(p.idPermiso ?? p.id_permiso ?? p.id))
              )
              .map((p) => p.nombrePermiso)
              .filter(Boolean);
          }
        }

        console.log("user.permisos cargados:", names);
        setPermisos(names);
        sessionStorage.setItem(PERMS_CACHE_KEY, JSON.stringify(names));
      } catch (error) {
        console.error("Token inválido o expirado durante la inicialización:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        sessionStorage.removeItem(PERMS_CACHE_KEY);
        setUser(null);
        setIsAuthenticated(false);
        setPermisos([]);
      } finally {
        setLoading(false);
      }
    };

    verificarUsuarioYSeguridad();
  }, [user?.idUsuario]);

  const syncFromStorage = useCallback(() => {
    const nextUser = readStoredUser();
    setUser(nextUser);
    setIsAuthenticated(!!nextUser);
  }, []);

  useEffect(() => {
    window.addEventListener("auth-changed", syncFromStorage);
    window.addEventListener("storage", syncFromStorage);
    return () => {
      window.removeEventListener("auth-changed", syncFromStorage);
      window.removeEventListener("storage", syncFromStorage);
    };
  }, [syncFromStorage]);

  const hasPermission = useCallback(
    (permission) => {
      if (!permisos || !Array.isArray(permisos)) return false;
      if (permisos.includes('*')) return true;
      return permisos.includes(permission);
    },
    [permisos]
  );

  const hasAnyPermission = useCallback(
    (...perms) => {
      if (!permisos || !Array.isArray(permisos)) return false;
      if (permisos.includes('*')) return true;
      return perms.some((p) => permisos.includes(p));
    },
    [permisos]
  );

  const hasAllPermissions = useCallback(
    (...perms) => {
      if (!permisos || !Array.isArray(permisos)) return false;
      if (permisos.includes('*')) return true;
      return perms.every((p) => permisos.includes(p));
    },
    [permisos]
  );

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem(PERMS_CACHE_KEY);
    setUser(null);
    setPermisos([]);
    window.dispatchEvent(new Event("auth-changed"));
  }, []);



  return (
    <AuthContext.Provider
      value={{
        user, setUser, logout, loading,
        isAuthenticated: !!user,
        permisos,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext debe usarse dentro de <AuthProvider>");
  }
  return ctx;
}
