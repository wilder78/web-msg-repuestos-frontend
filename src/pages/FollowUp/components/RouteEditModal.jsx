import React, { useState, useEffect, useRef } from "react";
import { BaseFormModal } from "../../../components/shared/BaseFormModal";
import { RouteForm } from "./RouteForm";
import { Edit2, AlertCircle } from "lucide-react";

const RouteEditModal = ({
  isOpen,
  onClose,
  route,
  listaZonas = [],
  listaEmpleados = [],
  listaClientes = [],
  onSaveSuccess,
  authFetch,
}) => {
  const [formData, setFormData] = useState({
    nombreRuta: "",
    idZona: "",
    idEmpleado: "",
    fechaPlanificada: "",
    detalles: [],
  });
  const [isFormValid, setIsFormValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const initialData = useRef(null);

  useEffect(() => {
    if (isOpen && route) {
      setSaveSuccess(false);
      setError(null);
      setHasChanges(false);

      let formattedDate = "";
      if (route.fechaPlanificada) {
        try {
          formattedDate = new Date(route.fechaPlanificada)
            .toISOString()
            .split("T")[0];
        } catch {
          formattedDate = route.fechaPlanificada.split("T")[0];
        }
      }

      const initialValues = {
        nombreRuta: route.nombreRuta || "",
        idZona: route.idZona?.toString() || "",
        idEmpleado: route.idEmpleado?.toString() || "",
        fechaPlanificada: formattedDate,
        detalles: route.detalles || [],
      };
      setFormData(initialValues);
      initialData.current = initialValues;
    }
    if (!isOpen) {
      initialData.current = null;
      setHasChanges(false);
    }
  }, [isOpen, route]);

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    if (!initialData.current || !formData) return;
    const detallesOriginales = JSON.stringify(
      (initialData.current.detalles || []).map((d) => d.idCliente).sort(),
    );
    const detallesNuevos = JSON.stringify(
      (formData.detalles || []).map((d) => d.idCliente).sort(),
    );

    const changed =
      (formData.nombreRuta || "").trim() !==
        (initialData.current.nombreRuta || "").trim() ||
      formData.idZona !== initialData.current.idZona ||
      formData.idEmpleado !== initialData.current.idEmpleado ||
      formData.fechaPlanificada !== initialData.current.fechaPlanificada ||
      detallesOriginales !== detallesNuevos;

    setHasChanges(changed);
  }, [formData]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!route?.idRuta) return;

    setLoading(true);
    setError(null);

    try {
      const detallesFormateados = (formData.detalles || []).map((d) => ({
        idCliente: d.idCliente,
        idPedido: d.idPedido || null,
        estadoVisita: d.estadoVisita || "Pendiente",
      }));

      const payload = {
        nombreRuta: formData.nombreRuta,
        idZona: parseInt(formData.idZona),
        idEmpleado: formData.idEmpleado ? parseInt(formData.idEmpleado) : null,
        fechaPlanificada: formData.fechaPlanificada,
        idEstadoRuta: route.idEstadoRuta || 1,
        detalles: detallesFormateados,
      };

      const response = await authFetch(`/api/rutas/${route.idRuta}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "No se pudo actualizar la ruta");
      }

      setSaveSuccess(true);
      const registeredName = formData.nombreRuta || "Ruta Editada";

      setTimeout(() => {
        onClose();
        setTimeout(() => {
          if (onSaveSuccess) onSaveSuccess(registeredName);
          setTimeout(() => setSaveSuccess(false), 500);
        }, 300);
      }, 800);
    } catch (err) {
      console.error(err);
      setError(
        err.message || "Ocurrió un error al intentar guardar los cambios.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!route && isOpen) return null;

  return (
    <BaseFormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar Ruta"
      subtitle="Modifica la información y asignación de la ruta"
      icon={Edit2}
      loading={loading}
      saveSuccess={saveSuccess}
      isEditing={true}
      onSubmit={handleSubmit}
      isSubmitDisabled={!isFormValid || !hasChanges}
    >
      <RouteForm
        formData={formData}
        onChange={(updatedData) => setFormData(updatedData)}
        onSelectChange={handleSelectChange}
        onValidityChange={setIsFormValid}
        listaZonas={listaZonas}
        listaEmpleados={listaEmpleados}
        listaClientes={listaClientes}
      />
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-lg text-xs mt-4">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}
    </BaseFormModal>
  );
};

export default RouteEditModal;
