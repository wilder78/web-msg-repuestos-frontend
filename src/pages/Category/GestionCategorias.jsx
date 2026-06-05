import React, { useState, useEffect, useMemo } from "react";
import { ClipboardList, Loader2, Tag } from "lucide-react";
import PageHeader from "../../components/shared/PageHeader";
import TableToolbar from "../../components/shared/TableToolbar";
import TablePagination from "../../components/shared/TablePagination";
import SuccessToast from "../../components/ui/SuccessToast";
import { CategoryTable } from "./components/CategoryTable";
import { useModalDock } from "../../contexts/ModalDockContext";
import CategoryDetailsModal from "./components/CategoryDetailsModal";
import { ConfirmActionModal } from "../../components/shared/ConfirmActionModal";


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

const CATEGORY_ENDPOINT = "/api/categories";

const mapCategory = (category) => {
  const id =
    category.id_categoria ??
    category.idCategoria ??
    category.idcategory ??
    category.id;
  const nombre =
    category.nombre_categoria ||
    category.nombreCategoria ||
    category.nombrecategory ||
    category.nombre ||
    "";
  const statusId =
    category.id_estado ??
    category.idEstado ??
    category.idestado ??
    category.estado?.idEstado ??
    1;

  return {
    id: id ?? "",
    id_categoria: id ?? "",
    nombre,
    nombre_categoria: nombre,
    descripcion: category.descripcion || "",
    estado: Number(statusId) === 1 ? "activo" : "inactivo",
    statusId,
  };
};

const GestionCategorias = () => {
  const { openWindow } = useModalDock();
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [modals, setModals] = useState({
    view: false,
    delete: false,
  });

  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const [successToast, setSuccessToast] = useState({
    visible: false,
    title: "",
    message: "",
  });

  const loadCategories = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await authFetch(CATEGORY_ENDPOINT);
      if (!response.ok) throw new Error("Error al cargar categorías");

      const payload = await response.json();
      const rawData = payload?.data || payload?.categories || payload || [];
      const lista = Array.isArray(rawData) ? rawData : [];

      setCategorias(lista.map(mapCategory));
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar las categorías.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    const handleChanged = (e) => {
      loadCategories();
      if (e?.detail) {
        showSuccessToast(
          e.detail.title || "Categoría guardada",
          e.detail.message || "La categoría ha sido guardada exitosamente."
        );
      }
    };
    window.addEventListener("category-changed", handleChanged);
    return () => window.removeEventListener("category-changed", handleChanged);
  }, []);

  const filteredCategorias = useMemo(() => {
    return categorias.filter((c) => {
      const search = searchTerm.toLowerCase();
      return (
        c.nombre.toLowerCase().includes(search) ||
        c.descripcion.toLowerCase().includes(search)
      );
    });
  }, [categorias, searchTerm]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCategorias.length / itemsPerPage),
  );

  const paginatedCategorias = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredCategorias.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCategorias, currentPage]);

  const handleToggleStatus = async (category) => {
    const nextStatus = category.statusId === 1 ? 2 : 1;
    const categoryId = category.id ?? category.id_categoria;
    try {
      const response = await authFetch(`${CATEGORY_ENDPOINT}/${categoryId}`, {
        method: "PUT",
        body: JSON.stringify({ id_estado: nextStatus }),
      });
      if (!response.ok) throw new Error("Error al cambiar estado");

      setCategorias((prev) =>
        prev.map((c) =>
          (c.id ?? c.id_categoria) === categoryId
            ? {
                ...c,
                statusId: nextStatus,
                estado: nextStatus === 1 ? "activo" : "inactivo",
              }
            : c,
        ),
      );

      showSuccessToast(
        nextStatus === 1 ? "Categoría Activada" : "Categoría Inactivada",
        `La categoría "${category.nombre}" ha sido actualizada.`,
      );
    } catch (err) {
      console.error(err);
    }
  };

  const showSuccessToast = (title, message) => {
    setSuccessToast({ visible: true, title, message });
    setTimeout(
      () => setSuccessToast((prev) => ({ ...prev, visible: false })),
      4500,
    );
  };

  const toggleModal = (type, isOpen, item = null) => {
    setSelectedCategory(item);
    setModals((prev) => ({ ...prev, [type]: isOpen }));
    if (!isOpen) {
      setDeleteError(null);
    }
  };


  const handleDeleteConfirm = async () => {
    if (!selectedCategory) return;
    const categoryId = selectedCategory.id ?? selectedCategory.id_categoria;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const response = await authFetch(`${CATEGORY_ENDPOINT}/${categoryId}`, {
        method: "DELETE",
      });

      if (response.status === 409) {
        setDeleteError(
          "La categoría tiene productos asociados y no se puede eliminar.",
        );
        return;
      }

      if (!response.ok) throw new Error("Error al eliminar");

      setCategorias((prev) =>
        prev.filter((c) => (c.id ?? c.id_categoria) !== categoryId),
      );
      toggleModal("delete", false);
      showSuccessToast(
        "Categoría eliminada",
        "El registro ha sido borrado correctamente.",
      );
    } catch (err) {
      setDeleteError("No se pudo completar la eliminación. Intente de nuevo.");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6 bg-transparent dark:bg-slate-950 min-h-screen transition-colors duration-300">
      <PageHeader
        icon={ClipboardList}
        title="Gestión de Categorías"
        subtitle="Administra las categorías de productos del inventario"
        buttonText="Nueva Categoría"
        onButtonClick={() => openWindow("category-create", { title: "Nueva Categoría", type: "category-create" })}
        createPermission="Crear Categoría"
      />

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700/60 overflow-hidden transition-colors duration-300 flex flex-col">
        <TableToolbar
          title="Categorías"
          count={filteredCategorias.length}
          searchTerm={searchTerm}
          onSearchChange={(val) => {
            setSearchTerm(val);
            setCurrentPage(1);
          }}
          placeholder="Buscar categoría..."
        />

        {loading ? (
          <div className="py-20 text-center text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mx-auto" />
            <p className="mt-3">Cargando categorías...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 bg-red-50">{error}</div>
        ) : (
          <CategoryTable
            categorias={paginatedCategorias}
            onView={(c) => toggleModal("view", true, c)}
            onEdit={(c) => openWindow(`category-edit-${c.id}`, { title: `Editar Categoría ${c.nombre}`, type: "category-edit", data: c })}
            onDelete={(c) => toggleModal("delete", true, c)}
            onToggleStatus={handleToggleStatus}
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

      <CategoryDetailsModal
        isOpen={modals.view}
        onClose={() => toggleModal("view", false)}
        categoria={selectedCategory}
      />

      <ConfirmActionModal
        isOpen={modals.delete}
        onClose={() => toggleModal("delete", false)}
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
        title="Confirmar eliminación"
        description="Esta acción es permanente y no se puede deshacer."
        itemName={selectedCategory?.nombre}
        itemSubtitle={selectedCategory?.descripcion || "Sin descripción"}
        itemId={selectedCategory?.id}
        alertMessage={
          <>
            ¿Seguro que deseas eliminar la categoría{" "}
            <strong>{selectedCategory?.nombre}</strong>?<br />
            <br />
            <span className="text-xs text-gray-500 font-normal">
              Al eliminarla, dejará de estar disponible para clasificar nuevos
              productos. Si ya tiene productos asociados, la operación será
              bloqueada.
            </span>
          </>
        }
        variant="danger"
        error={deleteError}
      />
    </div>
  );
};

export default GestionCategorias;

