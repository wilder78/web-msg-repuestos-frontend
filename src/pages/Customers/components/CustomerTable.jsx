import React from "react";
import { Mail, Phone, Calendar, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { Avatar, AvatarFallback } from "../../../components/ui/avatar";
import ActionButtons from "../../../components/shared/ActionButtons";
import StatusToggleButton from "../../../components/shared/StatusToggleButton";

export function CustomerTable({
  customers,
  loading,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
  authFetch,
}) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 bg-white dark:bg-zinc-900">
        <Loader2 className="h-10 w-10 text-emerald-500 animate-spin" />
        <p className="text-slate-500 dark:text-zinc-400 font-medium animate-pulse">
          Cargando base de datos...
        </p>
      </div>
    );
  }

  if (!customers || customers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-zinc-900 text-center">
        <div className="bg-slate-100 dark:bg-zinc-800 p-4 rounded-full mb-4">
          <Loader2 className="h-8 w-8 text-slate-400 dark:text-zinc-500" />
        </div>
        <h3 className="text-slate-800 dark:text-zinc-200 font-bold text-lg">No hay clientes</h3>
        <p className="text-slate-500 dark:text-zinc-400 max-w-[250px]">
          No se encontraron registros que coincidan con la búsqueda.
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
              Foto
            </TableHead>
            <TableHead className="px-6 py-4 text-slate-400 dark:text-slate-200 font-bold uppercase text-[11px] tracking-wider">
              Cliente
            </TableHead>
            <TableHead className="px-6 py-4 text-slate-400 dark:text-slate-200 font-bold uppercase text-[11px] tracking-wider">
              Contacto
            </TableHead>
            <TableHead className="px-6 py-4 text-slate-400 dark:text-slate-200 font-bold uppercase text-[11px] tracking-wider">
              Tipo
            </TableHead>
            <TableHead className="px-6 py-4 text-slate-400 dark:text-slate-200 font-bold uppercase text-[11px] tracking-wider text-center">
              Estado
            </TableHead>
            <TableHead className="px-6 py-4 text-right text-slate-400 dark:text-slate-200 font-bold uppercase text-[11px] tracking-wider pr-10">
              Acciones
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
                  <div className="flex items-center gap-2 text-[12px] text-slate-400 dark:text-zinc-500 font-medium">
                    <Calendar size={12} />
                    {customer.fechaRegistro
                      ? new Date(customer.fechaRegistro).toLocaleDateString()
                      : "Sin fecha"}
                  </div>
                </div>
              </TableCell>

              {/* CONTACTO */}
              <TableCell className="px-6 py-4">
                <div className="flex flex-col gap-1 text-[13px] text-slate-600 dark:text-zinc-300 font-medium">
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-slate-400 dark:text-zinc-400 flex-shrink-0" />
                    {customer.email || "Sin correo"}
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-slate-400 dark:text-zinc-400 flex-shrink-0" />
                    {customer.telefono || "Sin teléfono"}
                  </div>
                </div>
              </TableCell>

              {/* TIPO CLIENTE */}
              <TableCell className="px-6 py-4">
                <span className="text-xs font-medium text-slate-600 dark:text-zinc-300 bg-slate-100/50 dark:bg-zinc-800/50 px-2 py-1 rounded-md">
                  {customer.tipoCliente || "—"}
                </span>
              </TableCell>

              {/* ESTADO */}
              <TableCell className="px-6 py-4 text-center">
                <StatusToggleButton
                  id={customer.idCliente || customer.id}
                  currentStatus={customer.activo}
                  apiUrl="/api/customers"
                  onSuccess={() => onToggleStatus?.(customer)}
                  authFetch={authFetch}
                  fieldName="activo"
                  customBody={{
                    idEstado: customer.activo === 1 ? 2 : 1,
                    activo: customer.activo === 1 ? false : true,
                  }}
                />
              </TableCell>

              {/* ACCIONES */}
              <TableCell className="px-6 py-4 text-right pr-6">
                <ActionButtons
                  item={customer}
                  onView={onView}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  disabledEdit={customer.activo !== 1}
                  disabledDelete={customer.activo !== 1}
                  editPermission="Editar Cliente"
                  deletePermission="Eliminar Cliente"
                  labels={{
                    view: "Ver cliente",
                    edit: "Editar cliente",
                    delete: "Eliminar cliente",
                  }}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
