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
import {
  Truck,
  Mail,
  Phone,
  MapPin,
  Building2,
  UserCircle,
  Globe,
  FileText,
} from "lucide-react";
import InfoCard from "../../../components/shared/InfoCard";

const SupplierDetailsModal = ({ isOpen, onClose, proveedor }) => {
  if (!proveedor || !isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="w-full max-w-4xl lg:max-w-5xl p-0 overflow-y-auto bg-white dark:bg-zinc-900 border-0 dark:border dark:border-zinc-800 shadow-2xl rounded-2xl max-h-[90vh] text-slate-900 dark:text-slate-100"
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 border-b border-slate-200 dark:border-zinc-800 shrink-0">
          <DialogHeader className="p-6 pb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <Truck className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-white">
                  Detalles del Proveedor
                </DialogTitle>
                <DialogDescription className="text-slate-500 dark:text-zinc-400 text-sm mt-1">
                  Información detallada de la entidad comercial
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6 bg-white dark:bg-zinc-900">
          {/* Perfil */}
          <div className="bg-gradient-to-br from-slate-50 to-white dark:from-zinc-900/60 dark:to-zinc-950 p-5 rounded-2xl border border-slate-200 dark:border-zinc-800/80 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                {/* ✅ nombre de la empresa */}
                <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                  {proveedor.nombre || "Sin nombre"}
                </h3>
                {/* ✅ tipo de documento + NIT */}
                <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mt-1">
                  {proveedor.tipoDocumento
                    ? `${proveedor.tipoDocumento}: `
                    : "NIT/RUT: "}
                  <span className="text-slate-700 dark:text-slate-350 font-bold">
                    {proveedor.nit || "No registrado"}
                  </span>
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-2.5 py-0.5 uppercase tracking-wide rounded-full font-semibold ${
                      proveedor.statusId === 1
                        ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    {proveedor.estado}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Grid de Información */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Ubicación */}
            <InfoCard icon={MapPin} iconColor="blue" title="Ubicación y Sede">
              <div>
                <p className="text-xs text-slate-500 dark:text-zinc-450 mb-1">
                  Dirección Principal
                </p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                  {proveedor.direccion || "No especificada"} {/* ✅ */}
                </p>
              </div>
              <Separator className="my-2 dark:bg-zinc-800" />
              <div>
                <p className="text-xs text-slate-500 dark:text-zinc-450 mb-1">Municipio</p>
                <div className="flex items-center gap-2">
                  <Globe className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 capitalize">
                    {proveedor.ciudad || "No registrado"} {/* ✅ */}
                  </p>
                </div>
              </div>
              <Separator className="my-2 dark:bg-zinc-800" />
              <div>
                <p className="text-xs text-slate-500 dark:text-zinc-450 mb-1">Departamento</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 capitalize">
                  {proveedor.departamento || "No registrado"} {/* ✅ */}
                </p>
              </div>
            </InfoCard>

            {/* Contacto */}
            <InfoCard
              icon={UserCircle}
              iconColor="blue"
              title="Datos de Contacto"
            >
              <div>
                <p className="text-xs text-slate-500 dark:text-zinc-450 mb-1">
                  Persona de Contacto
                </p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 uppercase">
                  {proveedor.contactoNombre || "No asignado"} {/* ✅ */}
                </p>
              </div>
              <Separator className="my-2 dark:bg-zinc-800" />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-slate-300 dark:text-zinc-600" />
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {proveedor.telefono || "-"} {/* ✅ */}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-slate-300 dark:text-zinc-600" />
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 break-all">
                    {proveedor.email || "-"} {/* ✅ */}
                  </p>
                </div>
              </div>
            </InfoCard>
          </div>

          {/* Condiciones Comerciales */}
          <div className="bg-amber-50/50 dark:bg-amber-950/20 rounded-xl p-4 border border-amber-100 dark:border-amber-900/30">
            <h3 className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <FileText className="h-3.5 w-3.5" />
              Condiciones Comerciales
            </h3>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic">
              "
              {proveedor.condiciones || "Sin condiciones comerciales definidas"}
              " {/* ✅ */}
            </p>
          </div>

          {/* Footer sistema */}
          <div className="bg-slate-50 dark:bg-zinc-950 rounded-xl p-4 border border-slate-100 dark:border-zinc-800/80">
            <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 dark:text-zinc-500">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-slate-300 dark:bg-zinc-600 rounded-full" />
                <span>
                  ID DEL SISTEMA:{" "}
                  <span className="font-mono text-slate-500 dark:text-zinc-400">
                    #{proveedor.id}
                  </span>
                </span>
              </div>
              <span>VERIFICADO</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SupplierDetailsModal;
