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
import { Shield, CheckCircle2, Award } from "lucide-react";
import InfoCard from "../../../components/shared/InfoCard";

const RoleDetailsModal = ({ isOpen, onClose, rol, permisos = [] }) => {
  if (!rol || !isOpen) return null;

  // Agrupación de permisos por módulo
  const permisosAgrupados = permisos.reduce((acc, p) => {
    const modulo = p.permiso?.modulo || p.modulo || "General";
    if (!acc[modulo]) acc[modulo] = [];
    acc[modulo].push(p);
    return acc;
  }, {});

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
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-white">
                    Detalles del Rol
                  </DialogTitle>
                  <DialogDescription className="text-slate-500 dark:text-zinc-400 text-sm mt-1">
                    Información completa del rol y sus permisos
                  </DialogDescription>
                </div>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6 bg-white dark:bg-zinc-900">
          {/* Perfil del Rol */}
          <div className="bg-gradient-to-br from-slate-50 to-white dark:from-zinc-900/60 dark:to-zinc-950 p-5 rounded-2xl border border-slate-200 dark:border-zinc-800/80 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                  {rol.nombre}
                </h3>
                <p className="text-sm text-slate-600 dark:text-zinc-300 mt-2 leading-relaxed">
                  {rol.descripcion || "Sin descripción asignada"}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-2.5 py-0.5 uppercase tracking-wide rounded-full font-semibold ${
                      rol.estado === "activo" || !rol.estado
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50"
                        : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                    }`}
                  >
                    {rol.estado || "activo"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Grid de Información */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Información Básica */}
            <InfoCard icon={Shield} iconColor="blue" title="Información Básica">
              <div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mb-1">ID del Rol</p>
                <p className="text-sm font-mono font-bold text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-850 px-2 py-1 rounded-md inline-block">
                  #{rol.idRol || rol.id || "N/A"}
                </p>
              </div>
              <Separator className="my-2 dark:bg-zinc-800" />
              <div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mb-1">Fecha Creación</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
                  {rol.fechaCreacion || "N/A"}
                </p>
              </div>
            </InfoCard>

            {/* Estadísticas */}
            <InfoCard icon={Award} iconColor="violet" title="Estadísticas">
              <div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mb-1">Permisos Totales</p>
                <p className="text-sm font-bold text-slate-800 dark:text-zinc-200">
                  {rol.permisosCount || permisos.length || 0}
                </p>
              </div>
              <Separator className="my-2 dark:bg-zinc-800" />
              <div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mb-1">
                  Usuarios Asignados
                </p>
                <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
                  {rol.usuariosAsignados || "0"}
                </p>
              </div>
            </InfoCard>
          </div>

          {/* Sección de permisos */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base tracking-tight flex items-center gap-2">
              <Shield className="h-4 w-4 text-slate-600 dark:text-zinc-400" />
              Permisos Asignados ({rol.permisosCount || permisos.length || 0})
            </h3>

            {Object.keys(permisosAgrupados).length > 0 ? (
              <div className="space-y-5">
                {Object.entries(permisosAgrupados).map(([modulo, lista]) => (
                  <div
                    key={modulo}
                    className="border border-slate-100 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm"
                  >
                    {/* Cabecera del módulo */}
                    <div className="px-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border-b border-slate-100 dark:border-zinc-800 flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full" />
                      <span className="text-xs font-bold text-slate-600 dark:text-zinc-400 capitalize tracking-wide">
                        {modulo.toLowerCase()} ({lista.length})
                      </span>
                    </div>

                    {/* Grid de permisos */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-100 dark:bg-zinc-800">
                      {lista.map((p, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-4 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-850/50 transition-colors"
                        >
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-slate-700 dark:text-zinc-200 leading-tight capitalize">
                              {(p.permiso?.nombrePermiso ||
                                p.nombre_permiso ||
                                "Permiso").toLowerCase()}
                            </p>
                            <p className="text-[11px] text-slate-400 dark:text-zinc-400 mt-1 leading-snug">
                              {p.descripcion ||
                                "Descripción breve de la acción permitida."}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-14 bg-slate-50 dark:bg-zinc-950 rounded-xl border-2 border-dashed border-slate-200 dark:border-zinc-800 text-slate-400 dark:text-zinc-500 text-sm italic">
                No hay permisos específicos para visualizar en este rol.
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RoleDetailsModal;
