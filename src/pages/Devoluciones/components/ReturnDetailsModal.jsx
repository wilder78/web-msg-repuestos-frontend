import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../../components/ui/dialog";
import { Badge } from "../../../components/ui/badge";
import { Avatar, AvatarFallback } from "../../../components/ui/avatar";
import { Separator } from "../../../components/ui/separator";
import { Button } from "../../../components/ui/button";
import {
  RotateCcw,
  Calendar,
  PackageOpen,
  BadgeDollarSign,
  Undo2,
  Receipt,
  ShoppingCart,
  FileText,
  ExternalLink,
  UserCheck,
  ShieldCheck,
  Activity
} from "lucide-react";
import InfoCard from "../../../components/shared/InfoCard";

const ReturnDetailsModal = ({
  isOpen,
  onClose,
  devolucion,
  getAvatarColor,
  getInitials,
}) => {
  if (!devolucion) return null;

  const formatFecha = (fecha) => {
    if (!fecha) return "No registrada";
    try {
      return new Date(fecha).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return fecha;
    }
  };

  const fmt = (n) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(n ?? 0);

  // Ajuste de estados según el ID de estado de la DB
  const isAnulado = devolucion.idEstadoDevolucion === 2;
  const statusText = isAnulado ? "Anulada" : "Completada";
  
  const items = devolucion.detalles || devolucion.itemsDevueltos || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="w-full max-w-4xl lg:max-w-5xl p-0 overflow-y-auto bg-white dark:bg-zinc-900 border-0 dark:border dark:border-zinc-800 shadow-2xl rounded-2xl max-h-[90vh] text-slate-900 dark:text-slate-100"
      >
        {/* Encabezado con gradiente slate/white */}
        <div className="relative bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 border-b border-slate-200 dark:border-zinc-800 shrink-0">
          <DialogHeader className="p-6 pb-4">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl shadow-lg ${isAnulado ? 'bg-slate-400' : 'bg-gradient-to-br from-blue-500 to-blue-600'}`}>
                <RotateCcw className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-white">
                  Acta de Reingreso
                </DialogTitle>
                <DialogDescription className="text-slate-500 dark:text-zinc-400 text-sm mt-1">
                  Resumen técnico y contable de la devolución de mercancía
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {devolucion && (
          <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh] custom-scrollbar bg-white dark:bg-zinc-900">
            
            {/* BANNER DE COMPROBANTE CLOUDINARY */}
            {devolucion.urlComprobante && (
              <div className="flex items-center justify-between p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-2xl border border-blue-100 dark:border-blue-900/30 animate-in fade-in zoom-in duration-300">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-600 p-2 rounded-lg text-white shadow-md">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-blue-900 dark:text-blue-200 uppercase tracking-tight">Comprobante Digital</p>
                    <p className="text-[10px] text-blue-700 dark:text-blue-400 font-medium">Documento almacenado en Cloudinary</p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="bg-white dark:bg-zinc-900 border-blue-200 dark:border-zinc-700 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-zinc-800 hover:text-blue-800 dark:hover:text-blue-300 shadow-sm rounded-xl font-bold h-9"
                  onClick={() => window.open(devolucion.urlComprobante, "_blank")}
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-2" />
                  Ver PDF
                </Button>
              </div>
            )}

            {/* Sección de Cliente */}
            <div className="bg-gradient-to-br from-slate-50 to-white dark:from-zinc-900/60 dark:to-zinc-950 p-5 rounded-2xl border border-slate-200 dark:border-zinc-800/80 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <Avatar className="h-20 w-20 border-4 border-white dark:border-zinc-700 shadow-xl ring-1 ring-slate-100 dark:ring-zinc-800">
                    <AvatarFallback
                      className={`${getAvatarColor(devolucion.idCliente)} text-white text-xl font-bold`}
                    >
                      {getInitials(devolucion.cliente?.razonSocial || devolucion.clienteNombre)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                      {devolucion.cliente?.razonSocial || devolucion.clienteNombre || "Cliente General"}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-900/50 font-bold text-[10px] uppercase rounded-full">
                        <ShoppingCart className="h-3 w-3 mr-1" />
                        Factura: {devolucion.numeroFactura || "N/A"}
                      </Badge>
                      <Badge variant="outline" className="bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700 font-bold text-[10px] uppercase rounded-full">
                        Venta #{devolucion.idVenta || "---"}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Badge className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  isAnulado 
                    ? 'bg-rose-100 dark:bg-rose-950/30 text-rose-700 dark:text-rose-450 border-rose-200 dark:border-rose-900/50' 
                    : 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-450 border-emerald-200 dark:border-emerald-900/50'
                }`}>
                  {statusText}
                </Badge>
              </div>
            </div>

            {/* Info Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoCard icon={Calendar} iconColor="blue" title="Cronología del Evento">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-450 uppercase mb-1">Fecha de Registro</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                    {formatFecha(devolucion.fechaDevolucion)}
                  </p>
                </div>
                <Separator className="my-3 dark:bg-zinc-800" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-450 uppercase mb-1">Identificador Fiscal</p>
                  <p className="text-sm font-mono font-black text-slate-700 dark:text-slate-250 bg-slate-100 dark:bg-zinc-800 px-3 py-1.5 rounded-xl inline-block border border-slate-200 dark:border-zinc-700">
                    DEV-{devolucion.idDevolucion?.toString().padStart(4, "0")}
                  </p>
                </div>
              </InfoCard>

              <InfoCard icon={BadgeDollarSign} iconColor="emerald" title="Resumen Contable">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-450 uppercase mb-1">Saldo a Favor Generado</p>
                  <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter">
                    {fmt(devolucion.totalAjuste || devolucion.totalDevolucion)}
                  </p>
                </div>
                <Separator className="my-3 dark:bg-zinc-800" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-450 uppercase">Estado Operativo</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Activity className={`h-3.5 w-3.5 ${isAnulado ? 'text-rose-500' : 'text-emerald-500'}`} />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-250 uppercase tracking-tight">{statusText}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-450 uppercase">Aprobado Por</p>
                    <div className="flex items-center gap-1.5 mt-1 justify-end">
                      <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-250">{devolucion.usuarioAnulo?.nombreUsuario || devolucion.registradoPor || "Admin"}</span>
                    </div>
                  </div>
                </div>
              </InfoCard>
            </div>

            {/* Motivo y Tipo Ajuste */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-rose-50/40 dark:bg-rose-950/10 p-5 rounded-2xl border border-rose-100 dark:border-rose-900/30 shadow-sm group transition-all hover:bg-rose-50/60 dark:hover:bg-rose-950/20">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-rose-100 dark:bg-rose-900/40 rounded-lg">
                    <Undo2 className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                  </div>
                  <h4 className="text-xs font-black text-slate-700 dark:text-slate-250 uppercase tracking-widest">
                    Motivo del Reingreso
                  </h4>
                </div>
                <p className="text-sm text-slate-600 dark:text-zinc-300 italic leading-relaxed bg-white/50 dark:bg-zinc-900/50 p-3 rounded-xl border border-rose-100/50 dark:border-rose-900/30">
                  "{devolucion.motivo || "No se registraron comentarios detallados para esta transacción."}"
                </p>
              </div>

              <div className="bg-violet-50/40 dark:bg-violet-950/10 p-5 rounded-2xl border border-violet-100 dark:border-violet-900/30 shadow-sm group transition-all hover:bg-violet-50/60 dark:hover:bg-violet-950/20">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-violet-100 dark:bg-violet-900/40 rounded-lg">
                    <RotateCcw className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  </div>
                  <h4 className="text-xs font-black text-slate-700 dark:text-slate-250 uppercase tracking-widest">
                    Tipo de Movimiento
                  </h4>
                </div>
                <div className="mt-1">
                  <Badge className="bg-violet-600 dark:bg-violet-750 text-white border-0 px-4 py-1.5 rounded-xl font-bold">
                    {devolucion.tipoAjuste || "Devolución de Mercancía"}
                  </Badge>
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-3 font-medium flex items-center gap-1">
                    <Activity className="h-3 w-3" />
                    Impacto directo en Kardex e Inventario
                  </p>
                </div>
              </div>
            </div>

            {/* Tabla de Productos */}
            {items.length > 0 && (
              <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-100 dark:bg-emerald-950/20 rounded-lg">
                      <PackageOpen className="h-4 w-4 text-emerald-600 dark:text-emerald-450" />
                    </div>
                    <h4 className="text-sm font-black text-slate-700 dark:text-slate-250 uppercase tracking-tight">
                      Ítems Afectados
                    </h4>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400">
                    {items.length} {items.length === 1 ? 'Producto' : 'Productos'}
                  </Badge>
                </div>
                
                <div className="border border-slate-100 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-zinc-950 text-[10px] text-slate-500 dark:text-zinc-400 font-black uppercase tracking-widest border-b border-slate-100 dark:border-zinc-850">
                      <tr>
                        <th className="px-4 py-3 text-left">Producto / Referencia</th>
                        <th className="px-4 py-3 text-center">Cantidad</th>
                        <th className="px-4 py-3 text-right">Valor Línea</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-zinc-850">
                      {items.map((it, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-zinc-950/30 transition-colors">
                          <td className="px-4 py-4">
                            <p className="font-bold text-slate-800 dark:text-slate-200 leading-tight">
                              {it.producto?.nombre || it.nombreProducto || it.nombre || "Producto desconocido"}
                            </p>
                            <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1 font-mono">
                              ID: {it.idProducto} {it.producto?.referencia && `· REF: ${it.producto.referencia}`}
                            </p>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className="inline-flex items-center justify-center bg-slate-100 dark:bg-zinc-950 text-slate-700 dark:text-zinc-300 font-black px-2.5 py-1 rounded-lg text-xs min-w-[32px]">
                              {it.cantidadDevuelta || it.cantDevolver || it.cantidad || 0}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <p className="font-black text-emerald-600 dark:text-emerald-450">
                              {fmt(it.subtotalLinea || (parseFloat(it.cantidadDevuelta || 0) * parseFloat(it.precioUnitario || 0)))}
                            </p>
                            <p className="text-[10px] text-slate-400 dark:text-zinc-550 mt-0.5">
                              Unit: {fmt(it.precioUnitario || it.precio || 0)}
                            </p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50/80 dark:bg-zinc-950/80 font-black text-slate-900 dark:text-slate-100 border-t border-slate-100 dark:border-zinc-800">
                      <tr>
                        <td colSpan={2} className="px-4 py-4 text-right uppercase text-[10px] tracking-widest text-slate-500">Total Liquidado</td>
                        <td className="px-4 py-4 text-right text-lg tracking-tighter text-emerald-700 dark:text-emerald-450">
                          {fmt(devolucion.totalAjuste || devolucion.totalDevolucion)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ReturnDetailsModal;