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
import { Users } from "lucide-react";
import { formatCurrency } from "../../../lib/format-currency";
import { CurrencyChartTooltip } from "./DashboardChartTooltip";

export default function VentasTopClientes({ data = [], periodLabel }) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          Top Clientes / Talleres por Ingresos
        </CardTitle>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
          Cruce Ventas → Pedidos → Clientes · {periodLabel}
        </p>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-zinc-400 py-16 text-center">
            No hay clientes con ventas en el periodo filtrado.
          </p>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={320}>
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
                  width={130}
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
                      valueLabel="Total compras"
                    />
                  )}
                  cursor={{ fill: document.documentElement.classList.contains("dark") ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.02)" }}
                />
                <Bar
                  dataKey="totalCompras"
                  fill="#4f46e5"
                  radius={[0, 6, 6, 0]}
                  barSize={22}
                  cursor="pointer"
                />
              </BarChart>
            </ResponsiveContainer>

            <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-zinc-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-zinc-800/50 text-left text-[11px] uppercase tracking-wide text-slate-500 dark:text-zinc-400">
                    <th className="px-3 py-2.5 font-semibold">#</th>
                    <th className="px-3 py-2.5 font-semibold">Cliente / Taller</th>
                    <th className="px-3 py-2.5 font-semibold text-right">Ventas</th>
                    <th className="px-3 py-2.5 font-semibold text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row) => (
                    <tr
                      key={row.idCliente}
                      className="border-t border-slate-100 dark:border-zinc-800/60 hover:bg-slate-50/80 dark:hover:bg-zinc-800/40"
                    >
                      <td className="px-3 py-2.5 text-slate-400 dark:text-zinc-500 font-medium">{row.rank}</td>
                      <td className="px-3 py-2.5">
                        <p className="font-medium text-slate-900 dark:text-zinc-200 line-clamp-1">{row.nombre}</p>
                        <Badge variant="outline" className="mt-1 text-[10px] font-normal border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300">
                          {row.tipo}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 text-right text-slate-600 dark:text-zinc-400">
                        {row.cantidadVentas}
                      </td>
                      <td className="px-3 py-2.5 text-right font-semibold text-indigo-700 dark:text-indigo-400">
                        {formatCurrency(row.totalCompras)}
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
