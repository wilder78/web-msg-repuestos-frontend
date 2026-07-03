import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Star, ShoppingCart, ShieldCheck, Loader2 } from "lucide-react";
import { useCart } from "../../contexts/CartContext";
import { useAuth } from "../../hooks/useAuth";
import CardCarousel from "./CardCarousel";
import ProductCard from "./ProductCard";

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

  const formatter = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
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
        renderItem={(p) => <ProductCard product={p} variant="detailed" />}
      />
    </section>
  );
}
