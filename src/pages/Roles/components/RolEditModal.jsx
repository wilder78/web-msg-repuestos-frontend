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
  X,
  Edit2,
} from "lucide-react";
import { BaseFormModal } from "../../../components/shared/BaseFormModal";

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
                  : "border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-emerald-455"
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
                  {isSelected && (
                    <Check className="h-2.5 w-2.5 text-white" />
                  )}
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

const RolEditModal = ({
  isOpen,
  onClose,
  rol,
  allPermissions = [],
  assignedPermissions = [],
  onRolUpdated,
}) => {
  const [nombre, setNombre] = useState(rol?.nombre || "");
  const [descripcion, setDescripcion] = useState(rol?.descripcion || "");
  const [selectedPermIds, setSelectedPermIds] = useState([]);
  const [loadingPerms, setLoadingPerms] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [permissionsList, setPermissionsList] = useState(allPermissions || []);

  const initState = useCallback(() => {
    setNombre(rol?.nombre || "");
    setDescripcion(rol?.descripcion || "");
    const assignedIds = assignedPermissions
      .map((perm) => perm.idPermiso || perm.id_permiso || perm.id)
      .filter(Boolean);
    setSelectedPermIds(assignedIds);
    setPermissionsList(allPermissions || []);
    setErrors({});
    setSaveSuccess(false);
  }, [rol, assignedPermissions, allPermissions]);

  useEffect(() => {
    if (isOpen) {
      initState();
    }
  }, [isOpen, initState]);

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

  const fetchPermissions = useCallback(async () => {
    if (permissionsList && permissionsList.length > 0) return;
    setLoadingPerms(true);
    try {
      const res = await authFetch("/api/permissions");
      if (!res.ok) throw new Error("Error al obtener permisos");
      const data = await res.json();
      setPermissionsList(data.data || data.permissions || data || []);
    } catch (err) {
      console.error("Error cargando permisos:", err);
    } finally {
      setLoadingPerms(false);
    }
  }, [permissionsList]);

  useEffect(() => {
    if (isOpen && (!permissionsList || permissionsList.length === 0)) {
      fetchPermissions();
    }
  }, [isOpen, permissionsList, fetchPermissions]);

  const handleSubmit = async () => {
    if (!nombre.trim()) {
      setErrors({ nombre: "El nombre del rol es obligatorio" });
      return;
    }

    setIsSaving(true);
    setErrors({});

    try {
      const updatedRole = {
        idRol: rol?.id,
        nombreRol: nombre.trim(),
        descripcion: descripcion.trim(),
        idEstado: parseInt(rol?.idEstado || 1, 10),
      };

      const response = await authFetch(`/api/roles/${rol?.id}`, {
        method: "PUT",
        body: JSON.stringify(updatedRole),
      });

      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || result.message || "Error al actualizar el rol");

      const currentAssignedIds = assignedPermissions
        .map((perm) => perm.idPermiso || perm.id_permiso || perm.id)
        .filter(Boolean);
      const idsToAdd = selectedPermIds.filter(
        (id) => !currentAssignedIds.includes(id),
      );
      const idsToRemove = currentAssignedIds.filter(
        (id) => !selectedPermIds.includes(id),
      );

      if (idsToRemove.length > 0) {
        for (const permId of idsToRemove) {
          await authFetch(`/api/role-permissions/revoke`, {
            method: "DELETE",
            body: JSON.stringify({
              idRol: Number(rol?.id || rol?.idRol),
              idPermiso: Number(permId),
            }),
          });
        }
      }

      if (idsToAdd.length > 0) {
        for (const permId of idsToAdd) {
          await authFetch("/api/role-permissions/assign", {
            method: "POST",
            body: JSON.stringify({ idRol: rol?.id, idPermiso: permId }),
          });
        }
      }

      setSaveSuccess(true);
      setTimeout(() => {
        onClose();
        if (onRolUpdated) onRolUpdated(nombre.trim());
      }, 700);
    } catch (err) {
      setErrors({ submit: err.message || "No se pudo actualizar el rol" });
    } finally {
      setIsSaving(false);
    }
  };

  const groupedPermissions = groupPermissionsByModule(permissionsList);
  const totalSelected = selectedPermIds.length;

  const hasChanges = () => {
    const initialNombre = rol?.nombre || "";
    const initialDesc = rol?.descripcion || "";
    const initialPermIds = (assignedPermissions || [])
      .map((p) => p.idPermiso || p.id_permiso || p.id)
      .filter(Boolean)
      .sort();

    const currentPermIds = [...selectedPermIds].sort();

    const permsChanged =
      JSON.stringify(initialPermIds) !== JSON.stringify(currentPermIds);
    const nombreChanged = nombre.trim() !== initialNombre;
    const descChanged = descripcion.trim() !== initialDesc;

    return permsChanged || nombreChanged || descChanged;
  };

  if (!rol) return null;

  return (
    <BaseFormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar Rol"
      subtitle="Modifica la información y permisos del rol seleccionado"
      icon={Edit2}
      loading={isSaving}
      saveSuccess={saveSuccess}
      isEditing={true}
      isSubmitDisabled={!nombre.trim() || !hasChanges()}
      onSubmit={handleSubmit}
    >
      <div className="space-y-6">
        {/* Nombre y Estado */}
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
              <Palette className="h-3 w-3 text-slate-400 dark:text-zinc-500" /> Estado Actual
            </label>
            <div className="px-3 py-2 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-100 dark:border-zinc-850 text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-tight text-center">
              {rol.estado || "Activo"}
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

export default RolEditModal;
