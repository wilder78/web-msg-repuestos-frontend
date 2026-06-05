import React, { useEffect, useMemo, useState } from "react";
import {
    BadgeDollarSign,
    CheckCircle2,
    Search,
    ShieldAlert,
    UserCheck,
    Wallet,
    XCircle,
    X,
    Loader2,
} from "lucide-react";

import { BaseFormModal } from "../../../components/shared/BaseFormModal";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { toast } from "sonner";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:8080/api").replace(/\/$/, "");

const getToken = () =>
    localStorage.getItem("token") || sessionStorage.getItem("token") || "";

const authHeaders = () => ({
    "Content-Type": "application/json",
    ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

const normalizeCustomer = (c) => {
    const idCliente = c.idCliente ?? c.id_cliente ?? c.id;
    return {
        ...c,
        idCliente,
        displayName:
            c.razonSocial ?? c.razon_social ?? c.clienteNombre ?? c.nombre ?? `Cliente #${idCliente}`,
        documento: c.numeroDocumento ?? c.numero_documento ?? "",
        email: c.email ?? c.correo ?? "",
        activo: c.idEstado === 1 || c.id_estado === 1 || c.activo === true || c.activo === 1,
    };
};

const getListFrom = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.customers)) return payload.customers;
    if (Array.isArray(payload?.content)) return payload.content;
    return [];
};

// Iniciales del avatar
const getInitials = (name = "") =>
    name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "CL";

const AVATAR_COLORS = [
    "bg-emerald-500", "bg-blue-500", "bg-violet-500",
    "bg-amber-500", "bg-rose-500", "bg-sky-500",
];
const avatarColor = (id) => AVATAR_COLORS[(id ?? 0) % AVATAR_COLORS.length];

// ─── Componente principal ────────────────────────────────────────────────────
export default function CreditCreateModal({ isOpen, onClose, onSuccess }) {

    // Formulario
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [cupoAprobado, setCupoAprobado] = useState("");
    const [notas, setNotas] = useState("");
    const [customerOrderCount, setCustomerOrderCount] = useState(null);

    // Datos
    const [customers, setCustomers] = useState([]);
    const [loadingCustomers, setLoadingCustomers] = useState(false);
    const [customersError, setCustomersError] = useState(null);
    const [creditedIds, setCreditedIds] = useState(new Set());
    const [loadingCredits, setLoadingCredits] = useState(false);

    // Envío
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    // ── Reset + carga al abrir ──────────────────────────────────────────────
    useEffect(() => {
        if (!isOpen) return;
        setSelectedCustomer(null);
        setSearchTerm("");
        setCupoAprobado("");
        setNotas("");
        setCustomerOrderCount(null);
        setSubmitError(null);
        setSubmitSuccess(false);
        fetchCustomers();
        fetchExistingCredits();
    }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchCustomers = async () => {
        setLoadingCustomers(true);
        setCustomersError(null);
        try {
            const res = await fetch(`${API_BASE_URL}/customers`, { headers: authHeaders() });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.message ?? data.error ?? `Error ${res.status}`);
            setCustomers(getListFrom(data).map(normalizeCustomer).filter((c) => c.activo));
        } catch (err) {
            setCustomersError(err.message);
            setCustomers([]);
        } finally {
            setLoadingCustomers(false);
        }
    };

    const fetchExistingCredits = async () => {
        setLoadingCredits(true);
        try {
            const res = await fetch(`${API_BASE_URL}/credits`, { headers: authHeaders() });
            const data = await res.json().catch(() => []);
            const list = Array.isArray(data) ? data : (data.data ?? []);
            setCreditedIds(new Set(list.map((cr) => cr.idCliente ?? cr.id_cliente).filter(Boolean)));
        } catch {
            setCreditedIds(new Set());
        } finally {
            setLoadingCredits(false);
        }
    };

    // ── Filtrado inline (sin dropdown flotante) ────────────────────────────
    const filteredCustomers = useMemo(() => {
        if (selectedCustomer) return [];
        const q = searchTerm.trim().toLowerCase();
        if (!q) return customers.slice(0, 8); // Muestra los primeros 8 si no hay texto
        return customers
            .filter(
                (c) =>
                    c.displayName.toLowerCase().includes(q) ||
                    c.documento.toLowerCase().includes(q) ||
                    c.email.toLowerCase().includes(q)
            )
            .slice(0, 8);
    }, [customers, searchTerm, selectedCustomer]);

    const selectCustomer = async (c) => {
        setSelectedCustomer(c);
        setSearchTerm("");
        setSubmitError(null);
        setCustomerOrderCount(null);
        
        try {
            const res = await fetch(`${API_BASE_URL}/customers/${c.idCliente}/purchase-average`, { headers: authHeaders() });
            if (res.ok) {
                const data = await res.json();
                const count = data.orderCount || 0;
                setCustomerOrderCount(count);
                
                if (count >= 5) {
                    if (data.average > 0) {
                        const suggestedCupo = Math.min(data.average, 5000000);
                        setCupoAprobado(suggestedCupo.toString());
                    } else {
                        setCupoAprobado("");
                    }
                } else {
                    setCupoAprobado("");
                    toast.error(`El cliente debe contar con un historial mínimo de 5 compras pagadas (Actuales: ${count}/5)`, { id: "min-orders-toast" });
                }
            }
        } catch (err) {
            console.error("Error al obtener promedio de compras", err);
        }
    };

    const clearCustomer = () => {
        setSelectedCustomer(null);
        setSearchTerm("");
        setSubmitError(null);
        setCustomerOrderCount(null);
    };

    // ── Validación ─────────────────────────────────────────────────────────
    const cupoNum = Number(cupoAprobado);
    const isCupoValid = cupoNum > 0 && cupoNum <= 5000000;
    const meetsMinimumOrders = customerOrderCount !== null && customerOrderCount >= 5;
    const alreadyHasCredit = selectedCustomer ? creditedIds.has(selectedCustomer.idCliente) : false;
    const canSubmit = Boolean(selectedCustomer) && isCupoValid && !alreadyHasCredit && meetsMinimumOrders && !submitting;

    // ── Envío ──────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!canSubmit) return;
        setSubmitting(true);
        setSubmitError(null);
        try {
            const res = await fetch(`${API_BASE_URL}/credits`, {
                method: "POST",
                headers: authHeaders(),
                body: JSON.stringify({ idCliente: selectedCustomer.idCliente, cupoAprobado: cupoNum }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.message ?? data.error ?? `Error ${res.status}`);

            setSubmitSuccess(true);
            const creditCreated = data.credit ?? data.data ?? data;
            if (onSuccess)
                onSuccess({
                    ...creditCreated,
                    clienteNombre: selectedCustomer.displayName,
                    cliente: {
                        idCliente: selectedCustomer.idCliente,
                        numeroDocumento: selectedCustomer.documento,
                        razonSocial: selectedCustomer.displayName,
                    },
                });
            setTimeout(() => { onClose(); setSubmitSuccess(false); }, 1600);
        } catch (err) {
            setSubmitError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <BaseFormModal
            isOpen={isOpen}
            onClose={onClose}
            title="Asignar Nuevo Crédito"
            subtitle="Busca un cliente activo y define su cupo financiero autorizado"
            icon={BadgeDollarSign}
            loading={submitting}
            isSubmitDisabled={!canSubmit}
            onSubmit={handleSubmit}
        >
            <div className="space-y-5">

                {/* ── Alertas ── */}
                {submitError && (
                    <div className="flex items-start gap-3 rounded-xl border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-950/20 px-4 py-3 text-red-700 dark:text-red-400">
                        <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                        <div>
                            <p className="text-sm font-bold">No se pudo crear el crédito</p>
                            <p className="mt-0.5 text-xs">{submitError}</p>
                        </div>
                    </div>
                )}

                {customersError && (
                    <div className="flex items-start gap-3 rounded-xl border border-amber-200 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 text-amber-700 dark:text-amber-400">
                        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                        <p className="text-xs">{customersError}</p>
                    </div>
                )}

                {submitSuccess && (
                    <div className="flex items-center gap-3 rounded-xl border border-emerald-200 dark:border-emerald-900/30 bg-emerald-50 dark:bg-emerald-950/20 px-4 py-3 text-emerald-700 dark:text-emerald-450">
                        <CheckCircle2 className="h-5 w-5 shrink-0" />
                        <p className="text-sm font-semibold">
                            Crédito creado · Cupo: ${cupoNum.toFixed(2)}
                        </p>
                    </div>
                )}

                {/* ── Sección selección de cliente ── */}
                <div>
                    <Label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        Cliente <span className="text-[#10b981]">*</span>
                        {loadingCustomers && <Loader2 className="h-3 w-3 animate-spin text-slate-400 dark:text-zinc-550" />}
                        {!loadingCustomers && (
                            <span className="font-normal text-slate-400 dark:text-zinc-500">
                                {customers.length} activos
                                {!loadingCredits && ` · ${customers.length - creditedIds.size} sin crédito`}
                            </span>
                        )}
                    </Label>

                    <Select 
                      value={selectedCustomer?.idCliente?.toString() || ""} 
                      onValueChange={(val) => {
                          const customer = customers.find(c => c.idCliente.toString() === val);
                          if (customer) selectCustomer(customer);
                      }}
                      disabled={submitting}
                    >
                      <SelectTrigger className="h-[42px] border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm focus:ring-[#10b981]">
                        <SelectValue placeholder={loadingCustomers ? "Cargando clientes..." : "Selecciona un cliente de la lista"} />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white animate-in fade-in-50">
                        {!loadingCustomers && customers.length === 0 && (
                          <SelectItem value="__no_customers__" disabled>
                            No hay clientes disponibles
                          </SelectItem>
                        )}
                        {customers.map((c) => {
                            const hasCredit = creditedIds.has(c.idCliente);
                            return (
                              <SelectItem 
                                key={c.idCliente} 
                                value={c.idCliente.toString()}
                                disabled={hasCredit}
                              >
                                {c.displayName} {c.documento ? `- Doc: ${c.documento}` : ""} {hasCredit ? "(Ya tiene crédito)" : ""}
                              </SelectItem>
                            );
                        })}
                      </SelectContent>
                    </Select>

                    {selectedCustomer && (
                        <div className="flex items-center gap-3 mt-3 rounded-xl border border-emerald-200 dark:border-emerald-900/30 bg-emerald-50 dark:bg-emerald-950/20 px-4 py-3">
                            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white text-xs font-bold ring-1 ring-slate-100 dark:ring-zinc-800 ${avatarColor(selectedCustomer.idCliente)}`}>
                                {getInitials(selectedCustomer.displayName)}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-200">
                                    {selectedCustomer.displayName}
                                </p>
                                <div className="mt-0.5 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-zinc-400">
                                    {selectedCustomer.documento && <span>Doc: {selectedCustomer.documento}</span>}
                                    <span>ID: {selectedCustomer.idCliente}</span>
                                    {alreadyHasCredit ? (
                                        <span className="rounded-md bg-amber-100 dark:bg-amber-950/30 px-1.5 py-0.5 font-semibold text-amber-700 dark:text-amber-450">
                                            ⚠ Ya tiene crédito
                                        </span>
                                    ) : (
                                        <span className="rounded-md bg-emerald-100 dark:bg-emerald-950/30 px-1.5 py-0.5 font-semibold text-emerald-700 dark:text-emerald-450">
                                            ✓ Sin crédito asignado
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="border-t border-slate-100 dark:border-zinc-800" />

                {/* ── Cupo aprobado ── */}
                <div className={!selectedCustomer || alreadyHasCredit ? "pointer-events-none opacity-45" : ""}>
                    <Label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        Cupo Aprobado <span className="text-[#10b981]">*</span>
                    </Label>
                    <div className="relative">
                        <span className="absolute left-4 top-2.5 font-bold text-slate-500 dark:text-zinc-500">$</span>
                        <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Ej: 5000.00"
                            value={cupoAprobado}
                            onChange={(e) => {
                                const val = e.target.value;
                                setCupoAprobado(val);
                                if (Number(val) > 5000000) {
                                    toast.error("El monto ingresado supera el cupo máximo de crédito permitido por la empresa ($5,000,000)", { id: "cupo-max-toast" });
                                }
                            }}
                            disabled={submitting || !selectedCustomer || alreadyHasCredit || (customerOrderCount !== null && customerOrderCount < 5)}
                            className={`h-11 rounded-xl border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-8 text-lg font-bold focus-visible:ring-[#10b981]
                                ${(cupoAprobado && !isCupoValid) || (selectedCustomer && customerOrderCount !== null && customerOrderCount < 5)
                                    ? "border-red-300 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-450 focus-visible:ring-red-400"
                                    : "text-slate-800 dark:text-slate-100"
                                }`}
                        />
                    </div>
                    {selectedCustomer && !alreadyHasCredit && customerOrderCount !== null && customerOrderCount < 5 && (
                        <p className="mt-1.5 text-xs font-bold text-red-600 dark:text-red-450">
                            No se puede asignar crédito: El cliente debe contar con un historial mínimo de 5 compras realizadas y pagadas (Actuales: {customerOrderCount}/5).
                        </p>
                    )}
                    {cupoAprobado && !isCupoValid && meetsMinimumOrders && (
                        <p className="mt-1.5 text-xs font-medium text-red-500 dark:text-red-400">
                            {cupoNum > 5000000 
                                ? "El cupo excede el límite de $5,000,000."
                                : "El cupo debe ser mayor a $0."}
                        </p>
                    )}
                    {isCupoValid && meetsMinimumOrders && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400">
                            <Wallet className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-450" />
                            <span>
                                El cliente podrá comprar a crédito hasta{" "}
                                <strong className="text-emerald-600 dark:text-emerald-450">${cupoNum.toFixed(2)}</strong>
                            </span>
                        </div>
                    )}
                </div>

                {/* ── Notas opcionales ── */}
                <div className={!selectedCustomer || alreadyHasCredit ? "pointer-events-none opacity-45" : ""}>
                    <Label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        Notas internas{" "}
                        <span className="font-normal text-slate-400 dark:text-zinc-500">(opcional)</span>
                    </Label>
                    <textarea
                        rows={2}
                        placeholder="Motivo de la asignación, condiciones especiales…"
                        value={notas}
                        onChange={(e) => setNotas(e.target.value)}
                        disabled={submitting || !selectedCustomer || alreadyHasCredit}
                        className="w-full resize-none rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/40 px-4 py-3 text-sm text-slate-700 dark:text-zinc-350 placeholder:text-slate-400 dark:placeholder:text-zinc-550 focus:border-[#10b981] focus:outline-none focus:ring-1 focus:ring-[#10b981] disabled:opacity-50"
                    />
                </div>

            </div>
        </BaseFormModal>
    );
}
