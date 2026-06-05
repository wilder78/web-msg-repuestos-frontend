import { toast } from "sonner";

export const handleUnauthorized = (url = "") => {
  if (url.includes("/login") || url.includes("/users/login")) {
    return;
  }

  localStorage.removeItem("token");
  localStorage.removeItem("user");
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("user");
  sessionStorage.removeItem("user_permissions");

  const isHomeWithLogin = window.location.pathname === "/" && window.location.search.includes("login=true");

  if (!isHomeWithLogin) {
    window.location.href = "/?login=true";
  }
};

export const handleForbidden = () => {
  toast.error("No tienes permisos para realizar esta acción");
};

export const authFetch = async (url, options = {}) => {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (response.status === 401) {
    handleUnauthorized(url);
    return new Promise(() => {});
  }

  if (response.status === 403) {
    handleForbidden();
    return new Promise(() => {});
  }

  return response;
};

export const resolveUserRole = (user) => {
  if (!user) return "Cliente";

  const directName =
    user.nombreRol ||
    user.nombrerol ||
    user.nombre_rol ||
    user.rol?.nombreRol ||
    user.rol?.nombrerol ||
    user.rol?.nombre_rol ||
    user.rol?.nombre;

  if (directName) return directName;

  const roleId = Number(user.idRol ?? user.idrol ?? user.id_rol ?? user.rol?.idRol ?? 4);
  switch (roleId) {
    case 1:
      return "Master";
    case 2:
      return "Administrador";
    case 3:
      return "Vendedor";
    case 4:
      return "Cliente";
    case 5:
      return "Bodeguero";
    case 6:
      return "Contador";
    default:
      return "Cliente";
  }
};

