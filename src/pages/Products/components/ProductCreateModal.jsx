import React, { useRef, useState, useEffect } from "react";
import { BaseFormModal } from "../../../components/shared/BaseFormModal";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../../../components/ui/select";
import {
  Loader2, PackagePlus, Upload, Image as ImageIcon, CheckCircle2,
  Tag, Hash, DollarSign, Archive, BarChart3, Info, Calendar
} from "lucide-react";

const ProductCreateModal = ({
  isOpen,
  onClose,
  formData,
  onInputChange,
  onSelectChange,
  onFileChange,
  onSubmit,
  loading,
  listaCategorias,
}) => {
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPreview(null);
      setSaveSuccess(false);
    }
  }, [isOpen]);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    if (onFileChange) onFileChange(file);
  };

  const handleSubmit = async () => {
    // ✅ onSubmit en GestionProductos ya maneja el cierre del modal y el toast
    // Este componente solo refleja el estado visual del botón
    const result = await onSubmit();
    if (result === true) {
      setSaveSuccess(true);
      // ✅ Solo reseteamos el estado visual — el cierre lo maneja el padre
      setTimeout(() => setSaveSuccess(false), 1500);
    }
  };

  const isFormValid = () =>
    formData.nombre?.trim() &&
    formData.referencia?.trim() &&
    formData.idCategoria &&
    // ✅ Verificar que precioCompra sea un número válido mayor a 0
    parseFloat(formData.precioCompra) > 0 &&
    parseFloat(formData.precioPublico) >= 0 &&
    parseFloat(formData.precioMayorista) >= 0 &&
    parseFloat(formData.precioMinorista) >= 0 &&
    formData.stockBuenEstado !== undefined &&
    formData.stockBuenEstado !== "" &&
    parseInt(formData.stockBuenEstado) >= 0;

  return (
    <BaseFormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Nuevo Producto"
      subtitle="Ingresa las especificaciones técnicas y existencias del nuevo repuesto"
      icon={PackagePlus}
      loading={loading}
      saveSuccess={saveSuccess}
      isSubmitDisabled={!isFormValid()}
      onSubmit={handleSubmit}
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Imagen */}
        <div className="md:col-span-4 flex flex-col items-center border-r border-slate-100 dark:border-zinc-800 pr-4">
            <Label className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-4 w-full text-center">
              Imagen del Producto
            </Label>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full aspect-square rounded-2xl border-2 border-dashed border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800
                         flex items-center justify-center overflow-hidden cursor-pointer
                         hover:border-[#10b981] hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all shadow-sm group"
            >
              {preview ? (
                <img src={preview} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2">
                   <ImageIcon className="h-10 w-10 text-slate-300 dark:text-zinc-600 group-hover:text-[#10b981] transition-colors" />
                  <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500 group-hover:text-emerald-600">
                    Subir foto
                  </span>
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
                {preview ? "Cambiar imagen" : "Seleccionar imagen"}
              </Button>
              <p className="text-[10px] text-slate-400 dark:text-zinc-550 text-center leading-tight">
                Formatos: JPG, PNG. Máx 5MB.
              </p>
            </div>
          </div>

          {/* Formulario */}
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
                    onChange={onInputChange}
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
                    onChange={onInputChange}
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
                  onValueChange={(val) => onSelectChange("idCategoria", val)}
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
                    onChange={onInputChange}
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
                  onChange={onInputChange}
                  placeholder="2024"
                  className="h-10 rounded-xl border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus-visible:ring-[#10b981]"
                />
              </div>

              {/* ✅ Precio Compra — onInputChange guarda como string, parseFloat en validación */}
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
                    onChange={onInputChange}
                    placeholder="0.00"
                    className="h-10 rounded-xl border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus-visible:ring-[#10b981] pl-9"
                  />
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-zinc-500" />
                </div>
              </div>

              {/* ✅ Precio Público */}
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
                    onChange={onInputChange}
                    placeholder="0.00"
                    className="h-10 rounded-xl border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus-visible:ring-[#10b981] pl-9"
                  />
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-zinc-500" />
                </div>
              </div>

              {/* ✅ Precio Mayorista */}
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
                    onChange={onInputChange}
                    placeholder="0.00"
                    className="h-10 rounded-xl border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus-visible:ring-[#10b981] pl-9"
                  />
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-zinc-500" />
                </div>
              </div>

              {/* ✅ Precio Minorista */}
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
                    onChange={onInputChange}
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
                    onChange={onInputChange}
                    placeholder="0"
                    className="h-10 rounded-xl border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus-visible:ring-[#10b981] pl-9"
                  />
                  <Archive className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-zinc-500" />
                </div>
              </div>

              {/* Fecha de Registro Automática */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                  Fecha Registro <span className="text-[#10b981]">*</span>
                </Label>
                <div className="relative">
                  <Input
                    name="fechaRegistro"
                    type="date"
                    value={formData.fechaRegistro || new Date().toISOString().split('T')[0]}
                    onChange={onInputChange}
                    className="h-10 rounded-xl border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus-visible:ring-[#10b981] pl-9"
                  />
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-zinc-500" />
                </div>
              </div>

              {/* Descripción */}
              <div className="flex flex-col gap-1.5 col-span-2">
                <Label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Descripción</Label>
                <Textarea
                  name="descripcion"
                  value={formData.descripcion || ""}
                  onChange={onInputChange}
                  placeholder="Detalles adicionales del producto..."
                  className="rounded-xl border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus-visible:ring-[#10b981] min-h-[80px] resize-none"
                />
              </div>
            </div>
          </div>
        </div>
    </BaseFormModal>
  );
};

export default ProductCreateModal;