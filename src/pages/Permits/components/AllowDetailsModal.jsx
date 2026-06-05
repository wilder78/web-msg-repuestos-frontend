import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../../components/ui/dialog";
import { Badge } from "../../../components/ui/badge";
import { Separator } from "../../../components/ui/separator";
import { Key, Info, Calendar, Layout } from "lucide-react";
import InfoCard from "../../../components/shared/InfoCard";

const AllowDetailsModal = ({ isOpen, onClose, permiso }) => {
  if (!permiso || !isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="w-full max-w-4xl lg:max-w-5xl p-0 overflow-y-auto bg-white dark:bg-zinc-900 border-0 dark:border dark:border-zinc-800 shadow-2xl rounded-2xl max-h-[90vh] text-slate-900 dark:text-slate-100"
      >
        <div className="relative bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 border-b border-slate-200 dark:border-zinc-800">
          <DialogHeader className="p-6 pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                  <Key className="h-6 w-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-white">
                    Detalles del Permiso
                  </DialogTitle>
                  <DialogDescription className="text-slate-500 dark:text-zinc-400 text-sm mt-1">
                    Información técnica y descriptiva del permiso
                  </DialogDescription>
                </div>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6 bg-white dark:bg-zinc-900">
          {/* Perfil del Permiso */}
          <div className="bg-gradient-to-br from-slate-50 to-white dark:from-zinc-900/60 dark:to-zinc-950 p-5 rounded-2xl border border-slate-200 dark:border-zinc-800/80 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <Key className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight capitalize">
                  {permiso.nombrePermiso ? permiso.nombrePermiso.toLowerCase() : ""}
                </h3>
                <p className="text-sm text-slate-600 dark:text-zinc-300 mt-2 leading-relaxed">
                  {permiso.descripcion || "Sin descripción asignada"}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-2.5 py-0.5 uppercase tracking-wide rounded-full font-semibold ${
                      permiso.idEstado === 1
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50"
                        : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                    }`}
                  >
                    {permiso.idEstado === 1 ? "activo" : "inactivo"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Grid de Información */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Información Técnica */}
            <InfoCard icon={Info} iconColor="blue" title="Información Técnica">
              <div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mb-1">ID del Permiso</p>
                <p className="text-sm font-mono font-bold text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 px-2 py-1 rounded-md inline-block">
                  #{permiso.idPermiso || "N/A"}
                </p>
              </div>
              <Separator className="my-2 dark:bg-zinc-800" />
              <div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mb-1">Tipo de Recurso</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
                  Sistema / Acceso
                </p>
              </div>
            </InfoCard>

            {/* Clasificación */}
            <InfoCard icon={Layout} iconColor="violet" title="Clasificación">
              <div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mb-1">Módulo</p>
                <p className="text-sm font-bold text-slate-800 dark:text-zinc-200">
                  {permiso.modulo || "General"}
                </p>
              </div>
              <Separator className="my-2 dark:bg-zinc-800" />
              <div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mb-1">Categoría</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
                  {permiso.categoria || "Seguridad"}
                </p>
              </div>
            </InfoCard>
          </div>

          {/* Información Adicional */}
          <div className="bg-slate-50 dark:bg-zinc-950 rounded-xl p-4 border border-slate-100 dark:border-zinc-800/80">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-slate-400 dark:text-slate-500" />
              <span className="text-xs font-bold text-slate-500 dark:text-zinc-450 capitalize tracking-wider">
                Registro del Sistema
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 capitalize font-semibold">Fecha de Creación</p>
                <p className="text-xs text-slate-600 dark:text-zinc-300 font-medium">{permiso.fechaCreacion || "No registrada"}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 capitalize font-semibold">Última Modificación</p>
                <p className="text-xs text-slate-600 dark:text-zinc-300 font-medium">{permiso.fechaModificacion || "Igual a creación"}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AllowDetailsModal;
