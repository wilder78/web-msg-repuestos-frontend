import React, { useEffect, useMemo, useState } from "react";
import { Building2, Mail, MapPin, Phone, Save, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { authFetch, resolveUserRole } from "../../lib/auth-utils";
import { useAuth } from "../../hooks/useAuth";
import SuccessToast from "../ui/SuccessToast";


const API_BASE_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
const FIELD_WRAPPER_CLASS = "relative";
const EDITABLE_INPUT_CLASS =
  "w-full h-12 rounded-2xl border border-slate-200/80 bg-white pl-11 pr-4 text-sm text-slate-900 shadow-sm shadow-slate-100/70 transition-all placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400";
const READONLY_INPUT_CLASS =
  "w-full h-12 rounded-2xl border border-slate-200/70 bg-slate-50/90 pl-11 pr-4 text-sm text-slate-500 shadow-sm shadow-slate-100/40 cursor-not-allowed";
const SELECT_CLASS =
  "w-full h-12 rounded-2xl border border-slate-200/80 bg-white px-4 text-sm text-slate-900 shadow-sm shadow-slate-100/70 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 disabled:bg-slate-50 disabled:text-slate-400";

const EMPTY_FORM = {
  id_tipo_documento: "",
  numero_documento: "",
  email: "",
  razon_social: "",
  telefono: "",
  direccion: "",
  id_departamento: "",
  municipio_id: "",
};

const extractList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  for (const key of ["data", "customers", "clientes", "content", "rows", "items", "results"]) {
    const value = payload[key];
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object") {
      const nested = extractList(value);
      if (nested.length > 0) return nested;
    }
  }

  return [];
};

const unwrapEntity = (payload) =>
  payload?.data?.customer ||
  payload?.data?.cliente ||
  payload?.data ||
  payload?.customer ||
  payload?.cliente ||
  payload;

const getCustomerId = (customer) =>
  customer?.idCliente ?? customer?.idcliente ?? customer?.id_cliente ?? customer?.id ?? null;

const getDepartmentId = (customer) =>
  customer?.idDepartamento ??
  customer?.id_departamento ??
  customer?.municipio?.departmentId ??
  customer?.municipio?.idDepartamento ??
  customer?.municipio?.id_departamento ??
  customer?.municipio?.departamento?.id ??
  customer?.municipio?.departamento?.idDepartamento ??
  customer?.municipio?.departamento?.id_departamento ??
  "";

const getMunicipalityId = (customer) =>
  customer?.municipioId ??
  customer?.municipio_id ??
  customer?.idMunicipio ??
  customer?.id_municipio ??
  customer?.municipio?.id ??
  customer?.municipio?.idMunicipio ??
  customer?.municipio?.id_municipio ??
  "";

const getDocumentTypeId = (customer) =>
  customer?.idTipoDocumento ??
  customer?.id_tipo_documento ??
  customer?.tipoDocumento?.id ??
  customer?.tipo_documento?.id ??
  "";

const getDocumentTypeLabel = (documentTypeId) => {
  const normalized = String(documentTypeId || "");
  if (normalized === "1") return "Cedula de Ciudadania";
  if (normalized === "2") return "NIT";
  return normalized ? `Documento ${normalized}` : "No especificado";
};

const buildFormFromCustomer = (customer) => ({
  id_tipo_documento: String(getDocumentTypeId(customer) || ""),
  numero_documento: String(
    customer?.numeroDocumento ?? customer?.numero_documento ?? customer?.documento ?? ""
  ),
  email: String(customer?.email ?? ""),
  razon_social: String(customer?.razonSocial ?? customer?.razon_social ?? customer?.nombre ?? ""),
  telefono: String(customer?.telefono ?? customer?.celular ?? ""),
  direccion: String(customer?.direccion ?? ""),
  id_departamento: String(getDepartmentId(customer) || ""),
  municipio_id: String(getMunicipalityId(customer) || ""),
});

const resolveLocationFromMunicipality = async (municipalityId) => {
  if (!municipalityId) return { departmentId: "", municipalityId: "" };

  try {
    const response = await authFetch(`${API_BASE_URL}/municipalities`);
    if (!response.ok) {
      return { departmentId: "", municipalityId: String(municipalityId) };
    }

    const payload = await response.json().catch(() => []);
    const municipalities = extractList(payload);
    const match = municipalities.find((municipality) => {
      const id = municipality?.id ?? municipality?.idMunicipio ?? municipality?.id_municipio;
      return String(id) === String(municipalityId);
    });

    if (!match) {
      return { departmentId: "", municipalityId: String(municipalityId) };
    }

    return {
      departmentId: String(
        match.departmentId ??
          match.idDepartamento ??
          match.id_departamento ??
          match.departamento?.id ??
          ""
      ),
      municipalityId: String(
        match.id ?? match.idMunicipio ?? match.id_municipio ?? municipalityId
      ),
    };
  } catch {
    return { departmentId: "", municipalityId: String(municipalityId) };
  }
};

export default function AccountSettingsModal({ isOpen, onClose }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [initialForm, setInitialForm] = useState(EMPTY_FORM);
  const [customerId, setCustomerId] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);
  const [loadingCustomer, setLoadingCustomer] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingMunicipalities, setLoadingMunicipalities] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toastConfig, setToastConfig] = useState({
    visible: false,
    title: "",
    message: "",
    type: "success",
  });

  const roleId = Number(user?.idRol ?? user?.id_rol ?? user?.idrol ?? 4);
  const isClient = roleId === 4;
  const isEmployee = !isClient;
  const roleName = resolveUserRole(user);

  const hasChanges = useMemo(
    () => Object.keys(initialForm).some((key) => (formData[key] ?? "") !== (initialForm[key] ?? "")),
    [formData, initialForm]
  );

  const isSubmitDisabled =
    saving ||
    loadingCustomer ||
    !hasChanges;

  useEffect(() => {
    if (!isOpen) {
      setFormData(EMPTY_FORM);
      setInitialForm(EMPTY_FORM);
      setCustomerId(null);
      setMunicipalities([]);
      setError("");
      return;
    }

    let ignore = false;

    const loadCustomer = async () => {
      setLoadingCustomer(true);
      setError("");

      try {
        const storedCustomerId =
          user?.idCliente ?? user?.idcliente ?? user?.id_cliente ?? null;
        const userEmail = String(user?.email ?? "").trim();

        const urls = [
          ...(storedCustomerId ? [`${API_BASE_URL}/customers/${storedCustomerId}`] : []),
          ...(userEmail
            ? [
                `${API_BASE_URL}/customers/email/${encodeURIComponent(userEmail)}`,
                `${API_BASE_URL}/customers/by-email?email=${encodeURIComponent(userEmail)}`,
              ]
            : []),
        ];

        let foundCustomer = null;

        for (const url of urls) {
          const response = await authFetch(url);
          if (!response.ok) continue;

          const payload = await response.json().catch(() => ({}));
          const entity = unwrapEntity(payload);
          if (entity && getCustomerId(entity)) {
            foundCustomer = entity;
            break;
          }
        }

        if (ignore) return;

        if (!foundCustomer) {
          if (isClient) {
            setError("No encontramos un cliente asociado a tu cuenta para editar sus datos.");
            return;
          } else {
            // Prepopulate for employee with user info
            const nextForm = {
              id_tipo_documento: "",
              numero_documento: "",
              email: userEmail,
              razon_social: String(user?.nombre ?? user?.nombreUsuario ?? ""),
              telefono: String(user?.telefono ?? ""),
              direccion: String(user?.direccion ?? ""),
              id_departamento: "",
              municipio_id: "",
            };
            setFormData(nextForm);
            setInitialForm(nextForm);
            setCustomerId(user?.idUsuario || user?.id || "user");
            return;
          }
        }

        let nextForm = buildFormFromCustomer(foundCustomer);

        if (!nextForm.id_departamento && nextForm.municipio_id) {
          const resolvedLocation = await resolveLocationFromMunicipality(nextForm.municipio_id);
          if (!ignore) {
            nextForm = {
              ...nextForm,
              id_departamento: resolvedLocation.departmentId || nextForm.id_departamento,
              municipio_id: resolvedLocation.municipalityId || nextForm.municipio_id,
            };
          }
        }

        if (ignore) return;

        setCustomerId(getCustomerId(foundCustomer));
        setFormData(nextForm);
        setInitialForm(nextForm);
      } catch (loadError) {
        if (!ignore) {
          setError(loadError.message || "No fue posible cargar la informacion de tu cuenta.");
        }
      } finally {
        if (!ignore) {
          setLoadingCustomer(false);
        }
      }
    };

    loadCustomer();

    return () => {
      ignore = true;
    };
  }, [isOpen, user, isClient]);

  useEffect(() => {
    if (!isOpen || isEmployee) return;

    let ignore = false;

    const loadDepartments = async () => {
      setLoadingDepartments(true);
      try {
        const response = await authFetch(`${API_BASE_URL}/departments`);
        const payload = response.ok ? await response.json().catch(() => []) : [];
        if (!ignore) {
          setDepartments(extractList(payload));
        }
      } catch {
        if (!ignore) {
          setDepartments([]);
        }
      } finally {
        if (!ignore) {
          setLoadingDepartments(false);
        }
      }
    };

    loadDepartments();

    return () => {
      ignore = true;
    };
  }, [isOpen, isEmployee]);

  useEffect(() => {
    if (!isOpen || !formData.id_departamento || isEmployee) {
      setMunicipalities([]);
      return;
    }

    let ignore = false;

    const loadMunicipalities = async () => {
      setLoadingMunicipalities(true);
      try {
        const response = await authFetch(
          `${API_BASE_URL}/municipalities/department/${formData.id_departamento}`
        );
        const payload = response.ok ? await response.json().catch(() => []) : [];
        if (!ignore) {
          setMunicipalities(extractList(payload));
        }
      } catch {
        if (!ignore) {
          setMunicipalities([]);
        }
      } finally {
        if (!ignore) {
          setLoadingMunicipalities(false);
        }
      }
    };

    loadMunicipalities();

    return () => {
      ignore = true;
    };
  }, [formData.id_departamento, isOpen, isEmployee]);

  const updateField = (field, value) => {
    setError("");
    setFormData((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "id_departamento" ? { municipio_id: "" } : {}),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitDisabled) return;

    setError("");

    // Validate fields on submit
    if (isClient) {
      if (
        !formData.razon_social.trim() ||
        !formData.telefono.trim() ||
        !formData.direccion.trim() ||
        !formData.id_departamento ||
        !formData.municipio_id
      ) {
        setError("Todos los campos marcados como requeridos deben ser completados.");
        toast.error("Campos vacíos", {
          description: "Por favor, completa todos los campos requeridos.",
        });
        return;
      }
    } else {
      if (!formData.razon_social.trim()) {
        setError("El nombre o razón social no puede estar vacío.");
        toast.error("Campo vacío", {
          description: "Por favor, ingresa tu nombre o razón social.",
        });
        return;
      }
    }

    setSaving(true);

    try {
      let response;
      if (isClient) {
        const payload = {
          razonSocial: formData.razon_social.trim(),
          razon_social: formData.razon_social.trim(),
          telefono: formData.telefono.trim(),
          direccion: formData.direccion.trim(),
          idMunicipio: Number.parseInt(formData.municipio_id, 10),
          municipio_id: Number.parseInt(formData.municipio_id, 10),
        };
        response = await authFetch(`${API_BASE_URL}/customers/${customerId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        const payload = {
          nombre: formData.razon_social.trim(),
          nombreUsuario: formData.razon_social.trim(),
          email: formData.email,
          telefono: formData.telefono.trim(),
          direccion: formData.direccion.trim(),
        };
        const userId = user?.idUsuario || user?.id || customerId;
        response = await authFetch(`${API_BASE_URL}/users/${userId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      }

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.message || result.error || "No se pudo actualizar tu perfil.");
      }

      const savedEntity = unwrapEntity(result);
      const nextForm = buildFormFromCustomer(savedEntity);
      setFormData(nextForm);
      setInitialForm(nextForm);
      setToastConfig({
        visible: true,
        title: "Datos actualizados",
        message: "Tu información personal se guardó correctamente.",
        type: "success",
      });
      setTimeout(() => {
        setToastConfig((prev) => ({ ...prev, visible: false }));
        onClose();
      }, 2000);
    } catch (submitError) {
      const message = submitError.message || "No se pudo actualizar tu perfil.";
      setError(message);
      setToastConfig({
        visible: true,
        title: "No se pudo guardar",
        message: message,
        type: "error",
      });
      setTimeout(() => {
        setToastConfig((prev) => ({ ...prev, visible: false }));
      }, 4000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <SuccessToast
        {...toastConfig}
        onClose={() => setToastConfig((prev) => ({ ...prev, visible: false }))}
      />
      <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[680px] max-h-[90vh] flex flex-col overflow-hidden rounded-[28px] border border-slate-200/70 bg-white p-0 gap-0 shadow-[0_24px_80px_rgba(15,23,42,0.16)] [&>button]:right-5 [&>button]:top-5 [&>button]:rounded-full [&>button]:bg-white [&>button]:p-1.5 [&>button]:text-slate-400 [&>button]:shadow-sm [&>button]:shadow-slate-200/80 [&>button]:ring-0 [&>button:hover]:bg-slate-50 [&>button:hover]:text-slate-600 [&>button[data-state=open]]:bg-white">
        <div className="bg-white shrink-0">
          <DialogHeader className="bg-gradient-to-b from-slate-50/80 to-white px-6 md:px-8 pt-6 md:pt-8 pb-4 md:pb-6">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              {isClient ? "Perfil de cliente" : `Perfil de ${roleName}`}
            </div>
            <DialogTitle className="mt-4 text-[1.4rem] md:text-[1.65rem] font-semibold tracking-[-0.02em] text-slate-950">
              {isClient ? "Ajustes de Cuenta" : "Perfil de Empleado"}
            </DialogTitle>
            <p className="mt-2 max-w-2xl text-xs md:text-sm leading-5 md:leading-6 text-slate-500">
              {isClient
                ? "Actualiza la informacion personal asociada a tu cuenta de cliente en MSG Repuestos."
                : `Actualiza la informacion personal asociada a tu cuenta de ${roleName.toLowerCase()} en MSG Repuestos.`}
            </p>
          </DialogHeader>
        </div>

        <form className="bg-white px-6 md:px-8 pb-6 md:pb-8 pt-2 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-200" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <label className="space-y-2 text-sm font-semibold text-slate-700">
              Tipo de documento
              <input
                value={getDocumentTypeLabel(formData.id_tipo_documento)}
                readOnly
                disabled
                className={READONLY_INPUT_CLASS.replace("pl-11", "pl-4")}
                aria-label="Tipo de documento"
              />
            </label>

            <label className="space-y-2 text-sm font-semibold text-slate-700">
              Numero de documento
              <input
                value={formData.numero_documento}
                readOnly
                disabled
                className={READONLY_INPUT_CLASS.replace("pl-11", "pl-4")}
              />
            </label>

            <label className="space-y-2 text-sm font-semibold text-slate-700 md:col-span-2">
              Correo electronico
              <div className={FIELD_WRAPPER_CLASS}>
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-600" />
                <input
                  value={formData.email}
                  readOnly
                  disabled
                  className={READONLY_INPUT_CLASS}
                />
              </div>
            </label>

            <label className="space-y-2 text-sm font-semibold text-slate-700 md:col-span-2">
              Razon social / nombre completo
              <div className={FIELD_WRAPPER_CLASS}>
                <Building2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-600" />
                <input
                  value={formData.razon_social}
                  onChange={(event) => updateField("razon_social", event.target.value)}
                  className={EDITABLE_INPUT_CLASS}
                  placeholder="Ingresa tu razon social o nombre completo"
                  required
                />
              </div>
            </label>

            <label className="space-y-2 text-sm font-semibold text-slate-700">
              Telefono
              <div className={FIELD_WRAPPER_CLASS}>
                <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-600" />
                <input
                  value={formData.telefono}
                  onChange={(event) => updateField("telefono", event.target.value)}
                  className={EDITABLE_INPUT_CLASS}
                  placeholder="Ingresa tu telefono de contacto"
                  required
                />
              </div>
            </label>

            <label className="space-y-2 text-sm font-semibold text-slate-700">
              Departamento
              <select
                value={formData.id_departamento}
                onChange={(event) => updateField("id_departamento", event.target.value)}
                disabled={loadingDepartments}
                className={SELECT_CLASS}
                required
              >
                <option value="">
                  {loadingDepartments ? "Cargando departamentos..." : "Seleccionar..."}
                </option>
                {departments.map((department) => {
                  const value = String(
                    department.id ?? department.idDepartamento ?? department.id_departamento ?? ""
                  );
                  return (
                    <option key={value} value={value}>
                      {department.name || department.nombre || department.nombreDepartamento}
                    </option>
                  );
                })}
              </select>
            </label>

            <label className="space-y-2 text-sm font-semibold text-slate-700 md:col-span-2">
              Direccion
              <div className={FIELD_WRAPPER_CLASS}>
                <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-600" />
                <input
                  value={formData.direccion}
                  onChange={(event) => updateField("direccion", event.target.value)}
                  className={EDITABLE_INPUT_CLASS}
                  placeholder="Ingresa tu direccion"
                  required
                />
              </div>
            </label>

            <label className="space-y-2 text-sm font-semibold text-slate-700 md:col-span-2">
              Municipio
              <select
                value={formData.municipio_id}
                onChange={(event) => updateField("municipio_id", event.target.value)}
                disabled={!formData.id_departamento || loadingMunicipalities}
                className={SELECT_CLASS}
                required
              >
                <option value="">
                  {!formData.id_departamento
                    ? "Selecciona un departamento"
                    : loadingMunicipalities
                      ? "Cargando municipios..."
                      : "Seleccionar..."}
                </option>
                {municipalities.map((municipality) => {
                  const value = String(
                    municipality.id ?? municipality.idMunicipio ?? municipality.id_municipio ?? ""
                  );
                  return (
                    <option key={value} value={value}>
                      {municipality.name || municipality.nombre || municipality.nombreMunicipio}
                    </option>
                  );
                })}
              </select>
            </label>
          </div>

          {error && (
            <div className="mt-5 rounded-2xl border border-red-100 bg-red-50/80 px-4 py-3 text-sm font-medium text-red-600">
              {error}
            </div>
          )}

          <div className="mt-7 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 rounded-2xl bg-slate-50/70 p-4">
            <p className="text-[11px] md:text-xs leading-4 md:leading-5 text-slate-500 text-center sm:text-left">
              Tu documento y correo institucional permanecen protegidos para conservar la integridad de tu cuenta.
            </p>
            <button
              type="submit"
              disabled={isSubmitDisabled}
              className="inline-flex h-12 w-full sm:w-auto shrink-0 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(16,185,129,0.22)] transition-all hover:bg-emerald-700 disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none"
            >
              <Save className="h-4 w-4" />
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
    </>
  );
}
