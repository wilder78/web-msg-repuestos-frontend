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
import { Layers } from "lucide-react";
import { UnitsChartTooltip } from "./DashboardChartTooltip";

export default function InventarioTopStockChart({ data = [] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Layers className="h-5 w-5 text-teal-600" />
          Top 10 — Mayor Stock en Bodega
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-slate-500 py-16 text-center">
            No hay productos activos para comparar existencias.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="nombreCorto"
                width={140}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                content={(props) => (
                  <UnitsChartTooltip
                    {...props}
                    label={props.payload?.[0]?.payload?.nombre}
                    valueLabel="Stock en buen estado"
                  />
                )}
                cursor={{ fill: "#f0fdfa" }}
              />
              <Bar
                dataKey="stock"
                fill="#0d9488"
                radius={[0, 6, 6, 0]}
                barSize={22}
                cursor="pointer"
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
