import { isWithinRange } from "./dashboard-date-range";
import { getSaleTotal, getSaleDate, getSaleClientId } from "./ventas-metrics";

const filterByRange = (items, getDateFn, range) => {
  if (!range) return items;
  return items.filter((item) => {
    const date = getDateFn(item);
    return isWithinRange(date, range.from, range.to);
  });
};

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const normalizeEstadoVisita = (detalle) =>
  String(
    detalle.estadoVisita ??
      detalle.estado_visita ??
      detalle.Estado_Visita ??
      detalle.nombreEstadoVisita ??
      "",
  )
    .trim()
    .toLowerCase();

export const classifyEstadoVisita = (detalle) => {
  const estado = normalizeEstadoVisita(detalle);
  const estadoId = Number(
    detalle.idEstadoVisita ?? detalle.id_estado_visita ?? detalle.idEstado ?? NaN,
  );

  if (
    estado.includes("entregad") ||
    estado.includes("complet") ||
    estado.includes("exitos") ||
    estado.includes("realizad") ||
    estadoId === 1
  ) {
    return "Entregado";
  }

  if (estado.includes("ausente") || estado.includes("no encontr")) {
    return "Cliente Ausente";
  }

  if (estado.includes("rechaz") || estado.includes("cancel") || estadoId === 3) {
    return "Rechazado";
  }

  if (estado.includes("pendiente") || estadoId === 0) {
    return "Pendiente";
  }

  return "Otro";
};

const VISIT_COLORS = {
  Entregado: "#16a34a",
  "Cliente Ausente": "#ea580c",
  Rechazado: "#dc2626",
  Pendiente: "#94a3b8",
  Otro: "#64748b",
};

export const extractDetallesRuta = (routes = [], range) => {
  const detalles = [];

  routes.forEach((route) => {
    const routeDate = parseDate(
      route.fechaPlanificada ?? route.fecha_planificada ?? route.fecha,
    );

    if (range && routeDate && !isWithinRange(routeDate, range.from, range.to)) {
      return;
    }

    const lista =
      route.detalles ??
      route.detalleRuta ??
      route.detalle_ruta ??
      route.detallesRuta ??
      [];

    lista.forEach((detalle, index) => {
      detalles.push({
        ...detalle,
        idRuta: route.idRuta ?? route.id_ruta,
        idZona: route.idZona ?? route.id_zona ?? route.zona?.idZona,
        ordenVisita: detalle.ordenVisita ?? detalle.orden_visita ?? index + 1,
      });
    });
  });

  return detalles;
};

export const buildEfectividadVisitas = (detalles = []) => {
  const counts = {
    Entregado: 0,
    "Cliente Ausente": 0,
    Rechazado: 0,
    Pendiente: 0,
    Otro: 0,
  };

  detalles.forEach((detalle) => {
    const bucket = classifyEstadoVisita(detalle);
    counts[bucket] = (counts[bucket] || 0) + 1;
  });

  const total = detalles.length || 1;
  const exitosas = counts.Entregado;
  const imprevistos = counts["Cliente Ausente"] + counts.Rechazado;
  const efectividadPct = detalles.length
    ? Math.round((exitosas / detalles.length) * 100)
    : 0;

  const distribucion = Object.entries(counts)
    .filter(([, cantidad]) => cantidad > 0)
    .map(([estado, cantidad]) => ({
      estado,
      cantidad,
      porcentaje: Math.round((cantidad / total) * 100),
      color: VISIT_COLORS[estado],
      tipo: estado === "Entregado" ? "exito" : ["Cliente Ausente", "Rechazado"].includes(estado) ? "imprevisto" : "otro",
    }));

  return {
    distribucion,
    totalVisitas: detalles.length,
    visitasExitosas: exitosas,
    visitasImprevistas: imprevistos,
    efectividadPct,
    resumenComparativo: [
      {
        estado: "Completadas con éxito",
        cantidad: exitosas,
        porcentaje: Math.round((exitosas / total) * 100),
        color: "#16a34a",
      },
      {
        estado: "Imprevistos",
        cantidad: imprevistos,
        porcentaje: Math.round((imprevistos / total) * 100),
        color: "#dc2626",
      },
    ].filter((row) => row.cantidad > 0),
  };
};

export const buildVentasPorZona = (salesInRange = [], customers = [], zones = []) => {
  const zonesMap = {};
  zones.forEach((z) => {
    const id = z.idZona ?? z.id_zona ?? z.id;
    if (id) zonesMap[String(id)] = z.nombreZona ?? z.nombre_zona ?? z.nombre ?? `Zona ${id}`;
  });

  const customersMap = new Map();
  customers.forEach((customer) => {
    const id = customer.idCliente ?? customer.id_cliente ?? customer.id;
    if (id) customersMap.set(String(id), customer);
  });

  const totals = {};

  salesInRange.forEach((sale) => {
    const clientId = getSaleClientId(sale);
    const customer = clientId ? customersMap.get(String(clientId)) : null;
    const zoneId =
      customer?.idZona ??
      customer?.id_zona ??
      sale.pedido?.cliente?.idZona ??
      sale.pedido?.cliente?.id_zona ??
      sale.idZona ??
      sale.id_zona ??
      "sin-zona";
    const zoneName = zonesMap[String(zoneId)] || customer?.zona?.nombreZona || "Sin zona";

    totals[zoneName] = (totals[zoneName] || 0) + getSaleTotal(sale);
  });

  return Object.entries(totals)
    .map(([zona, ingresos]) => ({ zona, ingresos: Math.round(ingresos) }))
    .sort((a, b) => b.ingresos - a.ingresos)
    .slice(0, 10);
};

const isVendedorEmployee = (employee) => {
  const rol = String(
    employee.rolOperativo ??
      employee.rol_operativo ??
      employee.cargo ??
      employee.usuario?.rol?.nombre ??
      "",
  ).toLowerCase();

  if (rol.includes("vendedor") || rol.includes("asesor") || rol.includes("comercial")) {
    return true;
  }

  const roleId =
    employee.usuario?.idRol ??
    employee.usuario?.id_rol ??
    employee.idRol ??
    employee.id_rol;

  return Number(roleId) === 2 || Number(roleId) === 3;
};

export const getEmployeeSellerKey = (employee) => {
  const userId =
    employee.idUsuario ??
    employee.id_usuario ??
    employee.usuario?.idUsuario ??
    employee.usuario?.id_usuario;
  const employeeId = employee.idEmpleado ?? employee.id_empleado ?? employee.id;

  return String(userId ?? employeeId ?? "");
};

export const getEmployeeName = (employee) => {
  const full = [employee.nombre || employee.nombres, employee.apellido || employee.apellidos]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    full ||
    employee.nombreUsuario ||
    employee.usuario?.nombreUsuario ||
    employee.email ||
    "Vendedor"
  );
};

export const buildRendimientoVendedores = (ordersInRange = [], employees = []) => {
  const vendedores = employees.filter(isVendedorEmployee);
  const sellerMap = new Map();
  const aliasMap = new Map();

  vendedores.forEach((emp) => {
    const empId = String(emp.idEmpleado ?? emp.id_empleado ?? emp.id);
    const userId = String(
      emp.idUsuario ??
        emp.id_usuario ??
        emp.usuario?.idUsuario ??
        emp.usuario?.id_usuario ??
        "",
    );

    sellerMap.set(empId, {
      idVendedor: userId || empId,
      idEmpleado: empId,
      nombre: getEmployeeName(emp),
      rol: emp.rolOperativo ?? emp.rol_operativo ?? emp.cargo ?? "Vendedor",
      pedidosLevantados: 0,
    });

    if (userId && userId !== empId) aliasMap.set(userId, empId);
  });

  const lookupEmployee = (id) =>
    vendedores.find((e) => {
      const eid = String(e.idEmpleado ?? e.id_empleado ?? e.id);
      const uid = String(
        e.idUsuario ?? e.id_usuario ?? e.usuario?.idUsuario ?? "",
      );
      return eid === id || (uid && uid === id);
    });

  ordersInRange.forEach((order) => {
    const rawId = String(
      order.idVendedor ??
        order.id_vendedor ??
        order.vendedor?.idUsuario ??
        order.vendedor?.id_usuario ??
        order.idEmpleado ??
        order.id_empleado ??
        "",
    );

    if (!rawId) return;

    const empKey = aliasMap.get(rawId) || rawId;

    if (!sellerMap.has(empKey)) {
      const found = lookupEmployee(rawId);
      sellerMap.set(empKey, {
        idVendedor: rawId,
        nombre: order.nombreVendedor || (found ? getEmployeeName(found) : `Vendedor #${rawId}`),
        rol: "Vendedor",
        pedidosLevantados: 0,
      });
    }

    sellerMap.get(empKey).pedidosLevantados += 1;
  });

  return Array.from(sellerMap.values())
    .filter((row) => row.pedidosLevantados > 0)
    .sort((a, b) => b.pedidosLevantados - a.pedidosLevantados);
};

export const computeLogisticaView = ({
  routes,
  sales,
  orders,
  customers,
  zones,
  employees,
  range,
}) => {
  const salesInRange = filterByRange(sales, getSaleDate, range);
  const ordersInRange = filterByRange(
    orders,
    (order) =>
      parseDate(
        order.fechaPedido ?? order.fecha_pedido ?? order.fecha ?? order.fechaCreacion,
      ),
    range,
  );

  const detalles = extractDetallesRuta(routes, range);
  const efectividadVisitas = buildEfectividadVisitas(detalles);
  const ventasPorZona = buildVentasPorZona(salesInRange, customers, zones);
  const rendimientoVendedores = buildRendimientoVendedores(ordersInRange, employees);

  return {
    ...efectividadVisitas,
    ventasPorZona,
    rendimientoVendedores,
    rutasEnPeriodo: routes.filter((route) => {
      const d = parseDate(route.fechaPlanificada ?? route.fecha_planificada);
      return !range || !d || isWithinRange(d, range.from, range.to);
    }).length,
  };
};
