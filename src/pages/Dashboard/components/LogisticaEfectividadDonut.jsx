import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Route } from "lucide-react";
import { VisitChartTooltip } from "./DashboardChartTooltip";

export default function LogisticaEfectividadDonut({
  distribucion = [],
  resumenComparativo = [],
  totalVisitas = 0,
  efectividadPct = 0,
  visitasExitosas = 0,
  visitasImprevistas = 0,
  periodLabel,
}) {
  const chartData =
    distribucion.length > 0
      ? distribucion
      : resumenComparativo.map((row) => ({
          estado: row.estado,
          cantidad: row.cantidad,
          porcentaje: row.porcentaje,
          color: row.color,
        }));

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <Route className="h-5 w-5 text-sky-600 dark:text-sky-400" />
            Efectividad de Visitas
          </CardTitle>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Detalle_Ruta · Estado_Visita · {periodLabel}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge className="bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 border-none">
            {efectividadPct}% efectividad
          </Badge>
          <Badge variant="outline" className="text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-700">
            {visitasExitosas} entregas · {visitasImprevistas} imprevistos
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-zinc-400 py-16 text-center">
            No hay visitas de ruta registradas en el periodo seleccionado.
          </p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-center">
            <ResponsiveContainer width="100%" height={340}>
              <PieChart>
                <Pie
                  data={chartData}
                  innerRadius={78}
                  outerRadius={118}
                  paddingAngle={4}
                  dataKey="cantidad"
                  nameKey="estado"
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`visita-${index}`}
                      fill={entry.color}
                      stroke="none"
                    />
                  ))}
                </Pie>
                <Tooltip content={(props) => <VisitChartTooltip {...props} />} />
                <Legend
                  verticalAlign="bottom"
                  height={52}
                  formatter={(value) => (
                    <span className="text-xs text-slate-600 dark:text-zinc-400">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="space-y-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-950/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-400">
                Resumen del periodo
              </p>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-zinc-400">Total visitas</span>
                <span className="font-semibold text-slate-900 dark:text-white">{totalVisitas}</span>
              </div>
              {resumenComparativo.map((row) => (
                <div
                  key={row.estado}
                  className="flex justify-between items-center text-sm border-t border-slate-200/80 dark:border-zinc-800 pt-2"
                >
                  <span className="flex items-center gap-2 text-slate-600 dark:text-zinc-400">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: row.color }}
                    />
                    {row.estado}
                  </span>
                  <span className="font-medium text-slate-900 dark:text-zinc-200">
                    {row.cantidad} ({row.porcentaje}%)
                  </span>
                </div>
              ))}
              {distribucion.length > 2 && (
                <div className="pt-2 border-t border-slate-200/80 dark:border-zinc-800 space-y-1.5">
                  <p className="text-[11px] font-semibold uppercase text-slate-400 dark:text-zinc-500">
                    Detalle por estado
                  </p>
                  {distribucion.map((row) => (
                    <div
                      key={row.estado}
                      className="flex justify-between text-xs text-slate-600 dark:text-zinc-400"
                    >
                      <span>{row.estado}</span>
                      <span>{row.cantidad}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
