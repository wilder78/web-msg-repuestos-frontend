import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { ShieldAlert, Info, History } from "lucide-react";

/**
 * Modal global para restringir acciones por integridad referencial.
 * @param {string} itemName - Nombre del objeto que no se pudo borrar (ej: "Bujía NGK").
 * @param {string} entityName - Tipo de entidad (ej: "el producto", "el proveedor").
 * @param {string} suggestion - La alternativa que ofrece el sistema.
 */
export function ConflictActionModal({ 
  isOpen, 
  onClose, 
  itemName = "", 
  entityName = "el registro",
  suggestion = "cambiar su estado a 'Inactivo' en lugar de borrarlo." 
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-[460px] p-0 overflow-hidden border-0 shadow-2xl rounded-3xl bg-white"
      >
        {/* Cabecera de Advertencia */}
        <div className="bg-amber-50/50 px-8 pt-8 pb-6 text-center border-b border-amber-100/50">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-100 rounded-3xl mb-4 shadow-sm ring-4 ring-amber-50">
            <ShieldAlert className="h-10 w-10 text-amber-600" />
          </div>
          <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight">
            Acción Restringida
          </DialogTitle>
          <DialogDescription className="text-slate-500 font-medium mt-2">
            Seguridad contable y de integridad de datos.
          </DialogDescription>
        </div>

        {/* Contenido Dinámico */}
        <div className="px-8 py-8 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-amber-700 bg-amber-50 px-4 py-3 rounded-2xl border border-amber-100">
              <History size={20} className="shrink-0" />
              <p className="text-sm font-bold leading-tight">
                Historial transaccional detectado
              </p>
            </div>
            
            <p className="text-[14px] text-slate-600 leading-relaxed font-medium">
              No es posible eliminar permanentemente a <span className="font-bold text-slate-900">"{itemName}"</span> porque {entityName} está vinculado a información crítica (ventas, facturas o movimientos de inventario).
            </p>
          </div>

          {/* Sugerencia Genérica */}
          <div className="flex items-start gap-4 p-5 bg-slate-50 border border-slate-100 rounded-2xl">
            <div className="p-2 bg-blue-100 rounded-xl">
              <Info className="h-5 w-5 text-blue-600" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Alternativa recomendada</p>
              <p className="text-[13px] text-slate-500 font-medium leading-snug">
                Si deseas suspender este registro, te sugerimos <span className="text-blue-600 font-bold">{suggestion}</span>
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="px-8 pb-8 sm:flex-col gap-3">
          <Button
            onClick={onClose}
            className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl transition-all shadow-lg active:scale-[0.98]"
          >
            Entendido, cerrar
          </Button>
          <p className="text-[11px] text-slate-400 text-center font-medium italic">
            Esta restricción garantiza la precisión de tus reportes financieros.
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}