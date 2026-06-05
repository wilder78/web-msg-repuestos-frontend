import React from "react";
import { Mail, Phone } from "lucide-react";
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
  AvatarImage,
} from "../../../components/ui/avatar";
import ActionButtons from "../../../components/shared/ActionButtons";
import StatusToggleButton from "../../../components/shared/StatusToggleButton";

export function EmployeeTable({
  empleados,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
  getCargoStyle,
  authFetch,
}) {
  // Función para obtener iniciales
  const getInitials = (nombres, apellidos) => {
    return `${nombres.charAt(0)}${apellidos.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader className="bg-slate-50/50 dark:bg-zinc-800/40">
          <TableRow className="hover:bg-transparent border-none">
            <TableHead className="w-[80px] px-6 py-4 text-slate-400 dark:text-slate-200 font-bold uppercase text-[11px] tracking-wider">
              Foto
            </TableHead>
            <TableHead className="px-6 py-4 text-slate-400 dark:text-slate-200 font-bold uppercase text-[11px] tracking-wider">
              Empleado
            </TableHead>
            <TableHead className="px-6 py-4 text-slate-400 dark:text-slate-200 font-bold uppercase text-[11px] tracking-wider text-center">
              Cargo
            </TableHead>
            <TableHead className="px-6 py-4 text-slate-400 dark:text-slate-200 font-bold uppercase text-[11px] tracking-wider">
              Contacto
            </TableHead>
            <TableHead className="px-6 py-4 text-slate-400 dark:text-slate-200 font-bold uppercase text-[11px] tracking-wider">
              Estado
            </TableHead>
            <TableHead className="px-6 py-4 text-slate-400 dark:text-slate-200 font-bold uppercase text-[11px] tracking-wider text-right pr-10">
              Acciones
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {empleados.length > 0 ? (
            empleados.map((empleado) => (
            <TableRow
              key={empleado.id}
              className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-all group"
            >
                {/* Foto/Avatar */}
                <TableCell className="px-6 py-4">
                  <Avatar className="h-11 w-11 border-2 border-white dark:border-zinc-800 shadow-sm ring-1 ring-slate-100 dark:ring-zinc-800/50">
                    {empleado.foto ? <AvatarImage src={empleado.foto} /> : null}
                    <AvatarFallback className="bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 font-bold text-xs">
                      {getInitials(empleado.nombres, empleado.apellidos)}
                    </AvatarFallback>
                  </Avatar>
                </TableCell>

                {/* Información Principal */}
                <TableCell className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-slate-800 dark:text-zinc-200 text-[14px]">
                      {empleado.nombres} {empleado.apellidos}
                    </span>
                    <div className="flex items-center gap-2 text-[12px] text-slate-400 dark:text-zinc-500 font-medium">
                      <span>ID: {empleado.idUsuario ?? empleado.id}</span>
                    </div>
                  </div>
                </TableCell>

                {/* Cargo con Badge Estilizado */}
                <TableCell className="px-6 py-4 text-center">
                  <Badge
                    variant="outline"
                    className={`${getCargoStyle(empleado.cargo)} border-none px-3 py-1 rounded-full font-bold text-[11px]`}
                  >
                    {empleado.cargo}
                  </Badge>
                </TableCell>

                {/* Contacto */}
                <TableCell className="px-6 py-4">
                  <div className="flex flex-col gap-1 text-[13px] text-slate-600 dark:text-zinc-350 font-medium">
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-slate-350 dark:text-zinc-500" />{" "}
                      {empleado.telefono || "-"}
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-slate-350 dark:text-zinc-500" />{" "}
                      {empleado.email || "-"}
                    </div>
                  </div>
                </TableCell>

                {/* Estado */}
                <TableCell className="px-6 py-4">
                  <StatusToggleButton
                    id={empleado.id}
                    currentStatus={empleado.statusId}
                    apiUrl="/api/employees"
                    onSuccess={() => onToggleStatus(empleado)}
                    authFetch={authFetch}
                    fieldName="idEstado"
                    customBody={empleado}
                  />
                </TableCell>

                {/* Acciones */}
                <TableCell className="px-6 py-4 text-right pr-6">
                  <ActionButtons
                    item={empleado}
                    onView={onView}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    disabledEdit={empleado.statusId !== 1}
                    disabledDelete={empleado.statusId !== 1}
                    editPermission="Editar Empleado"
                    deletePermission="Eliminar Empleado"
                    labels={{
                      view: "Ver empleado",
                      edit: "Editar empleado",
                      delete: "Eliminar empleado",
                    }}
                  />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={6}
                className="h-32 text-center text-slate-400 dark:text-zinc-500 font-medium bg-white dark:bg-zinc-900 border-b dark:border-zinc-800"
              >
                No se encontraron colaboradores que coincidan con la búsqueda.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
