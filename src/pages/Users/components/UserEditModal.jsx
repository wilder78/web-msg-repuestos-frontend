import React, { useState, useEffect, useRef } from "react";
import { BaseFormModal } from "../../../components/shared/BaseFormModal";
import { UserForm } from "./UserForm";
import { Edit2 } from "lucide-react";

export default function UserEditModal({ 
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
  const [hasChanges, setHasChanges] = useState(false);
  const initialData = useRef(null);

  // ✅ Guarda snapshot de los datos originales al abrir el modal
  useEffect(() => {
    if (isOpen && formData) {
      initialData.current = {
        nombreUsuario: formData.nombreUsuario || formData.nombre || "",
        email:         formData.email         || "",
        id_rol:        formData.id_rol?.toString() || "",
      };
      setHasChanges(false);
    }
    if (!isOpen) {
      initialData.current = null;
      setHasChanges(false);
    }
  }, [isOpen]); // ✅ solo al abrir/cerrar, no en cada cambio de formData

  // ✅ Compara formData actual contra el snapshot
  useEffect(() => {
    if (!initialData.current || !formData) return;

    const current = {
      nombreUsuario: formData.nombreUsuario || formData.nombre || "",
      email:         formData.email         || "",
      id_rol:        formData.id_rol?.toString() || "",
    };

    const changed =
      current.nombreUsuario !== initialData.current.nombreUsuario ||
      current.email         !== initialData.current.email         ||
      current.id_rol        !== initialData.current.id_rol;

    setHasChanges(changed);
  }, [formData]);

  return (
    <BaseFormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Actualizar Usuario"
      subtitle="Modifica la información del usuario en el sistema."
      icon={Edit2}
      loading={loading}
      saveSuccess={saveSuccess}
      isEditing={true}
      onSubmit={onSubmit}
      // ✅ Deshabilitado si el form no es válido O no hay cambios
      isSubmitDisabled={!isFormValid || !hasChanges}
    >
      <UserForm 
        formData={formData} 
        onChange={onInputChange} 
        onSelectChange={onSelectChange}
        onSubmit={onSubmit}
        onValidityChange={setIsFormValid}
        listaRoles={listaRoles}
        isEditing={true}
      />
    </BaseFormModal>
  );
}