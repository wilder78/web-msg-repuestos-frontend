import React, { useEffect } from "react";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { Label } from "../../../components/ui/label";
import { ShieldCheck } from "lucide-react";
import StatusBadge from "../../../components/shared/StatusBadge";

export function AreaForm({
  formData,
  onChange,
  onValidityChange,
  isEditing = false,
  zone = null,
}) {
  useEffect(() => {
    const isFormValid = !!formData.nombreZona?.trim() && !!formData.descripcion?.trim();
    if (isEditing && zone) {
      const hasChanges =
        formData.nombreZona?.trim() !== (zone.name || "") ||
        formData.descripcion?.trim() !== (zone.description || "") ||
        formData.idEstado !== zone.statusId;
      onValidityChange(isFormValid && hasChanges);
    } else {
      onValidityChange(isFormValid);
    }
  }, [formData, isEditing, zone, onValidityChange]);

  const handleInputChange = (field, value) => {
    onChange({ ...formData, [field]: value });
  };

  const toggleInternalStatus = () => {
    const nextStatus = formData.idEstado === 1 ? 2 : 1;
    handleInputChange("idEstado", nextStatus);
  };

  return (
    <div className="space-y-5 py-2 px-1 text-slate-900 dark:text-slate-100">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-5 items-start">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
            Nombre de la Zona <span className="text-emerald-500">*</span>
          </Label>
          <Input
            value={formData.nombreZona || ""}
            onChange={(e) => handleInputChange("nombreZona", e.target.value)}
            placeholder="Ej: Zona Norte"
            className="h-[42px] rounded-xl border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus-visible:ring-[#10b981]"
          />
        </div>

        {isEditing && (
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
              <ShieldCheck className="h-3 w-3 text-slate-400 dark:text-zinc-500" /> Estado Actual
            </Label>
            <StatusBadge 
              statusId={formData.idEstado} 
              onClick={toggleInternalStatus}
            />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
          Descripción <span className="text-emerald-555">*</span>
        </Label>
        <Textarea
          value={formData.descripcion || ""}
          onChange={(e) => handleInputChange("descripcion", e.target.value)}
          placeholder="Describe las áreas de cobertura de esta zona..."
          className="min-h-[100px] resize-none rounded-xl border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus-visible:ring-[#10b981] text-sm"
        />
      </div>
    </div>
  );
}
