import React, { useState } from "react";
import { ShoppingCart, CheckCircle2 } from "lucide-react";
import { useCart } from "../../contexts/CartContext";
import { useAuth } from "../../hooks/useAuth";
import { formatCurrency } from "../../utils/formatters";

export default function ProductCard({ product, showNew = false, variant = "default" }) {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [justAdded, setJustAdded] = useState(false);

  const image = product.image || product.imagen_url || product.imagenUrl || "https://images.unsplash.com/photo-1486006920555-c77dcf18193c?w=500&auto=format&fit=crop&q=60";
  const rawName = product.name || product.nombre || "Producto";
  const name = rawName.replace(/\s*\(.*?\)/g, '').replace(/\s*\[.*?\]/g, '').trim();

  // Obtener stock del producto
  const stock = Number(product.stock ?? product.stockBuenEstado ?? product.stock_buen_estado ?? 0);

  // Precio base: siempre precio_publico para invitados o roles != 4
  let priceValue = Number(product.precio_publico || product.precioPublico || product.price || 0);

  if (Number(user?.idRol) === 4 && user?.tipoCliente) {
    const tipo = user.tipoCliente.toLowerCase();
    const minoristaPrice = Number(product.precio_minorista || product.precioMinorista || 0);
    const mayoristaPrice = Number(product.precio_mayorista || product.precioMayorista || 0);

    if (tipo === "minorista" && minoristaPrice > 0) priceValue = minoristaPrice;
    else if (tipo === "mayorista" && mayoristaPrice > 0) priceValue = mayoristaPrice;
  }

  const price = formatCurrency(priceValue);

  const cartItem = {
    id: product.id || product.idProducto || product.id_producto,
    name,
    price,
    image,
    stock,
  };

  const handleAdd = () => {
    if (stock <= 0) return;
    addToCart(cartItem);
    setJustAdded(true);
    setTimeout(() => {
      setJustAdded(false);
    }, 1500);
  };

  if (variant === "detailed") {
    return (
      <div className="group relative bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:-translate-y-[5px] hover:border-orange-200/50 hover:shadow-2xl hover:shadow-orange-500/5 transition-all duration-300 ease-in-out flex flex-col h-full">
        {/* Zona de Badges: Encabezado blanco estático */}
        <div className="w-full flex justify-between items-center px-4 py-3 bg-white border-b border-slate-100/50">
          {stock > 0 ? (
            <span className="rounded-[6px] bg-[#008A5A] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
              En Stock
            </span>
          ) : (
            <span className="rounded-[6px] bg-red-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
              Agotado
            </span>
          )}

          <div className="flex items-center gap-1 bg-[#2C3242] px-2.5 py-1 rounded-[6px]">
            <svg className="w-3 h-3 text-amber-400 fill-amber-400" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-[10px] font-bold text-white ml-0.5">{product.rating || "4.9"} |</span>
            <span className="text-[10px] text-white/90 ml-0.5">+{product.ventas || "140"} vendidos</span>
          </div>
        </div>
        
        {/* Contenedor de la Imagen: Fondo gris */}
        <div className="relative h-44 bg-[#F5F6F8] flex items-center justify-center p-4">
          <img
            src={image}
            alt={name}
            className="h-full w-auto max-w-[85%] object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
          />
          {stock <= 0 && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
              <span className="bg-red-500 text-white font-bold px-4 py-1.5 rounded-lg transform -rotate-12 text-xs shadow-lg">
                AGOTADO
              </span>
            </div>
          )}
        </div>

        {/* Bloque de Información Inferior */}
        <div className="p-5 flex flex-col flex-1 text-left">
          <h3 className="font-medium text-slate-900 text-[15px] leading-snug mb-3 h-10 line-clamp-2 group-hover:text-[#2C3242] transition-colors" title={name}>
            {name}
          </h3>

          <div className="flex flex-col gap-1.5 mb-5">
            <p className="text-[11px] text-slate-500 truncate">
              <span className="font-semibold text-slate-600">Compatibilidad:</span> {product.compatibilidad || "Honda Wave, Yamaha Cryp..."}
            </p>
            <div className="flex items-center gap-1 text-[#008A5A]">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-[11px] font-medium tracking-wide">Garantizado</span>
            </div>
          </div>

          <div className="mt-auto border-t border-slate-100/60 pt-4 w-full">
            <div className="mb-4">
              <span className="text-xl font-bold text-slate-900">{price}</span>
            </div>
            <button
              onClick={handleAdd}
              disabled={stock <= 0}
              className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[13px] font-semibold text-white transition-all duration-300 active:scale-95 ${
                stock <= 0
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : justAdded
                  ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                  : "bg-[#1B2235] hover:bg-[#2C3242] hover:shadow-md hover:shadow-slate-900/20"
              }`}
            >
              {stock <= 0 ? "Sin Stock" : justAdded ? <><CheckCircle2 size={16} />¡Añadido!</> : <><ShoppingCart size={16} />Agregar al Carrito</>}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // VARIANT = "default" (Original layout for Novedades)
  return (
    <div className="group relative bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:-translate-y-[5px] hover:border-orange-200/50 hover:shadow-2xl hover:shadow-orange-500/5 transition-all duration-300 ease-in-out flex flex-col h-full">
      {(product.esNuevo || product.es_nuevo) && (
        <span className="absolute top-3 left-3 z-10 rounded-[6px] bg-[#FF5722] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg shadow-orange-500/20">
          Nuevo
        </span>
      )}
      
      <div className="relative h-48 overflow-hidden bg-white flex items-center justify-center p-4">
        <img
          src={image}
          alt={name}
          className="h-full max-h-full w-auto max-w-[85%] object-contain group-hover:scale-105 transition-transform duration-500"
        />
        {stock <= 0 && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-red-500 text-white font-bold px-4 py-1.5 rounded-lg transform -rotate-12 text-xs shadow-lg">
              AGOTADO
            </span>
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1 text-left">
        {product.marca && (
          <p className="text-[10px] font-bold text-[#FF5722] mb-1.5 uppercase tracking-wider">
            {product.marca}
          </p>
        )}
        <h3 className="font-semibold text-slate-800 text-[15px] leading-snug mb-4 h-10 line-clamp-2 overflow-hidden group-hover:text-orange-600 transition-colors w-full" title={name}>
          {name}
        </h3>
        
        <div className="mt-auto w-full pt-1">
          <div className="mb-4">
            <span className="text-lg font-bold text-slate-900">{price}</span>
          </div>
          <button
            onClick={handleAdd}
            disabled={stock <= 0}
            className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-medium text-white transition-all duration-300 active:scale-95 ${
              stock <= 0
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : justAdded
                ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                : "bg-[#1B2235] hover:bg-[#2C3242]"
            }`}
          >
            {stock <= 0 ? "Sin Stock" : justAdded ? <><CheckCircle2 size={16} />¡Añadido!</> : <><ShoppingCart size={16} />Agregar al Carrito</>}
          </button>
        </div>
      </div>
    </div>
  );
}
