import { isWithinRange } from "./dashboard-date-range";

const startOfDay = (date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const toDateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export const getSaleTotal = (sale) =>
  Number(
    sale.totalVenta ??
      sale.total_venta ??
      sale.Total_Venta ??
      sale.valorVenta ??
      sale.valorOriginal ??
      sale.total ??
      0,
  );

export const getSaleDate = (sale) => {
  const raw =
    sale.fechaVenta ??
    sale.fecha_venta ??
    sale.fechaConsolidacion ??
    sale.fechaCreacion ??
    sale.fecha;
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const getSaleClientId = (sale) =>
  sale.pedido?.id_cliente ??
  sale.pedido?.idCliente ??
  sale.id_cliente ??
  sale.idCliente ??
  sale.cliente?.idCliente ??
  sale.cliente?.id_cliente;

export const getSaleOrderId = (sale) =>
  sale.idPedido ??
  sale.id_pedido ??
  sale.pedido?.idPedido ??
  sale.pedido?.id_pedido;

export const getCustomerId = (customer) =>
  customer.idCliente ?? customer.id_cliente ?? customer.id;

export const getCustomerName = (customer) =>
  customer.razonSocial ??
  customer.nombreCliente ??
  customer.nombre_cliente ??
  customer.nombre ??
  customer.razon_social ??
  "Cliente sin nombre";

export const getCustomerTipo = (customer) =>
  customer.tipoCliente ??
  customer.tipo_cliente ??
  customer.tipoNegocio ??
  (customer.esTaller || customer.es_taller ? "Taller" : null) ??
  "Cliente";

const eachDayInRange = (from, to) => {
  const days = [];
  const cursor = startOfDay(new Date(from));
  const end = startOfDay(new Date(to));

  while (cursor <= end) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
};

const formatDayLabel = (date, range) => {
  const sameMonth =
    range.from.getMonth() === range.to.getMonth() &&
    range.from.getFullYear() === range.to.getFullYear();

  if (sameMonth) {
    return String(date.getDate());
  }

  return date.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
};

const formatMonthLabel = (date) =>
  date.toLocaleDateString("es-CO", { month: "short", year: "2-digit" });

/**
 * Tendencia diaria de Total_Venta dentro del rango del filtro global.
 * Si el rango supera 62 días, agrupa por mes para legibilidad.
 */
export const buildTendenciaTemporal = (salesInRange, range) => {
  const daySpan =
    Math.ceil((startOfDay(range.to) - startOfDay(range.from)) / (1000 * 60 * 60 * 24)) + 1;

  if (daySpan > 62) {
    const buckets = {};

    salesInRange.forEach((sale) => {
      const date = getSaleDate(sale);
      if (!date || !isWithinRange(date, range.from, range.to)) return;

      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!buckets[key]) {
        buckets[key] = {
          sortKey: key,
          label: formatMonthLabel(date),
          totalVenta: 0,
          cantidadVentas: 0,
        };
      }
      buckets[key].totalVenta += getSaleTotal(sale);
      buckets[key].cantidadVentas += 1;
    });

    return Object.values(buckets).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }

  const buckets = {};
  eachDayInRange(range.from, range.to).forEach((day) => {
    const key = toDateKey(day);
    buckets[key] = {
      sortKey: key,
      dia: day.getDate(),
      label: formatDayLabel(day, range),
      totalVenta: 0,
      cantidadVentas: 0,
    };
  });

  salesInRange.forEach((sale) => {
    const date = getSaleDate(sale);
    if (!date) return;

    const key = toDateKey(date);
    if (!buckets[key]) {
      buckets[key] = {
        sortKey: key,
        dia: date.getDate(),
        label: formatDayLabel(date, range),
        totalVenta: 0,
        cantidadVentas: 0,
      };
    }
    buckets[key].totalVenta += getSaleTotal(sale);
    buckets[key].cantidadVentas += 1;
  });

  return Object.values(buckets).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
};

export const buildCustomersMap = (customers = []) => {
  const map = new Map();
  customers.forEach((customer) => {
    const id = getCustomerId(customer);
    if (id) map.set(String(id), customer);
  });
  return map;
};

export const buildOrdersMap = (orders = []) => {
  const map = new Map();
  orders.forEach((order) => {
    const id = order.idPedido ?? order.id_pedido ?? order.id;
    if (id) map.set(String(id), order);
  });
  return map;
};

const resolveClientFromSale = (sale, customersMap, ordersMap) => {
  let clientId = getSaleClientId(sale);
  let customer =
    (clientId && customersMap.get(String(clientId))) ||
    sale.cliente ||
    sale.pedido?.cliente;

  if (!clientId) {
    const orderId = getSaleOrderId(sale);
    if (orderId) {
      const order = ordersMap.get(String(orderId));
      clientId =
        order?.idCliente ??
        order?.id_cliente ??
        order?.cliente?.idCliente ??
        order?.cliente?.id_cliente;
      if (!customer && clientId) {
        customer = customersMap.get(String(clientId)) || order?.cliente;
      }
    }
  }

  const id = clientId ? String(clientId) : `anon-${getSaleOrderId(sale) || "sin-id"}`;
  const nombre = customer
    ? getCustomerName(customer)
    : sale.nombreCliente ?? sale.clienteNombre ?? "Cliente sin identificar";
  const tipo = customer ? getCustomerTipo(customer) : "Cliente";

  return { id, nombre, tipo };
};

/**
 * Cruce Ventas → Pedidos → Clientes; orden descendente por volumen facturado.
 */
export const buildTopClientes = (salesInRange, customers = [], orders = []) => {
  const customersMap = buildCustomersMap(customers);
  const ordersMap = buildOrdersMap(orders);
  const totals = new Map();

  salesInRange.forEach((sale) => {
    const total = getSaleTotal(sale);
    const { id, nombre, tipo } = resolveClientFromSale(sale, customersMap, ordersMap);

    if (!totals.has(id)) {
      totals.set(id, {
        idCliente: id,
        nombre,
        tipo,
        totalCompras: 0,
        cantidadVentas: 0,
      });
    }

    const row = totals.get(id);
    row.totalCompras += total;
    row.cantidadVentas += 1;
  });

  return Array.from(totals.values())
    .sort((a, b) => b.totalCompras - a.totalCompras)
    .slice(0, 10)
    .map((row, index) => ({
      ...row,
      totalCompras: Math.round(row.totalCompras),
      rank: index + 1,
      nombreCorto: row.nombre.length > 26 ? `${row.nombre.slice(0, 26)}…` : row.nombre,
    }));
};

export const normalizeBackendTopClientes = (rows = []) =>
  rows
    .map((row, index) => ({
      idCliente: row.idCliente ?? row.id_cliente ?? row.id ?? index,
      nombre: row.nombre ?? row.nombreCliente ?? row.razonSocial ?? row.cliente ?? "Cliente",
      tipo: row.tipo ?? row.tipoCliente ?? "Cliente",
      totalCompras: Math.round(
        Number(row.totalCompras ?? row.total_compras ?? row.totalVenta ?? row.total ?? 0),
      ),
      cantidadVentas: Number(row.cantidadVentas ?? row.cantidad_ventas ?? row.ventas ?? 0),
      rank: index + 1,
      nombreCorto:
        (row.nombre ?? row.nombreCliente ?? "").length > 26
          ? `${(row.nombre ?? row.nombreCliente).slice(0, 26)}…`
          : row.nombre ?? row.nombreCliente ?? "Cliente",
    }))
    .sort((a, b) => b.totalCompras - a.totalCompras)
    .slice(0, 10);
