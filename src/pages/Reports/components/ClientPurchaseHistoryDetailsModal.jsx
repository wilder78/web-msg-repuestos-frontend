import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import HistorialCompras from "../../../components/shared/HistorialCompras";
import { ShoppingBag, Users } from "lucide-react";

export default function ClientPurchaseHistoryDetailsModal({
  isOpen,
  onClose,
  customer,
}) {
  if (!customer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="w-full max-w-4xl lg:max-w-5xl p-0 overflow-y-auto bg-white dark:bg-zinc-900 border-0 dark:border dark:border-zinc-800 shadow-2xl rounded-2xl max-h-[90vh] text-slate-900 dark:text-slate-100 transition-colors duration-300"
        id="purchase-history-modal"
      >
        {/* Header de gradient similar a UserDetailsModal */}
        <div className="relative bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 border-b border-slate-200 dark:border-zinc-800">
          <DialogHeader className="p-6 pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg shadow-emerald-500/25">
                  <ShoppingBag className="h-6 w-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
                    Historial de Compras
                  </DialogTitle>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium mt-0.5">
                    Historial detallado para el cliente: <span className="font-semibold text-slate-800 dark:text-zinc-200">{customer.razonSocial}</span> (Doc: {customer.numeroDocumento})
                  </p>
                </div>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Contenido */}
        <div className="p-6 overflow-y-auto">
          <HistorialCompras idCliente={customer.idCliente} customer={customer} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
