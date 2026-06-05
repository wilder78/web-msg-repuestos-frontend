import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

const readStoredUser = () => {
  try {
    const raw =
      localStorage.getItem("user") || sessionStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const PERMS_CACHE_KEY = "user_permissions";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [permisos, setPermisos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const inicializarSeguridadEscalable = async () => {
      try {
        const storedUserRaw = sessionStorage.getItem('user') || localStorage.getItem('user');
        
        if (!storedUserRaw) {
          setPermisos([]);
          setLoading(false);
          return;
        }

        const user = JSON.parse(storedUserRaw);
        const roleId = Number(user?.idRol ?? user?.id_rol ?? user?.idrol);

        // CASO A: Es un cliente (Rol 4) -> No tiene acceso al Dashboard
        if (roleId === 4) {
          console.warn("Acceso denegado: El rol 4 (Cliente) no tiene permitido el Dashboard.");
          setPermisos([]);
          setLoading(false);
          return; 
        }

        // CASO B: Es personal de Alta Gestión (Master) -> Acceso con Super-Permiso
        if (roleId === 1) {
          console.log("Bypass Activado: Rol Master detectado.");
          setPermisos(['*']);
          setLoading(false);
          return;
        }

        // CASO C: CUALQUIER OTRO ROL PRESENTE O FUTURO
        console.log(`Cargando permisos granulares para el Rol número: ${roleId}`);
        
        const cachedPerms = sessionStorage.getItem(PERMS_CACHE_KEY);
        if (cachedPerms) {
          const parsedCache = JSON.parse(cachedPerms);
          setPermisos(Array.isArray(parsedCache) ? parsedCache : []);
          return;
        }

        try {
          const rolePermsRes = await api.get("/role-permissions/");
          const rolePerms = Array.isArray(rolePermsRes.data)
            ? rolePermsRes.data
            : rolePermsRes.data?.data ?? [];

          // Filtrar sólo los que pertenecen a este rol
          const myPerms = rolePerms.filter(
            (rp) => Number(rp.idRol ?? rp.id_rol) === roleId
          );

          // Extraer el nombre directo del JOIN embebido (campo permiso.nombrePermiso)
          // que ya viene en la respuesta de /role-permissions/
          let names = myPerms
            .map((rp) => rp.permiso?.nombrePermiso ?? rp.nombrePermiso ?? null)
            .filter(Boolean);

          // Fallback: si no venían embebidos, cruzar con /permissions manualmente
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

          setPermisos(names);
          sessionStorage.setItem(PERMS_CACHE_KEY, JSON.stringify(names));
        } catch {
          setPermisos([]);
          sessionStorage.removeItem(PERMS_CACHE_KEY);
        }
      } catch (error) {
        console.error("Error crítico en el árbol de seguridad:", error);
        setPermisos([]);
      } finally {
        setLoading(false); // Apaga el loading SIEMPRE, evitando pantallas en blanco
      }
    };

    inicializarSeguridadEscalable();
  }, [user]);

  const syncFromStorage = useCallback(() => {
    setUser(readStoredUser());
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

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <span>Cargando configuraciones de seguridad...</span>
      </div>
    );
  }

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
