import React, { useEffect, useRef } from "react";

const priceConfig = [
  { key: "precioPublico",  fallback: "precio_publico",  label: "Al Detal" },
  { key: "precioMinorista", fallback: "precio_minorista", label: "Minorista" },
  { key: "precioMayorista", fallback: "precio_mayorista", label: "Mayorista" },
];

const getPrice = (obj, key, fallback) =>
  Number(obj?.[key] ?? obj?.[fallback] ?? 0);

export default function PreciosVigentesPopover({ precios, onSelectPrice, onClose }) {
  const popoverRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && onClose) onClose();
    };
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target) && onClose) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  const availablePrices = priceConfig.filter(
    (cfg) => getPrice(precios, cfg.key, cfg.fallback) > 0,
  );

  if (availablePrices.length === 0) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        ref={popoverRef}
        className="absolute right-0 top-6 z-50 w-52 rounded-xl border border-slate-100 bg-white p-3 text-xs text-slate-700 shadow-xl animate-in fade-in slide-in-from-top-1 duration-150"
      >
        <div className="mb-2 flex items-center justify-between border-b border-slate-100 pb-1">
          <span className="font-bold text-slate-800">Precios Vigentes</span>
          <span className="text-[9px] font-normal uppercase text-emerald-600">Aplicar</span>
        </div>
        <div className="space-y-1">
          {availablePrices.map((cfg) => {
            const val = getPrice(precios, cfg.key, cfg.fallback);
            return (
              <button
                key={cfg.key}
                type="button"
                onClick={() => {
                  if (onSelectPrice) onSelectPrice(val);
                  if (onClose) onClose();
                }}
                className="flex w-full items-center justify-between rounded px-1.5 py-1.5 text-left transition-colors hover:bg-slate-50 group"
              >
                <span className="font-medium text-slate-400 group-hover:text-emerald-600">
                  {cfg.label}:
                </span>
                <span className="font-semibold text-slate-700 group-hover:text-emerald-600">
                  ${val.toFixed(2)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}