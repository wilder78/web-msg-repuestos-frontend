export const formatCurrency = (value) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

export const formatNumber = (value) =>
  new Intl.NumberFormat("es-CO").format(Number(value) || 0);
