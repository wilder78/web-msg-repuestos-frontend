import React, { useState, useEffect, useMemo } from "react";
import { UserCog, Loader2 } from "lucide-react";
import { useModalDock } from "../../contexts/ModalDockContext";
import PageHeader from "../../components/shared/PageHeader";
import TableToolbar from "../../components/shared/TableToolbar";
import TablePagination from "../../components/shared/TablePagination";
import SuccessToast from "../../components/ui/SuccessToast";
import { EmployeeTable } from "./components/EmployeeTable";
import EmployeeDetailsModal from "./components/EmployeeDetailsModal";
import EmployeeEditModal from "./components/EmployeeEditModal";
import { ConfirmActionModal } from "../../components/shared/ConfirmActionModal";
import EmployeeCreateModal from "./components/EmployeeCreateModal";

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

const EMPLOYEE_ENDPOINT = "/api/employees";
const USER_ENDPOINT = "/api/users";
const ROLE_ENDPOINT = "/api/roles";
const CUSTOMER_ENDPOINT = "/api/customers";

const extractList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  for (const key of [
    "data",
    "empleados",
    "employees",
    "usuarios",
    "users",
    "roles",
    "clientes",
    "customers",
    "content",
    "rows",
    "items",
    "results",
  ]) {
    const value = payload[key];
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object") {
      const nested = extractList(value);
      if (nested.length > 0) return nested;
    }
  }

  return [];
};

const getUserId = (user) =>
  user.idUsuario ?? user.idusuario ?? user.id_usuario ?? user.id;
const getUserName = (user) =>
  user.nombreUsuario ||
  user.nombreusuario ||
  user.nombre_usuario ||
  user.nombre ||
  user.name ||
  "";
const getRoleId = (item) =>
  item.idRol ??
  item.idrol ??
  item.id_rol ??
  item.rol?.idRol ??
  item.rol?.idrol ??
  item.rol?.id_rol;
const getRoleName = (item) =>
  item.nombreRol ||
  item.nombrerol ||
  item.nombre_rol ||
  item.rol?.nombreRol ||
  item.rol?.nombrerol ||
  item.rol?.nombre_rol ||
  item.rol?.nombre ||
  item.cargo ||
  "";

const normalizeUser = (user, roleMap = {}) => {
  const idUsuario = getUserId(user);
  const nombreUsuario = getUserName(user);
  const idRol = getRoleId(user);
  const nombreRol = getRoleName(user) || roleMap[idRol?.toString()] || "";

  return {
    ...user,
    idUsuario,
    idusuario: user.idusuario ?? idUsuario,
    nombreUsuario,
    nombreusuario: user.nombreusuario || nombreUsuario,
    idRol,
    idrol: user.idrol ?? idRol,
    id_rol: user.id_rol ?? idRol,
    nombreRol,
  };
};

const normalizeRole = (role) => {
  const idRol = getRoleId(role);
  const nombreRol = getRoleName(role) || "Sin rol";

  return {
    ...role,
    idRol,
    id_rol: role.id_rol ?? idRol,
    nombreRol,
    nombre_rol: role.nombre_rol || nombreRol,
  };
};

const isClientRole = (roleId, roleName = "") =>
  Number(roleId) === 4 || roleName.toLowerCase().includes("cliente");

const mapEmployee = (empleado, userEmailMap = {}) => {
  const idUsuario =
    empleado.idUsuario ?? empleado.idusuario ?? empleado.id_usuario ?? null;
  const linkedUser = idUsuario ? userEmailMap[idUsuario] : null;

  const cargoDelUsuario = getRoleName(empleado.usuario || {});

  const cargoDirecto =
    empleado.rolOperativo ||
    empleado.roloperativo ||
    empleado.rol_operativo ||
    empleado.nombreRol ||
    empleado.nombrerol ||
    empleado.cargo;
  const idRol =
    getRoleId(empleado.usuario || {}) ??
    getRoleId(empleado) ??
    linkedUser?.idRol ??
    null;

  return {
    id:
      empleado.idEmpleado ??
      empleado.id_empleado ??
      empleado.idempleado ??
      empleado.id ??
      empleado.idEmployee ??
      "",
    nombres: empleado.nombre || empleado.nombres || "",
    apellidos: empleado.apellido || empleado.apellidos || "",
    foto: "",
    cargo: cargoDelUsuario || cargoDirecto || "Personal Operativo",
    email: linkedUser?.email || empleado.usuario?.email || empleado.email || "",
    telefono: empleado.telefono || "",
    numeroDocumento:
      empleado.numeroDocumento ||
      empleado.numerodocumento ||
      empleado.numero_documento ||
      "",
    estado:
      (empleado.idEstado ?? empleado.idestado) === 1 ||
      empleado.activo !== false
        ? "activo"
        : "inactivo",
    statusId:
      empleado.idEstado ??
      empleado.idestado ??
      empleado.id_estado ??
      (empleado.activo === false ? 2 : 1),
    idUsuario,
    idRol,
    idCliente:
      empleado.idCliente ??
      empleado.idcliente ??
      empleado.id_cliente ??
      linkedUser?.idCliente ??
      linkedUser?.idcliente ??
      linkedUser?.id_cliente ??
      null,
    disponibilidad: empleado.disponibilidad ?? false,
    activo: empleado.activo ?? true,
    usuario: empleado.usuario || null,
    idTipoDocumento:
      empleado.idTipoDocumento ??
      empleado.idtipodocumento ??
      empleado.id_tipo_documento,
  };
};

const GestionEmpleados = () => {
  const { openWindow } = useModalDock();
  const [empleados, setEmpleados] = useState([]);
  const [roles, setRoles] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [customerEmails, setCustomerEmails] = useState(new Set()); // Nueva lista de emails bloqueados
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const empleadosPerPage = 8;

  const [selectedEmpleado, setSelectedEmpleado] = useState(null);
  const [modals, setModals] = useState({
    view: false,
    edit: false,
    delete: false,
    create: false,
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    idTipoDocumento: 1,
    numeroDocumento: "",
    nombre: "",
    apellido: "",
    telefono: "",
    rolOperativo: "",
    idUsuario: null,
    disponibilidad: 1,
    id_estado: 1,
  });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [successToast, setSuccessToast] = useState({
    visible: false,
    title: "",
    message: "",
  });

  const loadEmployees = async () => {
    setLoading(true);
    setError("");
    try {
      const [employeeRes, userRes, roleRes, customerRes] = await Promise.all([
        authFetch(EMPLOYEE_ENDPOINT),
        authFetch(USER_ENDPOINT),
        authFetch(ROLE_ENDPOINT),
        authFetch(CUSTOMER_ENDPOINT),
      ]);

      if (!employeeRes.ok || !userRes.ok || !roleRes.ok || !customerRes.ok) {
        throw new Error("Error al cargar datos del servidor");
      }

      const employeePayload = await employeeRes.json();
      const userPayload = await userRes.json();
      const rolePayload = await roleRes.json();
      const customerPayload = await customerRes.json();

      const lista = extractList(employeePayload);
      const rolesNormalizados = extractList(rolePayload).map(normalizeRole);
      const roleNameMap = rolesNormalizados.reduce((map, role) => {
        if (role.idRol) map[role.idRol.toString()] = role.nombreRol;
        return map;
      }, {});
      const usuarios = extractList(userPayload).map((user) =>
        normalizeUser(user, roleNameMap),
      );
      const clientes = extractList(customerPayload);

      // Guardar emails de clientes para bloqueo dinámico
      const emailsBloqueados = new Set(
        clientes.map((c) => (c.email || c.correo || "").toLowerCase().trim()),
      );
      setCustomerEmails(emailsBloqueados);

      const userEmailMap = usuarios.reduce((map, user) => {
        const userId = getUserId(user);
        if (userId) {
          map[userId] = user;
        }
        return map;
      }, {});

      const listRoles = rolesNormalizados.filter(
        (r) => Number(r.idRol) !== 1 && !isClientRole(r.idRol, r.nombreRol),
      );

      setAllUsers(usuarios);
      setRoles(listRoles);
      setEmpleados(
        lista
          .map((empleado) => mapEmployee(empleado, userEmailMap))
          .filter((empleado) => {
            const email = (empleado.email || "").toLowerCase().trim();
            return (
              !isClientRole(empleado.idRol, empleado.cargo) &&
              !empleado.idCliente &&
              !emailsBloqueados.has(email)
            );
          }),
      );
      setLoading(false);
    } catch (fetchError) {
      console.warn("Error al cargar empleados:", fetchError);
      setError("No se pudieron cargar los empleados.");
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    const handleEmployeeChanged = (e) => {
      loadEmployees();
      if (e?.detail) {
        showSuccessToast(
          e.detail.title || "Empleado guardado",
          e.detail.message || "El empleado ha sido guardado exitosamente."
        );
      }
    };
    window.addEventListener("employee-changed", handleEmployeeChanged);
    return () => {
      window.removeEventListener("employee-changed", handleEmployeeChanged);
    };
  }, []);

  const availableUsers = useMemo(() => {
    // 1. Obtener IDs de usuarios ya asignados convertidos a String para comparación segura
    return allUsers.filter((u) => {
      const userEmail = (u.email || u.correo || "").toLowerCase().trim();
      const roleId = getRoleId(u);
      const roleName = getRoleName(u).toLowerCase();

      // Condición 2: El correo NO debe pertenecer a la base de datos de clientes
      const isNotACustomerEmail = !customerEmails.has(userEmail);

      // Condición 3: No debe tener un rol asociado a entidades externas restringidas (excepto Clientes que ahora se permiten con privacidad)
      const hasRestrictedRole =
        Number(roleId) === 1 ||
        isClientRole(roleId, roleName) ||
        roleName.includes("proveedor") ||
        roleName.includes("externo");

      // Condición 4: No debe tener vínculos directos a otras tablas críticas (excepto clientes)
      const hasExternalLink =
        (u.idProveedor && u.idProveedor !== 0) ||
        (u.id_proveedor && u.id_proveedor !== 0);

      return isNotACustomerEmail && !hasRestrictedRole && !hasExternalLink;
    });
  }, [allUsers, customerEmails]);

  const filteredEmpleados = useMemo(() => {
    return empleados.filter((empleado) => {
      const search = searchTerm.toLowerCase();
      return (
        empleado.nombres.toLowerCase().includes(search) ||
        empleado.apellidos.toLowerCase().includes(search) ||
        empleado.cargo.toLowerCase().includes(search) ||
        empleado.email.toLowerCase().includes(search)
      );
    });
  }, [empleados, searchTerm]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredEmpleados.length / empleadosPerPage),
  );

  const paginatedEmpleados = useMemo(() => {
    const startIndex = (currentPage - 1) * empleadosPerPage;
    return filteredEmpleados.slice(startIndex, startIndex + empleadosPerPage);
  }, [filteredEmpleados, currentPage]);

  const getCargoStyle = (cargo) => {
    const normalized = cargo?.toLowerCase() || "";
    if (normalized.includes("admin")) return "bg-blue-100 text-blue-700";
    if (normalized.includes("ventas") || normalized.includes("vendedor"))
      return "bg-emerald-100 text-emerald-700";
    if (normalized.includes("bodega")) return "bg-amber-100 text-amber-700";
    return "bg-slate-100 text-slate-700";
  };

  const handleToggleStatus = async (empleado) => {
    const nextStatus = empleado.statusId === 1 ? 2 : 1;
    try {
      const response = await authFetch(`${EMPLOYEE_ENDPOINT}/${empleado.id}`, {
        method: "PUT",
        body: JSON.stringify({ idEstado: nextStatus }),
      });
      if (!response.ok) throw new Error("Error al cambiar el estado");

      setEmpleados((prev) =>
        prev.map((emp) =>
          emp.id === empleado.id
            ? {
                ...emp,
                statusId: nextStatus,
                estado: nextStatus === 1 ? "activo" : "inactivo",
              }
            : emp,
        ),
      );

      showSuccessToast(
        nextStatus === 1 ? "Empleado Activado" : "Empleado Inactivado",
        `El empleado "${empleado.nombres}" se ${nextStatus === 1 ? "activó" : "inactivó"} correctamente.`,
      );
    } catch (error) {
      console.error("Error al cambiar estado:", error);
    }
  };

  const toggleModal = (type, isOpen, empleado = null) => {
    setSelectedEmpleado(empleado);
    setModals((prev) => ({ ...prev, [type]: isOpen }));
    if (!isOpen) {
      setDeleteError(null);
      if (type === "create") {
        setCreateFormData({
          idTipoDocumento: 1,
          numeroDocumento: "",
          nombre: "",
          apellido: "",
          telefono: "",
          rolOperativo: "",
          idUsuario: null,
          disponibilidad: 1,
          id_estado: 1,
        });
      }
    }
  };

  const handleEmpleadoUpdated = (updatedEmpleado) => {
    setEmpleados((prev) =>
      prev.map((emp) =>
        emp.id === updatedEmpleado.id ? { ...emp, ...updatedEmpleado } : emp,
      ),
    );
  };

  const handleCreateInputChange = (e) => {
    const { name, value } = e.target;
    setCreateFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateSelectChange = (name, value) => {
    setCreateFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateSubmit = async () => {
    setCreateLoading(true);
    try {
      const payload = {
        ...createFormData,
        idUsuario: createFormData.idUsuario
          ? parseInt(createFormData.idUsuario)
          : null,
      };
      const response = await authFetch(EMPLOYEE_ENDPOINT, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Error al crear empleado");
      const newEmpleadoRaw = await response.json();
      const mapped = mapEmployee(newEmpleadoRaw.data || newEmpleadoRaw);
      setEmpleados((prev) => [mapped, ...prev]);
      return true;
    } catch (error) {
      console.error(error);
      return false;
    } finally {
      setCreateLoading(false);
    }
  };

  const showSuccessToast = (title, message) => {
    setSuccessToast({ visible: true, title, message });
    setTimeout(
      () => setSuccessToast((prev) => ({ ...prev, visible: false })),
      4500,
    );
  };

  const handleEmpleadoSaveSuccess = (name, isNew = false) => {
    showSuccessToast(
      isNew ? "Empleado registrado" : "Empleado actualizado",
      isNew
        ? `"${name}" ha sido dado de alta correctamente.`
        : `Los cambios se aplicaron correctamente.`,
    );
  };

  const handleDeleteConfirm = async () => {
    if (!selectedEmpleado) return;
    try {
      const response = await authFetch(
        `${EMPLOYEE_ENDPOINT}/${selectedEmpleado.id}`,
        { method: "DELETE" },
      );
      if (response.status === 409) {
        setDeleteError(
          "No se puede eliminar el empleado porque tiene historial vinculado.",
        );
        return;
      }
      if (!response.ok) throw new Error("Error al eliminar");
      setEmpleados((prev) =>
        prev.filter((emp) => emp.id !== selectedEmpleado.id),
      );
      toggleModal("delete", false);
      showSuccessToast("Empleado eliminado", "El registro ha sido eliminado.");
    } catch (error) {
      setDeleteError("Error inesperado al intentar eliminar.");
    }
  };

  return (
    <div className="p-8 space-y-6 bg-transparent dark:bg-slate-950 min-h-screen transition-colors duration-300">
      <PageHeader
        icon={UserCog}
        title="Gestión de Empleados"
        subtitle="Administra los empleados de MSG Repuestos"
        buttonText="Registrar Empleado"
        onButtonClick={() => openWindow("employee-create", { title: "Registrar Nuevo Empleado", type: "employee-create", size: { width: 680, height: 550 } })}
        createPermission="Crear Empleado"
      />

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700/60 overflow-hidden flex flex-col">
        <TableToolbar
          title="Empleados"
          count={filteredEmpleados.length}
          searchTerm={searchTerm}
          onSearchChange={(val) => {
            setSearchTerm(val);
            setCurrentPage(1);
          }}
          placeholder="Buscar empleado..."
        />

        {loading ? (
          <div className="py-20 text-center text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mx-auto" />
            <p className="mt-3">Cargando datos...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 bg-red-50">{error}</div>
        ) : (
          <EmployeeTable
            empleados={paginatedEmpleados}
            onView={(emp) => toggleModal("view", true, emp)}
            onEdit={(emp) => openWindow(`employee-edit-${emp.id}`, { title: `Editar Empleado: ${emp.nombres}`, type: "employee-edit", data: emp, size: { width: 680, height: 550 } })}
            onDelete={(emp) => toggleModal("delete", true, emp)}
            onToggleStatus={handleToggleStatus}
            getCargoStyle={getCargoStyle}
            authFetch={authFetch}
          />
        )}

        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      <SuccessToast
        visible={successToast.visible}
        title={successToast.title}
        message={successToast.message}
        onClose={() => setSuccessToast((prev) => ({ ...prev, visible: false }))}
      />

      <EmployeeDetailsModal
        isOpen={modals.view}
        onClose={() => toggleModal("view", false)}
        empleado={selectedEmpleado}
        getCargoStyle={getCargoStyle}
      />

      <EmployeeEditModal
        isOpen={modals.edit}
        onClose={() => toggleModal("edit", false)}
        empleado={selectedEmpleado}
        roles={roles}
        availableUsers={availableUsers}
        usedUserIds={Array.from(
          new Set(
            empleados
              .map((e) => e.idUsuario)
              .filter((id) => id !== null && id !== undefined),
          ),
        )}
        onEmpleadoUpdated={handleEmpleadoUpdated}
        onSaveSuccess={handleEmpleadoSaveSuccess}
      />

      <ConfirmActionModal
        isOpen={modals.delete}
        onClose={() => toggleModal("delete", false)}
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
        title="Confirmar eliminación"
        description="Esta acción es permanente y no se puede deshacer."
        itemName={
          selectedEmpleado
            ? `${selectedEmpleado.nombres} ${selectedEmpleado.apellidos}`
            : ""
        }
        itemSubtitle={selectedEmpleado?.cargo || "Sin cargo"}
        itemId={selectedEmpleado?.id}
        alertMessage={
          <>
            ¿Seguro que deseas eliminar al empleado{" "}
            <strong>
              {selectedEmpleado
                ? `${selectedEmpleado.nombres} ${selectedEmpleado.apellidos}`
                : ""}
            </strong>
            ?<br />
            <br />
            <span className="text-xs text-gray-500 font-normal">
              Al eliminarlo, se perderán sus accesos operativos. Si tiene
              historial vinculado (ventas, rutas), la operación será bloqueada.
            </span>
          </>
        }
        variant="danger"
        error={deleteError}
      />

      <EmployeeCreateModal
        isOpen={modals.create}
        onClose={() => toggleModal("create", false)}
        formData={createFormData}
        roles={roles}
        availableUsers={availableUsers}
        onInputChange={handleCreateInputChange}
        onSelectChange={handleCreateSelectChange}
        onSubmit={handleCreateSubmit}
        loading={createLoading}
        onSaveSuccess={(name) => handleEmpleadoSaveSuccess(name, true)}
      />
    </div>
  );
};

export default GestionEmpleados;

