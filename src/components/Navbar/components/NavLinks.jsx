import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";

export const NavLinks = () => {
  const { user } = useAuth();
  const location = useLocation();

  const links = [
    { label: "Inicio", href: "/" },
    { label: "Productos", href: "/repuestos" },
    { label: "Nosotros", href: "/nosotros" },
    { label: "Contactanos", href: "/contacto" },
  ];

  const showDashboard = user && user.idRol !== 4;

  return (
    <div className="flex items-center gap-6">
      {links.map((link) => (
        <Link
          key={link.href}
          to={link.href}
          className={`text-sm font-medium transition-colors ${
            location.pathname === link.href
              ? "text-blue-600 font-semibold"
              : "text-gray-600 hover:text-blue-600"
          }`}
        >
          {link.label}
        </Link>
      ))}

      {showDashboard && (
        <Link
          to="/dashboard"
          className="text-sm font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1 rounded-lg transition-all border border-blue-100"
        >
          Dashboard
        </Link>
      )}
    </div>
  );
};
