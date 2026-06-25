import React, { useState, useMemo, useEffect } from "react";
import Navbar from "../../components/Navbar/PublicNavbar";
import Footer from "../../components/Footer/Footer";
import WhatsAppButton from "../../components/shared/WhatsAppButton";
import ProductCard from "../../components/shared/ProductCard";
import FilterBar from "../../components/shared/FilterBar";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useNovedades } from "../../contexts/NovedadesContext";

export default function RecienLlegados() {
  const { nuevasNovedades: products, loading } = useNovedades();
  
  // Estados para los filtros en tiempo real
  const [search, setSearch] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");

  // Estado para la paginación local
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Extraer las marcas disponibles dinámicamente de los productos cargados
  const brands = useMemo(() => {
    const unique = new Set(products.map((p) => p.marca).filter(Boolean));
    return ["Todas", ...Array.from(unique)];
  }, [products]);

  // Filtrado de productos en el cliente (tiempo real)
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // 1. Filtro por buscador
      const rawName = product.name || product.nombre || "";
      const matchesSearch = rawName.toLowerCase().includes(search.toLowerCase()) ||
                            (product.marca || "").toLowerCase().includes(search.toLowerCase());

      // 2. Filtro por marca (ChoiceChips)
      const matchesBrand = !selectedBrand || selectedBrand === "Todas" || product.marca === selectedBrand;

      // 3. Filtro por precio
      let priceValue = Number(product.precio_publico || product.precioPublico || product.price || 0);
      const matchesMinPrice = !minPrice || priceValue >= Number(minPrice);
      const matchesMaxPrice = !maxPrice || priceValue <= Number(maxPrice);

      // 4. Filtro por calificación (simulada/social proof para novedades)
      const rating = product.rating || (product.id_producto % 3 === 0 ? 5 : product.id_producto % 2 === 0 ? 4 : 3);
      const matchesRating = !ratingFilter || rating >= Number(ratingFilter);

      return matchesSearch && matchesBrand && matchesMinPrice && matchesMaxPrice && matchesRating;
    });
  }, [products, search, selectedBrand, minPrice, maxPrice, ratingFilter]);

  // Reiniciar página a 1 cuando cambien los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedBrand, minPrice, maxPrice, ratingFilter]);

  // Calcular total de páginas
  const totalPages = useMemo(() => {
    return Math.ceil(filteredProducts.length / itemsPerPage);
  }, [filteredProducts, itemsPerPage]);

  // Segmentar el listado según la página actual
  const paginatedProducts = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    return filteredProducts.slice(startIdx, endIdx);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleClearFilters = () => {
    setSearch("");
    setSelectedBrand("");
    setMinPrice("");
    setMaxPrice("");
    setRatingFilter("");
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

      {/* Hero Header (Mismo estilo que /repuestos) */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3">
            Novedades y <span className="text-blue-400">Recién Llegados</span>
          </h1>
          <p className="text-base text-blue-100 max-w-2xl mx-auto">
            Explora las últimas 20 piezas integradas al stock para mantener tu motocicleta en ruta.
          </p>
        </div>
      </div>

      <main className="flex-grow w-full max-w-[1400px] mx-auto px-4 md:px-8 mt-8 pb-16 flex flex-col gap-6">
        
        {/* BARRA DE FILTROS HORIZONTALES */}
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          marca={selectedBrand}
          onMarcaChange={setSelectedBrand}
          brands={brands}
          minPrice={minPrice}
          onMinPriceChange={setMinPrice}
          maxPrice={maxPrice}
          onMaxPriceChange={setMaxPrice}
          ratingFilter={ratingFilter}
          onRatingFilterChange={setRatingFilter}
          onClearFilters={handleClearFilters}
          isNovedadesPage={true}
        />

        {/* CONTENIDO PRINCIPAL */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-blue-600">
            <Loader2 className="h-10 w-10 animate-spin mb-3" />
            <span className="text-sm font-medium">Cargando novedades...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <h3 className="text-2xl font-bold text-slate-800 mb-2">No se encontraron productos</h3>
            <p className="text-slate-500 text-sm">Prueba ajustando los filtros aplicados en la parte superior.</p>
          </div>
        ) : (
          <div className="flex flex-col h-full justify-between">
            {/* Grid de productos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {paginatedProducts.map((product) => (
                <ProductCard
                  key={product.idProducto || product.id_producto}
                  product={product}
                />
              ))}
            </div>

            {/* Paginación */}
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

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
