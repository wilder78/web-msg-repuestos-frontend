import React, { useState, useEffect } from "react";
import { BaseFormModal } from "../../../components/shared/BaseFormModal";
import { CategoryForm } from "./CategoryForm";
import { ClipboardList } from "lucide-react";

export default function CategoryCreateModal({
  isOpen,
  onClose,
  formData,
  onInputChange,
  onSubmit,
  loading,
  onSaveSuccess,
}) {
  const [isFormValid, setIsFormValid] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSaveSuccess(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const success = await onSubmit();
    if (success) {
      setSaveSuccess(true);
      setTimeout(() => {
        onClose();
        setTimeout(() => {
          onSaveSuccess(formData.nombre_categoria);
          setSaveSuccess(false);
        }, 300);
      }, 700);
    }
  };

  return (
    <BaseFormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Nueva Categoría"
      subtitle="Registra una nueva clasificación para organizar los productos del inventario"
      icon={ClipboardList}
      loading={loading}
      saveSuccess={saveSuccess}
      isSubmitDisabled={!isFormValid}
      onSubmit={handleSubmit}
    >
      <CategoryForm
        formData={formData}
        onChange={onInputChange}
        onValidityChange={setIsFormValid}
        loading={loading}
      />
    </BaseFormModal>
  );
}
