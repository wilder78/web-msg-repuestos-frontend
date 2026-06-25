import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../../components/Navbar/PublicNavbar";
import Footer from "../../components/Footer/Footer";
import WhatsAppButton from "../../components/shared/WhatsAppButton";
import ProductCard from "../../components/shared/ProductCard";
import FilterBar from "../../components/shared/FilterBar";
import { useAuth } from "../../hooks/useAuth";
import { useCart } from "../../contexts/CartContext";
import { Search, ShoppingCart, Loader2, CheckCircle2, ChevronLeft, ChevronRight, RotateCcw, Filter } from "lucide-react";
import api from "../../api/axios";

const formatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export default function GestionProductosWeb() {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSearch = searchParams.get("search") || "";
  
  // Estados para productos y paginación
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryMap, setCategoryMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [addedIds, setAddedIds] = useState({});

  // Estados de Filtros Solicitados
  const [search, setSearch] = useState(urlSearch);

  // Sync state if URL changes
  useEffect(() => {
    setSearch(urlSearch);
  }, [urlSearch]);
  const [categoria, setCategoria] = useState("");
  const [marca, setMarca] = useState("");
  const [precioMin, setPrecioMin] = useState("");
  const [precioMax, setPrecioMax] = useState("");
  const [soloNuevos, setSoloNuevos] = useState(false);

  // Estados temporales para los inputs de rango de precios (para el botón 'Aplicar')
  const [minPriceInput, setMinPriceInput] = useState("");
  const [maxPriceInput, setMaxPriceInput] = useState("");

  // Nuevo estado para las marcas solicitadas
  const [listaMarcas, setListaMarcas] = useState([]);

  // Cargar categorías en el montaje inicial
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get("/categories");
        const list = res.data?.data || res.data || [];
        setCategories(list);
        
        const map = {};
        list.forEach((cat) => {
          map[cat.idCategoria || cat.id_categoria] =
            cat.nombreCategoria || cat.nombre_categoria;
        });
        setCategoryMap(map);
      } catch (err) {
        console.error("Error al obtener categorías:", err);
      }
    };
    fetchCategories();
  }, []);

  // useEffect secundario para obtener las marcas
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const res = await api.get("/repuestos/brands");
        setListaMarcas(res.data || []);
      } catch (err) {
        console.error("Error al obtener marcas:", err);
      }
    };
    fetchBrands();
  }, []);

  // Forzar página 1 ante cualquier cambio de filtro
  const resetPage = () => {
    setCurrentPage(1);
  };

  // Escuchar cambios de filtros para reiniciar página
  useEffect(() => {
    resetPage();
  }, [search, categoria, marca, precioMin, precioMax, soloNuevos]);

  // Cargar productos paginados dinámicamente según filtros
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page: currentPage,
          limit: 12,
        });
        if (search) params.append("search", search);
        if (categoria && categoria !== "all") params.append("categoria", categoria);
        if (marca && marca !== "all") params.append("marca", marca);
        if (precioMin) params.append("precioMin", precioMin);
        if (precioMax) params.append("precioMax", precioMax);
        if (soloNuevos) params.append("soloNuevos", soloNuevos);

        const res = await api.get(`/repuestos?${params.toString()}`);
        const data = res.data || {};
        
        setProducts(data.products || []);
        setTotalPages(data.totalPages || 1);
      } catch (err) {
        console.error("Error al cargar productos paginados:", err);
        setError(err.message || "Error al obtener repuestos");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [currentPage, search, categoria, marca, precioMin, precioMax, soloNuevos]);

  // Aplicar rango de precios al hacer clic en 'Aplicar'
  const handleApplyPrices = (e) => {
    e.preventDefault();
    setPrecioMin(minPriceInput);
    setPrecioMax(maxPriceInput);
  };

  // Limpiar todos los filtros con un clic
  const handleClearFilters = () => {
    setSearch("");
    setSearchParams({});
    setCategoria("");
    setMarca("");
    setPrecioMin("");
    setPrecioMax("");
    setSoloNuevos(false);
    setMinPriceInput("");
    setMaxPriceInput("");
  };

  const handleAddToCart = (product, price) => {
    const cartProduct = {
      id: product.idProducto || product.id_producto,
      name: product.nombre?.replace(/\s*\(.*?\)/g, '')?.replace(/\s*\[.*?\]/g, '')?.trim() || "Producto",
      price: formatter.format(Number(price)),
      image: product.imagenUrl || product.imagen_url || null,
      marca: product.marca || "Genérico",
      stock: Number(product.stockBuenEstado ?? product.stock_buen_estado ?? product.stock ?? 0),
    };
    addToCart(cartProduct);

    setAddedIds((prev) => ({ ...prev, [cartProduct.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => {
        const next = { ...prev };
        delete next[cartProduct.id];
        return next;
      });
    }, 1500);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const renderPageButtons = () => {
    const buttons = [];
    for (let i = 1; i <= totalPages; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`w-10 h-10 rounded-xl text-sm font-semibold transition-all duration-200 ${
            currentPage === i
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          {i}
        </button>
      );
    }
    return buttons;
  };

  const filteredProductsList = useMemo(() => {
    return soloNuevos
      ? products.filter((prod) => prod.esNuevo === true || prod.es_nuevo === true)
      : products;
  }, [products, soloNuevos]);

  return (
    <div className="flex flex-col min-h-screen justify-between bg-slate-50 font-sans">
      <Navbar />

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3">
            Catálogo de <span className="text-blue-400">Productos</span>
          </h1>
          <p className="text-base text-blue-100 max-w-2xl mx-auto">
            Explora repuestos y accesorios originales para mantener tu motocicleta en ruta.
          </p>
        </div>
      </div>

      <div className="flex-grow w-full max-w-[1400px] mx-auto px-4 md:px-8 mt-8 pb-16 flex flex-col gap-6">
        
        {/* BARRA DE FILTROS UNIFICADA */}
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          categoria={categoria}
          onCategoriaChange={setCategoria}
          categories={categories}
          marca={marca}
          onMarcaChange={setMarca}
          brands={listaMarcas.length > 0 ? ["Todas", ...listaMarcas] : []}
          minPrice={precioMin}
          onMinPriceChange={setPrecioMin}
          maxPrice={precioMax}
          onMaxPriceChange={setPrecioMax}
          soloNuevos={soloNuevos}
          onSoloNuevosChange={(val) => {
            setSoloNuevos(val);
            setCurrentPage(1);
          }}
          onClearFilters={handleClearFilters}
          isNovedadesPage={false}
        />

        {/* CATÁLOGO DE PRODUCTOS */}
        <main className="w-full">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-blue-600">
              <Loader2 className="animate-spin mb-4" size={48} />
              <p className="text-lg font-medium">Cargando catálogo...</p>
            </div>
          ) : error ? (
            <div className="text-center py-20 text-red-500 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <p className="text-lg font-medium">Ocurrió un error al cargar los productos.</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <h3 className="text-2xl font-bold text-slate-800 mb-2">No se encontraron productos</h3>
              <p className="text-slate-500 text-sm">Intenta con otra combinación de filtros o limpia los parámetros actuales.</p>
            </div>
          ) : (
            <div className="flex flex-col h-full justify-between">
              
              {/* Grid de productos a 4 columnas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProductsList.map((product) => (
                  <ProductCard
                    key={product.idProducto || product.id_producto}
                    product={product}
                  />
                ))}
              </div>

              {/* Botonera de paginación */}
              {totalPages > 1 && (
                <div className="mt-12 flex justify-center items-center gap-2 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm max-w-fit mx-auto">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 transition-all duration-200 ${
                      currentPage === 1
                        ? "bg-slate-50 text-slate-300 cursor-not-allowed"
                        : "bg-white text-slate-600 hover:bg-slate-50 active:scale-95"
                    }`}
                  >
                    <ChevronLeft size={20} />
                  </button>
                  
                  {renderPageButtons()}

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 transition-all duration-200 ${
                      currentPage === totalPages
                        ? "bg-slate-50 text-slate-300 cursor-not-allowed"
                        : "bg-white text-slate-600 hover:bg-slate-50 active:scale-95"
                    }`}
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}

            </div>
          )}
        </main>
      </div>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
