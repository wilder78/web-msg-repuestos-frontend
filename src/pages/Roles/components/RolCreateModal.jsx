import React, { useState, useEffect, useCallback } from "react";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import {
  ShieldCheck,
  Loader2,
  Check,
  Minus,
  ChevronDown,
  ChevronUp,
  Palette,
  CheckCircle2,
} from "lucide-react";
import { BaseFormModal } from "../../../components/shared/BaseFormModal";

// --- Helpers ---
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

const groupPermissionsByModule = (permissions) => {
  if (!permissions) return {};
  return permissions.reduce((acc, perm) => {
    const nombre = perm.nombre || "";
    const module =
      perm.modulo ||
      perm.module ||
      (nombre.includes("_") ? nombre.split("_")[0] : "General");
    if (!acc[module]) acc[module] = [];
    acc[module].push(perm);
    return acc;
  }, {});
};

const COLOR_OPTIONS = [
  { label: "Esmeralda", value: "bg-emerald-500", hex: "#10b981" },
  { label: "Azul", value: "bg-blue-500", hex: "#3b82f6" },
  { label: "Rojo", value: "bg-red-500", hex: "#ef4444" },
  { label: "Ámbar", value: "bg-amber-500", hex: "#f59e0b" },
  { label: "Violeta", value: "bg-violet-500", hex: "#8b5cf6" },
  { label: "Rosa", value: "bg-rose-500", hex: "#f43f5e" },
  { label: "Cian", value: "bg-cyan-500", hex: "#06b6d4" },
  { label: "Slate", value: "bg-slate-400", hex: "#94a3b8" },
];

// --- Sub-componente PermissionGroup ---
const PermissionGroup = ({
  moduleName,
  permissions,
  selectedIds,
  onToggle,
  onToggleAll,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const selectedCount = permissions.filter((p) =>
    selectedIds.includes(p.idPermiso || p.id),
  ).length;
  const allSelected = selectedCount === permissions.length;
  const someSelected = selectedCount > 0 && !allSelected;

  const handleMasterToggle = (e) => {
    e.stopPropagation();
    const permIds = permissions.map((p) => p.idPermiso || p.id);
    onToggleAll(permIds, !allSelected);
  };

  return (
    <div className="border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-shadow duration-200 mb-3">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-5 py-3 bg-gradient-to-r from-slate-50 to-white hover:from-slate-100 hover:to-slate-50 dark:from-zinc-950 dark:to-zinc-900 dark:hover:from-zinc-900 dark:hover:to-zinc-855 transition-all duration-200"
      >
        <div className="flex items-center gap-3">
          <div
            onClick={handleMasterToggle}
            className={`h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer ${
              allSelected
                ? "bg-emerald-500 border-emerald-500 animate-in fade-in zoom-in-50 duration-200"
                : someSelected
                  ? "bg-amber-450 border-amber-450"
                  : "border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-emerald-450"
            }`}
          >
            {allSelected && <Check className="h-2.5 w-2.5 text-white" />}
            {someSelected && <Minus className="h-2.5 w-2.5 text-white" />}
          </div>
          <div className="p-1.5 bg-emerald-100 dark:bg-emerald-950/30 rounded-lg">
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-left">
            <span className="font-semibold text-slate-700 dark:text-zinc-200 capitalize text-sm">
              {moduleName}
            </span>
            <span className="ml-2 text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 px-2 py-0.5 rounded-full font-medium border border-emerald-200 dark:border-emerald-900/50">
              {selectedCount}/{permissions.length}
            </span>
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-slate-400 dark:text-zinc-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-400 dark:text-zinc-500" />
        )}
      </button>

      {isOpen && (
        <div className="divide-y divide-slate-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
          {permissions.map((perm) => {
            const permId = perm.idPermiso || perm.id;
            const isSelected = selectedIds.includes(permId);
            return (
              <div
                key={permId}
                onClick={() => onToggle(permId)}
                className="flex items-start gap-3 px-5 py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-850/50 transition-colors duration-150"
              >
                <div
                  className={`mt-0.5 h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                    isSelected
                      ? "bg-emerald-500 border-emerald-500 animate-in fade-in zoom-in-50 duration-200"
                      : "border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-855 hover:border-emerald-455"
                  }`}
                >
                  {isSelected && <Check className="h-2.5 w-2.5 text-white" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700 dark:text-zinc-200">
                    {perm.nombre || perm.name}
                  </p>
                  {(perm.descripcion || perm.description) && (
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                      {perm.descripcion || perm.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// --- Componente Principal Adaptado ---
const RolCreateModal = ({ isOpen, onClose, onRolCreated, onRolError }) => {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);
  const [selectedPermIds, setSelectedPermIds] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  const [loadingPerms, setLoadingPerms] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  const fetchPermissions = useCallback(async () => {
    setLoadingPerms(true);
    try {
      const res = await authFetch("/api/permissions");
      if (!res.ok) throw new Error("Error al obtener permisos");
      const data = await res.json();
      setAllPermissions(data.data || data.permissions || data || []);
    } catch (err) {
      console.error("Error cargando permisos:", err);
    } finally {
      setLoadingPerms(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchPermissions();
      setNombre("");
      setDescripcion("");
      setSelectedColor(COLOR_OPTIONS[0]);
      setSelectedPermIds([]);
      setErrors({});
      setSaveSuccess(false);
    }
  }, [isOpen, fetchPermissions]);

  const handleTogglePerm = (permId) => {
    setSelectedPermIds((prev) =>
      prev.includes(permId)
        ? prev.filter((id) => id !== permId)
        : [...prev, permId],
    );
  };

  const handleToggleAll = (permIds, select) => {
    setSelectedPermIds((prev) => {
      if (select) {
        const updated = new Set(prev);
        permIds.forEach((id) => updated.add(id));
        return [...updated];
      } else {
        const removeSet = new Set(permIds);
        return prev.filter((id) => !removeSet.has(id));
      }
    });
  };

  const handleSubmit = async () => {
    if (!nombre.trim()) {
      setErrors({ nombre: "El nombre del rol es obligatorio" });
      return;
    }

    setIsSaving(true);
    setErrors({});

    try {
      const rolPayload = {
        nombreRol: nombre.trim(),
        descripcion: descripcion.trim(),
        idEstado: 1,
      };

      const rolRes = await authFetch("/api/roles", {
        method: "POST",
        body: JSON.stringify(rolPayload),
      });

      const rolData = await rolRes.json();
      if (!rolRes.ok)
        throw new Error(rolData.error || rolData.message || "Error al crear el rol");

      const nuevoRolId =
        rolData.idRol ||
        rolData.id ||
        (rolData.data && (rolData.data.idRol || rolData.data.id));
      if (!nuevoRolId) throw new Error("Rol creado, pero no se recibió el ID.");

      if (selectedPermIds.length > 0) {
        for (const permId of selectedPermIds) {
          await authFetch("/api/role-permissions/assign", {
            method: "POST",
            body: JSON.stringify({
              idRol: Number(nuevoRolId),
              idPermiso: Number(permId),
            }),
          });
        }
      }

      setSaveSuccess(true);

      const nombreFinal = nombre.trim();

      setTimeout(() => {
        onClose();
        if (onRolCreated) onRolCreated(nombreFinal);
      }, 700);
    } catch (err) {
      setErrors({ submit: err.message });
      if (onRolError) onRolError(err.message);
      setSaveSuccess(false);
    } finally {
      setIsSaving(false);
    }
  };

  const groupedPermissions = groupPermissionsByModule(allPermissions);
  const totalSelected = selectedPermIds.length;

  return (
    <BaseFormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Crear Nuevo Rol"
      subtitle="Define un nuevo rol con permisos específicos en el sistema"
      icon={ShieldCheck}
      loading={isSaving}
      saveSuccess={saveSuccess}
      isSubmitDisabled={!nombre.trim()}
      onSubmit={handleSubmit}
    >
      <div className="space-y-6">
        {/* Nombre y Color */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-5 items-start">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
              Nombre del Rol <span className="text-emerald-500">*</span>
            </label>
            <Input
              placeholder="Ej: Supervisor de Ventas"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className={`h-[42px] rounded-xl border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus-visible:ring-emerald-500 ${errors.nombre ? "border-red-400 dark:border-red-500" : ""}`}
            />
            {errors.nombre && (
              <p className="text-[11px] text-red-500 dark:text-red-400">{errors.nombre}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Palette className="h-3 w-3 text-slate-400 dark:text-zinc-500" /> Color de
              Identificación
            </label>
            <div className="flex gap-1.5 flex-wrap max-w-[150px] p-1 bg-slate-50 dark:bg-zinc-950 rounded-lg border border-slate-100 dark:border-zinc-850">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  title={color.label}
                  onClick={() => setSelectedColor(color)}
                  className={`h-5 w-5 rounded-full border-2 transition-all duration-200 ${color.value} ${
                    selectedColor.value === color.value
                      ? "ring-2 ring-emerald-400 border-white dark:border-zinc-800 scale-110 shadow-sm"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Descripción */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
            Descripción del Rol
          </label>
          <Textarea
            placeholder="Describe las responsabilidades generales de este rol..."
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="resize-none h-24 rounded-xl border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus-visible:ring-emerald-500 text-sm"
          />
        </div>

        {/* Sección de Permisos */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-2">
            <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              Configuración de Permisos
            </label>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30 px-2.5 py-1 rounded-full border border-emerald-100 dark:border-emerald-900/50 shadow-sm">
              {totalSelected} PERMISOS SELECCIONADOS
            </span>
          </div>

          <div className="grid grid-cols-1 gap-1">
            {loadingPerms ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500 opacity-50" />
                <p className="text-xs text-slate-400 dark:text-zinc-500 font-medium">
                  Cargando catálogo de permisos...
                </p>
              </div>
            ) : (
              Object.entries(groupedPermissions).map(([module, perms]) => (
                <PermissionGroup
                  key={module}
                  moduleName={module}
                  permissions={perms}
                  selectedIds={selectedPermIds}
                  onToggle={handleTogglePerm}
                  onToggleAll={handleToggleAll}
                />
              ))
            )}
          </div>
        </div>

        {errors.submit && (
          <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400 text-[11px] rounded-xl text-center">
            {errors.submit}
          </div>
        )}
      </div>
    </BaseFormModal>
  );
};

export default RolCreateModal;
