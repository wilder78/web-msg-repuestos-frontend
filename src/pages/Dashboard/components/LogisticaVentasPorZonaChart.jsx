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
import { MapPin } from "lucide-react";
import { CurrencyChartTooltip } from "./DashboardChartTooltip";

export default function LogisticaVentasPorZonaChart({ data = [], periodLabel }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          Rendimiento de Ventas por Zona
        </CardTitle>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
          Ingresos facturados agrupados por ID_Zona · {periodLabel}
        </p>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-zinc-400 py-16 text-center">
            No hay ventas con zona asignada en el periodo seleccionado.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data} margin={{ bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={document.documentElement.classList.contains("dark") ? "rgba(255,255,255,0.05)" : "#f1f5f9"} />
              <XAxis
                dataKey="zona"
                axisLine={false}
                tickLine={false}
                className="fill-slate-400 dark:fill-zinc-500"
                tick={{ fontSize: 11, fill: "currentColor" }}
                interval={0}
                angle={data.length > 5 ? -25 : 0}
                textAnchor={data.length > 5 ? "end" : "middle"}
                height={data.length > 5 ? 72 : 32}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                className="fill-slate-500 dark:fill-zinc-400"
                tick={{ fontSize: 11, fill: "currentColor" }}
                tickFormatter={(v) =>
                  v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : `${(v / 1000).toFixed(0)}k`
                }
              />
              <Tooltip
                content={(props) => (
                  <CurrencyChartTooltip
                    {...props}
                    labelKey="zona"
                    valueLabel="Ingresos facturados"
                  />
                )}
                cursor={{ fill: document.documentElement.classList.contains("dark") ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.02)" }}
              />
              <Bar
                dataKey="ingresos"
                fill="#0ea5e9"
                radius={[4, 4, 0, 0]}
                barSize={36}
                cursor="pointer"
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
