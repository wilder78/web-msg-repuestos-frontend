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
import { MapPin, X, Globe } from "lucide-react";
import InfoCard from "../../../components/shared/InfoCard";
import StatusBadge from "../../../components/shared/StatusBadge";

const AreaDetailsModal = ({ isOpen, onClose, zone }) => {
  if (!zone) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="w-full max-w-4xl lg:max-w-5xl p-0 overflow-y-auto bg-white dark:bg-zinc-900 border-0 dark:border dark:border-zinc-800 shadow-2xl rounded-2xl max-h-[90vh] flex flex-col text-slate-900 dark:text-slate-100 transition-colors duration-300"
      >
        {/* Encabezado */}
        <div className="relative bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 border-b border-slate-200 dark:border-zinc-800 shrink-0">
          <DialogHeader className="p-6 pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                  <MapPin className="h-6 w-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-white">
                    Detalles de la Zona
                  </DialogTitle>
                  <DialogDescription className="text-slate-500 dark:text-zinc-400 text-sm mt-1">
                    Información completa del registro seleccionado
                  </DialogDescription>
                </div>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Contenido del Modal */}
        <div className="p-6 space-y-6 bg-white dark:bg-zinc-900">
          {/* Sección de Perfil Principal */}
          <div className="bg-gradient-to-br from-slate-50 to-white dark:from-zinc-900/60 dark:to-zinc-950 p-5 rounded-2xl border border-slate-200 dark:border-zinc-800/80 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
                <MapPin className="h-6 w-6 text-emerald-600 dark:text-emerald-450" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                  {zone.name || zone.nombre || "Zona"}
                </h3>
                <p className="text-sm text-slate-600 dark:text-zinc-300 mt-2 leading-relaxed">
                  {zone.description ||
                    zone.descripcion ||
                    "Sin descripción asignada"}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <StatusBadge statusId={zone.statusId || zone.status_id} />
                </div>
              </div>
            </div>
          </div>

          {/* Grid de Información */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Información Básica */}
            <InfoCard
              icon={MapPin}
              iconColor="emerald"
              title="Información Básica"
            >
              <div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mb-1">ID de Zona</p>
                <p className="text-sm font-mono font-bold text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 px-2 py-1 rounded-md inline-block">
                  #{zone.id?.toString().padStart(4, "0") || "0000"}
                </p>
              </div>
              <Separator className="my-2 dark:bg-zinc-800" />
              <div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mb-1">Nombre</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
                  {zone.name || zone.nombre || "-"}
                </p>
              </div>
            </InfoCard>

            {/* Estado y Detalles */}
            <InfoCard icon={Globe} iconColor="blue" title="Estado del Registro">
              <div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mb-1">Estado Actual</p>
                <StatusBadge statusId={zone.statusId || zone.status_id} />
              </div>
              <Separator className="my-2 dark:bg-zinc-800" />
              <div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mb-1">Tipo</p>
                <span className="text-xs bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-md">
                  Zona Geográfica
                </span>
              </div>
            </InfoCard>
          </div>

          {/* Descripción Detallada */}
          {(zone.description || zone.descripcion) && (
            <div className="p-4 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-800/80">
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">
                📝 Descripción Completa
              </h4>
              <p className="text-sm text-slate-600 dark:text-zinc-350 leading-relaxed">
                {zone.description || zone.descripcion}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AreaDetailsModal;
