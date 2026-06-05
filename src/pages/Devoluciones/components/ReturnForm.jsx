import React, { useState, useEffect } from "react";
import { Label } from "../../../components/ui/label";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { 
    RotateCcw, UserCheck, PackageOpen, 
    ShoppingCart, AlertCircle, Loader2, 
    Undo2, BadgeDollarSign, Plus, Minus, Trash2
} from "lucide-react";

const API = (import.meta.env.VITE_API_URL || "http://localhost:8080/api").replace(/\/$/, "");
const hdrs = () => { 
    const t = localStorage.getItem("token") || sessionStorage.getItem("token") || ""; 
    return { "Content-Type": "application/json", ...(t ? { Authorization: `Bearer ${t}` } : {}) }; 
};

export function ReturnForm({
    formData,
    onChange,
    onValidityChange
}) {
    const [clients, setClients] = useState([]);
    const [sales, setSales] = useState([]);
    const [loadingData, setLoadingData] = useState(false);

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        setLoadingData(true);
        try {
            const res = await fetch(`${API}/customers`, { headers: hdrs() });
            const data = await res.json().catch(() => []);
            const list = Array.isArray(data) ? data : (data.data ?? []);
            setClients(list.filter(c => c.idEstado === 1 || c.activo));
        } catch { setClients([]); }
        finally { setLoadingData(false); }
    };

    const fetchSales = async (idCliente) => {
        setLoadingData(true);
        setSales([]);
        try {
            const res = await fetch(`${API}/sales`, { headers: hdrs() });
            const data = await res.json().catch(() => []);
            const list = Array.isArray(data) ? data : (data.data ?? []);
            
            const clientSales = list.filter(s => {
                const pedido = s.pedido || {};
                const cid = pedido.id_cliente ?? pedido.idCliente ?? pedido.cliente?.idCliente;
                return String(cid) === String(idCliente);
            });
            setSales(clientSales);
        } catch { setSales([]); }
        finally { setLoadingData(false); }
    };

    const handleSelectClient = (cid) => {
        const c = clients.find(cl => String(cl.idCliente ?? cl.id_cliente) === String(cid));
        onChange({
            ...formData,
            idCliente: cid,
            clienteNombre: c?.razonSocial || c?.nombre,
            numeroDocumento: c?.numeroDocumento || c?.nit || c?.cedula,
            idVenta: "",
            idPedido: "",
            detalles: []
        });
        fetchSales(cid);
    };

    const handleSelectSale = (vid) => {
        const s = sales.find(sale => String(sale.idVenta ?? sale.id_venta) === String(vid));
        const pedido = s?.pedido || {};
        const rawItems = pedido.detalles || pedido.items || [];
        
        const details = rawItems.map(item => {
            const producto = item.producto || {};
            const idProducto = item.idProducto || item.id_producto || producto.idProducto || producto.id_producto;
            const cantidad = Number(item.cantidad_solicitada ?? item.cantidadSolicitada ?? item.cantidad ?? 0);
            const precio = parseFloat(item.precio_venta ?? item.precioVenta ?? item.precioUnitario ?? item.precio ?? 0);
            const nombre = item.nombreProducto || item.producto?.nombre || producto.nombre || "Producto";

            return {
                idProducto,
                nombreProducto: nombre,
                cantOriginal: cantidad,
                cantDevolver: 0,
                precioUnitario: precio
            };
        });

        onChange({
            ...formData,
            idVenta: vid,
            idPedido: s?.idPedido ?? s?.id_pedido,
            detalles: details
        });
    };

    const updateQty = (idProd, delta) => {
        const updatedDetalles = (formData.detalles || []).map(it => {
            if (it.idProducto === idProd) {
                const newQty = Math.max(0, Math.min(it.cantOriginal, it.cantDevolver + delta));
                return { ...it, cantDevolver: newQty };
            }
            return it;
        });

        const subtotalBruto = updatedDetalles.reduce((sum, it) => sum + (it.cantDevolver * it.precioUnitario), 0);
        const valorIVA = subtotalBruto * 0.19;
        const totalAjuste = subtotalBruto + valorIVA;

        onChange({
            ...formData,
            detalles: updatedDetalles,
            subtotal: subtotalBruto,
            iva: valorIVA,
            totalAjuste: totalAjuste
        });
    };

    const removeItem = (idProd) => {
        const updatedDetalles = (formData.detalles || []).filter(it => it.idProducto !== idProd);
        const subtotalBruto = updatedDetalles.reduce((sum, it) => sum + (it.cantDevolver * it.precioUnitario), 0);
        const valorIVA = subtotalBruto * 0.19;
        const totalAjuste = subtotalBruto + valorIVA;

        onChange({
            ...formData,
            detalles: updatedDetalles,
            subtotal: subtotalBruto,
            iva: valorIVA,
            totalAjuste: totalAjuste
        });
    };

    const subtotalBruto = formData.subtotal || 0;
    const valorIVA = formData.iva || 0;
    const totalAjuste = formData.totalAjuste || 0;

    useEffect(() => {
        const hasItems = (formData.detalles || []).some(it => it.cantDevolver > 0);
        const isValid = formData.idCliente && formData.idVenta && hasItems;
        if (onValidityChange) {
            onValidityChange(!!isValid);
        }
    }, [formData, onValidityChange]);

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-zinc-350 uppercase tracking-wider">
                    <UserCheck className="h-4 w-4 text-amber-500" />
                    1. Seleccionar Cliente
                </Label>
                <Select onValueChange={handleSelectClient} value={formData.idCliente ? String(formData.idCliente) : ""}>
                    <SelectTrigger className="h-11 rounded-xl border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm focus:ring-blue-500">
                        <SelectValue placeholder={loadingData ? "Cargando clientes..." : "Busca un cliente"} />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white animate-in fade-in-50">
                        {clients.map(c => (
                            <SelectItem key={c.idCliente ?? c.id_cliente} value={String(c.idCliente ?? c.id_cliente)}>
                                {c.razonSocial || c.nombre} ({c.numeroDocumento || "Sin DOC"})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {formData.idCliente && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <Label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-zinc-350 uppercase tracking-wider">
                        <ShoppingCart className="h-4 w-4 text-blue-500" />
                        2. Factura de Venta de Referencia
                    </Label>
                    {sales.length === 0 && !loadingData ? (
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 italic text-sm">
                            <AlertCircle className="h-4 w-4" />
                            No se encontraron facturas registradas para este cliente.
                        </div>
                    ) : (
                        <Select onValueChange={handleSelectSale} value={formData.idVenta ? String(formData.idVenta) : ""}>
                            <SelectTrigger className="h-11 rounded-xl border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm focus:ring-blue-500">
                                <SelectValue placeholder="Selecciona la factura de venta" />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white animate-in fade-in-50">
                                {sales.map(s => (
                                    <SelectItem key={s.idVenta ?? s.id_venta} value={String(s.idVenta ?? s.id_venta)}>
                                        VTA-{String(s.idVenta ?? s.id_venta).padStart(4, '0')} · Ref: PED-{s.idPedido} · ${parseFloat(s.totalVenta || 0).toLocaleString()}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>
            )}

            {formData.idVenta && (
                <div className="space-y-3 animate-in fade-in zoom-in duration-300">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-850 pb-2">
                        <Label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-zinc-350 uppercase tracking-wider">
                            <PackageOpen className="h-4 w-4 text-emerald-500" />
                            3. Ítems Facturados a Reingresar
                        </Label>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full uppercase">
                            Factura: VTA-{String(formData.idVenta).padStart(4, '0')}
                        </span>
                    </div>

                    <div className="rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900 shadow-sm">
                        <div className="max-h-60 overflow-y-auto custom-scrollbar">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 dark:bg-zinc-950 text-[10px] text-slate-400 dark:text-zinc-500 font-bold sticky top-0 z-10 border-b border-slate-100 dark:border-zinc-850">
                                    <tr>
                                        <th className="px-4 py-2 text-left">Producto</th>
                                        <th className="px-4 py-2 text-center">Facturado</th>
                                        <th className="px-4 py-2 text-center">Devolver</th>
                                        <th className="px-4 py-2 text-right">Subtotal</th>
                                        <th className="px-4 py-2"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-zinc-850">
                                    {(formData.detalles || []).map(it => (
                                        <tr key={it.idProducto} className={it.cantDevolver > 0 ? "bg-blue-50/20 dark:bg-blue-950/10" : ""}>
                                            <td className="px-4 py-3">
                                                <p className="font-bold text-slate-800 dark:text-zinc-200 leading-tight">{it.nombreProducto}</p>
                                                <p className="text-[10px] text-slate-400 dark:text-zinc-550 font-mono">ID: {it.idProducto}</p>
                                            </td>
                                            <td className="px-4 py-3 text-center text-slate-500 dark:text-zinc-400 font-semibold">{it.cantOriginal}</td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button type="button" onClick={() => updateQty(it.idProducto, -1)} className="h-7 w-7 flex items-center justify-center rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-100 transition-colors shadow-sm"><Minus className="h-3 w-3" /></button>
                                                    <span className="w-8 text-center font-black text-slate-900 dark:text-white">{it.cantDevolver}</span>
                                                    <button type="button" onClick={() => updateQty(it.idProducto, 1)} className="h-7 w-7 flex items-center justify-center rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-100 transition-colors shadow-sm"><Plus className="h-3 w-3" /></button>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-slate-700 dark:text-zinc-200">
                                                ${(it.cantDevolver * it.precioUnitario * 1.19).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button type="button" onClick={() => removeItem(it.idProducto)} className="text-slate-400 dark:text-zinc-600 hover:text-rose-500 dark:hover:text-rose-450 transition-colors"><Trash2 className="h-4 w-4" /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="bg-blue-600 dark:bg-blue-750 rounded-xl p-4 flex items-center justify-between text-white shadow-lg shadow-blue-500/10">
                        <div className="flex items-center gap-3">
                            <BadgeDollarSign className="h-8 w-8 opacity-80" />
                            <div>
                                <p className="text-[10px] font-bold uppercase opacity-80 tracking-widest">Nota de Crédito Total</p>
                                <p className="text-2xl font-black">${totalAjuste.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="text-right border-l border-white/20 dark:border-white/10 pl-4">
                            <p className="text-[10px] font-bold uppercase opacity-80 italic">IVA Inc. (19%)</p>
                            <p className="text-sm font-bold">${valorIVA.toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-zinc-350 uppercase tracking-wider">
                            <Undo2 className="h-4 w-4 text-rose-500" />
                            Motivo de la Devolución (Soporte Nota Crédito)
                        </Label>
                        <Textarea 
                            value={formData.motivo || ""} 
                            onChange={(e) => onChange({ ...formData, motivo: e.target.value })} 
                            placeholder="Ej: Mercancía defectuosa, error en facturación, devolución de cliente..." 
                            className="min-h-[80px] rounded-xl border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white resize-none focus:ring-blue-500" 
                        />
                    </div>
                </div>
            )}

            {loadingData && (
                <div className="absolute inset-0 z-50 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-[1px] flex flex-col items-center justify-center rounded-2xl">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-2" />
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 font-mono tracking-tighter uppercase">Sincronizando Facturación...</p>
                </div>
            )}
        </div>
    );
}
