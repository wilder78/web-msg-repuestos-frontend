import { useMemo } from "react";
import { useAuth } from "./useAuth";

export function useCan(permission) {
  const { hasPermission } = useAuth();
  return useMemo(() => hasPermission(permission), [hasPermission, permission]);
}
