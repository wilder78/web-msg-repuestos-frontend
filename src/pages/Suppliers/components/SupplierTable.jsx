import React from "react";
import { Mail, Phone, Building2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { Badge } from "../../../components/ui/badge";
import {
  Avatar,
  AvatarFallback,
} from "../../../components/ui/avatar";
import ActionButtons from "../../../components/shared/ActionButtons";
import StatusBadge from "../../../components/shared/StatusBadge";

export function SupplierTable({
  proveedores,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
}) {
  // Función para obtener iniciales
  const getInitials = (nombre) => {
    if (!nombre) return "PR";
    return nombre
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader className="bg-slate-50/50 dark:bg-zinc-800/40">
          <TableRow className="hover:bg-transparent border-none">
            <TableHead className="w-[80px] px-6 py-4 text-slate-400 dark:text-slate-200 font-bold uppercase text-[11px] tracking-wider">
              Logo
            </TableHead>
            <TableHead className="px-6 py-4 text-slate-400 dark:text-slate-200 font-bold uppercase text-[11px] tracking-wider">
              Proveedor
            </TableHead>
            <TableHead className="px-6 py-4 text-slate-400 dark:text-slate-200 font-bold uppercase text-[11px] tracking-wider text-center">
              NIT / RUT
            </TableHead>
            <TableHead className="px-6 py-4 text-slate-400 dark:text-slate-200 font-bold uppercase text-[11px] tracking-wider">
              Contacto
            </TableHead>
            <TableHead className="px-6 py-4 text-slate-400 dark:text-slate-200 font-bold uppercase text-[11px] tracking-wider">
              Estado
            </TableHead>
            <TableHead className="px-6 py-4 text-right text-slate-400 dark:text-slate-200 font-bold uppercase text-[11px] tracking-wider pr-10">
              Acciones
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {proveedores.length > 0 ? (
            proveedores.map((proveedor) => (
              <TableRow
                key={proveedor.id}
                className="group hover:bg-blue-50/60 dark:hover:bg-slate-700/30 transition-colors"
              >
                {/* Logo/Icono */}
                <TableCell className="px-6 py-4">
                  <Avatar className="h-11 w-11 border-2 border-white dark:border-zinc-800 shadow-sm ring-1 ring-slate-100 dark:ring-zinc-800">
                    <AvatarFallback className="bg-slate-100 dark:bg-zinc-850 text-slate-500 dark:text-slate-400 font-bold text-xs">
                      {getInitials(proveedor.nombre)}
                    </AvatarFallback>
                  </Avatar>
                </TableCell>

                {/* Información Principal */}
                <TableCell className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-[14px]">
                      {proveedor.nombre}
                    </span>
                    <div className="flex items-center gap-2 text-[12px] text-slate-400 dark:text-slate-500 font-medium">
                      <Building2 size={12} />
                      <span>{proveedor.direccion || "Sin dirección"}</span>
                    </div>
                  </div>
                </TableCell>

                {/* NIT / RUT */}
                <TableCell className="px-6 py-4 text-center">
                  <Badge
                    variant="outline"
                    className="bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 border-none px-3 py-1 rounded-full font-bold text-[11px]"
                  >
                    {proveedor.nit || proveedor.numeroDocumento || "N/A"}
                  </Badge>
                </TableCell>

                {/* Contacto */}
                <TableCell className="px-6 py-4">
                  <div className="flex flex-col gap-1 text-[13px] text-slate-600 dark:text-slate-300 font-medium">
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-slate-300 dark:text-slate-600" />{" "}
                      {proveedor.telefono || "-"}
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-slate-300 dark:text-slate-600" />{" "}
                      {proveedor.email || proveedor.correo || "-"}
                    </div>
                  </div>
                </TableCell>

                {/* Estado */}
                <TableCell className="px-6 py-4">
                  <StatusBadge
                    statusId={proveedor.statusId}
                    onClick={() => onToggleStatus(proveedor)}
                  />
                </TableCell>

                {/* Acciones */}
                <TableCell className="px-6 py-4 text-right pr-6">
                  <ActionButtons
                    item={proveedor}
                    onView={onView}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    disabledEdit={proveedor.statusId !== 1}
                    disabledDelete={proveedor.statusId !== 1}
                    editPermission="Editar Proveedor"
                    deletePermission="Eliminar Proveedor"
                    labels={{
                      view: "Ver proveedor",
                      edit: "Editar proveedor",
                      delete: "Eliminar proveedor",
                    }}
                  />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={6}
                className="h-32 text-center text-slate-400 font-medium"
              >
                No se encontraron proveedores que coincidan con la búsqueda.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
