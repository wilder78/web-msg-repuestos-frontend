import React, { useState } from "react";
import { ShoppingCart, CheckCircle2 } from "lucide-react";
import { useCart } from "../../contexts/CartContext";
import { useAuth } from "../../hooks/useAuth";
import { formatCurrency } from "../../utils/formatters";

export default function ProductCard({ product, showNew = false }) {
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

  return (
    <div className="group relative bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:-translate-y-[5px] hover:border-orange-200/50 hover:shadow-2xl hover:shadow-orange-500/5 transition-all duration-300 ease-in-out flex flex-col h-full">
      {/* Zona de Badges: Fila superior horizontal con padding-top generoso */}
      <div className="absolute top-0 w-full flex justify-between items-start px-4 pt-5 z-20 pointer-events-none">
        {/* Izquierda: Badge de Stock o Nuevo */}
        {stock > 0 ? (
          <span className="rounded-md bg-emerald-500/90 backdrop-blur-sm px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-sm">
            En Stock
          </span>
        ) : (
          <span className="rounded-md bg-red-500/90 backdrop-blur-sm px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-sm">
            Agotado
          </span>
        )}

        {/* Derecha: Badge de Calificación (Mock) */}
        <div className="flex items-center gap-1 bg-white/90 backdrop-blur-md px-2 py-1 rounded-md shadow-sm border border-slate-100">
          <svg className="w-3 h-3 text-amber-400 fill-amber-400" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span className="text-[10px] font-bold text-slate-700">4.8</span>
          <span className="text-[9px] text-slate-400 ml-0.5">(+1k)</span>
        </div>
      </div>
      
      {/* Contenedor de la Imagen: Desplazado hacia abajo, centrado y re-escalado */}
      <div className="relative h-56 bg-slate-50 flex items-center justify-center px-4 pt-16 pb-3">
        <img
          src={image}
          alt={name}
          className="h-full w-[85%] object-contain object-center mx-auto group-hover:scale-105 transition-transform duration-500"
        />
        {stock <= 0 && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-red-500 text-white font-bold px-4 py-1.5 rounded-lg transform -rotate-12 text-xs shadow-lg">
              AGOTADO
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Bloque de Información Inferior: Centrado y espaciado ajustado */}
      <div className="p-5 flex flex-col flex-1 items-center text-center">
        {product.marca && (
          <p className="text-xs font-semibold text-orange-600 mb-1.5 uppercase tracking-wider">
            {product.marca}
          </p>
        )}
        <h3 className="font-semibold text-slate-800 text-base mb-4 h-12 line-clamp-2 overflow-hidden group-hover:text-orange-600 transition-colors w-full" title={name}>
          {name}
        </h3>
        <div className="mt-auto pt-3 w-full flex flex-col items-center">
          <div className="flex items-center justify-center gap-2 mb-5 w-full">
            <span className="text-xl font-black text-slate-900">{price}</span>
          </div>
          <button
            onClick={handleAdd}
            disabled={stock <= 0}
            className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3 font-medium text-white transition-all duration-300 active:scale-95 ${
              stock <= 0
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : justAdded
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                : "bg-slate-800 hover:bg-gradient-to-r hover:from-orange-600 hover:to-red-500 hover:shadow-lg hover:shadow-orange-500/25"
            }`}
          >
            {stock <= 0 ? (
              "Sin Stock"
            ) : justAdded ? (
              <>
                <CheckCircle2 size={18} />
                ¡Añadido!
              </>
            ) : (
              <>
                <ShoppingCart size={18} />
                Agregar al Carrito
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
