import React, { useState, useEffect } from "react";
import { ShoppingCart, LockKeyhole } from "lucide-react";
import { useCompras } from "../../hooks/useCompras";
import PageHeader from "../../components/shared/PageHeader";
import TableToolbar from "../../components/shared/TableToolbar";
import TablePagination from "../../components/shared/TablePagination";
import SuccessToast from "../../components/ui/SuccessToast";
import PrintableDocument from "../../components/shared/PrintableDocument";
import { useModalDock } from "../../contexts/ModalDockContext";
import { useAuth } from "../../hooks/useAuth";

import CompraTable from "./components/CompraTable";
import CompraDetailsModal from "./components/CompraDetailsModal";
import CompraCanceladaModal from "./components/CompraCanceladaModal";


/* ── Estado inicial del formulario ─────────────────────────── */
const buildInitialCreateState = () => ({
    idProveedor: "",
    proveedorNombre: "",
    fechaCompra: new Date().toISOString().split("T")[0],
    numeroFactura: "",
    detalles: [], // { idProducto, nombreProducto, cantidad, precioUnitario, total }
});

/* ── Componente Principal ──────────────────────────────────── */
const GestionCompras = () => {
    const { compras, loading, error, isAdmin, statuses, updateStatus, refresh } = useCompras();
    const { openWindow } = useModalDock();
    const { hasPermission } = useAuth();

    /* Búsqueda y paginación */
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    /* Modal de detalles */
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [selectedCompra, setSelectedCompra] = useState(null);

    /* Impresión */
    const [printCompra, setPrintCompra] = useState(null);

    /* Modal de cancelación */
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [compraToCancel, setCompraToCancel] = useState(null);

    /* Toast */
    const [toastConfig, setToastConfig] = useState({ visible: false, title: "", message: "" });

    const showToast = (title, message) => {
        setToastConfig({ visible: true, title, message });
        setTimeout(() => setToastConfig((prev) => ({ ...prev, visible: false })), 6000);
    };

    /* ── Print ────────────────────────────────────────────── */
    const getPrintedByName = () => {
        const raw = localStorage.getItem("user") || sessionStorage.getItem("user");
        if (!raw) return "Usuario";
        try {
            const u = JSON.parse(raw);
            const emp = u.empleado || u.Empleado || {};
            const nombre = emp.nombre || emp.nombres || u.nombre || u.nombreUsuario || "";
            const apellido = emp.apellido || emp.apellidos || u.apellido || "";
            return `${nombre} ${apellido}`.trim() || u.nombreUsuario || "Usuario";
        } catch { return "Usuario"; }
    };

    useEffect(() => {
        const handler = () => setPrintCompra(null);
        window.addEventListener("afterprint", handler);
        return () => window.removeEventListener("afterprint", handler);
    }, []);

    useEffect(() => {
        const handleChanged = (e) => {
            refresh();
            if (e?.detail) {
                showToast(
                    e.detail.title || "Compra registrada",
                    e.detail.message || "La compra ha sido registrada exitosamente."
                );
            }
        };
        window.addEventListener("compra-changed", handleChanged);
        return () => window.removeEventListener("compra-changed", handleChanged);
    }, [refresh]);

    const handlePrint = (item) => {
        if (!item) return;
        setPrintCompra(item);
        setTimeout(() => window.print(), 200);
    };

    /* ── Guard: sólo usuarios autorizados ─────────────────── */
    if (!hasPermission("Listar Compras")) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] p-8 text-center bg-transparent">
                <div className="w-24 h-24 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6 shadow-sm border-4 border-white">
                    <LockKeyhole className="w-10 h-10" />
                </div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Acceso Restringido</h1>
                <p className="text-slate-500 mt-3 max-w-md mx-auto text-lg leading-relaxed">
                    La gestión de compras e ingreso de inventario está protegida.{" "}
                    <span className="font-bold text-slate-700 block mt-2">
                        Solo un perfil autorizado puede acceder a este módulo.
                    </span>
                </p>
            </div>
        );
    }

    /* ── Handlers ─────────────────────────────────────────── */
    const handleOpenCreateModal = () => {
        openWindow("compra-create", { 
            title: "Nueva Compra", 
            type: "compra-create",
            size: { width: 900, height: 620 }
        });
    };


    const handleCloseCreateModal = () => {
        setModalOpen(false);
        setCreateFormData(buildInitialCreateState());
    };

    /* Acciones de tabla */
    const handleView = (item) => {
        setSelectedCompra(item);
        setDetailsModalOpen(true);
    };

    const handleCloseDetailsModal = () => {
        setDetailsModalOpen(false);
        setSelectedCompra(null);
    };

    const handleCancel = (item) => {
        setCompraToCancel(item);
        setCancelModalOpen(true);
    };

    const handleCloseCancelModal = () => {
        setCancelModalOpen(false);
        setCompraToCancel(null);
    };

    const handleStatusChange = async (compra, nextStatusId) => {
        try {
            await updateStatus(compra, nextStatusId);
            const label = statuses.find((s) => s.value === nextStatusId)?.label ?? `Estado ${nextStatusId}`;
            showToast("¡Estado Actualizado!", `La compra cambió a "${label}" exitosamente.`);
        } catch (err) {
            console.error("Error al actualizar estado de compra:", err);
            showToast("Error", err.message || "No se pudo actualizar el estado. Intenta de nuevo.");
        }
    };

    /* ── Filtrado y paginación ────────────────────────────── */
    const filtered = compras.filter(
        (c) =>
            c.proveedorNombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.numeroFactura?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.idCompra?.toString().includes(searchTerm) ||
            c.estado?.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    /* ── Render ───────────────────────────────────────────── */
    return (
        <div className="p-8 space-y-6 bg-transparent dark:bg-slate-950 min-h-screen transition-colors duration-300 overflow-auto">
            <SuccessToast
                {...toastConfig}
                onClose={() => setToastConfig((prev) => ({ ...prev, visible: false }))}
            />

            <PageHeader
                icon={ShoppingCart}
                title="Gestión de Compras"
                subtitle="Control completo de compras a proveedores y compras directas"
                buttonText="Nueva Compra"
                onButtonClick={handleOpenCreateModal}
                theme="cyan"
                createPermission="Crear Compra"
            />

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700/60 overflow-hidden flex flex-col">
                <TableToolbar
                    title="Registro de Compras"
                    count={filtered.length}
                    searchTerm={searchTerm}
                    onSearchChange={(val) => { setSearchTerm(val); setCurrentPage(1); }}
                    placeholder="Buscar por proveedor, ID..."
                />

                <CompraTable
                    data={paginated}
                    loading={loading}
                    error={error}
                    statuses={statuses}
                    onStatusChange={handleStatusChange}
                    onView={handleView}
                    onCancel={handleCancel}
                    onDetails={handlePrint}
                />

                <TablePagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(filtered.length / itemsPerPage) || 1}
                    onPageChange={setCurrentPage}
                />
            </div>



            <CompraDetailsModal
                isOpen={detailsModalOpen}
                onClose={handleCloseDetailsModal}
                compra={selectedCompra}
            />

            <CompraCanceladaModal
                isOpen={cancelModalOpen}
                onClose={handleCloseCancelModal}
                compra={compraToCancel}
                onConfirm={handleStatusChange}
            />

            {printCompra && (
                <div className="print-only hidden print:block">
                    <PrintableDocument
                        title="Compra a Proveedor"
                        folio={`C-${String(printCompra.idCompra || 0).padStart(3, "0")}`}
                        date={printCompra.fechaCompra ? new Date(printCompra.fechaCompra).toLocaleDateString() : ""}
                        client={{
                            name: printCompra.proveedorNombre || printCompra.proveedor?.nombre_empresa || "Proveedor",
                            id: String(printCompra.idProveedor || "").padStart(5, "0"),
                            docType: "NIT",
                            address: printCompra.proveedor?.direccion || "",
                            city: printCompra.proveedor?.municipio?.nombre || printCompra.proveedor?.ciudad || "",
                            phone: printCompra.proveedor?.telefono || "",
                            email: printCompra.proveedor?.email || "",
                        }}
                        concept={`Compra #${printCompra.idCompra || 0} - Factura ${printCompra.numeroFactura || ""}`}
                        type="sale"
                        items={
                            Array.isArray(printCompra.detalles) && printCompra.detalles.length > 0
                                ? printCompra.detalles.map((d) => {
                                      const costoUnitario = Number(d.costo_unitario ?? d.costoUnitario ?? d.precioUnitario ?? 0);
                                      const cantidad = Number(d.cantidad || 0);
                                      const subtotal = Number(d.subtotal ?? d.total ?? costoUnitario * cantidad);
                                      return {
                                          codigo: d.producto?.referencia || d.referencia || d.codigo || "N/A",
                                          descripcion: d.producto?.nombre || d.nombreProducto || "Producto",
                                          cantidad,
                                          precioUnitario: costoUnitario,
                                          subtotal,
                                          descuento: 0,
                                          total: subtotal,
                                      };
                                  })
                                : []
                        }
                        totals={(() => {
                            const totalFinal = (Array.isArray(printCompra.detalles) ? printCompra.detalles : []).reduce((sum, d) => {
                                const costoUnitario = Number(d.costo_unitario ?? d.costoUnitario ?? d.precioUnitario ?? 0);
                                const cant = Number(d.cantidad || 0);
                                return sum + Number(d.subtotal ?? d.total ?? costoUnitario * cant);
                            }, 0);
                            return {
                                subtotalSinDescuento: totalFinal,
                                descuentoTotal: 0,
                                ivaTotal: Math.round(totalFinal * 0.19),
                                total: totalFinal + Math.round(totalFinal * 0.19),
                            };
                        })()}
                        isCancelled={printCompra.idEstadoCompra === 4 || printCompra.idEstadoCompra === 5}
                        footerNote="Documento oficial de compra generado por el sistema MSG Repuestos."
                        printedBy={getPrintedByName()}
                    />
                </div>
            )}
        </div>
    );
};

export default GestionCompras;

