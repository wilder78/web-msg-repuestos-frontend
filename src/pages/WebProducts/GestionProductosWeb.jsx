import React, { useState, useEffect, useMemo } from "react";
import Navbar from "../../components/Navbar/PublicNavbar";
import Footer from "../../components/Footer/Footer";
import WhatsAppButton from "../../components/shared/WhatsAppButton";
import { useAuth } from "../../hooks/useAuth";
import { useCart } from "../../contexts/CartContext";
import { Search, ShoppingCart, Loader2, CheckCircle2, ChevronLeft, ChevronRight, RotateCcw, Filter } from "lucide-react";
import api from "../../api/axios";

export default function GestionProductosWeb() {
  const { addToCart } = useCart();
  const { user } = useAuth();
  
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
  const [search, setSearch] = useState("");
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
      price: `S/ ${Number(price).toFixed(2)}`,
      image: product.imagenUrl || product.imagen_url || null,
      marca: product.marca || "Genérico",
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

      <div className="flex-grow w-full max-w-[1400px] mx-auto px-4 md:px-8 mt-8 pb-16 flex flex-col lg:flex-row gap-6">
        
        {/* SIDEBAR DE FILTROS */}
        <aside className="w-full lg:w-1/4 xl:w-1/5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-6 h-fit">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Filter size={18} className="text-blue-600" />
              Filtros de Búsqueda
            </h2>
          </div>

          {/* 1. Buscador */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Buscar repuesto
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Nombre, marca..."
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* 2. Categorías */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Categoría
            </label>
            <select
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm cursor-pointer transition-all"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
            >
              <option value="all">Todas las categorías</option>
              <option value="">Todas las categorías</option>
              {categories.map((cat) => (
                <option key={cat.idCategoria || cat.id_categoria} value={cat.idCategoria || cat.id_categoria}>
                  {cat.nombreCategoria || cat.nombre_categoria}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Marcas */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Marca
            </label>
            <select
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm cursor-pointer transition-all"
              value={marca}
              onChange={(e) => { setMarca(e.target.value); setCurrentPage(1); }}
            >
              <option value="">Todas las marcas</option>
              {listaMarcas.map((nombreMarca, index) => (
                <option key={index} value={nombreMarca}>
                  {nombreMarca}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Rango de Precios */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Rango de Precios (S/)
            </label>
            <form onSubmit={handleApplyPrices} className="flex gap-2 items-center">
              <input
                type="number"
                placeholder="Min"
                className="w-full px-2 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={minPriceInput}
                onChange={(e) => setMinPriceInput(e.target.value)}
              />
              <span className="text-slate-400 text-xs">—</span>
              <input
                type="number"
                placeholder="Max"
                className="w-full px-2 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={maxPriceInput}
                onChange={(e) => setMaxPriceInput(e.target.value)}
              />
              <button
                type="submit"
                className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                Aplicar
              </button>
            </form>
          </div>

          {/* 5. Productos Nuevos */}
          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Mostrar solo nuevos
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={soloNuevos}
                onChange={(e) => setSoloNuevos(e.target.checked)}
              />
              <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Botón Limpiar Filtros */}
          <button
            onClick={handleClearFilters}
            className="mt-2 w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw size={16} />
            Limpiar Filtros
          </button>
        </aside>

        {/* CATÁLOGO DE PRODUCTOS */}
        <main className="w-full lg:w-3/4 xl:w-4/5">
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
                {products.map((product) => {
                  const publicPrice = Number(product.precioPublico ?? product.precio_publico ?? 0);
                  const minoristaPrice = Number(product.precioMinorista ?? product.precio_minorista ?? 0);
                  const mayoristaPrice = Number(product.precioMayorista ?? product.precio_mayorista ?? 0);

                  let price = publicPrice;
                  if (Number(user?.idRol) === 4 && user?.tipoCliente) {
                    const tipo = user.tipoCliente.toLowerCase();
                    if (tipo === "minorista" && minoristaPrice > 0) price = minoristaPrice;
                    else if (tipo === "mayorista" && mayoristaPrice > 0) price = mayoristaPrice;
                  }

                  const stock = product.stockBuenEstado ?? product.stock_buen_estado ?? 0;
                  const productId = product.idProducto || product.id_producto;
                  const justAdded = !!addedIds[productId];

                  return (
                    <div
                      key={productId}
                      className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 group flex flex-col h-full"
                    >
                      <div className="relative h-48 bg-slate-100 flex items-center justify-center overflow-hidden">
                        {product.imagenUrl || product.imagen_url ? (
                          <img
                            src={product.imagenUrl || product.imagen_url}
                            alt={product.nombre}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <span className="text-slate-400 font-medium text-sm">Sin imagen</span>
                        )}
                        {stock === 0 && (
                          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                            <span className="bg-red-500 text-white font-bold px-4 py-1.5 rounded-lg transform -rotate-12 text-xs shadow-lg">
                              AGOTADO
                            </span>
                          </div>
                        )}
                        {(product.esNuevo || product.es_nuevo) && (
                          <div className="absolute top-2 left-2">
                            <span className="bg-blue-600 text-white font-extrabold px-3 py-1 rounded-lg text-xs shadow-md">
                              NUEVO
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="p-5 flex flex-col flex-1">
                        <p className="text-xs font-semibold text-blue-600 mb-1 uppercase tracking-wider">
                          {product.marca || "Genérico"}
                        </p>
                        <h3
                          className="font-bold text-slate-800 text-base mb-2 line-clamp-2 h-12"
                          title={product.nombre?.replace(/\s*\(.*?\)/g, '')?.replace(/\s*\[.*?\]/g, '')?.trim()}
                        >
                          {product.nombre?.replace(/\s*\(.*?\)/g, '')?.replace(/\s*\[.*?\]/g, '')?.trim() || "Producto"}
                        </h3>

                        <div className="mt-auto pt-4 flex items-center justify-between">
                          <span className="text-xl font-extrabold text-slate-900">
                            S/ {Number(price).toFixed(2)}
                          </span>
                        </div>

                        <button
                          onClick={() => stock > 0 && handleAddToCart(product, price)}
                          disabled={stock === 0}
                          className={`mt-4 w-full py-2.5 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                            stock === 0
                              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                              : justAdded
                              ? "bg-emerald-500 text-white shadow-md"
                              : "bg-slate-900 hover:bg-blue-600 text-white active:scale-95"
                          }`}
                        >
                          {justAdded ? (
                            <>
                              <CheckCircle2 size={16} />
                              ¡Añadido!
                            </>
                          ) : (
                            <>
                              <ShoppingCart size={16} />
                              {stock > 0 ? "Agregar al Carrito" : "Sin Stock"}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
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
