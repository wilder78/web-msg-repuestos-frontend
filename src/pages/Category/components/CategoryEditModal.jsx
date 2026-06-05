import React, { useState, useEffect, useCallback, useRef } from "react";
import { BaseFormModal } from "../../../components/shared/BaseFormModal";
import { CategoryForm } from "./CategoryForm";
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

const CategoryEditModal = ({
  isOpen,
  onClose,
  categoria,
  onCategoryUpdated,
}) => {
  const [formData, setFormData] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const initialData = useRef(null);

  const initState = useCallback(() => {
    if (categoria) {
      const initialValues = {
        nombre_categoria: categoria.nombre || categoria.nombre_categoria || "",
        descripcion: categoria.descripcion || "",
        id_estado: categoria.statusId ?? categoria.id_estado ?? 1,
      };
      setFormData(initialValues);
      initialData.current = initialValues;
      setErrorMessage(null);
      setSaveSuccess(false);
      setHasChanges(false);
    }
  }, [categoria]);

  useEffect(() => {
    if (isOpen) {
      initState();
    } else {
      initialData.current = null;
      setHasChanges(false);
    }
  }, [isOpen, initState]);

  const handleInputChange = (newFormData) => {
    setErrorMessage(null);
    setFormData(newFormData);
  };

  useEffect(() => {
    if (!initialData.current || !formData) return;
    const changed = Object.keys(formData).some((key) => {
      return formData[key] !== initialData.current[key];
    });
    setHasChanges(changed);
  }, [formData]);

  const handleSubmit = async () => {
    setIsSaving(true);
    setErrorMessage(null);

    try {
      const categoryId = categoria.id ?? categoria.id_categoria;
      if (!categoryId)
        throw new Error("No se pudo determinar el ID de la categoria.");
      const response = await authFetch(`/api/categories/${categoryId}`, {
        method: "PUT",
        body: JSON.stringify(formData),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(result.message || "Error al actualizar la categoría");

      setSaveSuccess(true);
      setTimeout(() => {
        onClose();
        if (onCategoryUpdated) onCategoryUpdated(formData.nombre_categoria);
      }, 700);
    } catch (err) {
      setErrorMessage(err.message || "No se pudo actualizar la categoría");
    } finally {
      setIsSaving(false);
    }
  };

  if (!categoria) return null;

  return (
    <BaseFormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar Categoría"
      subtitle="Actualiza el nombre o la descripción de la clasificación"
      icon={Edit2}
      loading={isSaving}
      saveSuccess={saveSuccess}
      isEditing={true}
      onSubmit={handleSubmit}
      isSubmitDisabled={!isFormValid || !hasChanges}
    >
      <CategoryForm
        formData={formData}
        onChange={handleInputChange}
        onValidityChange={setIsFormValid}
        isEditing={true}
        loading={isSaving}
      />
      {errorMessage && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl text-red-600 dark:text-red-400 text-[12px] mt-4">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
          <span>{errorMessage}</span>
        </div>
      )}
    </BaseFormModal>
  );
};

export default CategoryEditModal;
