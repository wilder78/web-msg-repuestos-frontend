import React, { useState, useEffect, useCallback, useRef } from "react";
import { BaseFormModal } from "../../../components/shared/BaseFormModal";
import { SupplierForm } from "./SupplierForm";
import { Edit2 } from "lucide-react";

const getAuthToken = () =>
  localStorage.getItem("token") || sessionStorage.getItem("token") || null;

const authFetch = (url, options = {}) => {
  const token = getAuthToken();
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
};

const getCurrentUser = () => {
  const userStr =
    localStorage.getItem("user") || sessionStorage.getItem("user");
  if (!userStr) return null;

  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

const isMasterUser = (user) => {
  const roleId =
    user?.idRol ??
    user?.idrol ??
    user?.id_rol ??
    user?.rol?.idRol ??
    user?.rol?.idrol ??
    user?.rol?.id_rol;
  const userName = (
    user?.nombreUsuario ||
    user?.nombreusuario ||
    user?.nombre ||
    user?.name ||
    ""
  ).toLowerCase();
  const roleName = (
    user?.nombreRol ||
    user?.nombrerol ||
    user?.rol?.nombreRol ||
    user?.rol?.nombre ||
    ""
  ).toLowerCase();

  return Number(roleId) === 1 || userName === "master" || roleName === "master";
};

const SupplierEditModal = ({
  isOpen,
  onClose,
  proveedor,
  onSupplierUpdated,
}) => {
  const [formData, setFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const initialData = useRef(null);
  const canEditIdentity = isMasterUser(getCurrentUser());

  const buildInitialData = useCallback(
    (p) => ({
      id_tipo_documento: p.idTipoDocumento ? p.idTipoDocumento.toString() : "2",
      numero_documento: p.nit || "",
      nombre_empresa: p.nombre || "",
      contacto: p.contactoNombre || "",
      telefono: p.telefono || "",
      email: p.email || "",
      direccion: p.direccion || "",
      condiciones_comerciales: p.condiciones || "",
      id_estado: p.statusId || 1,
      // ✅ Mapea los IDs de departamento y municipio correctamente
      id_departamento: p.departamentoId ? p.departamentoId.toString() : "",
      id_municipio: p.municipioId ? p.municipioId.toString() : "",
    }),
    [],
  );

  // ✅ Al abrir: puebla form y guarda snapshot
  useEffect(() => {
    if (isOpen && proveedor) {
      const data = buildInitialData(proveedor);
      setFormData(data);
      initialData.current = { ...data };
      setHasChanges(false);
      setSaveSuccess(false);
      setErrors({});
    }
    if (!isOpen) {
      initialData.current = null;
      setHasChanges(false);
    }
  }, [isOpen, proveedor, buildInitialData]);

  // ✅ Detecta cambios contra snapshot
  useEffect(() => {
    if (!initialData.current || !formData) return;

    const changed = Object.keys(initialData.current).some(
      (key) => (formData[key] ?? "") !== (initialData.current[key] ?? ""),
    );
    setHasChanges(changed);
  }, [formData]);

  const handleInputChange = (newFormData) => {
    setFormData(newFormData);
  };

  const handleSubmit = async () => {
    if (isSaving) return;
    if (!formData.nombre_empresa?.trim()) {
      setErrors({ submit: "El nombre de la empresa es obligatorio" });
      return;
    }

    setIsSaving(true);
    setErrors({});

    try {
      const response = await authFetch(`/api/suppliers/${proveedor.id}`, {
        method: "PUT",
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (!response.ok)
        throw new Error(result.message || "Error al actualizar el proveedor");

      setSaveSuccess(true);
      if (onSupplierUpdated) onSupplierUpdated(formData.nombre_empresa);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 800);
    } catch (err) {
      setErrors({
        submit: err.message || "No se pudo actualizar el proveedor",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!proveedor) return null;

  return (
    <BaseFormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar Proveedor"
      subtitle="Modifica la información comercial del registro seleccionado"
      icon={Edit2}
      loading={isSaving}
      saveSuccess={saveSuccess}
      isEditing={true}
      onSubmit={handleSubmit} // ✅ conectado al botón
      isSubmitDisabled={!isFormValid || !hasChanges} // ✅ ambas condiciones
    >
      <div className="space-y-4">
        <SupplierForm
          formData={formData}
          onChange={handleInputChange}
          onValidityChange={setIsFormValid} // ✅ habilita el botón
          isEditing={true}
          canEditIdentity={canEditIdentity}
        />
        {errors.submit && (
          <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-[11px] rounded-xl text-center">
            {errors.submit}
          </div>
        )}
      </div>
    </BaseFormModal>
  );
};

export default SupplierEditModal;
