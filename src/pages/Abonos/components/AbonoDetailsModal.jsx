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
  HandCoins,
  Calendar,
  FileText,
  CheckCircle2,
  XCircle,
  CreditCard,
  Hash,
  Activity,
  User,
  ShieldCheck,
  Printer
} from "lucide-react";
import InfoCard from "../../../components/shared/InfoCard";
import { Button } from "../../../components/ui/button";

const TIPO_ABONO_MAP = {
  credito: { label: "Cartera General", color: "violet" },
  contado: { label: "Venta Contado",  color: "blue" },
};

const AbonoDetailsModal = ({
  isOpen,
  onClose,
  item,
  getAvatarColor,
  getInitials,
}) => {
  if (!item) return null;

  const isCancelled = item.idEstado === 3;

  const auditadoPor = item.usuario?.empleado
    ? `${item.usuario.empleado.nombre} ${item.usuario.empleado.apellido}`
    : item.usuario?.nombreUsuario || `ID Usuario: ${item.idUsuario || 1}`;
  const tipoAbono = TIPO_ABONO_MAP[item.tipoAbono] || {
    label: item.tipoAbono || "General",
    color: "slate",
  };
  
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
        className="w-full max-w-4xl lg:max-w-5xl p-0 overflow-y-auto bg-white dark:bg-zinc-900 border-0 dark:border dark:border-zinc-800 shadow-2xl rounded-2xl max-h-[90vh] text-slate-900 dark:text-slate-100"
      >
        {/* Encabezado con degradado suave */}
        <div className="relative bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 border-b border-slate-200 dark:border-zinc-800">
          <DialogHeader className="p-6 pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl shadow-lg ${isCancelled ? 'bg-gradient-to-br from-rose-500 to-rose-600' : 'bg-gradient-to-br from-emerald-500 to-emerald-600'}`}>
                  <HandCoins className="h-6 w-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-white">
                    Recibo de Caja
                  </DialogTitle>
                  <DialogDescription className="text-slate-500 dark:text-zinc-400 text-sm mt-1">
                    Información contable registrada en el sistema
                  </DialogDescription>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase border ${
                      tipoAbono.color === "violet"
                        ? "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-900/50"
                        : tipoAbono.color === "blue"
                          ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50"
                          : "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                    }`}>
                      {tipoAbono.label}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6 bg-white dark:bg-zinc-900">
          {/* Perfil del Cliente / Resumen Principal */}
          <div className="bg-gradient-to-br from-slate-50 to-white dark:from-zinc-900/60 dark:to-zinc-950 p-5 rounded-2xl border border-slate-200 dark:border-zinc-800/80 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-5">
                <Avatar className="h-20 w-20 border-4 border-white dark:border-zinc-800 shadow-xl">
                  <AvatarFallback
                    className={`${getAvatarColor(item.idCliente)} text-white text-xl font-bold`}
                  >
                    {getInitials(item.cliente?.razonSocial || item.clienteNombre)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                    {item.cliente?.razonSocial || item.clienteNombre}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
                    <p className="text-sm text-slate-600 dark:text-zinc-300 font-medium">
                      {item.cliente?.tipoDocumento?.sigla || "NIT/CC"}: {item.cliente?.numeroDocumento || item.idCliente}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-2">
                       <span className="text-xs text-slate-500 dark:text-zinc-450 font-mono">Folio: RCP-{item.idAbono?.toString().padStart(4, "0")}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className={`px-3 py-1 rounded-full text-[10px] font-bold border mb-2 inline-flex items-center gap-1.5 ${
                  isCancelled 
                    ? 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/50' 
                    : 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50'
                }`}>
                  <div className={`h-1.5 w-1.5 rounded-full ${isCancelled ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                  {isCancelled ? "Anulado" : "Activo"}
                </div>
                <p className={`text-3xl font-black ${isCancelled ? 'text-slate-400 dark:text-zinc-500 line-through' : 'text-emerald-700 dark:text-emerald-400'}`}>
                  ${parseFloat(item.montoAbono).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Información del Pago */}
            <InfoCard
              icon={CreditCard}
              iconColor={isCancelled ? "rose" : "emerald"}
              title="Información Financiera"
            >
              <div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mb-1">Método de Pago</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200 capitalize">
                  {item.metodoPago}
                </p>
              </div>
              <Separator className="my-2 dark:bg-zinc-800" />
              <div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mb-1">Referencia</p>
                <p className="text-sm font-mono font-bold text-slate-700 dark:text-zinc-350 bg-slate-100 dark:bg-zinc-800 px-2 py-1 rounded-md inline-block">
                  {item.referencia || "N/A"}
                </p>
              </div>
            </InfoCard>

            {/* Información de Registro */}
            <InfoCard
              icon={Calendar}
              iconColor="blue"
              title="Registro y Fecha"
            >
              <div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mb-1">Fecha de creación</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-blue-600 dark:text-blue-450" />
                  {formatFecha(item.fechaAbono)}
                </p>
              </div>
              <Separator className="my-2 dark:bg-zinc-800" />
              <div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mb-1">Aplicación</p>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase border ${
                  tipoAbono.color === "violet"
                    ? "bg-violet-50 text-violet-700 border-violet-100 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-900/50"
                    : tipoAbono.color === "blue"
                      ? "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50"
                      : "bg-slate-50 text-slate-700 border-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                }`}>
                   {tipoAbono.label}
                </span>
              </div>
            </InfoCard>

            {/* Estado Operativo */}
            <InfoCard
              icon={Activity}
              iconColor="amber"
              title="Vínculo del Pago"
            >
              <div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mb-1">Documento Asociado</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-2">
                   <Hash className="h-3.5 w-3.5 text-amber-500 dark:text-amber-450" />
                   {item.idPedido ? `Pedido #${item.idPedido}` : `Crédito Global`}
                </p>
              </div>
            </InfoCard>

            {/* Seguridad */}
            <InfoCard icon={ShieldCheck} iconColor="violet" title="Seguridad">
              <div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mb-1">Auditado por</p>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-450" />
                  <span className="text-xs text-slate-600 dark:text-zinc-300 font-medium">{auditadoPor}</span>
                </div>
              </div>
            </InfoCard>

            {/*  Descripción */}
            <InfoCard icon={FileText} iconColor="slate" title="Descripción">
              <div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mb-1">Detalle del abono</p>
                <p className="text-sm font-medium text-slate-800 dark:text-zinc-200 leading-relaxed">
                  {item.descripcion || "Registro de abono a balance"}
                </p>
              </div>
            </InfoCard>
          </div>

          {/* Botón Ver PDF */}
          <div className="flex justify-end pt-2 pb-1">
            <Button 
              size="sm"
              variant="outline"
              className="h-8 rounded-lg border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-800 dark:hover:text-emerald-300 flex gap-2"
              onClick={() => window.print()}
            >
              <Printer size={14} /> Ver PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AbonoDetailsModal;
