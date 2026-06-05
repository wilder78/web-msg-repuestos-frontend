import React from "react";
import { LogOut, User as UserIcon, LayoutDashboard } from "lucide-react"; // Añadido LayoutDashboard
import { useAuth } from "../../../hooks/useAuth";

// 1. Añadimos isEmployee a las props
export const MobileMenu = ({ isOpen, onClose, onLoginClick, isEmployee }) => {
  const { user, logout, isAuthenticated } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="md:hidden fixed inset-0 top-20 bg-white z-40 animate-in slide-in-from-right duration-300">
      <div className="flex flex-col h-[80vh] p-6">
        {/* INFO DE USUARIO EN MÓVIL */}
        {isAuthenticated && (
          <div className="flex flex-col items-center mb-10 pb-6 border-b border-gray-100">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-3">
              <UserIcon className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-xl font-bold text-gray-800">
              Hola, {user.nombre}
            </p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        )}

        {/* LINKS DE NAVEGACIÓN */}
        <nav className="flex flex-col items-center space-y-6">
          {/* 2. Link condicional al Dashboard para empleados */}
          {isEmployee && (
            <a
              href="/dashboard"
              onClick={onClose}
              className="text-2xl font-bold text-blue-600 flex items-center gap-2"
            >
              <LayoutDashboard className="w-6 h-6" />
              Panel Admin
            </a>
          )}

          {[
            { href: "/", label: "Inicio" },
            { href: "/repuestos", label: "Productos" },
            { href: "/nosotros", label: "Nosotros" },
            { href: "/contacto", label: "Contacto" },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={onClose}
              className="text-2xl font-semibold text-gray-800"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* ACCIONES DE CUENTA */}
        <div className="mt-auto flex flex-col items-center gap-4">
          {!isAuthenticated ? (
            <button
              onClick={() => {
                onClose();
                onLoginClick();
              }}
              className="w-full max-w-xs bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg"
            >
              Iniciar Sesión
            </button>
          ) : (
            <button
              onClick={logout}
              className="w-full max-w-xs bg-red-50 text-red-600 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 border border-red-100"
            >
              <LogOut className="w-5 h-5" />
              Cerrar Sesión
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
