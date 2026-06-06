import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  // Mientras verifica, se queda congelado mostrando el spinner de carga
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100 dark:bg-zinc-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Solo si terminó de cargar Y no está autenticado, redirige al Login una sola vez
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Flujo opcional: Si está autenticado pero la cuenta está inactiva por verificación
  const isUserActive = user ? (user.isActive !== false && user.is_active !== false) : false;
  if (!isUserActive) {
    return <Navigate to="/login" state={{ error: "Cuenta no verificada" }} replace />;
  }

  const currentRoleId = user ? Number(user.idRol ?? user.id_rol ?? user.idrol) : null;
  if (currentRoleId === 1) {
    return children;
  }

  const nombreRol = user?.rol?.nombreRol?.toLowerCase();
  if (currentRoleId === 4 || nombreRol === "cliente" || currentRoleId === 7) {
    console.warn(
      "Acceso denegado: El rol de cliente no tiene permisos de Dashboard.",
    );
    return <Navigate to="/" replace />;
  }

  return children;
};
