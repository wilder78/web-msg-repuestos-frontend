import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export function AuthGuard({ children }) {
  const { isAuthenticated, loading, user } = useAuth();

  // 1. Evitar redirecciones prematuras mientras se lee el token o el estado del usuario
  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-gray-500 dark:text-zinc-400 font-medium">
            Verificando credenciales...
          </span>
        </div>
      </div>
    );
  }

  // 2. Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si está autenticado pero la cuenta está inactiva
  const isUserActive = user ? (user.isActive !== false && user.is_active !== false) : false;
  if (!isUserActive) {
    return <Navigate to="/login" state={{ error: "Cuenta no verificada" }} replace />;
  }

  // Identificar el rol (idRol = 4 o 7 son clientes)
  const idRol = user ? Number(user.idRol ?? user.idrol ?? user.id_rol) : null;
  const nombreRol = user?.rol?.nombreRol?.toLowerCase();

  // Denegar explícitamente acceso a la zona admin a los clientes
  if (idRol === 4 || nombreRol === "cliente" || idRol === 7) {
    console.warn("Acceso denegado: El rol de cliente no tiene permisos de Dashboard.");
    return <Navigate to="/" replace />;
  }

  // Permitir la renderización de la ruta protegida
  return children;
}
