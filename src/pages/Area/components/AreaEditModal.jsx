import React, { useState } from "react";
import { BaseFormModal } from "../../../components/shared/BaseFormModal";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { Label } from "../../../components/ui/label";
import { Edit2, ShieldCheck } from "lucide-react";
import StatusBadge from "../../../components/shared/StatusBadge";

const AreaEditModal = ({
  isOpen,
  onClose,
  zone,
  formData,
  onInputChange,
  onSubmit,
  onSaveSuccess,
  loading,
}) => {
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!zone) return null;

  const handleSave = async (e) => {
    e?.preventDefault();
    const result = await onSubmit();
    if (result === true) {
      setSaveSuccess(true);
      const updatedName = formData.nombreZona;
      setTimeout(() => {
        onClose();
        if (onSaveSuccess) {
          onSaveSuccess(updatedName);
        }
        setSaveSuccess(false);
      }, 700);
    }
  };

  const toggleInternalStatus = () => {
    const nextStatus = formData.idEstado === 1 ? 2 : 1;
    onInputChange({
      target: {
        name: "idEstado",
        value: nextStatus,
      },
    });
  };

  const hasChanges = () => {
    if (!zone || !formData) return false;
    return (
      formData.nombreZona?.trim() !== (zone.name || "") ||
      formData.descripcion?.trim() !== (zone.description || "") ||
      formData.idEstado !== zone.statusId
    );
  };

  const isFormValid = formData.nombreZona?.trim() && formData.descripcion?.trim();

  return (
    <BaseFormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar Zona"
      subtitle="Modifica la información comercial de la zona seleccionada."
      icon={Edit2}
      loading={loading}
      saveSuccess={saveSuccess}
      isEditing={true}
      onSubmit={handleSave}
      isSubmitDisabled={!isFormValid || !hasChanges()}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-5 items-start">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
              Nombre de la Zona <span className="text-emerald-500">*</span>
            </Label>
            <Input
              name="nombreZona"
              value={formData.nombreZona}
              onChange={onInputChange}
              placeholder="Ej: Zona Norte"
              className="h-[42px] rounded-xl border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus-visible:ring-emerald-500"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
              <ShieldCheck className="h-3 w-3 text-slate-400 dark:text-zinc-555" /> Estado Actual
            </Label>
            <StatusBadge 
              statusId={formData.idEstado} 
              onClick={toggleInternalStatus}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
            Descripción
          </Label>
          <Textarea
            name="descripcion"
            value={formData.descripcion}
            onChange={onInputChange}
            placeholder="Describe las áreas de cobertura de esta zona..."
            className="min-h-[100px] resize-none rounded-xl border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus-visible:ring-emerald-500 text-sm"
          />
        </div>
      </div>
    </BaseFormModal>
  );
};

export default AreaEditModal;
