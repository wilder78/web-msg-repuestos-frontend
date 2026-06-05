import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { Key, Loader2, Info, Bookmark } from "lucide-react";
import ActionButtons from "../../../components/shared/ActionButtons";
import StatusToggleButton from "../../../components/shared/StatusToggleButton";

const AllowTable = ({
  permissions,
  loading,
  authFetch,
  onView,
  onEdit,
  onDelete,
  onToggleStatus, // handleStatusUpdate del padre
}) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="animate-spin h-8 w-8 text-slate-400" />
      </div>
    );
  }

  if (permissions.length === 0) {
    return (
      <div className="text-center py-20 bg-white border-t">
        <p className="text-slate-500 font-medium">No se encontraron permisos</p>
        <p className="text-slate-400 text-sm">
          Asegúrate de que existan registros en la base de datos.
        </p>
      </div>
    );
  }

  return (
    <Table className="table-fixed">
      <TableHeader className="bg-gray-50/50 dark:bg-zinc-800/40">
        <TableRow>
          <TableHead className="pl-6 w-[80px]">ID</TableHead>
          <TableHead className="w-[180px]">Permiso</TableHead>
          <TableHead className="max-w-[220px]">Descripción</TableHead>
          <TableHead className="w-[130px]">Categoría</TableHead>
          <TableHead className="w-[100px]">Estado</TableHead>
          <TableHead className="text-right pr-6 w-[120px]">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {permissions.map((p) => (
          <TableRow
            key={p.idPermiso}
            className="group hover:bg-blue-50/60 dark:hover:bg-slate-700/30 transition-colors"
          >
            <TableCell className="pl-6">
              <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
                #{p.idPermiso}
              </span>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-blue-50 dark:bg-slate-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm shrink-0">
                  <Key size={18} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-slate-700 dark:text-slate-200 tracking-tight truncate">
                    {p.nombrePermiso
                      ? p.nombrePermiso.charAt(0).toUpperCase() +
                        p.nombrePermiso.slice(1).toLowerCase()
                      : ""}
                  </span>
                </div>
              </div>
            </TableCell>
            <TableCell className="max-w-[220px]">
              <div
                className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300"
                title={p.descripcion || "Sin descripción disponible"}
              >
                <Info className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                <span className="truncate">
                  {p.descripcion || "Sin descripción disponible"}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
                <Bookmark className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                <span className="truncate">{p.categoria || "—"}</span>
              </div>
            </TableCell>
            <TableCell>
              <StatusToggleButton
                id={p.idPermiso}
                currentStatus={p.idEstado}
                apiUrl="/api/permissions"
                onSuccess={onToggleStatus}
                authFetch={authFetch}
                fieldName="idEstado"
              />
            </TableCell>
            <TableCell className="text-right pr-6">
              <ActionButtons
                item={p}
                onView={onView}
                onEdit={onEdit}
                onDelete={onDelete}
                disabledEdit={p.idEstado !== 1}
                disabledDelete={p.idEstado !== 1}
                editPermission="Gestionar Permisos"
                deletePermission="Gestionar Permisos"
                labels={{
                  view: "Ver detalle",
                  edit: "Editar permiso",
                  delete: "Inactivar",
                }}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default AllowTable;
