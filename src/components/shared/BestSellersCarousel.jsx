import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Star, ShoppingCart, ShieldCheck, Loader2 } from "lucide-react";
import { useCart } from "../../contexts/CartContext";
import { useAuth } from "../../hooks/useAuth";
import CardCarousel from "./CardCarousel";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

export default function BestSellersCarousel({ products = [] }) {
  const { addToCart } = useCart();
  const { user } = useAuth();

  // Decorate products
  const decorated = React.useMemo(() => {
    const sorted = [...products].sort(
      (a, b) => (b.id_producto || 0) - (a.id_producto || 0)
    );
    const top6 = sorted.slice(0, 6);

    return top6.map((product, idx) => {
      const compatibilities = [
        "Honda Wave, Yamaha Crypton, Suzuki AX100",
        "Bajaj Pulsar 200, TVS Apache, Honda CB190R",
        "Universal para motos lineales 125cc - 250cc",
        "Yamaha FZ25, Honda Twister, Suzuki Gixxer 250",
        "Honda XR150, Yamaha XTZ150, Bajaj Boxer",
        "Kawasaki Ninja 300, Yamaha R3, KTM Duke 390",
      ];
      const ratings = [4.9, 4.8, 4.9, 4.7, 4.8, 4.9];
      const sales = [140, 95, 210, 80, 115, 65];
      const stockVal = product.stock_buen_estado ?? product.stockBuenEstado ?? 10;

      return {
        ...product,
        rating: ratings[idx % ratings.length],
        ventas: sales[idx % sales.length],
        compatibilidad: compatibilities[idx % compatibilities.length],
        garantia: "Garantía de fábrica 6 meses",
        stock: stockVal,
      };
    });
  }, [products]);

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2 text-sm">Cargando repuestos más vendidos...</span>
      </div>
    );
  }

  const formatter = new Intl.NumberFormat("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <section className="space-y-8">
      {/* Título de la Sección */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 sm:text-sm">
            Favoritos de la Comunidad
          </p>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl md:text-4xl flex items-center gap-3 flex-wrap">
            <span className="text-slate-900">
              Los Repuestos Más Vendidos: Calidad Garantizada
            </span>
          </h2>
        </div>
        <Link
          to="/repuestos"
          className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition-colors hover:text-orange-600 sm:mt-0"
        >
          Ver catálogo completo
          <ChevronRight size={16} />
        </Link>
      </div>

      {/* Carrusel reutilizando CardCarousel */}
      <CardCarousel
        items={decorated}
        desktopViews={4}
        tabletViews={2.5}
        mobileViews={1.25}
        autoplay={4000}
        renderItem={(p) => {
          // Calcular precio
          let priceValue = Number(p.precio_publico || p.precioPublico || 0);
          if (Number(user?.idRol) === 4 && user?.tipoCliente) {
            const tipo = p.tipoCliente?.toLowerCase() || user.tipoCliente.toLowerCase();
            const minoristaPrice = Number(p.precio_minorista || p.precioMinorista || 0);
            const mayoristaPrice = Number(p.precio_mayorista || p.precioMayorista || 0);
            if (tipo === "minorista" && minoristaPrice > 0) priceValue = minoristaPrice;
            else if (tipo === "mayorista" && mayoristaPrice > 0) priceValue = mayoristaPrice;
          }
          const formattedPrice = `S/ ${formatter.format(priceValue)}`;

          const rawName = p.nombre || p.name || "Repuesto";
          const cleanName = rawName.replace(/\s*\(.*?\)/g, "").replace(/\s*\[.*?\]/g, "").trim();

          const cartItem = {
            id: p.idProducto || p.id_producto,
            name: cleanName,
            price: formattedPrice,
            image: p.imagen_url || "https://images.unsplash.com/photo-1486006920555-c77dcf18193c?w=500&auto=format&fit=crop&q=60",
          };

          const isLowStock = p.stock > 0 && p.stock <= 5;

          return (
            <div className="group relative bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:-translate-y-[5px] hover:border-orange-200/50 hover:shadow-2xl hover:shadow-orange-500/5 transition-all duration-300 ease-in-out flex flex-col h-[400px]">
              
              {/* Badge de Stock Urgencia */}
              <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
                {isLowStock ? (
                  <span className="rounded-lg bg-red-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-md animate-pulse">
                    ¡Pocas Unidades!
                  </span>
                ) : (
                  <span className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-md">
                    En Stock
                  </span>
                )}
              </div>

              {/* Badge de Rating Social Proof */}
              <div className="absolute top-3 right-3 z-10 flex items-center gap-1 rounded-lg bg-slate-900/80 backdrop-blur-sm px-2 py-1 text-[10px] font-bold text-white shadow-md">
                <Star size={10} className="fill-amber-400 stroke-amber-400" />
                <span>{p.rating}</span>
                <span className="text-slate-400">|</span>
                <span className="text-slate-300">+{p.ventas} vendidos</span>
              </div>

              {/* Imagen de Repuesto */}
              <div className="relative h-44 overflow-hidden bg-white flex items-center justify-center p-4">
                <img
                  src={p.imagen_url || "https://images.unsplash.com/photo-1486006920555-c77dcf18193c?w=500&auto=format&fit=crop&q=60"}
                  alt={cleanName}
                  className="h-full max-h-full w-auto max-w-full object-contain group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              {/* Contenido Card Body */}
              <div className="p-5 flex flex-col flex-1">
                {/* Título de repuesto */}
                <h3 className="font-semibold text-slate-800 text-base mb-1 h-12 line-clamp-2 overflow-hidden group-hover:text-orange-600 transition-colors" title={cleanName}>
                  {cleanName}
                </h3>

                {/* Compatibilidad (UX) */}
                <p className="text-xs text-slate-500 mb-2 truncate" title={p.compatibilidad}>
                  <span className="font-medium text-slate-600">Compatibilidad:</span> {p.compatibilidad}
                </p>

                {/* Garantía */}
                <div className="flex items-center gap-1 text-[11px] text-emerald-600 mb-4">
                  <ShieldCheck size={12} />
                  <span>Garantizado</span>
                </div>

                {/* Compra / Acción (mt-auto) */}
                <div className="mt-auto pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2 mb-3 mt-2">
                    <span className="text-lg font-bold text-slate-900">{formattedPrice}</span>
                  </div>
                  <button
                    onClick={() => addToCart(cartItem)}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-800 py-3 font-medium text-white transition-all duration-300 hover:bg-gradient-to-r hover:from-orange-600 hover:to-red-500 hover:shadow-lg hover:shadow-orange-500/25 active:scale-95"
                  >
                    <ShoppingCart size={18} />
                    Agregar al Carrito
                  </button>
                </div>
              </div>
            </div>
          );
        }}
      />
    </section>
  );
}
