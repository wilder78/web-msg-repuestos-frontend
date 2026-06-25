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
      {(product.esNuevo || product.es_nuevo) && (
        <span className="absolute top-3 left-3 z-10 rounded-lg bg-gradient-to-r from-orange-600 via-red-500 to-amber-500 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-lg shadow-orange-500/20 animate-pulse">
          Nuevo
        </span>
      )}
      
      <div className="relative h-48 overflow-hidden bg-white flex items-center justify-center p-4">
        <img
          src={image}
          alt={name}
          className="h-full max-h-full w-auto max-w-full object-contain group-hover:scale-105 transition-transform duration-500"
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

      <div className="p-5 flex flex-col flex-1">
        {product.marca && (
          <p className="text-xs font-semibold text-orange-600 mb-1 uppercase tracking-wider">
            {product.marca}
          </p>
        )}
        <h3 className="font-semibold text-slate-800 text-base mb-2 h-12 line-clamp-2 overflow-hidden group-hover:text-orange-600 transition-colors" title={name}>
          {name}
        </h3>
        <div className="mt-auto pt-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg font-bold text-slate-900">{price}</span>
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
