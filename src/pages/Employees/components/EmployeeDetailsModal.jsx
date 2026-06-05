import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../../components/ui/dialog";
import { Badge } from "../../../components/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../../components/ui/avatar";
import { Separator } from "../../../components/ui/separator";
import { User, Mail, Phone, Briefcase, Smartphone, Shield, UserCheck, UserX } from "lucide-react";
import InfoCard from "../../../components/shared/InfoCard";

const DetailItem = ({ label, value, icon }) => {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-medium text-slate-400 dark:text-zinc-500">{label}</span>
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-zinc-300">
        <span className="text-slate-300 dark:text-zinc-600">{icon}</span>
        {value || "-"}
      </div>
    </div>
  );
};

const EmployeeDetailsModal = ({ isOpen, onClose, empleado, getCargoStyle }) => {
  if (!empleado) return null;

  const getInitials = (nombres, apellidos) => {
    return `${nombres?.charAt(0) || ""}${apellidos?.charAt(0) || ""}`.toUpperCase();
  };

  const getAvatarColor = (id) => {
    const colors = [
      "bg-emerald-500",
      "bg-blue-500",
      "bg-violet-500",
      "bg-amber-500",
      "bg-rose-500",
      "bg-sky-500",
    ];
    return colors[(id || 0) % colors.length];
  };

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
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-white">
                    Perfil del Empleado
                  </DialogTitle>
                  <DialogDescription className="text-slate-500 dark:text-zinc-400 text-sm mt-1">
                    Información registrada del colaborador
                  </DialogDescription>
                </div>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Contenido del Modal */}
        <div className="p-6 space-y-6 overflow-y-auto bg-white dark:bg-zinc-900">
          {/* Perfil Principal */}
          <div className="bg-gradient-to-br from-slate-50 to-white dark:from-zinc-900/60 dark:to-zinc-950 p-5 rounded-2xl border border-slate-200 dark:border-zinc-800/80 shadow-sm">
            <div className="flex items-center gap-5">
              <Avatar className="h-20 w-20 border-4 border-white dark:border-zinc-850 shadow-sm">
                <AvatarImage src={empleado.foto} />
                <AvatarFallback
                  className={`${getAvatarColor(empleado.id)} text-white font-bold text-xl`}
                >
                  {getInitials(empleado.nombres, empleado.apellidos)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                  {empleado.nombres} {empleado.apellidos}
                </h3>
                <div className="flex items-center gap-2 mt-2">
                  <Badge
                    className={`${getCargoStyle(empleado.cargo)} border-none`}
                  >
                    {empleado.cargo}
                  </Badge>
                  <span className="text-slate-400 dark:text-zinc-650 text-sm">•</span>
                  <span
                    className={`text-sm font-bold uppercase ${
                      empleado.estado === "activo"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-slate-400 dark:text-slate-500"
                    }`}
                  >
                    {empleado.estado}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Grid de Información */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Información Personal */}
            <InfoCard icon={User} iconColor="blue" title="Información Personal">
              <div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mb-1">
                  Número de Documento
                </p>
                <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
                  {empleado.numeroDocumento || "-"}
                </p>
              </div>
              <Separator className="my-2 dark:bg-zinc-800" />
              <div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mb-1">ID Empleado</p>
                <p className="text-sm font-mono font-bold text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-850 px-2 py-1 rounded-md inline-block">
                  #{empleado.id?.toString().padStart(4, "0") || "0000"}
                </p>
              </div>
            </InfoCard>

            {/* Datos Laborales */}
            <InfoCard
              icon={Briefcase}
              iconColor="emerald"
              title="Datos Laborales"
            >
              <div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mb-1">Cargo Actual</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
                  {empleado.cargo || "-"}
                </p>
              </div>
              <Separator className="my-2 dark:bg-zinc-800" />
              <div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mb-1">Estado</p>
                <Badge
                  variant="outline"
                  className={`text-[10px] px-2.5 py-0.5 uppercase tracking-wide rounded-full font-semibold ${
                    empleado.estado === "activo"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50"
                      : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                  }`}
                >
                  {empleado.estado || "INACTIVO"}
                </Badge>
              </div>
            </InfoCard>

            {/* Medios de Contacto */}
            <InfoCard
              icon={Smartphone}
              iconColor="violet"
              title="Medios de Contacto"
            >
              <div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mb-1">Email</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200 break-all">
                  {empleado.email || "-"}
                </p>
              </div>
              <Separator className="my-2 dark:bg-zinc-800" />
              <div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mb-1">Teléfono</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                  {empleado.telefono || "-"}
                </p>
              </div>
            </InfoCard>

            {/* Usuario de acceso */}
            <InfoCard icon={UserCheck} iconColor="emerald" title="Usuario de Acceso">
              {empleado.usuario ? (
                <div>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mb-1">Nombre de Usuario</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-emerald-500 dark:text-emerald-450" />
                    {empleado.usuario.nombreUsuario}
                  </p>
                  <Separator className="my-2 dark:bg-zinc-800" />
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mb-1">Correo Electrónico</p>
                  <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 break-all">
                    {empleado.usuario.email}
                  </p>
                  {empleado.usuario.rol && (
                    <>
                      <Separator className="my-2 dark:bg-zinc-800" />
                      <p className="text-xs text-slate-500 dark:text-zinc-400 mb-1">Rol del Usuario</p>
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 bg-blue-50 dark:text-blue-450 dark:bg-blue-950/30 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-900/50">
                        <Shield className="h-3 w-3" />
                        {empleado.usuario.rol.nombreRol}
                      </span>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-xl border border-slate-100 dark:border-zinc-800/80 bg-slate-50 dark:bg-zinc-950 px-4 py-3">
                  <UserX className="h-5 w-5 text-slate-300 dark:text-zinc-700 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-slate-600 dark:text-zinc-350">Sin usuario asignado</p>
                    <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">
                      Este empleado no tiene credenciales de acceso al sistema.
                    </p>
                  </div>
                </div>
              )}
            </InfoCard>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeDetailsModal;
