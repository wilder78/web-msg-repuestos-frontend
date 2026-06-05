import React, { useState, useEffect, useRef } from "react";
import { Label } from "../../../components/ui/label";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { HandCoins, Loader2, CreditCard, ShoppingCart, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const API = (import.meta.env.VITE_API_URL || "http://localhost:8080/api").replace(/\/$/, "");
const hdrs = () => { const t = localStorage.getItem("token") || sessionStorage.getItem("token") || ""; return { "Content-Type": "application/json", ...(t ? { Authorization: `Bearer ${t}` } : {}) }; };

const normalizeText = (value = "") =>
    value
        .toString()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();

const getOrderStatusId = (order) =>
    Number(
        order?.id_estado_pedido ??
        order?.idEstado ??
        order?.id_estado ??
        order?.estado?.idEstado ??
        order?.estado?.idestado ??
        order?.estado?.id_estado ??
        1
    );

const getOrderStatusName = (order) =>
    order?.estado_despacho ||
    order?.estadoDespacho ||
    order?.estado?.nombreEstado ||
    order?.estado?.nombre_estado ||
    order?.estado?.nombre ||
    order?.nombreEstado ||
    "";

const getOrderTotal = (order) => {
    if (!order) return 0;
    return parseFloat(order.total_neto ?? order.totalNeto ?? order.total ?? order.valor_total ?? 0) || 0;
};

const getOrderPaid = (order) =>
    parseFloat(
        order?.total_abonado ??
        order?.totalAbonado ??
        order?.abonado ??
        order?.valor_abonado ??
        0
    ) || 0;

const getOrderPendingBalance = (order) => {
    const explicitBalance =
        order?.saldo_pendiente ??
        order?.saldoPendiente ??
        order?.saldo ??
        order?.valor_pendiente;

    if (explicitBalance !== undefined && explicitBalance !== null) {
        return Math.max(parseFloat(explicitBalance) || 0, 0);
    }

    return Math.max(getOrderTotal(order) - getOrderPaid(order), 0);
};

const isOrderAnulled = (order) => {
    const statusId = getOrderStatusId(order);
    const statusName = normalizeText(getOrderStatusName(order));
    return statusId === 3 || statusName.includes("anulad") || statusName.includes("cancelad");
};

const isOrderPaidByStatus = (order) => getOrderStatusId(order) === 5;

const isOrderPaid = (order) => {
    return isOrderPaidByStatus(order) || getOrderPendingBalance(order) <= 0;
};

const canReceiveAbono = (order) => order && !isOrderAnulled(order) && !isOrderPaid(order);

const STATUS_LABELS = {
    1: "En Proceso",
    2: "Despachado",
    3: "Anulado",
    4: "Entregado",
    5: "Pagado",
};

const getDisplayStatus = (order) =>
    getOrderStatusName(order) || STATUS_LABELS[getOrderStatusId(order)] || "En Proceso";

const getOrderIdentifier = (order) => order?.idPedido ?? order?.id_pedido ?? order?.id ?? null;

export function AbonoForm({
    formData,
    onChange,
    onValidityChange
}) {
    const [tipoAbono, setTipoAbono] = useState(formData.tipoAbono || "credito"); // "credito" | "contado"

    useEffect(() => {
        if (formData.tipoAbono && formData.tipoAbono !== tipoAbono) {
            setTipoAbono(formData.tipoAbono);
        }
    }, [formData.tipoAbono]);

    // Créditos
    const [creditClients, setCreditClients] = useState([]);
    const [loadingCredits, setLoadingCredits] = useState(false);
    const [selectedCredit, setSelectedCredit] = useState(null);

    // Clientes contado
    const [allClients, setAllClients] = useState([]);
    const [loadingClients, setLoadingClients] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null);

    // Pedidos
    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    useEffect(() => {
        fetchCreditClients();
        fetchAllClients();
    }, []);

    // Carga de pedidos cuando cambia idCliente o tipoAbono
    useEffect(() => {
        if (formData.idCliente) {
            fetchOrders(formData.idCliente);
        } else {
            setOrders([]);
            setSelectedOrder(null);
        }
    }, [formData.idCliente, tipoAbono]);

    // Actualiza el selectedCredit / selectedClient correspondientes si ya vienen en formData
    useEffect(() => {
        if (creditClients.length > 0 && formData.idCliente && tipoAbono === "credito") {
            const found = creditClients.find(c => String(c.idCliente) === String(formData.idCliente));
            if (found) setSelectedCredit(found);
        }
    }, [creditClients, formData.idCliente, tipoAbono]);

    useEffect(() => {
        if (allClients.length > 0 && formData.idCliente && tipoAbono === "contado") {
            const found = allClients.find(c => String(c.idCliente) === String(formData.idCliente));
            if (found) setSelectedClient(found);
        }
    }, [allClients, formData.idCliente, tipoAbono]);

    // Actualiza selectedOrder si cambia el idPedido
    useEffect(() => {
        if (orders.length > 0 && formData.idPedido) {
            const found = orders.find(o => String(getOrderIdentifier(o)) === String(formData.idPedido));
            if (found) setSelectedOrder(found);
        } else if (!formData.idPedido) {
            setSelectedOrder(null);
        }
    }, [orders, formData.idPedido]);

    const fetchCreditClients = async () => {
        setLoadingCredits(true);
        try {
            const res = await fetch(`${API}/credits`, { headers: hdrs() });
            const data = await res.json().catch(() => []);
            const list = Array.isArray(data) ? data : (data.data ?? []);
            setCreditClients(list.map(c => ({
                idCliente: c.idCliente ?? c.id_cliente,
                idCredito: c.idCredito,
                displayName: c.razonSocial || c.clienteNombre || c.nombre || c.nombreCliente || (c.cliente?.razonSocial) || (c.cliente?.nombre) || `Cliente #${c.idCliente}`,
                documento: c.numeroDocumento ?? "",
                cupoAprobado: parseFloat(c.cupoAprobado ?? 0),
                cupoUtilizado: parseFloat(c.cupoUtilizado ?? 0),
                cupoDisponible: parseFloat(c.cupoAprobado ?? 0) - parseFloat(c.cupoUtilizado ?? 0),
                extra: `Disp: $${(parseFloat(c.cupoAprobado ?? 0) - parseFloat(c.cupoUtilizado ?? 0)).toFixed(2)}`,
            })));
        } catch { setCreditClients([]); }
        finally { setLoadingCredits(false); }
    };

    const fetchAllClients = async () => {
        setLoadingClients(true);
        try {
            const res = await fetch(`${API}/customers`, { headers: hdrs() });
            const data = await res.json().catch(() => []);
            const list = Array.isArray(data) ? data : (data.data ?? []);
            setAllClients(list
                .filter(c => c.idEstado === 1 || c.activo === true || c.activo === 1)
                .map(c => ({
                    idCliente: c.idCliente ?? c.id_cliente,
                    displayName: c.razonSocial || c.nombre || c.nombreCliente || c.clienteNombre || `Cliente #${c.idCliente}`,
                    documento: c.numeroDocumento ?? "",
                    email: c.email || "",
                    telefono: c.telefono || c.celular || "",
                    ciudad: c.municipio?.nombre || c.ciudad || "",
                    direccion: c.direccion || "",
                    extra: c.numeroDocumento ? `Doc: ${c.numeroDocumento}` : `ID: ${c.idCliente}`,
                })));
        } catch { setAllClients([]); }
        finally { setLoadingClients(false); }
    };

    const fetchOrders = async (idCliente) => {
        setLoadingOrders(true);
        setOrders([]);
        try {
            const res = await fetch(`${API}/orders`, { headers: hdrs() });
            const data = await res.json().catch(() => []);
            const list = Array.isArray(data) ? data : (data.data ?? data.orders ?? []);
            
            const clientOrders = list.filter(o => {
                const cid = o.id_cliente ?? o.idCliente ?? o.cliente?.idCliente;
                return String(cid) === String(idCliente) && canReceiveAbono(o);
            });
            setOrders(clientOrders);
        } catch { setOrders([]); }
        finally { setLoadingOrders(false); }
    };

    const handleSelectCreditClient = (c) => {
        setSelectedCredit(c);
        setSelectedOrder(null);
        onChange({
            ...formData,
            idCliente: String(c.idCliente),
            clienteNombre: c.displayName,
            idCredito: String(c.idCredito),
            idPedido: ""
        });
    };

    const handleSelectContadoClient = (c) => {
        setSelectedClient(c);
        setSelectedOrder(null);
        onChange({
            ...formData,
            idCliente: String(c.idCliente),
            clienteNombre: c.displayName,
            idCredito: "",
            idPedido: ""
        });
    };

    const handleSelectOrder = (o) => {
        const pedidoId = getOrderIdentifier(o);
        if (!pedidoId) {
            toast.warning("Por favor, seleccione un pedido válido antes de continuar");
            return;
        }

        if (isOrderPaidByStatus(o)) {
            toast.error("Operación inválida: El pedido ya se encuentra pagado y no admite nuevos abonos.", {
                duration: 5000,
            });
            return;
        }

        setSelectedOrder(o);
        onChange({
            ...formData,
            idPedido: String(pedidoId)
        });
    };

    const rawMonto = String(formData.montoAbono || "").replace(",", ".");
    const montoNum  = parseFloat(rawMonto);
    const montoPositivo = !isNaN(montoNum) && montoNum > 0;
    
    const selectedOrderId = getOrderIdentifier(selectedOrder);
    const resolvedOrderId = selectedOrderId ?? formData.idPedido ?? null;

    const hasSelectedOrder =
        resolvedOrderId !== null &&
        resolvedOrderId !== undefined &&
        resolvedOrderId !== "";

    const maxAbono = hasSelectedOrder
        ? getOrderPendingBalance(selectedOrder)
        : null;

    const montoOk   = montoPositivo && (maxAbono === null || montoNum <= (maxAbono + 0.5));
    const clientOk  = tipoAbono === "credito" ? !!selectedCredit : !!selectedClient;
    const selectedOrderIsPaid = selectedOrder ? isOrderPaidByStatus(selectedOrder) : false;

    // Validación de formulario
    useEffect(() => {
        if (onValidityChange) {
            const isValid = !!clientOk && !!formData.metodoPago && !!montoOk && !selectedOrderIsPaid && !!resolvedOrderId;
            onValidityChange(isValid);
        }
    }, [clientOk, formData.metodoPago, montoOk, selectedOrderIsPaid, resolvedOrderId, onValidityChange]);

    const handleTipo = (v) => {
        setTipoAbono(v);
        setSelectedCredit(null);
        setSelectedClient(null);
        setSelectedOrder(null);
        setOrders([]);
        onChange({
            ...formData,
            tipoAbono: v,
            idCliente: "",
            idCredito: "",
            idPedido: ""
        });
    };

    const renderOrderList = () => {
        if (!loadingOrders && orders.length === 0) {
            return (
                <div className="flex items-center gap-3 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 px-4 py-3">
                    <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <p className="text-sm text-amber-800 dark:text-amber-300">Este cliente no tiene pedidos con saldo pendiente disponibles para abonar.</p>
                </div>
            );
        }

        return (
            <div className="rounded-xl border border-slate-200 dark:border-zinc-850 overflow-hidden bg-white dark:bg-zinc-900">
                <div className="sticky top-0 bg-slate-100 dark:bg-zinc-800 border-b border-slate-200 dark:border-zinc-800 px-3 py-1.5">
                    <p className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500">
                        {loadingOrders ? "Cargando pedidos…" : `${orders.length} pedido${orders.length !== 1 ? "s" : ""}`}
                    </p>
                </div>
                <div className="max-h-44 overflow-y-auto">
                    {orders.map(o => {
                        const pid = getOrderIdentifier(o);
                        const sel = selectedOrderId !== null && selectedOrderId === pid;
                        const stat = getOrderStatusId(o);
                        const totalAbonado = parseFloat(o.total_abonado || 0);
                        const saldoPendiente = getOrderPendingBalance(o);
                        return (
                            <button key={pid} type="button" onClick={() => handleSelectOrder(o)}
                                className={`flex w-full items-center gap-3 border-b border-slate-100 dark:border-zinc-800/80 px-3 py-2.5 last:border-0 text-left transition-colors
                                    ${sel ? "bg-emerald-50 dark:bg-emerald-950/20 border-l-2 border-l-emerald-500" : "hover:bg-slate-50 dark:hover:bg-zinc-800/30"}`}>
                                <ShoppingCart className={`h-4 w-4 shrink-0 ${sel ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-zinc-550"}`} />
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-bold text-slate-800 dark:text-zinc-200">
                                        PED-{String(pid).padStart(3, "0")}
                                        <span className="ml-2 text-xs font-normal text-slate-500 dark:text-zinc-455">· {STATUS_LABELS[stat] ?? "En Proceso"}</span>
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                                        Total: <span className="font-semibold text-slate-700 dark:text-zinc-300">${parseFloat(o.total_neto ?? 0).toFixed(2)}</span>
                                        {totalAbonado > 0 && (
                                            <span className="ml-2 text-emerald-600 dark:text-emerald-450 font-medium">
                                                (Abonado: ${totalAbonado.toFixed(2)})
                                            </span>
                                        )}
                                    </p>
                                    {saldoPendiente > 0.009 && (
                                        <p className="text-[10px] font-bold text-amber-600 dark:text-amber-450 mt-0.5">
                                            SALDO PENDIENTE: ${saldoPendiente.toFixed(2)}
                                        </p>
                                    )}
                                </div>
                                {sel && <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-5">
            {/* ── Alerta: Pedido ya Pagado ── */}
            {selectedOrderIsPaid && (
                <div className="flex items-start gap-3 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 px-4 py-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-bold text-red-700 dark:text-red-400">Operación inválida</p>
                        <p className="text-xs text-red-600 dark:text-red-300 mt-0.5">El pedido seleccionado ya se encuentra <span className="font-bold">Pagado</span> y no admite nuevos abonos. Selecciona un pedido con saldo pendiente.</p>
                    </div>
                </div>
            )}

            {/* ── Tipo de abono ── */}
            <div>
                <Label className="mb-2 block text-xs font-semibold text-slate-700 dark:text-zinc-300">1. Tipo de Abono</Label>
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { v: "credito", Icon: CreditCard, label: "Abono a Crédito", sub: "Cliente con línea de crédito activa" },
                        { v: "contado", Icon: ShoppingCart, label: "Abono a Pedido", sub: "Cliente de contado, pago por pedido" },
                    ].map(({ v, Icon, label, sub }) => (
                        <button key={v} type="button" onClick={() => handleTipo(v)}
                            className={`flex items-start gap-3 rounded-xl border-2 p-3 text-left transition-all
                                ${tipoAbono === v ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/15" : "border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-slate-300 dark:hover:border-zinc-700"}`}>
                            <div className={`mt-0.5 rounded-lg p-1.5 ${tipoAbono === v ? "bg-emerald-500 text-white" : "bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400"}`}>
                                <Icon className="h-4 w-4" />
                            </div>
                            <div>
                                <p className={`text-sm font-bold ${tipoAbono === v ? "text-emerald-800 dark:text-emerald-400" : "text-slate-700 dark:text-zinc-300"}`}>{label}</p>
                                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">{sub}</p>
                            </div>
                            {tipoAbono === v && <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-500 shrink-0" />}
                        </button>
                    ))}
                </div>
            </div>

            <div className="border-t border-slate-100 dark:border-zinc-800" />

            {/* ── Selección según tipo ── */}
            {tipoAbono === "credito" ? (
                <div>
                    <Label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        2. Cliente con Crédito <span className="text-emerald-500">*</span>
                        {loadingCredits && <Loader2 className="h-3 w-3 animate-spin text-slate-400 dark:text-zinc-500" />}
                        {!loadingCredits && <span className="font-normal text-slate-400 dark:text-zinc-550">{creditClients.length} con crédito activo</span>}
                    </Label>
                    <Select
                        value={formData.idCliente ? String(formData.idCliente) : ""}
                        onValueChange={(val) => {
                            const c = creditClients.find(item => String(item.idCliente) === String(val));
                            if (c) handleSelectCreditClient(c);
                        }}
                        disabled={loadingCredits}
                    >
                        <SelectTrigger className="h-[42px] border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white">
                            <SelectValue placeholder={loadingCredits ? "Cargando clientes..." : "Selecciona un cliente de la lista"} />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-200 dark:border-zinc-800 max-h-60 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">
                            {creditClients.length === 0 && !loadingCredits && (
                                <SelectItem value="none" disabled>No hay clientes con crédito activo</SelectItem>
                            )}
                            {creditClients.map(c => (
                                <SelectItem key={String(c.idCliente)} value={String(c.idCliente)}>
                                    {c.displayName}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {selectedCredit && (
                        <div className="mt-2 grid grid-cols-3 gap-2">
                            {[
                                { label: "Cupo Aprobado", val: `$${selectedCredit.cupoAprobado.toFixed(2)}`, color: "text-slate-700 dark:text-zinc-300" },
                                { label: "Utilizado",     val: `$${selectedCredit.cupoUtilizado.toFixed(2)}`, color: "text-amber-600 dark:text-amber-400" },
                                { label: "Disponible",    val: `$${selectedCredit.cupoDisponible.toFixed(2)}`, color: "text-emerald-600 dark:text-emerald-400" },
                            ].map(({ label, val, color }) => (
                                <div key={label} className="rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 px-3 py-2 text-center">
                                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold">{label}</p>
                                    <p className={`text-sm font-black mt-0.5 ${color}`}>{val}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pedidos del cliente */}
                    {selectedCredit && (
                        <div className="mt-4">
                            <Label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-300">
                                3. Seleccionar Pedido a Abonar <span className="text-emerald-500">*</span>
                                {loadingOrders && <Loader2 className="h-3 w-3 animate-spin text-slate-400 dark:text-zinc-500" />}
                            </Label>
                            {renderOrderList()}
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Cliente contado */}
                    <div>
                        <Label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-300">
                            2. Seleccionar Cliente <span className="text-emerald-500">*</span>
                            {loadingClients && <Loader2 className="h-3 w-3 animate-spin text-slate-400 dark:text-zinc-500" />}
                        </Label>
                        <Select
                            value={formData.idCliente ? String(formData.idCliente) : ""}
                            onValueChange={(val) => {
                                const c = allClients.find(item => String(item.idCliente) === String(val));
                                if (c) handleSelectContadoClient(c);
                            }}
                            disabled={loadingClients}
                        >
                            <SelectTrigger className="h-[42px] border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white">
                                <SelectValue placeholder={loadingClients ? "Cargando clientes..." : "Selecciona un cliente de la lista"} />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-slate-200 dark:border-zinc-800 max-h-60 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">
                                {allClients.length === 0 && !loadingClients && (
                                    <SelectItem value="none" disabled>No hay clientes disponibles</SelectItem>
                                )}
                                {allClients.map(c => (
                                    <SelectItem key={String(c.idCliente)} value={String(c.idCliente)}>
                                        {c.displayName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {selectedClient && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-[11px]">
                                <div className="rounded-lg border border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 px-3 py-1.5">
                                    <span className="block text-slate-400 dark:text-zinc-500 font-semibold">Documento</span>
                                    <span className="text-slate-700 dark:text-zinc-300 font-medium">{selectedClient.documento || "Sin dato"}</span>
                                </div>
                                <div className="rounded-lg border border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 px-3 py-1.5">
                                    <span className="block text-slate-400 dark:text-zinc-500 font-semibold">Ciudad</span>
                                    <span className="text-slate-700 dark:text-zinc-300 font-medium">{selectedClient.ciudad || "Sin dato"}</span>
                                </div>
                                <div className="rounded-lg border border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 px-3 py-1.5 col-span-2">
                                    <span className="block text-slate-400 dark:text-zinc-500 font-semibold">Dirección</span>
                                    <span className="text-slate-700 dark:text-zinc-300 font-medium truncate">{selectedClient.direccion || "Sin dato"}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Pedidos del cliente */}
                    {selectedClient && (
                        <div>
                            <Label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-300">
                                3. Seleccionar Pedido <span className="text-emerald-500">*</span>
                                {loadingOrders && <Loader2 className="h-3 w-3 animate-spin text-slate-400" />}
                            </Label>
                            {renderOrderList()}
                        </div>
                    )}
                </div>
            )}

            <div className="border-t border-slate-100 dark:border-zinc-800" />

            {/* ── Datos del pago ── */}
            <div className={`grid grid-cols-2 gap-x-5 gap-y-4 transition-opacity ${!clientOk ? "pointer-events-none opacity-40" : ""}`}>
                <div className="col-span-2 md:col-span-1">
                    <Label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        {tipoAbono === "credito" ? "4" : selectedClient ? "4" : "4"}. Monto del Abono <span className="text-emerald-500">*</span>
                    </Label>
                    <div className="relative">
                        <span className="absolute left-4 top-2.5 font-bold text-slate-500 dark:text-zinc-400">$</span>
                        <Input type="number" min="0" step="0.01" placeholder="Ej: 1500.00"
                            value={formData.montoAbono} onChange={e => onChange({ ...formData, montoAbono: e.target.value })}
                            disabled={!clientOk}
                            className={`h-11 rounded-xl border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white pl-8 text-[15px] font-bold focus-visible:ring-[#10b981] ${formData.montoAbono && hasSelectedOrder && !montoOk ? "border-red-300 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400" : ""}`} />
                    </div>
                    {formData.montoAbono && hasSelectedOrder && montoNum > maxAbono && (
                        <p className="mt-1 text-[11px] text-red-650 dark:text-red-400 font-medium">⚠ El monto supera la deuda disponible (${maxAbono.toFixed(2)})</p>
                    )}
                    {formData.montoAbono && !montoPositivo && <p className="mt-1 text-[10px] text-red-500 dark:text-red-400 font-medium">Debe ser un monto válido mayor a $0.</p>}
                </div>

                <div className="col-span-2 md:col-span-1">
                    <Label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-zinc-300">Método de Pago <span className="text-emerald-500">*</span></Label>
                    <Select value={formData.metodoPago} onValueChange={v => onChange({ ...formData, metodoPago: v })} disabled={!clientOk}>
                        <SelectTrigger className="h-11 rounded-xl border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white"><SelectValue placeholder="Seleccione medio" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Efectivo">Efectivo (Caja)</SelectItem>
                            <SelectItem value="Transferencia Bancaria">Transferencia Bancaria</SelectItem>
                            <SelectItem value="Cheque">Cheque Físico</SelectItem>
                            <SelectItem value="Pasarela en Línea">Pasarela en Línea</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="col-span-2">
                    <Label className="mb-1.5 flex justify-between text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        <span>Referencia / N° Transacción</span><span className="font-normal text-slate-400 dark:text-zinc-500">Opcional</span>
                    </Label>
                    <Input type="text" placeholder="Ej: REC-123456" value={formData.referencia}
                        onChange={e => onChange({ ...formData, referencia: e.target.value })}
                        disabled={!clientOk} className="h-11 rounded-xl border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus-visible:ring-[#10b981]" />
                </div>

                <div className="col-span-2">
                    <Label className="mb-1.5 flex justify-between text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        <span>Descripción Interna</span><span className="font-normal text-slate-400 dark:text-zinc-500">Opcional</span>
                    </Label>
                    <Textarea value={formData.descripcion} onChange={e => onChange({ ...formData, descripcion: e.target.value })}
                        placeholder="Ej: 'pago parcial factura #33'…" disabled={!clientOk}
                        className="h-[60px] resize-none rounded-xl border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus-visible:ring-[#10b981]" />
                </div>
            </div>
        </div>
    );
}
