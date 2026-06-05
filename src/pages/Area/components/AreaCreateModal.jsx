import React, { useEffect, useState } from "react";
import { BaseFormModal } from "../../../components/shared/BaseFormModal";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { Label } from "../../../components/ui/label";
import { MapPin } from "lucide-react";

const AreaCreateModal = ({ isOpen, onClose, onCreateArea, onSaveSuccess, isSaving }) => {
  const [form, setForm] = useState({
    nombreZona: "",
    descripcion: "",
  });
  const [error, setError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm({ nombreZona: "", descripcion: "" });
      setError("");
      setSaveSuccess(false);
    }
  }, [isOpen]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event?.preventDefault();
    if (!form.nombreZona.trim() || !form.descripcion.trim()) {
      setError("Todos los campos son obligatorios.");
      return;
    }

    const payload = {
      nombre_zona: form.nombreZona.trim(),
      descripcion: form.descripcion.trim(),
      id_estado: 1,
    };

    try {
      const result = await onCreateArea(payload);

      if (result === true || result?.success) {
        setSaveSuccess(true);
        const zoneName = form.nombreZona.trim();
        setTimeout(() => {
          onClose();
          if (onSaveSuccess) onSaveSuccess(zoneName);
          setSaveSuccess(false);
        }, 700);
      } else {
        const msg =
          typeof result === "string"
            ? result
            : result?.message || result?.error || "No se pudo crear la zona.";
        setError(msg);
      }
    } catch (err) {
      console.error("Error inesperado creando zona:", err);
      setError("Error inesperado. Intenta de nuevo.");
    }
  };

  const isFormValid = form.nombreZona.trim() && form.descripcion.trim();

  return (
    <BaseFormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Crear Nueva Zona"
      subtitle="Completa los datos para registrar una nueva área en el sistema."
      icon={MapPin}
      loading={isSaving}
      saveSuccess={saveSuccess}
      isSubmitDisabled={!isFormValid}
      onSubmit={handleSubmit}
    >
      <div className="space-y-5">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
            Nombre de zona <span className="text-[#10b981]">*</span>
          </Label>
          <Input
            value={form.nombreZona}
            onChange={(event) => handleChange("nombreZona", event.target.value)}
            placeholder="Ej: Zona Sur Colombia"
            className="h-[42px] rounded-xl border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus-visible:ring-[#10b981]"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
            Descripción <span className="text-[#10b981]">*</span>
          </Label>
          <Textarea
            value={form.descripcion}
            onChange={(event) => handleChange("descripcion", event.target.value)}
            placeholder="Empresas y bodegas ubicadas en el sector sur"
            className="min-h-[100px] rounded-xl border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus-visible:ring-[#10b981] resize-none"
          />
        </div>

        {error && (
          <p className="text-xs text-rose-500 dark:text-rose-400 mt-1">
            {error}
          </p>
        )}
      </div>
    </BaseFormModal>
  );
};

export default AreaCreateModal;
