import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { Loader2, ShieldCheck, Calendar } from "lucide-react";
import StatusToggleButton from "../../../components/shared/StatusToggleButton";
import ActionButtons from "../../../components/shared/ActionButtons";

// --- Funciones de ayuda internas ---
const getRoleColor = (rolName) => {
  const colors = {
    Master: "bg-red-500",
    Administrador: "bg-blue-500",
    Vendedor: "bg-emerald-500",
    Bodeguero: "bg-amber-500",
    Contador: "bg-purple-500",
  };
  return colors[rolName] || "bg-slate-400";
};

const RolesTable = ({
  roles,
  loading,
  authFetch,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
}) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="animate-spin h-8 w-8 text-slate-400" />
      </div>
    );
  }

  if (roles.length === 0) {
    return (
      <div className="text-center py-20 bg-white dark:bg-zinc-900 border-t dark:border-zinc-800">
        <p className="text-slate-500 dark:text-zinc-400 font-medium">
          No se encontraron roles registrados
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader className="bg-gray-50/50 dark:bg-zinc-800/40">
        <TableRow>
          <TableHead className="pl-6 w-[300px]">Rol / Descripción</TableHead>
          <TableHead>Permisos</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Fecha Creación</TableHead>
          <TableHead className="text-right pr-6">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {roles.map((rol) => (
          <TableRow
            key={rol.id}
            className="group hover:bg-blue-50/60 dark:hover:bg-slate-700/30 transition-colors"
          >
            {/* Columna de Rol con indicador de color */}
            <TableCell className="pl-6">
              <div className="flex items-start gap-3">
                <div
                  className={`mt-1 h-3 w-3 rounded-full shrink-0 shadow-sm ${getRoleColor(rol.nombre)}`}
                />
                <div className="flex flex-col">
                  <span className="font-bold text-slate-700 dark:text-slate-200 leading-none mb-1">
                    {rol.nombre}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 line-clamp-1 max-w-[250px]">
                    {rol.descripcion || "Sin descripción"}
                  </span>
                </div>
              </div>
            </TableCell>

            {/* Columna de Permisos */}
            <TableCell>
              <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-zinc-300">
                <ShieldCheck className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                <span className="inline-flex items-center px-2 py-0.5 rounded border border-slate-200 dark:border-zinc-700 text-[11px] font-bold bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 shadow-xs">
                  {rol.permisosCount || 0}{" "}
                  {rol.permisosCount === 1 ? "permiso" : "permisos"}
                </span>
              </div>
            </TableCell>

            {/* Columna de Estado */}
            <TableCell>
              <StatusToggleButton
                id={rol.id}
                currentStatus={rol.idEstado}
                apiUrl="/api/roles"
                onSuccess={onToggleStatus}
                authFetch={authFetch}
                disabled={rol.id === 1}
                fieldName="idEstado"
              />
            </TableCell>

            {/* Columna de Fecha */}
            <TableCell>
              <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                <Calendar className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                {rol.fechaCreacion || "N/A"}
              </div>
            </TableCell>

            {/* Columna de Acciones */}
            <TableCell className="text-right pr-6">
              <ActionButtons
                item={rol}
                onView={onView}
                onEdit={onEdit}
                onDelete={onDelete}
                disabledEdit={rol.idEstado !== 1}
                disabledDelete={rol.idEstado !== 1}
                editPermission="Editar Rol"
                deletePermission="Eliminar Rol"
                labels={{
                  view: "Ver detalles",
                  edit: "Editar rol",
                  delete: "Eliminar rol",
                }}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default RolesTable;
