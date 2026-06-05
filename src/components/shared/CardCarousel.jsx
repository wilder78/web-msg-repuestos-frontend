import React, { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function CardCarousel({ 
  items, 
  renderItem, 
  autoplay = 4000,
  desktopViews = 3.5,
  tabletViews = 2.5,
  mobileViews = 1.25
}) {
  const [slidesPerView, setSlidesPerView] = useState(4);
  const [idx, setIdx] = useState(0);
  const smoothRef = useRef(true);
  const timerRef = useRef(null);
  
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    const update = () => {
      if (window.innerWidth < 640) setSlidesPerView(mobileViews);
      else if (window.innerWidth < 1024) setSlidesPerView(tabletViews);
      else setSlidesPerView(desktopViews);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [mobileViews, tabletViews, desktopViews]);

  const total = items.length;
  const maxIdx = Math.max(0, Math.ceil(total - slidesPerView));
  const clones = items.slice(0, Math.ceil(slidesPerView));
  const track = [...items, ...clones];

  /* ── snap without transition ── */
  const snapTo = useCallback((target) => {
    smoothRef.current = false;
    setIdx(target);
    requestAnimationFrame(() => requestAnimationFrame(() => { smoothRef.current = true; }));
  }, []);

  /* ── forward — loops after the real range ── */
  const next = useCallback(() => {
    setIdx((prev) => {
      if (prev >= total) {
        setTimeout(() => snapTo(0), 500);
        return prev;
      }
      return prev + 1;
    });
  }, [total, snapTo]);

  /* ── backward ── */
  const prev = useCallback(() => {
    setIdx((prev) => {
      if (prev <= 0) return prev;
      return prev - 1;
    });
  }, []);

  /* ── touch handlers ── */
  const handleTouchStart = (e) => {
    if (window.innerWidth < 768) return; // Let native scroll handle it on mobile
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = e.targetTouches[0].clientX; // Reset end X
  };

  const handleTouchMove = (e) => {
    if (window.innerWidth < 768) return;
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (window.innerWidth < 768) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 50) {
      next();
    } else if (diff < -50) {
      prev();
    }
  };

  /* ── autoplay ── */
  useEffect(() => {
    if (!autoplay || total <= slidesPerView || window.innerWidth < 768) return;
    timerRef.current = setInterval(next, autoplay);
    return () => clearInterval(timerRef.current);
  }, [next, autoplay, total, slidesPerView]);

  const pause = () => {
    if (window.innerWidth >= 768) clearInterval(timerRef.current);
  };
  const resume = () => {
    if (window.innerWidth < 768) return;
    clearInterval(timerRef.current);
    if (autoplay && total > slidesPerView) {
      timerRef.current = setInterval(next, autoplay);
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <div 
      className="relative" 
      onMouseEnter={pause} 
      onMouseLeave={resume}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="overflow-x-auto md:overflow-hidden snap-x snap-mandatory md:snap-none scrollbar-hide px-1 py-4">
        <div
          className={`flex min-w-0 w-full ${smoothRef.current ? "transition-transform duration-500 ease-in-out" : ""}`}
          style={{ transform: window.innerWidth >= 768 ? `translateX(-${idx * (100 / slidesPerView)}%)` : 'none' }}
        >
          {track.map((item, i) => (
            <div
              key={i}
              className="shrink-0 snap-start snap-always min-w-0"
              style={{ flexBasis: `${100 / slidesPerView}%` }}
            >
              <div className="mx-2 h-full">{renderItem(item)}</div>
            </div>
          ))}
        </div>
      </div>

      {total > slidesPerView && (
        <>
          <button
            onClick={prev}
            className="absolute -left-5 lg:-left-6 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/95 backdrop-blur-sm p-3 text-slate-700 shadow-md border border-slate-100/80 transition-all duration-300 hover:scale-110 hover:bg-gradient-to-r hover:from-orange-600 hover:to-red-500 hover:text-white hover:border-transparent hover:shadow-lg hover:shadow-orange-500/20 active:scale-95 hidden md:flex"
            aria-label="Anterior"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={next}
            className="absolute -right-5 lg:-right-6 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/95 backdrop-blur-sm p-3 text-slate-700 shadow-md border border-slate-100/80 transition-all duration-300 hover:scale-110 hover:bg-gradient-to-r hover:from-orange-600 hover:to-red-500 hover:text-white hover:border-transparent hover:shadow-lg hover:shadow-orange-500/20 active:scale-95 hidden md:flex"
            aria-label="Siguiente"
          >
            <ChevronRight size={20} />
          </button>

          <div className="mt-8 flex justify-center gap-2 md:flex hidden">
            {Array.from({ length: maxIdx + 1 }).map((_, i) => {
              const activeIdx = idx <= maxIdx ? idx : idx >= total ? 0 : maxIdx;
              return (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    activeIdx === i
                      ? "w-8 bg-gradient-to-r from-orange-600 to-red-500 shadow-sm"
                      : "w-2.5 bg-slate-300 hover:bg-slate-400"
                  }`}
                  aria-label={`Ir a slide ${i + 1}`}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}