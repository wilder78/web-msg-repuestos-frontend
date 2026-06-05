import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { handleUnauthorized } from "../../lib/auth-utils";
import { Users, Search } from "lucide-react";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import SuccessToast from "../../components/ui/SuccessToast";
import PageHeader from "../../components/shared/PageHeader";
import { CustomerTable } from "./components/CustomerTable";
import { CustomerCreateModal } from "./components/CustomerCreateModal";
import CustomerDetailsModal from "./components/CustomerDetailsModal";
import CustomerEditModal from "./components/CustomerEditModal";
import { ConfirmActionModal } from "../../components/shared/ConfirmActionModal";
import { ConflictActionModal } from "../../components/shared/ConflictActionModal";
import { useModalDock } from "../../contexts/ModalDockContext";

const PAGE_SIZE = 8;

const authFetch = (url, options = {}) => {
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });
};

export default function GestionClientes() {
  const { openWindow } = useModalDock();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const q = searchParams.get("search") || searchParams.get("id");
    if (q) {
      setSearchTerm(q);
      setCurrentPage(1);
    }
  }, [searchParams]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // ✅ Estados para el modal de detalles
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const [toastConfig, setToastConfig] = useState({
    visible: false,
    title: "",
    message: "",
  });

  // ✅ Estados para el modal de edición
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEditCustomer, setSelectedEditCustomer] = useState(null);

  // ✅ Estados para el modal de eliminación
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDeleteCustomer, setSelectedDeleteCustomer] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ✅ Estados para modal de conflicto (historial de compras)
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const [conflictCustomer, setConflictCustomer] = useState(null);

  const showSuccessToast = (title, message) => {
    setToastConfig({ visible: true, title, message });
    setTimeout(
      () => setToastConfig((prev) => ({ ...prev, visible: false })),
      4500,
    );
  };

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        setCustomers([]);
        return;
      }

      const response = await fetch("/api/customers", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        return;
      }
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        setError(errData?.message || `Error del servidor: ${response.status}`);
        setCustomers([]);
        return;
      }

      const data = await response.json();
      let list = Array.isArray(data)
        ? data
        : (data?.data ?? data?.content ?? []);

      // Normalización de estados (1: Activo, 2: Inactivo) y IDs
      const mappedList = list.map((c) => ({
        ...c,
        idCliente: c.idCliente || c.id,
        activo: c.activo === true || c.activo === 1 || c.idEstado === 1 ? 1 : 2,
      }));

      setCustomers(mappedList);
    } catch (err) {
      setError(
        err.name === "TypeError"
          ? "No se pudo conectar con el servidor."
          : "Ocurrió un error inesperado.",
      );
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();

    const handleRefresh = (e) => {
      fetchCustomers();
      if (e?.detail) {
        showSuccessToast(
          e.detail.title || "Cliente guardado",
          e.detail.message || "El cliente ha sido guardado exitosamente."
        );
      }
    };
    window.addEventListener("customer-changed", handleRefresh);
    return () => window.removeEventListener("customer-changed", handleRefresh);
  }, [fetchCustomers]);

  // ✅ Handler para abrir detalles
  const handleViewDetails = (customer) => {
    setSelectedCustomer(customer);
    setIsDetailsModalOpen(true);
  };

  const filteredCustomers = useMemo(() => {
    if (!searchTerm.trim()) return customers;
    const term = searchTerm.toLowerCase();
    return customers.filter((c) =>
      [c.razonSocial, c.email, c.numeroDocumento, c.tipoCliente]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [customers, searchTerm]);

  const totalPages = Math.ceil(filteredCustomers.length / PAGE_SIZE);
  const showPagination = filteredCustomers.length > PAGE_SIZE;
  const paginated = showPagination
    ? filteredCustomers.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE,
      )
    : filteredCustomers;

  const handleCustomerCreated = (customerName) => {
    setIsModalOpen(false);
    fetchCustomers();
    showSuccessToast(
      "Operación exitosa",
      `El cliente "${customerName}" ha sido procesado correctamente.`,
    );
  };

  // ✅ HANDLERS PARA EDICIÓN
  const handleEditClick = (customer) => {
    openWindow(`customer-edit-${customer.idCliente || customer.id}`, {
      title: `Editar Cliente: ${customer.razonSocial}`,
      type: "customer-edit",
      data: customer,
      size: { width: 640, height: 500 },
    });
  };

  const handleCustomerUpdated = (updatedData) => {
    setCustomers((prev) =>
      prev.map((c) =>
        c.idCliente === updatedData.idCliente ? { ...c, ...updatedData } : c,
      ),
    );
    showSuccessToast(
      "Cambios guardados",
      `Los datos de "${updatedData.razonSocial}" se actualizaron con éxito.`,
    );
    fetchCustomers(); // Refrescamos para asegurar sincronía con el backend
  };

  // ✅ HANDLERS PARA ELIMINACIÓN
  const handleDeleteClick = (customer) => {
    setSelectedDeleteCustomer(customer);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedDeleteCustomer) return;

    try {
      setIsDeleting(true);
      const clientId =
        selectedDeleteCustomer.idCliente || selectedDeleteCustomer.id;
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");

      const response = await fetch(`/api/customers/${clientId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // 1. Manejo de respuesta JSON segura
      const data = await response.json().catch(() => ({}));

      // 2. Manejo específico para Conflicto (Historial) - SIN ERROR EN CONSOLA
      if (response.status === 409) {
        setConflictCustomer(selectedDeleteCustomer);
        setIsConflictModalOpen(true);
        setIsDeleteModalOpen(false);
        return; // Salimos de la función elegantemente
      }

      // 3. Manejo de otros errores (400, 404, 500)
      if (!response.ok) {
        throw new Error(data.message || "Error al procesar la solicitud");
      }

      // 4. ÉXITO
      showSuccessToast(
        "Registro eliminado",
        `El cliente "${selectedDeleteCustomer.razonSocial}" ha sido removido del sistema.`,
      );

      setIsDeleteModalOpen(false);
      setSelectedDeleteCustomer(null);
      fetchCustomers();
    } catch (error) {
      // Solo se registrarán en consola errores reales (red, 500, crash de código)
      console.error("Critical Delete Error:", error.message);

      // Opcional: Mostrar un toast de error genérico para el usuario
      // showErrorToast("Error", error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async (customer) => {
    const nextStatus = customer.activo === 1 ? 2 : 1;
    const clientId = customer.idCliente || customer.id;

    if (!clientId) return;

    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      const response = await fetch(`/api/customers/${clientId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idEstado: nextStatus, // Estandarizado con otros módulos
          activo: nextStatus === 1, // Booleano para el backend de clientes
        }),
      });

      if (!response.ok) throw new Error("Error al cambiar estado");

      setCustomers((prev) =>
        prev.map((c) =>
          (c.idCliente || c.id) === clientId ? { ...c, activo: nextStatus } : c,
        ),
      );

      showSuccessToast(
        nextStatus === 1 ? "Cliente activado" : "Cliente inactivado",
        `El cliente "${customer.razonSocial}" se ha ${nextStatus === 1 ? "activado" : "inactivado"} correctamente.`,
      );
    } catch (err) {
      console.error("Error al cambiar estado:", err);
    }
  };
  return (
    <div className="p-8 space-y-8 bg-slate-50 dark:bg-zinc-950 min-h-screen text-slate-900 dark:text-slate-100">
      <SuccessToast
        visible={toastConfig.visible}
        title={toastConfig.title}
        message={toastConfig.message}
        onClose={() => setToastConfig((prev) => ({ ...prev, visible: false }))}
      />

      <PageHeader
        icon={Users}
        title="Gestión de Clientes"
        subtitle="Control de cartera y base de datos maestra"
        buttonText="Registrar Cliente"
        onButtonClick={() => openWindow("customer-create", { title: "Registrar Cliente", type: "customer-create", size: { width: 640, height: 500 } })}
        createPermission="Crear Cliente"
      />

      {error && !loading && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 px-5 py-3 rounded-lg flex items-center justify-between text-sm font-medium">
          <span>⚠️ {error}</span>
          <button
            onClick={fetchCustomers}
            className="ml-4 text-red-600 underline hover:text-red-800"
          >
            Reintentar
          </button>
        </div>
      )}

      <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-slate-950/40 overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700/60">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                Lista de Clientes
              </h3>
              <p className="text-sm text-slate-400 dark:text-zinc-400 font-medium">
                {loading
                  ? "Sincronizando..."
                  : `${filteredCustomers.length} registros encontrados`}
              </p>
            </div>
            <div className="relative w-full md:w-80">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500"
                size={18}
              />
              <Input
                placeholder="Buscar por Razón Social o NIT..."
                className="pl-10 bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-zinc-800 transition-all focus:ring-2 focus:ring-emerald-500/20"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
        </div>

        <CustomerTable
          customers={paginated}
          loading={loading}
          onRefresh={fetchCustomers}
          onView={handleViewDetails}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick} // ✅ PASAR PROP DE ELIMINACIÓN
          onToggleStatus={handleToggleStatus}
          authFetch={authFetch}
        />

        {showPagination && (
          <div className="p-4 bg-slate-50/50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-700/60 flex justify-center items-center gap-4 text-sm font-bold text-slate-600 dark:text-zinc-400">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="disabled:opacity-50 disabled:cursor-not-allowed hover:text-slate-900 dark:hover:text-white"
            >
              Anterior
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1.5 rounded-lg border shadow-sm ${
                  page === currentPage
                    ? "bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50"
                    : "bg-white dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border-slate-200 dark:border-zinc-700 hover:text-slate-800 dark:hover:text-white"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="disabled:opacity-50 disabled:cursor-not-allowed hover:text-slate-900 dark:hover:text-white"
            >
              Siguiente
            </button>
          </div>
        )}
      </Card>

      {/* ✅ Modal de Detalles del Cliente */}
      <CustomerDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        cliente={selectedCustomer}
      />

      {/* ✅ Modal de Edición del Cliente */}
      <CustomerEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedEditCustomer(null);
        }}
        cliente={selectedEditCustomer}
        onCustomerUpdated={handleCustomerUpdated}
        authFetch={authFetch}
      />

      <ConfirmActionModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedDeleteCustomer(null);
        }}
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
        title="Confirmar eliminación"
        description="Esta acción es permanente y no se puede deshacer."
        itemName={selectedDeleteCustomer?.razonSocial}
        itemSubtitle={
          selectedDeleteCustomer?.numeroDocumento
            ? `Doc: ${selectedDeleteCustomer.numeroDocumento}`
            : "Sin documento"
        }
        itemId={selectedDeleteCustomer?.idCliente || selectedDeleteCustomer?.id}
        alertMessage={
          <>
            ¿Seguro que deseas eliminar al cliente{" "}
            <strong>{selectedDeleteCustomer?.razonSocial}</strong>?<br />
            <br />
            <span className="text-xs text-gray-500 font-normal">
              Al eliminarlo, perderá el acceso a la plataforma. Si el cliente
              tiene historial de compras o créditos, la operación será
              bloqueada.
            </span>
          </>
        }
        variant="danger"
      />

      {/* ✅ ESTO ES LO QUE DEBE IR: El nuevo componente global */}
      <ConflictActionModal
        isOpen={isConflictModalOpen}
        onClose={() => {
          setIsConflictModalOpen(false);
          setConflictCustomer(null);
        }}
        itemName={conflictCustomer?.razonSocial}
        entityName="este cliente"
        suggestion="cambiar su estado a 'Inactivo' en la tabla principal para restringir sus operaciones sin perder el historial."
      />

      {/* Modal de Registro */}
      <CustomerCreateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleCustomerCreated}
        authFetch={authFetch}
      />
    </div>
  );
}

