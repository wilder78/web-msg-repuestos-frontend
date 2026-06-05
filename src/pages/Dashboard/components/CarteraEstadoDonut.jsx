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
import { PieChart as PieChartIcon } from "lucide-react";
import { SegmentedChartTooltip } from "./DashboardChartTooltip";

export default function CarteraEstadoDonut({ data = [], totalLineas = 0 }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <PieChartIcon className="h-5 w-5 text-emerald-600" />
          Estado de Créditos
        </CardTitle>
        <p className="text-xs text-slate-500 mt-1">
          Distribución por clasificación · {totalLineas} línea(s) de crédito
        </p>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-slate-500 py-16 text-center">
            No hay líneas de crédito para clasificar.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={data}
                innerRadius={70}
                outerRadius={110}
                paddingAngle={4}
                dataKey="cantidad"
                nameKey="estado"
              >
                {data.map((entry, index) => (
                  <Cell key={`estado-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip
                content={(props) => (
                  <SegmentedChartTooltip {...props} unit="crédito(s)" />
                )}
              />
              <Legend
                verticalAlign="bottom"
                height={48}
                formatter={(value) => (
                  <span className="text-xs text-slate-600">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
