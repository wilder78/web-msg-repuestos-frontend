import { useCan } from "../../hooks/useCan";

export function Can({ permission, children, fallback = null }) {
  const allowed = useCan(permission);
  if (permission === undefined || permission === null) return children;
  return allowed ? children : fallback;
}
