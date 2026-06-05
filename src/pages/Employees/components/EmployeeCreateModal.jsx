import React, { useState, useEffect } from "react";
import { BaseFormModal } from "../../../components/shared/BaseFormModal";
import { EmployeeForm } from "./EmployeeForm";
import { UserPlus } from "lucide-react";

const EmployeeCreateModal = ({
  isOpen,
  onClose,
  formData,
  roles = [],
  availableUsers = [],
  usedUserIds = [],
  onInputChange,
  onSelectChange,
  onSubmit,
  loading,
  onSaveSuccess,
}) => {
  const [isFormValid, setIsFormValid] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSaveSuccess(false);
    }
  }, [isOpen]);

  const handleSave = async (e) => {
    e?.preventDefault();
    const result = await onSubmit();
    if (result === true) {
      setSaveSuccess(true);
      const registeredName = formData.nombre;
      setTimeout(() => {
        onClose();
        setTimeout(() => {
          if (onSaveSuccess) onSaveSuccess(registeredName);
          setSaveSuccess(false);
        }, 300);
      }, 800);
    }
  };

  return (
    <BaseFormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Nuevo Empleado"
      subtitle="Completa la información básica para dar de alta al personal en el sistema."
      icon={UserPlus}
      loading={loading}
      saveSuccess={saveSuccess}
      isSubmitDisabled={!isFormValid}
      onSubmit={handleSave}
    >
      <EmployeeForm
        formData={formData}
        onChange={onInputChange}
        onSelectChange={onSelectChange}
        onValidityChange={setIsFormValid}
        roles={roles}
        availableUsers={availableUsers}
        usedUserIds={usedUserIds}
      />
    </BaseFormModal>
  );
};

export default EmployeeCreateModal;
