import React, { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ClipboardCheck,
  Users,
  ExternalLink,
  CreditCard,
  Banknote,
  RotateCcw,
  Truck,
  ShoppingBag,
  ClipboardList,
  Route,
  MapPin,
  UserCog,
  BarChart3,
  FileText,
  UserPlus,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Key,
  TrendingUp,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuth } from "../../hooks/useAuth";

const getAuthToken = () =>
  localStorage.getItem("token") || sessionStorage.getItem("token") || null;

const extractList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  for (const key of ["data", "orders", "pedidos", "content", "rows", "items", "results"]) {
    const value = payload[key];
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object") {
      const nested = extractList(value);
      if (nested.length > 0) return nested;
    }
  }

  return [];
};

const fetchOrdersInProgressCount = async () => {
  const token = getAuthToken();
  if (!token) return 0;

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const urls = ["/api/orders", "http://localhost:8080/api/orders"];

  for (const url of urls) {
    try {
      const response = await fetch(url, { headers });
      if (response.status === 401 || response.status === 403) return 0;
      if (!response.ok) continue;

      const orders = extractList(await response.json().catch(() => ({})));
      return orders.filter((order) => Number(order.id_estado_pedido ?? order.idEstado) === 1).length;
    } catch {
      // Try the next known backend URL.
    }
  }

  return 0;
};

const fetchPendingComprasCount = async () => {
  const token = getAuthToken();
  if (!token) return 0;

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const urls = ["/api/shopping", "http://localhost:8080/api/shopping"];

  for (const url of urls) {
    try {
      const response = await fetch(url, { headers });
      if (response.status === 401 || response.status === 403) return 0;
      if (!response.ok) continue;

      const payload = await response.json().catch(() => ({}));
      const list = extractList(payload);
      return list.filter(
        (c) => Number(c.id_estado_compra ?? c.idEstadoCompra ?? c.idEstado ?? c.id_estado) === 1
      ).length;
    } catch {
      // Try the next known backend URL.
    }
  }

  return 0;
};

const navigation = [
  {
    title: "Panel Principal",
    items: [
      {
        icon: LayoutDashboard,
        label: "Dashboard",
        href: "/dashboard",
        requiredPermission: "Ver Dashboard",
      },
    ],
  },
  {
    title: "Ventas",
    items: [
      { icon: Users, label: "Clientes", href: "/dashboard/customers", requiredPermission: "Listar Clientes" },
      { icon: ClipboardCheck, label: "Pedidos", href: "/dashboard/pedidos", badgeKey: "ordersInProgress", requiredPermission: "Listar Pedidos" },
      { icon: CreditCard, label: "Créditos", href: "/dashboard/creditos", requiredPermission: "Listar Créditos" },
      { icon: Banknote, label: "Abonos", href: "/dashboard/abonos", requiredPermission: "Listar Abonos" },
      {
        icon: RotateCcw,
        label: "Devoluciones",
        href: "/dashboard/devoluciones",
        requiredPermission: "Listar Devoluciones",
      },
    ],
  },
  {
    title: "Reportes",
    items: [
      { icon: FileText,
        label: "Ventas",
        href: "/dashboard/sales",
        requiredPermission: "Ver Reportes",
      },
    ],
  },
  {
    title: "Inventario",
    items: [
      { icon: Package, label: "Productos", href: "/dashboard/productos", requiredPermission: "Listar Productos" },
      {
        icon: ClipboardList,
        label: "Categoría Productos",
        href: "/dashboard/categorias",
        requiredPermission: "Gestionar Categorías",
      },
      { icon: Truck, label: "Proveedores", href: "/dashboard/suppliers", requiredPermission: "Listar Proveedores" },
      { icon: ShoppingBag, label: "Compras", href: "/dashboard/compras", badgeKey: "purchasesPending", requiredPermission: "Listar Compras" },
    ],
  },
  {
    title: "Rutas de Venta",
    items: [
      { icon: Route, label: "Rutas de Venta", href: "/dashboard/rutas", requiredPermission: "Gestionar Rutas" },
      { icon: MapPin, label: "Zonas", href: "/dashboard/zonas", requiredPermission: "Gestionar Zonas" },
      {
        icon: UserCog,
        label: "Gestión de Empleados",
        href: "/dashboard/empleados",
        requiredPermission: "Gestionar Empleados",
      },
    ],
  },
  {
    title: "Configuración",
    items: [
      {
        icon: UserPlus,
        label: "Gestión de Usuarios",
        href: "/dashboard/usuarios",
        requiredPermission: "Gestionar Usuarios",
      },
      {
        icon: ShieldCheck,
        label: "Roles",
        href: "/dashboard/roles",
        requiredPermission: "Gestionar Roles",
      },
      {
        icon: Key,
        label: "Gestión de Permisos",
        href: "/dashboard/permisos",
        requiredPermission: "Gestionar Permisos",
      },
    ],
  },
];

export function Sidebar({ className }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [ordersInProgress, setOrdersInProgress] = useState(0);
  const [purchasesPending, setPurchasesPending] = useState(0);
  const location = useLocation();
  const { hasPermission, permisos } = useAuth();

  useEffect(() => {
    let isMounted = true;

    const loadOrdersCount = async () => {
      const count = await fetchOrdersInProgressCount();
      if (isMounted) setOrdersInProgress(count);
    };

    const loadComprasCount = async () => {
      const count = await fetchPendingComprasCount();
      if (isMounted) setPurchasesPending(count);
    };

    loadOrdersCount();
    loadComprasCount();
    const intervalId = window.setInterval(() => {
      loadOrdersCount();
      loadComprasCount();
    }, 60000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <aside
      className={cn(
        "relative flex h-full flex-col bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 text-gray-800 dark:text-zinc-100 transition-colors duration-300",
        isCollapsed ? "w-20" : "w-64",
        className,
      )}
    >
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-10 z-50 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-transform active:scale-90"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div className={cn("p-6 mb-2", isCollapsed ? "px-4" : "px-6")}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
            <img 
              src="/imagen/logocuadrado.png" 
              alt="MSG Logo" 
              className="h-full w-full object-cover scale-[1.35]"
            />
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden whitespace-nowrap">
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-none">
                MSG Repuestos
              </h1>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Repuestos y Accesorios
              </p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 space-y-7 pb-4 custom-scrollbar overflow-x-hidden">
        {(!permisos || !Array.isArray(permisos)) ? (
          <p className="px-3 text-sm text-slate-400 dark:text-slate-500">Cargando menú...</p>
        ) : (
        navigation.map((section) => {
          const isWildcard = hasPermission('*');
          const safeItems = section?.items || [];
          const visibleItems = isWildcard
            ? safeItems
            : safeItems.filter(
                (item) => !item?.requiredPermission || hasPermission(item.requiredPermission)
              );
          if (visibleItems.length === 0) return null;
          return (
          <div key={section.title}>
            {!isCollapsed && (
              <h3 className="px-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 whitespace-nowrap">
                {section.title}
              </h3>
            )}
            <div className="space-y-1">
              {visibleItems.map((item) => {
                const badgeValue =
                  item.badgeKey === "ordersInProgress"
                    ? ordersInProgress
                    : item.badgeKey === "purchasesPending"
                    ? purchasesPending
                    : item.badge;

                return (
                  <NavLink
                    key={item.label}
                    to={item.href}
                    title={isCollapsed ? item.label : ""}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center rounded-lg text-sm font-medium transition-all duration-200",
                        isCollapsed
                          ? "justify-center px-0 py-3"
                          : "justify-between px-3 py-2",
                        isActive
                          ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 shadow-sm"
                          : "text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className="flex items-center gap-3">
                          <item.icon
                            size={20}
                            className={
                              isActive ? "text-blue-700 dark:text-blue-400" : "text-slate-400 dark:text-slate-500"
                            }
                          />
                          {!isCollapsed && (
                            <span className="whitespace-nowrap">{item.label}</span>
                          )}
                        </div>

                        {!isCollapsed && (
                          <div className="flex items-center gap-1">
                            {Number(badgeValue) > 0 && (
                              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                                {badgeValue}
                              </span>
                            )}
                            {item.hasArrow && (
                              <ChevronRight size={14} className="text-slate-400 dark:text-slate-500" />
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
          );
        })
      )}
      </nav>

      <div className="p-4 border-t border-slate-100 dark:border-slate-700/60 space-y-4">
        <Link
          to="/"
          className={cn(
            "flex items-center justify-center gap-2 rounded-xl bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-400 transition-all shadow-md shadow-blue-100 dark:shadow-blue-900/30 active:scale-95",
            isCollapsed ? "h-12 w-12 mx-auto" : "w-full py-3 text-sm font-bold",
          )}
        >
          <ExternalLink size={18} />
          {!isCollapsed && <span>Ver Sitio Web</span>}
        </Link>
      </div>
    </aside>
  );
}
