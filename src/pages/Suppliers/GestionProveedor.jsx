import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Truck, Loader2 } from "lucide-react";
import PageHeader from "../../components/shared/PageHeader";
import TableToolbar from "../../components/shared/TableToolbar";
import TablePagination from "../../components/shared/TablePagination";
import SuccessToast from "../../components/ui/SuccessToast";
import { SupplierTable } from "./components/SupplierTable";

import SupplierDetailsModal from "./components/SupplierDetailsModal";
import { ConfirmActionModal } from "../../components/shared/ConfirmActionModal";
import { useModalDock } from "../../contexts/ModalDockContext";


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

const SUPPLIER_ENDPOINT = "/api/suppliers";

const mapSupplier = (proveedor) => ({
  id: proveedor.idProveedor || "",
  nombre: proveedor.nombreEmpresa || "",
  nit: proveedor.numeroDocumento || "",
  direccion: proveedor.direccion || "",
  telefono: proveedor.telefono || "",
  email: proveedor.email || "",
  contactoNombre: proveedor.contacto || "",
  condiciones: proveedor.condicionesComerciales || "",
  estado: proveedor.idEstado === 1 ? "activo" : "inactivo",
  statusId: proveedor.idEstado ?? 1,
  tipoDocumento: proveedor.tipoDocumento?.sigla || "",
  ciudad: proveedor.municipio?.name || "",
  departamento: proveedor.municipio?.departamento?.name || "",
  idTipoDocumento: proveedor.idTipoDocumento || 2,
  municipioId: proveedor.municipioId || proveedor.municipio?.id || "",
  departamentoId: proveedor.municipio?.departamento?.id || "",
});

const GestionProveedor = () => {
  const { openWindow } = useModalDock();
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const proveedoresPerPage = 8;

  const [selectedProveedor, setSelectedProveedor] = useState(null);
  const [modals, setModals] = useState({
    view: false,
    edit: false,
    delete: false,
    create: false,
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    id_tipo_documento: 2,
    numero_documento: "",
    nombre_empresa: "",
    contacto: "",
    telefono: "",
    email: "",
    direccion: "",
    condiciones_comerciales: "",
    id_estado: 1,
    id_departamento: "",
    id_municipio: "",
  });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const [successToast, setSuccessToast] = useState({
    visible: false,
    title: "",
    message: "",
  });

  const loadSuppliers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await authFetch(SUPPLIER_ENDPOINT);

      if (!response.ok) {
        throw new Error("Error al cargar datos del servidor");
      }

      const payload = await response.json();

      const rawData =
        payload?.data ||
        payload?.suppliers ||
        payload?.proveedores ||
        payload ||
        [];

      const lista = Array.isArray(rawData) ? rawData : [];

      setProveedores(lista.map((prov) => mapSupplier(prov)));
      setLoading(false);
    } catch (fetchError) {
      console.warn("Error al cargar proveedores:", fetchError);
      setError("No se pudieron cargar los proveedores.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  useEffect(() => {
    const handleRefresh = (e) => {
      loadSuppliers();
      if (e?.detail) {
        showSuccessToast(
          e.detail.title || "Proveedor guardado",
          e.detail.message || "El proveedor ha sido guardado exitosamente."
        );
      }
    };
    window.addEventListener("supplier-changed", handleRefresh);
    return () => window.removeEventListener("supplier-changed", handleRefresh);
  }, [loadSuppliers]);

  const filteredProveedores = useMemo(() => {
    return proveedores.filter((proveedor) => {
      const search = searchTerm.toLowerCase();
      return (
        proveedor.nombre.toLowerCase().includes(search) ||
        proveedor.nit.toLowerCase().includes(search) ||
        proveedor.email.toLowerCase().includes(search) ||
        proveedor.telefono.toLowerCase().includes(search)
      );
    });
  }, [proveedores, searchTerm]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProveedores.length / proveedoresPerPage),
  );

  const paginatedProveedores = useMemo(() => {
    const startIndex = (currentPage - 1) * proveedoresPerPage;
    return filteredProveedores.slice(
      startIndex,
      startIndex + proveedoresPerPage,
    );
  }, [filteredProveedores, currentPage]);

  const handleToggleStatus = async (proveedor) => {
    const nextStatus = proveedor.statusId === 1 ? 2 : 1;
    try {
      const response = await authFetch(`${SUPPLIER_ENDPOINT}/${proveedor.id}`, {
        method: "PUT",
        body: JSON.stringify({ id_estado: nextStatus }),
      });
      if (!response.ok) throw new Error("Error al cambiar el estado");

      setProveedores((prev) =>
        prev.map((p) =>
          p.id === proveedor.id
            ? {
                ...p,
                statusId: nextStatus,
                estado: nextStatus === 1 ? "activo" : "inactivo",
              }
            : p,
        ),
      );

      showSuccessToast(
        nextStatus === 1 ? "Proveedor Activado" : "Proveedor Inactivado",
        `El proveedor "${proveedor.nombre}" se ${nextStatus === 1 ? "activó" : "inactivó"} correctamente.`,
      );
    } catch (error) {
      console.error("Error al cambiar estado:", error);
    }
  };

  const toggleModal = (type, isOpen, proveedor = null) => {
    setSelectedProveedor(proveedor);
    setModals((prev) => ({ ...prev, [type]: isOpen }));
    if (!isOpen) {
      setDeleteError(null);
      if (type === "create") {
        setCreateFormData({
          id_tipo_documento: 2,
          numero_documento: "",
          nombre_empresa: "",
          contacto: "",
          telefono: "",
          email: "",
          direccion: "",
          condiciones_comerciales: "",
          id_estado: 1,
          id_departamento: "",
          id_municipio: "",
        });
      }
    }
  };

  const showSuccessToast = (title, message) => {
    setSuccessToast({ visible: true, title, message });
    setTimeout(
      () => setSuccessToast((prev) => ({ ...prev, visible: false })),
      4500,
    );
  };

  const handleCreateInputChange = (newFormData) => {
    setCreateFormData(newFormData);
  };

  const handleCreateSubmit = async () => {
    setCreateLoading(true);
    try {
      const response = await authFetch(SUPPLIER_ENDPOINT, {
        method: "POST",
        body: JSON.stringify(createFormData),
      });
      if (!response.ok) throw new Error("Error al crear proveedor");
      const newSupplierRaw = await response.json();
      const mapped = mapSupplier(newSupplierRaw.data || newSupplierRaw);
      setProveedores((prev) => [mapped, ...prev]);
      return true;
    } catch (error) {
      console.error(error);
      return false;
    } finally {
      setCreateLoading(false);
    }
  };

  const handleSupplierUpdated = (updatedSupplierName) => {
    // Recargar datos o actualizar localmente
    // Para simplificar y asegurar consistencia con el mapeo, lo ideal es recargar la lista
    const loadSuppliers = async () => {
      try {
        const response = await authFetch(SUPPLIER_ENDPOINT);
        if (response.ok) {
          const payload = await response.json();
          const rawData =
            payload?.data ||
            payload?.suppliers ||
            payload?.proveedores ||
            payload ||
            [];
          setProveedores(rawData.map((prov) => mapSupplier(prov)));
        }
      } catch (err) {
        console.error("Error al refrescar proveedores:", err);
      }
    };
    loadSuppliers();
    handleSupplierSaveSuccess(updatedSupplierName, false);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedProveedor) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const response = await authFetch(
        `${SUPPLIER_ENDPOINT}/${selectedProveedor.id}`,
        { method: "DELETE" },
      );

      if (response.status === 409) {
        setDeleteError(
          "El proveedor tiene historial vinculado (compras, etc.) y no se puede eliminar.",
        );
        return;
      }

      if (!response.ok) throw new Error("Error al eliminar");

      setProveedores((prev) =>
        prev.filter((p) => p.id !== selectedProveedor.id),
      );
      toggleModal("delete", false);
      showSuccessToast(
        "Proveedor eliminado",
        "El registro ha sido eliminado correctamente.",
      );
    } catch (err) {
      setDeleteError(
        "Ocurrió un error inesperado al intentar eliminar el registro.",
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const mapSupplierToForm = (p) => ({
    id: p.id,
    id_tipo_documento: p.idTipoDocumento ? p.idTipoDocumento.toString() : "2",
    numero_documento: p.nit || "",
    nombre_empresa: p.nombre || "",
    contacto: p.contactoNombre || "",
    telefono: p.telefono || "",
    email: p.email || "",
    direccion: p.direccion || "",
    condiciones_comerciales: p.condiciones || "",
    id_estado: p.statusId || 1,
    id_departamento: p.departamentoId ? p.departamentoId.toString() : "",
    id_municipio: p.municipioId ? p.municipioId.toString() : "",
  });

  const handleCreateSupplier = () => {
    openWindow("supplier-create", {
      title: "Registrar Nuevo Proveedor",
      type: "supplier-create",
      size: { width: 640, height: 500 },
    });
  };

  const handleSupplierSaveSuccess = (name, isNew = false) => {
    showSuccessToast(
      isNew ? "Proveedor registrado" : "Proveedor actualizado",
      isNew
        ? `"${name}" ha sido dado de alta correctamente.`
        : `Los cambios se aplicaron correctamente.`,
    );
  };

  return (
    <div className="p-8 space-y-6 bg-transparent dark:bg-slate-950 min-h-screen transition-colors duration-300">
      <PageHeader
        icon={Truck}
        title="Gestión de Proveedores"
        subtitle="Administra los proveedores de repuestos y servicios"
        buttonText="Registrar Proveedor"
        onButtonClick={handleCreateSupplier}
        createPermission="Crear Proveedor"
      />

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700/60 overflow-hidden flex flex-col">
        <TableToolbar
          title="Proveedores"
          count={filteredProveedores.length}
          searchTerm={searchTerm}
          onSearchChange={(val) => {
            setSearchTerm(val);
            setCurrentPage(1);
          }}
          placeholder="Buscar proveedor..."
        />

        {loading ? (
          <div className="py-20 text-center text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
            <p className="mt-3">Cargando proveedores...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 bg-red-50">{error}</div>
        ) : (
          <SupplierTable
            proveedores={paginatedProveedores}
            onView={(prov) => toggleModal("view", true, prov)}
            onEdit={(prov) =>
              openWindow(`supplier-edit-${prov.id}`, {
                title: `Editar Proveedor: ${prov.nombre}`,
                type: "supplier-edit",
                data: mapSupplierToForm(prov),
                size: { width: 640, height: 500 },
              })
            }
            onDelete={(prov) => toggleModal("delete", true, prov)}
            onToggleStatus={handleToggleStatus}
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

      <SupplierDetailsModal
        isOpen={modals.view}
        onClose={() => toggleModal("view", false)}
        proveedor={selectedProveedor}
      />

      <ConfirmActionModal
        isOpen={modals.delete}
        onClose={() => toggleModal("delete", false)}
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
        title="Confirmar eliminación"
        description="Esta acción es permanente y no se puede deshacer."
        itemName={selectedProveedor?.nombre}
        itemSubtitle={selectedProveedor?.email}
        itemId={selectedProveedor?.id}
        alertMessage={
          <>
            ¿Seguro que deseas eliminar al proveedor{" "}
            <strong>{selectedProveedor?.nombre}</strong>?<br />
            <br />
            <span className="text-xs text-gray-500 font-normal">
              El registro será borrado físicamente de la base de datos. Si tiene
              compras o historial asociado, la operación será bloqueada.
            </span>
          </>
        }
        variant="danger"
        error={deleteError}
      />
    </div>
  );
};

export default GestionProveedor;

