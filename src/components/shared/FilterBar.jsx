import React from "react";
import { Search, Filter, RotateCcw } from "lucide-react";

export default function FilterBar({
  search,
  onSearchChange,
  categoria,
  onCategoriaChange,
  categories = [],
  marca,
  onMarcaChange,
  brands = [],
  minPrice,
  onMinPriceChange,
  maxPrice,
  onMaxPriceChange,
  soloNuevos,
  onSoloNuevosChange,
  ratingFilter,
  onRatingFilterChange,
  onClearFilters,
  isNovedadesPage = false,
}) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-5 w-full">
      {/* Header de Filtros */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Filter size={18} className="text-blue-600" />
          Filtrar Catálogo en Tiempo Real
        </h2>
        <button
          onClick={onClearFilters}
          className="text-xs text-blue-600 hover:text-blue-500 font-bold flex items-center gap-1 transition-colors"
        >
          <RotateCcw size={14} />
          Limpiar filtros
        </button>
      </div>

      {/* Fila de Controles */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 w-full">
        {/* Buscador */}
        <div className="flex-1 max-w-md w-full flex flex-col gap-1.5">
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
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>

        {/* Controles del lado derecho */}
        <div className="flex flex-col sm:flex-row items-center gap-4 flex-wrap">
          {/* Categoría (solo visible si no es novedades o si hay categorías) */}
          {!isNovedadesPage && categories.length > 0 && (
            <div className="flex flex-col gap-1.5 w-full sm:w-auto">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Categoría
              </label>
              <select
                className="w-full sm:w-48 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm cursor-pointer transition-all"
                value={categoria}
                onChange={(e) => onCategoriaChange(e.target.value)}
              >
                <option value="">Todas las categorías</option>
                <option value="all">Todas las categorías</option>
                {categories.map((cat) => (
                  <option key={cat.idCategoria || cat.id_categoria} value={cat.idCategoria || cat.id_categoria}>
                    {cat.nombreCategoria || cat.nombre_categoria}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Rango de Precios */}
          <div className="flex flex-col gap-1.5 w-full sm:w-auto">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Rango de Precios ($)
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                placeholder="Min"
                className="w-full sm:w-28 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={minPrice}
                onChange={(e) => onMinPriceChange(e.target.value)}
              />
              <span className="text-slate-400 text-sm">—</span>
              <input
                type="number"
                placeholder="Max"
                className="w-full sm:w-28 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={maxPrice}
                onChange={(e) => onMaxPriceChange(e.target.value)}
              />
            </div>
          </div>

          {/* Calificación (sólo visible para novedades o si se pasa handler) */}
          {onRatingFilterChange && (
            <div className="flex flex-col gap-1.5 w-full sm:w-auto">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Calificación
              </label>
              <select
                className="w-full sm:w-48 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm cursor-pointer transition-all"
                value={ratingFilter}
                onChange={(e) => onRatingFilterChange(e.target.value)}
              >
                <option value="">Todas las calificaciones</option>
                <option value="5">5 Estrellas (Excelente)</option>
                <option value="4">4+ Estrellas (Muy bueno)</option>
                <option value="3">3+ Estrellas (Bueno)</option>
              </select>
            </div>
          )}

          {/* Switch de 'Mostrar solo nuevos' (Oculto en página de novedades) */}
          {!isNovedadesPage && onSoloNuevosChange && (
            <div className="flex items-center justify-between gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100 h-[46px] mt-5">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Solo nuevos
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={soloNuevos}
                  onChange={(e) => onSoloNuevosChange(e.target.checked)}
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          )}
        </div>
      </div>

      {/* ChoiceChips de Marca */}
      {brands.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-slate-100 pt-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Marcas disponibles
          </span>
          <div className="flex flex-wrap gap-2">
            {brands.map((b) => (
              <button
                key={b}
                onClick={() => onMarcaChange(b === "Todas" ? "" : b)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                  (!marca && b === "Todas") || marca === b
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
