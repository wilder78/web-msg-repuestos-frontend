import React, { useState, useEffect } from "react";
import {
  Building2,
  Mail,
  Phone,
  IdCard,
  MapPin,
  UserCircle,
  FileText,
} from "lucide-react";
import { FormField } from "../../../components/shared/FormInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";

export function SupplierForm({
  formData,
  onChange,
  onValidityChange, // ✅ nueva prop
  isEditing = false,
  canEditIdentity = false,
}) {
  const [departments, setDepartments] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);
  const [loadingMunicipalities, setLoadingMunicipalities] = useState(false);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState(
    formData.id_departamento ? formData.id_departamento.toString() : "",
  );

  const getHeaders = () => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    fetch("/api/departments", { headers: getHeaders() })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) =>
        setDepartments(Array.isArray(data) ? data : data.data || []),
      )
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (formData.id_departamento) {
      setSelectedDepartmentId(formData.id_departamento.toString());
    }
  }, [formData.id_departamento]);

  useEffect(() => {
    if (!selectedDepartmentId) {
      setMunicipalities([]);
      return;
    }
    setLoadingMunicipalities(true);
    fetch(`/api/municipalities/department/${selectedDepartmentId}`, {
      headers: getHeaders(),
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) =>
        setMunicipalities(Array.isArray(data) ? data : data.data || []),
      )
      .catch(console.error)
      .finally(() => setLoadingMunicipalities(false));
  }, [selectedDepartmentId]);

  // ✅ Valida campos obligatorios y notifica al padre
  useEffect(() => {
    if (!onValidityChange) return;

    const isValid =
      (formData.nombre_empresa || "").trim().length > 0 &&
      formData.id_tipo_documento &&
      (formData.numero_documento || "").trim().length > 0 &&
      (formData.contacto || "").trim().length > 0 &&
      (formData.telefono || "").trim().length > 0 &&
      (formData.email || "").trim().length > 0 &&
      (formData.direccion || "").trim().length > 0 &&
      (formData.id_departamento || "").toString().length > 0 &&
      (formData.id_municipio || "").toString().length > 0;

    onValidityChange(Boolean(isValid));
  }, [formData, onValidityChange]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onChange({ ...formData, [name]: value });
  };

  const handleSelectChange = (name, value) => {
    onChange({ ...formData, [name]: value });
  };
  const identityReadOnly = isEditing && !canEditIdentity;

  return (
    // ✅ Sin onSubmit ni id — el botón de BaseFormModal maneja el click
    <form
      className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4"
      onSubmit={(e) => e.preventDefault()}
    >
      <FormField
        className="md:col-span-2"
        label="Nombre de la Empresa / Razón Social"
        icon={Building2}
        name="nombre_empresa"
        value={formData.nombre_empresa || ""}
        onChange={handleInputChange}
        placeholder="Ej: Repuestos Industriales S.A.S"
        required
      />

      <FormField label="Tipo de Documento" required>
        <Select
          value={formData.id_tipo_documento?.toString()}
          onValueChange={(val) =>
            handleSelectChange("id_tipo_documento", parseInt(val))
          }
          disabled={identityReadOnly}
        >
          <SelectTrigger
            className={`bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white ${identityReadOnly ? "opacity-70 cursor-not-allowed" : ""}`}
          >
            <SelectValue placeholder="Seleccionar" />
          </SelectTrigger>
          <SelectContent className="max-h-60 rounded-xl border-slate-200 dark:border-zinc-800">
            <SelectItem value="1">Cédula de Ciudadanía</SelectItem>
            <SelectItem value="2">NIT</SelectItem>
            <SelectItem value="3">Cédula de Extranjería</SelectItem>
          </SelectContent>
        </Select>
      </FormField>

      <div className="space-y-2 w-full">
        <Label className="text-slate-700 dark:text-zinc-350 font-bold flex justify-between items-center">
          <div className="flex items-center gap-1">
            N° de Documento (NIT/RUT) <span className="text-emerald-500">*</span>
          </div>
          {(formData.numero_documento?.length >= 15) && !identityReadOnly && (
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-1.5 py-0.5 rounded-md border border-amber-100 dark:border-amber-900/30 animate-in fade-in zoom-in duration-200">
              Máx. 15 caracteres
            </span>
          )}
        </Label>
        <div className="relative group flex items-center w-full">
          <IdCard className="absolute left-3 text-slate-400 transition-colors group-focus-within:text-emerald-600 z-10" size={16} />
          <Input
            name="numero_documento"
            value={formData.numero_documento || ""}
            onChange={handleInputChange}
            disabled={identityReadOnly}
            placeholder="Ej: 900123456-7"
            maxLength={15}
            className={`w-full h-11 pl-10 pr-4 bg-slate-50 dark:bg-zinc-800 rounded-xl focus-visible:ring-emerald-500 dark:focus-visible:ring-emerald-400 text-slate-900 dark:text-white transition-colors ${
              (formData.numero_documento?.length >= 15) && !identityReadOnly
                ? "border-amber-400 focus-visible:ring-amber-400 dark:border-amber-500 dark:focus-visible:ring-amber-500"
                : "border-slate-200 dark:border-zinc-700"
            }`}
          />
        </div>
      </div>

      <FormField
        label="Persona de Contacto"
        icon={UserCircle}
        name="contacto"
        value={formData.contacto || ""}
        onChange={handleInputChange}
        placeholder="Ej: Juan Pérez"
        required
      />

      <div className="space-y-2 w-full">
        <Label className="text-slate-700 dark:text-zinc-350 font-bold flex justify-between items-center">
          <div className="flex items-center gap-1">
            Teléfono de Contacto <span className="text-emerald-500">*</span>
          </div>
          {(formData.telefono?.length >= 16) && (
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-1.5 py-0.5 rounded-md border border-amber-100 dark:border-amber-900/30 animate-in fade-in zoom-in duration-200">
              Máx. 16 caracteres
            </span>
          )}
        </Label>
        <div className="relative group flex items-center w-full">
          <Phone className="absolute left-3 text-slate-400 transition-colors group-focus-within:text-emerald-600 z-10" size={16} />
          <Input
            name="telefono"
            value={formData.telefono || ""}
            onChange={handleInputChange}
            placeholder="Ej: 3001234567"
            maxLength={16}
            className={`w-full h-11 pl-10 pr-4 bg-slate-50 dark:bg-zinc-800 rounded-xl focus-visible:ring-emerald-500 dark:focus-visible:ring-emerald-400 text-slate-900 dark:text-white transition-colors ${
              (formData.telefono?.length >= 16)
                ? "border-amber-400 focus-visible:ring-amber-400 dark:border-amber-500 dark:focus-visible:ring-amber-500"
                : "border-slate-200 dark:border-zinc-700"
            }`}
          />
        </div>
      </div>

      <FormField
        label="Correo Electrónico"
        icon={Mail}
        type="email"
        name="email"
        value={formData.email || ""}
        onChange={handleInputChange}
        placeholder="Ej: ventas@empresa.com"
        required
      />

      <FormField
        className="md:col-span-2"
        label="Dirección"
        icon={MapPin}
        name="direccion"
        value={formData.direccion || ""}
        onChange={handleInputChange}
        placeholder="Ej: Carrera 28 sur # 92 A - 56"
        required
      />

      <FormField label="Departamento" required>
        <Select
          value={selectedDepartmentId || undefined}
          onValueChange={(val) => {
            setSelectedDepartmentId(val);
            onChange({ ...formData, id_departamento: val, id_municipio: "" });
          }}
        >
          <SelectTrigger className="bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white">
            <SelectValue placeholder="Seleccionar..." />
          </SelectTrigger>
          <SelectContent className="max-h-60 rounded-xl border-slate-200 dark:border-zinc-850">
            {departments.map((d) => (
              <SelectItem key={d.id} value={d.id.toString()}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <FormField label="Municipio / Ciudad" required>
        <Select
          value={
            formData.id_municipio ? formData.id_municipio.toString() : undefined
          }
          onValueChange={(val) => handleSelectChange("id_municipio", val)}
          disabled={!selectedDepartmentId || loadingMunicipalities}
        >
          <SelectTrigger className="bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white">
            <SelectValue
              placeholder={
                !selectedDepartmentId
                  ? "Selecciona un departamento primero"
                  : loadingMunicipalities
                    ? "Cargando..."
                    : "Seleccionar..."
              }
            />
          </SelectTrigger>
          <SelectContent className="max-h-60 rounded-xl border-slate-200 dark:border-zinc-850">
            {municipalities.map((m) => (
              <SelectItem key={m.id} value={m.id.toString()}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <FormField
        className="md:col-span-2"
        label="Condiciones Comerciales"
        icon={FileText}
        name="condiciones_comerciales"
        value={formData.condiciones_comerciales || ""}
        onChange={handleInputChange}
        placeholder="Ej: Pago a 30 días, descuento del 5% por pronto pago."
        isTextarea
      />
    </form>
  );
}
