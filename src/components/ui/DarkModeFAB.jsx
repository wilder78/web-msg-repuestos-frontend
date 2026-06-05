import React from "react";
import { Sun, Moon } from "lucide-react";
import { useDarkMode } from "../../contexts/DarkModeContext";
import { cn } from "../../lib/utils";

/**
 * DarkModeFAB — Floating Action Button
 *
 * Botón fijo en la esquina inferior derecha de la pantalla para alternar
 * entre modo claro y oscuro en el Dashboard. Usa el contexto DarkModeContext.
 *
 * Posición: fixed bottom-6 right-6, z-index 50.
 */
export function DarkModeFAB({ className }) {
  const { isDark, toggle } = useDarkMode();

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={isDark ? "Modo claro" : "Modo oscuro"}
      className={cn(
        // Posición fija requerida
        "fixed bottom-6 right-6 z-50",
        // Forma y tamaño
        "flex h-12 w-12 items-center justify-center rounded-full",
        // Sombra prominente para visibilidad sobre cualquier contenido
        "shadow-lg shadow-black/20",
        // Transición suave
        "transition-all duration-300 active:scale-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500",
        // Colores según modo
        isDark
          ? "bg-slate-700 text-yellow-300 hover:bg-slate-600 border border-slate-600"
          : "bg-slate-900 text-yellow-300 hover:bg-slate-700 border border-slate-800",
        className
      )}
    >
      {/* Animación cruzada entre iconos */}
      <span className="relative flex h-5 w-5 items-center justify-center">
        <Sun
          size={20}
          className={cn(
            "absolute transition-all duration-300",
            isDark ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-90 scale-50"
          )}
        />
        <Moon
          size={20}
          className={cn(
            "absolute transition-all duration-300",
            isDark ? "opacity-0 -rotate-90 scale-50" : "opacity-100 rotate-0 scale-100"
          )}
        />
      </span>
    </button>
  );
}
