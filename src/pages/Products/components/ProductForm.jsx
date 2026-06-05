import React, { useRef, useEffect } from "react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../../../components/ui/select";
import {
  Upload, Image as ImageIcon, Tag, Hash, DollarSign, Archive, BarChart3, Info, Calendar, Package, AlertCircle
} from "lucide-react";

export function ProductForm({
  formData,
  onChange,
  onFileChange,
  onValidityChange,
  listaCategorias = [],
  isEditing = false,
  product = null,
  preview = null,
  setPreview = () => {},
}) {
  const fileRef = useRef(null);

  useEffect(() => {
    const isFormValid = 
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
      (!isEditing || formData.stockDefectuoso === undefined || formData.stockDefectuoso === "" || parseInt(formData.stockDefectuoso) >= 0);

    if (onValidityChange) {
      onValidityChange(!!isFormValid);
    }
  }, [formData, onValidityChange, isEditing]);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    if (onFileChange) onFileChange(file);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onChange({ ...formData, [name]: value });
  };

  const handleSelectChange = (name, value) => {
    onChange({ ...formData, [name]: value });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
      {/* Lateral Izquierdo: Foto / Imagen */}
      <div className="md:col-span-4 flex flex-col items-center border-r border-slate-100 dark:border-zinc-800 pr-4">
        <Label className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-4 w-full text-center">
          Imagen del Producto
        </Label>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="w-full aspect-square rounded-2xl border-2 border-dashed border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800
                     flex items-center justify-center overflow-hidden cursor-pointer
                     hover:border-[#10b981] hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all shadow-sm group relative"
        >
          {preview ? (
            <img src={preview} alt="preview" className="w-full h-full object-cover" />
          ) : isEditing && product ? (
            (() => {
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
              return (
                <Package className="h-10 w-10 text-slate-300 dark:text-zinc-650" />
              );
            })()
          ) : (
            <div className="flex flex-col items-center gap-2">
              <ImageIcon className="h-10 w-10 text-slate-300 dark:text-zinc-650 group-hover:text-[#10b981] transition-colors" />
              <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500 group-hover:text-emerald-600">
                Subir foto
              </span>
            </div>
          )}
          
          {(preview || (isEditing && product && product.imagenUrl !== "default_producto.png")) && (
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <ImageIcon className="h-6 w-6 text-white mb-1" />
              <span className="text-[10px] text-white font-medium">Cambiar</span>
            </div>
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />
        <div className="mt-4 flex flex-col gap-2 w-full">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileRef.current?.click()}
            className="w-full h-9 text-xs font-semibold border-slate-200 dark:border-zinc-750 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-white hover:text-[#10b981] hover:border-[#10b981]"
          >
            <Upload className="h-3.5 w-3.5 mr-2" />
            {preview || (isEditing && product && product.imagenUrl !== "default_producto.png") ? "Cambiar imagen" : "Seleccionar imagen"}
          </Button>
          <p className="text-[10px] text-slate-400 dark:text-zinc-550 text-center leading-tight">
            Formatos: JPG, PNG. Máx 5MB.
          </p>
          {isEditing && product && (
            <div className="text-center mt-2">
              <p className="text-xs font-mono text-slate-400 dark:text-zinc-500">ID: #{(product.idProducto || product.id_producto)?.toString().padStart(4, "0")}</p>
            </div>
          )}
        </div>
      </div>

      {/* Lateral Derecho: Formulario */}
      <div className="md:col-span-8 pl-2">
        <div className="grid grid-cols-2 gap-x-5 gap-y-4">
          
          {/* Nombre */}
          <div className="flex flex-col gap-1.5 col-span-2">
            <Label className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1">
              Nombre del Producto <span className="text-[#10b981]">*</span>
            </Label>
            <div className="relative">
              <Input
                name="nombre"
                value={formData.nombre || ""}
                onChange={handleInputChange}
                placeholder="Ej: Pastillas de Freno Cerámicas"
                className="h-10 rounded-xl border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus-visible:ring-[#10b981] pl-9"
              />
              <Info className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-zinc-500" />
            </div>
          </div>

          {/* Referencia */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
              Referencia / SKU <span className="text-[#10b981]">*</span>
            </Label>
            <div className="relative">
              <Input
                name="referencia"
                value={formData.referencia || ""}
                onChange={handleInputChange}
                placeholder="FRE-PAST-001"
                className="h-10 rounded-xl border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus-visible:ring-[#10b981] pl-9"
              />
              <Hash className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-zinc-500" />
            </div>
          </div>

          {/* Categoría */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
              Categoría <span className="text-[#10b981]">*</span>
            </Label>
            <Select
              value={formData.idCategoria ? formData.idCategoria.toString() : ""}
              onValueChange={(val) => handleSelectChange("idCategoria", val)}
            >
              <SelectTrigger className="h-10 rounded-xl border-slate-200 dark:border-zinc-700 focus:ring-[#10b981] bg-white dark:bg-zinc-800 text-slate-900 dark:text-white">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-slate-400 dark:text-zinc-500" />
                  <SelectValue placeholder="Selecciona" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white animate-in fade-in-50">
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

          {/* Marca */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Marca</Label>
            <div className="relative">
              <Input
                name="marca"
                value={formData.marca || ""}
                onChange={handleInputChange}
                placeholder="Akebono"
                className="h-10 rounded-xl border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus-visible:ring-[#10b981] pl-9"
              />
              <BarChart3 className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-zinc-500" />
            </div>
          </div>

          {/* Modelo */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Modelo / Año</Label>
            <Input
              name="modelo"
              value={formData.modelo || ""}
              onChange={handleInputChange}
              placeholder="2024"
              className="h-10 rounded-xl border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus-visible:ring-[#10b981]"
            />
          </div>

          {/* Precio Compra */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
              Precio Compra <span className="text-[#10b981]">*</span>
            </Label>
            <div className="relative">
              <Input
                name="precioCompra"
                type="number"
                step="0.01"
                min="0"
                value={formData.precioCompra ?? ""}
                onChange={handleInputChange}
                placeholder="0.00"
                className="h-10 rounded-xl border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus-visible:ring-[#10b981] pl-9"
              />
              <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-zinc-500" />
            </div>
          </div>

          {/* Precio Público */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
              Precio Público <span className="text-[#10b981]">*</span>
            </Label>
            <div className="relative">
              <Input
                name="precioPublico"
                type="number"
                step="0.01"
                min="0"
                value={formData.precioPublico ?? ""}
                onChange={handleInputChange}
                placeholder="0.00"
                className="h-10 rounded-xl border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus-visible:ring-[#10b981] pl-9"
              />
              <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-zinc-500" />
            </div>
          </div>

          {/* Precio Mayorista */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
              Precio Mayorista <span className="text-[#10b981]">*</span>
            </Label>
            <div className="relative">
              <Input
                name="precioMayorista"
                type="number"
                step="0.01"
                min="0"
                value={formData.precioMayorista ?? ""}
                onChange={handleInputChange}
                placeholder="0.00"
                className="h-10 rounded-xl border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus-visible:ring-[#10b981] pl-9"
              />
              <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-zinc-500" />
            </div>
          </div>

          {/* Precio Minorista */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
              Precio Minorista <span className="text-[#10b981]">*</span>
            </Label>
            <div className="relative">
              <Input
                name="precioMinorista"
                type="number"
                step="0.01"
                min="0"
                value={formData.precioMinorista ?? ""}
                onChange={handleInputChange}
                placeholder="0.00"
                className="h-10 rounded-xl border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus-visible:ring-[#10b981] pl-9"
              />
              <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-zinc-500" />
            </div>
          </div>

          {/* Stock Buen Estado */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
              Stock Inicial (Buen Estado) <span className="text-[#10b981]">*</span>
            </Label>
            <div className="relative">
              <Input
                name="stockBuenEstado"
                type="number"
                min="0"
                value={formData.stockBuenEstado ?? ""}
                onChange={handleInputChange}
                placeholder="0"
                className="h-10 rounded-xl border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus-visible:ring-[#10b981] pl-9"
              />
              <Archive className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-zinc-500" />
            </div>
          </div>

          {/* Stock Defectuoso / Fecha Registro */}
          {isEditing ? (
            <div className="flex flex-col gap-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-300">
                <AlertCircle className="h-3.5 w-3.5 text-rose-500" /> Stock Defectuoso
              </label>
              <Input
                name="stockDefectuoso"
                type="number"
                min="0"
                value={formData.stockDefectuoso ?? ""}
                onChange={handleInputChange}
                className="bg-white dark:bg-zinc-800 text-slate-900 dark:text-white border-slate-200 dark:border-zinc-700 focus-visible:ring-emerald-400"
              />
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                Fecha Registro <span className="text-[#10b981]">*</span>
              </Label>
              <div className="relative">
                <Input
                  name="fechaRegistro"
                  type="date"
                  value={formData.fechaRegistro || new Date().toISOString().split('T')[0]}
                  onChange={handleInputChange}
                  className="h-10 rounded-xl border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus-visible:ring-[#10b981] pl-9"
                />
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-zinc-500" />
              </div>
            </div>
          )}

          {/* Descripción */}
          <div className="flex flex-col gap-1.5 col-span-2">
            <Label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Descripción</Label>
            <Textarea
              name="descripcion"
              value={formData.descripcion || ""}
              onChange={handleInputChange}
              placeholder="Detalles adicionales del producto..."
              className="rounded-xl border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus-visible:ring-[#10b981] min-h-[80px] resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
