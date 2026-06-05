import React, { useState, useEffect, useRef } from "react";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { Separator } from "../../../components/ui/separator";
import { UserPlus, CreditCard, MapPin, UserCog } from "lucide-react";

export function CustomerForm({
  formData,
  onChange,
  onValidityChange,
  isEditing = false,
  zonas = [],
  departments = [],
  authFetch,
  canEditIdentity = false,
}) {
  const [municipalities, setMunicipalities] = useState([]);
  const [loadingMunicipalities, setLoadingMunicipalities] = useState(false);
  // ✅ Guardamos el idMunicipio pendiente mientras la lista no ha cargado aún
  const pendingMunicipio = useRef(null);

  // ── Carga municipios cuando cambia el departamento ───────────────────────
  useEffect(() => {
    if (!formData.idDepartamento) {
      setMunicipalities([]);
      return;
    }

    // ✅ Guardamos el municipio actual ANTES de limpiar la lista
    if (formData.idMunicipio) {
      pendingMunicipio.current = formData.idMunicipio.toString();
    }

    setLoadingMunicipalities(true);
    authFetch(`/api/municipalities/department/${formData.idDepartamento}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        const list = Array.isArray(data) ? data : data.data || [];
        setMunicipalities(list);

        // ✅ Una vez cargada la lista, verificamos si el municipio pendiente existe en ella
        // Si existe, no hacemos nada (el Select ya lo mostrará con el value que tiene formData)
        // Si NO existe (cambio de depto manual), limpiamos idMunicipio
        if (pendingMunicipio.current) {
          const exists = list.some(
            (m) =>
              (m.id || m.idMunicipio || m.id_municipio).toString() ===
              pendingMunicipio.current,
          );
          if (!exists) {
            // El municipio guardado no pertenece a este departamento → limpiar
            onChange({ ...formData, idMunicipio: "" });
          }
          pendingMunicipio.current = null;
        }
      })
      .catch(console.error)
      .finally(() => setLoadingMunicipalities(false));

    // ⚠️ Solo reacciona a cambios de idDepartamento, NO de formData completo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.idDepartamento, authFetch]);

  // ── Validación ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (onValidityChange) {
      const isValid =
        (formData.razonSocial || "").trim() !== "" &&
        !!formData.idTipoDocumento &&
        (formData.numeroDocumento || "").trim() !== "" &&
        (formData.telefono || "").trim() !== "" &&
        !!formData.tipoCliente;
      onValidityChange(isValid);
    }
  }, [formData, onValidityChange]);

  const handleChange = (field, value) => {
    onChange({ ...formData, [field]: value });
  };
  const identityReadOnly = isEditing && !canEditIdentity;

  return (
    <div className="space-y-6 py-2 px-2">
      {/* ── SECCIÓN 1: Identificación ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] uppercase tracking-wider">
          {isEditing ? <UserCog size={16} /> : <UserPlus size={16} />}{" "}
          Identificación Legal
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5 font-medium md:col-span-2">
            <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
              Razón Social / Nombre Completo{" "}
              <span className="text-emerald-500">*</span>
            </Label>
            <Input
              value={formData.razonSocial || ""}
              onChange={(e) => handleChange("razonSocial", e.target.value)}
              placeholder="Ej: Repuestos y Accesorios S.A.S."
              className="h-[42px] rounded-xl border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus-visible:ring-emerald-500 dark:focus-visible:ring-emerald-400"
            />
          </div>
          <div className="space-y-1.5 font-medium md:col-span-1">
            <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
              Tipo de Documento <span className="text-emerald-500">*</span>
            </Label>
            {identityReadOnly ? (
              <Input
                value={
                  formData.idTipoDocumento === "1"
                    ? "C.C."
                    : formData.idTipoDocumento === "2"
                      ? "NIT"
                      : "C.E."
                }
                readOnly
                disabled
                className="h-[42px] rounded-xl border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 cursor-not-allowed"
              />
            ) : (
              <Select
                value={formData.idTipoDocumento?.toString() || ""}
                onValueChange={(v) => handleChange("idTipoDocumento", v)}
              >
                <SelectTrigger className="h-[42px] rounded-xl border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white">
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 dark:border-zinc-800 max-h-60 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">
                  <SelectItem value="1">C.C. — Cédula de Ciudadanía</SelectItem>
                  <SelectItem value="2">
                    NIT — Número de Identificación Tributaria
                  </SelectItem>
                  <SelectItem value="3">
                    C.E. — Cédula de Extranjería
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="space-y-1.5 font-medium md:col-span-1">
            <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex justify-between items-center">
              <span>
                Número de Documento <span className="text-emerald-500">*</span>
              </span>
              {(formData.numeroDocumento?.length >= 15) && !identityReadOnly && (
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-1.5 py-0.5 rounded-md border border-amber-100 dark:border-amber-900/30 animate-in fade-in zoom-in duration-200">
                  Máx. 15 caracteres
                </span>
              )}
            </Label>
            <Input
              value={formData.numeroDocumento || ""}
              onChange={(e) =>
                !identityReadOnly &&
                handleChange("numeroDocumento", e.target.value)
              }
              placeholder="Ej: 1020304050"
              readOnly={identityReadOnly}
              maxLength={15}
              className={`h-[42px] rounded-xl focus-visible:ring-emerald-500 dark:focus-visible:ring-emerald-400 transition-colors bg-white dark:bg-zinc-800 text-slate-900 dark:text-white ${
                (formData.numeroDocumento?.length >= 15) && !identityReadOnly
                  ? "border-amber-400 focus-visible:ring-amber-400 dark:border-amber-500 dark:focus-visible:ring-amber-500"
                  : "border-slate-200 dark:border-zinc-700"
              } ${
                identityReadOnly
                  ? "bg-slate-50 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 cursor-not-allowed border-slate-100 dark:border-zinc-800"
                  : ""
              }`}
            />
          </div>
        </div>
      </div>

      <Separator className="bg-slate-100 dark:bg-zinc-800" />

      {/* ── SECCIÓN 2: Contacto y Ubicación ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-slate-400 dark:text-zinc-500 font-bold text-[11px] uppercase tracking-widest">
          <MapPin size={16} /> Contacto y Ubicación
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="space-y-1.5 font-medium">
            <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
              Persona de Contacto
            </Label>
            <Input
              value={formData.personaContacto || ""}
              onChange={(e) => handleChange("personaContacto", e.target.value)}
              placeholder="Ej: Juan Pérez"
              className="h-[42px] rounded-xl border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus-visible:ring-emerald-500 dark:focus-visible:ring-emerald-400"
            />
          </div>
          <div className="space-y-1.5 font-medium">
            <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
              Correo Electrónico
            </Label>
            <Input
              type="email"
              value={formData.email || ""}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="contacto@empresa.com"
              className="h-[42px] rounded-xl border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus-visible:ring-emerald-500 dark:focus-visible:ring-emerald-400"
            />
          </div>
          <div className="space-y-1.5 font-medium">
            <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex justify-between items-center">
              <span>
                Teléfono <span className="text-emerald-500">*</span>
              </span>
              {(formData.telefono?.length >= 16) && (
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-1.5 py-0.5 rounded-md border border-amber-100 dark:border-amber-900/30 animate-in fade-in zoom-in duration-200">
                  Máx. 16 caracteres
                </span>
              )}
            </Label>
            <Input
              value={formData.telefono || ""}
              onChange={(e) => handleChange("telefono", e.target.value)}
              placeholder="Ej: 3159876543"
              maxLength={16}
              className={`h-[42px] rounded-xl focus-visible:ring-emerald-500 dark:focus-visible:ring-emerald-400 transition-colors bg-white dark:bg-zinc-800 text-slate-900 dark:text-white ${
                (formData.telefono?.length >= 16)
                  ? "border-amber-400 focus-visible:ring-amber-400 dark:border-amber-500 dark:focus-visible:ring-amber-500"
                  : "border-slate-200 dark:border-zinc-700"
              }`}
            />
          </div>
          <div className="space-y-1.5 font-medium md:col-span-3">
            <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
              Dirección Residencial/Comercial
            </Label>
            <Input
              value={formData.direccion || ""}
              onChange={(e) => handleChange("direccion", e.target.value)}
              placeholder="Ej: Calle 45 # 12 - 30, Barrio Central"
              className="h-[42px] rounded-xl border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus-visible:ring-emerald-500 dark:focus-visible:ring-emerald-400"
            />
          </div>

          {/* ── Departamento ── */}
          <div className="space-y-1.5 font-medium">
            <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
              Departamento
            </Label>
            <Select
              value={formData.idDepartamento?.toString() || ""}
              onValueChange={(value) => {
                // ✅ Al cambiar depto manualmente, limpiamos municipio
                // pendingMunicipio.current queda null para que el useEffect lo limpie
                pendingMunicipio.current = null;
                onChange({
                  ...formData,
                  idDepartamento: value,
                  idMunicipio: "",
                });
              }}
            >
              <SelectTrigger className="h-[42px] rounded-xl border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white">
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 dark:border-zinc-800 max-h-60 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">
                {departments.map((d) => {
                  const val = (
                    d.id ||
                    d.idDepartamento ||
                    d.id_departamento
                  ).toString();
                  return (
                    <SelectItem key={val} value={val}>
                      {d.name ||
                        d.nombre ||
                        d.nombreDepartamento ||
                        d.nombre_departamento}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* ── Municipio ── */}
          <div className="space-y-1.5 font-medium md:col-span-2">
            <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
              Municipio / Ciudad
            </Label>
            <Select
              // ✅ key fuerza re-mount del Select cuando la lista de municipios cambia,
              // garantizando que Radix muestre el valor correcto aunque llegue después
              key={`muni-${formData.idDepartamento}-${municipalities.length}`}
              value={formData.idMunicipio?.toString() || ""}
              onValueChange={(v) => handleChange("idMunicipio", v)}
              disabled={!formData.idDepartamento || loadingMunicipalities}
            >
              <SelectTrigger className="h-[42px] rounded-xl border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white">
                <SelectValue
                  placeholder={
                    !formData.idDepartamento
                      ? "Selecciona un departamento primero"
                      : loadingMunicipalities
                        ? "Cargando..."
                        : "Seleccionar..."
                  }
                />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 dark:border-zinc-800 max-h-60 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">
                {municipalities.map((m) => {
                  const val = (
                    m.id ||
                    m.idMunicipio ||
                    m.id_municipio
                  ).toString();
                  return (
                    <SelectItem key={val} value={val}>
                      {m.name ||
                        m.nombre ||
                        m.nombreMunicipio ||
                        m.nombre_municipio}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator className="bg-slate-100 dark:bg-zinc-800" />

      {/* ── SECCIÓN 3: Información Comercial ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-slate-400 dark:text-zinc-500 font-bold text-[11px] uppercase tracking-widest">
          <CreditCard size={16} /> Información Comercial
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="space-y-1.5 font-medium">
            <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
              Segmento de Cliente <span className="text-emerald-500">*</span>
            </Label>
            <Select
              value={formData.tipoCliente || ""}
              onValueChange={(v) => handleChange("tipoCliente", v)}
            >
              <SelectTrigger className="h-[42px] rounded-xl border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white">
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 dark:border-zinc-800 max-h-60 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">
                <SelectItem value="Mayorista">Mayorista</SelectItem>
                <SelectItem value="Minorista">Minorista</SelectItem>
                <SelectItem value="Consumidor Final">Consumidor Final</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 font-medium">
            <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
              Zona de Despacho
            </Label>
            <Select
              value={formData.idZona?.toString() || ""}
              onValueChange={(v) => handleChange("idZona", v)}
            >
              <SelectTrigger className="h-[42px] rounded-xl border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white">
                <SelectValue placeholder="Seleccionar zona..." />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 dark:border-zinc-800 max-h-60 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">
                {zonas.map((z) => (
                  <SelectItem key={z.idZona} value={z.idZona.toString()}>
                    {z.nombreZona}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 font-medium">
            <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
              Cupo de Crédito (COP)
            </Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={formData.cupoCredito || ""}
              onChange={(e) => handleChange("cupoCredito", e.target.value)}
              placeholder="Ej: 5500.50"
              className="h-[42px] rounded-xl border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus-visible:ring-emerald-500 dark:focus-visible:ring-emerald-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
