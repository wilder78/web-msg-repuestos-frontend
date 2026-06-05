import React, { useState, useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { useModalDock } from "../../contexts/ModalDockContext";
import { useDevoluciones } from "../../hooks/useDevoluciones";
import { useAuth } from "../../hooks/useAuth";
import PageHeader from "../../components/shared/PageHeader";
import TableToolbar from "../../components/shared/TableToolbar";
import TablePagination from "../../components/shared/TablePagination";
import SuccessToast from "../../components/ui/SuccessToast";
import PrintableDocument from "../../components/shared/PrintableDocument";

import ReturnTable from "./components/ReturnTable";
import ReturnCreateModal from "./components/ReturnCreateModal";
import ReturnDetailsModal from "./components/ReturnDetailsModal";
import ReturnCancelModal from "./components/ReturnCancelModal";

const API = (import.meta.env.VITE_API_URL || "http://localhost:8080/api").replace(/\/$/, "");
const hdrs = () => {
    const t = localStorage.getItem("token") || sessionStorage.getItem("token") || "";
    return { "Content-Type": "application/json", ...(t ? { Authorization: `Bearer ${t}` } : {}) };
};

const GestionDevoluciones = () => {
    const { devoluciones, loading, refresh, cancelReturn } = useDevoluciones();
    const { user } = useAuth();
    const { openWindow } = useModalDock();

    useEffect(() => {
        const handleReturnChanged = (e) => {
            refresh();
            if (e?.detail) {
                showToast(
                    e.detail.title || "Reingreso registrado",
                    e.detail.message || "El reingreso de mercancía ha sido procesado exitosamente."
                );
            }
        };
        window.addEventListener("return-changed", handleReturnChanged);
        return () => {
            window.removeEventListener("return-changed", handleReturnChanged);
        };
    }, [refresh]);

    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const [selectedDevolucion, setSelectedDevolucion] = useState(null);
    const [printItem, setPrintItem] = useState(null);
    const [modals, setModals] = useState({
        view: false,
        create: false,
        cancel: false,
    });
    const [isDeleting, setIsDeleting] = useState(false);

    // Toast Configuración
    const [toastConfig, setToastConfig] = useState({
        visible: false,
        title: "",
        message: "",
        type: "success",
    });

    const showToast = (title, message, type = "success") => {
        setToastConfig({ visible: true, title, message, type });
        setTimeout(() => {
            setToastConfig((prev) => ({ ...prev, visible: false }));
        }, 4000); 
    };

    const getInitials = (n) => n?.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "CL";
    const getAvatarColor = (id) => {
        const colors = ["bg-amber-500", "bg-rose-500", "bg-fuchsia-500", "bg-pink-500", "bg-orange-500"];
        return colors[(id || 0) % colors.length];
    };

    const getPrintedByName = () => {
        const raw = localStorage.getItem("user") || sessionStorage.getItem("user");
        if (!raw) return "Usuario";
        try {
            const u = JSON.parse(raw);
            const emp = u.empleado || u.Empleado || {};
            const nombre = emp.nombre || emp.nombres || u.nombre || u.nombreUsuario || "";
            const apellido = emp.apellido || emp.apellidos || u.apellido || "";
            return `${nombre} ${apellido}`.trim() || u.nombreUsuario || "Usuario";
        } catch {
            return "Usuario";
        }
    };

    useEffect(() => {
        const handler = () => setPrintItem(null);
        window.addEventListener("afterprint", handler);
        return () => window.removeEventListener("afterprint", handler);
    }, []);

    const toggleModal = (type, isOpen, item = null) => {
        setSelectedDevolucion(item);
        setModals((prev) => ({ ...prev, [type]: isOpen }));
    };

    const handleCancelReturn = async (idOrItem) => {
        const id = typeof idOrItem === 'object' ? (idOrItem.idDevolucion || idOrItem.id) : idOrItem;
        
        if (!id) {
            showToast("Error", "ID de devolución no válido.", "error");
            return;
        }

        setIsDeleting(true);
        const result = await cancelReturn(id, {
            idUsuarioAutoriza: user?.idUsuario || user?.id || 1 
        });
        setIsDeleting(false);
        if (result.success) {
            toggleModal("cancel", false);
            showToast("Anulación Exitosa", `La devolución #DEV-${id} ha sido revertida.`, "success");
        } else {
            showToast("Error de Proceso", result.error || "No se pudo cancelar la devolución.", "error");
        }
    };

    const handleExportPdf = (item) => {
        setPrintItem(item);
        setTimeout(() => window.print(), 200);
    };

    const filtered = devoluciones.filter(
        (c) =>
            (c.cliente?.razonSocial || c.clienteNombre || "")?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.numeroFactura || c.idVenta?.toString() || "")?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.idDevolucion?.toString().includes(searchTerm)
    );

    const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="p-8 space-y-6 bg-transparent dark:bg-slate-950 min-h-screen transition-colors duration-300 overflow-auto">
            <SuccessToast {...toastConfig} onClose={() => setToastConfig((prev) => ({ ...prev, visible: false }))} />

            <PageHeader
                icon={RotateCcw}
                title="Centro de Devoluciones e Inventario"
                subtitle="Gestiona el reingreso de mercancia, reversión de despachos y ajustes de stock automáticos."
                theme="amber"
                buttonText="Nueva Devolución"
                onButtonClick={() => openWindow("return-create", { title: "Registrar Devolución", type: "return-create", size: { width: 700, height: 600 } })}
                createPermission="Crear Devolución"
            />

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 transition-colors duration-300 flex flex-col">
                <TableToolbar
                    title="Bitácora de Reingresos de Mercancía"
                    count={filtered.length}
                    searchTerm={searchTerm}
                    onSearchChange={(val) => { setSearchTerm(val); setCurrentPage(1); }}
                    placeholder="Buscar por cliente, n° orden original o folio devolución..."
                />

                <ReturnTable
                    data={paginated}
                    loading={loading}
                    getAvatarColor={getAvatarColor}
                    getInitials={getInitials}
                    onView={(item) => toggleModal("view", true, item)}
                    onCancel={(item) => toggleModal("cancel", true, item)}
                    onExportPdf={handleExportPdf}
                />

                <TablePagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(filtered.length / itemsPerPage) || 1}
                    onPageChange={setCurrentPage}
                />
            </div>
            {/* MODALES */}
            <ReturnCreateModal
                isOpen={modals.create}
                onClose={() => toggleModal("create", false)}
                onSubmit={async (newReturn) => {
                    const returnToSave = { 
                        ...newReturn, 
                        registradoPor: user?.nombre || "Admin Usuario"
                    };
                    try {
                        const response = await fetch(`${API}/returns`, {
                            method: "POST",
                            headers: hdrs(),
                            body: JSON.stringify(returnToSave)
                        });
                        
                        const result = await response.json();

                        if (!response.ok) {
                            throw new Error(result.message || "Error al procesar la devolución en el servidor");
                        }
                        
                        toggleModal("create", false);
                        showToast("Devolución Exitosa", `Se ha registrado el reingreso de mercancía y generado un saldo a favor de $${(newReturn.totalAjuste || 0).toLocaleString()}.`);
                        refresh();
                        return result; // IMPORTANTE: Retornar el resultado para que el modal maneje el PDF
                    } catch (error) {
                        console.error("Error registration return:", error);
                        alert(error.message || "Ocurrió un error al registrar la devolución.");
                        return { status: "error", message: error.message };
                    }
                }}
            />
            
            <ReturnDetailsModal
                isOpen={modals.view}
                onClose={() => toggleModal("view", false)}
                devolucion={selectedDevolucion}
                getAvatarColor={getAvatarColor}
                getInitials={getInitials}
            />

            <ReturnCancelModal
                isOpen={modals.cancel}
                onClose={() => toggleModal("cancel", false)}
                devolucion={selectedDevolucion}
                onConfirm={handleCancelReturn}
                loading={isDeleting}
            />

            {printItem && (
                <div className="print-only hidden print:block">
                    <PrintableDocument
                        title="Acta de Devolución"
                        folio={`DEV-${String(printItem.idDevolucion || 0).padStart(3, "0")}`}
                        date={printItem.fechaDevolucion ? new Date(printItem.fechaDevolucion).toLocaleDateString() : ""}
                        client={{
                            name: printItem.cliente?.razonSocial || printItem.clienteNombre || "Cliente",
                            id: printItem.cliente?.numeroDocumento || printItem.numeroDocumento || "N/A",
                            docType: printItem.cliente?.tipoDocumento?.sigla || "NIT/CC",
                            address: printItem.cliente?.direccion || "",
                            city: printItem.cliente?.municipio?.nombre || printItem.cliente?.ciudad || "",
                            department: printItem.cliente?.municipio?.departamento?.nombre || "",
                            phone: printItem.cliente?.telefono || "",
                            email: printItem.cliente?.email || "",
                        }}
                        concept={`Devolución de mercancía - Factura ${printItem.numeroFactura || ""}`}
                        type="sale"
                        items={
                            Array.isArray(printItem.detalles) && printItem.detalles.length > 0
                                ? printItem.detalles.map((d) => {
                                      const cantidad = Number(d.cantidadDevuelta || d.cantDevolver || 0);
                                      const precioUnitario = Number(d.precioUnitario || d.precio || 0);
                                      const subtotal = Number(d.subtotalLinea || (cantidad * precioUnitario));
                                      return {
                                          codigo: d.producto?.referencia || "N/A",
                                          descripcion: d.producto?.nombre || d.nombreProducto || "Producto",
                                          cantidad,
                                          precioUnitario,
                                          subtotal,
                                          descuento: 0,
                                          total: subtotal,
                                      };
                                  })
                                : []
                        }
                        totals={{
                            subtotalSinDescuento: Number(printItem.subtotal || 0),
                            descuentoTotal: 0,
                            ivaTotal: Number(printItem.iva || 0),
                            total: Number(printItem.totalAjuste || printItem.totalDevolucion || 0),
                        }}
                        isCancelled={Number(printItem.idEstadoDevolucion) === 2}
                        footerNote="Documento de reingreso de mercancía al inventario."
                        printedBy={getPrintedByName()}
                    />
                </div>
            )}
        </div>
    );
};

export default GestionDevoluciones;

