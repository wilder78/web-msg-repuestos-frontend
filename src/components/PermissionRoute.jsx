import { Navigate } from "react-router-dom";
import { useCan } from "../hooks/useCan";
import { useAuth } from "../hooks/useAuth";

export function PermissionRoute({ permission, children }) {
  const { loading } = useAuth();
  const allowed = useCan(permission);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-gray-500 dark:text-zinc-400 font-medium">
            Verificando permisos...
          </span>
        </div>
      </div>
    );
  }

  if (!allowed) {
    return <Navigate to="/403" replace />;
  }
  return children;
}
