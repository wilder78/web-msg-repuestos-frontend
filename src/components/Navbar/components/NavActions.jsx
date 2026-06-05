import React from "react";
import { ShoppingCart, User, Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import { UserProfileDropdown } from "../../shared/UserProfileDropdown";
import { useCart } from "../../../contexts/CartContext";
import { getUserInitials } from "../../../lib/user-initials";
import { resolveUserRole } from "../../../lib/auth-utils";


const links = [
  { href: "/", label: "Inicio" },
  { href: "/productos", label: "Productos" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/contacto", label: "Contacto" },
];

export const NavLinks = () => {
  return (
    <div className="hidden lg:flex items-center space-x-1">
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className="relative px-3 py-2 text-gray-600 hover:text-blue-600 font-medium transition-colors group text-sm"
        >
          {link.label}
          <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
        </a>
      ))}
    </div>
  );
};

export const NavActions = ({ isMenuOpen, toggleMenu, toggleLogin }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const { cartCount } = useCart();

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <Link to="/carrito" className="relative p-2 text-gray-700 hover:bg-blue-50 rounded-full transition-all">
        <ShoppingCart className="w-5 h-5" />
        {cartCount > 0 && (
          <span className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-1 py-0.5 rounded-full shadow-sm">
            {cartCount}
          </span>
        )}
      </Link>

      {!isAuthenticated ? (
        <button
          onClick={toggleLogin}
          className="p-2 text-gray-700 hover:bg-blue-50 rounded-xl transition-all"
          title="Iniciar Sesión"
        >
          <User className="w-5 h-5" />
        </button>
      ) : (
        <div className="relative ml-2">
          <UserProfileDropdown 
            initials={getUserInitials(
              user?.nombre,
              user?.nombreUsuario,
              user?.email
            )}
            name={user?.nombre || user?.nombreUsuario || "Usuario"}
            email={user?.email}
            role={resolveUserRole(user)}
            roleId={user?.idRol ?? user?.idrol ?? user?.id_rol ?? user?.rol?.idRol}
            onLogout={logout}
          />
        </div>
      )}

      <button
        onClick={toggleMenu}
        className="md:hidden p-2 text-gray-700 hover:bg-blue-50 rounded-xl transition-all flex-shrink-0 ml-1"
        aria-label="Abrir menú"
      >
        {isMenuOpen ? (
          <X className="w-6 h-6 text-blue-600" />
        ) : (
          <Menu className="w-6 h-6" />
        )}
      </button>
    </div>
  );
};
