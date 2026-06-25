import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import lubricantesImg from "../../assets/carousel/lubricantes2.png";
import frenosImg from "../../assets/carousel/frenos.png";

const slides = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=1600&auto=format&fit=crop&q=80",
    title: "Todo para tu moto en un solo lugar",
    subtitle: "Descubre nuestra amplia gama de repuestos y accesorios. Calidad y garantía al mejor precio.",
    cta: "Ver Catálogo",
    href: "/repuestos",
    align: "center",
  },
  {
    id: 2,
    image: lubricantesImg,
    title: "Aceites y Lubricantes",
    subtitle: "Mantén tu motor en óptimas condiciones con las mejores marcas del mercado.",
    cta: "Ver Aceites",
    href: "/repuestos?categoria=aceites",
    align: "left",
  },
  {
    id: 3,
    image: frenosImg,
    title: "Frenos de Alto Rendimiento",
    subtitle: "Seguridad ante todo. Pastillas, discos y sistemas de frenado profesional.",
    cta: "Comprar Ahora",
    href: "/repuestos?categoria=frenos",
    align: "right",
  },
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=1600&auto=format&fit=crop&q=80",
    title: "Hasta 20% de Descuento en accesorios",
    subtitle: "Aprovecha nuestras ofertas exclusivas en cascos y equipamiento de seguridad.",
    cta: "Ver Ofertas",
    href: "/repuestos",
    align: "left",
  },
];

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timerRef = useRef(null);

  const goTo = useCallback(
    (index) => {
      if (isTransitioning) return;
      setIsTransitioning(true);
      setCurrent(index);
      setTimeout(() => setIsTransitioning(false), 600);
    },
    [isTransitioning],
  );

  const next = useCallback(() => {
    goTo((current + 1) % slides.length);
  }, [current, goTo]);

  const prev = useCallback(() => {
    goTo((current - 1 + slides.length) % slides.length);
  }, [current, goTo]);

  useEffect(() => {
    timerRef.current = setInterval(next, 5000);
    return () => clearInterval(timerRef.current);
  }, [next]);

  const pause = () => clearInterval(timerRef.current);
  const resume = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(next, 5000);
  };

  const s = slides[current];

  const alignClasses = {
    center: "items-center justify-center text-center",
    left: "items-center justify-start text-left",
    right: "items-center justify-end text-right",
  };

  return (
    <div
      className="relative w-full overflow-hidden bg-slate-900 group"
      onMouseEnter={pause}
      onMouseLeave={resume}
    >
      <div className="relative mx-auto h-[400px] sm:h-[500px] md:h-[560px] lg:h-[620px]">
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            className="absolute inset-0 transition-all duration-700 ease-in-out"
            style={{
              opacity: i === current ? 1 : 0,
              transform: `scale(${i === current ? 1 : 1.05})`,
              zIndex: i === current ? 1 : 0,
            }}
          >
            <div className="relative w-full h-full">
              <img
                src={slide.image}
                alt={slide.title}
                className="h-full w-full object-cover"
                loading={i === 0 ? "eager" : "lazy"}
              />
              {/* Capa negra con opacidad hacia el lado izquierdo para resaltar texto */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/30 to-transparent z-10" />
              {/* Gradiente sutil de abajo hacia arriba */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/10 to-transparent z-10" />
            </div>

            <div
              className={`absolute inset-0 flex px-6 sm:px-12 lg:px-20 z-20 ${alignClasses[slide.align]}`}
            >
              <div
                className={`max-w-md md:max-w-lg lg:max-w-xl ${
                  slide.align === "center" ? "mx-auto" : ""
                }`}
              >
                <h2
                  className="text-3xl font-black tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl"
                  style={{
                    opacity: i === current ? 1 : 0,
                    transform: `translateY(${i === current ? "0" : "20px"})`,
                    transition: "opacity 0.6s ease 0.2s, transform 0.6s ease 0.2s",
                  }}
                >
                  {slide.title.split(/(solo lugar|Aceites|Rendimiento|\d+%\s*de\s*Descuento|\d+%)/i).map((part, idx) => {
                    if (["solo lugar", "Aceites", "Rendimiento"].includes(part)) {
                      return (
                        <span key={idx} className="text-blue-400">
                          {part}
                        </span>
                      );
                    }
                    if (/^\d+%/i.test(part)) {
                      return (
                        <span key={idx} className="text-red-500 font-extrabold">
                          {part}
                        </span>
                      );
                    }
                    return part;
                  })}
                </h2>
                <p
                  className="mt-4 max-w-2xl text-base text-blue-100 sm:text-lg md:text-xl"
                  style={{
                    opacity: i === current ? 1 : 0,
                    transform: `translateY(${i === current ? "0" : "20px"})`,
                    transition: "opacity 0.6s ease 0.35s, transform 0.6s ease 0.35s",
                  }}
                >
                  {slide.subtitle}
                </p>
                <Link
                  to={slide.href}
                  className="mt-6 inline-flex items-center gap-2 rounded-md bg-red-600 px-6 py-3 font-bold text-white shadow-lg transition-all duration-300 hover:bg-red-500 hover:scale-105 active:scale-95 shadow-red-600/30 hover:shadow-red-500/40 sm:px-8"
                  style={{
                    opacity: i === current ? 1 : 0,
                    transform: `translateY(${i === current ? "0" : "20px"})`,
                    transition: "opacity 0.6s ease 0.5s, transform 0.6s ease 0.5s",
                  }}
                >
                  {slide.cta} <ChevronRight size={20} />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Flechas */}
      <button
        onClick={prev}
        className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/25 p-2 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black/50 hover:scale-110 active:scale-95"
        aria-label="Anterior"
      >
        <ChevronLeft size={24} />
      </button>
      <button
        onClick={next}
        className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/25 p-2 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black/50 hover:scale-110 active:scale-95"
        aria-label="Siguiente"
      >
        <ChevronRight size={24} />
      </button>

      {/* Indicadores */}
      <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`h-1 rounded-full transition-all duration-300 ${
              i === current
                ? "w-8 bg-red-600"
                : "w-5 bg-white/40 hover:bg-white/70"
            }`}
            aria-label={`Ir a slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}