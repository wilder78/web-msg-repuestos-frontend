import React from "react";
import { formatCurrency, formatNumber } from "../../../lib/format-currency";

const TooltipShell = ({ title, value, subtitle, accent }) => (
  <div className="rounded-lg border border-slate-200/90 bg-white/95 backdrop-blur-sm px-3.5 py-2.5 shadow-xl ring-1 ring-slate-900/5 pointer-events-none min-w-[140px]">
    {title ? (
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1 line-clamp-2">
        {title}
      </p>
    ) : null}
    <p
      className="text-base font-bold tabular-nums leading-tight"
      style={{ color: accent || "#0f172a" }}
    >
      {value}
    </p>
    {subtitle ? (
      <p className="text-[10px] text-slate-400 mt-1">{subtitle}</p>
    ) : null}
  </div>
);

export function CurrencyChartTooltip({
  active,
  payload,
  label,
  valueLabel = "Total",
  labelKey,
}) {
  if (!active || !payload?.length) return null;

  const entry = payload[0];
  const title =
    label ??
    entry.payload?.[labelKey] ??
    entry.payload?.categoria ??
    entry.payload?.zona ??
    entry.payload?.nombreCorto ??
    entry.name;

  return (
    <TooltipShell
      title={title}
      value={formatCurrency(entry.value)}
      subtitle={valueLabel}
      accent="#2563eb"
    />
  );
}

export function PercentChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  const entry = payload[0];
  const title = label ?? entry.payload?.marca ?? entry.payload?.estado ?? entry.name;

  return (
    <TooltipShell
      title={title}
      value={`${formatNumber(entry.value)}%`}
      subtitle="Participación"
      accent="#7c3aed"
    />
  );
}

export function UnitsChartTooltip({ active, payload, label, valueLabel = "Unidades" }) {
  if (!active || !payload?.length) return null;

  const entry = payload[0];
  const title =
    label ?? entry.payload?.nombre ?? entry.payload?.nombreCorto ?? entry.name;

  return (
    <TooltipShell
      title={title}
      value={`${formatNumber(entry.value)} uds`}
      subtitle={valueLabel}
      accent="#0d9488"
    />
  );
}

export function SegmentedChartTooltip({
  active,
  payload,
  label,
  unit = "registro(s)",
  subtitle,
}) {
  if (!active || !payload?.length) return null;

  const entry = payload[0];
  const title = label ?? entry.payload?.estado ?? entry.name;
  const pct = entry.payload?.porcentaje;

  return (
    <TooltipShell
      title={title}
      value={`${formatNumber(entry.value)} ${unit}`}
      subtitle={subtitle ?? (pct != null ? `${pct}% del total` : undefined)}
      accent="#0284c7"
    />
  );
}

export const VisitChartTooltip = (props) => (
  <SegmentedChartTooltip {...props} unit="visita(s)" subtitle="Detalle de ruta" />
);
