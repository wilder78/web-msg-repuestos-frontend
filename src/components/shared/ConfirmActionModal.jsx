import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { AlertTriangle, Trash2, ShieldX, PowerOff } from "lucide-react";
import { cn } from "../../lib/utils";

export function ConfirmActionModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  loading = false, 
  title = "Confirmar acción",
  description = "Esta acción no se puede deshacer",
  itemName,
  itemSubtitle,
  itemId,
  variant = "danger", // "danger" para eliminar, "warning" para desactivar/inactivar
  error,
  alertMessage
}) {
  
  const isDanger = variant === "danger";
  const Icon = isDanger ? Trash2 : PowerOff;
  
  // Si hay error, lo tratamos como warning/error crítico visualmente.
  const displayError = error;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-[440px] p-0 overflow-hidden border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl rounded-2xl"
      >
        {/* Header */}
        <div className="bg-white dark:bg-zinc-900 px-6 pt-6 pb-4">
          <DialogHeader>
            <div className="flex items-center gap-3 text-left">
              <div className={cn(
                "p-2.5 rounded-xl text-center shrink-0",
                displayError ? "bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" : (isDanger ? "bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400" : "bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400")
              )}>
                {displayError ? (
                  <ShieldX className="h-5 w-5" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                  {displayError ? "Acción Restringida" : title}
                </DialogTitle>
                <DialogDescription className="text-gray-400 dark:text-zinc-400 text-sm mt-0.5">
                  {displayError ? "Error del sistema" : description}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Cuerpo */}
        <div className="px-6 pb-5 space-y-4 bg-white dark:bg-zinc-900">
          {displayError ? (
            <div className="flex items-start gap-4 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 rounded-xl animate-in fade-in zoom-in duration-300">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-amber-800 dark:text-amber-400 font-bold leading-tight">
                  No se pudo completar la acción
                </p>
                <p className="text-[12px] text-amber-700 dark:text-amber-300 mt-2 leading-relaxed">
                  {error}
                </p>
              </div>
            </div>
          ) : (
            <div className={cn(
              "flex items-start gap-3 p-4 border rounded-xl",
              isDanger ? "bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/40" : "bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/40"
            )}>
              <AlertTriangle className={cn("h-5 w-5 shrink-0 mt-0.5", isDanger ? "text-red-500" : "text-amber-500")} />
              <div>
                <div className="text-sm text-gray-700 dark:text-zinc-300 leading-normal">
                  {alertMessage || (
                    <>¿Estás seguro de que deseas procesar a <span className="font-bold text-gray-900 dark:text-white">{itemName}</span>?</>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Mini Card del Item */}
          {itemName && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800/80 rounded-xl overflow-hidden">
              <div className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center shrink-0 border border-white dark:border-zinc-800 shadow-sm font-bold text-xs",
                displayError ? "bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" : (isDanger ? "bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400" : "bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400")
              )}>
                {itemName.substring(0, 2).toUpperCase() || "??"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-gray-800 dark:text-zinc-200 break-words leading-tight">
                  {itemName}
                </p>
                {itemSubtitle && (
                  <p className="text-xs text-gray-400 dark:text-zinc-400 mt-1.5 leading-relaxed break-words">
                    {itemSubtitle}
                  </p>
                )}
              </div>
              {itemId && (
                <div className="shrink-0 ml-3">
                  <span className="text-[10px] bg-gray-200 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 px-2 py-1 rounded-md font-bold whitespace-nowrap">
                    ID: {itemId}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 bg-gray-50 dark:bg-zinc-950 border-t border-gray-100 dark:border-zinc-800/80 flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="flex-1 border-gray-300 dark:border-zinc-700 text-gray-600 dark:text-zinc-300 bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-xl h-11"
          >
            {displayError ? "Entendido" : "Cancelar"}
          </Button>
          
          {!displayError && (
            <Button
              onClick={onConfirm}
              disabled={loading}
              className={cn(
                "flex-1 font-semibold shadow-sm rounded-xl h-11 text-white",
                isDanger ? "bg-red-600 hover:bg-red-700" : "bg-amber-500 hover:bg-amber-600"
              )}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Procesando...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {isDanger ? "Eliminar Registro" : "Confirmar"}
                </div>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
