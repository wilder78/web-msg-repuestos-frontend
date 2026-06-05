import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar/PublicNavbar";
import Footer from "../components/Footer/Footer";
import WhatsAppButton from "../components/shared/WhatsAppButton";
import HeroCarousel from "../components/shared/HeroCarousel";
import SectionTitle from "../components/shared/SectionTitle";
import CardCarousel from "../components/shared/CardCarousel";
import BestSellersCarousel from "../components/shared/BestSellersCarousel";
import LuxuryAccessoriesCarousel from "../components/shared/LuxuryAccessoriesCarousel";
import { Link } from "react-router-dom";
import { ShoppingCart, Loader2 } from "lucide-react";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../hooks/useAuth";

const marcas = [
  { id: 1, name: "Honda", logo: "https://upload.wikimedia.org/wikipedia/commons/3/38/Honda.svg" },
  { id: 2, name: "Yamaha", logo: "https://upload.wikimedia.org/wikipedia/commons/e/e9/Yamaha_logo.svg" },
  { id: 3, name: "Suzuki", logo: "https://upload.wikimedia.org/wikipedia/commons/1/12/Suzuki_logo_2.svg" },
  { id: 4, name: "Kawasaki", logo: "https://upload.wikimedia.org/wikipedia/commons/3/3f/Kawasaki_logo.svg" },
  { id: 5, name: "Bajaj", logo: "https://upload.wikimedia.org/wikipedia/commons/b/b8/Bajaj_Auto_Logo.svg" },
  { id: 6, name: "Motul", logo: "https://upload.wikimedia.org/wikipedia/commons/8/87/Motul_logo.svg" },
];

const ProductCard = ({ product, showNew = false }) => {
  const { addToCart } = useCart();
  const { user } = useAuth();

  const image = product.image || product.imagen_url || "https://images.unsplash.com/photo-1486006920555-c77dcf18193c?w=500&auto=format&fit=crop&q=60";
  const rawName = product.name || product.nombre || "Producto";
  const name = rawName.replace(/\s*\(.*?\)/g, '').replace(/\s*\[.*?\]/g, '').trim();

  // Precio base: siempre precio_publico para invitados o roles != 4
  let priceValue = Number(product.precio_publico || product.precioPublico || product.price || 0);

  if (Number(user?.idRol) === 4 && user?.tipoCliente) {
    const tipo = user.tipoCliente.toLowerCase();
    const minoristaPrice = Number(product.precio_minorista || product.precioMinorista || 0);
    const mayoristaPrice = Number(product.precio_mayorista || product.precioMayorista || 0);

    if (tipo === "minorista" && minoristaPrice > 0) priceValue = minoristaPrice;
    else if (tipo === "mayorista" && mayoristaPrice > 0) priceValue = mayoristaPrice;
    // "consumidor final" → precio_publico (ya asignado por defecto)
  }

  const formatter = new Intl.NumberFormat("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const price = `S/ ${formatter.format(priceValue)}`;

  const cartItem = {
    id: product.id || product.idProducto || product.id_producto,
    name,
    price,
    image,
  };

  return (
    <div className="group relative bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:-translate-y-[5px] hover:border-orange-200/50 hover:shadow-2xl hover:shadow-orange-500/5 transition-all duration-300 ease-in-out flex flex-col h-full">
      {showNew && (
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
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-semibold text-slate-800 text-base mb-2 h-12 line-clamp-2 overflow-hidden group-hover:text-orange-600 transition-colors" title={name}>
          {name}
        </h3>
        <div className="mt-auto pt-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg font-bold text-slate-900">{price}</span>
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
};

const API_BASE_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

const Home = () => {
  const [dbProducts, setDbProducts] = useState([]);
  const [loadingDb, setLoadingDb] = useState(true);

  useEffect(() => {
    const fetchProducts = () => {
      fetch(`${API_BASE_URL}/products`)
        .then((r) => r.json())
        .then((data) => {
          const list = Array.isArray(data) ? data : data.data || data.content || [];
          const sorted = [...list].sort(
            (a, b) => (b.id_producto || 0) - (a.id_producto || 0),
          );
          setDbProducts(sorted.slice(0, 8));
        })
        .catch(() => {})
        .finally(() => setLoadingDb(false));
    };

    fetchProducts();
    const interval = setInterval(fetchProducts, 20000); // Poll every 20s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <Navbar />

      <div className="flex-1">
        <HeroCarousel />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 space-y-20">
        
        {/* Productos Nuevos — Grid dinámico */}
        <section>
          <SectionTitle
            subtitle="Novedades de la Semana"
            title={
              <div className="flex items-center gap-3">
                <span className="bg-gradient-to-r from-orange-600 via-red-500 to-amber-500 bg-clip-text text-transparent">
                  ¡Recién Llegados! Lo último para tu pasión
                </span>
                <span className="animate-pulse rounded-lg bg-gradient-to-r from-orange-600 to-red-500 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-sm shadow-red-500/50">
                  NEW
                </span>
              </div>
            }
            href="/repuestos"
            linkLabel="Ver todo"
          />
          <div className="mt-8">
            {loadingDb ? (
              <div className="flex items-center justify-center py-16 text-slate-400">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2 text-sm">Cargando productos...</span>
              </div>
            ) : (
              <CardCarousel
                items={dbProducts}
                autoplay={4000}
                desktopViews={4}
                tabletViews={2.5}
                mobileViews={1.25}
                renderItem={(p) => (
                  <ProductCard product={p} showNew />
                )}
              />
            )}
          </div>
        </section>

        {/* Repuestos Más Vendidos */}
        <BestSellersCarousel />

        {/* Accesorios de Lujo Más Vendidos */}
        <LuxuryAccessoriesCarousel />

        {/* Carrusel de Marcas */}
        <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
              Marcas que Comercializamos
            </h2>
            <p className="text-slate-500">Repuestos y accesorios para motos de las mejores marcas del mercado.</p>
          </div>
          <div className="flex overflow-x-auto gap-12 pb-4 snap-x items-center justify-start md:justify-center" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {marcas.map(marca => (
              <div key={marca.id} className="min-w-[120px] snap-center flex flex-col items-center gap-3 opacity-70 hover:opacity-100 transition-opacity grayscale hover:grayscale-0">
                <img src={marca.logo} alt={marca.name} className="h-16 object-contain" />
                <span className="text-sm font-semibold text-slate-600">{marca.name}</span>
              </div>
            ))}
          </div>
        </section>

      </main>
      </div>

      <Footer />

      <WhatsAppButton />
    </div>
  );
};

export default Home;
