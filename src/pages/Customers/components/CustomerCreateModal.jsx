import React, { useState, useEffect } from "react";
import { BaseFormModal } from "../../../components/shared/BaseFormModal";
import { CustomerForm } from "./CustomerForm";
import { Users } from "lucide-react";
import { toast } from "sonner";

export function CustomerCreateModal({ isOpen, onClose, onSuccess, authFetch }) {
  const [formData, setFormData] = useState({
    idTipoDocumento: "",
    numeroDocumento: "",
    razonSocial: "",
    personaContacto: "",
    direccion: "",
    telefono: "",
    email: "",
    tipoCliente: "",
    cupoCredito: "",
    idZona: "",
    idDepartamento: "",
    idMunicipio: "",
  });

  const [isFormValid, setIsFormValid] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [zonas, setZonas] = useState([]);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setSaveSuccess(false);
      setFormData({
        idTipoDocumento: "",
        numeroDocumento: "",
        razonSocial: "",
        personaContacto: "",
        direccion: "",
        telefono: "",
        email: "",
        tipoCliente: "",
        cupoCredito: "",
        idZona: "",
        idDepartamento: "",
        idMunicipio: "",
      });

      // Fetch init data
      authFetch("/api/zonas")
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => setZonas(Array.isArray(data) ? data : data.data || []))
        .catch(console.error);

      authFetch("/api/departments")
        .then((res) => (res.ok ? res.json() : []))
        .then((data) =>
          setDepartments(Array.isArray(data) ? data : data.data || []),
        )
        .catch(console.error);
    }
  }, [isOpen, authFetch]);

  const handleSubmit = async () => {
    setIsSaving(true);

    try {
      const payload = {
        idTipoDocumento: parseInt(formData.idTipoDocumento),
        numeroDocumento: formData.numeroDocumento.trim(),
        razonSocial: formData.razonSocial.trim(),
        personaContacto: formData.personaContacto?.trim() || null,
        direccion: formData.direccion?.trim(),
        telefono: formData.telefono?.trim(),
        email: formData.email?.trim(),
        tipoCliente: formData.tipoCliente,
        cupoCredito: formData.cupoCredito
          ? parseFloat(formData.cupoCredito)
          : 0,
        idZona: formData.idZona ? parseInt(formData.idZona) : null,
        idDepartamento: formData.idDepartamento
          ? parseInt(formData.idDepartamento)
          : null,
        idMunicipio: formData.idMunicipio
          ? parseInt(formData.idMunicipio)
          : null,
        idEstado: 1,
        fechaRegistro: new Date().toISOString(),
      };

      const response = await authFetch("/api/customers", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(
          errData?.message || errData?.error || `Error del servidor: ${response.status}`,
        );
      }

      setSaveSuccess(true);
      setTimeout(() => {
        onClose();
        setTimeout(() => {
          onSuccess(formData.razonSocial.trim());
          setSaveSuccess(false);
        }, 300);
      }, 700);
    } catch (err) {
      toast.error(err.message || "No se pudo conectar con el servidor.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <BaseFormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Nuevo Cliente"
      subtitle="Completa la información técnica y comercial para el nuevo registro en el sistema"
      icon={Users}
      loading={isSaving}
      saveSuccess={saveSuccess}
      isSubmitDisabled={!isFormValid}
      onSubmit={handleSubmit}
    >
      <CustomerForm
        formData={formData}
        onChange={setFormData}
        onValidityChange={setIsFormValid}
        zonas={zonas}
        departments={departments}
        authFetch={authFetch}
      />
    </BaseFormModal>
  );
}
