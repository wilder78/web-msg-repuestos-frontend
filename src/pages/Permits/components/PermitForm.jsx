import React, { useEffect } from "react";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { Key, Layout, FileText, Bookmark } from "lucide-react";

export function PermitForm({
  formData,
  onChange,
  onValidityChange,
  isEditing = false,
}) {
  useEffect(() => {
    const isFormFilled =
      (formData.nombrePermiso || "").trim().length > 0 &&
      (formData.modulo || "").trim().length > 0 &&
      (formData.categoria || "").trim().length > 0;

    let hasChanges = true;
    if (isEditing && formData._initial) {
      const initial = formData._initial;
      hasChanges =
        (formData.nombrePermiso || "").trim() !== (initial.nombrePermiso || "").trim() ||
        (formData.modulo || "").trim() !== (initial.modulo || "").trim() ||
        (formData.categoria || "").trim() !== (initial.categoria || "").trim() ||
        (formData.descripcion || "").trim() !== (initial.descripcion || "").trim();
    }

    if (onValidityChange) {
      onValidityChange(isFormFilled && hasChanges);
    }
  }, [formData, isEditing, onValidityChange]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onChange({ ...formData, [name]: value });
  };

  const ringColor = isEditing ? "focus-visible:ring-emerald-500" : "focus-visible:ring-blue-500";
  const iconColor = isEditing ? "text-emerald-500 dark:text-emerald-400" : "text-blue-500 dark:text-blue-400";
  const labelRequiredColor = isEditing ? "text-emerald-500 dark:text-emerald-400" : "text-blue-500 dark:text-blue-400";

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Nombre del Permiso */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-2">
            <Key className={`h-3.5 w-3.5 ${iconColor}`} /> Nombre del Permiso{" "}
            <span className={labelRequiredColor}>*</span>
          </label>
          <Input
            name="nombrePermiso"
            placeholder="Ej: Gestionar Usuarios"
            value={formData.nombrePermiso || ""}
            onChange={handleInputChange}
            className={`h-[42px] rounded-xl border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white ${ringColor}`}
          />
        </div>

        {/* Módulo */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-2">
            <Layout className={`h-3.5 w-3.5 ${iconColor}`} /> Módulo{" "}
            <span className={labelRequiredColor}>*</span>
          </label>
          <Input
            name="modulo"
            placeholder="Ej: Administración"
            value={formData.modulo || ""}
            onChange={handleInputChange}
            className={`h-[42px] rounded-xl border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white ${ringColor}`}
          />
        </div>
      </div>

      {/* Categoría */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-2">
          <Bookmark className={`h-3.5 w-3.5 ${iconColor}`} /> Categoría{" "}
          <span className={labelRequiredColor}>*</span>
        </label>
        <Input
          name="categoria"
          placeholder="Ej: Seguridad, Auditoría, Configuración..."
          value={formData.categoria || ""}
          onChange={handleInputChange}
          className={`h-[42px] rounded-xl border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white ${ringColor}`}
        />
      </div>

      {/* Descripción */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-2">
          <FileText className={`h-3.5 w-3.5 ${iconColor}`} /> Descripción
        </label>
        <Textarea
          name="descripcion"
          placeholder="Describe qué permite hacer este permiso..."
          value={formData.descripcion || ""}
          onChange={handleInputChange}
          className={`resize-none h-28 rounded-xl border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white ${ringColor}`}
        />
      </div>
    </div>
  );
}
