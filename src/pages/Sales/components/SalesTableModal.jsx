import React from "react";
import { Eye, FileText } from "lucide-react";
import { cn } from "../../../lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";

export default function SalesTableModal({ ventas = [], onView, onPdf }) {
  if (ventas.length === 0) {
    return (
      <div className="text-center py-20 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700/60">
        <p className="text-slate-500 dark:text-zinc-400 font-medium">
          No se encontraron ventas
        </p>
        <p className="text-slate-400 dark:text-zinc-500 text-sm">
          Prueba con otros términos de búsqueda
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader className="bg-slate-50/50 dark:bg-zinc-800/40">
          <TableRow className="hover:bg-transparent border-none">
            <TableHead className="px-6 py-4 whitespace-nowrap text-slate-400 dark:text-slate-200 font-bold uppercase text-[11px] tracking-wider">ID Venta</TableHead>
            <TableHead className="px-6 py-4 text-slate-400 dark:text-slate-200 font-bold uppercase text-[11px] tracking-wider">Cliente / Razón Social</TableHead>
            <TableHead className="px-6 py-4 text-slate-400 dark:text-slate-200 font-bold uppercase text-[11px] tracking-wider">Fecha Consolidación</TableHead>
            <TableHead className="px-6 py-4 text-slate-400 dark:text-slate-200 font-bold uppercase text-[11px] tracking-wider">Valor de Venta</TableHead>
            <TableHead className="px-6 py-4 text-center text-slate-400 dark:text-slate-200 font-bold uppercase text-[11px] tracking-wider">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ventas.map((venta) => (
            <TableRow
              key={venta.id}
              className="group hover:bg-blue-50/60 dark:hover:bg-slate-700/30 transition-colors"
            >
              <TableCell className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-slate-700 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <FileText size={16} />
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-slate-200">{venta.id}</span>
                </div>
              </TableCell>
              <TableCell className="px-6 py-4">
                <div className="font-medium text-slate-900 dark:text-slate-200">{venta.cliente}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{venta.identificacion}</div>
              </TableCell>
              <TableCell className="px-6 py-4 text-slate-600 dark:text-slate-350">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                  {venta.fecha}
                </div>
              </TableCell>
              <TableCell className="px-6 py-4 font-semibold text-emerald-600 dark:text-emerald-400">
                {venta.valor}
              </TableCell>
              <TableCell className="px-6 py-4">
                <div className="flex items-center justify-center gap-3">
                  <button
                     onClick={() => onView && onView(venta)}
                     className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-zinc-800/50 rounded-lg transition-colors"
                     title="Ver detalles"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                     onClick={() => onPdf && onPdf(venta)}
                     className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-zinc-800/50 rounded-lg transition-colors"
                     title="Descargar PDF"
                  >
                    <FileText size={18} />
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
