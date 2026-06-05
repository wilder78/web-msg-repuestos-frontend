import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../../components/ui/dialog";
import { Label } from "../../../components/ui/label";
import { Input } from "../../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Save, Plus, Trash2, Hash, Calendar, ShoppingBag, FolderArchive } from "lucide-react";
import { fetchProveedores } from "../../../services/comprasService";
import { useProducts } from "../../../hooks/useProducts";

/* ── Constantes ────────────────────────────────────────────── */
const EMPTY_DETAIL = {
    idProducto: "",
    nombreProducto: "",
    cantidad: 1,
    precioUnitario: 0,
};

/* ── Componente ────────────────────────────────────────────── */
export default function CompraCreateModal({
    isOpen,
    onClose,
    formData,
    setFormData,
    onSubmit,
    loading,
}) {
    const { products, loading: productsLoading } = useProducts();
    const [proveedores, setProveedores] = useState([]);
    const [proveedoresLoading, setProveedoresLoading] = useState(false);
    const [currentDetail, setCurrentDetail] = useState(EMPTY_DETAIL);
    const [formErrors, setFormErrors] = useState({});

    useEffect(() => {
        if (!isOpen) return;
        setCurrentDetail(EMPTY_DETAIL);
        setFormErrors({});
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        let cancelled = false;
        const loadProveedores = async () => {
            setProveedoresLoading(true);
            try {
                const data = await fetchProveedores();
                if (!cancelled) setProveedores(data);
            } catch (error) {
                if (!cancelled) {
                    setProveedores([]);
                    setFormErrors((prev) => ({
                        ...prev,
                        idProveedor: error.message || "No se pudieron cargar los proveedores.",
                    }));
                }
            } finally {
                if (!cancelled) setProveedoresLoading(false);
            }
        };

        loadProveedores();
        return () => {
            cancelled = true;
        };
    }, [isOpen]);

    /* ── Handlers ─────────────────────────────────────────── */
    const handleFieldChange = (name, value) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: "" }));
    };

    const handleProveedorSelect = (val) => {
        const pId = parseInt(val, 10);
        const prov = proveedores.find((p) => p.idProveedor === pId);
        if (prov) {
            handleFieldChange("idProveedor", pId);
            handleFieldChange("proveedorNombre", prov.nombreEmpresa);
        }
    };

    const handleProductSelect = (val) => {
        const pId = parseInt(val, 10);
        const prod = products.find((p) => (p.idProducto || p.id_producto) === pId);
        if (prod) {
            const precio = prod.precio_compra ?? prod.precioCompra ?? prod.precio ?? 0;
            setCurrentDetail((prev) => ({
                ...prev,
                idProducto: pId,
                nombreProducto: prod.nombre,
                precioUnitario: Number(precio),
            }));
        }
    };

    const handleCurrentDetailChange = (e) => {
        const { name, value } = e.target;
        setCurrentDetail((prev) => ({
            ...prev,
            [name]: name === "nombreProducto" ? value : parseFloat(value) || 0,
        }));
    };

    const handleAddDetail = () => {
        if (
            !currentDetail.idProducto ||
            !currentDetail.nombreProducto.trim() ||
            currentDetail.cantidad <= 0 ||
            currentDetail.precioUnitario <= 0
        ) {
            setFormErrors((prev) => ({
                ...prev,
                detail: "Seleccione un producto, y asegure cantidades/precios mayores a cero.",
            }));
            return;
        }

        setFormErrors((prev) => ({ ...prev, detail: "" }));

        const newDetalles = [
            ...(formData.detalles || []),
            {
                ...currentDetail,
                total: currentDetail.cantidad * currentDetail.precioUnitario,
            },
        ];

        setFormData((prev) => ({ ...prev, detalles: newDetalles }));
        setCurrentDetail(EMPTY_DETAIL);
    };

    const handleRemoveDetail = (index) => {
        const updated = [...(formData.detalles || [])];
        updated.splice(index, 1);
        setFormData((prev) => ({ ...prev, detalles: updated }));
    };

    const validateAndSubmit = () => {
        const errors = {};
        if (!formData.idProveedor) errors.idProveedor = "Obligatorio seleccionar proveedor.";
        if (!formData.fechaCompra) errors.fechaCompra = "Obligatorio establecer fecha.";
        if (!formData.numeroFactura?.trim()) errors.numeroFactura = "Obligatorio N° de factura.";
        if (!formData.detalles || formData.detalles.length === 0)
            errors.detalles = "Debe registrar al menos un ítem.";

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        onSubmit();
    };

    const subtotalAcumulado = (formData.detalles || []).reduce((acc, curr) => acc + curr.total, 0);
    const ivaCalculado = subtotalAcumulado * 0.19;
    const granTotal = subtotalAcumulado + ivaCalculado;

    /* ── Render ───────────────────────────────────────────── */
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                className="sm:max-w-[950px] w-full p-0 overflow-y-auto max-h-[90vh] bg-white dark:bg-zinc-900 border-0 dark:border dark:border-zinc-800 shadow-2xl rounded-2xl gap-0 text-slate-900 dark:text-slate-100 transition-colors duration-300"
            >
                {/* Header */}
                <div className="relative bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 border-b border-slate-200 dark:border-zinc-800 shrink-0">
                    <DialogHeader className="px-7 pt-6 pb-4">
                        <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-450">
                            <ShoppingBag className="h-6 w-6" />
                            <DialogTitle className="text-[#0f172a] dark:text-white text-xl font-bold">
                                Nueva Compra
                            </DialogTitle>
                        </div>
                        <DialogDescription className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
                            Registra una nueva compra a proveedor e ingresa el inventario al sistema.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="px-7 py-4 space-y-5 bg-white dark:bg-zinc-900">
                    {/* ── Sección 1: Datos Generales ─────────────────── */}
                    <div>
                        <p className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-3">
                            1. Datos Generales
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-x-5 gap-y-4">
                            {/* Proveedor */}
                            <div className="md:col-span-2">
                                <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5 block">
                                    Proveedor <span className="text-emerald-600">*</span>
                                </Label>
                                <Select
                                    value={formData.idProveedor?.toString() || ""}
                                    onValueChange={handleProveedorSelect}
                                >
                                    <SelectTrigger
                                        className={`h-11 rounded-xl bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white focus:ring-emerald-500 ${formErrors.idProveedor ? "border-red-400 dark:border-red-500" : ""}`}
                                    >
                                        <SelectValue placeholder={proveedoresLoading ? "Cargando proveedores..." : "Selecciona el proveedor..."} />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white">
                                        {proveedores.map((p) => (
                                            <SelectItem key={p.idProveedor} value={p.idProveedor.toString()}>
                                                {p.nombreEmpresa}
                                                {p.numeroDocumento ? ` (NIT: ${p.numeroDocumento})` : ""}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {formErrors.idProveedor && (
                                    <p className="text-red-500 dark:text-red-400 text-[10px] mt-1 font-bold">{formErrors.idProveedor}</p>
                                )}
                            </div>

                            {/* Fecha */}
                            <div className="md:col-span-1">
                                <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5" /> Fecha de Compra{" "}
                                    <span className="text-emerald-600">*</span>
                                </Label>
                                <Input
                                    type="date"
                                    value={formData.fechaCompra}
                                    onChange={(e) => handleFieldChange("fechaCompra", e.target.value)}
                                    className={`h-11 rounded-xl bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white focus-visible:ring-emerald-500 ${formErrors.fechaCompra ? "border-red-400 dark:border-red-500" : ""}`}
                                />
                                {formErrors.fechaCompra && (
                                    <p className="text-red-500 dark:text-red-400 text-[10px] mt-1 font-bold">{formErrors.fechaCompra}</p>
                                )}
                            </div>

                            {/* N° Factura */}
                            <div className="md:col-span-1">
                                <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1">
                                    <Hash className="w-3.5 h-3.5" /> N° Factura Proveedor{" "}
                                    <span className="text-emerald-600">*</span>
                                </Label>
                                <Input
                                    type="text"
                                    placeholder="Ej: F-100234 o RM-882"
                                    value={formData.numeroFactura}
                                    onChange={(e) => handleFieldChange("numeroFactura", e.target.value)}
                                    className={`h-11 rounded-xl bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white font-mono uppercase focus-visible:ring-emerald-500 ${formErrors.numeroFactura ? "border-red-400 dark:border-red-500" : ""}`}
                                />
                                {formErrors.numeroFactura && (
                                    <p className="text-red-500 dark:text-red-400 text-[10px] mt-1 font-bold">{formErrors.numeroFactura}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-slate-100 dark:border-zinc-800" />

                    {/* ── Sección 2: Ítems ───────────────────────────── */}
                    <div>
                        <p className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                            <FolderArchive className="w-3.5 h-3.5" />
                            2. Productos / Ítems de la Compra <span className="text-emerald-600">*</span>
                        </p>

                        {/* Constructor de ítem */}
                        <div className="flex flex-col md:flex-row items-end gap-3 p-4 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800/80 rounded-xl mb-3">
                            <div className="flex-1 w-full">
                                <Label className="text-[10px] uppercase font-bold text-slate-500 dark:text-zinc-400 mb-1.5 block">
                                    Producto
                                </Label>
                                <Select
                                    value={currentDetail.idProducto?.toString() || ""}
                                    onValueChange={handleProductSelect}
                                >
                                    <SelectTrigger className="h-11 rounded-xl bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white text-sm focus:ring-emerald-500">
                                        <SelectValue placeholder={productsLoading ? "Cargando..." : "Seleccione producto..."} />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white">
                                        {products.map((p) => {
                                            const id = p.idProducto || p.id_producto;
                                            return (
                                                <SelectItem key={id} value={id.toString()}>
                                                    {p.nombre} {p.referencia ? `(${p.referencia})` : ""}
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="w-full md:w-28">
                                <Label className="text-[10px] uppercase font-bold text-slate-500 dark:text-zinc-400 mb-1.5 block">
                                    Cant
                                </Label>
                                <Input
                                    name="cantidad"
                                    type="number"
                                    min="1"
                                    value={currentDetail.cantidad}
                                    onChange={handleCurrentDetailChange}
                                    className="h-11 rounded-xl bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white text-center text-sm focus-visible:ring-emerald-500"
                                />
                            </div>
                            <div className="w-full md:w-36">
                                <Label className="text-[10px] uppercase font-bold text-slate-500 dark:text-zinc-400 mb-1.5 block">
                                    Vr Unit ($)
                                </Label>
                                <Input
                                    name="precioUnitario"
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    value={currentDetail.precioUnitario}
                                    onChange={handleCurrentDetailChange}
                                    className="h-11 rounded-xl bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white text-right text-sm focus-visible:ring-emerald-500"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={handleAddDetail}
                                className="h-11 w-full md:w-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center justify-center transition shadow-sm shrink-0"
                            >
                                <Plus size={20} />
                            </button>
                        </div>

                        {formErrors.detail && (
                            <p className="text-red-500 dark:text-red-400 text-xs mb-3 text-center font-bold bg-red-50 dark:bg-red-950/20 p-2 rounded border border-red-100 dark:border-red-900/30">
                                {formErrors.detail}
                            </p>
                        )}
                        {formErrors.detalles && (
                            <p className="text-red-500 dark:text-red-400 text-xs mb-3 text-center font-bold bg-red-50 dark:bg-red-950/20 p-2 rounded border border-red-100 dark:border-red-900/30">
                                {formErrors.detalles}
                            </p>
                        )}

                        {/* Tabla de ítems */}
                        <div
                            className={`border rounded-xl overflow-hidden ${formErrors.detalles ? "border-red-300 dark:border-red-550" : "border-slate-200 dark:border-zinc-800"}`}
                        >
                            <table className="w-full text-xs text-left">
                                <thead className="text-slate-500 dark:text-zinc-400 uppercase border-b border-slate-200 dark:border-zinc-800 font-semibold tracking-wider">
                                    <tr className="bg-slate-50 dark:bg-zinc-800">
                                        <th className="px-4 py-2.5">Ítem</th>
                                        <th className="px-4 py-2.5 text-center">Unidades</th>
                                        <th className="px-4 py-2.5 text-right">Costo C/U</th>
                                        <th className="px-4 py-2.5 text-right bg-slate-100 dark:bg-zinc-700 border-l border-slate-200 dark:border-zinc-600">
                                            Subtotal
                                        </th>
                                        <th className="px-4 py-2.5 w-10" />
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-zinc-900">
                                    {(!formData.detalles || formData.detalles.length === 0) && (
                                        <tr>
                                            <td
                                                colSpan="5"
                                                className="px-4 py-6 text-center text-slate-400 dark:text-zinc-550 italic font-medium bg-white dark:bg-zinc-900"
                                            >
                                                Bandeja vacía. Añade el primer producto.
                                            </td>
                                        </tr>
                                    )}
                                    {(formData.detalles || []).map((det, idx) => (
                                        <tr
                                            key={idx}
                                            className="border-b last:border-0 border-slate-100 dark:border-zinc-800 hover:bg-slate-50/50 dark:hover:bg-zinc-850/50 bg-white dark:bg-zinc-900"
                                        >
                                            <td className="px-4 py-3 font-semibold text-slate-700 dark:text-zinc-300">
                                                {det.nombreProducto}
                                            </td>
                                            <td className="px-4 py-3 text-center font-medium bg-slate-50/30 dark:bg-zinc-850/30">
                                                {det.cantidad}
                                            </td>
                                            <td className="px-4 py-3 text-right text-slate-500 dark:text-zinc-400">
                                                ${parseFloat(det.precioUnitario).toLocaleString("es-CO", { minimumFractionDigits: 0 })}
                                            </td>
                                            <td className="px-4 py-3 text-right font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/10 border-l border-slate-50 dark:border-zinc-800">
                                                ${parseFloat(det.total).toLocaleString("es-CO", { minimumFractionDigits: 0 })}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => handleRemoveDetail(idx)}
                                                    className="text-red-400 hover:text-white p-1.5 rounded-lg hover:bg-red-500 dark:hover:bg-red-600 transition shadow-sm"
                                                >
                                                    <Trash2 size={13} strokeWidth={3} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                {(formData.detalles?.length > 0) && (
                                    <tfoot className="bg-emerald-600 text-white font-mono border-t border-slate-200 dark:border-zinc-800">
                                        <tr>
                                            <td
                                                colSpan="3"
                                                className="px-4 py-2 text-right uppercase font-bold tracking-widest text-[10px] text-emerald-100 dark:text-emerald-200"
                                            >
                                                Subtotal:
                                            </td>
                                            <td className="px-4 py-2 text-right font-black text-sm">
                                                ${parseFloat(subtotalAcumulado).toLocaleString("es-CO", { minimumFractionDigits: 0 })}
                                            </td>
                                            <td />
                                        </tr>
                                        <tr>
                                            <td
                                                colSpan="3"
                                                className="px-4 py-2 text-right uppercase font-bold tracking-widest text-[10px] text-emerald-100 dark:text-emerald-200"
                                            >
                                                IVA (19%):
                                            </td>
                                            <td className="px-4 py-2 text-right font-black text-sm">
                                                ${parseFloat(ivaCalculado).toLocaleString("es-CO", { minimumFractionDigits: 0 })}
                                            </td>
                                            <td />
                                        </tr>
                                        <tr className="border-t border-emerald-500/50">
                                            <td
                                                colSpan="3"
                                                className="px-4 py-3 text-right uppercase font-bold tracking-widest text-[10px] text-emerald-100 dark:text-emerald-200"
                                            >
                                                Total Compra:
                                            </td>
                                            <td className="px-4 py-3 text-right font-black text-lg">
                                                ${parseFloat(granTotal).toLocaleString("es-CO", { minimumFractionDigits: 0 })}
                                            </td>
                                            <td />
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-7 py-5 bg-slate-50/80 dark:bg-zinc-950 border-t border-slate-100 dark:border-zinc-800 flex justify-end gap-3 rounded-b-2xl">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="px-5 h-11 rounded-xl font-semibold text-slate-600 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-950/20 dark:hover:text-red-400 dark:hover:border-red-900/50 transition-colors shadow-sm"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={validateAndSubmit}
                        disabled={
                            loading ||
                            !formData.idProveedor ||
                            !formData.fechaCompra ||
                            !formData.numeroFactura?.trim() ||
                            !formData.detalles ||
                            formData.detalles.length === 0
                        }
                        className={`flex items-center gap-2 px-6 h-11 rounded-xl font-bold transition-all shadow-md ${
                            (loading ||
                            !formData.idProveedor ||
                            !formData.fechaCompra ||
                            !formData.numeroFactura?.trim() ||
                            !formData.detalles ||
                            formData.detalles.length === 0)
                                ? "bg-slate-300 text-slate-500 dark:text-zinc-500 shadow-none cursor-not-allowed"
                                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30"
                        }`}
                    >
                        {loading ? (
                            <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        ) : (
                            <>
                                <Save className="h-4 w-4" /> Registrar Compra
                            </>
                        )}
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
