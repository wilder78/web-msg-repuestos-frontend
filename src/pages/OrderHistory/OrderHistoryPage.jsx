import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { ClipboardList, CreditCard, PackageCheck, Printer, ReceiptText, Search, ChevronLeft, ChevronRight } from "lucide-react";
import Navbar from "../../components/Navbar/PublicNavbar";
import Footer from "../../components/Footer/Footer";
import WhatsAppButton from "../../components/shared/WhatsAppButton";
import PrintableDocument from "../../components/shared/PrintableDocument";
import { useAuth } from "../../hooks/useAuth";
import { authFetch } from "../../lib/auth-utils";
import { formatCurrency } from "../../lib/format-currency";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

const getRoleId = (user) =>
  Number(
    user?.idRol ??
    user?.idrol ??
    user?.id_rol ??
    user?.rol?.idRol ??
    user?.rol?.id_rol ??
    0
  );

const getCustomerName = (order) =>
  order?.cliente?.razonSocial ||
  order?.cliente?.razon_social ||
  order?.cliente?.razonsocial ||
  order?.clienteNombre ||
  order?.nombreCliente ||
  "Cliente no identificado";

const getCustomerDocument = (order) =>
  order?.cliente?.numeroDocumento ||
  order?.cliente?.numero_documento ||
  order?.cliente?.documento ||
  "No registrado";

const getCustomerDocType = (order) =>
  order?.cliente?.tipoDocumento?.sigla ||
  order?.cliente?.tipo_documento?.sigla ||
  "NIT/CC";

const extractList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  for (const key of ["data", "orders", "pedidos", "content", "rows", "items", "results", "history"]) {
    const value = payload[key];
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object") {
      const nested = extractList(value);
      if (nested.length > 0) return nested;
    }
  }

  return [];
};

const uniqueById = (items) =>
  Array.from(
    items
      .reduce((map, item) => {
        const id = item?.idPedido ?? item?.id_pedido ?? item?.id;
        if (id && !map.has(String(id))) map.set(String(id), item);
        return map;
      }, new Map())
      .values()
  );

const getUserId = (user) =>
  user?.idUsuario ??
  user?.idusuario ??
  user?.id_usuario ??
  user?.id ??
  user?.usuario?.idUsuario ??
  user?.usuario?.idusuario ??
  user?.usuario?.id_usuario;

const getUserEmail = (user) =>
  (
    user?.email ||
    user?.correo ||
    user?.usuario?.email ||
    user?.usuario?.correo ||
    ""
  )
    .toString()
    .trim()
    .toLowerCase();

const getCustomerIdFromUser = (user) =>
  user?.idCliente ??
  user?.idcliente ??
  user?.id_cliente ??
  user?.cliente?.idCliente ??
  user?.cliente?.idcliente ??
  user?.cliente?.id_cliente;

const getOrderCustomerId = (order) =>
  order?.idCliente ??
  order?.id_cliente ??
  order?.cliente?.idCliente ??
  order?.cliente?.idcliente ??
  order?.cliente?.id_cliente;

const getEmployeeIdFromUser = (user) =>
  user?.idEmpleado ??
  user?.idempleado ??
  user?.id_empleado ??
  user?.empleado?.idEmpleado ??
  user?.empleado?.idempleado ??
  user?.empleado?.id_empleado;

const getEmployeeUserId = (employee) =>
  employee?.idUsuario ??
  employee?.idusuario ??
  employee?.id_usuario ??
  employee?.usuario?.idUsuario ??
  employee?.usuario?.idusuario ??
  employee?.usuario?.id_usuario;

const getEmployeeEmail = (employee) =>
  (
    employee?.email ||
    employee?.correo ||
    employee?.usuario?.email ||
    employee?.usuario?.correo ||
    ""
  )
    .toString()
    .trim()
    .toLowerCase();

const getEmployeeId = (employee) =>
  employee?.idEmpleado ?? employee?.idempleado ?? employee?.id_empleado ?? employee?.id;

const getOrderSellerId = (order) =>
  order?.idVendedor ??
  order?.id_vendedor ??
  order?.vendedor?.idUsuario ??
  order?.vendedor?.idusuario ??
  order?.vendedor?.id_usuario ??
  order?.vendedor?.idEmpleado ??
  order?.vendedor?.idempleado ??
  order?.vendedor?.id_empleado;

const normalizeNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const getDetailQuantity = (detail) =>
  normalizeNumber(
    detail?.cantidad ??
      detail?.cantidad_solicitada ??
      detail?.cantidadSolicitada ??
      detail?.quantity ??
      0,
  );

const getDetailUnitPrice = (detail) =>
  normalizeNumber(
    detail?.precio_unitario ??
      detail?.precio_venta ??
      detail?.precioVenta ??
      detail?.valor_unitario ??
      detail?.precio ??
      detail?.producto?.precio_publico ??
      detail?.producto?.precio_compra ??
      0,
  );

const getDetailSubtotal = (detail, quantity, unitPrice) =>
  normalizeNumber(
    detail?.subtotal_linea ??
      detail?.subtotalLinea ??
      detail?.subtotal ??
      quantity * unitPrice,
  );

const getDetailDiscount = (detail, quantity, unitPrice, subtotal) => {
  const directDiscount = normalizeNumber(
    detail?.descuento_aplicado ??
      detail?.descuentoAplicado ??
      detail?.descuento ??
      detail?.discount ??
      0,
  );

  if (directDiscount > 0) return directDiscount;

  const gross = quantity * unitPrice;
  return Math.max(gross - subtotal, 0);
};

const getOrderTotal = (order) =>
  normalizeNumber(order?.total_neto ?? order?.totalNeto ?? order?.total ?? order?.valor_total);

const getOrderPaid = (order) =>
  normalizeNumber(
    order?.total_abonado ??
      order?.totalAbonado ??
      order?.abonado ??
      order?.valor_abonado ??
      order?.pagado
  );

const getOrderPending = (order) => {
  const explicitPending =
    order?.saldo_pendiente ?? order?.saldoPendiente ?? order?.saldo ?? order?.valor_pendiente;
  if (explicitPending !== undefined && explicitPending !== null) {
    return normalizeNumber(explicitPending);
  }

  return Math.max(0, getOrderTotal(order) - getOrderPaid(order));
};

const getOrderDate = (order) =>
  order?.fecha_pedido ?? order?.fechaPedido ?? order?.fecha ?? order?.createdAt;

const getOrderStatusId = (order) =>
  Number(
    order?.idEstado ??
      order?.id_estado_pedido ??
      order?.id_estado ??
      order?.estado?.idEstado ??
      order?.estado?.idestado ??
      order?.estado?.id_estado ??
      1
  );

const getDispatchStatus = (order) => {
  const statusId = getOrderStatusId(order);
  const statusName =
    order?.estado_despacho ||
    order?.estadoDespacho ||
    order?.estado?.nombreEstado ||
    order?.estado?.nombre_estado ||
    order?.estado?.nombre ||
    order?.nombreEstado;

  const normalizedStatusName = String(statusName || "").trim().toLowerCase();
  if (normalizedStatusName) {
    if (normalizedStatusName.includes("pagado")) {
      return "Entregado";
    }

    return statusName;
  }

  const labels = {
    1: "En Proceso",
    2: "Despachado",
    3: "Cancelado",
    4: "Entregado",
    5: "Entregado",
  };
  return labels[statusId] || "En Proceso";
};

const getPaymentStatus = (order) => {
  const status = order?.estado_pago || order?.estadoPago;
  if (getOrderStatusId(order) === 5) {
    return "Pagado";
  }

  if (status) return status;

  const dispatchLikeStatus =
    order?.estado?.nombreEstado ||
    order?.estado?.nombre_estado ||
    order?.estado?.nombre ||
    order?.nombreEstado ||
    "";
  const normalizedDispatchLikeStatus = String(dispatchLikeStatus).trim().toLowerCase();
  if (normalizedDispatchLikeStatus.includes("pagado") || getOrderStatusId(order) === 5) {
    return "Pagado";
  }

  const total = getOrderTotal(order);
  const paid = getOrderPaid(order);
  if (total > 0 && paid >= total) return "Pagado";
  if (paid > 0) return "Parcial";
  return "Pendiente";
};

const normalizeOrder = (order) => ({
  ...order,
  id_pedido: order?.id_pedido ?? order?.idPedido ?? order?.id,
  idPedido: order?.idPedido ?? order?.id_pedido ?? order?.id,
  id_cliente: getOrderCustomerId(order),
  id_vendedor: getOrderSellerId(order),
  total_neto: getOrderTotal(order),
  total_abonado: getOrderPaid(order),
  saldo_pendiente: getOrderPending(order),
  fecha_pedido: getOrderDate(order),
  estado_despacho: getDispatchStatus(order),
  estado_pago: getPaymentStatus(order),
});

const mapPrintableItems = (order) => {
  const details =
    (Array.isArray(order?.detalles) && order.detalles) ||
    (Array.isArray(order?.items) && order.items) ||
    (Array.isArray(order?.productos) && order.productos) ||
    [];

  if (details.length === 0) {
    return [
      {
        codigo: String(order?.id_pedido ?? order?.idPedido ?? order?.id ?? ""),
        descripcion: "Pedido sin detalle disponible",
        cantidad: 1,
        precioUnitario: Number(order?.total_neto ?? 0),
        subtotal: Number(order?.total_neto ?? 0),
        descuento: 0,
        total: Number(order?.total_neto ?? 0),
      },
    ];
  }

  return details.map((detail, index) => {
    const product = detail?.producto || {};
    const quantity = getDetailQuantity(detail);
    const unitPrice = getDetailUnitPrice(detail);
    const subtotal = getDetailSubtotal(detail, quantity, unitPrice);
    const discount = getDetailDiscount(detail, quantity, unitPrice, subtotal);
    const total = normalizeNumber(
      detail?.total ??
        detail?.total_linea ??
        Math.max(subtotal - discount, 0),
    );

    return {
      codigo:
        detail?.referenciaProducto ||
        product?.codigo ||
        product?.sku ||
        product?.referencia ||
        detail?.id_producto ||
        String(index + 1),
      descripcion:
        detail?.nombreProducto ||
        product?.nombre ||
        product?.name ||
        detail?.descripcion ||
        "Producto",
      cantidad: quantity,
      precioUnitario: unitPrice,
      subtotal,
      descuento: discount,
      total,
    };
  });
};

const getDispatchBadgeClass = (status) => {
  const normalized = String(status || "").toLowerCase();
  if (normalized.includes("pagado")) return "bg-emerald-50 text-emerald-700";
  if (normalized.includes("entregado")) return "bg-blue-50 text-blue-700";
  if (normalized.includes("separ")) return "bg-amber-50 text-amber-700";
  if (normalized.includes("cancel")) return "bg-rose-50 text-rose-700";
  return "bg-slate-100 text-slate-700";
};

const getPaymentBadgeClass = (status) => {
  const normalized = String(status || "").toLowerCase();
  if (normalized.includes("pagado")) return "bg-emerald-50 text-emerald-700";
  if (normalized.includes("parcial")) return "bg-amber-50 text-amber-700";
  return "bg-slate-100 text-slate-700";
};

export default function OrderHistoryPage() {
  const { user, loading, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");
  const [printOrder, setPrintOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const roleId = getRoleId(user);
  const isAllowedRole = roleId === 3 || roleId === 4 || roleId === 7;
  const pageTitle = roleId === 3 ? "Mis Ventas" : "Historial de Pedidos";
  const pageSubtitle =
    roleId === 3
      ? "Consulta un resumen de las ventas registradas bajo tu gestion comercial."
      : "Revisa el estado actual de tus compras, sus pagos y avances de despacho.";

  const fetchFirstList = useCallback(async (paths) => {
    for (const path of paths) {
      try {
        const response = await authFetch(`${API_BASE_URL}${path}`);
        if (!response.ok) continue;
        const list = extractList(await response.json().catch(() => ({})));
        if (list.length > 0) return list;
      } catch {
        // Try the next compatible endpoint.
      }
    }

    return [];
  }, []);

  const resolveCustomerIds = useCallback(
    async () => {
      const ids = new Set();
      const userCustomerId = getCustomerIdFromUser(user);
      if (userCustomerId) ids.add(String(userCustomerId));

      if (ids.size > 0) return ids;

      const email = getUserEmail(user);
      if (!email) return ids;

      const customers = await fetchFirstList(["/customers", "/clientes"]);
      customers.forEach((customer) => {
        const customerEmail = getUserEmail(customer);
        const id = getOrderCustomerId({ cliente: customer }) ?? customer?.idCliente ?? customer?.id_cliente ?? customer?.id;
        if (customerEmail === email && id) ids.add(String(id));
      });

      return ids;
    },
    [fetchFirstList, user]
  );

  const resolveSellerIds = useCallback(
    async () => {
      const ids = new Set();
      const userId = getUserId(user);
      const employeeId = getEmployeeIdFromUser(user);
      if (userId) ids.add(String(userId));
      if (employeeId) ids.add(String(employeeId));

      const employees = await fetchFirstList(["/employees", "/empleados"]);
      const email = getUserEmail(user);
      employees.forEach((employee) => {
        const matchedByUserId = userId && String(getEmployeeUserId(employee)) === String(userId);
        const matchedByEmail = email && getEmployeeEmail(employee) === email;
        const id = getEmployeeId(employee);
        if ((matchedByUserId || matchedByEmail) && id) ids.add(String(id));
      });

      return ids;
    },
    [fetchFirstList, user]
  );

  const filterLinkedOrders = useCallback(
    async (orderList) => {
      if (roleId === 4 || roleId === 7) {
        const customerIds = await resolveCustomerIds();
        return orderList.filter((order) => {
          const id = getOrderCustomerId(order);
          return id && customerIds.has(String(id));
        });
      }

      if (roleId === 3) {
        const sellerIds = await resolveSellerIds();
        return orderList.filter((order) => {
          const id = getOrderSellerId(order);
          return id && sellerIds.has(String(id));
        });
      }

      return orderList;
    },
    [resolveCustomerIds, resolveSellerIds, roleId]
  );

  const loadHistory = useCallback(
    async ({ silent = false } = {}) => {
      if (loading || !isAuthenticated || !isAllowedRole) return;

      if (!silent) setPageLoading(true);
      setError("");

      try {
        const historyResponse = await authFetch(`${API_BASE_URL}/orders/history/me`);
        const historyList = historyResponse.ok
          ? extractList(await historyResponse.json().catch(() => ({})))
          : [];

        const fallbackList =
          historyList.length > 0
            ? historyList
            : uniqueById(await fetchFirstList(["/orders", "/pedidos"]));

        const linkedOrders = historyList.length > 0
          ? historyList
          : await filterLinkedOrders(fallbackList);

        setOrders(
          uniqueById(linkedOrders)
            .map(normalizeOrder)
            .sort(
              (a, b) =>
                Number(b.idPedido || b.id_pedido || 0) -
                Number(a.idPedido || a.id_pedido || 0)
            )
        );
      } catch (loadError) {
        setError(loadError.message || "No fue posible cargar el historial solicitado.");
      } finally {
        setPageLoading(false);
      }
    },
    [fetchFirstList, filterLinkedOrders, isAllowedRole, isAuthenticated, loading]
  );

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    if (loading || !isAuthenticated || !isAllowedRole) return undefined;

    const intervalId = window.setInterval(() => {
      loadHistory({ silent: true });
    }, 15000);

    const handleVisibilityChange = () => {
      if (!document.hidden) loadHistory({ silent: true });
    };

    window.addEventListener("focus", handleVisibilityChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleVisibilityChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isAllowedRole, isAuthenticated, loadHistory, loading]);

  const filteredOrders = useMemo(() => {
    if (!searchTerm.trim()) return orders;
    const term = searchTerm.toLowerCase().trim();
    return orders.filter((order) => {
      const orderId = String(order.id_pedido ?? order.idPedido ?? order.id ?? "");
      const dateStr = order.fecha_pedido ? new Date(order.fecha_pedido).toLocaleDateString("es-CO").toLowerCase() : "";
      const customerName = getCustomerName(order).toLowerCase();
      const customerDoc = getCustomerDocument(order).toLowerCase();
      const dispatchStatus = String(order.estado_despacho || "").toLowerCase();
      const paymentStatus = String(order.estado_pago || "").toLowerCase();
      
      return (
        orderId.includes(term) ||
        dateStr.includes(term) ||
        customerName.includes(term) ||
        customerDoc.includes(term) ||
        dispatchStatus.includes(term) ||
        paymentStatus.includes(term)
      );
    });
  }, [orders, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredOrders, currentPage, itemsPerPage]);

  const summary = useMemo(() => {
    const totalPedidos = orders.length;
    const totalFacturado = orders.reduce(
      (acc, order) => acc + Number(order.total_neto ?? order.totalNeto ?? 0),
      0
    );
    const totalAbonado = orders.reduce(
      (acc, order) => acc + Number(order.total_abonado ?? 0),
      0
    );
    const totalPendiente = orders.reduce(
      (acc, order) => acc + Number(order.saldo_pendiente ?? 0),
      0
    );

    return { totalPedidos, totalFacturado, totalAbonado, totalPendiente };
  }, [orders]);

  const handlePrintOrder = useCallback((order) => {
    setPrintOrder(order);
    window.setTimeout(() => window.print(), 100);
  }, []);

  const printableItems = useMemo(() => mapPrintableItems(printOrder), [printOrder]);
  const printableSubtotalSinDescuento = useMemo(
    () => printableItems.reduce((acc, item) => acc + Number(item.subtotal || 0), 0),
    [printableItems]
  );
  const printableDiscountTotal = useMemo(
    () => printableItems.reduce((acc, item) => acc + Number(item.descuento || 0), 0),
    [printableItems]
  );
  const printableSubtotalConDescuento = useMemo(
    () => Math.max(printableSubtotalSinDescuento - printableDiscountTotal, 0),
    [printableDiscountTotal, printableSubtotalSinDescuento]
  );
  const printableTotal = Number(printOrder?.total_neto ?? 0);
  const printableIvaTotal = Math.max(printableTotal - printableSubtotalConDescuento, 0);

  if (!loading && (!isAuthenticated || !isAllowedRole)) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <div className="flex-1">
        <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-3">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
              <ReceiptText className="h-3.5 w-3.5" />
              MSG Repuestos
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-[-0.03em] text-slate-950">
                {pageTitle}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{pageSubtitle}</p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {[
              {
                key: "orders",
                label: "Registros",
                value: summary.totalPedidos,
                icon: ClipboardList,
              },
              {
                key: "gross",
                label: "Total pedido",
                value: formatCurrency(summary.totalFacturado),
                icon: PackageCheck,
              },
              {
                key: "paid",
                label: "Total abonado",
                value: formatCurrency(summary.totalAbonado),
                icon: CreditCard,
              },
              {
                key: "pending",
                label: "Saldo pendiente",
                value: formatCurrency(summary.totalPendiente),
                icon: ReceiptText,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.key}
                  className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {item.label}
                    </p>
                    <div className="rounded-full bg-emerald-50 p-2 text-emerald-600">
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="mt-4 text-2xl font-semibold tracking-[-0.02em] text-slate-950">
                    {item.value}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-8 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Detalle del historial</h2>
              <p className="mt-1 text-sm text-slate-500">
                {roleId === 3
                  ? "Solo se muestran pedidos asociados a tu gestion comercial."
                  : "Solo se muestran los pedidos vinculados a tu cuenta de cliente."}
              </p>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por número, fecha, estado..."
                className="w-full rounded-full border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {pageLoading ? (
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-10 text-center text-sm font-medium text-slate-400">
              Cargando historial...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-4 text-sm font-medium text-red-600">
              {error}
            </div>
          ) : orders.length === 0 ? (
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-10 text-center text-sm font-medium text-slate-400">
              No hay registros disponibles para esta cuenta.
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-10 text-center text-sm font-medium text-slate-400">
              No se encontraron pedidos que coincidan con la búsqueda.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead>
                    <tr className="text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      <th className="px-4 py-3">Pedido</th>
                      <th className="px-4 py-3">Cliente</th>
                      <th className="px-4 py-3">Despacho</th>
                      <th className="px-4 py-3">Pago</th>
                      <th className="px-4 py-3 text-center">Comprobante</th>
                      <th className="px-4 py-3 text-right">Total</th>
                      <th className="px-4 py-3 text-right">Abonado</th>
                      <th className="px-4 py-3 text-right">Saldo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedOrders.map((order) => {
                      const orderId = order.id_pedido ?? order.idPedido ?? order.id;
                      const total = Number(order.total_neto ?? order.totalNeto ?? 0);
                      const paid = Number(order.total_abonado ?? 0);
                      const pending = Number(order.saldo_pendiente ?? 0);
                      const dispatchStatus = order.estado_despacho || "Sin estado";
                      const paymentStatus = order.estado_pago || "Pendiente";

                      return (
                        <tr key={orderId} className="align-top">
                          <td className="px-4 py-4">
                            <p className="text-sm font-semibold text-slate-900">#{orderId}</p>
                            <p className="mt-1 text-xs text-slate-500">
                              {order.fecha_pedido
                                ? new Date(order.fecha_pedido).toLocaleDateString("es-CO")
                                : "Sin fecha"}
                            </p>
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-sm font-medium text-slate-800">{getCustomerName(order)}</p>
                            <p className="mt-1 text-xs text-slate-500">
                              {order?.cliente?.numeroDocumento || order?.cliente?.numero_documento || "Documento no registrado"}
                            </p>
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getDispatchBadgeClass(
                                dispatchStatus
                              )}`}
                            >
                              {dispatchStatus}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getPaymentBadgeClass(
                                paymentStatus
                              )}`}
                            >
                              {paymentStatus}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <button
                              type="button"
                              onClick={() => handlePrintOrder(order)}
                              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                            >
                              <Printer className="h-3.5 w-3.5" />
                              Imprimir
                            </button>
                          </td>
                          <td className="px-4 py-4 text-right text-sm font-semibold text-slate-900">
                            {formatCurrency(total)}
                          </td>
                          <td className="px-4 py-4 text-right text-sm text-slate-700">
                            {formatCurrency(paid)}
                          </td>
                          <td className="px-4 py-4 text-right text-sm font-semibold text-slate-900">
                            {formatCurrency(pending)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Footer de Paginación */}
              {totalPages > 1 && (
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 pt-6">
                  <p className="text-xs font-medium text-slate-500">
                    Mostrando <span className="font-semibold text-slate-800">{(currentPage - 1) * itemsPerPage + 1}</span> a{" "}
                    <span className="font-semibold text-slate-800">
                      {Math.min(currentPage * itemsPerPage, filteredOrders.length)}
                    </span>{" "}
                    de <span className="font-semibold text-slate-800">{filteredOrders.length}</span> registros
                  </p>
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-100 bg-slate-50/50 p-1">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="rounded-full p-1.5 text-slate-500 transition-all hover:bg-white hover:text-slate-700 hover:shadow-sm disabled:pointer-events-none disabled:opacity-40"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`min-w-8 h-8 rounded-full text-xs font-semibold transition-all ${
                          currentPage === pageNum
                            ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                            : "text-slate-500 hover:bg-white hover:text-slate-700 hover:shadow-sm"
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="rounded-full p-1.5 text-slate-500 transition-all hover:bg-white hover:text-slate-700 hover:shadow-sm disabled:pointer-events-none disabled:opacity-40"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      <PrintableDocument
        title="Comprobante de Pedido"
        folio={`PED-${String(printOrder?.id_pedido ?? printOrder?.idPedido ?? "").padStart(4, "0")}`}
        date={
          printOrder?.fecha_pedido
            ? new Date(printOrder.fecha_pedido).toLocaleDateString("es-CO")
            : new Date().toLocaleDateString("es-CO")
        }
        client={{
          name: getCustomerName(printOrder),
          id: getCustomerDocument(printOrder),
          docType: getCustomerDocType(printOrder),
          address: printOrder?.cliente?.direccion || "",
          city:
            printOrder?.cliente?.municipio?.nombre ||
            printOrder?.cliente?.ciudad ||
            "",
          department:
            printOrder?.cliente?.municipio?.departamento?.nombre ||
            printOrder?.cliente?.departamento ||
            "",
          phone: printOrder?.cliente?.telefono || "",
          email: printOrder?.cliente?.email || "",
        }}
        concept={`Detalle del pedido #${printOrder?.id_pedido ?? printOrder?.idPedido ?? ""}`}
        items={printableItems}
        totals={{
          subtotalSinDescuento: printableSubtotalSinDescuento,
          descuentoTotal: printableDiscountTotal,
          subtotalConDescuento: printableSubtotalConDescuento,
          ivaTotal: printableIvaTotal,
          total: printableTotal,
        }}
        footerNote="Documento generado como soporte institucional del pedido solicitado por el cliente."
        type="sale"
        printedBy={user?.nombre || user?.name || user?.email || ""}
      />
      </div>

      <Footer />

      <WhatsAppButton />
    </div>
  );
}
