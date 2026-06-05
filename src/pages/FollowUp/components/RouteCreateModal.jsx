import React, { useState, useEffect } from "react";
import { BaseFormModal } from "../../../components/shared/BaseFormModal";
import { RouteForm } from "./RouteForm";
import { MapPin } from "lucide-react";

const RouteCreateModal = ({
  isOpen,
  onClose,
  formData = {},
  onInputChange,
  onSelectChange,
  onSubmit,
  loading,
  listaZonas = [],
  listaEmpleados = [],
  listaClientes = [],
  onSaveSuccess,
}) => {
  const [isFormValid, setIsFormValid] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSaveSuccess(false);
      if (!formData.detalles) {
        onSelectChange("detalles", []);
      }
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const result = await onSubmit();
    if (result !== false) {
      setSaveSuccess(true);
      const registeredName = formData.nombreRuta || "Nueva Ruta";
      setTimeout(() => {
        onClose();
        setTimeout(() => {
          if (onSaveSuccess) onSaveSuccess(registeredName);
          setTimeout(() => setSaveSuccess(false), 4500);
        }, 300);
      }, 800);
    }
  };

  return (
    <BaseFormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Planificar Ruta"
      subtitle="Define la ruta y asigna los clientes a visitar"
      icon={MapPin}
      loading={loading}
      saveSuccess={saveSuccess}
      isSubmitDisabled={!isFormValid}
      onSubmit={handleSubmit}
    >
      <RouteForm
        formData={formData}
        onChange={(data) => {
          Object.keys(data).forEach(key => {
            onInputChange({ target: { name: key, value: data[key] }});
          });
        }}
        onSelectChange={onSelectChange}
        onValidityChange={setIsFormValid}
        listaZonas={listaZonas}
        listaEmpleados={listaEmpleados}
        listaClientes={listaClientes}
      />
    </BaseFormModal>
  );
};

export default RouteCreateModal;