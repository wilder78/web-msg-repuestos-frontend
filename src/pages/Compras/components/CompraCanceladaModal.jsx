import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../../components/ui/dialog";
import { AlertTriangle, XCircle } from "lucide-react";

export default function CompraCanceladaModal({ isOpen, onClose, compra, onConfirm }) {
    const [loading, setLoading] = useState(false);

    if (!compra) return null;

    const idCompra = compra.idCompra || compra.id_compra || compra.id;
    const formatId = (id) => "C" + String(id || "0").padStart(3, "0");

    const handleConfirm = async () => {
        setLoading(true);
        try {
            await onConfirm(compra, 5); // 5 corresponds to 'Cancelada'
            onClose();
        } catch (error) {
            console.error("Error al cancelar la compra", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={!loading ? onClose : undefined}>
            <DialogContent
                className="sm:max-w-[425px] p-0 overflow-hidden bg-white dark:bg-zinc-900 border-0 dark:border dark:border-zinc-800 shadow-2xl rounded-2xl text-slate-900 dark:text-slate-100 transition-colors duration-300"
            >
                <div className="bg-red-50 dark:bg-red-950/20 px-6 py-6 border-b border-red-100 dark:border-red-900/30 flex flex-col items-center text-center">
                    <div className="h-16 w-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4 border-4 border-white dark:border-zinc-850 shadow-sm">
                        <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
                    </div>
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-red-900 dark:text-red-400">
                            Confirmar Cancelación
                        </DialogTitle>
                        <DialogDescription className="text-sm text-red-600/80 dark:text-red-400/70 mt-1 font-medium">
                            ¿Estás seguro de que deseas cancelar la compra {formatId(idCompra)}?
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-6 text-slate-600 dark:text-zinc-300 text-sm leading-relaxed text-center bg-white dark:bg-zinc-900">
                    <p>
                        Esta acción marcará el registro como <strong className="text-slate-800 dark:text-zinc-100">Cancelado</strong> permanentemente y bloqueará modificaciones futuras. Los productos de esta compra no ingresarán al inventario.
                    </p>
                </div>

                <div className="px-6 py-4 bg-slate-50 dark:bg-zinc-950 border-t border-slate-100 dark:border-zinc-800 flex justify-end gap-3 rounded-b-2xl">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2.5 rounded-xl font-semibold text-slate-650 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-750 hover:text-slate-800 dark:hover:text-zinc-100 transition-colors shadow-sm disabled:opacity-50"
                    >
                        Mantener compra
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-md shadow-red-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        ) : (
                            <XCircle className="h-4 w-4" />
                        )}
                        Sí, cancelar compra
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
