import React, { useState, useEffect } from "react";
import { FileText } from "lucide-react";

import PageHeader from "../../components/shared/PageHeader";
import TableToolbar from "../../components/shared/TableToolbar";
import TablePagination from "../../components/shared/TablePagination";
import SalesTableModal from "./components/SalesTableModal";
import SalesDetailsModal from "./components/SalesDetailsModal";
import SuccessToast from "../../components/ui/SuccessToast";
import PrintableDocument from "../../components/shared/PrintableDocument";
import { useSales } from "../../hooks/useSales";
import { useModalDock } from "../../contexts/ModalDockContext";

const API = (import.meta.env.VITE_API_URL || "http://localhost:8080/api").replace(/\/$/, "");


export default function GestionVentas() {
  const { openWindow } = useModalDock();
  const { sales, loading, refresh, authFetch } = useSales();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    const handleRefresh = (e) => {
      refresh();
      if (e?.detail) {
        showToast(
          e.detail.title || "Venta consolidada",
          e.detail.message || "La venta ha sido consolidada exitosamente."
        );
      }
    };
    window.addEventListener("sale-changed", handleRefresh);
    return () => window.removeEventListener("sale-changed", handleRefresh);
  }, [refresh]);

  // Detalle de Venta
  const [selectedSale, setSelectedSale] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Toast Configuración
  const [toastConfig, setToastConfig] = useState({
    visible: false,
    title: "",
    message: "",
  });

  const showToast = (title, message) => {
    setToastConfig({ visible: true, title, message });
    setTimeout(() => {
      setToastConfig((prev) => ({ ...prev, visible: false }));
    }, 5000);
  };

  const handleCreateSale = async (payload) => {
    setIsSubmitting(true);
    try {
      const res = await authFetch(`${API}/sales`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Error al procesar la venta en el servidor");
      }

      setIsCreateOpen(false);
      showToast(
        "Venta Consolidada", 
        `Se ha generado la venta VTA-${String(data.data?.idVenta || data.idVenta || "").padStart(3, '0')} y el reporte de facturación.`
      );
      refresh();
    } catch (error) {
      showToast(
        "Error al Consolidar Venta",
        error.message || "No se pudo consolidar la venta. Intente nuevamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredSales = sales.filter((sale) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      sale.id?.toLowerCase().includes(searchLower) ||
      sale.cliente?.toLowerCase().includes(searchLower) ||
      sale.identificacion?.toLowerCase().includes(searchLower)
    );
  });

  const paginatedSales = filteredSales.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="p-8 space-y-6 bg-transparent dark:bg-slate-950 min-h-screen transition-colors duration-300 overflow-auto">
      <SuccessToast 
        {...toastConfig} 
        onClose={() => setToastConfig(prev => ({ ...prev, visible: false }))} 
      />

      <PageHeader
        icon={FileText}
        title="Gestión de Ventas y Facturación"
        subtitle="Sincroniza pedidos entregados, procesa pagos y genera reportes de facturación oficial."
        buttonText="Nueva Venta"
        onButtonClick={() => openWindow("sale-create", { title: "Consolidar Venta (Generar Factura)", type: "sale-create", size: { width: 600, height: 550 } })}
        createPermission="Crear Venta"
      />

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700/60 transition-colors duration-300 flex flex-col">
        <TableToolbar
          title="Registro Histórico de Ventas"
          count={filteredSales.length}
          searchTerm={searchTerm}
          onSearchChange={(val) => { setSearchTerm(val); setCurrentPage(1); }}
          placeholder="Buscar por ID, cliente o identificación..."
        />

        {loading && sales.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400">
            <div className="h-10 w-10 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin mb-4"></div>
            <p className="text-sm font-medium">Cargando bitácora de ventas...</p>
          </div>
        ) : (
          <SalesTableModal 
            ventas={paginatedSales}
            onView={(venta) => {
               setSelectedSale(venta);
               setIsDetailsOpen(true);
            }}
            onPdf={(venta) => {
               setSelectedSale(venta);
               setTimeout(() => window.print(), 100);
            }}
          />
        )}

        <TablePagination
          currentPage={currentPage}
          totalPages={Math.ceil(filteredSales.length / itemsPerPage) || 1}
          onPageChange={setCurrentPage}
        />
      </div>



      <SalesDetailsModal 
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        venta={selectedSale}
      />

      <PrintableDocument 
          title="Factura de Venta"
          folio={selectedSale?.id || "VTA-000"}
          date={selectedSale?.fechaOriginal ? new Date(selectedSale.fechaOriginal).toLocaleDateString() : ""}
          client={{
              name: selectedSale?.clienteCompleto?.razonSocial || selectedSale?.clienteCompleto?.nombreCliente || selectedSale?.cliente || "Cliente",
              id: selectedSale?.clienteCompleto?.numeroDocumento || (selectedSale?.identificacion?.includes(':') ? selectedSale?.identificacion.split(':')[1].trim() : selectedSale?.identificacion) || "N/A",
              docType: selectedSale?.clienteCompleto?.tipoDocumento?.sigla || (selectedSale?.identificacion?.includes(':') ? selectedSale?.identificacion.split(':')[0].trim() : "NIT/CC"),
              address: selectedSale?.clienteCompleto?.direccion || "No registrada",
              city: selectedSale?.clienteCompleto?.municipio?.nombre || selectedSale?.clienteCompleto?.municipio?.name || selectedSale?.clienteCompleto?.ciudad || "No registrada",
              department: selectedSale?.clienteCompleto?.municipio?.departamento?.nombre || selectedSale?.clienteCompleto?.municipio?.departamento?.name || selectedSale?.clienteCompleto?.departamento || "",
              phone: selectedSale?.clienteCompleto?.telefono || "",
              email: selectedSale?.clienteCompleto?.email || ""
          }}
          concept={selectedSale?.idPedido || selectedSale?.pedido?.idPedido ? `Venta de Pedido #${selectedSale.idPedido || selectedSale.pedido.idPedido}` : "Venta Directa"}
          type="sale"
          items={
             selectedSale?.pedido?.detalles && selectedSale.pedido.detalles.length > 0 
             ? selectedSale.pedido.detalles.map(d => {
                 const descuento = parseFloat(d.descuento_aplicado || d.descuento || 0);
                 const totalItem = parseFloat(d.subtotal_linea || d.subtotal || 0);
                 const subtotalItem = totalItem + descuento;
                 const precioUnitario = subtotalItem / (d.cantidad_solicitada || d.cantidad || 1);
                 
                 return {
                     codigo: d.producto?.referencia || d.producto?.codigoProducto || "N/A",
                     descripcion: d.producto?.nombre || d.producto?.nombreProducto || "Producto",
                     cantidad: d.cantidad_solicitada || d.cantidad || 1,
                     precioUnitario: precioUnitario,
                     subtotal: subtotalItem,
                     descuento: descuento,
                     total: totalItem
                 };
             })
             : [{
                 descripcion: selectedSale?.observaciones || "Comprobante de venta consolidada",
                 codigo: "N/A",
                 cantidad: 1,
                 precioUnitario: selectedSale?.valorOriginal || 0,
                 subtotal: selectedSale?.valorOriginal || 0,
                 descuento: 0,
                 total: selectedSale?.valorOriginal || 0
             }]
          }
          totals={(() => {
             let subtotalSinDescuento = 0;
             let descuentoTotal = 0;
             let subtotalConDescuento = 0;

             if (selectedSale?.pedido?.detalles) {
               selectedSale.pedido.detalles.forEach(d => {
                 const totalItem = parseFloat(d.subtotal_linea || d.subtotal || 0);
                 const descuento = parseFloat(d.descuento_aplicado || d.descuento || 0);
                 const subtotalItem = totalItem + descuento;

                 subtotalSinDescuento += subtotalItem;
                 descuentoTotal += descuento;
                 subtotalConDescuento += totalItem;
               });
             } else {
                 subtotalSinDescuento = selectedSale?.valorOriginal || 0;
                 subtotalConDescuento = selectedSale?.valorOriginal || 0;
             }

             const ivaTotal = subtotalConDescuento * 0.19;

             return {
                 subtotalSinDescuento,
                 descuentoTotal,
                 ivaTotal,
                 total: selectedSale?.valorOriginal || 0
             };
          })()}
          isCancelled={selectedSale?.id_estado === 3 || selectedSale?.idEstado === 3 || selectedSale?.estado === 'Anulada' || selectedSale?.estado === 'Anulado'}
          footerNote="Comprobante de venta consolidada. Conservar para devoluciones o garantías."
      />
    </div>
  );
}

