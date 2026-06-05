import React, { useState, useMemo, useEffect } from "react";
import { useRoles } from "../../hooks/useRoles";
import { useModalDock } from "../../contexts/ModalDockContext";
import RolesTable from "./components/RolesTable";
import RoleDetailsModal from "./components/RoleDetailsModal";
import { ConfirmActionModal } from "../../components/shared/ConfirmActionModal";
import { ShieldCheck } from "lucide-react";
import PageHeader from "../../components/shared/PageHeader";
import TableToolbar from "../../components/shared/TableToolbar";
import TablePagination from "../../components/shared/TablePagination";
import SuccessToast from "../../components/ui/SuccessToast";

const GestionRoles = () => {
  const { roles, setRoles, loading, error, refresh, authFetch } = useRoles();
  const { openWindow } = useModalDock();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rolesPerPage = 8;

  // Estados para Modales
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [selectedRole, setSelectedRole] = useState(null);
  const [deleteRole, setDeleteRole] = useState(null);
  const [rolePermissions, setRolePermissions] = useState([]);
  const [allSystemPermissions, setAllSystemPermissions] = useState([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isLoadingDelete, setIsLoadingDelete] = useState(false);

  // ✅ NUEVO: Estado único para Toasts
  const [toastConfig, setToastConfig] = useState({
    visible: false,
    title: "",
    message: "",
    type: "success",
  });
  const [deleteError, setDeleteError] = useState(null);

  // ✅ NUEVO: Handler para mostrar el toast con éxito/error
  const showToast = (title, message, type = "success") => {
    setToastConfig({
      visible: true,
      title,
      message,
      type,
    });
    setTimeout(() => {
      setToastConfig((prev) => ({ ...prev, visible: false }));
    }, 4500);
  };

  useEffect(() => {
    const handleRoleChanged = (e) => {
      refresh();
      if (e?.detail) {
        showToast(
          e.detail.title || "Operación exitosa",
          e.detail.message || "Los cambios en el rol se guardaron."
        );
      }
    };
    window.addEventListener("role-changed", handleRoleChanged);
    return () => {
      window.removeEventListener("role-changed", handleRoleChanged);
    };
  }, [refresh]);

  useEffect(() => {
    const fetchAllPermissions = async () => {
      try {
        const token =
          localStorage.getItem("token") || sessionStorage.getItem("token");
        const response = await fetch("/api/permissions", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setAllSystemPermissions(data);
        }
      } catch (error) {
        console.error("Error cargando catálogo de permisos:", error);
      }
    };
    fetchAllPermissions();
  }, []);



  const handleStatusChangeSuccess = (rolId, nextStatus) => {
    setRoles((prev) =>
      prev.map((r) => (r.id === rolId ? { ...r, idEstado: nextStatus } : r)),
    );
    showToast(
      "Estado actualizado",
      `El rol ahora está ${nextStatus === 1 ? "Activo" : "Inactivo"}.`,
      "success"
    );
  };

  // --- Memorización de datos (sin cambios) ---
  const _groupedPermissions = useMemo(() => {
    if (!allSystemPermissions || allSystemPermissions.length === 0) return [];
    return allSystemPermissions.reduce((acc, perm) => {
      if (!perm || !perm.nombre) return acc;
      const partes = perm.nombre.split("_");
      const modulo = partes.length > 1 ? partes[1] : "General";
      const categoryName = modulo.charAt(0).toUpperCase() + modulo.slice(1);
      let category = acc.find((c) => c.nombre === categoryName);
      if (!category) {
        category = {
          id: modulo.toLowerCase(),
          nombre: categoryName,
          items: [],
        };
        acc.push(category);
      }
      category.items.push({
        id: perm.idPermiso || perm.id,
        nombre: perm.nombre,
        desc: perm.descripcion || `Acceso a ${perm.nombre}`,
      });
      return acc;
    }, []);
  }, [allSystemPermissions]);

  const filteredRoles = useMemo(() => {
    if (!roles) return [];

    const currentUserStr = localStorage.getItem("user");
    let currentUser = null;
    try {
      currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
    } catch (e) {}
    const isCurrentUserMaster =
      currentUser &&
      (currentUser.idUsuario === 1 ||
        currentUser.nombreUsuario?.toLowerCase() === "master" ||
        currentUser.id === 1 ||
        currentUser.idRol === 1);

    return roles.filter((rol) => {
      const isMasterRole =
        rol.id === 1 ||
        rol.idRol === 1 ||
        rol.nombre?.toLowerCase() === "master";
      if (isMasterRole && !isCurrentUserMaster) {
        return false;
      }
      return (
        rol.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rol.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [roles, searchTerm]);

  const totalPages = Math.ceil(filteredRoles.length / rolesPerPage);
  const paginatedRoles = useMemo(() => {
    const startIndex = (currentPage - 1) * rolesPerPage;
    return filteredRoles.slice(startIndex, startIndex + rolesPerPage);
  }, [filteredRoles, currentPage]);

  const handleViewDetails = async (rol) => {
    setSelectedRole(rol);
    setIsLoadingDetails(true);
    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      const response = await fetch("/api/role-permissions/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const allPerms = await response.json();
        const filtered = allPerms.filter(
          (p) => (p.idRol || p.id_rol) === rol.id,
        );
        setRolePermissions(filtered);
        setIsDetailsOpen(true);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleEditRole = (rol) => {
    openWindow(`role-edit-${rol.id}`, {
      title: `Editar Rol: ${rol.nombre}`,
      type: "role-edit",
      data: rol,
      size: { width: 680, height: 550 }
    });
  };

  const handleDeleteRole = (rol) => {
    setDeleteRole(rol);
    setDeleteError(null);
    setIsDeleteOpen(true);
  };

  const onDeleteConfirm = async () => {
    if (!deleteRole) return;
    setIsLoadingDelete(true);
    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      const response = await fetch(`/api/roles/${deleteRole.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        // Actualización optimista: lo quitamos de la lista local
        setRoles((prev) =>
          prev.filter((r) => String(r.id) !== String(deleteRole.id)),
        );
        // Sincronización real: refrescamos desde el servidor
        await refresh();

        setIsDeleteOpen(false);
        showToast(
          "Rol eliminado",
          `El rol "${deleteRole.nombre}" ha sido eliminado permanentemente.`,
          "success"
        );
      } else {
        const errorData = await response.json();
        setDeleteError(
          errorData.message ||
            "No se puede eliminar este rol debido a dependencias con usuarios o permisos.",
        );
      }
    } catch (error) {
      console.error("Error en la petición de eliminación:", error);
    } finally {
      setIsLoadingDelete(false);
    }
  };

  return (
    <div className="p-8 space-y-6 bg-transparent dark:bg-slate-950 min-h-screen transition-colors duration-300">
      {/* ✅ TOAST GLOBAL DE ROLES */}
      <SuccessToast
        visible={toastConfig.visible}
        title={toastConfig.title}
        message={toastConfig.message}
        type={toastConfig.type}
        onClose={() => setToastConfig((prev) => ({ ...prev, visible: false }))}
      />

      <PageHeader
        icon={ShieldCheck}
        title="Gestión de Roles y Permisos"
        subtitle="MSG Repuestos - Panel de control de acceso y seguridad"
        buttonText="Crear Nuevo Rol"
        onButtonClick={() => openWindow("role-create", { title: "Crear Nuevo Rol", type: "role-create", size: { width: 680, height: 550 } })}
        createPermission="Crear Rol"
      />

      {error && !loading && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-3 rounded-lg flex items-center justify-between text-sm font-medium">
          <span>⚠️ {error}</span>
          <button
            onClick={refresh}
            className="ml-4 text-red-600 underline hover:text-red-800"
          >
            Reintentar
          </button>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700/60 overflow-hidden flex flex-col">
        <TableToolbar
          title="Roles del Sistema"
          count={filteredRoles.length}
          searchTerm={searchTerm}
          onSearchChange={(val) => {
            setSearchTerm(val);
            setCurrentPage(1);
          }}
          placeholder="Buscar por nombre o descripción..."
        />

        <RolesTable
          roles={paginatedRoles}
          loading={
            loading || isLoadingDetails || isLoadingDelete
          }
          authFetch={authFetch}
          onView={handleViewDetails}
          onEdit={handleEditRole}
          onDelete={handleDeleteRole}
          onToggleStatus={handleStatusChangeSuccess}
          onRefresh={refresh}
        />

        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      <RoleDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        rol={selectedRole}
        permisos={rolePermissions}
      />

      <ConfirmActionModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setDeleteRole(null);
        }}
        onConfirm={onDeleteConfirm}
        loading={isLoadingDelete}
        title="Confirmar eliminación"
        description="Esta acción es permanente y no se puede deshacer."
        itemName={deleteRole?.nombre}
        itemSubtitle={deleteRole?.descripcion || "Sin descripción"}
        itemId={deleteRole?.id}
        alertMessage={
          <>
            ¿Seguro que deseas eliminar el rol{" "}
            <strong>{deleteRole?.nombre}</strong>?<br />
            <br />
            <span className="text-xs text-gray-500 font-normal">
              Al eliminarlo, se perderán las asignaciones y podría afectar a los
              usuarios asociados.
            </span>
          </>
        }
        variant="danger"
        error={deleteError}
      />
    </div>
  );
};

export default GestionRoles;

