import React, { useState, useEffect } from "react";
import { CreditCard } from "lucide-react";

import { useCreditos } from "../../hooks/useCreditos";
import PageHeader from "../../components/shared/PageHeader";
import TableToolbar from "../../components/shared/TableToolbar";
import TablePagination from "../../components/shared/TablePagination";
import { useModalDock } from "../../contexts/ModalDockContext";

import CreditTable from "./components/CreditTable";
import CreditDetailsModal from "./components/CreditDetailsModal";
import CreditDeleteModal from "./components/CreditDeleteModal";
import SuccessToast from "../../components/ui/SuccessToast";


const GestionCreditos = () => {
    const { creditos, saveToStorage, loading, error, refresh, authFetch } = useCreditos();
    const { openWindow } = useModalDock();

    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const [selectedCredit, setSelectedCredit] = useState(null);
    const [modals, setModals] = useState({
        view: false,
        delete: false,
    });

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
        }, 5500);
    };

    useEffect(() => {
        const handleChanged = (e) => {
            refresh();
            if (e?.detail) {
                showSuccessToast(
                    e.detail.title || "Crédito guardado",
                    e.detail.message || "El crédito ha sido guardado exitosamente."
                );
            }
        };
        window.addEventListener("credit-changed", handleChanged);
        return () => window.removeEventListener("credit-changed", handleChanged);
    }, [refresh]);

    const handleStatusChangeSuccess = (creditId, nextStatus) => {
        saveToStorage(
            creditos.map((credit) =>
                credit.idCredito === creditId
                    ? {
                        ...credit,
                        idEstado: nextStatus,
                        id_estado: nextStatus,
                        estado: nextStatus === 1 ? "Activo" : "Suspendido",
                    }
                    : credit
            )
        );
        showToast(
            nextStatus === 1 ? "Crédito activado" : "Crédito inactivado",
            "El estado del crédito se actualizó correctamente."
        );
    };

    const toggleModal = (type, isOpen, item = null) => {
        setSelectedCredit(item);
        if (type === "delete") setDeleteError(null);
        setModals((prev) => ({ ...prev, [type]: isOpen }));
    };


    const onDeleteSuccess = (deletedCreditId) => {
        saveToStorage(creditos.filter((c) => c.idCredito !== deletedCreditId));
        showToast(
            "Crédito Eliminado",
            `La línea de crédito #C-${deletedCreditId} ha sido eliminada permanentemente.`
        );
        toggleModal("delete", false);
    };

    const getInitials = (n) => (n || "").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "C";
    const getAvatarColor = (id) => {
        const colors = ["bg-emerald-500", "bg-blue-500", "bg-violet-500", "bg-amber-500", "bg-rose-500"];
        return colors[(id || 0) % colors.length];
    };

    const filtered = creditos.filter(
        (c) =>
            (c.clienteNombre || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(c.idCredito || "").includes(searchTerm) ||
            String(c.id_cliente || "").includes(searchTerm)
    );

    const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="p-8 space-y-6 bg-transparent dark:bg-slate-950 min-h-screen transition-colors duration-300 overflow-auto">
            <SuccessToast {...toastConfig} onClose={() => setToastConfig((prev) => ({ ...prev, visible: false }))} />

            <PageHeader
                icon={CreditCard}
                title="Gestión de Cartera y Créditos"
                subtitle="Asigna límites de crédito y supervisa consumos"
                buttonText="Asignar Crédito"
                onButtonClick={() => openWindow("credit-create", { title: "Asignar Nuevo Crédito", type: "credit-create" })}
                createPermission="Crear Crédito"
            />

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700/60 transition-colors duration-300 flex flex-col">
                <TableToolbar
                    title="Cartera Activa"
                    count={filtered.length}
                    searchTerm={searchTerm}
                    onSearchChange={(val) => { setSearchTerm(val); setCurrentPage(1); }}
                    placeholder="Buscar cliente o número de crédito..."
                />

                {error ? (
                    <div className="border-t border-red-100 bg-red-50 px-6 py-10 text-center">
                        <p className="font-semibold text-red-600">No se pudieron cargar los créditos.</p>
                        <p className="mt-1 text-sm text-red-500">{error}</p>
                        <button
                            type="button"
                            onClick={refresh}
                            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                        >
                            Reintentar
                        </button>
                    </div>
                ) : (
                    <CreditTable
                        data={paginated}
                        loading={loading}
                        authFetch={authFetch}
                        getAvatarColor={getAvatarColor}
                        getInitials={getInitials}
                        onView={(item) => toggleModal("view", true, item)}
                        onEdit={(item) => openWindow(`credit-edit-${item.idCredito}`, { title: `Ajustar Crédito #C-${item.idCredito}`, type: "credit-edit", data: item })}
                        onDelete={(item) => toggleModal("delete", true, item)}
                        onToggleStatus={handleStatusChangeSuccess}
                    />
                )}


                <TablePagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(filtered.length / itemsPerPage) || 1}
                    onPageChange={setCurrentPage}
                />
            </div>

            {/* MODALES */}
            <CreditDetailsModal
                isOpen={modals.view}
                onClose={() => toggleModal("view", false)}
                item={selectedCredit}
                getAvatarColor={getAvatarColor}
                getInitials={getInitials}
            />

            <CreditDeleteModal
                isOpen={modals.delete}
                onClose={() => toggleModal("delete", false)}
                item={selectedCredit}
                onSuccess={onDeleteSuccess}
            />

        </div>
    );
};

export default GestionCreditos;

