import React from "react";
import { Navigate } from "react-router-dom";

export function AuthGuard({ children }) {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");

  // Si no hay token, redirigir al login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Parsear los datos del usuario logueado
  const userStr = localStorage.getItem("user") || sessionStorage.getItem("user");
  let user = null;
  try {
    if (userStr) {
      user = JSON.parse(userStr);
    }
  } catch (e) {
    console.error("AuthGuard: Error al parsear los datos del usuario.", e);
  }

  // Identificar el rol (idRol = 4 es Cliente)
  const idRol = user ? Number(user.idRol ?? user.idrol ?? user.id_rol) : null;
  const nombreRol = user?.rol?.nombreRol?.toLowerCase();

  // Denegar explícitamente acceso a la zona admin a los clientes
  if (idRol === 4 || nombreRol === "cliente") {
    return <Navigate to="/" replace />;
  }

  // Permitir la renderización de la ruta protegida
  return children;
}
