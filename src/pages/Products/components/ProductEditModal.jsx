import React, { useState, useRef } from "react";
import { BaseFormModal } from "../../../components/shared/BaseFormModal";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../../../components/ui/select";
import {
  Edit2, Package, Tag, DollarSign, Archive, BarChart3, Image as ImageIcon,
  AlertCircle
} from "lucide-react";

const ProductEditModal = ({
  isOpen,
  onClose,
  product,
  formData,
  listaCategorias,
  onInputChange,
  onSelectChange,
  onFileChange,
  onSubmit,
  loading,
  onSaveSuccess,
}) => {
  const [error, setError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(null);

  if (!product) return null;

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    if (onFileChange) onFileChange(file);
  };

  const handleSave = async () => {
    setError(null);
    const result = await onSubmit();

    if (result === true) {
      setSaveSuccess(true);
      const updatedName = formData.nombre;

      setTimeout(() => {
        onClose();
        setTimeout(() => {
          onSaveSuccess(updatedName);
          setTimeout(() => {
            setSaveSuccess(false);
          }, 4500);
        }, 300);
      }, 800);
    } else {
      setError("Error al guardar cambios. Verifique la consola o sus permisos.");
    }
  };

  // Detecta si hay cambios en los campos editables
  const hasChanges = () => {
    if (!product || !formData) return false;
    if (preview) return true; // File changed

    const f = formData;
    const p = product;

    return (
      (f.nombre || "").trim() !== (p.nombre || "").trim() ||
      (f.referencia || "").trim() !== (p.referencia || "").trim() ||
      (f.idCategoria?.toString() || "") !== ((p.idCategoria || p.id_categoria)?.toString() || "") ||
      (f.marca || "").trim() !== (p.marca || "").trim() ||
      (f.modelo || "").trim() !== (p.modelo || "").trim() ||
      Number(f.precioCompra || 0) !== Number(p.precioCompra ?? p.precio_compra ?? 0) ||
      Number(f.precioPublico || 0) !== Number(p.precioPublico ?? p.precio_publico ?? 0) ||
      Number(f.precioMayorista || 0) !== Number(p.precioMayorista ?? p.precio_mayorista ?? 0) ||
      Number(f.precioMinorista || 0) !== Number(p.precioMinorista ?? p.precio_minorista ?? 0) ||
      Number(f.stockBuenEstado || 0) !== Number(p.stockBuenEstado ?? p.stock_buen_estado ?? 0) ||
      Number(f.stockDefectuoso || 0) !== Number(p.stockDefectuoso ?? p.stock_defectuoso ?? 0) ||
      (f.descripcion || "").trim() !== (p.descripcion || "").trim()
    );
  };

  const isFormValid = () => {
    return (
      formData.nombre?.trim() &&
      formData.referencia?.trim() &&
      formData.idCategoria &&
      parseFloat(formData.precioCompra) > 0 &&
      parseFloat(formData.precioPublico) >= 0 &&
      parseFloat(formData.precioMayorista) >= 0 &&
      parseFloat(formData.precioMinorista) >= 0 &&
      formData.stockBuenEstado !== undefined &&
      formData.stockBuenEstado !== "" &&
      parseInt(formData.stockBuenEstado) >= 0 &&
      (formData.stockDefectuoso === undefined || formData.stockDefectuoso === "" || parseInt(formData.stockDefectuoso) >= 0)
    );
  };

  return (
    <BaseFormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar Producto"
      subtitle="Actualiza la información y existencias del producto"
      icon={Edit2}
      loading={loading}
      saveSuccess={saveSuccess}
      isEditing={true}
      isSubmitDisabled={!hasChanges() || !isFormValid()}
      onSubmit={handleSave}
    >
      <div className="flex flex-col md:flex-row gap-6">
        {/* ── Lateral Izquierdo: Resumen y Foto ── */}
        <div className="md:w-1/3 flex flex-col items-center border-r border-slate-100 dark:border-zinc-800 pr-4">
            <div className="w-32 h-32 rounded-2xl bg-white dark:bg-zinc-800 border-4 border-white dark:border-zinc-700 shadow-md flex items-center justify-center overflow-hidden cursor-pointer hover:border-emerald-100 dark:hover:border-emerald-950/20 transition-colors group relative"
                 onClick={() => fileRef.current?.click()}
            >
              {preview ? (
                <img src={preview} alt="preview" className="w-full h-full object-cover" />
              ) : (() => {
                const imgUrl = product.imagenUrl || product.imagen_url;
                if (imgUrl && imgUrl !== "default_producto.png") {
                  const src = imgUrl.startsWith('http') ? imgUrl : `http://localhost:8080/uploads/${imgUrl}`;
                  return (
                    <img 
                      src={src} 
                      alt={product.nombre}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                  );
                }
                return null;
              })()}
              <Package 
                className="h-10 w-10 text-slate-300 dark:text-zinc-650" 
                style={{ display: (!preview && (!(product.imagenUrl || product.imagen_url) || (product.imagenUrl || product.imagen_url) === "default_producto.png")) ? 'block' : 'none' }}
              />
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ImageIcon className="h-6 w-6 text-white mb-1" />
                <span className="text-[10px] text-white font-medium">Cambiar</span>
              </div>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFile}
            />

            <div className="w-full mt-6 space-y-3">
              <div className="text-center">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 break-words line-clamp-2">{product.nombre}</p>
                <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono mt-1">ID: #{(product.idProducto || product.id_producto)?.toString().padStart(4, "0")}</p>
              </div>
            </div>
          </div>

          {/* ── Lateral Derecho: Formulario ── */}
          <div className="md:w-2/3 pl-2">
            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
              
              <div className="flex flex-col gap-1.5 col-span-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Nombre del Producto <span className="text-emerald-500">*</span>
                </label>
                <Input
                  name="nombre"
                  value={formData.nombre || ""}
                  onChange={onInputChange}
                  className="bg-white dark:bg-zinc-800 text-slate-900 dark:text-white border-slate-200 dark:border-zinc-700 focus-visible:ring-emerald-400"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Referencia / SKU <span className="text-emerald-500">*</span>
                </label>
                <Input
                  name="referencia"
                  value={formData.referencia || ""}
                  onChange={onInputChange}
                  className="bg-white dark:bg-zinc-800 text-slate-900 dark:text-white border-slate-200 dark:border-zinc-700 focus-visible:ring-emerald-400 font-mono text-sm"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Categoría <span className="text-emerald-500">*</span>
                </label>
                <Select
                  value={formData.idCategoria ? formData.idCategoria.toString() : ""}
                  onValueChange={(val) => onSelectChange("idCategoria", val)}
                >
                  <SelectTrigger className="focus:ring-emerald-400 w-full bg-white dark:bg-zinc-800 text-slate-900 dark:text-white border-slate-200 dark:border-zinc-700">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white">
                    {(listaCategorias || [])
                      .filter((cat) => (cat.idCategoria || cat.id_categoria) != null)
                      .map((cat) => {
                        const catId = (cat.idCategoria || cat.id_categoria).toString();
                        return (
                          <SelectItem key={`cat-${catId}`} value={catId}>
                            {cat.nombreCategoria || cat.nombre_categoria || "Sin nombre"}
                          </SelectItem>
                        );
                      })}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Marca</label>
                <Input
                  name="marca"
                  value={formData.marca || ""}
                  onChange={onInputChange}
                  className="bg-white dark:bg-zinc-800 text-slate-900 dark:text-white border-slate-200 dark:border-zinc-700 focus-visible:ring-emerald-400"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Modelo / Año</label>
                <Input
                  name="modelo"
                  value={formData.modelo || ""}
                  onChange={onInputChange}
                  className="bg-white dark:bg-zinc-800 text-slate-900 dark:text-white border-slate-200 dark:border-zinc-700 focus-visible:ring-emerald-400"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  <DollarSign className="h-3.5 w-3.5 text-emerald-500" /> Precio Compra
                </label>
                <Input
                  name="precioCompra"
                  type="number"
                  step="0.01"
                  value={formData.precioCompra ?? ""}
                  onChange={onInputChange}
                  className="bg-white dark:bg-zinc-800 text-slate-900 dark:text-white border-slate-200 dark:border-zinc-700 focus-visible:ring-emerald-400"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  <DollarSign className="h-3.5 w-3.5 text-emerald-500" /> Precio Público
                </label>
                <Input
                  name="precioPublico"
                  type="number"
                  step="0.01"
                  value={formData.precioPublico ?? ""}
                  onChange={onInputChange}
                  className="bg-white dark:bg-zinc-800 text-slate-900 dark:text-white border-slate-200 dark:border-zinc-700 focus-visible:ring-emerald-400"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  <DollarSign className="h-3.5 w-3.5 text-emerald-500" /> Precio Mayorista
                </label>
                <Input
                  name="precioMayorista"
                  type="number"
                  step="0.01"
                  value={formData.precioMayorista ?? ""}
                  onChange={onInputChange}
                  className="bg-white dark:bg-zinc-800 text-slate-900 dark:text-white border-slate-200 dark:border-zinc-700 focus-visible:ring-emerald-400"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  <DollarSign className="h-3.5 w-3.5 text-emerald-500" /> Precio Minorista
                </label>
                <Input
                  name="precioMinorista"
                  type="number"
                  step="0.01"
                  value={formData.precioMinorista ?? ""}
                  onChange={onInputChange}
                  className="bg-white dark:bg-zinc-800 text-slate-900 dark:text-white border-slate-200 dark:border-zinc-700 focus-visible:ring-emerald-400"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  <Archive className="h-3.5 w-3.5 text-blue-500" /> Stock (Buen Estado)
                </label>
                <Input
                  name="stockBuenEstado"
                  type="number"
                  min="0"
                  value={formData.stockBuenEstado ?? ""}
                  onChange={onInputChange}
                  className="bg-white dark:bg-zinc-800 text-slate-900 dark:text-white border-slate-200 dark:border-zinc-700 focus-visible:ring-emerald-400"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  <AlertCircle className="h-3.5 w-3.5 text-rose-500" /> Stock Defectuoso
                </label>
                <Input
                  name="stockDefectuoso"
                  type="number"
                  min="0"
                  value={formData.stockDefectuoso ?? ""}
                  onChange={onInputChange}
                  className="bg-white dark:bg-zinc-800 text-slate-900 dark:text-white border-slate-200 dark:border-zinc-700 focus-visible:ring-emerald-400"
                />
              </div>

              <div className="flex flex-col gap-1.5 col-span-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Descripción</label>
                <Textarea
                  name="descripcion"
                  value={formData.descripcion || ""}
                  onChange={onInputChange}
                  className="bg-white dark:bg-zinc-800 text-slate-900 dark:text-white border-slate-200 dark:border-zinc-700 focus-visible:ring-emerald-400 resize-none min-h-[60px]"
                />
              </div>

            </div>
            
            {error && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400 text-xs">
                <AlertCircle className="h-4 w-4 text-red-500" /> {error}
              </div>
            )}
          </div>
        </div>
    </BaseFormModal>
  );
};

export default ProductEditModal;
