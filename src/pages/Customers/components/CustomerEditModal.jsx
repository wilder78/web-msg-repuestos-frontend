import React, { useState, useEffect, useCallback, useRef } from "react";
import { BaseFormModal } from "../../../components/shared/BaseFormModal";
import { CustomerForm } from "./CustomerForm";
import { Edit2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

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

const CustomerEditModal = ({
  isOpen,
  onClose,
  cliente,
  onCustomerUpdated,
  authFetch,
}) => {
  const [formData, setFormData] = useState({});
  const [zonas, setZonas] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isFormValid, setIsFormValid] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const initialData = useRef(null);
  const canEditIdentity = isMasterUser(getCurrentUser());

  // ── 1. Carga catálogos al abrir ──────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

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
  }, [isOpen, authFetch]);

  // ── 2. Construye snapshot inicial ────────────────────────────────────────
  // Recibe la lista de departments para poder resolver el ID por nombre,
  // ya que el backend NO devuelve idDepartamento — solo municipio.departamento.nombre
  const buildInitialData = useCallback((c, deptList) => {
    // Intentar ID directo primero; si no existe, buscar por nombre en la lista
    let idDepto =
      c.idDepartamento?.toString() || c.id_departamento?.toString() || "";

    if (!idDepto && deptList.length > 0) {
      const nombreDepto =
        c.municipio?.departamento?.nombre ||
        c.municipio?.departamento?.name ||
        c.departamento?.nombre ||
        c.departamento?.name ||
        "";

      if (nombreDepto) {
        const found = deptList.find(
          (d) =>
            (
              d.nombre ||
              d.name ||
              d.nombreDepartamento ||
              d.nombre_departamento ||
              ""
            ).toLowerCase() === nombreDepto.toLowerCase(),
        );
        idDepto = found
          ? (
              found.id ||
              found.idDepartamento ||
              found.id_departamento
            ).toString()
          : "";
      }
    }

    // municipioId llega como campo directo en el objeto raíz
    const idMuni =
      c.municipioId?.toString() ||
      c.idMunicipio?.toString() ||
      c.id_municipio?.toString() ||
      c.municipio?.id?.toString() ||
      c.municipio?.idMunicipio?.toString() ||
      "";

    return {
      idTipoDocumento: (
        c.idTipoDocumento ??
        c.idtipodocumento ??
        c.id_tipo_documento ??
        "1"
      ).toString(),
      numeroDocumento:
        c.numeroDocumento || c.numerodocumento || c.numero_documento || "",
      razonSocial: c.razonSocial || "",
      personaContacto: c.personaContacto || "",
      direccion: c.direccion || "",
      telefono: c.telefono || "",
      email: c.email || "",
      tipoCliente: c.tipoCliente || "Mayorista",
      cupoCredito: c.cupoCredito != null ? c.cupoCredito.toString() : "0",
      idZona: c.idZona ? c.idZona.toString() : "",
      idDepartamento: idDepto,
      idMunicipio: idMuni,
      idEstado:
        c.idEstado !== undefined ? c.idEstado.toString() : c.activo ? "1" : "0",
    };
  }, []);

  // ── 3. Puebla el form — espera a que departments esté cargado ────────────
  useEffect(() => {
    // ✅ No inicializar hasta tener la lista de departments (necesaria para resolver idDepartamento por nombre)
    if (!isOpen || !cliente || departments.length === 0) return;

    const data = buildInitialData(cliente, departments);
    setFormData(data);
    initialData.current = { ...data };
    setHasChanges(false);
    setSaveSuccess(false);
  }, [isOpen, cliente, departments, buildInitialData]);

  // Limpia snapshot al cerrar
  useEffect(() => {
    if (!isOpen) {
      initialData.current = null;
      setHasChanges(false);
    }
  }, [isOpen]);

  // ── 4. Detecta cambios contra snapshot (patrón limpio del proveedor) ─────
  useEffect(() => {
    if (!initialData.current || !formData) return;

    const changed = Object.keys(initialData.current).some(
      (key) => (formData[key] ?? "") !== (initialData.current[key] ?? ""),
    );
    setHasChanges(changed);
  }, [formData]);

  // ── 5. Submit ────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      const clientId = parseInt(cliente.idCliente || cliente.id, 10);
      if (!clientId || isNaN(clientId)) {
        throw new Error("No se pudo determinar el ID del cliente.");
      }

      const payload = {
        idTipoDocumento: parseInt(formData.idTipoDocumento),
        numeroDocumento: formData.numeroDocumento,
        razonSocial: formData.razonSocial.trim(),
        personaContacto: formData.personaContacto?.trim() || null,
        direccion: formData.direccion?.trim() || "",
        telefono: formData.telefono?.trim() || "",
        email: formData.email?.trim() || null,
        tipoCliente: formData.tipoCliente,
        cupoCredito: parseFloat(formData.cupoCredito) || 0,
        idZona: formData.idZona ? parseInt(formData.idZona) : null,
        idDepartamento: formData.idDepartamento
          ? parseInt(formData.idDepartamento)
          : null,
        idMunicipio: formData.idMunicipio
          ? parseInt(formData.idMunicipio)
          : null,
        idEstado: parseInt(formData.idEstado),
      };

      const response = await authFetch(`/api/customers/${clientId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            errorData.error ||
            `Error ${response.status} al actualizar.`,
        );
      }

      setSaveSuccess(true);
      if (onCustomerUpdated) onCustomerUpdated({ ...cliente, ...payload });
      setTimeout(() => onClose(), 800);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <BaseFormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar Información del Cliente"
      subtitle="Modifica los detalles comerciales o logísticos. El número de identidad es solo de lectura."
      icon={Edit2}
      loading={isSaving}
      saveSuccess={saveSuccess}
      isEditing={true}
      onSubmit={handleSubmit}
      isSubmitDisabled={!isFormValid || !hasChanges}
    >
      <CustomerForm
        formData={formData}
        onChange={setFormData}
        onValidityChange={setIsFormValid}
        isEditing={true}
        zonas={zonas}
        departments={departments}
        authFetch={authFetch}
        canEditIdentity={canEditIdentity}
      />
    </BaseFormModal>
  );
};

export default CustomerEditModal;
