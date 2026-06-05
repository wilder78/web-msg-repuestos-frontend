export const DATE_PRESETS = {
  TODAY: "today",
  WEEK: "week",
  MONTH: "month",
  YEAR: "year",
  CUSTOM: "custom",
};

export const DATE_PRESET_LABELS = {
  [DATE_PRESETS.TODAY]: "Hoy",
  [DATE_PRESETS.WEEK]: "Esta Semana",
  [DATE_PRESETS.MONTH]: "Este Mes",
  [DATE_PRESETS.YEAR]: "Año",
  [DATE_PRESETS.CUSTOM]: "Personalizado",
};

const startOfDay = (date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const endOfDay = (date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

export const toDateParam = (date) => {
  if (!date) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export const resolveDateRange = (preset, customFrom, customTo) => {
  const now = new Date();
  let from = startOfDay(now);
  let to = endOfDay(now);

  switch (preset) {
    case DATE_PRESETS.WEEK: {
      const start = new Date(now);
      start.setDate(start.getDate() - 6);
      from = startOfDay(start);
      break;
    }
    case DATE_PRESETS.MONTH:
      from = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
      break;
    case DATE_PRESETS.YEAR:
      from = startOfDay(new Date(now.getFullYear(), 0, 1));
      break;
    case DATE_PRESETS.CUSTOM: {
      if (customFrom) from = startOfDay(new Date(`${customFrom}T00:00:00`));
      if (customTo) to = endOfDay(new Date(`${customTo}T00:00:00`));
      if (from > to) {
        const swap = from;
        from = startOfDay(to);
        to = endOfDay(swap);
      }
      break;
    }
    case DATE_PRESETS.TODAY:
    default:
      break;
  }

  return { from, to };
};

export const getPreviousPeriod = ({ from, to }) => {
  const durationMs = to.getTime() - from.getTime();
  const prevTo = new Date(from.getTime() - 1);
  const prevFrom = new Date(prevTo.getTime() - durationMs);
  return { from: startOfDay(prevFrom), to: endOfDay(prevTo) };
};

export const formatPeriodLabel = (preset, { from, to }) => {
  if (preset === DATE_PRESETS.TODAY) return "Hoy";
  if (preset === DATE_PRESETS.WEEK) return "Esta semana";
  if (preset === DATE_PRESETS.MONTH) return "Este mes";
  if (preset === DATE_PRESETS.YEAR) return `Año ${from.getFullYear()}`;
  return `${toDateParam(from)} — ${toDateParam(to)}`;
};

export const buildDateQuery = (from, to) => {
  const fechaDesde = toDateParam(from);
  const fechaHasta = toDateParam(to);
  const params = new URLSearchParams({
    fechaDesde,
    fechaHasta,
    from: fechaDesde,
    to: fechaHasta,
    startDate: fechaDesde,
    endDate: fechaHasta,
  });
  return params.toString();
};

export const isWithinRange = (date, from, to) => {
  if (!date) return false;
  const time = date.getTime();
  return time >= from.getTime() && time <= to.getTime();
};
