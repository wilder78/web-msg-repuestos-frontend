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
  FileText,
  Calendar,
  CheckCircle2,
  Hash,
  Activity,
  User,
  ShieldCheck,
  ShoppingBag
} from "lucide-react";
import InfoCard from "../../../components/shared/InfoCard";
import { Button } from "../../../components/ui/button";

const SalesDetailsModal = ({ isOpen, onClose, venta }) => {
  if (!venta) return null;

  const isCancelled = venta.id_estado === 3 || venta.idEstado === 3 || venta.estado === 'Anulada' || venta.estado === 'Anulado';

  const getInitials = (name) => {
    if (!name) return "NN";
    return name.substring(0, 2).toUpperCase();
  };

  const getAvatarColor = (id) => {
    const colors = ["bg-blue-500", "bg-emerald-500", "bg-violet-500", "bg-amber-500", "bg-rose-500"];
    return colors[(id || 0) % colors.length];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="w-full max-w-4xl lg:max-w-5xl p-0 overflow-y-auto bg-white dark:bg-zinc-900 border-0 dark:border dark:border-zinc-800 shadow-2xl rounded-2xl max-h-[90vh] text-slate-900 dark:text-slate-100"
      >
        {/* Encabezado */}
        <div className="relative bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 border-b border-slate-200 dark:border-zinc-800 shrink-0">
          <DialogHeader className="p-6 pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl shadow-lg ${isCancelled ? 'bg-gradient-to-br from-rose-500 to-rose-600' : 'bg-gradient-to-br from-blue-500 to-blue-600'}`}>
                  <ShoppingBag className="h-6 w-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-white">
                    Detalle de Venta
                  </DialogTitle>
                  <DialogDescription className="text-slate-500 dark:text-zinc-400 text-sm mt-1">
                    Información comercial y de facturación
                  </DialogDescription>
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
                <Avatar className="h-20 w-20 border-4 border-white dark:border-zinc-700 shadow-xl">
                  <AvatarFallback
                    className={`${getAvatarColor(venta.idVenta)} text-white text-xl font-bold`}
                  >
                    {getInitials(venta.cliente)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                    {venta.cliente}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-550" />
                    <p className="text-sm text-slate-600 dark:text-zinc-300 font-medium">
                      {venta.identificacion}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-slate-500 dark:text-zinc-450 font-mono">Folio: {venta.id}</span>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className={`px-3 py-1 rounded-full text-[10px] font-bold border mb-2 inline-flex items-center gap-1.5 ${isCancelled ? 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-450 dark:border-rose-900/50' : 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50'}`}>
                  <div className={`h-1.5 w-1.5 rounded-full ${isCancelled ? 'bg-rose-500' : 'bg-blue-500'}`} />
                  {isCancelled ? "Anulada" : "Completada"}
                </div>
                <p className={`text-3xl font-black ${isCancelled ? 'text-slate-400 dark:text-zinc-500 line-through' : 'text-blue-700 dark:text-blue-400'}`}>
                  {venta.valor}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Información de Registro */}
            <InfoCard
              icon={Calendar}
              iconColor="blue"
              title="Registro y Fecha"
            >
              <div>
                <p className="text-xs text-slate-500 dark:text-zinc-450 mb-1">Fecha de venta</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  {venta.fecha}
                </p>
              </div>
              <Separator className="my-2 dark:bg-zinc-800" />
              <div>
                <p className="text-xs text-slate-500 dark:text-zinc-450 mb-1">Datos de Contacto</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {venta.clienteCompleto?.direccion || "Dirección no registrada"}
                </p>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  {venta.clienteCompleto?.municipio?.nombre || venta.clienteCompleto?.municipio?.name || venta.clienteCompleto?.ciudad || "Ciudad no registrada"}
                </p>
                {venta.clienteCompleto?.telefono && (
                   <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                     Tel: {venta.clienteCompleto.telefono}
                   </p>
                )}
                {venta.clienteCompleto?.email && (
                   <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 break-all">
                     {venta.clienteCompleto.email}
                   </p>
                )}
              </div>
            </InfoCard>

            {/* Estado Operativo */}
            <InfoCard
              icon={Activity}
              iconColor="amber"
              title="Vínculo Comercial"
            >
              <div>
                <p className="text-xs text-slate-500 dark:text-zinc-450 mb-1">Pedido Asociado</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                   <Hash className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
                   {venta.idPedido || venta.pedido?.idPedido ? `Pedido #${venta.idPedido || venta.pedido?.idPedido}` : "Venta Directa"}
                </p>
              </div>
            </InfoCard>

            {/* Seguridad */}
            <InfoCard icon={ShieldCheck} iconColor="emerald" title="Auditoría">
              <div>
                <p className="text-xs text-slate-500 dark:text-zinc-450 mb-1">Registrado por</p>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs text-slate-600 dark:text-zinc-300">ID Usuario: {venta.idUsuario || 1}</span>
                </div>
              </div>
            </InfoCard>
          </div>

          {/* Detalles de Productos */}
          {venta.pedido?.detalles && venta.pedido.detalles.length > 0 && (
            <div className="bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden mb-6">
              <div className="px-4 py-3 bg-slate-100 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                <h4 className="text-sm font-semibold text-slate-700 dark:text-zinc-300">Productos del Pedido</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-zinc-900/60 text-slate-500 dark:text-zinc-400 font-medium border-b border-slate-200 dark:border-zinc-800">
                    <tr>
                      <th className="px-4 py-3">Codigo</th>
                      <th className="px-4 py-3">Descripcion</th>
                      <th className="px-4 py-3 text-center">Cantidad</th>
                      <th className="px-4 py-3 text-right">Precio Unit.</th>
                      <th className="px-4 py-3 text-right">Subtotal</th>
                      <th className="px-4 py-3 text-right">Descuento</th>
                      <th className="px-4 py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                    {venta.pedido.detalles.map((d, idx) => {
                      const cantidad = d.cantidad_solicitada || d.cantidad || 1;
                      const descuento = parseFloat(d.descuento_aplicado || d.descuento || 0);
                      
                      // En la base de datos, subtotal_linea es el valor NETO de la línea
                      const totalItem = parseFloat(d.subtotal_linea || d.subtotal || 0);
                      const subtotalItem = totalItem + descuento;
                      const precioUnitario = subtotalItem / cantidad;
                      
                      return (
                        <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/30 transition-colors">
                          <td className="px-4 py-3 text-violet-600 dark:text-violet-400 font-medium">
                            {d.producto?.referencia || d.producto?.codigoProducto || "N/A"}
                          </td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-250">
                            {d.producto?.nombre || d.producto?.nombreProducto || d.nombreProducto || "Producto"}
                          </td>
                          <td className="px-4 py-3 text-center text-slate-600 dark:text-zinc-300">{cantidad}</td>
                          <td className="px-4 py-3 text-right text-slate-600 dark:text-zinc-300">
                            ${precioUnitario.toLocaleString('es-CO', {maximumFractionDigits: 0})}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600 dark:text-zinc-300">
                            ${subtotalItem.toLocaleString('es-CO', {maximumFractionDigits: 0})}
                          </td>
                          <td className="px-4 py-3 text-right text-rose-500 dark:text-rose-400 font-medium">
                            -${descuento.toLocaleString('es-CO', {maximumFractionDigits: 0})}
                          </td>
                          <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400 font-semibold">
                            ${totalItem.toLocaleString('es-CO', {maximumFractionDigits: 0})}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* Totales */}
              <div className="bg-white dark:bg-zinc-900 p-4 border-t border-slate-200 dark:border-zinc-800">
                <div className="ml-auto w-full md:w-1/2 space-y-3">
                  {(() => {
                    let subtotalSinDescuento = 0;
                    let descuentoTotal = 0;
                    let subtotalConDescuento = 0;

                    venta.pedido.detalles.forEach(d => {
                      const totalItem = parseFloat(d.subtotal_linea || d.subtotal || 0);
                      const descuento = parseFloat(d.descuento_aplicado || d.descuento || 0);
                      const subtotalItem = totalItem + descuento;

                      subtotalSinDescuento += subtotalItem;
                      descuentoTotal += descuento;
                      subtotalConDescuento += totalItem;
                    });
                    
                    const ivaTotal = subtotalConDescuento * 0.19;
                    const totalPagar = subtotalConDescuento + ivaTotal;

                    return (
                      <>
                        <div className="flex justify-between items-center text-sm p-2 bg-slate-50 dark:bg-zinc-950/60 rounded-lg">
                          <span className="text-slate-500 dark:text-zinc-450">Subtotal sin descuento:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">${subtotalSinDescuento.toLocaleString('es-CO', {maximumFractionDigits: 0})}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm p-2 bg-slate-50 dark:bg-zinc-950/60 rounded-lg">
                          <span className="text-slate-500 dark:text-zinc-450">Descuento Total:</span>
                          <span className="font-bold text-rose-600 dark:text-rose-450">-${descuentoTotal.toLocaleString('es-CO', {maximumFractionDigits: 0})}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm p-2 bg-slate-50 dark:bg-zinc-950/60 rounded-lg">
                          <span className="text-slate-500 dark:text-zinc-450">IVA Total (19%):</span>
                          <span className="font-bold text-amber-600 dark:text-amber-450">${ivaTotal.toLocaleString('es-CO', {maximumFractionDigits: 0})}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-violet-50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/30 rounded-xl mt-2">
                          <span className="text-violet-800 dark:text-violet-400 font-semibold flex items-center gap-2">
                            <span className="text-lg">$</span> Total a Pagar:
                          </span>
                          <span className="text-xl font-bold text-violet-900 dark:text-violet-300">${totalPagar.toLocaleString('es-CO', {maximumFractionDigits: 0})}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* Botón Ver PDF */}
          <div className="flex justify-end pt-2 pb-1">
            <Button 
              size="sm"
              variant="outline"
              className="h-8 rounded-lg border-blue-200 dark:border-zinc-700 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-zinc-800 hover:text-blue-800 dark:hover:text-blue-300 flex gap-2"
              onClick={() => window.print()}
            >
              <FileText size={14} /> Ver PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SalesDetailsModal;
