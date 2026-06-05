import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const DarkModeContext = createContext(null);

const STORAGE_KEY = "msg_dashboard_dark_mode";

/**
 * DarkModeProvider
 *
 * - Lee la preferencia guardada en localStorage
 * - Inyecta / quita la clase `dark` en <html> para activar las variantes
 *   dark: de Tailwind CSS (darkMode: 'class' en tailwind.config.js)
 * - Expone { isDark, toggle } a todos los descendientes
 *
 * Está diseñado para usarse SÓLO dentro del DashboardLayout, de forma que
 * la vista pública nunca resulte afectada.
 */
export function DarkModeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === "true";
    } catch {
      return false;
    }
  });

  // Sincronizar la clase `dark` en <html> cada vez que cambia isDark
  useEffect(() => {
    if (isDark === true) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  const toggle = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {}
      return next;
    });
  }, []);

  return (
    <DarkModeContext.Provider value={{ isDark, toggle }}>
      {children}
    </DarkModeContext.Provider>
  );
}

export function useDarkMode() {
  const ctx = useContext(DarkModeContext);
  if (!ctx) throw new Error("useDarkMode debe usarse dentro de <DarkModeProvider>");
  return ctx;
}
