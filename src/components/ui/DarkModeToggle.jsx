import React from "react";
import { Sun, Moon } from "lucide-react";
import { useDarkMode } from "../../contexts/DarkModeContext";
import { cn } from "../../lib/utils";

/**
 * DarkModeToggle
 * Botón conmutador Sol/Luna para alternar el modo oscuro del Dashboard.
 * Lee y escribe el estado desde DarkModeContext (que persiste en localStorage).
 */
export function DarkModeToggle({ className }) {
  const { isDark, toggle } = useDarkMode();

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? "Activar modo claro" : "Activar modo oscuro"}
      title={isDark ? "Modo claro" : "Modo oscuro"}
      className={cn(
        "relative flex h-9 w-16 items-center rounded-full border p-1 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
        isDark
          ? "border-slate-600 bg-slate-700 hover:bg-slate-600"
          : "border-slate-200 bg-slate-100 hover:bg-slate-200",
        className
      )}
    >
      {/* Track icons */}
      <Sun
        size={13}
        className={cn(
          "absolute left-2 transition-opacity duration-300",
          isDark ? "opacity-0" : "opacity-60 text-amber-500"
        )}
      />
      <Moon
        size={13}
        className={cn(
          "absolute right-2 transition-opacity duration-300",
          isDark ? "opacity-80 text-blue-300" : "opacity-0"
        )}
      />

      {/* Thumb */}
      <span
        className={cn(
          "relative z-10 flex h-6 w-6 items-center justify-center rounded-full shadow-md transition-all duration-300",
          isDark
            ? "translate-x-7 bg-slate-900"
            : "translate-x-0 bg-white"
        )}
      >
        {isDark ? (
          <Moon size={12} className="text-blue-400" />
        ) : (
          <Sun size={12} className="text-amber-500" />
        )}
      </span>
    </button>
  );
}
