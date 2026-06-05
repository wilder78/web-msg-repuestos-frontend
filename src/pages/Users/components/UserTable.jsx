import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { Mail, Loader2 } from "lucide-react";
import StatusToggleButton from "../../../components/shared/StatusToggleButton";
import ActionButtons from "../../../components/shared/ActionButtons";

// --- Funciones de ayuda internas (Evitan errores de "is not a function") ---
const getInitials = (n) =>
  n
    ?.split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "??";

const getAvatarColor = (id) => {
  const colors = [
    "bg-emerald-500",
    "bg-blue-500",
    "bg-violet-500",
    "bg-amber-500",
    "bg-rose-500",
  ];
  return colors[id % colors.length];
};

const UserTable = ({
  users,
  roleMap,
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

  if (users.length === 0) {
    return (
      <div className="text-center py-20 bg-white dark:bg-zinc-900 border-t dark:border-zinc-800/80">
        <p className="text-slate-500 dark:text-zinc-300 font-medium">No se encontraron usuarios</p>
        <p className="text-slate-400 dark:text-zinc-500 text-sm">
          Prueba con otros términos de búsqueda
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader className="bg-gray-50/50 dark:bg-zinc-800/40">
        <TableRow>
          <TableHead className="pl-6 w-[80px]">Foto</TableHead>
          <TableHead>Usuario</TableHead>
          <TableHead>Cargo / Rol</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="text-right pr-6">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((u) => (
          <TableRow
            key={u.idUsuario}
            className="group hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
          >
            <TableCell className="pl-6">
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm ${getAvatarColor(u.idUsuario)}`}
              >
                {getInitials(u.nombreUsuario)}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex flex-col">
                <span className="font-bold text-slate-700 dark:text-slate-200">
                  {u.nombreUsuario}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  ID: {u.idUsuario}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                {roleMap[u.id_rol] || "Usuario"}
              </span>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
                <Mail className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                {u.email}
              </div>
            </TableCell>
            <TableCell>
              <StatusToggleButton
                id={u.idUsuario}
                currentStatus={u.id_estado || u.idEstado}
                apiUrl="/api/users"
                onSuccess={onToggleStatus}
                authFetch={authFetch}
                disabled={u.idUsuario === 1}
                fieldName="idEstado"
                customBody={u}
              />
            </TableCell>
            <TableCell className="text-right pr-6">
              <ActionButtons
                item={u}
                onView={onView}
                onEdit={onEdit}
                onDelete={onDelete}
                disabledEdit={!((u.id_estado || u.idEstado) == 1)}
                disabledDelete={!((u.id_estado || u.idEstado) == 1)}
                editPermission="Editar Usuario"
                deletePermission="Eliminar Usuario"
                labels={{
                  view: "Ver usuario",
                  edit: "Editar usuario",
                  delete: "Eliminar usuario",
                }}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default UserTable;
