import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { TrendingUp } from "lucide-react";
import { CurrencyChartTooltip } from "./DashboardChartTooltip";

export default function VentasTendenciaChart({ data = [], periodLabel, isMonthlyBuckets }) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          Tendencia Temporal de Facturación
        </CardTitle>
        <p className="text-xs text-slate-500 mt-1">
          Monto facturado (Total_Venta) · {periodLabel}
          {isMonthlyBuckets ? " · agrupado por mes" : " · por día del periodo"}
        </p>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-slate-500 py-16 text-center">
            No hay ventas en el periodo seleccionado para graficar la tendencia.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11 }}
                interval={data.length > 20 ? Math.floor(data.length / 12) : 0}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11 }}
                tickFormatter={(v) =>
                  v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v
                }
              />
              <Tooltip
                content={(props) => (
                  <CurrencyChartTooltip
                    {...props}
                    label={
                      props.label
                        ? isMonthlyBuckets
                          ? `Mes: ${props.label}`
                          : `Día ${props.label}`
                        : undefined
                    }
                    valueLabel={`Facturado${
                      props.payload?.[0]?.payload?.cantidadVentas != null
                        ? ` · ${props.payload[0].payload.cantidadVentas} venta(s)`
                        : ""
                    }`}
                  />
                )}
                cursor={{ stroke: "#cbd5e1", strokeWidth: 1 }}
              />
              <Line
                type="monotone"
                dataKey="totalVenta"
                stroke="#2563eb"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#2563eb" }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
