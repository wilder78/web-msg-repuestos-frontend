import React, { useState, useEffect } from "react";
import { UserPlus } from "lucide-react";

import { useUsers } from "../../hooks/useUsers";
import PageHeader from "../../components/shared/PageHeader";
import TableToolbar from "../../components/shared/TableToolbar";
import TablePagination from "../../components/shared/TablePagination";

import UserDetailsModal from "./components/UserDetailsModal";
import { ConfirmActionModal } from "../../components/shared/ConfirmActionModal";
import UserTable from "./components/UserTable";
import SuccessToast from "../../components/ui/SuccessToast";
import { useModalDock } from "../../contexts/ModalDockContext";


const INITIAL_CREATE_STATE = {
  nombreUsuario: "",
  email: "",
  password: "",
  id_rol: "",
  id_estado: "1",
};

const normalizeUserForState = (user) => {
  const idUsuario =
    user.idUsuario ?? user.idusuario ?? user.id_usuario ?? user.id;
  const nombreUsuario =
    user.nombreUsuario ||
    user.nombreusuario ||
    user.nombre_usuario ||
    user.nombre ||
    "";
  const idRol = user.idRol ?? user.idrol ?? user.id_rol;
  const idEstado = user.idEstado ?? user.idestado ?? user.id_estado;

  return {
    ...user,
    idUsuario,
    idusuario: user.idusuario ?? idUsuario,
    nombreUsuario,
    nombreusuario: user.nombreusuario || nombreUsuario,
    idRol,
    idrol: user.idrol ?? idRol,
    id_rol: user.id_rol ?? idRol,
    idEstado,
    idestado: user.idestado ?? idEstado,
    id_estado: user.id_estado ?? idEstado,
  };
};

const GestionUsuarios = () => {
  const { openWindow } = useModalDock();
  const { users, setUsers, roles, roleMap, loading, authFetch, refresh } = useUsers();

  useEffect(() => {
    const handleRefresh = (e) => {
      refresh();
      if (e?.detail) {
        showToast(
          e.detail.title || "Operación exitosa",
          e.detail.message || "Los cambios se aplicaron correctamente."
        );
      }
    };
    window.addEventListener("user-changed", handleRefresh);
    return () => window.removeEventListener("user-changed", handleRefresh);
  }, [refresh]);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 8;

  const [selectedUser, setSelectedUser] = useState(null);
  const [modals, setModals] = useState({
    create: false,
    edit: false,
    view: false,
    delete: false,
  });

  const [createFormData, setCreateFormData] = useState(INITIAL_CREATE_STATE);
  const [editFormData, setEditFormData] = useState({});
  const [actionLoading, setActionLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const [toastConfig, setToastConfig] = useState({
    visible: false,
    title: "",
    message: "",
  });

  const showToast = (title, message) => {
    setToastConfig({ visible: true, title, message });
    setTimeout(() => {
      setToastConfig((prev) => ({ ...prev, visible: false }));
    }, 4500);
  };

  // ─── Handlers de Éxito ────────────────────────────────────────────────────

  const handleUserSaveSuccess = (name) => {
    showToast(
      "Usuario actualizado",
      `Los cambios de "${name}" se aplicaron correctamente.`,
    );
  };

  const handleUserCreateSuccess = (name) => {
    showToast(
      "Usuario registrado",
      `El usuario "${name}" ha sido creado correctamente.`,
    );
  };

  // ✅ Handler para el cambio de estado (Éxito desde componente global)
  const handleStatusChangeSuccess = (userId, nextStatus) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.idUsuario === userId
          ? { ...u, id_estado: nextStatus, idEstado: nextStatus }
          : u,
      ),
    );
    showToast(
      nextStatus === 1 ? "Usuario activado" : "Usuario inactivado",
      "El estado se actualizó correctamente.",
    );
  };

  // ─── Control de Modales ───────────────────────────────────────────────────

  const toggleModal = (type, isOpen, user = null) => {
    setSelectedUser(user);
    if (type === "edit" && user) {
      setEditFormData({
        nombreUsuario: user.nombreUsuario || user.nombreusuario || "",
        email: user.email || "",
        id_rol: (user.id_rol ?? user.idRol ?? user.idrol)?.toString() || "",
        id_estado:
          (user.idEstado ?? user.idestado ?? user.id_estado)?.toString() || "1",
      });
    }
    if (!isOpen && type === "create") setCreateFormData(INITIAL_CREATE_STATE);
    if (type === "delete") setDeleteError(null);

    setModals((prev) => ({ ...prev, [type]: isOpen }));
  };

  // ─── Handlers de Acciones ─────────────────────────────────────────────────

  const [createSuccess, setCreateSuccess] = useState(false);
  const [editSuccess, setEditSuccess] = useState(false);

  const onCreateSubmit = async () => {
    if (!createFormData.id_rol) return false;
    setActionLoading(true);
    try {
      const payload = {
        nombreUsuario: createFormData.nombreUsuario,
        nombreusuario: createFormData.nombreUsuario,
        email: createFormData.email,
        password: createFormData.password,
        idRol: parseInt(createFormData.id_rol, 10),
        idrol: parseInt(createFormData.id_rol, 10),
        id_rol: parseInt(createFormData.id_rol, 10),
        idEstado: parseInt(createFormData.id_estado, 10) || 1,
        idestado: parseInt(createFormData.id_estado, 10) || 1,
        id_estado: parseInt(createFormData.id_estado, 10) || 1,
      };

      const res = await authFetch("/api/users/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const newUser = await res.json();
        setUsers((prev) => [newUser.data || newUser, ...prev]);
        setCreateSuccess(true);
        setTimeout(() => {
          setCreateSuccess(false);
          toggleModal("create", false);
          handleUserCreateSuccess(payload.nombreUsuario);
        }, 700);
        return true;
      } else {
        let errMsg = "Error al registrar el usuario.";
        try {
          const errData = await res.json();
          errMsg = errData.message || errData.error || errMsg;
        } catch (e) {}
        showToast("Error de Validación", errMsg, "error");
        return false;
      }
    } catch (error) {
      console.error("Error al crear usuario:", error);
      showToast("Error", "Error de conexión con el servidor", "error");
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const onEditSubmit = async () => {
    if (!editFormData.id_rol) return false;

    const selectedUserId =
      selectedUser.idUsuario ?? selectedUser.idusuario ?? selectedUser.id;
    const nextRoleId = parseInt(editFormData.id_rol, 10);
    const nextStatusId = parseInt(editFormData.id_estado, 10);

    if (selectedUserId === 1 && nextStatusId !== 1) {
      showToast(
        "Acción no permitida",
        "No se puede cambiar el estado del usuario Master.",
      );
      return false;
    }

    setActionLoading(true);
    try {
      const payload = {
        nombreUsuario: editFormData.nombreUsuario,
        nombreusuario: editFormData.nombreUsuario,
        email: editFormData.email,
        idRol: nextRoleId,
        idrol: nextRoleId,
        id_rol: nextRoleId,
        idEstado: nextStatusId,
        idestado: nextStatusId,
        id_estado: nextStatusId,
      };

      const res = await authFetch(`/api/users/${selectedUserId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const responseData = await res.json().catch(() => ({}));
        const updatedUser = normalizeUserForState({
          ...selectedUser,
          ...(responseData.data || responseData),
          ...payload,
        });

        setUsers((prev) =>
          prev.map((u) =>
            (u.idUsuario ?? u.idusuario ?? u.id) === selectedUserId
              ? updatedUser
              : u,
          ),
        );
        setEditSuccess(true);
        setTimeout(() => {
          setEditSuccess(false);
          toggleModal("edit", false);
          handleUserSaveSuccess(payload.nombreUsuario);
        }, 700);
        return true;
      } else {
        let errMsg = "Error al actualizar el usuario.";
        try {
          const errData = await res.json();
          errMsg = errData.message || errData.error || errMsg;
        } catch (e) {}
        showToast("Error de Actualización", errMsg, "error");
        return false;
      }
    } catch (error) {
      console.error("Error al editar usuario:", error);
      showToast("Error", "Error de conexión con el servidor", "error");
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const onDeleteConfirm = async () => {
    setActionLoading(true);
    try {
      const res = await authFetch(`/api/users/${selectedUser.idUsuario}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.filter((u) => u.idUsuario !== selectedUser.idUsuario),
        );
        showToast(
          "Usuario eliminado",
          "El usuario fue eliminado correctamente del sistema.",
        );
        toggleModal("delete", false);
      } else {
        const errorData = await res.json();
        setDeleteError(
          errorData.message || "Error de restricciones de seguridad.",
        );
      }
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Helpers Visuales ─────────────────────────────────────────────────────

  const getInitials = (n) =>
    n
      ?.split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "??";

  const getAvatarColor = (id) => {
    const colors = [
      "bg-emerald-500",
      "bg-blue-500",
      "bg-violet-500",
      "bg-amber-500",
      "bg-rose-500",
    ];
    return colors[id % colors.length];
  };

  // ─── Filtrado y Paginación ────────────────────────────────────────────────

  const currentUserStr = localStorage.getItem("user");
  let currentUser = null;
  try {
    currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
  } catch (e) {}

  const filteredUsers = users.filter((u) => {
    const isMasterUser =
      u.idUsuario === 1 || u.nombreUsuario?.toLowerCase() === "master";
    const isCurrentUserMaster =
      currentUser &&
      (currentUser.idUsuario === 1 ||
        currentUser.nombreUsuario?.toLowerCase() === "master" ||
        currentUser.id === 1);

    if (isMasterUser && !isCurrentUserMaster) {
      return false;
    }
    const searchLower = searchTerm.toLowerCase();
    return (
      u.nombreUsuario?.toLowerCase().includes(searchLower) ||
      u.email?.toLowerCase().includes(searchLower)
    );
  });

  const filteredRolesForSelect = roles.filter((rol) => {
    const isCurrentUserMaster =
      currentUser &&
      (currentUser.idUsuario === 1 ||
        currentUser.nombreUsuario?.toLowerCase() === "master" ||
        currentUser.id === 1);
    const isMasterRole =
      rol.idRol === 1 || rol.nombreRol?.toLowerCase() === "master";
    if (isMasterRole && !isCurrentUserMaster) {
      return false;
    }
    return true;
  });

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage,
  );

  return (
    <div className="p-8 space-y-6 bg-transparent dark:bg-slate-950 min-h-screen transition-colors duration-300 overflow-auto">
      <SuccessToast
        {...toastConfig}
        onClose={() => setToastConfig((p) => ({ ...p, visible: false }))}
      />

      <PageHeader
        icon={UserPlus}
        title="Gestión de Usuarios"
        subtitle="Panel administrativo MSG Repuestos"
        buttonText="Crear Usuario"
        onButtonClick={() => openWindow("user-create", { title: "Registrar Nuevo Usuario", type: "user-create", size: { width: 640, height: 500 } })}
        createPermission="Crear Usuario"
      />

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700/60 overflow-hidden flex flex-col">
        <TableToolbar
          title="Usuarios del Sistema"
          count={filteredUsers.length}
          searchTerm={searchTerm}
          onSearchChange={(val) => {
            setSearchTerm(val);
            setCurrentPage(1);
          }}
          placeholder="Buscar por nombre o email..."
        />

        <UserTable
          users={paginatedUsers}
          roleMap={roleMap}
          loading={loading}
          authFetch={authFetch}
          getAvatarColor={getAvatarColor}
          getInitials={getInitials}
          onView={(u) => toggleModal("view", true, u)}
          onEdit={(u) => openWindow(`user-edit-${u.idUsuario ?? u.id}`, { title: `Actualizar Usuario: ${u.nombreUsuario}`, type: "user-edit", data: normalizeUserForState(u), size: { width: 640, height: 500 } })}
          onDelete={(u) => toggleModal("delete", true, u)}
          onToggleStatus={handleStatusChangeSuccess}
        />

        <TablePagination
          currentPage={currentPage}
          totalPages={Math.ceil(filteredUsers.length / usersPerPage)}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* MODALES */}

      <UserDetailsModal
        isOpen={modals.view}
        onClose={() => toggleModal("view", false)}
        usuario={selectedUser}
        rolMap={roleMap}
        getAvatarColor={getAvatarColor}
        getInitials={getInitials}
      />

      <ConfirmActionModal
        isOpen={modals.delete}
        onClose={() => toggleModal("delete", false)}
        onConfirm={onDeleteConfirm}
        loading={actionLoading}
        title="Confirmar eliminación"
        description="Esta acción es permanente y no se puede deshacer."
        itemName={selectedUser?.nombreUsuario}
        itemSubtitle={selectedUser?.email}
        itemId={selectedUser?.idUsuario}
        alertMessage={
          <>
            ¿Seguro que deseas eliminar al usuario{" "}
            <strong>{selectedUser?.nombreUsuario}</strong>?<br />
            <br />
            <span className="text-xs text-gray-500 font-normal">
              El registro será borrado físicamente de la base de datos. Si el
              usuario tiene historial, la operación podría fallar.
            </span>
          </>
        }
        variant="danger"
        error={deleteError}
      />
    </div>
  );
};

export default GestionUsuarios;

