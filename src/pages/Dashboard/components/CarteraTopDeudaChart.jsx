import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Scale } from "lucide-react";
import { formatCurrency } from "../../../lib/format-currency";
import { CurrencyChartTooltip } from "./DashboardChartTooltip";

export default function CarteraTopDeudaChart({ data = [] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Scale className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          Top 5 — Clientes con Mayor Deuda
        </CardTitle>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
          Suma de Cupo_Utilizado por cliente (Créditos × Clientes)
        </p>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-zinc-400 py-16 text-center">
            No hay saldos de crédito registrados para mostrar.
          </p>
        ) : (
          <div className="space-y-6">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={document.documentElement.classList.contains("dark") ? "rgba(255,255,255,0.05)" : "#f1f5f9"} />
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  className="fill-slate-400 dark:fill-zinc-500"
                  tick={{ fontSize: 11, fill: "currentColor" }}
                  tickFormatter={(v) =>
                    v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : `${(v / 1000).toFixed(0)}k`
                  }
                />
                <YAxis
                  type="category"
                  dataKey="nombreCorto"
                  width={140}
                  axisLine={false}
                  tickLine={false}
                  className="fill-slate-500 dark:fill-zinc-400"
                  tick={{ fontSize: 11, fill: "currentColor" }}
                />
                <Tooltip
                  content={(props) => (
                    <CurrencyChartTooltip
                      {...props}
                      label={props.payload?.[0]?.payload?.nombre}
                      valueLabel="Deuda (cupo utilizado)"
                    />
                  )}
                  cursor={{ fill: document.documentElement.classList.contains("dark") ? "rgba(255, 255, 255, 0.05)" : "rgba(124, 58, 237, 0.02)" }}
                />
                <Bar
                  dataKey="deudaTotal"
                  fill="#7c3aed"
                  radius={[0, 6, 6, 0]}
                  barSize={24}
                  cursor="pointer"
                />
              </BarChart>
            </ResponsiveContainer>

            <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-zinc-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-zinc-800/50 text-left text-[11px] uppercase tracking-wide text-slate-500 dark:text-zinc-400">
                    <th className="px-3 py-2 font-semibold">#</th>
                    <th className="px-3 py-2 font-semibold">Cliente / Taller</th>
                    <th className="px-3 py-2 font-semibold text-center">Líneas</th>
                    <th className="px-3 py-2 font-semibold text-right">Deuda</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row) => (
                    <tr key={row.idCliente} className="border-t border-slate-100 dark:border-zinc-800/60 hover:bg-slate-50/80 dark:hover:bg-zinc-800/40">
                      <td className="px-3 py-2.5 text-slate-400 dark:text-zinc-500">{row.rank}</td>
                      <td className="px-3 py-2.5 font-medium text-slate-900 dark:text-zinc-200">{row.nombre}</td>
                      <td className="px-3 py-2.5 text-center">
                        <Badge variant="outline" className="text-[10px] border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300">
                          {row.lineasCredito}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 text-right font-semibold text-violet-700 dark:text-violet-400">
                        {formatCurrency(row.deudaTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
