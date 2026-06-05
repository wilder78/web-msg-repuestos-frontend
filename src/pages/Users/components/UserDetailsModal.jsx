import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../../components/ui/dialog";
import { Avatar, AvatarFallback } from "../../../components/ui/avatar";
import { Separator } from "../../../components/ui/separator";
import {
  User,
  Briefcase,
  Calendar,
  ShieldCheck,
  Activity,
  Award,
  Smartphone,
  Mail,
  Clock,
  CheckCircle,
} from "lucide-react";
import InfoCard from "../../../components/shared/InfoCard";
import StatusBadge from "../../../components/shared/StatusBadge";

const UserDetailsModal = ({
  isOpen,
  onClose,
  usuario,
  rolMap,
  getAvatarColor,
  getInitials,
}) => {
  if (!usuario) return null;

  // Formatear fecha si existe
  const formatFecha = (fecha) => {
    if (!fecha) return "No registrada";
    try {
      return new Date(fecha).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return fecha;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="w-full max-w-4xl lg:max-w-5xl p-0 overflow-y-auto bg-white dark:bg-zinc-900 border-0 dark:border dark:border-zinc-800 shadow-2xl rounded-2xl max-h-[90vh] text-slate-900 dark:text-slate-100 transition-colors duration-300"
      >
        {/* Encabezado con botón de cerrar */}
        <div className="relative bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 border-b border-slate-200 dark:border-zinc-800">
          <DialogHeader className="p-6 pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-white">
                    Perfil de Usuario
                  </DialogTitle>
                  <DialogDescription className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                    Información técnica registrada en el sistema
                  </DialogDescription>
                </div>
              </div>
            </div>
          </DialogHeader>
        </div>

        {usuario && (
          <div className="p-6 space-y-6">
            {/* Sección de Perfil Principal */}
            <div className="bg-gradient-to-br from-slate-50 to-white dark:from-zinc-900/60 dark:to-zinc-950 p-5 rounded-2xl border border-slate-200 dark:border-zinc-800/80 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <Avatar className="h-20 w-20 border-4 border-white dark:border-zinc-850 shadow-xl">
                    <AvatarFallback
                      className={`${getAvatarColor(usuario.idUsuario)} text-white text-xl font-bold`}
                    >
                      {getInitials(usuario.nombreUsuario)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                      {usuario.nombreUsuario}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Briefcase className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                      <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                        {rolMap?.[usuario.id_rol] || "Usuario Estándar"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {usuario.idCliente === null
                           ? "Personal Interno"
                           : `Cliente Asociado`}
                      </p>
                    </div>
                  </div>
                </div>
                <StatusBadge statusId={usuario.idEstado} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Información de Registro */}
              <InfoCard
                icon={Calendar}
                iconColor="blue"
                title="Información de Registro"
              >
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                    Fecha de creación
                  </p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    {formatFecha(usuario.fechaCreacion)}
                  </p>
                </div>
                <Separator className="my-2 dark:bg-zinc-800" />
                <div>
                  <p className="text-sm font-mono font-bold text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 px-2 py-1 rounded-md inline-block">
                    #{usuario.idUsuario?.toString().padStart(4, "0") || "0000"}
                  </p>
                </div>
              </InfoCard>

              {/* Vinculación de Cliente */}
              <InfoCard
                icon={ShieldCheck}
                iconColor="violet"
                title="Vinculación"
              >
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Tipo de cuenta</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
                    {usuario.idCliente === null
                      ? "Personal Interno"
                      : `Cliente Asociado (#${usuario.idCliente})`}
                  </p>
                </div>
                <Separator className="my-2 dark:bg-zinc-800" />
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Nivel de Acceso</p>
                  <span className="text-xs bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-900/50 text-violet-700 dark:text-violet-300 px-2 py-1 rounded-md">
                    {rolMap?.[usuario.id_rol] || "Usuario"}
                  </span>
                </div>
              </InfoCard>

              {/* Estado Operativo */}
              <InfoCard
                icon={Activity}
                iconColor="emerald"
                title="Estado Operativo"
              >
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                    Última sincronización
                  </p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    Hoy (En tiempo real)
                  </p>
                </div>
              </InfoCard>

              {/* Seguridad */}
              <InfoCard icon={Award} iconColor="amber" title="Seguridad">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Estado de Email</p>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs text-slate-600 dark:text-slate-300">Verificado</span>
                  </div>
                </div>
              </InfoCard>
            </div>

            {/* Contacto */}
            <div className="bg-slate-50 dark:bg-zinc-950 rounded-xl p-4 border border-slate-100 dark:border-zinc-800/80">
              <div className="flex items-center gap-2 mb-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-slate-500 dark:text-slate-450"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Información de Contacto
                </h4>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                    Correo electrónico oficial
                  </p>
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200 break-all">
                      {usuario.email}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailsModal;
