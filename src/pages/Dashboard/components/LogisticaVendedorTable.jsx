import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { UserCheck } from "lucide-react";

export default function LogisticaVendedorTable({ data = [], periodLabel }) {
  const maxPedidos = data.reduce((max, row) => Math.max(max, row.pedidosLevantados), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          Rendimiento del Vendedor
        </CardTitle>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
          Empleado (rol vendedor) · pedidos por ID_Vendedor · {periodLabel}
        </p>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-zinc-400 py-16 text-center">
            No hay pedidos levantados por vendedores en el periodo seleccionado.
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-zinc-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-zinc-800/50 text-left text-[11px] uppercase tracking-wide text-slate-500 dark:text-zinc-400">
                  <th className="px-4 py-2.5 font-semibold">#</th>
                  <th className="px-4 py-2.5 font-semibold">Vendedor</th>
                  <th className="px-4 py-2.5 font-semibold">Rol</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Pedidos</th>
                  <th className="px-4 py-2.5 font-semibold w-[28%]">Participación</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, index) => {
                  const pct =
                    maxPedidos > 0
                      ? Math.round((row.pedidosLevantados / maxPedidos) * 100)
                      : 0;

                  return (
                    <tr
                      key={row.idVendedor}
                      className="border-t border-slate-100 dark:border-zinc-800/60 hover:bg-slate-50/80 dark:hover:bg-zinc-800/40"
                    >
                      <td className="px-4 py-3 text-slate-400 dark:text-zinc-500 font-medium">{index + 1}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900 dark:text-zinc-200">{row.nombre}</p>
                        <p className="text-[11px] text-slate-400 dark:text-zinc-500">ID {row.idVendedor}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-[10px] font-normal border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300">
                          {row.rol}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-white">
                        {row.pedidosLevantados}
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-2 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-violet-500 dark:bg-violet-600 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
