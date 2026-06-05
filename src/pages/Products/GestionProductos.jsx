import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Package } from "lucide-react";

import { useProducts } from "../../hooks/useProducts";
import { useModalDock } from "../../contexts/ModalDockContext";
import PageHeader from "../../components/shared/PageHeader";
import TableToolbar from "../../components/shared/TableToolbar";
import TablePagination from "../../components/shared/TablePagination";
import SuccessToast from "../../components/ui/SuccessToast";

import ProductsTable from "./components/ProductsTable";
import ProductDetailsModal from "./components/ProductDetailsModal";
import { ConfirmActionModal } from "../../components/shared/ConfirmActionModal";



const GestionProductos = () => {
  const {
    products, setProducts,
    categories, categoryMap,
    loading, authFetch, refresh,
  } = useProducts();
  const { openWindow } = useModalDock();

  const [searchTerm, setSearchTerm]   = useState("");
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const q = searchParams.get("search") || searchParams.get("id");
    if (q) {
      setSearchTerm(q);
      setCurrentPage(1);
    }
  }, [searchParams]);

  useEffect(() => {
    const handleProductChanged = (e) => {
      refresh();
      if (e?.detail) {
        showToast(
          e.detail.title || "Producto guardado",
          e.detail.message || "El producto ha sido guardado exitosamente."
        );
      }
    };
    window.addEventListener("product-changed", handleProductChanged);
    return () => {
      window.removeEventListener("product-changed", handleProductChanged);
    };
  }, [refresh]);

  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 8;

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modals, setModals] = useState({
    view: false, delete: false,
  });
  const [actionLoading, setActionLoading]   = useState(false);
  const [deleteError, setDeleteError]       = useState(null);

  const [toastConfig, setToastConfig] = useState({
    visible: false, title: "", message: "",
  });

  const showToast = (title, message) => {
    setToastConfig({ visible: true, title, message });
    setTimeout(() => setToastConfig((p) => ({ ...p, visible: false })), 4500);
  };

  const handleStatusChangeSuccess = (productId, nextStatus) => {
    setProducts((prev) =>
      prev.map((p) => (p.idProducto || p.id_producto) === productId ? { ...p, idEstado: nextStatus, id_estado: nextStatus } : p)
    );
    showToast(
      nextStatus === 1 ? "Producto activado" : "Producto inactivado",
      "El estado se actualizó correctamente."
    );
  };

  // ─── Modales ──────────────────────────────────────────────────────────────

  const toggleModal = (type, isOpen, product = null) => {
    setSelectedProduct(product);
    if (type === "delete" && isOpen) {
      setDeleteError(null);
    }
    setModals((prev) => ({ ...prev, [type]: isOpen }));
  };

  // ─── Eliminar ─────────────────────────────────────────────────────────────

  const onDeleteSubmit = async () => {
    if (!selectedProduct) return;
    setActionLoading(true);
    setDeleteError(null);

    try {
      const res = await authFetch(
        `http://localhost:8080/api/products/${selectedProduct.idProducto || selectedProduct.id_producto}`,
        {
          method: "DELETE",
        }
      );

      const result = await res.json();
      
      if (!res.ok) {
        if (res.status === 409) {
           setDeleteError(result.message || "No se puede eliminar el producto porque tiene registros asociados (inventario, detalles, etc).");
           return false;
        }
        throw new Error(result.message || "Error al eliminar producto");
      }

      setProducts((prev) =>
        prev.filter((p) => (p.idProducto || p.id_producto) !== (selectedProduct.idProducto || selectedProduct.id_producto))
      );
      showToast("Producto eliminado", "El registro se borró correctamente de la base de datos.");
      toggleModal("delete", false);
      return true;
    } catch (error) {
      console.error("Error al eliminar producto:", error);
      setDeleteError(error.message || "Ocurrió un error al intentar eliminar el producto.");
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Filtrado y Paginación ────────────────────────────────────────────────

  const filteredProducts = products.filter((p) =>
    p.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.referencia?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.categoria?.nombre_categoria?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    categoryMap[p.idCategoria]?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * productsPerPage,
    currentPage * productsPerPage
  );

  return (
    <div className="p-8 space-y-6 bg-transparent dark:bg-slate-950 min-h-screen overflow-auto transition-colors duration-300">
      <SuccessToast
        {...toastConfig}
        onClose={() => setToastConfig((p) => ({ ...p, visible: false }))}
      />

      <PageHeader
        icon={Package}
        title="Gestión de Productos"
        subtitle="Panel administrativo de inventario MSG Repuestos"
        buttonText="Nuevo Producto"
        onButtonClick={() => openWindow("product-create", { title: "Registrar Nuevo Producto", type: "product-create", size: { width: 720, height: 580 } })}
        createPermission="Crear Producto"
      />

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700/60 overflow-hidden flex flex-col transition-colors duration-300">
        <TableToolbar
          title="Productos del Sistema"
          count={filteredProducts.length}
          searchTerm={searchTerm}
          onSearchChange={(val) => { setSearchTerm(val); setCurrentPage(1); }}
          placeholder="Buscar por nombre o categoría..."
        />

        <ProductsTable
          products={paginatedProducts}
          categoryMap={categoryMap}
          loading={loading}
          authFetch={authFetch}
          onView={(p) => toggleModal("view", true, p)}
          onEdit={(p) => openWindow(`product-edit-${p.idProducto || p.id_producto}`, { title: `Editar Producto: ${p.nombre}`, type: "product-edit", data: p, size: { width: 720, height: 580 } })}
          onDelete={(p) => toggleModal("delete", true, p)}
          onToggleStatus={handleStatusChangeSuccess}
        />

        <TablePagination
          currentPage={currentPage}
          totalPages={Math.ceil(filteredProducts.length / productsPerPage)}
          onPageChange={setCurrentPage}
        />
      </div>

      {modals.view && (
        <ProductDetailsModal
          isOpen={modals.view}
          onClose={() => toggleModal("view", false)}
          product={selectedProduct}
          categoryMap={categoryMap}
        />
      )}

      {modals.delete && (
        <ConfirmActionModal
          isOpen={modals.delete}
          onClose={() => toggleModal("delete", false)}
          onConfirm={onDeleteSubmit}
          loading={actionLoading}
          title="Confirmar eliminación"
          description="Esta acción es permanente y no se puede deshacer."
          itemName={selectedProduct?.nombre}
          itemSubtitle={selectedProduct?.referencia || "Sin referencia"}
          itemId={selectedProduct?.idProducto || selectedProduct?.id_producto}
          alertMessage={<>¿Seguro que deseas eliminar el producto <strong>{selectedProduct?.nombre}</strong>?<br/><br/><span className="text-xs text-gray-500 font-normal">El registro será borrado físicamente de la base de datos. Si tiene inventario o detalles asociados, la operación será bloqueada.</span></>}
          variant="danger"
          error={deleteError}
        />
      )}
    </div>
  );
};

export default GestionProductos;
