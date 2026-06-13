import React from "react";
import { Mail, Phone, ShoppingBag, DollarSign, Eye, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { Avatar, AvatarFallback } from "../../../components/ui/avatar";
import { Button } from "../../../components/ui/button";

export function ClientPurchaseHistoryTable({
  customers,
  loading,
  onViewDetails,
}) {
  const formatCurrency = (val) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0
    }).format(val);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 bg-white dark:bg-zinc-900">
        <Loader2 className="h-10 w-10 text-emerald-500 animate-spin" />
        <p className="text-slate-500 dark:text-zinc-400 font-medium animate-pulse">
          Cargando reporte de compras...
        </p>
      </div>
    );
  }

  if (!customers || customers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-zinc-900 text-center">
        <div className="bg-slate-100 dark:bg-zinc-800 p-4 rounded-full mb-4">
          <ShoppingBag className="h-8 w-8 text-slate-400 dark:text-zinc-500" />
        </div>
        <h3 className="text-slate-800 dark:text-zinc-200 font-bold text-lg">No hay datos</h3>
        <p className="text-slate-500 dark:text-zinc-400 max-w-[280px] text-sm mt-1">
          No se encontraron clientes con historial de compras registrado.
          Asegúrate de que haya pedidos facturados.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader className="bg-slate-50/50 dark:bg-zinc-800/40">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[80px] px-6 py-4 text-slate-400 dark:text-slate-200 font-bold uppercase text-[11px] tracking-wider">
              Avatar
            </TableHead>
            <TableHead className="px-6 py-4 text-slate-400 dark:text-slate-200 font-bold uppercase text-[11px] tracking-wider">
              Cliente / Documento
            </TableHead>
            <TableHead className="px-6 py-4 text-slate-400 dark:text-slate-200 font-bold uppercase text-[11px] tracking-wider">
              Contacto
            </TableHead>
            <TableHead className="px-6 py-4 text-slate-400 dark:text-slate-200 font-bold uppercase text-[11px] tracking-wider text-center">
              Pedidos Realizados
            </TableHead>
            <TableHead className="px-6 py-4 text-slate-400 dark:text-slate-200 font-bold uppercase text-[11px] tracking-wider text-right">
              Total Invertido
            </TableHead>
            <TableHead className="px-6 py-4 text-right text-slate-400 dark:text-slate-200 font-bold uppercase text-[11px] tracking-wider pr-10">
              Acción
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => (
            <TableRow
              key={customer.idCliente}
              className="group transition-all"
            >
              {/* AVATAR */}
              <TableCell className="px-6 py-4">
                <Avatar className="h-11 w-11 border-2 border-white dark:border-zinc-800 shadow-sm ring-1 ring-slate-100 dark:ring-zinc-800">
                  <AvatarFallback className="bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 font-bold text-xs">
                    {customer.razonSocial?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
              </TableCell>

              {/* CLIENTE */}
              <TableCell className="px-6 py-4">
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-slate-800 dark:text-zinc-200 text-[14px]">
                    {customer.razonSocial || "Sin nombre"}
                  </span>
                  <span className="text-[12px] text-slate-400 dark:text-zinc-500 font-medium">
                    Doc: {customer.numeroDocumento || "Sin doc"} ({customer.tipoCliente || "General"})
                  </span>
                </div>
              </TableCell>

              {/* CONTACTO */}
              <TableCell className="px-6 py-4">
                <div className="flex flex-col gap-1 text-[13px]">
                  {customer.telefono && (
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-zinc-400 font-medium">
                      <Phone size={13} className="text-slate-400" />
                      {customer.telefono}
                    </div>
                  )}
                  {customer.email && (
                    <div className="flex items-center gap-1.5 text-slate-400 dark:text-zinc-500">
                      <Mail size={13} />
                      {customer.email}
                    </div>
                  )}
                </div>
              </TableCell>

              {/* PEDIDOS REALIZADOS */}
              <TableCell className="px-6 py-4 text-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs rounded-full">
                  <ShoppingBag size={12} className="text-slate-400" />
                  {customer.totalPedidos}
                </span>
              </TableCell>

              {/* TOTAL COMPRADO */}
              <TableCell className="px-6 py-4 text-right">
                <div className="flex items-center justify-end font-extrabold text-slate-900 dark:text-zinc-200 text-[14px]">
                  {formatCurrency(customer.totalComprado)}
                </div>
              </TableCell>

              {/* ACCIONES */}
              <TableCell className="px-6 py-4 text-right pr-10">
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Ver historial de compras"
                    className="h-8 w-8 text-blue-500 hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-900/30"
                    onClick={() => onViewDetails(customer)}
                    id={`btn-view-purchases-${customer.idCliente}`}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
