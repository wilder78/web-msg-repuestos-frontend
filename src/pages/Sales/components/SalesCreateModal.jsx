import React, { useState, useEffect } from "react";
import { BaseFormModal } from "../../../components/shared/BaseFormModal";
import { Label } from "../../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { 
    BadgeDollarSign, ShoppingCart, UserCheck, 
    CreditCard, Wallet, Landmark, Receipt,
    AlertCircle, Loader2, CheckCircle2
} from "lucide-react";

const API = (import.meta.env.VITE_API_URL || "http://localhost:8080/api").replace(/\/$/, "");
const hdrs = () => { 
    const t = localStorage.getItem("token") || sessionStorage.getItem("token") || ""; 
    return { "Content-Type": "application/json", ...(t ? { Authorization: `Bearer ${t}` } : {}) }; 
};

const PAYMENT_METHODS = [
    { id: 1, label: "Efectivo", icon: Wallet },
    { id: 2, label: "Transferencia Bancaria", icon: Landmark },
    { id: 3, label: "Tarjeta Débito/Crédito", icon: CreditCard },
    { id: 4, label: "Crédito Interno", icon: Receipt },
];

export default function SalesCreateModal({ isOpen, onClose, onSubmit, loading: externalLoading }) {
    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [idFormaPago, setIdFormaPago] = useState("");

    useEffect(() => {
        if (isOpen) {
            setSelectedOrder(null);
            setIdFormaPago("");
            fetchEligibleOrders();
        }
    }, [isOpen]);

    const fetchEligibleOrders = async () => {
        setLoadingOrders(true);
        try {
            const [resOrders, resSales] = await Promise.all([
                fetch(`${API}/orders`, { headers: hdrs() }),
                fetch(`${API}/sales`, { headers: hdrs() }),
            ]);

            const orderData = await resOrders.json().catch(() => []);
            const saleData  = await resSales.json().catch(() => []);

            const orderList = Array.isArray(orderData) ? orderData : (orderData.data ?? orderData.orders ?? []);
            const saleList  = Array.isArray(saleData)  ? saleData  : (saleData.data  ?? saleData.sales  ?? []);

            // IDs de pedidos que ya tienen una venta consolidada
            const consolidatedIds = new Set(
                saleList
                    .map(s => s.idPedido ?? s.pedido?.idPedido)
                    .filter(Boolean),
            );

            // Status: 2 (Separación), 4 (Entregado), 5 (Pagado) y NO consolidados
            const eligible = orderList.filter(o => {
                const stat = Number(o.id_estado_pedido ?? o.idEstado ?? 0);
                const oid  = o.idPedido ?? o.id_pedido;
                return (stat === 2 || stat === 4 || stat === 5) && !consolidatedIds.has(oid);
            });

            setOrders(eligible);
        } catch (error) {
            console.error("Error fetching eligible orders:", error);
            setOrders([]);
        } finally {
            setLoadingOrders(false);
        }
    };

    const handleSelectOrder = (oid) => {
        const order = orders.find(o => String(o.idPedido ?? o.id_pedido) === String(oid));
        setSelectedOrder(order);
    };

    const canSubmit = selectedOrder && idFormaPago;

    const handleFormSubmit = () => {
        if (!canSubmit) return;
        
        const payload = {
            idPedido: selectedOrder.idPedido ?? selectedOrder.id_pedido,
            idFormaPago: Number(idFormaPago),
            totalVenta: parseFloat(selectedOrder.total_neto || selectedOrder.total || 0),
        };
        
        onSubmit(payload);
    };

    return (
        <BaseFormModal
            isOpen={isOpen}
            onClose={onClose}
            title="Consolidar Venta (Generar Factura)"
            subtitle="Finaliza el proceso comercial convirtiendo un pedido entregado en una venta registrada."
            icon={BadgeDollarSign}
            loading={externalLoading}
            isSubmitDisabled={!canSubmit || externalLoading}
            onSubmit={handleFormSubmit}
            submitText="Generar Reporte de Venta"
            maxWidthClass="sm:max-w-[600px]"
        >
            <div className="space-y-6">
                
                {/* 1. Selección de Pedido */}
                <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                        <ShoppingCart className="h-4 w-4 text-blue-500" />
                        1. Seleccionar Pedido de Referencia
                    </Label>
                    <Select onValueChange={handleSelectOrder} value={selectedOrder ? String(selectedOrder.idPedido ?? selectedOrder.id_pedido) : ""}>
                        <SelectTrigger className="h-12 rounded-xl border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm focus:ring-blue-500">
                            <SelectValue placeholder={loadingOrders ? "Cargando pedidos..." : "Busca un pedido entregado o pagado"} />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white animate-in fade-in-50">
                            {orders.length === 0 && !loadingOrders ? (
                                <div className="p-4 text-center text-sm text-slate-500 dark:text-zinc-400 italic">
                                    No hay pedidos disponibles para facturar.
                                </div>
                            ) : (
                                orders.map(o => (
                                    <SelectItem key={o.idPedido ?? o.id_pedido} value={String(o.idPedido ?? o.id_pedido)}>
                                        <div className="flex flex-col items-start py-0.5">
                                            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                                                PED-{String(o.idPedido ?? o.id_pedido).padStart(3, '0')} — <span>{
                                                    o.nombreCliente ||
                                                    o.clienteNombre ||
                                                    o.cliente?.razonSocial ||
                                                    o.cliente?.razonsocial ||
                                                    o.cliente?.nombre ||
                                                    o.cliente?.nombreCliente ||
                                                    (o.idCliente ? `Cliente #${o.idCliente}` : "Cliente General")
                                                }</span>
                                            </span>
                                            <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">
                                                Total: ${parseFloat(o.total_neto || 0).toLocaleString()} · {Number(o.id_estado_pedido || o.idEstado) === 5 ? "Ya Pagado" : "Pendiente Pago"}
                                            </span>
                                        </div>
                                    </SelectItem>
                                ))
                            )}
                        </SelectContent>
                    </Select>
                </div>

                {/* Info del Pedido Seleccionado */}
                {selectedOrder && (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-100 dark:border-zinc-850 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <UserCheck className="h-4 w-4 text-emerald-500" />
                                <span className="text-xs font-bold text-slate-600 dark:text-zinc-300 uppercase tracking-tighter">Cliente</span>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/30 text-[10px] font-black text-blue-700 dark:text-blue-400 uppercase">
                                {selectedOrder.numeroFactura || `PED-${selectedOrder.idPedido}`}
                            </span>
                        </div>
                        <p className="font-bold text-slate-800 dark:text-slate-200 text-lg">
                            <span>{selectedOrder.clienteNombre || selectedOrder.nombreCliente || selectedOrder.cliente?.razonSocial || selectedOrder.cliente?.nombre || "Consumidor Final"}</span>
                        </p>
                        
                        <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 flex justify-between items-baseline">
                            <span className="text-sm font-medium text-slate-500 dark:text-zinc-400">Monto a Consolidar:</span>
                            <span className="text-2xl font-black text-slate-900 dark:text-white">
                                ${parseFloat(selectedOrder.total_neto || 0).toLocaleString()}
                            </span>
                        </div>
                    </div>
                )}

                {/* 2. Método de Pago */}
                <div className="space-y-3">
                    <Label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                        <Wallet className="h-4 w-4 text-amber-500" />
                        2. Definir Método de Pago
                    </Label>
                    
                    <div className="grid grid-cols-2 gap-3">
                        {PAYMENT_METHODS.map((method) => {
                            const Icon = method.icon;
                            const isSelected = String(idFormaPago) === String(method.id);
                            
                            return (
                                <button
                                    key={method.id}
                                    type="button"
                                    onClick={() => setIdFormaPago(String(method.id))}
                                    className={`
                                        flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-200
                                        ${isSelected 
                                            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 shadow-sm shadow-blue-100/10" 
                                            : "border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 text-slate-500 dark:text-zinc-400 hover:border-slate-200 dark:hover:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-850"}
                                    `}
                                >
                                    <Icon className={`h-6 w-6 mb-2 ${isSelected ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-zinc-550"}`} />
                                    <span className={`text-[11px] font-bold text-center leading-tight`}>
                                        {method.label}
                                    </span>
                                    {isSelected && (
                                        <div className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Mensaje de Confirmación Final */}
                {canSubmit && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400 animate-in zoom-in duration-300">
                        <CheckCircle2 className="h-5 w-5 shrink-0" />
                        <p className="text-xs font-medium leading-relaxed">
                            Al confirmar, se generará el registro oficial de venta y el reporte correspondiente para este pedido. El stock ya fue descontado en el despacho.
                        </p>
                    </div>
                )}

                {loadingOrders && (
                    <div className="absolute inset-0 z-50 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-[1px] flex flex-col items-center justify-center rounded-2xl">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500 dark:text-blue-400 mb-2" />
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest">Sincronizando Pedidos...</p>
                    </div>
                )}

            </div>
        </BaseFormModal>
    );
}
