import React, { useState, useEffect } from "react";
import { Trash2, ShieldAlert, AlertTriangle, Loader2, XCircle } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "../../../components/ui/dialog";
import { AuthorityAuthModal } from "../../../components/shared/AuthorityAuthModal";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:8080/api").replace(/\/$/, "");

const getToken = () => localStorage.getItem("token") || sessionStorage.getItem("token") || "";
const authHeaders = () => ({
    "Content-Type": "application/json",
    ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

/** Extrae el usuario guardado en localStorage / sessionStorage */
const getStoredUser = () => {
    try {
        const raw = localStorage.getItem("user") || sessionStorage.getItem("user") || "{}";
        return JSON.parse(raw);
    } catch {
        return {};
    }
};

export default function CreditDeleteModal({ isOpen, onClose, item, onSuccess }) {
    // ── Paso 1: confirmación visual ──────────────────────────────────────────
    const [showAuth, setShowAuth] = useState(false);

    // ── Paso 2: campos del AuthorityAuthModal ────────────────────────────────
    const [adminPassword, setAdminPassword] = useState("");
    const [adminError, setAdminError] = useState("");
    const [adminLoading, setAdminLoading] = useState(false);

    // ── Reset al abrir/cerrar ─────────────────────────────────────────────────
    useEffect(() => {
        if (!isOpen) {
            setShowAuth(false);
            setAdminPassword("");
            setAdminError("");
            setAdminLoading(false);
        }
    }, [isOpen]);

    if (!item) return null;

    const clientName = item.clienteNombre || `Cliente #${item.idCliente ?? item.id_cliente ?? "N/D"}`;
    const creditId = item.idCredito || item.id_credito || "N/D";

    // ── Verificar contraseña Master/Admin ──────────────────────────────────────
    const verifyAndDelete = async () => {
        if (!adminPassword.trim()) return;
        setAdminLoading(true);
        setAdminError("");

        try {
            // 1. Verificar contraseña del usuario autorizador
            const currentUser = getStoredUser();
            const email = currentUser.email || currentUser.correo || currentUser.usuario?.email;

            if (!email) throw new Error("No se encontró el correo del usuario actual.");

            const loginRes = await fetch(`${API_BASE_URL}/users/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password: adminPassword }),
            });
            const loginData = await loginRes.json().catch(() => ({}));

            if (!loginRes.ok) {
                throw new Error(loginData.message || loginData.error || "Contraseña incorrecta.");
            }

            // 2. Verificar que sea Master (idRol === 1)
            const user = loginData.user || loginData.data?.user || loginData.data || {};
            const roleId = Number(
                user.idRol ?? user.idrol ?? user.id_rol ??
                loginData.idRol ?? loginData.data?.idRol ??
                currentUser.idRol ?? currentUser.idrol ?? currentUser.id_rol
            );

            if (roleId !== 1) {
                throw new Error("Solo el usuario Master puede eliminar líneas de crédito.");
            }

            // Guardar el nuevo token si viene
            const newToken = loginData.token || loginData.data?.token;
            if (newToken) localStorage.setItem("token", newToken);

            // 3. Ejecutar la eliminación en el backend
            const deleteRes = await fetch(`${API_BASE_URL}/credits/${creditId}`, {
                method: "DELETE",
                headers: authHeaders(),
            });
            const deleteData = await deleteRes.json().catch(() => ({}));

            if (!deleteRes.ok) {
                throw new Error(deleteData.message || deleteData.error || `Error ${deleteRes.status}`);
            }

            // 4. Notificar al padre y cerrar
            if (onSuccess) onSuccess(creditId);
            onClose();
        } catch (err) {
            setAdminError(err.message);
        } finally {
            setAdminLoading(false);
        }
    };

    return (
        <>
            {/* ── Modal de confirmación inicial ── */}
            <Dialog open={isOpen && !showAuth} onOpenChange={onClose}>
                <DialogContent
                    className="sm:max-w-[460px] p-0 overflow-hidden bg-white dark:bg-zinc-900 border-0 dark:border dark:border-zinc-800 shadow-2xl rounded-2xl text-slate-900 dark:text-slate-100"
                >
                    {/* Cabecera */}
                    <div className="bg-gradient-to-r from-red-50 via-white to-red-50 dark:from-red-950/20 dark:via-zinc-900 dark:to-red-950/20 border-b border-red-100 dark:border-red-900/30 shrink-0">
                        <DialogHeader className="p-6 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl shadow-md">
                                    <Trash2 className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">
                                        Eliminar Línea de Crédito
                                    </DialogTitle>
                                    <DialogDescription className="text-slate-500 dark:text-zinc-400 text-sm mt-0.5">
                                        Esta operación requiere autorización de nivel Master
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>
                    </div>

                    {/* Cuerpo */}
                    <div className="p-6 space-y-4 bg-white dark:bg-zinc-900">
                        {/* Tarjeta del crédito a eliminar */}
                        <div className="rounded-xl border border-slate-200 dark:border-zinc-850 bg-slate-50 dark:bg-zinc-950/60 px-4 py-3">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/30">
                                    <ShieldAlert className="h-4 w-4 text-red-600 dark:text-red-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{clientName}</p>
                                    <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono">Crédito #C-{creditId}</p>
                                </div>
                            </div>
                        </div>

                        {/* Advertencia */}
                        <div className="flex items-start gap-3 rounded-xl border border-amber-200 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 text-amber-700 dark:text-amber-400">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-500" />
                            <div className="text-sm">
                                <p className="font-semibold text-amber-800 dark:text-amber-400 mb-0.5">Acción irreversible</p>
                                <p className="text-xs leading-relaxed text-amber-750 dark:text-amber-500">
                                    Eliminar esta línea de crédito borrará permanentemente el registro de la base de datos.
                                    Para continuar necesitarás la contraseña del usuario <span className="font-bold text-amber-900 dark:text-amber-300">Master</span>.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-slate-50 dark:bg-zinc-950/80 border-t border-slate-100 dark:border-zinc-850 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 h-10 rounded-xl font-semibold text-slate-600 dark:text-zinc-400 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowAuth(true)}
                            className="flex items-center gap-2 px-6 h-10 rounded-xl font-semibold text-white bg-red-600 dark:bg-red-700 shadow-md hover:bg-red-700 dark:hover:bg-red-800 transition-colors"
                        >
                            <Trash2 size={15} />
                            Continuar con eliminación
                        </button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ── Modal de autorización Master ── */}
            <AuthorityAuthModal
                isOpen={isOpen && showAuth}
                onClose={() => {
                    if (adminLoading) return;
                    setShowAuth(false);
                    setAdminPassword("");
                    setAdminError("");
                }}
                password={adminPassword}
                onPasswordChange={(val) => {
                    setAdminPassword(val);
                    setAdminError("");
                }}
                onConfirm={verifyAndDelete}
                loading={adminLoading}
                error={adminError}
                title="Autorización Master Requerida"
                description="Solo el usuario con rol Master puede eliminar líneas de crédito del sistema."
                actionDetail={`Eliminar crédito #C-${creditId} · ${clientName}`}
            />
        </>
    );
}
