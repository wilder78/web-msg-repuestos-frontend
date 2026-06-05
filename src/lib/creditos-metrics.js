import { normalizeCredit } from "../hooks/useCreditos";

export const CREDIT_STATUS_BUCKETS = {
  AL_DIA: "Activos / Al día",
  MORA: "Mora Temprana",
  SUSPENDIDO: "Suspendidos",
};

const STATUS_COLORS = {
  [CREDIT_STATUS_BUCKETS.AL_DIA]: "#16a34a",
  [CREDIT_STATUS_BUCKETS.MORA]: "#ea580c",
  [CREDIT_STATUS_BUCKETS.SUSPENDIDO]: "#dc2626",
};

export const getCupoUtilizado = (credit) =>
  Number(
    credit.cupoUtilizado ??
      credit.cupo_utilizado ??
      credit.Cupo_Utilizado ??
      0,
  );

export const getCupoDisponible = (credit) => {
  const explicit =
    credit.cupoDisponible ?? credit.cupo_disponible ?? credit.Cupo_Disponible;
  if (explicit !== undefined && explicit !== null && !Number.isNaN(Number(explicit))) {
    return Number(explicit);
  }
  const aprobado = Number(credit.cupoAprobado ?? credit.cupo_aprobado ?? 0);
  return Math.max(0, aprobado - getCupoUtilizado(credit));
};

export const getCreditStatusId = (credit) =>
  Number(
    credit.idEstadoCredito ??
      credit.id_estado_credito ??
      credit.idEstado ??
      credit.id_estado ??
      1,
  );

export const classifyCreditStatus = (credit) => {
  const statusId = getCreditStatusId(credit);
  const estadoTexto = String(
    credit.estado ?? credit.nombreEstado ?? credit.nombre_estado ?? "",
  ).toLowerCase();

  if (
    statusId === 3 ||
    estadoTexto.includes("mora") ||
    estadoTexto.includes("vencid") ||
    estadoTexto.includes("atras")
  ) {
    return CREDIT_STATUS_BUCKETS.MORA;
  }

  if (
    statusId === 2 ||
    statusId === 0 ||
    estadoTexto.includes("suspend") ||
    estadoTexto.includes("bloque") ||
    estadoTexto.includes("inactiv")
  ) {
    return CREDIT_STATUS_BUCKETS.SUSPENDIDO;
  }

  return CREDIT_STATUS_BUCKETS.AL_DIA;
};

export const isCreditAlertStatus = (credit) => {
  const bucket = classifyCreditStatus(credit);
  return bucket === CREDIT_STATUS_BUCKETS.MORA || bucket === CREDIT_STATUS_BUCKETS.SUSPENDIDO;
};

const getClientName = (credit, customersMap) => {
  if (credit.clienteNombre) return credit.clienteNombre;
  const id = credit.idCliente ?? credit.id_cliente;
  const customer = id ? customersMap.get(String(id)) : null;
  return (
    customer?.razonSocial ??
    customer?.nombreCliente ??
    customer?.nombre ??
    (id ? `Cliente #${id}` : "Cliente")
  );
};

export const computeCarteraMetrics = (rawCredits = [], customers = []) => {
  const credits = rawCredits.map((row) => normalizeCredit(row));

  const customersMap = new Map();
  customers.forEach((customer) => {
    const id = customer.idCliente ?? customer.id_cliente ?? customer.id;
    if (id) customersMap.set(String(id), customer);
  });

  let carteraTotalColocada = 0;
  let cupoDisponibleGlobal = 0;
  let creditosEnAlerta = 0;

  const statusCounts = {
    [CREDIT_STATUS_BUCKETS.AL_DIA]: 0,
    [CREDIT_STATUS_BUCKETS.MORA]: 0,
    [CREDIT_STATUS_BUCKETS.SUSPENDIDO]: 0,
  };

  const deudaPorCliente = new Map();

  credits.forEach((credit) => {
    const utilizado = getCupoUtilizado(credit);
    const disponible = getCupoDisponible(credit);
    const bucket = classifyCreditStatus(credit);

    carteraTotalColocada += utilizado;
    cupoDisponibleGlobal += disponible;
    statusCounts[bucket] = (statusCounts[bucket] || 0) + 1;

    if (isCreditAlertStatus(credit)) {
      creditosEnAlerta += 1;
    }

    const clientId = String(credit.idCliente ?? credit.id_cliente ?? credit.idCredito);
    const nombre = getClientName(credit, customersMap);

    if (!deudaPorCliente.has(clientId)) {
      deudaPorCliente.set(clientId, {
        idCliente: clientId,
        nombre,
        deudaTotal: 0,
        lineasCredito: 0,
      });
    }

    const row = deudaPorCliente.get(clientId);
    row.deudaTotal += utilizado;
    row.lineasCredito += 1;
  });

  const totalLineas = credits.length || 1;

  const distribucionEstado = Object.entries(statusCounts)
    .filter(([, cantidad]) => cantidad > 0)
    .map(([estado, cantidad]) => ({
      estado,
      cantidad,
      porcentaje: Math.round((cantidad / totalLineas) * 100),
      color: STATUS_COLORS[estado],
    }));

  const topDeudaClientes = Array.from(deudaPorCliente.values())
    .sort((a, b) => b.deudaTotal - a.deudaTotal)
    .slice(0, 5)
    .map((row, index) => ({
      ...row,
      deudaTotal: Math.round(row.deudaTotal),
      rank: index + 1,
      nombreCorto: row.nombre.length > 28 ? `${row.nombre.slice(0, 28)}…` : row.nombre,
    }));

  return {
    carteraTotalColocada,
    cupoDisponibleGlobal,
    creditosEnAlerta,
    totalLineasCredito: credits.length,
    distribucionEstado,
    topDeudaClientes,
  };
};

export const mergeBackendCarteraSummary = (computed, backendPayload) => {
  if (!backendPayload || typeof backendPayload !== "object") return computed;

  const cartera =
    backendPayload.carteraTotalColocada ??
    backendPayload.cartera_total_colocada ??
    backendPayload.totalCupoUtilizado;

  const disponible =
    backendPayload.cupoDisponibleGlobal ??
    backendPayload.cupo_disponible_global ??
    backendPayload.totalCupoDisponible;

  const alertas =
    backendPayload.creditosEnAlerta ??
    backendPayload.creditos_en_alerta ??
    backendPayload.enMora;

  return {
    ...computed,
    carteraTotalColocada: cartera !== undefined ? Number(cartera) : computed.carteraTotalColocada,
    cupoDisponibleGlobal:
      disponible !== undefined ? Number(disponible) : computed.cupoDisponibleGlobal,
    creditosEnAlerta: alertas !== undefined ? Number(alertas) : computed.creditosEnAlerta,
    fromBackend: true,
  };
};
