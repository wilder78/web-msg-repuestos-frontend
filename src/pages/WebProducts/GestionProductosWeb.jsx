import React, { useState, useMemo } from "react";
import Navbar from "../../components/Navbar/PublicNavbar";
import Footer from "../../components/Footer/Footer";
import WhatsAppButton from "../../components/shared/WhatsAppButton";
import { useAuth } from "../../hooks/useAuth";
import { useProducts } from "../../hooks/useProducts";
import { useCart } from "../../contexts/CartContext";
import { Search, ShoppingCart, Filter, Loader2, CheckCircle2 } from "lucide-react";

export default function GestionProductosWeb() {
  const { products, categoryMap, loading, error } = useProducts();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [addedIds, setAddedIds] = useState({});

  const handleAddToCart = (product, price) => {
    const cartProduct = {
      id: product.idProducto || product.id_producto,
      name: product.nombre?.replace(/\s*\(.*?\)/g, '')?.replace(/\s*\[.*?\]/g, '')?.trim() || "Producto",
      price: `S/ ${Number(price).toFixed(2)}`,
      image: product.imagenUrl || product.imagen_url || null,
      marca: product.marca || "Genérico",
    };
    addToCart(cartProduct);

    // Feedback visual breve (1.5 s)
    setAddedIds((prev) => ({ ...prev, [cartProduct.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => {
        const next = { ...prev };
        delete next[cartProduct.id];
        return next;
      });
    }, 1500);
  };

  // Filtrar productos solo activos y por búsqueda/categoría
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const isActive =
        (p.idEstado || p.id_estado) === 1 || !(p.idEstado || p.id_estado);
      if (!isActive) return false;

      const matchesSearch =
        p.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.marca?.toLowerCase().includes(searchTerm.toLowerCase());

      const catId =
        p.idCategoria ||
        p.id_categoria ||
        p.categoria?.idCategoria ||
        p.categoria?.id_categoria;
      const matchesCategory =
        selectedCategory === "all" || catId?.toString() === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  // Agrupar por categoría
  const productsByCategory = useMemo(() => {
    const groups = {};
    filteredProducts.forEach((p) => {
      const catId =
        p.idCategoria ||
        p.id_categoria ||
        p.categoria?.idCategoria ||
        p.categoria?.id_categoria;
      const catName = categoryMap[catId] || "Otros";
      if (!groups[catName]) groups[catName] = [];
      groups[catName].push(p);
    });
    return groups;
  }, [filteredProducts, categoryMap]);

  // Lista única de categorías para el filtro
  const availableCategories = useMemo(() => {
    const cats = new Set();
    products.forEach((p) => {
      const catId =
        p.idCategoria ||
        p.id_categoria ||
        p.categoria?.idCategoria ||
        p.categoria?.id_categoria;
      if (catId) cats.add(catId.toString());
    });
    return Array.from(cats).map((id) => ({
      id,
      name: categoryMap[id] || "Otros",
    }));
  }, [products, categoryMap]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <Navbar />

      <div className="flex-1">
        {/* Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Catálogo de <span className="text-blue-400">Productos</span>
          </h1>
          <p className="text-lg text-blue-100 max-w-2xl mx-auto">
            Explora nuestra amplia variedad de repuestos y accesorios para tu motocicleta.
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">

        {/* Buscador y Filtros */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-10 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Buscar por nombre, marca o descripción..."
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            <Filter size={20} className="text-slate-400 hidden md:block" />
            <button
              onClick={() => setSelectedCategory("all")}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                selectedCategory === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Todos
            </button>
            {availableCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  selectedCategory === cat.id
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Contenido principal */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-blue-600">
            <Loader2 className="animate-spin mb-4" size={48} />
            <p className="text-lg font-medium">Cargando catálogo...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 text-red-500">
            <p className="text-lg font-medium">
              Ocurrió un error al cargar los productos.
            </p>
            <p className="text-sm">{error}</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <h3 className="text-2xl font-bold text-slate-800 mb-2">
              No se encontraron productos
            </h3>
            <p className="text-slate-500">
              Intenta con otra búsqueda o selecciona una categoría diferente.
            </p>
          </div>
        ) : (
          <div className="space-y-16">
            {Object.entries(productsByCategory).map(([categoryName, items]) => (
              <section key={categoryName}>
                <div className="flex items-center gap-4 mb-6">
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-900 capitalize">
                    {categoryName}
                  </h2>
                  <div className="h-px bg-slate-200 flex-1"></div>
                  <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                    {items.length} {items.length === 1 ? "producto" : "productos"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {items.map((product) => {
                    const publicPrice = Number(product.precioPublico ?? product.precio_publico ?? 0);
                    const minoristaPrice = Number(product.precioMinorista ?? product.precio_minorista ?? 0);
                    const mayoristaPrice = Number(product.precioMayorista ?? product.precio_mayorista ?? 0);

                    // Precio base: público para invitados y roles != 4
                    let price = publicPrice;

                    if (Number(user?.idRol) === 4 && user?.tipoCliente) {
                      const tipo = user.tipoCliente.toLowerCase();
                      if (tipo === "minorista" && minoristaPrice > 0) price = minoristaPrice;
                      else if (tipo === "mayorista" && mayoristaPrice > 0) price = mayoristaPrice;
                      // "consumidor final" → precio_publico (por defecto)
                    }

                    const stock =
                      product.stockBuenEstado ?? product.stock_buen_estado ?? 0;
                    const productId =
                      product.idProducto || product.id_producto;
                    const justAdded = !!addedIds[productId];

                    return (
                      <div
                        key={productId}
                        className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 group flex flex-col"
                      >
                        {/* Imagen */}
                        <div className="relative h-48 bg-slate-100 flex items-center justify-center overflow-hidden">
                          {product.imagenUrl || product.imagen_url ? (
                            <img
                              src={product.imagenUrl || product.imagen_url}
                              alt={product.nombre}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <span className="text-slate-400 font-medium">
                              Sin imagen
                            </span>
                          )}
                          {stock === 0 && (
                            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                              <span className="bg-red-500 text-white font-bold px-4 py-1.5 rounded-lg transform -rotate-12 text-sm shadow-lg">
                                AGOTADO
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Datos */}
                        <div className="p-5 flex flex-col flex-1">
                          <p className="text-xs font-semibold text-blue-600 mb-1 uppercase tracking-wider">
                            {product.marca || "Genérico"}
                          </p>
                          <h3
                            className="font-bold text-slate-800 text-lg mb-2 line-clamp-2"
                            title={product.nombre?.replace(/\s*\(.*?\)/g, '')?.replace(/\s*\[.*?\]/g, '')?.trim()}
                          >
                            {product.nombre?.replace(/\s*\(.*?\)/g, '')?.replace(/\s*\[.*?\]/g, '')?.trim() || "Producto"}
                          </h3>

                          <div className="mt-auto pt-4 flex items-center justify-between">
                            <span className="text-2xl font-extrabold text-slate-900">
                              S/ {Number(price).toFixed(2)}
                            </span>
                          </div>

                          <button
                            onClick={() =>
                              stock > 0 && handleAddToCart(product, price)
                            }
                            disabled={stock === 0}
                            className={`mt-4 w-full py-2.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                              stock === 0
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                : justAdded
                                ? "bg-emerald-500 text-white shadow-md shadow-emerald-200"
                                : "bg-slate-900 hover:bg-blue-600 text-white active:scale-95"
                            }`}
                          >
                            {justAdded ? (
                              <>
                                <CheckCircle2 size={18} />
                                ¡Añadido!
                              </>
                            ) : (
                              <>
                                <ShoppingCart size={18} />
                                {stock > 0 ? "Agregar al Carrito" : "Sin Stock"}
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
      </div>

      <Footer />

      <WhatsAppButton />
    </div>
  );
}
