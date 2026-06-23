import React, { useEffect, useState, useMemo, useRef } from "react";
import { Label } from "../../../components/ui/label";
import { Input } from "../../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { Plus, Trash2, Hash, Calendar, ShoppingBag, FolderArchive, ChevronDown } from "lucide-react";
import { fetchProveedores } from "../../../services/comprasService";
import { useProducts } from "../../../hooks/useProducts";

const EMPTY_DETAIL = {
  idProducto: "",
  nombreProducto: "",
  cantidad: 1,
  precioUnitario: 0,
};

export function CompraForm({
  formData,
  onChange,
  onValidityChange,
}) {
  const { products, loading: productsLoading } = useProducts();
  const [proveedores, setProveedores] = useState([]);
  const [proveedoresLoading, setProveedoresLoading] = useState(false);
  const [currentDetail, setCurrentDetail] = useState(EMPTY_DETAIL);
  const [detailError, setDetailError] = useState("");

  const [proveedorSearch, setProveedorSearch] = useState("");
  const [showProveedorDropdown, setShowProveedorDropdown] = useState(false);
  const proveedorDropdownRef = useRef(null);

  const [productSearch, setProductSearch] = useState("");
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const productDropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (proveedorDropdownRef.current && !proveedorDropdownRef.current.contains(event.target)) {
        setShowProveedorDropdown(false);
      }
      if (productDropdownRef.current && !productDropdownRef.current.contains(event.target)) {
        setShowProductDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!formData.idProveedor) {
      setProveedorSearch("");
    } else {
      const prov = proveedores.find(p => p.idProveedor?.toString() === formData.idProveedor?.toString());
      if (prov) {
        setProveedorSearch(prov.nombreEmpresa || "");
      }
    }
  }, [formData.idProveedor, proveedores]);

  useEffect(() => {
    if (!currentDetail.idProducto) {
      setProductSearch("");
    } else {
      setProductSearch(currentDetail.nombreProducto || "");
    }
  }, [currentDetail.idProducto, currentDetail.nombreProducto]);

  const filteredProveedores = useMemo(() => {
    if (!proveedorSearch) return proveedores;
    const currentSelected = proveedores.find(p => p.idProveedor?.toString() === formData.idProveedor?.toString());
    if (currentSelected && proveedorSearch === currentSelected.nombreEmpresa) return proveedores;
    return proveedores.filter(p => 
      p.nombreEmpresa?.toLowerCase().includes(proveedorSearch.toLowerCase()) ||
      (p.numeroDocumento || "")?.toString().toLowerCase().includes(proveedorSearch.toLowerCase())
    );
  }, [proveedores, proveedorSearch, formData.idProveedor]);

  const filteredProducts = useMemo(() => {
    if (!productSearch) return products;
    return products.filter(p => 
      p.nombre?.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.referencia?.toLowerCase().includes(productSearch.toLowerCase())
    );
  }, [products, productSearch]);

  // Load suppliers (proveedores) on mount
  useEffect(() => {
    let cancelled = false;
    const loadProveedores = async () => {
      setProveedoresLoading(true);
      try {
        const data = await fetchProveedores();
        if (!cancelled) setProveedores(data);
      } catch (error) {
        console.error("Error loading suppliers:", error);
      } finally {
        if (!cancelled) setProveedoresLoading(false);
      }
    };
    loadProveedores();
    return () => {
      cancelled = true;
    };
  }, []);

  // Real-time Form Validity Check
  useEffect(() => {
    const isValid =
      !!formData.idProveedor &&
      !!formData.fechaCompra &&
      !!formData.numeroFactura?.trim() &&
      Array.isArray(formData.detalles) &&
      formData.detalles.length > 0;
    onValidityChange(isValid);
  }, [formData, onValidityChange]);

  const handleFieldChange = (field, value) => {
    onChange({ ...formData, [field]: value });
  };

  const handleProveedorSelect = (val) => {
    const pId = parseInt(val, 10);
    const prov = proveedores.find((p) => p.idProveedor === pId);
    if (prov) {
      onChange({
        ...formData,
        idProveedor: pId,
        proveedorNombre: prov.nombreEmpresa,
      });
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
      setDetailError("Seleccione un producto, y asegure cantidades/precios mayores a cero.");
      return;
    }

    setDetailError("");

    const newDetalles = [
      ...(formData.detalles || []),
      {
        ...currentDetail,
        total: currentDetail.cantidad * currentDetail.precioUnitario,
      },
    ];

    handleFieldChange("detalles", newDetalles);
    setCurrentDetail(EMPTY_DETAIL);
  };

  const handleRemoveDetail = (index) => {
    const updated = [...(formData.detalles || [])];
    updated.splice(index, 1);
    handleFieldChange("detalles", updated);
  };

  const subtotalAcumulado = (formData.detalles || []).reduce((acc, curr) => acc + curr.total, 0);
  const ivaCalculado = subtotalAcumulado * 0.19;
  const granTotal = subtotalAcumulado + ivaCalculado;

  return (
    <div className="space-y-6 py-2 px-1 text-slate-900 dark:text-slate-100">
      {/* ── Sección 1: Datos Generales ── */}
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
            <div className="relative w-full" ref={proveedorDropdownRef}>
              <div className="relative flex items-center">
                <input
                  type="text"
                  className="w-full h-11 px-3 pr-8 rounded-xl bg-slate-50 dark:bg-zinc-800 text-sm border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder={proveedoresLoading ? "Cargando proveedores..." : "Selecciona el proveedor..."}
                  value={proveedorSearch}
                  onChange={(e) => {
                    setProveedorSearch(e.target.value);
                    setShowProveedorDropdown(true);
                  }}
                  onFocus={() => setShowProveedorDropdown(true)}
                  disabled={proveedoresLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowProveedorDropdown(!showProveedorDropdown)}
                  className="absolute right-0 top-0 bottom-0 px-2.5 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  tabIndex="-1"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
              {showProveedorDropdown && (
                <div className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto z-50 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg p-1">
                  {filteredProveedores.length === 0 ? (
                    <div className="p-2 text-xs text-slate-500 text-center">No se encontraron proveedores</div>
                  ) : (
                    filteredProveedores.map(p => (
                      <button
                        key={p.idProveedor}
                        type="button"
                        onClick={() => {
                          handleProveedorSelect(p.idProveedor.toString());
                          setShowProveedorDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs text-slate-900 dark:text-white transition-colors"
                      >
                        {p.nombreEmpresa} {p.numeroDocumento ? `(NIT: ${p.numeroDocumento})` : ""}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Fecha */}
          <div className="md:col-span-1">
            <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Fecha de Compra <span className="text-emerald-600">*</span>
            </Label>
            <Input
              type="date"
              value={formData.fechaCompra}
              onChange={(e) => handleFieldChange("fechaCompra", e.target.value)}
              className="h-11 rounded-xl bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white focus-visible:ring-emerald-500"
            />
          </div>

          {/* N° Factura */}
          <div className="md:col-span-1">
            <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1">
              <Hash className="w-3.5 h-3.5" /> N° Factura Proveedor <span className="text-emerald-600">*</span>
            </Label>
            <Input
              type="text"
              placeholder="Ej: F-100234 o RM-882"
              value={formData.numeroFactura}
              onChange={(e) => handleFieldChange("numeroFactura", e.target.value)}
              className="h-11 rounded-xl bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white font-mono uppercase focus-visible:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100 dark:border-zinc-800" />

      {/* ── Sección 2: Ítems ── */}
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
            <div className="relative w-full" ref={productDropdownRef}>
              <div className="relative flex items-center">
                <input
                  type="text"
                  className="w-full h-11 px-3 pr-8 rounded-xl bg-slate-50 dark:bg-zinc-800 text-sm border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder={productsLoading ? "Cargando..." : "Seleccione producto..."}
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    setShowProductDropdown(true);
                  }}
                  onFocus={() => setShowProductDropdown(true)}
                  disabled={productsLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowProductDropdown(!showProductDropdown)}
                  className="absolute right-0 top-0 bottom-0 px-2.5 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  tabIndex="-1"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
              {showProductDropdown && (
                <div className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto z-50 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg p-1">
                  {filteredProducts.length === 0 ? (
                    <div className="p-2 text-xs text-slate-500 text-center">No se encontraron productos</div>
                  ) : (
                    filteredProducts.map(p => {
                      const id = p.idProducto || p.id_producto;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => {
                            handleProductSelect(id.toString());
                            setShowProductDropdown(false);
                          }}
                          className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs text-slate-900 dark:text-white transition-colors"
                        >
                          {p.nombre} {p.referencia ? `(${p.referencia})` : ""}
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
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

        {detailError && (
          <p className="text-red-500 dark:text-red-400 text-xs mb-3 text-center font-bold bg-red-50 dark:bg-red-950/20 p-2 rounded border border-red-100 dark:border-red-900/30">
            {detailError}
          </p>
        )}

                <div className="border border-slate-200 dark:border-zinc-800 rounded-xl overflow-x-auto max-h-[160px] overflow-y-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-slate-500 dark:text-zinc-400 uppercase border-b border-slate-200 dark:border-zinc-800 font-semibold tracking-wider">
              <tr className="bg-slate-50 dark:bg-zinc-800">
                <th className="px-4 py-2.5">Ítem</th>
                <th className="px-4 py-2.5 text-center">Unidades</th>
                <th className="px-4 py-2.5 text-right">Costo C/U</th>
                <th className="px-4 py-2.5 text-right bg-slate-100 dark:bg-zinc-700 border-l border-slate-200 dark:border-zinc-650">Subtotal</th>
                <th className="px-4 py-2.5 w-10" />
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-zinc-900">
              {(!formData.detalles || formData.detalles.length === 0) && (
                <tr>
                  <td colSpan="5" className="px-4 py-6 text-center text-slate-400 dark:text-zinc-550 italic font-medium">
                    Bandeja vacía. Añade el primer producto.
                  </td>
                </tr>
              )}
              {(formData.detalles || []).map((det, idx) => (
                <tr key={idx} className="border-b last:border-0 border-slate-100 dark:border-zinc-800 hover:bg-slate-50/50 dark:hover:bg-zinc-800/50">
                  <td className="px-4 py-3 font-semibold text-slate-700 dark:text-zinc-300">{det.nombreProducto}</td>
                  <td className="px-4 py-3 text-center font-medium bg-slate-50/30 dark:bg-zinc-800/30">{det.cantidad}</td>
                  <td className="px-4 py-3 text-right text-slate-500 dark:text-zinc-400">
                    ${parseFloat(det.precioUnitario).toLocaleString("es-CO", { minimumFractionDigits: 0 })}
                  </td>
                  <td className="px-4 py-3 text-right font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/10 border-l border-slate-50 dark:border-zinc-800">
                    ${parseFloat(det.total).toLocaleString("es-CO", { minimumFractionDigits: 0 })}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveDetail(idx)}
                      className="text-red-400 hover:text-white p-1.5 rounded-lg hover:bg-red-500 dark:hover:bg-red-650 transition shadow-sm"
                    >
                      <Trash2 size={13} strokeWidth={3} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Sección de Totales */}
        {formData.detalles?.length > 0 && (
          <div className="sticky bottom-0 bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 pt-3 pb-2 text-xs z-10 flex flex-col items-end gap-1.5 shadow-[0_-8px_16px_rgba(0,0,0,0.05)] dark:shadow-[0_-8px_16px_rgba(0,0,0,0.3)] pr-4">
            <div className="flex justify-between w-64 text-slate-500 dark:text-zinc-400">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-700 dark:text-zinc-300">
                ${parseFloat(subtotalAcumulado).toLocaleString("es-CO", { minimumFractionDigits: 0 })}
              </span>
            </div>
            <div className="flex justify-between w-64 text-slate-500 dark:text-zinc-400">
              <span>IVA (19%):</span>
              <span className="font-semibold text-slate-700 dark:text-zinc-300">
                ${parseFloat(ivaCalculado).toLocaleString("es-CO", { minimumFractionDigits: 0 })}
              </span>
            </div>
            <div className="flex justify-between w-72 text-sm font-bold text-slate-800 dark:text-zinc-100 border-t border-slate-200 dark:border-zinc-700 pt-2 mt-1">
              <span className="uppercase tracking-wide">Total Compra:</span>
              <span className="text-emerald-600 dark:text-emerald-400 text-base">
                ${parseFloat(granTotal).toLocaleString("es-CO", { minimumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
