import { Navigate } from "react-router-dom";
import { useCan } from "../hooks/useCan";

export function PermissionRoute({ permission, children }) {
  const allowed = useCan(permission);
  if (!allowed) {
    return <Navigate to="/403" replace />;
  }
  return children;
}
