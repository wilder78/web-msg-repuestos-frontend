import React, { useState, useEffect, useRef } from "react";
import { BaseFormModal } from "../../../components/shared/BaseFormModal";
import { EmployeeForm } from "./EmployeeForm";
import { Edit2, AlertCircle } from "lucide-react";

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

const EMPLOYEE_ENDPOINT = "/api/employees";

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

const EmployeeEditModal = ({
  isOpen,
  onClose,
  empleado,
  roles = [],
  availableUsers = [],
  usedUserIds = [],
  onEmpleadoUpdated,
  onSaveSuccess,
}) => {
  const [formData, setFormData] = useState({
    idTipoDocumento: "1",
    numeroDocumento: "",
    nombre: "",
    apellido: "",
    telefono: "",
    rolOperativo: "",
    idUsuario: null,
    disponibilidad: true,
    idEstado: 1,
  });

  const [isFormValid, setIsFormValid] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const initialData = useRef(null);
  const canEditIdentity = isMasterUser(getCurrentUser());

  useEffect(() => {
    if (isOpen && empleado) {
      const initialValues = {
        idTipoDocumento: (empleado.idTipoDocumento || 1).toString(),
        numeroDocumento: empleado.numeroDocumento || "",
        nombre: empleado.nombre || empleado.nombres || "",
        apellido: empleado.apellido || empleado.apellidos || "",
        telefono: empleado.telefono || "",
        rolOperativo: empleado.cargo || empleado.rolOperativo || "",
        idUsuario: empleado.idUsuario || null,
        disponibilidad:
          empleado.disponibilidad === true || empleado.disponibilidad === 1,
        idEstado: empleado.idEstado ?? empleado.statusId ?? 1,
      };
      setFormData(initialValues);
      initialData.current = initialValues;
      setSaveSuccess(false);
      setErrorMessage(null);
      setHasChanges(false);
    }
    if (!isOpen) {
      initialData.current = null;
      setHasChanges(false);
    }
  }, [isOpen, empleado]);

  const handleInputChange = (updatedData) => {
    setErrorMessage(null);
    setFormData(updatedData);
  };

  const handleSelectChange = (name, value) => {
    setErrorMessage(null);
    setFormData((prev) => {
      const newState = { ...prev, [name]: value };
      if (name === "idUsuario" && value === null) {
        newState.rolOperativo = "";
      }
      return newState;
    });
  };

  useEffect(() => {
    if (!initialData.current || !formData) return;
    const changed = Object.keys(formData).some((key) => {
      if (key === "idUsuario") {
        const currentId = formData.idUsuario
          ? String(formData.idUsuario)
          : null;
        const initialId = initialData.current.idUsuario
          ? String(initialData.current.idUsuario)
          : null;
        return currentId !== initialId;
      }
      return formData[key] !== initialData.current[key];
    });
    setHasChanges(changed);
  }, [formData]);

  const handleSubmit = async () => {
    setIsSaving(true);
    setErrorMessage(null);

    try {
      const empId = empleado.idEmpleado || empleado.id || empleado.id_empleado;
      if (!empId) throw new Error("ID de empleado no encontrado.");

      const payload = {
        idTipoDocumento: parseInt(formData.idTipoDocumento, 10),
        numeroDocumento: formData.numeroDocumento,
        nombre: formData.nombre?.trim(),
        apellido: formData.apellido?.trim(),
        telefono: formData.telefono?.trim(),
        rolOperativo: formData.rolOperativo,
        idUsuario: formData.idUsuario ? parseInt(formData.idUsuario, 10) : null,
        disponibilidad: formData.disponibilidad,
        idEstado: parseInt(formData.idEstado, 10),
      };

      const response = await authFetch(`${EMPLOYEE_ENDPOINT}/${empId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorMsg = "Error al actualizar el empleado.";
        try {
          const errorData = await response.json();
          errorMsg = errorData.message || errorMsg;
        } catch {
          errorMsg = (await response.text()) || errorMsg;
        }
        throw new Error(errorMsg);
      }

      const responseData = await response.json();
      const empleadoActualizado = responseData.data || responseData;

      const updatedMapped = {
        ...empleado,
        idTipoDocumento: payload.idTipoDocumento,
        numeroDocumento: payload.numeroDocumento,
        nombre: payload.nombre,
        apellido: payload.apellido,
        telefono: payload.telefono,
        cargo: payload.rolOperativo,
        idUsuario: payload.idUsuario,
        disponibilidad: payload.disponibilidad,
        idEstado: payload.idEstado,
        ...empleadoActualizado,
      };

      setSaveSuccess(true);
      if (onEmpleadoUpdated) onEmpleadoUpdated(updatedMapped);
      if (onSaveSuccess) onSaveSuccess(payload.nombre);

      setTimeout(() => {
        onClose();
      }, 700);
    } catch (error) {
      setErrorMessage(error.message || "Ocurrió un error inesperado.");
    } finally {
      setIsSaving(false);
    }
  };

  const isFormValidStrict =
    isFormValid &&
    (formData.idUsuario === null ? true : formData.rolOperativo?.trim() !== "");

  return (
    <BaseFormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar Datos del Empleado"
      subtitle="Actualiza la información básica o vincula una cuenta de usuario diferente."
      icon={Edit2}
      loading={isSaving}
      saveSuccess={saveSuccess}
      isEditing={true}
      onSubmit={handleSubmit}
      isSubmitDisabled={!isFormValidStrict || !hasChanges}
    >
      <EmployeeForm
        formData={formData}
        onChange={handleInputChange}
        onSelectChange={handleSelectChange}
        onValidityChange={setIsFormValid}
        roles={roles}
        availableUsers={availableUsers}
        usedUserIds={usedUserIds}
        isEditing={true}
        canEditIdentity={canEditIdentity}
      />
      {errorMessage && (
        <div className="flex items-start gap-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 px-4 py-3 text-sm text-red-700 dark:text-red-400 mt-4">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-red-500" />
          <span>{errorMessage}</span>
        </div>
      )}
    </BaseFormModal>
  );
};

export default EmployeeEditModal;
