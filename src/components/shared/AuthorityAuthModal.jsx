import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { AlertCircle, Loader2, LockKeyhole, Mail, ShieldCheck } from "lucide-react";

export const AuthorityAuthModal = ({
  isOpen,
  onClose,
  email,
  onEmailChange,
  password,
  onPasswordChange,
  onConfirm,
  loading,
  error,
  title = "Autorización Requerida",
  description = "Esta acción requiere validación de un usuario con privilegios de Administrador o Master.",
  actionDetail,
}) => {
  const showEmailField = typeof onEmailChange === "function";
  const isConfirmDisabled = !password || loading || (showEmailField && !email);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-[440px] bg-white dark:bg-zinc-900 p-0 border border-slate-200 dark:border-zinc-800 shadow-2xl rounded-2xl overflow-hidden text-slate-900 dark:text-slate-100"
      >
        <DialogHeader className="px-6 pt-6 pb-4 bg-white dark:bg-zinc-900">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
              <LockKeyhole className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-slate-950 dark:text-white">
                {title}
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm text-slate-600 dark:text-zinc-400">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="border-t border-slate-100 dark:border-zinc-800 px-6 py-5 bg-white dark:bg-zinc-900 space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/60 dark:bg-emerald-950/20 px-4 py-3 text-sm">
            <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-450" />
            <div>
              <p className="font-bold text-emerald-800 dark:text-emerald-450 text-[11px]">
                Detalle de la Operación:
              </p>
              <p className="text-sm text-slate-700 dark:text-zinc-300">
                {actionDetail || "Operación administrativa sensible"}
              </p>
            </div>
          </div>

          {showEmailField && (
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-zinc-300">
                Correo del autorizador (Master/Admin)
              </span>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-zinc-500" />
                <input
                  type="email"
                  value={email || ""}
                  onChange={(e) => onEmailChange(e.target.value)}
                  placeholder="admin@empresa.com"
                  autoFocus
                  className="h-11 w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-3 text-sm text-slate-900 dark:text-white outline-none transition-all focus:border-emerald-300 dark:focus:border-emerald-800 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/30"
                />
              </div>
            </label>
          )}

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-zinc-300">
              Contraseña de autoridad (Master/Admin)
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !isConfirmDisabled && onConfirm()}
              className="h-11 w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-slate-900 dark:text-white outline-none transition-all focus:border-emerald-300 dark:focus:border-emerald-800 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/30"
              autoFocus={!showEmailField}
            />
          </label>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-100 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 px-3 py-2 text-xs text-red-700 dark:text-red-400 font-medium">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/80 px-6 py-4 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="h-11 flex-1 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 text-sm font-semibold text-slate-700 dark:text-zinc-300 transition hover:bg-slate-50 dark:hover:bg-zinc-850 hover:text-red-600 dark:hover:text-red-450 hover:border-red-200 dark:hover:border-red-900/50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isConfirmDisabled}
            className="h-11 flex-1 rounded-xl bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-350 dark:disabled:bg-zinc-800 disabled:text-slate-500 dark:disabled:text-zinc-500 disabled:shadow-none flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Confirmar Autorización"
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
