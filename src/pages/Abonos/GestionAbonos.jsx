import React, { useState } from "react";
import { HandCoins } from "lucide-react";
import { useAbonos } from "../../hooks/useAbonos";
import PageHeader from "../../components/shared/PageHeader";
import TableToolbar from "../../components/shared/TableToolbar";
import TablePagination from "../../components/shared/TablePagination";
import SuccessToast from "../../components/ui/SuccessToast";
import { toast } from "sonner";

import { useModalDock } from "../../contexts/ModalDockContext";
import AbonoTable from "./components/AbonoTable";
import AbonoDetailsModal from "./components/AbonoDetailsModal";
import AbonoCancelModal from "./components/AbonoCancelModal";
import PrintableDocument from "../../components/shared/PrintableDocument";

const INITIAL_CREATE_STATE = {
    idCliente: "",
    clienteNombre: "",
    idCredito: "",   // usado en abonos a línea de crédito
    idPedido: "",    // usado en abonos a pedido (contado)
    tipoAbono: "credito",
    montoAbono: "",
    metodoPago: "",
    referencia: "",
    descripcion: "",
    archivoAdjunto: null
};

const normalizeText = (value = "") =>
    value
        .toString()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();

const extractList = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (!payload || typeof payload !== "object") return [];

    for (const key of ["data", "orders", "pedidos", "content", "rows", "items", "results"]) {
        const value = payload[key];
        if (Array.isArray(value)) return value;
        if (value && typeof value === "object") {
            const nested = extractList(value);
            if (nested.length > 0) return nested;
        }
    }

    return [];
};

const getOrderStatusId = (order) =>
    Number(
        order?.id_estado_pedido ??
        order?.idEstado ??
        order?.id_estado ??
        order?.estado?.idEstado ??
        order?.estado?.idestado ??
        order?.estado?.id_estado ??
        1
    );

const getOrderStatusName = (order) =>
    order?.estado_despacho ||
    order?.estadoDespacho ||
    order?.estado?.nombreEstado ||
    order?.estado?.nombre_estado ||
    order?.estado?.nombre ||
    order?.nombreEstado ||
    "";

const getOrderTotal = (order) =>
    parseFloat(order?.total_neto ?? order?.totalNeto ?? order?.total ?? order?.valor_total ?? 0) || 0;

const getOrderPaid = (order) =>
    parseFloat(
        order?.total_abonado ??
        order?.totalAbonado ??
        order?.abonado ??
        order?.valor_abonado ??
        0
    ) || 0;

const getOrderPendingBalance = (order) => {
    const explicitBalance =
        order?.saldo_pendiente ??
        order?.saldoPendiente ??
        order?.saldo ??
        order?.valor_pendiente;

    if (explicitBalance !== undefined && explicitBalance !== null) {
        return Math.max(parseFloat(explicitBalance) || 0, 0);
    }

    return Math.max(getOrderTotal(order) - getOrderPaid(order), 0);
};

const isOrderAnulled = (order) => {
    const statusId = getOrderStatusId(order);
    const statusName = normalizeText(getOrderStatusName(order));
    return statusId === 3 || statusName.includes("anulad") || statusName.includes("cancelad");
};

const isOrderPaid = (order) => {
    return getOrderPendingBalance(order) <= 0;
};

const GestionAbonos = () => {
    const { abonos, loading, refresh, authFetch, getSimulatedUser } = useAbonos();
    const { openWindow } = useModalDock();

    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const [selectedAbono, setSelectedAbono] = useState(null);
    const [modals, setModals] = useState({
        view: false,
        cancel: false,
    });
    const [actionLoading, setActionLoading] = useState(false);

    React.useEffect(() => {
        const handleChanged = (e) => {
            refresh();
            if (e?.detail) {
                showSuccessToast(
                    e.detail.title || "Recaudo registrado",
                    e.detail.message || "El recaudo ha sido registrado exitosamente."
                );
            }
        };
        window.addEventListener("abono-changed", handleChanged);
        return () => window.removeEventListener("abono-changed", handleChanged);
    }, [refresh]);

    // Toast Configuración
    const [toastConfig, setToastConfig] = useState({
        visible: false,
        title: "",
        message: "",
        type: "success",
    });

    const showSuccessToast = (title, message) => {
        setToastConfig({ visible: true, title, message, type: "success" });
        setTimeout(() => {
            setToastConfig((prev) => ({ ...prev, visible: false }));
        }, 4500);
    };

    const showErrorToast = (title, message) => {
        setToastConfig({ visible: true, title, message, type: "error" });
        setTimeout(() => {
            setToastConfig((prev) => ({ ...prev, visible: false }));
        }, 4500);
    };

    const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8080/api").replace(/\/$/, "");

    const toggleModal = async (type, isOpen, item = null) => {
        if (type === "view" && isOpen && item) {
            // Intentar enriquecer con datos completos del cliente
            const clienteId = item.idCliente || item.id_cliente || item.cliente?.idCliente;
            if (clienteId && (!item.cliente?.direccion && !item.cliente?.municipio)) {
                try {
                    const res = await authFetch(`${API_URL}/customers/${clienteId}`);
                    if (res.ok) {
                        // getCustomerById retorna el objeto directo (sin wrapper .data)
                        const clienteCompleto = await res.json();
                        setSelectedAbono({ ...item, cliente: { ...(item.cliente || {}), ...clienteCompleto } });
                        setModals((prev) => ({ ...prev, [type]: isOpen }));
                        return;
                    }
                } catch {
                    // Si falla el fetch del cliente, mostrar igual con los datos disponibles
                }
            }
        }
        setSelectedAbono(item);
        setModals((prev) => ({ ...prev, [type]: isOpen }));
    };

    const onCreateSubmit = async () => {
        setActionLoading(true);
        try {
            const currentUser = getSimulatedUser();
            const montoAbono = parseFloat(createFormData.montoAbono);
            const pedidoId = createFormData.idPedido ? parseInt(createFormData.idPedido, 10) : null;

            console.log("[GestionAbonos] Preparando registro de abono", {
                idCliente: createFormData.idCliente,
                idCredito: createFormData.idCredito,
                pedidoId,
                montoIngresado: createFormData.montoAbono,
                montoNormalizado: montoAbono,
                metodoPago: createFormData.metodoPago,
                tipoAbono: createFormData.tipoAbono,
            });

            if (!pedidoId) {
                toast.warning("Por favor, seleccione el pedido al cual desea aplicar el abono antes de continuar");
                return false;
            }
            
            const payload = {
                id_cliente: parseInt(createFormData.idCliente, 10),
                id_credito: createFormData.idCredito ? parseInt(createFormData.idCredito, 10) : null,
                id_pedido: pedidoId,
                monto_abono: montoAbono,
                tipo_abono: createFormData.tipoAbono,
                metodo_pago: createFormData.metodoPago,
                referencia: createFormData.referencia || "N/A",
                descripcion: createFormData.descripcion || "Registro de abono a balance",
                id_usuario: currentUser?.idUsuario || 1
            };

            console.log("[GestionAbonos] Payload enviado a /abonos", payload);

            const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8080/api").replace(/\/$/, "");
            
            // 1. POST al Backend
            const res = await authFetch(`${API_URL}/abonos`, {
                method: "POST",
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || "Error al registrar el abono en el servidor.");
            }

            // 2. Refrescar lista y cerrar
            await refresh(); 
            
            toggleModal("create", false);
            
            showSuccessToast(
                "Recaudo Aplicado Correctamente", 
                `Se han procesado $${montoAbono.toFixed(2)} exitosamente. El cupo de crédito ha sido actualizado.`
            );
            
            // Forzar recarga de datos para ver el nuevo abono y el saldo actualizado en otros módulos
            window.location.reload(); 
            return true;
        } catch (error) {
            console.error("Error en registro de abono:", error);
            showErrorToast("No fue posible registrar el abono", error.message || "Ocurrió un error inesperado.");
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    const onCancelSubmit = async (id) => {
        setActionLoading(true);
        try {
            const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8080/api").replace(/\/$/, "");
            const res = await authFetch(`${API_URL}/abonos/${id}`, {
                method: "DELETE"
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || "No se pudo cancelar el abono.");
            }

            await refresh();
            toggleModal("cancel", false);
            
            showSuccessToast(
                "Abono Anulado", 
                `El recibo de caja ha sido cancelado y los saldos revertidos.`
            );
            return true;
        } catch (error) {
            console.error("Error al cancelar abono:", error);
            showErrorToast("No fue posible anular el abono", error.message || "Ocurrió un error inesperado.");
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    const getInitials = (n) => n?.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "C";
    const getAvatarColor = (id) => {
        const colors = ["bg-emerald-500", "bg-blue-500", "bg-indigo-500", "bg-violet-500", "bg-rose-500"];
        return colors[(id || 0) % colors.length];
    };

    const filtered = abonos.filter(
        (c) =>
            c.clienteNombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.idAbono?.toString().includes(searchTerm) ||
            c.referencia?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    );

    const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="p-8 space-y-6 bg-transparent dark:bg-slate-950 min-h-screen transition-colors duration-300 overflow-auto">
            <SuccessToast {...toastConfig} onClose={() => setToastConfig((prev) => ({ ...prev, visible: false }))} />

            <PageHeader
                icon={HandCoins}
                title="Centro de Recaudos y Abonos"
                subtitle="Registra los pagos y aportes de tus clientes para ajustar sus balances."
                buttonText="Registrar Recaudo"
                onButtonClick={() => openWindow("abono-create", { title: "Registrar Recaudo de Cartera", type: "abono-create" })}
                createPermission="Crear Abono"
            />

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 transition-colors duration-300 flex flex-col">
                <TableToolbar
                    title="Libro de Abonos Registrados"
                    count={filtered.length}
                    searchTerm={searchTerm}
                    onSearchChange={(val) => { setSearchTerm(val); setCurrentPage(1); }}
                    placeholder="Buscar por cliente, n° de folio o referencia..."
                />

                <AbonoTable
                    data={paginated}
                    loading={loading}
                    getAvatarColor={getAvatarColor}
                    getInitials={getInitials}
                    onView={(item) => toggleModal("view", true, item)}
                    onCancel={(item) => toggleModal("cancel", true, item)}
                    onPrint={(item) => {
                        setSelectedAbono(item);
                        // Pequeño delay para asegurar que el estado se actualizó antes de abrir/imprimir
                        setTimeout(() => window.print(), 100);
                    }}
                />

                <TablePagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(filtered.length / itemsPerPage) || 1}
                    onPageChange={setCurrentPage}
                />
            </div>

            {/* MODALES */}

            <AbonoDetailsModal
                isOpen={modals.view}
                onClose={() => toggleModal("view", false)}
                item={selectedAbono}
                getAvatarColor={getAvatarColor}
                getInitials={getInitials}
            />

            <AbonoCancelModal
                isOpen={modals.cancel}
                onClose={() => toggleModal("cancel", false)}
                abono={selectedAbono}
                onConfirm={onCancelSubmit}
                loading={actionLoading}
            />

            {/* Componente global para impresión */}
            <PrintableDocument 
                title="Recibo de Caja"
                folio={`RCP-${selectedAbono?.idAbono?.toString().padStart(4, "0")}`}
                date={selectedAbono?.fechaAbono ? new Date(selectedAbono.fechaAbono).toLocaleDateString() : ""}
                client={{
                    name: selectedAbono?.cliente?.razonSocial || selectedAbono?.clienteNombre || "Cliente",
                    id: selectedAbono?.cliente?.numeroDocumento || selectedAbono?.idCliente || "N/A",
                    docType: selectedAbono?.cliente?.tipoDocumento?.sigla || "NIT/CC",
                    address: selectedAbono?.cliente?.direccion || "No registrada",
                    city: selectedAbono?.cliente?.municipio?.nombre || selectedAbono?.cliente?.municipio?.name || selectedAbono?.cliente?.ciudad || "No registrada",
                    department: selectedAbono?.cliente?.municipio?.departamento?.nombre || selectedAbono?.cliente?.municipio?.departamento?.name || selectedAbono?.cliente?.departamento || "",
                    phone: selectedAbono?.cliente?.telefono || "",
                    email: selectedAbono?.cliente?.email || ""
                }}
                concept={selectedAbono?.idPedido ? `Abono a Pedido #${selectedAbono.idPedido}` : "Abono a Cartera de Crédito"}
                items={[{
                    description: selectedAbono?.descripcion || "Recaudo de cartera",
                    detail1: selectedAbono?.metodoPago || "Efectivo",
                    detail2: selectedAbono?.referencia || "N/A",
                    amount: selectedAbono?.montoAbono || 0
                }]}
                totals={{
                    subtotal: selectedAbono?.montoAbono || 0,
                    total: selectedAbono?.montoAbono || 0
                }}
                isCancelled={selectedAbono?.idEstado === 3}
                footerNote="Este documento es un soporte oficial de recaudo. Consérvelo para cualquier trámite."
            />
        </div>
    );
};

export default GestionAbonos;

