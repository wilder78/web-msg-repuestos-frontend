import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronDown, ClipboardList, Search } from "lucide-react";
import { useModalDock } from "../../contexts/ModalDockContext";

import { usePedidos } from "../../hooks/usePedidos";
import TablePagination from "../../components/shared/TablePagination";
import PageHeader from "../../components/shared/PageHeader";

import PedidoCreateModal from "./components/PedidoCreateModal";
import PedidoDetailsModal from "./components/PedidoDetailsModal";
import PedidoEditModal from "./components/PedidoEditModal";
import PedidoTable from "./components/PedidoTable";
import PedidoAbonosModal from "./components/PedidoAbonosModal";
import { AuthorityAuthModal } from "../../components/shared/AuthorityAuthModal";
import SuccessToast from "../../components/ui/SuccessToast";
import { ConfirmActionModal } from "../../components/shared/ConfirmActionModal";
import PrintableDocument from "../../components/shared/PrintableDocument";


const INITIAL_CREATE_STATE = {
    id_cliente: "",
    id_vendedor: "",
    nombreCliente: "",
    nombreVendedor: "",
    id_origen_pedido: "1",
    id_estado_pedido: "1",
    tipo_pago: "",
    notas: "",
    detalles: [],
};

const STATUS_FILTERS = [
    { value: "todos", label: "Todos" },
    { value: "proceso", label: "En proceso" },
    { value: "despachado", label: "Despachado" },
    { value: "cancelado", label: "Cancelado" },
    { value: "entregado", label: "Entregado" },
    { value: "pagado", label: "Pagado" },
];

const VALID_STATUS_KEYS = new Set(STATUS_FILTERS.map((filter) => filter.value));

const getPedidoStatusKey = (pedido) => {
    const status = Number(pedido?.idEstado ?? pedido?.id_estado_pedido);
    if (status === 2) return "despachado";
    if (status === 3) return "cancelado";
    if (status === 4) return "entregado";
    if (status === 5) return "pagado";
    return "proceso";
};

const formatPedidoCode = (pedido) => {
    const id = pedido?.idPedido ?? pedido?.id_pedido ?? pedido?.id;
    return id ? `PED-${String(id).padStart(3, "0")}` : "PED-000";
};

const getPedidoId = (pedido) => pedido?.idPedido ?? pedido?.id_pedido ?? pedido?.id;
const getPedidoStatus = (pedido) => Number(pedido?.idEstado ?? pedido?.id_estado_pedido ?? 1);
const API_BASE_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

const normalizeDetailForCompare = (detalle) => {
    const producto = detalle?.producto || {};
    const cantidad = Number(detalle?.cantidad ?? detalle?.cantidad_solicitada ?? 0);
    const precio = Number(detalle?.precio_unitario ?? detalle?.precio_venta ?? 0);
    const descuento = Number(detalle?.descuento_porcentaje ?? detalle?.descuento_aplicado ?? detalle?.descuento ?? 0);

    return {
        id_producto: String(
            detalle?.id_producto ||
            detalle?.idProducto ||
            producto.id_producto ||
            producto.idProducto ||
            producto.id ||
            ""
        ),
        cantidad,
        precio,
        descuento,
        codigo: detalle?.codigo || producto.referencia || detalle?.referenciaProducto || "",
        nombre: detalle?.nombreProducto || producto.nombre || "",
    };
};

const areDetailsEqual = (currentDetails = [], originalDetails = []) => {
    const current = currentDetails.map(normalizeDetailForCompare);
    const original = originalDetails.map(normalizeDetailForCompare);
    return JSON.stringify(current) === JSON.stringify(original);
};

const GestionPedidos = () => {
    const { pedidos, setPedidos, loading, error, refresh, authFetch } = usePedidos();
    const [searchParams] = useSearchParams();
    const { openWindow } = useModalDock();

    useEffect(() => {
        const handleOrderChanged = (e) => {
            refresh();
            if (e?.detail) {
                showToast(
                    e.detail.title || "Pedido guardado",
                    e.detail.message || "El pedido ha sido guardado exitosamente."
                );
            }
        };
        window.addEventListener("order-changed", handleOrderChanged);
        return () => {
            window.removeEventListener("order-changed", handleOrderChanged);
        };
    }, [refresh]);

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState(() => {
        const estado = searchParams.get("estado");
        return estado && VALID_STATUS_KEYS.has(estado) ? estado : "todos";
    });
    const [currentPage, setCurrentPage] = useState(1);
    const pedidosPerPage = 8;

    useEffect(() => {
        const q = searchParams.get("search") || searchParams.get("id");
        if (q) {
            setSearchTerm(q);
            setCurrentPage(1);
        }
    }, [searchParams]);

    useEffect(() => {
        const estado = searchParams.get("estado");
        if (estado && VALID_STATUS_KEYS.has(estado) && estado !== statusFilter) {
            setStatusFilter(estado);
            setCurrentPage(1);
        }
    }, [searchParams, statusFilter]);

    const [selectedPedido, setSelectedPedido] = useState(null);
    const [modals, setModals] = useState({
        create: false,
        edit: false,
        view: false,
        delete: false,
        abonos: false,
    });

    const [createFormData, setCreateFormData] = useState(INITIAL_CREATE_STATE);
    const [editFormData, setEditFormData] = useState({});
    const [actionLoading, setActionLoading] = useState(false);
    const [createError, setCreateError] = useState(null); 
    const [deleteError, setDeleteError] = useState(null);
    const [adminStatusRequest, setAdminStatusRequest] = useState({
        open: false,
        pedido: null,
        nextStatus: null,
    });
    const [adminPassword, setAdminPassword] = useState("");
    const [adminError, setAdminError] = useState("");
    const [adminLoading, setAdminLoading] = useState(false);

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

    // Handlers de éxito

    const handlePedidoSaveSuccess = (idPedido) => {
        showToast("Pedido actualizado", `Los cambios del pedido #${idPedido} se aplicaron correctamente.`);
    };

    const handlePedidoCreateSuccess = (idPedido) => {
        showToast("Pedido registrado", `El pedido #${idPedido} ha sido creado correctamente.`);
    };

    const handleStatusChangeSuccess = (pedidoId, nextStatus) => {
        const statusLabels = {
            1: "En Proceso",
            2: "Despachado",
            3: "Cancelado",
            4: "Entregado",
            5: "Pagado",
        };
        setPedidos((prev) =>
            prev.map((p) => ((p.idPedido || p.id_pedido) === pedidoId ? { ...p, id_estado_pedido: nextStatus, idEstado: nextStatus } : p))
        );
        showToast("Estado actualizado", `El pedido ahora está en estado ${statusLabels[nextStatus] || nextStatus}.`);
    };

    const getStoredUser = () => {
        const rawUser = localStorage.getItem("user") || sessionStorage.getItem("user");
        if (!rawUser) return {};

        try {
            return JSON.parse(rawUser);
        } catch {
            return {};
        }
    };

    const getPrintedByName = () => {
        const user = getStoredUser();
        const emp = user.empleado || user.Empleado || {};
        const nombre = emp.nombre || emp.nombres || user.nombre || user.nombreUsuario || "";
        const apellido = emp.apellido || emp.apellidos || user.apellido || "";
        return `${nombre} ${apellido}`.trim() || user.nombreUsuario || user.usuario?.nombreUsuario || "Usuario";
    };

    const verifyAdminPassword = async (password) => {
        const currentUser = getStoredUser();
        const email = currentUser.email || currentUser.correo || currentUser.usuario?.email;

        if (!email) {
            throw new Error("No se encontró el correo del usuario actual para validar la contraseña.");
        }

        const response = await fetch(`${API_BASE_URL}/users/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.message || data.error || "Contraseña administrativa incorrecta.");
        }

        const user = data.user || data.data?.user || data.data || {};
        const roleId = Number(
            user.idRol ??
            user.idrol ??
            user.id_rol ??
            data.idRol ??
            data.data?.idRol ??
            currentUser.idRol ??
            currentUser.idrol ??
            currentUser.id_rol
        );

        if (![1, 2].includes(roleId)) {
            throw new Error("El usuario autenticado no tiene permisos de administrador.");
        }

        const newToken = data.token || data.data?.token;
        if (newToken) {
            localStorage.setItem("token", newToken);
        }
    };

    const updatePedidoStatus = async (pedido, nextStatus) => {
        const pedidoId = getPedidoId(pedido);
        if (!pedidoId) throw new Error("No se encontró el ID del pedido.");

        const response = await authFetch(`/api/orders/${pedidoId}`, {
            method: "PUT",
            body: JSON.stringify({ id_estado_pedido: nextStatus }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || errorData.error || "No se pudo actualizar el estado.");
        }

        handleStatusChangeSuccess(pedidoId, nextStatus);
    };

    const handlePedidoStatusChange = async (pedido, nextStatus) => {
        const currentStatus = getPedidoStatus(pedido);
        if (currentStatus === 3 && Number(nextStatus) !== 3) {
            setAdminPassword("");
            setAdminError("");
            setAdminStatusRequest({ open: true, pedido, nextStatus });
            return;
        }

        await updatePedidoStatus(pedido, nextStatus);
    };

    const closeAdminStatusModal = () => {
        if (adminLoading) return;
        setAdminStatusRequest({ open: false, pedido: null, nextStatus: null });
        setAdminPassword("");
        setAdminError("");
    };

    const handleAdminStatusConfirm = async () => {
        setAdminLoading(true);
        setAdminError("");

        try {
            await verifyAdminPassword(adminPassword);
            await updatePedidoStatus(adminStatusRequest.pedido, adminStatusRequest.nextStatus);
            setAdminStatusRequest({ open: false, pedido: null, nextStatus: null });
            setAdminPassword("");
            setAdminError("");
        } catch (error) {
            setAdminError(error.message || "No se pudo autorizar el cambio de estado.");
        } finally {
            setAdminLoading(false);
        }
    };

    // Control de modales

    const toggleModal = (type, isOpen, pedido = null) => {
        setSelectedPedido(pedido);
        if (type === "edit" && pedido) {
            const cliente = pedido.cliente || {};
            const detalles = Array.isArray(pedido.detalles) ? pedido.detalles : [];
            setEditFormData({
                id_cliente: pedido.id_cliente || cliente.idCliente || "",
                id_vendedor:
                    pedido.id_vendedor ||
                    pedido.idVendedor ||
                    pedido.vendedor?.idUsuario ||
                    pedido.vendedor?.idusuario ||
                    pedido.vendedor?.id_usuario ||
                    "",
                nombreCliente: pedido.nombreCliente || cliente.razonSocial || "",
                nombreVendedor:
                    pedido.nombreVendedor ||
                    pedido.vendedorNombre ||
                    pedido.vendedor?.nombreUsuario ||
                    pedido.vendedor?.nombreusuario ||
                    pedido.vendedor?.nombre_usuario ||
                    pedido.id_vendedor ||
                    "",
                numeroDocumento: cliente.numeroDocumento || pedido.numeroDocumento || "",
                telefono: cliente.telefono || pedido.telefono || "",
                email: cliente.email || pedido.email || "",
                direccion: cliente.direccion || pedido.direccion || "",
                tipoCliente: cliente.tipoCliente || pedido.tipoCliente || "",
                id_origen_pedido: pedido.id_origen_pedido || "1",
                id_estado_pedido: (pedido.id_estado_pedido ?? pedido.idEstado)?.toString() || "1",
                total_neto: pedido.total_neto || "",
                tipo_pago: pedido.tipo_pago || "",
                detalles: detalles.map((detalle) => {
                    const cantidad = Number(detalle.cantidad ?? detalle.cantidad_solicitada ?? 1);
                    const precio = Number(detalle.precio_unitario ?? detalle.precio_venta ?? 0);
                    const base = cantidad * precio;
                    const descuentoValor = Number(detalle.descuento_aplicado ?? detalle.descuento ?? 0);
                    const descuentoPorcentaje = detalle.descuento_porcentaje != null
                        ? Number(detalle.descuento_porcentaje)
                        : base > 0
                            ? (descuentoValor / base) * 100
                            : 0;

                    return {
                        ...detalle,
                        codigo: detalle.producto?.referencia || detalle.referenciaProducto || detalle.codigo || "",
                        nombreProducto: detalle.producto?.nombre || detalle.nombreProducto || "",
                        cantidad,
                        precio_unitario: precio,
                        descuento_porcentaje: Math.min(Math.max(descuentoPorcentaje, 0), 100),
                        descuento_aplicado: descuentoValor,
                    };
                }),
            });
        }
        if (!isOpen && type === "create") {
             setCreateFormData(INITIAL_CREATE_STATE);
             setCreateError(null);
        }
        if (type === "delete") setDeleteError(null);

        setModals((prev) => ({ ...prev, [type]: isOpen }));
    };

    // Handlers de éxito

    const onCreateSubmit = async () => {
        setActionLoading(true);
        // Pre-calcular todos los valores financieros del form
        const subtotal = createFormData.detalles.reduce(
            (acc, curr) => acc + (Number(curr.cantidad || 0) * Number(curr.precio_unitario || 0)),
            0
        );
        const descuentosProductos = createFormData.detalles.reduce((acc, curr) => {
            const base = Number(curr.cantidad || 0) * Number(curr.precio_unitario || 0);
            const pct = Math.min(Math.max(Number(curr.descuento_porcentaje || 0), 0), 100);
            return acc + (base * pct / 100);
        }, 0);
        const descuentos = descuentosProductos;
        const subtotalNeto = subtotal - descuentos;
        const impuestos = subtotalNeto * 0.19;
        const totalCalculado = subtotalNeto + impuestos;

        // Detalles enriquecidos para el modal de detalles (incluyen precio y nombre)
        const detallesEnriquecidos = createFormData.detalles.map((det) => {
            const cantidad = Number(det.cantidad || 0);
            const precio = Number(det.precio_unitario || 0);
            const pct = Math.min(Math.max(Number(det.descuento_porcentaje || 0), 0), 100);
            const subtotalLinea = cantidad * precio;
            const descuentoLinea = subtotalLinea * pct / 100;
            return {
                ...det,
                cantidad,
                precio_unitario: precio,
                descuento_porcentaje: pct,
                descuento_aplicado: parseFloat(descuentoLinea.toFixed(2)),
                subtotal_linea: parseFloat((subtotalLinea - descuentoLinea).toFixed(2)),
                producto: {
                    id_producto: det.id_producto,
                    nombre: det.nombreProducto || "",
                    referencia: det.referenciaProducto || "",
                },
            };
        });

        try {
            const res = await authFetch(`${API_BASE_URL}/orders`, {
                method: "POST",
                body: JSON.stringify({
                    id_cliente: parseInt(createFormData.id_cliente, 10),
                    id_vendedor: parseInt(createFormData.id_vendedor, 10),
                    id_origen_pedido: parseInt(createFormData.id_origen_pedido, 10) || 1,
                    id_estado_pedido: 1,
                    subtotal: parseFloat(subtotal.toFixed(2)),
                    impuestos: parseFloat(impuestos.toFixed(2)),
                    descuentos: parseFloat(descuentos.toFixed(2)),
                    notas: createFormData.notas,
                    total_neto: parseFloat(totalCalculado.toFixed(2)),
                    tipo_pago: createFormData.tipo_pago || "Efectivo",
                    detalles: createFormData.detalles,
                }),
            });

            if (res.ok) {
                const newPedido = await res.json();
                const backendData = newPedido.data || newPedido;

                // Combinar la respuesta del backend con los datos financieros y
                // de detalles calculados en el form, para que el modal de detalles
                // muestre precios, IVA y total correctamente desde el primer momento.
                const enrichedPedido = {
                    ...backendData,
                    id_cliente: backendData.id_cliente || createFormData.id_cliente,
                    id_vendedor: backendData.id_vendedor || createFormData.id_vendedor,
                    nombreCliente: backendData.nombreCliente || createFormData.nombreCliente,
                    nombreVendedor: backendData.nombreVendedor || createFormData.nombreVendedor,
                    tipo_pago: backendData.tipo_pago || createFormData.tipo_pago,
                    notas: backendData.notas ?? createFormData.notas,
                    subtotal: parseFloat(subtotal.toFixed(2)),
                    impuestos: parseFloat(impuestos.toFixed(2)),
                    descuentos: parseFloat(descuentos.toFixed(2)),
                    total_neto: parseFloat(totalCalculado.toFixed(2)),
                    // Si el backend devuelve detalles los usamos normalizados,
                    // si no, usamos los detalles enriquecidos del form.
                    detalles: (Array.isArray(backendData.detalles) && backendData.detalles.length > 0)
                        ? backendData.detalles.map((det) => ({
                            ...det,
                            precio_unitario: det.precio_unitario ?? det.precio_venta ?? det.precio ?? 0,
                            nombreProducto: det.nombreProducto || det.producto?.nombre || "",
                            referenciaProducto: det.referenciaProducto || det.producto?.referencia || "",
                          }))
                        : detallesEnriquecidos,
                };

                setPedidos((prev) => [enrichedPedido, ...prev]);
                refresh();
                toggleModal("create", false);
                return enrichedPedido.idPedido || enrichedPedido.id_pedido || true;
            } else {
                console.warn("El Backend rechazó el pedido. Guardando en memoria local (Mock) por solicitud del usuario.");

                const fallbackPedido = {
                    idPedido: Math.floor(Math.random() * 10000) + 1000,
                    id_cliente: parseInt(createFormData.id_cliente, 10),
                    id_vendedor: parseInt(createFormData.id_vendedor, 10),
                    nombreCliente: createFormData.nombreCliente,
                    nombreVendedor: createFormData.nombreVendedor,
                    id_origen_pedido: parseInt(createFormData.id_origen_pedido, 10) || 1,
                    id_estado_pedido: 1,
                    subtotal: parseFloat(subtotal.toFixed(2)),
                    impuestos: parseFloat(impuestos.toFixed(2)),
                    descuentos: parseFloat(descuentos.toFixed(2)),
                    notas: createFormData.notas,
                    total_neto: parseFloat(totalCalculado.toFixed(2)),
                    tipo_pago: createFormData.tipo_pago || "Efectivo",
                    detalles: detallesEnriquecidos,
                };

                setPedidos((prev) => [fallbackPedido, ...prev]);
                toggleModal("create", false);
                return fallbackPedido.idPedido || fallbackPedido.id_pedido || true;
            }
        } catch (error) {
            console.warn("Fallo de conexión. Guardando en memoria local (Mock).");

            const fallbackPedido = {
                idPedido: Math.floor(Math.random() * 10000) + 1000,
                id_cliente: parseInt(createFormData.id_cliente, 10),
                id_vendedor: parseInt(createFormData.id_vendedor, 10),
                nombreCliente: createFormData.nombreCliente,
                nombreVendedor: createFormData.nombreVendedor,
                id_origen_pedido: parseInt(createFormData.id_origen_pedido, 10) || 1,
                id_estado_pedido: 1,
                subtotal: parseFloat(subtotal.toFixed(2)),
                impuestos: parseFloat(impuestos.toFixed(2)),
                descuentos: parseFloat(descuentos.toFixed(2)),
                notas: createFormData.notas,
                total_neto: parseFloat(totalCalculado.toFixed(2)),
                tipo_pago: createFormData.tipo_pago || "Efectivo",
                detalles: detallesEnriquecidos,
            };

            setPedidos((prev) => [fallbackPedido, ...prev]);
            toggleModal("create", false);
            return fallbackPedido.idPedido || fallbackPedido.id_pedido || true;
        } finally {
            setActionLoading(false);
        }
    };

    const onEditSubmit = async () => {
        setActionLoading(true);
        try {
            const detalles = Array.isArray(editFormData.detalles) ? editFormData.detalles : [];
            const subtotal = detalles.reduce((acc, detalle) => {
                const cantidad = Number(detalle.cantidad ?? detalle.cantidad_solicitada ?? 0);
                const precio = Number(detalle.precio_unitario ?? detalle.precio_venta ?? 0);
                return acc + cantidad * precio;
            }, 0);
            const descuentos = detalles.reduce((acc, detalle) => {
                const cantidad = Number(detalle.cantidad ?? detalle.cantidad_solicitada ?? 0);
                const precio = Number(detalle.precio_unitario ?? detalle.precio_venta ?? 0);
                const porcentaje = Math.min(Math.max(Number(detalle.descuento_porcentaje ?? 0), 0), 100);
                return acc + ((cantidad * precio) * porcentaje / 100);
            }, 0);
            const subtotalNeto = Math.max(subtotal - descuentos, 0);
            const impuestos = subtotalNeto * 0.19;
            const totalCalculado = subtotalNeto + impuestos;
            const detallesPayload = detalles.map((detalle) => {
                const cantidad = Number(detalle.cantidad ?? detalle.cantidad_solicitada ?? 0);
                const precio = Number(detalle.precio_unitario ?? detalle.precio_venta ?? 0);
                const descuentoPorcentaje = Math.min(Math.max(Number(detalle.descuento_porcentaje ?? 0), 0), 100);
                const descuento = (cantidad * precio) * descuentoPorcentaje / 100;
                const subtotalLinea = Math.max(cantidad * precio - descuento, 0);
                const producto = detalle.producto || {};
                const idProducto =
                    detalle.id_producto ||
                    detalle.idProducto ||
                    producto.id_producto ||
                    producto.idProducto ||
                    producto.id;

                return {
                    ...detalle,
                    id_producto: idProducto,
                    cantidad,
                    cantidad_solicitada: cantidad,
                    precio_unitario: precio,
                    precio_venta: precio,
                    descuento_porcentaje: descuentoPorcentaje,
                    descuento_aplicado: descuento,
                    subtotal_linea: parseFloat(subtotalLinea.toFixed(2)),
                    producto: {
                        ...producto,
                        id_producto: idProducto,
                        referencia: detalle.codigo || producto.referencia || detalle.referenciaProducto || "",
                        nombre: detalle.nombreProducto || producto.nombre || "",
                    },
                };
            }).filter((detalle) => detalle.id_producto);
            const pedidoId = selectedPedido.idPedido || selectedPedido.id_pedido;
            const idVendedor =
                parseInt(editFormData.id_vendedor, 10) ||
                selectedPedido.id_vendedor ||
                selectedPedido.idVendedor;
            const originalDetails = Array.isArray(selectedPedido.detalles) ? selectedPedido.detalles : [];
            const detailsChanged = !areDetailsEqual(detalles, originalDetails);
            const payload = {
                id_cliente: parseInt(editFormData.id_cliente, 10) || selectedPedido.id_cliente,
                id_vendedor: idVendedor,
                nombreCliente: editFormData.nombreCliente,
                nombreVendedor: editFormData.nombreVendedor,
                id_origen_pedido: parseInt(editFormData.id_origen_pedido, 10),
                id_estado_pedido: parseInt(editFormData.id_estado_pedido, 10) || 1,
                total_neto: parseFloat(totalCalculado.toFixed(2)),
                tipo_pago: editFormData.tipo_pago,
                cliente: {
                    ...(selectedPedido.cliente || {}),
                    razonSocial: editFormData.nombreCliente,
                    numeroDocumento: editFormData.numeroDocumento,
                    telefono: editFormData.telefono,
                    email: editFormData.email,
                    direccion: editFormData.direccion,
                    tipoCliente: editFormData.tipoCliente,
                },
            };

            if (detailsChanged) {
                payload.subtotal = parseFloat(subtotal.toFixed(2));
                payload.descuentos = parseFloat(descuentos.toFixed(2));
                payload.impuestos = parseFloat(impuestos.toFixed(2));
                payload.detalles = detallesPayload;
            }

            const res = await authFetch(`${API_BASE_URL}/orders/${selectedPedido.idPedido || selectedPedido.id_pedido}`, {
                method: "PUT",
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                const updatedPedido = {
                    ...selectedPedido,
                    ...editFormData,
                    id_vendedor: idVendedor,
                    idVendedor,
                    id_estado_pedido: parseInt(editFormData.id_estado_pedido, 10) || selectedPedido.id_estado_pedido,
                    idEstado: parseInt(editFormData.id_estado_pedido, 10) || selectedPedido.idEstado,
                    subtotal: parseFloat(subtotal.toFixed(2)),
                    descuentos: parseFloat(descuentos.toFixed(2)),
                    impuestos: parseFloat(impuestos.toFixed(2)),
                    total_neto: parseFloat(totalCalculado.toFixed(2)),
                    cliente: {
                        ...(selectedPedido.cliente || {}),
                        razonSocial: editFormData.nombreCliente,
                        numeroDocumento: editFormData.numeroDocumento,
                        telefono: editFormData.telefono,
                        email: editFormData.email,
                        direccion: editFormData.direccion,
                        tipoCliente: editFormData.tipoCliente,
                    },
                    detalles: detallesPayload,
                };
                setPedidos((prev) =>
                    prev.map((p) =>
                        ((p.idPedido || p.id_pedido) === pedidoId)
                            ? updatedPedido
                            : p
                    )
                );
                return true;
            }
            const errorData = await res.json().catch(() => ({}));
            console.error("Error backend al editar pedido:", errorData);
            return false;
        } catch (error) {
            console.error("Error al editar pedido:", error);
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    const onDeleteConfirm = async () => {
        setActionLoading(true);
        try {
            const pedidoId = selectedPedido.idPedido || selectedPedido.id_pedido;
            const res = await authFetch(`${API_BASE_URL}/orders/${pedidoId}`, {
                method: "DELETE",
            });
            if (res.ok) {
                handleStatusChangeSuccess(pedidoId, 2);
                toggleModal("delete", false);
            } else {
                const errorData = await res.json().catch(() => ({}));
                setDeleteError(errorData.message || "Error de restricciones de seguridad.");
            }
        } catch (error) {
            console.error("Error al eliminar pedido:", error);
        } finally {
            setActionLoading(false);
        }
    };

    // Helpers visuales

    const getInitials = (n) => n?.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "P";

    const getAvatarColor = (id) => {
        const colors = ["bg-emerald-500", "bg-blue-500", "bg-violet-500", "bg-amber-500", "bg-rose-500"];
        return colors[(id || 0) % colors.length];
    };

    // Filtrado y paginación

    const filteredPedidos = pedidos.filter((p) => {
        const query = searchTerm.trim().toLowerCase();
        const matchesStatus = statusFilter === "todos" || getPedidoStatusKey(p) === statusFilter;
        const searchableText = [
            formatPedidoCode(p),
            p.idPedido,
            p.id_pedido,
            p.nombreCliente,
            p.cliente?.razonSocial,
            p.nombreVendedor,
            p.vendedor?.nombreUsuario,
            p.tipo_pago,
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

        return matchesStatus && (!query || searchableText.includes(query));
    });

    const paginatedPedidos = filteredPedidos.slice((currentPage - 1) * pedidosPerPage, currentPage * pedidosPerPage);

    return (
        <div className="p-8 bg-transparent dark:bg-slate-950 min-h-screen transition-colors duration-300 overflow-auto text-slate-900 dark:text-slate-100">
            <SuccessToast {...toastConfig} onClose={() => setToastConfig((prev) => ({ ...prev, visible: false }))} />

            <PageHeader
                icon={ClipboardList}
                title="Gestión de Pedidos"
                subtitle="Panel administrativo de pedidos."
                buttonText="Registrar Pedido"
                onButtonClick={() => openWindow("order-create", { title: "Registrar Nuevo Pedido", type: "order-create", size: { width: 850, height: 600 } })}
                createPermission="Crear Venta"
            />

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700/60 flex flex-col overflow-hidden transition-colors duration-300">
                <div className="flex flex-col gap-4 px-6 py-6 md:flex-row md:items-start md:justify-between">
                    <div>
                        <h2 className="text-base font-semibold text-black dark:text-white">Lista de Pedidos</h2>
                        <p className="text-sm text-slate-600 dark:text-zinc-400">Gestiona todos los pedidos del sistema</p>
                    </div>

                    <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto">
                        <div className="relative w-full sm:w-80">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                                placeholder="Buscar por ID, cliente o razón social..."
                                className="h-9 w-full rounded-lg border border-transparent bg-slate-100 dark:bg-zinc-800/80 pl-10 pr-3 text-sm text-slate-700 dark:text-zinc-200 outline-none transition placeholder:text-slate-500 dark:placeholder:text-zinc-550 focus:border-slate-300 dark:focus:border-zinc-700 focus:bg-white dark:focus:bg-zinc-800 focus:ring-2 focus:ring-slate-100 dark:focus:ring-zinc-900"
                            />
                        </div>

                        <div className="relative w-full sm:w-40">
                            <select
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="h-9 w-full appearance-none rounded-lg border border-transparent bg-slate-100 dark:bg-zinc-800/80 px-3 pr-9 text-sm font-medium text-slate-900 dark:text-zinc-200 outline-none transition focus:border-slate-300 dark:focus:border-zinc-700 focus:bg-white dark:focus:bg-zinc-800 focus:ring-2 focus:ring-slate-100 dark:focus:ring-zinc-900"
                            >
                                {STATUS_FILTERS.map((option) => (
                                    <option key={option.value} value={option.value} className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        </div>
                    </div>
                </div>

                {error && !loading ? (
                    <div className="p-8 text-center text-red-600 bg-red-50 border-t border-red-100">
                        <p className="font-semibold">No se pudieron cargar los pedidos.</p>
                        <p className="text-sm mt-1">{error}</p>
                        <button
                            type="button"
                            onClick={refresh}
                            className="mt-4 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700"
                        >
                            Reintentar
                        </button>
                    </div>
                ) : (
                    <PedidoTable
                        pedidos={paginatedPedidos}
                        loading={loading}
                        getAvatarColor={getAvatarColor}
                        getInitials={getInitials}
                        onView={(p) => toggleModal("view", true, p)}
                        onEdit={(p) => openWindow(`order-edit-${p.idPedido || p.id_pedido}`, { title: `Editar Pedido #${p.idPedido || p.id_pedido}`, type: "order-edit", data: p, size: { width: 850, height: 600 } })}
                        onStatusChange={handlePedidoStatusChange}
                        onAbonos={(p) => toggleModal("abonos", true, p)}
                    />
                )}

                <TablePagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(filteredPedidos.length / pedidosPerPage) || 1}
                    onPageChange={setCurrentPage}
                />
            </div>

            {/* MODALES */}
            <PedidoCreateModal
                isOpen={modals.create}
                onClose={() => toggleModal("create", false)}
                formData={createFormData}
                setFormData={setCreateFormData}
                onInputChange={(e) => setCreateFormData(p => ({ ...p, [e.target.name]: e.target.value }))}
                onSelectChange={(name, value) => setCreateFormData(p => ({ ...p, [name]: value }))}
                onSubmit={onCreateSubmit}
                loading={actionLoading}
                submitError={createError}
                onSaveSuccess={(data) => handlePedidoCreateSuccess(data || "Nuevo")}
            />

            <PedidoEditModal
                isOpen={modals.edit}
                onClose={() => toggleModal("edit", false)}
                pedido={selectedPedido}
                formData={editFormData}
                onInputChange={(e) => setEditFormData(p => ({ ...p, [e.target.name]: e.target.value }))}
                onSelectChange={(name, value) => setEditFormData(p => ({ ...p, [name]: value }))}
                onSubmit={onEditSubmit}
                loading={actionLoading}
                getInitials={getInitials}
                getAvatarColor={getAvatarColor}
                onSaveSuccess={() => handlePedidoSaveSuccess(selectedPedido?.idPedido || selectedPedido?.id_pedido)}
            />

            <PedidoDetailsModal
                isOpen={modals.view}
                onClose={() => toggleModal("view", false)}
                pedido={selectedPedido}
                getAvatarColor={getAvatarColor}
                getInitials={getInitials}
            />

            <PedidoAbonosModal
                isOpen={modals.abonos}
                onClose={() => toggleModal("abonos", false)}
                pedido={selectedPedido}
            />

            <AuthorityAuthModal
                isOpen={adminStatusRequest.open}
                onClose={closeAdminStatusModal}
                password={adminPassword}
                onPasswordChange={setAdminPassword}
                onConfirm={handleAdminStatusConfirm}
                loading={adminLoading}
                error={adminError}
                title="Autorización Requerida"
                description="Reactivar un pedido cancelado requiere validación de Master o Administrador."
                actionDetail={`Reactivar pedido #${adminStatusRequest.pedido?.idPedido || adminStatusRequest.pedido?.id_pedido}`}
            />

            <ConfirmActionModal
                isOpen={modals.delete}
                onClose={() => toggleModal("delete", false)}
                onConfirm={onDeleteConfirm}
                loading={actionLoading}
                title="Confirmar eliminación"
                description="Esta acción inactivará el registro."
                itemName={(selectedPedido?.idPedido || selectedPedido?.id_pedido) ? `Pedido #${selectedPedido?.idPedido || selectedPedido?.id_pedido}` : ""}
                itemSubtitle={selectedPedido?.clienteNombre || selectedPedido?.nombreCliente || "Cliente"}
                itemId={selectedPedido?.idPedido || selectedPedido?.id_pedido}
                alertMessage={
                    <>
                        ¿Estás seguro de que deseas eliminar el pedido{" "}
                        <strong>#{selectedPedido?.idPedido || selectedPedido?.id_pedido}</strong> de <strong>{selectedPedido?.clienteNombre || selectedPedido?.nombreCliente || "Cliente"}</strong>?
                    </>
                }
                variant="danger"
                error={deleteError}
            />

            <PrintableDocument
                title="Comprobante de Pedido"
                folio={`PED-${String(selectedPedido?.idPedido || selectedPedido?.id_pedido || 0).padStart(3, '0')}`}
                date={selectedPedido?.fechaOriginal || selectedPedido?.fechaCreacion ? new Date(selectedPedido.fechaOriginal || selectedPedido.fechaCreacion).toLocaleDateString() : new Date().toLocaleDateString()}
                client={{
                    name: selectedPedido?.cliente?.razonSocial || selectedPedido?.clienteNombre || selectedPedido?.nombreCliente || "Cliente",
                    id: selectedPedido?.cliente?.numeroDocumento || selectedPedido?.numeroDocumento || "N/A",
                    docType: selectedPedido?.cliente?.tipoDocumento?.sigla || selectedPedido?.tipoDocumento || "NIT/CC",
                    address: selectedPedido?.cliente?.direccion || selectedPedido?.direccion || "No registrada",
                    city: selectedPedido?.cliente?.municipio?.nombre || selectedPedido?.cliente?.municipio?.name || selectedPedido?.cliente?.ciudad || selectedPedido?.ciudad || "No registrada",
                    department: selectedPedido?.cliente?.municipio?.departamento?.nombre || selectedPedido?.cliente?.municipio?.departamento?.name || selectedPedido?.departamento || "",
                    phone: selectedPedido?.cliente?.telefono || selectedPedido?.telefono || "",
                    email: selectedPedido?.cliente?.email || selectedPedido?.email || ""
                }}
                concept={`Registro de Pedido #${selectedPedido?.idPedido || selectedPedido?.id_pedido || 0}`}
                type="sale"
                items={
                    Array.isArray(selectedPedido?.detalles) && selectedPedido.detalles.length > 0 
                    ? selectedPedido.detalles.map(d => {
                        const cantidad = Number(d.cantidad || d.cantidad_solicitada || 1);
                        const precioUnitario = Number(d.precio_unitario || d.precio_venta || 0);
                        const descuento = Number(d.descuento_aplicado || d.descuento || 0);
                        const subtotalItem = cantidad * precioUnitario;
                        const totalItem = subtotalItem - descuento;
                        
                        return {
                            codigo: d.producto?.referencia || d.referenciaProducto || d.codigo || "N/A",
                            descripcion: d.producto?.nombre || d.nombreProducto || "Producto",
                            cantidad: cantidad,
                            precioUnitario: precioUnitario,
                            subtotal: subtotalItem,
                            descuento: descuento,
                            total: totalItem
                        };
                    })
                    : [{
                        descripcion: selectedPedido?.notas || "Pedido sin detalles registrados",
                        codigo: "N/A",
                        cantidad: 1,
                        precioUnitario: selectedPedido?.total_neto || selectedPedido?.total || 0,
                        subtotal: selectedPedido?.total_neto || selectedPedido?.total || 0,
                        descuento: 0,
                        total: selectedPedido?.total_neto || selectedPedido?.total || 0
                    }]
                }
                totals={(() => {
                    let subtotalSinDescuento = 0;
                    let descuentoTotal = 0;
                    let subtotalConDescuento = 0;

                    if (Array.isArray(selectedPedido?.detalles) && selectedPedido.detalles.length > 0) {
                        selectedPedido.detalles.forEach(d => {
                            const cantidad = Number(d.cantidad || d.cantidad_solicitada || 1);
                            const precioUnitario = Number(d.precio_unitario || d.precio_venta || 0);
                            const descuento = Number(d.descuento_aplicado || d.descuento || 0);
                            const subtotalItem = cantidad * precioUnitario;
                            const totalItem = subtotalItem - descuento;

                            subtotalSinDescuento += subtotalItem;
                            descuentoTotal += descuento;
                            subtotalConDescuento += totalItem;
                        });
                    } else {
                        subtotalSinDescuento = Number(selectedPedido?.subtotal || selectedPedido?.total_neto || 0);
                        subtotalConDescuento = Number(selectedPedido?.subtotal || selectedPedido?.total_neto || 0);
                    }

                    const ivaTotal = subtotalConDescuento * 0.19;

                    return {
                        subtotalSinDescuento,
                        descuentoTotal,
                        ivaTotal,
                        total: selectedPedido?.total_neto || selectedPedido?.total || (subtotalConDescuento + ivaTotal)
                    };
                })()}
                isCancelled={Number(selectedPedido?.id_estado_pedido || selectedPedido?.idEstado) === 3}
                footerNote={selectedPedido?.notas || "Comprobante de pedido consolidado. Conservar para seguimiento."}
                printedBy={getPrintedByName()}
            />
        </div>
    );
};

export default GestionPedidos;

