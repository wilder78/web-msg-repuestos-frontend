import React, { useState } from "react";
import { Sidebar } from "../../components/Navbar/Sidebar";
import { AdminNavbar } from "../../components/Navbar/AdminNavbar";
import { cn } from "../../lib/utils";
import { AuthGuard } from "../../components/shared/AuthGuard";
import { DarkModeProvider } from "../../contexts/DarkModeContext";
import { DarkModeFAB } from "../../components/ui/DarkModeFAB";
import { ModalDockProvider } from "../../contexts/ModalDockContext";
import { ModalDockTray } from "../../components/shared/ModalDockTray";

// Componente interno que ya tiene acceso al DarkModeContext
function DashboardInner({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen((v) => !v);

  return (
    <ModalDockProvider>
      {/* La clase 'dark' se aplica en <html> por DarkModeContext. */}
      {/* Aquí usamos dark: de Tailwind directamente. */}
      <div className="flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-zinc-950 transition-colors duration-300">

        {/* SIDEBAR */}
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-50 transform transition-all duration-300 ease-in-out lg:relative lg:translate-x-0",
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <Sidebar className="h-full" />
        </div>

        {/* OVERLAY MÓVIL */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
            onClick={toggleSidebar}
          />
        )}

        {/* CONTENIDO PRINCIPAL */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <AdminNavbar onToggleSidebar={toggleSidebar} />

          <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8 bg-slate-50 dark:bg-zinc-950 transition-colors duration-300">
            <div className="mx-auto max-w-7xl">
              {children}
            </div>
          </main>

          {/* FOOTER — listo para el futuro */}
          {/* <footer className="border-t px-6 py-3 text-xs border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400"> */}
          {/*   © {new Date().getFullYear()} MSG Repuestos */}
          {/* </footer> */}
        </div>

        {/* FAB flotante de modo oscuro */}
        <DarkModeFAB />

        {/* BANDEJA DE MODALES MINIMIZADOS */}
        <ModalDockTray />
      </div>
    </ModalDockProvider>
  );
}

export default function DashboardLayout({ children }) {
  return (
    <AuthGuard>
      <DarkModeProvider>
        <DashboardInner>{children}</DashboardInner>
      </DarkModeProvider>
    </AuthGuard>
  );
}
