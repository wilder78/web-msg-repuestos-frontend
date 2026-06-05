import React, { useEffect, useMemo, useState } from "react";
import { MapPin, Search } from "lucide-react";
import { Input } from "../../components/ui/input";
import { Card } from "../../components/ui/card";
import SuccessToast from "../../components/ui/SuccessToast";
import PageHeader from "../../components/shared/PageHeader";
import AreaTable from "./components/AreaTable";
import { useModalDock } from "../../contexts/ModalDockContext";
import { ConfirmActionModal } from "../../components/shared/ConfirmActionModal";
import AreaDetailsModal from "./components/AreaDetailsModal";


const authFetch = (url, options = {}) => {
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
};

const normalizeZone = (zone) => ({
  id: zone.idZona?.toString() || zone.id_zona?.toString() || "",
  name: zone.nombreZona || zone.nombre_zona || "",
  description: zone.descripcion || "",
  statusId: zone.idEstado || zone.id_estado,
});

export default function GestionZona() {
  const { openWindow } = useModalDock();
  const [zones, setZones] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toastConfig, setToastConfig] = useState({
    visible: false,
    title: "",
    message: "",
  });

  const showSuccessToast = (title, message) => {
    setToastConfig({
      visible: true,
      title,
      message,
    });
    setTimeout(() => {
      setToastConfig((prev) => ({ ...prev, visible: false }));
    }, 4500);
  };

  const handleZoneCreated = (name) => {
    showSuccessToast(
      "Zona registrada",
      `La zona "${name}" ha sido creada correctamente.`,
    );
  };

  const handleZoneUpdated = (name) => {
    showSuccessToast(
      "Zona actualizada",
      `La zona "${name}" ha sido actualizada correctamente.`,
    );
  };

  const handleZoneDeleted = (name) => {
    showSuccessToast(
      "Zona eliminada",
      `La zona "${name}" ha sido eliminada permanentemente.`,
    );
  };

  const handleDeleteConfirm = async () => {
    if (!deleteZone) return;

    try {
      setIsSaving(true);
      setPageError(null);

      const res = await authFetch(`/api/zonas/${deleteZone.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setZones((prev) =>
          prev.filter(
            (zone) => zone.id.toString() !== deleteZone.id.toString(),
          ),
        );
        setIsDeleteOpen(false);
        handleZoneDeleted(deleteZone.name);
        setDeleteZone(null);
      } else {
        const errorData = await res.json();
        setDeleteError(
          errorData.message ||
            "No se puede eliminar este registro debido a que tiene datos asociados en otros módulos. Considere inactivarlo en su lugar.",
        );
      }
    } catch (err) {
      console.error("Error inactivando zona:", err);
      setDeleteError("Error de comunicación con el servidor.");
    } finally {
      setIsSaving(false);
    }
  };

  const [selectedZone, setSelectedZone] = useState(null);
  const [deleteZone, setDeleteZone] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const fetchZones = async () => {
    try {
      setLoading(true);
      setPageError(null);
      const response = await authFetch("/api/zonas");
      if (!response.ok) throw new Error("Error al obtener zonas");
      const data = await response.json();
      const normalized = Array.isArray(data) ? data.map(normalizeZone) : [];
      setZones(normalized);
    } catch (err) {
      setPageError(`No se pudo cargar la lista de zonas.`);
      console.error("Error al cargar zonas:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  useEffect(() => {
    const handleChanged = (e) => {
      fetchZones();
      if (e?.detail) {
        showSuccessToast(
          e.detail.title || "Zona guardada",
          e.detail.message || "La zona ha sido guardada exitosamente."
        );
      }
    };
    window.addEventListener("area-changed", handleChanged);
    return () => window.removeEventListener("area-changed", handleChanged);
  }, []);

  const filteredZones = useMemo(
    () =>
      zones.filter((zone) => {
        const term = searchTerm.toLowerCase();
        return (
          zone.id.toString().toLowerCase().includes(term) ||
          zone.name.toLowerCase().includes(term) ||
          zone.description.toLowerCase().includes(term)
        );
      }),
    [zones, searchTerm],
  );

  const handleViewZone = (zone) => {
    setSelectedZone(zone);
    setIsDetailsOpen(true);
  };

  const handleDeleteZone = (zone) => {
    setDeleteZone(zone);
    setDeleteError(null);
    setIsDeleteOpen(true);
  };

  const handleStatusChangeSuccess = (zoneId, nextStatus) => {
    setZones((prev) =>
      prev.map((z) =>
        z.id.toString() === zoneId.toString()
          ? { ...z, statusId: nextStatus }
          : z,
      ),
    );
    showSuccessToast(
      "Estado actualizado",
      `La zona ahora está ${nextStatus === 1 ? "Activa" : "Inactiva"}.`,
    );
  };


  return (
    <div className="p-8 space-y-6 bg-transparent dark:bg-slate-950 min-h-screen transition-colors duration-300">
      <SuccessToast
        visible={toastConfig.visible}
        title={toastConfig.title}
        message={toastConfig.message}
        onClose={() => setToastConfig((prev) => ({ ...prev, visible: false }))}
      />
      <PageHeader
        icon={MapPin}
        title="Gestión de Zonas"
        subtitle="Gestiona las zonas de cobertura comercial"
        buttonText="Crear Zona"
        onButtonClick={() => openWindow("area-create", { title: "Nueva Zona", type: "area-create" })}
        createPermission="Crear Zona"
      />

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700/60 overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Listado de Zonas
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
                Gestiona las zonas de cobertura comercial
              </p>
            </div>

            <div className="relative w-full md:w-80">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500"
                size={18}
              />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar zona..."
                className="pl-10 bg-slate-50 dark:bg-zinc-855 border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white focus:bg-white transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {pageError ? (
            <div className="p-10 text-center text-sm text-red-650 dark:text-red-400 bg-white dark:bg-zinc-900">
              {pageError}
            </div>
          ) : (
            <AreaTable
              zones={filteredZones}
              loading={loading}
              authFetch={authFetch}
              onView={handleViewZone}
              onEdit={(zone) => openWindow(`area-edit-${zone.id}`, { title: `Editar Zona ${zone.name}`, type: "area-edit", data: zone })}
              onDelete={handleDeleteZone}
              onToggleStatus={handleStatusChangeSuccess}
            />
          )}
        </div>

        <div className="px-6 py-4 bg-slate-50/50 dark:bg-zinc-800/40 border-t border-slate-200 dark:border-zinc-800 text-sm text-slate-500 dark:text-zinc-400">
          {filteredZones.length} zona(s) encontrada(s)
        </div>
      </div>

      <ConfirmActionModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setDeleteZone(null);
          setDeleteError(null);
        }}
        onConfirm={handleDeleteConfirm}
        loading={isSaving}
        title="Confirmar eliminación"
        description="Esta acción es permanente y no se puede deshacer."
        itemName={deleteZone?.name}
        itemSubtitle={deleteZone?.description || "Sin descripción"}
        itemId={deleteZone?.id}
        alertMessage={
          <>
            ¿Seguro que deseas eliminar la zona{" "}
            <strong>{deleteZone?.name}</strong>?<br />
            <br />
            <span className="text-xs text-gray-500 font-normal">
              Al eliminarla, no se podrá asignar a nuevas rutas comerciales. Si
              tiene rutas asociadas, la operación será bloqueada.
            </span>
          </>
        }
        variant="danger"
        error={deleteError}
      />

      <AreaDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedZone(null);
        }}
        zone={selectedZone}
      />
    </div>
  );
}

