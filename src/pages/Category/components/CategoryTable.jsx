import React from "react";
import { Tag, FileText } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { Badge } from "../../../components/ui/badge";
import ActionButtons from "../../../components/shared/ActionButtons";
import StatusToggleButton from "../../../components/shared/StatusToggleButton";

export function CategoryTable({
  categorias,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
  authFetch,
}) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader className="bg-slate-50/50 dark:bg-zinc-800/40">
          <TableRow className="hover:bg-transparent border-none">
            <TableHead className="w-[100px] px-6 py-4 text-slate-400 dark:text-slate-200 font-bold uppercase text-[11px] tracking-wider">
              ID
            </TableHead>
            <TableHead className="px-6 py-4 text-slate-400 dark:text-slate-200 font-bold uppercase text-[11px] tracking-wider">
              Categoría
            </TableHead>
            <TableHead className="px-6 py-4 text-slate-400 dark:text-slate-200 font-bold uppercase text-[11px] tracking-wider">
              Descripción
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
          {categorias.length > 0 ? (
            categorias.map((categoria) => (
              <TableRow
                key={categoria.id ?? categoria.id_categoria}
                className="group hover:bg-blue-50/60 dark:hover:bg-slate-700/30 transition-colors"
              >
                {/* ID */}
                <TableCell className="px-6 py-4">
                  <span className="font-mono text-xs font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-zinc-800 px-2 py-1 rounded">
                    #
                    {(categoria.id ?? categoria.id_categoria ?? "0")
                      .toString()
                      .padStart(3, "0")}
                  </span>
                </TableCell>

                {/* Nombre de la Categoría */}
                <TableCell className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg text-emerald-600 dark:text-emerald-450">
                      <Tag size={18} />
                    </div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-[14px]">
                      {categoria.nombre ||
                        categoria.nombre_categoria ||
                        "Sin nombre"}
                    </span>
                  </div>
                </TableCell>

                {/* Descripción */}
                <TableCell className="px-6 py-4 max-w-[300px]">
                  <div className="flex items-start gap-2 text-slate-500 dark:text-slate-450">
                    <FileText size={14} className="mt-1 shrink-0 opacity-40" />
                    <p className="text-sm dark:text-zinc-300 line-clamp-2">
                      {categoria.descripcion || "Sin descripción asignada."}
                    </p>
                  </div>
                </TableCell>

                {/* Estado */}
                <TableCell className="px-6 py-4 text-center">
                  <StatusToggleButton
                    id={categoria.id ?? categoria.id_categoria}
                    currentStatus={categoria.statusId}
                    apiUrl="/api/categories"
                    onSuccess={() => onToggleStatus(categoria)}
                    authFetch={authFetch}
                    fieldName="id_estado"
                    customBody={categoria}
                  />
                </TableCell>

                {/* Acciones */}
                <TableCell className="px-6 py-4 text-right pr-6">
                  <ActionButtons
                    item={categoria}
                    onView={onView}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    disabledEdit={categoria.statusId !== 1}
                    disabledDelete={categoria.statusId !== 1}
                    editPermission="Editar Categoría"
                    deletePermission="Eliminar Categoría"
                    labels={{
                      view: "Ver categoría",
                      edit: "Editar categoría",
                      delete: "Eliminar categoría",
                    }}
                  />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={5}
                className="h-32 text-center text-slate-400 font-medium"
              >
                No se encontraron categorías registradas.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
