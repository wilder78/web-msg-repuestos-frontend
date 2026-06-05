import React, { useState, useEffect } from "react";
import { BaseFormModal } from "../../../components/shared/BaseFormModal";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import {
  Edit2,
  Loader2,
  CheckCircle2,
  Layout,
  FileText,
  Key,
  Bookmark,
} from "lucide-react";

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

const AllowEditModal = ({ isOpen, onClose, permiso, onPermitUpdated }) => {
  const [nombrePermiso, setNombrePermiso] = useState("");
  const [modulo, setModulo] = useState("");
  const [categoria, setCategoria] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen && permiso) {
      setNombrePermiso(permiso.nombrePermiso || "");
      setModulo(permiso.modulo || "");
      setCategoria(permiso.categoria || "");
      setDescripcion(permiso.descripcion || permiso.description || "");
      setErrors({});
      setSaveSuccess(false);
    }
  }, [isOpen, permiso]);

  const handleSubmit = async () => {
    const newErrors = {};
    if (!nombrePermiso.trim())
      newErrors.nombrePermiso = "El nombre del permiso es obligatorio";
    if (!modulo.trim()) newErrors.modulo = "El módulo es obligatorio";
    if (!categoria.trim()) newErrors.categoria = "La categoría es obligatoria";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSaving(true);
    setErrors({});

    try {
      const permitPayload = {
        nombrePermiso: nombrePermiso.trim(),
        modulo: modulo.trim(),
        categoria: categoria.trim(),
        descripcion: descripcion.trim(),
        idEstado: permiso.idEstado || 1,
      };

      const id = permiso.idPermiso || permiso.id;
      const res = await authFetch(`/api/permissions/${id}`, {
        method: "PUT",
        body: JSON.stringify(permitPayload),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Error al actualizar el permiso");

      setSaveSuccess(true);
      const nombreFinal = nombrePermiso.trim();

      setTimeout(() => {
        onClose();
        if (onPermitUpdated) onPermitUpdated(nombreFinal);
      }, 700);
    } catch (err) {
      setErrors({ submit: err.message });
      setSaveSuccess(false);
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges =
    permiso &&
    (nombrePermiso.trim() !== (permiso.nombrePermiso || permiso.nombre || "").trim() ||
      modulo.trim() !== (permiso.modulo || "").trim() ||
      categoria.trim() !== (permiso.categoria || "").trim() ||
      descripcion.trim() !==
        (permiso.descripcion || permiso.description || "").trim());

  if (!permiso) return null;

  return (
    <BaseFormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar Permiso del Sistema"
      subtitle="Modifica los detalles técnicos y descriptivos del permiso"
      icon={Edit2}
      loading={isSaving}
      saveSuccess={saveSuccess}
      isEditing={true}
      isSubmitDisabled={!hasChanges || !nombrePermiso.trim() || !modulo.trim() || !categoria.trim()}
      onSubmit={handleSubmit}
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-2">
              <Key className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" /> Nombre del
              Permiso <span className="text-emerald-500 dark:text-emerald-400">*</span>
            </label>
            <Input
              placeholder="Ej: Gestionar Usuarios"
              value={nombrePermiso}
              onChange={(e) => setNombrePermiso(e.target.value)}
              className={`h-[42px] rounded-xl border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus-visible:ring-emerald-500 ${errors.nombrePermiso ? "border-red-400 dark:border-red-500" : ""}`}
            />
            {errors.nombrePermiso && (
              <p className="text-[11px] text-red-500">{errors.nombrePermiso}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-2">
              <Layout className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" /> Módulo{" "}
              <span className="text-emerald-500 dark:text-emerald-400">*</span>
            </label>
            <Input
              placeholder="Ej: Administración"
              value={modulo}
              onChange={(e) => setModulo(e.target.value)}
              className={`h-[42px] rounded-xl border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus-visible:ring-emerald-500 ${errors.modulo ? "border-red-400 dark:border-red-500" : ""}`}
            />
            {errors.modulo && (
              <p className="text-[11px] text-red-500">{errors.modulo}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-2">
            <Bookmark className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" /> Categoría{" "}
            <span className="text-emerald-500 dark:text-emerald-400">*</span>
          </label>
          <Input
            placeholder="Ej: Seguridad, Auditoría, Configuración..."
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className={`h-[42px] rounded-xl border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus-visible:ring-emerald-500 ${errors.categoria ? "border-red-400 dark:border-red-500" : ""}`}
          />
          {errors.categoria && (
            <p className="text-[11px] text-red-500">{errors.categoria}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-2">
            <FileText className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" /> Descripción
          </label>
          <Textarea
            placeholder="Describe qué permite hacer este permiso..."
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="resize-none h-28 rounded-xl border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus-visible:ring-emerald-500"
          />
        </div>

        {errors.submit && (
          <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs rounded-xl">
            {errors.submit}
          </div>
        )}
      </div>
    </BaseFormModal>
  );
};

export default AllowEditModal;
