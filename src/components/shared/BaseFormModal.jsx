import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Loader2, CheckCircle2 } from "lucide-react";

// ✅ Declaración de la función con todas sus props
export function BaseFormModal({ 
  isOpen, 
  onClose, 
  title, 
  subtitle,
  icon: Icon,
  children,
  loading = false,
  isSubmitDisabled = false,
  isEditing = false,
  saveSuccess = false,
  maxWidthClass = "sm:max-w-[640px]",
  onSubmit, // ✅ reemplaza formId
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal={false}>
      <DialogContent 
        className={`${maxWidthClass} p-0 overflow-hidden rounded-2xl gap-0 border-0 dark:border dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl text-[#0f172a] dark:text-slate-100`}
      >
        <DialogHeader className="px-5 md:px-7 pt-5 md:pt-6 pb-0">
          <div className="flex items-center gap-2.5 text-[#10b981]">
            {Icon && <Icon className="h-5 w-5" />}
            <DialogTitle className="text-[#0f172a] dark:text-white text-lg font-bold">
              {title}
            </DialogTitle>
          </div>
          {subtitle && (
            <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">{subtitle}</p>
          )}
        </DialogHeader>

        <div className="px-5 md:px-7 py-4 md:py-6 max-h-[60vh] md:max-h-[72vh] overflow-y-auto bg-white dark:bg-zinc-900 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-zinc-800">
          {children}
        </div>

        <div className="mx-5 md:mx-7 h-px bg-slate-100 dark:bg-zinc-800 mb-4 md:mb-6" />

        <DialogFooter className="px-5 md:px-7 pb-5 md:pb-6 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
          <Button
            type="button"
            onClick={onSubmit}
            disabled={loading || isSubmitDisabled || saveSuccess}
            className={`w-full sm:flex-1 h-[46px] rounded-xl font-semibold transition-all duration-300 ${
              saveSuccess
                ? "bg-emerald-500 shadow-none text-white"
                : (loading || isSubmitDisabled)
                  ? "bg-slate-300 cursor-not-allowed text-slate-500 shadow-none hover:bg-slate-300 dark:bg-zinc-800 dark:text-zinc-600"
                  : "bg-[#10b981] hover:bg-[#0da673] shadow-[0_4px_14px_rgba(16,185,129,0.3)] text-white"
            }`}
          >
            {saveSuccess ? (
              <><CheckCircle2 className="mr-2 h-5 w-5" />{isEditing ? "Actualizado" : "Creado"}</>
            ) : loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isEditing ? "Actualizando..." : "Guardando..."}</>
            ) : (
              isEditing ? "Guardar Cambios" : "Guardar Registro"
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="w-full sm:flex-1 h-[46px] rounded-xl border-slate-200 dark:border-zinc-800 text-slate-400 dark:text-zinc-500 bg-transparent hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-900/50 font-semibold transition-all duration-300"
          >
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
