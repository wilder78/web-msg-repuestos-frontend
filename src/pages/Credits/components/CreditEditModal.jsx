import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../../components/ui/dialog";
import { Label } from "../../../components/ui/label";
import { Input } from "../../../components/ui/input";
import { Save, UserCheck, Loader2, CheckCircle2, XCircle, BadgeDollarSign } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:8080/api").replace(/\/$/, "");

const getToken = () => localStorage.getItem("token") || sessionStorage.getItem("token") || "";
const authHeaders = () => ({
    "Content-Type": "application/json",
    ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

export default function CreditEditModal({ isOpen, onClose, item, onSuccess }) {
    const [cupoAprobado, setCupoAprobado] = useState("");
    const [idEstado, setIdEstado] = useState("1");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // Sincronizar con el item cuando se abre
    useEffect(() => {
        if (!isOpen || !item) return;
        setCupoAprobado(String(item.cupoAprobado ?? item.montoCredito ?? ""));
        setIdEstado(String(item.idEstado ?? 1));
        setError(null);
        setSuccess(false);
    }, [isOpen, item]);

    if (!item) return null;

    const cupoNum = parseFloat(cupoAprobado);
    const isCupoValid = !isNaN(cupoNum) && cupoNum >= 0;

    const hasChanged =
        cupoNum !== parseFloat(item.cupoAprobado ?? item.montoCredito ?? 0) ||
        Number(idEstado) !== Number(item.idEstado ?? 1);

    const canSubmit = isCupoValid && hasChanged && !loading;

    const handleSubmit = async () => {
        if (!canSubmit) return;
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`${API_BASE_URL}/credits/${item.idCredito}`, {
                method: "PUT",
                headers: authHeaders(),
                body: JSON.stringify({
                    cupoAprobado: cupoNum,
                    idEstado: Number(idEstado),
                }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                throw new Error(data.message ?? data.error ?? `Error ${res.status}`);
            }

            setSuccess(true);

            // Notificar al padre con el objeto actualizado del backend
            const updatedCredit = data.credit ?? data.data ?? {};
            if (onSuccess) {
                onSuccess({
                    ...item,
                    ...updatedCredit,
                    cupoAprobado: cupoNum,
                    montoCredito: cupoNum,
                    cupoUtilizado: parseFloat(item.cupoUtilizado ?? 0),
                    cupoDisponible: cupoNum - parseFloat(item.cupoUtilizado ?? 0),
                    idEstado: Number(idEstado),
                    estado: Number(idEstado) === 1 ? "Activo" : "Suspendido",
                });
            }

            setTimeout(() => {
                onClose();
                setSuccess(false);
            }, 1400);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                className="sm:max-w-[500px] p-0 overflow-hidden bg-white dark:bg-zinc-900 border-0 dark:border dark:border-zinc-800 shadow-2xl rounded-2xl text-slate-900 dark:text-slate-100"
            >
                {/* Encabezado estándar */}
                <div className="bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 border-b border-slate-200 dark:border-zinc-800 shrink-0">
                    <DialogHeader className="p-6 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-md">
                                <BadgeDollarSign className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    Ajustar Crédito
                                    <span className="text-xs bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 px-2 py-0.5 rounded font-mono font-normal">
                                        #C-{item.idCredito}
                                    </span>
                                </DialogTitle>
                                <DialogDescription className="text-slate-500 dark:text-zinc-400 text-sm mt-0.5">
                                    Modifica el cupo aprobado o el estado del crédito
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                <div className="px-6 py-5 space-y-5 bg-white dark:bg-zinc-900">

                    {/* Error */}
                    {error && (
                        <div className="flex items-start gap-3 rounded-xl border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-950/20 px-4 py-3 text-red-700 dark:text-red-400">
                            <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                            <div>
                                <p className="text-sm font-bold">No se pudo guardar</p>
                                <p className="text-xs mt-0.5">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Éxito */}
                    {success && (
                        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 dark:border-emerald-900/30 bg-emerald-50 dark:bg-emerald-950/20 px-4 py-3 text-emerald-700 dark:text-emerald-450">
                            <CheckCircle2 className="h-5 w-5 shrink-0" />
                            <p className="text-sm font-semibold">Crédito actualizado correctamente</p>
                        </div>
                    )}

                    {/* Tarjeta del cliente (solo lectura) */}
                    <div className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-zinc-850 bg-slate-50 dark:bg-zinc-950/60 px-4 py-3">
                        <div className="w-9 h-9 bg-emerald-100 dark:bg-emerald-950/20 rounded-full flex items-center justify-center">
                            <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-450" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                {item.clienteNombre || `Cliente #${item.idCliente ?? item.id_cliente}`}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-zinc-400">
                                ID Cliente: {item.idCliente ?? item.id_cliente}
                                {item.numeroDocumento ? ` · Doc: ${item.numeroDocumento}` : ""}
                            </p>
                        </div>
                    </div>

                    {/* Cupo actual → nuevo */}
                    <div>
                        <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5 block">
                            Cupo Aprobado <span className="text-emerald-500">*</span>
                            <span className="ml-2 font-normal text-slate-400 dark:text-zinc-500">
                                Actual: ${parseFloat(item.cupoAprobado ?? item.montoCredito ?? 0).toFixed(2)}
                            </span>
                        </Label>
                        <div className="relative">
                            <span className="absolute left-4 top-2.5 text-slate-500 dark:text-zinc-500 font-bold">$</span>
                            <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={cupoAprobado}
                                onChange={(e) => {
                                    setCupoAprobado(e.target.value);
                                    setError(null);
                                }}
                                className={`pl-8 h-11 rounded-xl font-bold text-lg border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus-visible:ring-[#10b981]
                                    ${cupoAprobado && !isCupoValid ? "border-red-300 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20" : ""}`}
                                disabled={loading || success}
                            />
                        </div>
                        {cupoAprobado && !isCupoValid && (
                            <p className="text-red-500 text-[11px] mt-1">El cupo no puede ser negativo.</p>
                        )}
                        {isCupoValid && cupoNum !== parseFloat(item.cupoAprobado ?? 0) && (
                            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                                Nuevo disponible:{" "}
                                <span className="font-semibold text-emerald-600 dark:text-emerald-405">
                                    ${(cupoNum - parseFloat(item.cupoUtilizado ?? 0)).toFixed(2)}
                                </span>
                            </p>
                        )}
                    </div>

                    {/* Estado */}
                    <div>
                        <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5 block">
                            Estado del Crédito
                        </Label>
                        <Select
                            value={idEstado}
                            onValueChange={(val) => { setIdEstado(val); setError(null); }}
                            disabled={loading || success}
                        >
                            <SelectTrigger className="h-11 border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:ring-[#10b981] rounded-xl">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white">
                                <SelectItem value="1">Activo</SelectItem>
                                <SelectItem value="2">Suspendido</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50/80 dark:bg-zinc-950/80 border-t border-slate-100 dark:border-zinc-850 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="px-5 h-10 rounded-xl font-semibold text-slate-500 dark:text-zinc-400 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!canSubmit || success}
                        className="flex items-center gap-2 px-6 h-10 rounded-xl font-semibold text-white bg-[#10b981] dark:bg-emerald-600 shadow-md hover:bg-emerald-600 dark:hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors animate-in"
                    >
                        {success ? (
                            <><CheckCircle2 size={16} /> Guardado</>
                        ) : loading ? (
                            <><Loader2 size={16} className="animate-spin" /> Guardando…</>
                        ) : (
                            <><Save size={16} /> Aplicar Cambios</>
                        )}
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
