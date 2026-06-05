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
    center: "items-center text-center",
    left: "items-start text-left",
    right: "items-end text-right",
  };

  return (
    <div
      className="relative w-full overflow-hidden bg-slate-900"
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
            <img
              src={slide.image}
              alt={slide.title}
              className="h-full w-full object-cover"
              loading={i === 0 ? "eager" : "lazy"}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-transparent" />

            <div
              className={`absolute inset-0 flex px-6 sm:px-12 lg:px-20 ${alignClasses[slide.align]}`}
            >
              <div
                className={`max-w-xl ${
                  slide.align === "center"
                    ? "mx-auto"
                    : slide.align === "right"
                      ? "ml-auto"
                      : ""
                } mt-auto mb-16 sm:mb-20 md:mb-24`}
              >
                <h2
                  className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl"
                  style={{
                    opacity: i === current ? 1 : 0,
                    transform: `translateY(${i === current ? "0" : "20px"})`,
                    transition: "opacity 0.6s ease 0.2s, transform 0.6s ease 0.2s",
                  }}
                >
                  {slide.title.split(/(solo lugar|Aceites|Rendimiento)/).map((part, idx) =>
                    ["solo lugar", "Aceites", "Rendimiento"].includes(part) ? (
                      <span key={idx} className="text-blue-400">
                        {part}
                      </span>
                    ) : (
                      part
                    ),
                  )}
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
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-blue-500 px-6 py-3 font-bold text-white shadow-lg transition-colors hover:bg-blue-400 hover:shadow-blue-500/30 sm:px-8"
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
        className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/25 p-2 text-white backdrop-blur-sm transition-all hover:bg-black/50 hover:scale-110 active:scale-95"
        aria-label="Anterior"
      >
        <ChevronLeft size={24} />
      </button>
      <button
        onClick={next}
        className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/25 p-2 text-white backdrop-blur-sm transition-all hover:bg-black/50 hover:scale-110 active:scale-95"
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
            className={`h-2.5 rounded-full transition-all ${
              i === current
                ? "w-8 bg-white"
                : "w-2.5 bg-white/40 hover:bg-white/70"
            }`}
            aria-label={`Ir a slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}