import React, { useState } from "react";
import { BaseFormModal } from "../../../components/shared/BaseFormModal";
import { SupplierForm } from "./SupplierForm";
import { Truck } from "lucide-react";

export default function SupplierCreateModal({ 
  isOpen, 
  onClose, 
  formData, 
  onInputChange, 
  onSubmit, 
  loading,
  onSaveSuccess
}) {
  const [isFormValid, setIsFormValid] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // ✅ Reset al cerrar
  const handleClose = () => {
    setSaveSuccess(false);
    onClose();
  };

  // ✅ Conectado al botón de BaseFormModal via onSubmit
  const handleSubmit = async () => {
    if (loading) return; // guard doble disparo
    const success = await onSubmit();
    if (success) {
      setSaveSuccess(true);
      if (onSaveSuccess) onSaveSuccess(formData.nombre_empresa);
      setTimeout(() => {
        setSaveSuccess(false);
        handleClose();
      }, 800);
    }
  };

  return (
    <BaseFormModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Registrar Nuevo Proveedor"
      subtitle="Completa los datos para dar de alta a un nuevo proveedor en el sistema."
      icon={Truck}
      loading={loading}
      saveSuccess={saveSuccess}
      isSubmitDisabled={!isFormValid}  // ✅ deshabilita si form inválido
      onSubmit={handleSubmit}          // ✅ conectado al botón
    >
      <SupplierForm 
        formData={formData} 
        onChange={onInputChange}
        onValidityChange={setIsFormValid} // ✅ para habilitar el botón
      />
    </BaseFormModal>
  );
}