import React, { useState, useEffect, useCallback } from "react";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import {
  ShieldCheck,
  Check,
  Minus,
  ChevronDown,
  ChevronUp,
  Palette,
  Loader2,
} from "lucide-react";

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

const groupPermissionsByModule = (permissions) => {
  if (!permissions) return {};
  return permissions.reduce((acc, perm) => {
    const nombre = perm.nombre || perm.name || "";
    const module =
      perm.modulo ||
      perm.module ||
      (nombre.includes("_") ? nombre.split("_")[0] : "General");
    const moduleName = module.charAt(0).toUpperCase() + module.slice(1);
    if (!acc[moduleName]) acc[moduleName] = [];
    acc[moduleName].push(perm);
    return acc;
  }, {});
};

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
        className="w-full flex items-center justify-between px-5 py-3 bg-gradient-to-r from-slate-50 to-white hover:from-slate-100 hover:to-slate-50 dark:from-zinc-950 dark:to-zinc-900 dark:hover:from-zinc-900 dark:hover:to-zinc-850 transition-all duration-200"
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
                      : "border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-850 hover:border-emerald-450"
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

export function RolForm({
  formData,
  onChange,
  onValidityChange,
  isEditing = false,
  allPermissions = [],
  loadingPerms = false,
}) {
  const [selectedColor, setSelectedColor] = useState(
    COLOR_OPTIONS.find((c) => c.value === formData.color) || COLOR_OPTIONS[0]
  );

  useEffect(() => {
    const isValid = (formData.nombreRol || "").trim().length > 0;
    if (onValidityChange) {
      onValidityChange(isValid);
    }
  }, [formData.nombreRol, onValidityChange]);

  const handleTogglePerm = (permId) => {
    const prevPerms = formData.selectedPermIds || [];
    const newPerms = prevPerms.includes(permId)
      ? prevPerms.filter((id) => id !== permId)
      : [...prevPerms, permId];
    onChange({ ...formData, selectedPermIds: newPerms });
  };

  const handleToggleAll = (permIds, select) => {
    const prevPerms = formData.selectedPermIds || [];
    if (select) {
      const updated = new Set(prevPerms);
      permIds.forEach((id) => updated.add(id));
      onChange({ ...formData, selectedPermIds: [...updated] });
    } else {
      const removeSet = new Set(permIds);
      onChange({
        ...formData,
        selectedPermIds: prevPerms.filter((id) => !removeSet.has(id)),
      });
    }
  };

  const handleColorSelect = (color) => {
    setSelectedColor(color);
    onChange({ ...formData, color: color.value });
  };

  const groupedPermissions = groupPermissionsByModule(allPermissions);
  const totalSelected = (formData.selectedPermIds || []).length;

  return (
    <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-5 items-start">
        <div className="flex flex-col gap-1.5 w-full">
          <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
            Nombre del Rol <span className="text-emerald-500">*</span>
          </label>
          <Input
            placeholder="Ej: Supervisor de Ventas"
            value={formData.nombreRol || ""}
            onChange={(e) => onChange({ ...formData, nombreRol: e.target.value })}
            className="h-[42px] rounded-xl border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus-visible:ring-emerald-500"
          />
        </div>

        {!isEditing ? (
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Palette className="h-3 w-3 text-slate-400 dark:text-zinc-500" /> Color de Identificación
            </label>
            <div className="flex gap-1.5 flex-wrap max-w-[150px] p-1 bg-slate-50 dark:bg-zinc-950 rounded-lg border border-slate-100 dark:border-zinc-850">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  title={color.label}
                  onClick={() => handleColorSelect(color)}
                  className={`h-5 w-5 rounded-full border-2 transition-all duration-200 ${color.value} ${
                    selectedColor.value === color.value
                      ? "ring-2 ring-emerald-400 border-white dark:border-zinc-800 scale-110 shadow-sm"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Palette className="h-3 w-3 text-slate-400 dark:text-zinc-500" /> Estado Actual
            </label>
            <div className="px-3 py-2 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-100 dark:border-zinc-850 text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-tight text-center">
              {formData.estado || "Activo"}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
          Descripción del Rol
        </label>
        <Textarea
          placeholder="Describe las responsabilidades generales de este rol..."
          value={formData.descripcion || ""}
          onChange={(e) => onChange({ ...formData, descripcion: e.target.value })}
          className="resize-none h-24 rounded-xl border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus-visible:ring-emerald-500 text-sm"
        />
      </div>

      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-2">
          <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
            Configuración de Permisos
          </label>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:text-emerald-450 dark:bg-emerald-950/30 px-2.5 py-1 rounded-full border border-emerald-100 dark:border-emerald-900/50 shadow-sm">
            {totalSelected} PERMISOS SELECCIONADOS
          </span>
        </div>

        <div className="grid grid-cols-1 gap-1">
          {loadingPerms ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500 opacity-50" />
              <p className="text-xs text-slate-400 dark:text-zinc-550 font-medium">
                Cargando catálogo de permisos...
              </p>
            </div>
          ) : (
            Object.entries(groupedPermissions).map(([module, perms]) => (
              <PermissionGroup
                key={module}
                moduleName={module}
                permissions={perms}
                selectedIds={formData.selectedPermIds || []}
                onToggle={handleTogglePerm}
                onToggleAll={handleToggleAll}
              />
            ))
          )}
        </div>
      </div>
    </form>
  );
}
