import React, { useState } from "react";
import { BaseFormModal } from "../../../components/shared/BaseFormModal";
import { UserForm } from "./UserForm";
import { UserPlus } from "lucide-react";

export default function UserCreateModal({ 
  isOpen, 
  onClose, 
  formData, 
  onInputChange, 
  onSelectChange,
  onSubmit, 
  loading,
  saveSuccess,
  listaRoles 
}) {
  const [isFormValid, setIsFormValid] = useState(false);

  return (
<BaseFormModal
  isOpen={isOpen}
  onClose={onClose}
  title="Registrar Nuevo Usuario"
  subtitle="Completa los datos para dar de alta a un nuevo usuario en el sistema."
  icon={UserPlus}
  loading={loading}
  saveSuccess={saveSuccess}
  isSubmitDisabled={!isFormValid}
  onSubmit={onSubmit}  // ✅ agrega esta línea
>
  <UserForm 
    formData={formData} 
    onChange={onInputChange} 
    onSelectChange={onSelectChange}
    onSubmit={onSubmit}      // ✅ mantén esto para validación interna
    onValidityChange={setIsFormValid}
    listaRoles={listaRoles}
  />
</BaseFormModal>
  );
}