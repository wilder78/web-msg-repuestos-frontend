import React, { useState, useEffect } from "react";
import { Key } from "lucide-react";

import { useModalDock } from "../../contexts/ModalDockContext";
import PageHeader from "../../components/shared/PageHeader";
import TableToolbar from "../../components/shared/TableToolbar";
import TablePagination from "../../components/shared/TablePagination";
import SuccessToast from "../../components/ui/SuccessToast";

import AllowTable from "./components/AllowTable";
import AllowDetailsModal from "./components/AllowDetailsModal";
import { ConfirmActionModal } from "../../components/shared/ConfirmActionModal";

import { useUsers } from "../../hooks/useUsers";

const GestionPermisos = () => {
  const { authFetch } = useUsers();
  const { openWindow } = useModalDock();
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Estados para Modales
  const [selectedPermission, setSelectedPermission] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const [toastConfig, setToastConfig] = useState({
    visible: false,
    title: "",
    message: "",
  });

  useEffect(() => {
    const handlePermitChanged = (e) => {
      fetchPermissions();
      if (e?.detail) {
        showToast(
          e.detail.title || "Permiso guardado",
          e.detail.message || "El permiso ha sido guardado exitosamente."
        );
      }
    };
    window.addEventListener("permit-changed", handlePermitChanged);
    return () => {
      window.removeEventListener("permit-changed", handlePermitChanged);
    };
  }, []);

  // Función para obtener los permisos de la API
  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const [resPerms] = await Promise.all([authFetch("/api/permissions")]);

      if (resPerms.ok) {
        const data = await resPerms.json();
        const rawData = Array.isArray(data) ? data : data.data || [];

        // Normalización para manejar snake_case y asegurar idEstado
        const formatted = rawData.map((p) => ({
          ...p,
          idPermiso: p.idPermiso || p.id_permiso || p.id,
          nombrePermiso: p.nombrePermiso || p.nombre_permiso || p.nombre,
          idEstado: p.idEstado || p.id_estado || 1, // Default a 1 (Activo) si no viene
        }));

        setPermissions(formatted);
      }
    } catch (error) {
      console.error("Error al cargar permisos:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handler para actualizar la lista local después de un toggle exitoso
  const handleStatusUpdate = (id, nextStatus) => {
    setPermissions((prev) =>
      prev.map((p) =>
        p.idPermiso === id || p.id === id ? { ...p, idEstado: nextStatus } : p,
      ),
    );
    showToast(
      nextStatus === 1 ? "Permiso activado" : "Permiso inactivado",
      "El estado se actualizó correctamente.",
    );
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  // Lógica de filtrado (Nombre, Descripción o Categoría)
  const filteredPermissions = permissions.filter(
    (p) =>
      p.nombrePermiso?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.categoria?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Lógica de paginación
  const totalPages = Math.ceil(filteredPermissions.length / itemsPerPage);
  const paginatedPermissions = filteredPermissions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const showToast = (title, message) => {
    setToastConfig({ visible: true, title, message });
    setTimeout(
      () => setToastConfig((prev) => ({ ...prev, visible: false })),
      4500,
    );
  };

  const handleViewDetails = (permission) => {
    setSelectedPermission(permission);
    setIsDetailsOpen(true);
  };



  const handleConfirmDelete = async (permiso) => {
    const id = permiso.idPermiso || permiso.id;
    try {
      setIsDeleting(true);
      const res = await authFetch(`/api/permissions/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        showToast(
          "Permiso eliminado",
          `El permiso "${permiso.nombrePermiso}" ha sido eliminado del sistema.`,
        );
        setIsDeleteOpen(false);
        fetchPermissions();
      } else {
        const errorData = await res.json();
        setDeleteError(
          errorData.message ||
            "No se puede eliminar: El permiso tiene dependencias activas.",
        );
      }
    } catch (err) {
      console.error("Error en la petición de eliminación:", err);
    } finally {
      setIsDeleting(false);
    }
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
        icon={Key}
        title="Gestión de Permisos del Sistema"
        subtitle="MSG Repuestos - Panel de administración de permisos y accesos"
        buttonText="Crear Nuevo Permiso"
        onButtonClick={() => openWindow("permit-create", { title: "Crear Nuevo Permiso", type: "permit-create", size: { width: 640, height: 500 } })}
        createPermission="Crear Permiso"
      />

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700/60 overflow-hidden flex flex-col">
        <TableToolbar
          title="Permisos del Sistema"
          count={filteredPermissions.length}
          searchTerm={searchTerm}
          onSearchChange={(val) => {
            setSearchTerm(val);
            setCurrentPage(1);
          }}
          placeholder="Buscar por nombre o descripción..."
        />

        <AllowTable
          permissions={paginatedPermissions}
          loading={loading}
          authFetch={authFetch}
          onView={handleViewDetails}
          onEdit={(p) => openWindow(`permit-edit-${p.idPermiso || p.id}`, { title: `Editar Permiso: ${p.nombrePermiso || p.nombre}`, type: "permit-edit", data: p, size: { width: 640, height: 500 } })}
          onDelete={(p) => {
            setSelectedPermission(p);
            setDeleteError(null);
            setIsDeleteOpen(true);
          }}
          onToggleStatus={handleStatusUpdate}
        />

        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>

      <AllowDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        permiso={selectedPermission}
      />

      <ConfirmActionModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={() => handleConfirmDelete(selectedPermission)}
        loading={isDeleting}
        title="Confirmar eliminación"
        description="Esta acción es permanente y no se puede deshacer."
        itemName={
          selectedPermission?.nombrePermiso || selectedPermission?.nombre
        }
        itemSubtitle={selectedPermission?.descripcion || "Sin descripción"}
        itemId={selectedPermission?.idPermiso || selectedPermission?.id}
        alertMessage={
          <>
            ¿Seguro que deseas eliminar el permiso{" "}
            <strong>
              {selectedPermission?.nombrePermiso || selectedPermission?.nombre}
            </strong>
            ?<br />
            <br />
            <span className="text-xs text-gray-500 font-normal">
              Al eliminarlo, este permiso dejará de estar disponible para ser
              asignado a los roles. Si está siendo utilizado, la operación
              podría fallar.
            </span>
          </>
        }
        variant="danger"
        error={deleteError}
      />
    </div>
  );
};

export default GestionPermisos;

