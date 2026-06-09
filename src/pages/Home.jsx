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

// Import local brands images
import logoAx4 from "../assets/marcas/ax4-110.png";
import logoBoxer from "../assets/marcas/boxer-ct-100.png";
import logoDiscovery from "../assets/marcas/discovery.png";
import logoEcoDeluxe from "../assets/marcas/eco-deluxe.png";
import logoNkd from "../assets/marcas/nkd-125.png";
import logoNmax from "../assets/marcas/nmax-155.png";
import logoTvs from "../assets/marcas/tvs-apache.png";
import logoXtz from "../assets/marcas/xtz-150.png";

const marcasCooperativas = [
  { id: 1, name: "Suzuki AX4", logo: logoAx4 },
  { id: 2, name: "Bajaj Boxer", logo: logoBoxer },
  { id: 3, name: "Bajaj Discovery", logo: logoDiscovery },
  { id: 4, name: "Hero Eco Deluxe", logo: logoEcoDeluxe },
  { id: 5, name: "AKT NKD", logo: logoNkd },
  { id: 6, name: "Yamaha NMAX", logo: logoNmax },
  { id: 7, name: "TVS Apache", logo: logoTvs },
  { id: 8, name: "Yamaha XTZ", logo: logoXtz },
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
  const [topRepuestos, setTopRepuestos] = useState([]);
  const [topAccesorios, setTopAccesorios] = useState([]);
  const [loadingDb, setLoadingDb] = useState(true);

  useEffect(() => {
    const fetchProducts = () => {
      fetch(`${API_BASE_URL}/products/latest`)
        .then((r) => r.json())
        .then((data) => {
          const list = Array.isArray(data) ? data : data.products || data.data || data.content || [];
          const sorted = [...list].sort(
            (a, b) => (b.id_producto || 0) - (a.id_producto || 0),
          );
          setDbProducts(sorted.slice(0, 8));
        })
        .catch(() => {})
        .finally(() => setLoadingDb(false));
    };

    const fetchTopRepuestos = () => {
      fetch(`${API_BASE_URL}/products/home/top-repuestos`)
        .then((r) => r.json())
        .then((data) => {
          const list = Array.isArray(data) ? data : data.products || data.data || data.content || [];
          setTopRepuestos(list);
        })
        .catch((err) => console.error("Error cargando repuestos del Home", err));
    };

    const fetchTopAccesorios = () => {
      fetch(`${API_BASE_URL}/products/home/top-accesorios`)
        .then((r) => r.json())
        .then((data) => {
          const list = Array.isArray(data) ? data : data.products || data.data || data.content || [];
          setTopAccesorios(list);
        })
        .catch((err) => console.error("Error cargando accesorios del Home", err));
    };

    fetchProducts();
    fetchTopRepuestos();
    fetchTopAccesorios();
    
    const interval = setInterval(() => {
      fetchProducts();
      fetchTopRepuestos();
      fetchTopAccesorios();
    }, 20000); // Poll every 20s
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
        <BestSellersCarousel products={topRepuestos} />

        {/* Accesorios de Lujo Más Vendidos */}
        <LuxuryAccessoriesCarousel products={topAccesorios} />

        {/* Carrusel de Marcas Cooperativas */}
        <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 overflow-hidden mb-20">
          <style>{`
            @keyframes marquee {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            .animate-marquee-brands {
              display: flex;
              width: max-content;
              animation: marquee 35s linear infinite;
            }
            .animate-marquee-brands:hover {
              animation-play-state: paused;
            }
          `}</style>
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
              Productos para cada moto y estilo
            </h2>
            <p className="text-slate-500 text-sm font-medium">
              Repuestos y accesorios para los modelos más vendidos en Colombia
            </p>
          </div>
          
          <div className="relative w-full overflow-hidden">
            {/* Gradient masks on sides for a beautiful fading edge effect */}
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
            
            <div className="animate-marquee-brands py-4 gap-6">
              {/* Double the list to make loop seamless */}
              {[...marcasCooperativas, ...marcasCooperativas, ...marcasCooperativas].map((marca, index) => (
                <div
                  key={`${marca.id}-${index}`}
                  className="w-80 h-48 flex-shrink-0 relative overflow-hidden rounded-2xl cursor-pointer group shadow-sm hover:shadow-xl transition-shadow duration-300"
                >
                  <img
                    src={marca.logo}
                    alt={marca.name}
                    className="w-full h-full object-cover filter grayscale opacity-75 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500 rounded-2xl"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <span className="text-white text-sm font-bold tracking-wide">
                      {marca.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
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
