import React, { useState, useEffect, useRef } from "react";
import { Bell, Search, Menu, Loader2, Users, FileText, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import UserProfileDropdown from "../shared/UserProfileDropdown";
import api from "../../api/axios";
import { DarkModeToggle } from "../ui/DarkModeToggle";
import { resolveUserRole } from "../../lib/auth-utils";


// Importamos el hook específico de administración
import { useAdminNavbar } from "./hooks/useAdminNavbar";

export function AdminNavbar({ onToggleSidebar }) {
  const { user, handleLogout, getInitials } = useAdminNavbar();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState({ clientes: [], pedidos: [], productos: [] });
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // NOTIFICACIONES
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const bellDropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const response = await api.get("/notifications");
      if (response.data && response.data.ok) {
        setNotifications(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  // Click outside to close notifications dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (bellDropdownRef.current && !bellDropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put("/notifications/read-all");
      fetchNotifications();
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const handleNotificationClick = async (n) => {
    setShowNotifications(false);
    if (!n.is_read) {
      await handleMarkAsRead(n.id_notification);
    }
    if (n.tipo === "estado_pedido") {
      const match = n.titulo.match(/#(\d+)/) || n.mensaje.match(/#(\d+)/);
      if (match) {
        navigate(`/dashboard/pedidos?search=${match[1]}`);
      } else {
        navigate("/dashboard/pedidos");
      }
    } else if (n.tipo === "nuevo_cliente") {
      navigate("/dashboard/customers");
    } else if (n.tipo === "stock_bajo") {
      navigate("/dashboard/productos");
    } else {
      navigate("/dashboard");
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // Debounced search logic
  useEffect(() => {
    if (searchQuery.trim().length < 3) {
      setResults({ clientes: [], pedidos: [], productos: [] });
      setShowDropdown(false);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setLoading(true);
      setShowDropdown(true);
      try {
        const response = await api.get(`/search/global?q=${encodeURIComponent(searchQuery)}`);
        setResults(response.data || { clientes: [], pedidos: [], productos: [] });
      } catch (error) {
        console.error("Error fetching global search results:", error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectResult = (type, item) => {
    setShowDropdown(false);
    setSearchQuery("");
    if (type === "cliente") {
      navigate(`/dashboard/customers?search=${encodeURIComponent(item.numeroDocumento)}`);
    } else if (type === "pedido") {
      navigate(`/dashboard/pedidos?search=${encodeURIComponent(item.id_pedido)}`);
    } else if (type === "producto") {
      navigate(`/dashboard/productos?search=${encodeURIComponent(item.referencia)}`);
    }
  };

  const hasResults =
    results.clientes.length > 0 ||
    results.pedidos.length > 0 ||
    results.productos.length > 0;

  return (
    <header className="sticky top-0 z-30 w-full border-b backdrop-blur shadow-sm transition-colors duration-300 bg-white/95  bg-white dark:bg-zinc-900/95 border-slate-200 dark:border-zinc-800">
      <div className="relative flex h-16 items-center px-4 justify-center">
        
        {/* BOTÓN MENÚ MÓVIL */}
        <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="absolute left-4 lg:hidden">
          <Menu className="h-5 w-5 text-slate-600" />
        </Button>

        {/* CONTENEDOR CENTRALIZADO */}
        <div className="flex items-center justify-center gap-4 w-full max-w-2xl px-12 lg:px-0">
          
          {/* BUSCADOR */}
          <div className="flex-1 relative" ref={dropdownRef}>
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                placeholder="Buscar clientes, pedidos o productos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.trim().length >= 3 && setShowDropdown(true)}
                className="w-full pl-10 pr-10 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-700"
              />
              {loading && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500 animate-spin" />
              )}
            </div>

            {/* DROPDOWN DE BÚSQUEDA GLOBAL INTELIGENTE */}
            {showDropdown && (
              <div className="absolute left-0 right-0 mt-2 max-h-[450px] overflow-y-auto rounded-xl border border-slate-100 bg-white shadow-2xl z-50 divide-y divide-slate-50 transition-all duration-200">
                
                {loading && !hasResults && (
                  <div className="flex items-center justify-center py-8 text-slate-400 gap-2">
                    <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                    <span className="text-sm font-medium">Buscando coincidencias...</span>
                  </div>
                )}

                {!loading && !hasResults && (
                  <div className="py-8 text-center text-slate-400 text-sm font-medium">
                    No se encontraron resultados para "{searchQuery}"
                  </div>
                )}

                {/* SECCIÓN CLIENTES */}
                {results.clientes.length > 0 && (
                  <div className="p-3">
                    <div className="flex items-center gap-1.5 px-2 pb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <Users className="h-3.5 w-3.5 text-slate-400" />
                      Clientes
                    </div>
                    <div className="space-y-1">
                      {results.clientes.map((cliente) => (
                        <div
                          key={cliente.idCliente}
                          onClick={() => handleSelectResult("cliente", cliente)}
                          className="flex flex-col px-3 py-2 rounded-lg cursor-pointer hover:bg-blue-50/50 transition-colors group"
                        >
                          <span className="text-sm font-semibold text-slate-700 group-hover:text-blue-600 transition-colors">
                            {cliente.razonSocial}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">
                            Documento: {cliente.numeroDocumento}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SECCIÓN PEDIDOS */}
                {results.pedidos.length > 0 && (
                  <div className="p-3">
                    <div className="flex items-center gap-1.5 px-2 pb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <FileText className="h-3.5 w-3.5 text-slate-400" />
                      Pedidos
                    </div>
                    <div className="space-y-1">
                      {results.pedidos.map((pedido) => (
                        <div
                          key={pedido.id_pedido}
                          onClick={() => handleSelectResult("pedido", pedido)}
                          className="flex flex-col px-3 py-2 rounded-lg cursor-pointer hover:bg-blue-50/50 transition-colors group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-slate-700 group-hover:text-blue-600 transition-colors">
                              Pedido #{pedido.id_pedido}
                            </span>
                            <span className="text-xs text-slate-400">
                              {pedido.fecha_pedido ? new Date(pedido.fecha_pedido).toLocaleDateString() : ""}
                            </span>
                          </div>
                          {pedido.cliente?.razonSocial && (
                            <span className="text-xs text-slate-400 font-medium">
                              Cliente: {pedido.cliente.razonSocial}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SECCIÓN PRODUCTOS */}
                {results.productos.length > 0 && (
                  <div className="p-3">
                    <div className="flex items-center gap-1.5 px-2 pb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <Package className="h-3.5 w-3.5 text-slate-400" />
                      Productos
                    </div>
                    <div className="space-y-1">
                      {results.productos.map((producto) => (
                        <div
                          key={producto.id_producto}
                          onClick={() => handleSelectResult("producto", producto)}
                          className="flex flex-col px-3 py-2 rounded-lg cursor-pointer hover:bg-blue-50/50 transition-colors group"
                        >
                          <span className="text-sm font-semibold text-slate-700 group-hover:text-blue-600 transition-colors">
                            {producto.nombre}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">
                            Referencia: {producto.referencia}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>

          {/* ACCIONES Y PERFIL INMEDIATAMENTE AL LADO DERECHO DEL INPUT */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">

            <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-600 mx-1 hidden sm:block" />

            <div className="relative" ref={bellDropdownRef}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative rounded-full transition-colors ${showNotifications ? 'bg-slate-100 text-blue-600' : 'hover:bg-slate-100 text-slate-600'}`}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center border-2 border-white text-[10px] bg-red-500 font-bold"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Button>

              {showNotifications && (
                <div className="absolute right-0 mt-2.5 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 text-xs text-slate-700 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-800">Centro de Notificaciones</h4>
                      <p className="text-[10px] text-slate-400 font-medium">{unreadCount} sin leer</p>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllAsRead}
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        Marcar todas como leídas
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-slate-400 flex flex-col items-center gap-2">
                        <Bell className="h-8 w-8 text-slate-300 stroke-[1.5]" />
                        <span className="font-medium">No tienes notificaciones</span>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id_notification}
                          onClick={() => handleNotificationClick(n)}
                          className={`px-4 py-3 cursor-pointer transition-colors flex gap-3 ${
                            n.is_read ? "bg-white hover:bg-slate-50/50" : "bg-blue-50/20 hover:bg-blue-50/40"
                          }`}
                        >
                          <div className="flex-shrink-0 mt-0.5">
                            {n.tipo === "stock_bajo" && (
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                                <Package className="h-3.5 w-3.5" />
                              </span>
                            )}
                            {n.tipo === "nuevo_cliente" && (
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                                <Users className="h-3.5 w-3.5" />
                              </span>
                            )}
                            {n.tipo === "estado_pedido" && (
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                                <FileText className="h-3.5 w-3.5" />
                              </span>
                            )}
                          </div>
                          <div className="flex-grow min-w-0">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <span className={`font-semibold text-slate-800 truncate ${!n.is_read ? 'text-blue-900 font-bold' : ''}`}>
                                {n.titulo}
                              </span>
                              {!n.is_read && (
                                <span className="h-2 w-2 rounded-full bg-blue-600 flex-shrink-0" />
                              )}
                            </div>
                            <p className={`text-slate-500 line-clamp-2 leading-relaxed ${!n.is_read ? 'text-slate-700' : ''}`}>
                              {n.mensaje}
                            </p>
                            <span className="text-[10px] text-slate-400 font-medium block mt-1">
                              {new Date(n.fecha_registro).toLocaleDateString("es-CO", {
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="h-6 w-[1px] bg-slate-200 mx-1 hidden sm:block" />

            <DarkModeToggle className="hidden sm:flex" />

            <div className="h-6 w-[1px] bg-slate-200 mx-1 hidden sm:block" />

            {/* MENÚ DE PERFIL */}
            <UserProfileDropdown 
              initials={getInitials(user?.nombreUsuario)}
              name={user?.nombreUsuario || "Master"}
              email={user?.email}
              role={resolveUserRole(user)}
              roleId={user?.idRol ?? user?.idrol ?? user?.id_rol ?? user?.rol?.idRol}
              onLogout={handleLogout}
            />
          </div>

        </div>

      </div>
    </header>
  );
}
