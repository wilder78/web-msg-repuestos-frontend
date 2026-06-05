import React, { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, Loader2 } from "lucide-react";

/**
 * StatusDropdown — Dropdown completamente personalizado (sin estilos nativos del navegador).
 *
 * Props:
 * @param {number}   currentValue    – ID del estado activo.
 * @param {Array}    options         – [{ value, label, Icon, className?, colorHex? }]
 * @param {function} onStatusChange  – async (nextValue: number) => void
 * @param {boolean}  disabled        – Inhabilita el selector.
 */
const StatusDropdown = ({
  currentValue,
  options = [],
  onStatusChange,
  disabled = false,
}) => {
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef          = useRef(null);

  const current = options.find((o) => Number(o.value) === Number(currentValue));

  /* ── Cerrar al hacer clic fuera ────────────────────────────── */
  useEffect(() => {
    if (!open) return;
    const onOutside = (e) => {
      if (!containerRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  /* ── Cerrar con Escape ─────────────────────────────────────── */
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  /* ── Seleccionar opción ────────────────────────────────────── */
  const handleSelect = useCallback(async (opt) => {
    setOpen(false);
    if (Number(opt.value) === Number(currentValue) || loading || disabled) return;
    setLoading(true);
    try {
      await onStatusChange?.(opt.value);
    } finally {
      setLoading(false);
    }
  }, [currentValue, loading, disabled, onStatusChange]);

  /* ── Color del punto indicador por opción ──────────────────── */
  const getDotColor = (opt) => {
    if (opt.colorHex) return opt.colorHex;
    const cls = opt.className ?? "";
    if (cls.includes("emerald")) return "#10B981";
    if (cls.includes("red"))     return "#EF4444";
    if (cls.includes("blue"))    return "#3B82F6";
    if (cls.includes("violet"))  return "#8B5CF6";
    if (cls.includes("amber"))   return "#F59E0B";
    return "#94A3B8";
  };

  /* ── Estilos inline del badge (modo colorHex de Compras) ───── */
  const buildBadgeStyles = (colorHex) => {
    if (!colorHex) return {};
    const hex = colorHex.replace("#", "");
    const r   = parseInt(hex.slice(0, 2), 16);
    const g   = parseInt(hex.slice(2, 4), 16);
    const b   = parseInt(hex.slice(4, 6), 16);
    return {
      backgroundColor: `rgba(${r},${g},${b},0.12)`,
      borderColor:     `rgba(${r},${g},${b},0.40)`,
      color:            colorHex,
    };
  };

  const badgeInlineStyles = current?.colorHex ? buildBadgeStyles(current.colorHex) : {};
  const badgeTailwind     = current?.className ?? "border-slate-200 bg-slate-100 text-slate-600";
  const Icon              = current?.Icon;

  return (
    <div ref={containerRef} className="relative inline-block">

      {/* ── Botón Badge ──────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => !disabled && !loading && setOpen((o) => !o)}
        disabled={disabled || loading}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={[
          "inline-flex h-9 min-w-[130px] items-center gap-1.5 rounded-lg border px-2",
          "text-sm font-semibold transition-all duration-150",
          current?.colorHex ? "" : badgeTailwind,
          !disabled && !loading ? "cursor-pointer hover:brightness-95 active:scale-[0.98]" : "cursor-not-allowed opacity-60",
        ].join(" ")}
        style={badgeInlineStyles}
      >
        {/* Icono o spinner */}
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
        ) : Icon ? (
          <Icon className="h-3.5 w-3.5 shrink-0" />
        ) : null}

        {/* Texto del estado */}
        <span className="flex-1 truncate text-left leading-none">
          {current?.label ?? `Estado ${currentValue}`}
        </span>

        {/* Chevron animado */}
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 opacity-55 transition-transform duration-200 ${
            open ? "rotate-180" : "rotate-0"
          }`}
        />
      </button>

      {/* ── Lista desplegable personalizada ───────────────────── */}
      {open && (
        <ul
          role="listbox"
          className="absolute left-0 top-full z-50 mt-1.5 min-w-[168px] overflow-hidden rounded-xl border border-slate-200 bg-white py-1"
          style={{
            boxShadow:
              "0 4px 6px -1px rgba(0,0,0,0.07), 0 10px 24px -4px rgba(0,0,0,0.10)",
          }}
        >
          {options.map((opt) => {
            const isSelected = Number(opt.value) === Number(currentValue);
            const dotColor   = getDotColor(opt);

            return (
              <li key={opt.value} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onClick={() => handleSelect(opt)}
                  className={[
                    "flex w-full items-center gap-2.5 px-3 py-2.5",
                    "text-sm font-medium text-[#2D3748] transition-colors duration-100",
                    "hover:bg-[#F4F6F8] focus:bg-[#F4F6F8] focus:outline-none",
                    isSelected ? "bg-[#F4F6F8]" : "bg-white",
                  ].join(" ")}
                >
                  {/* Punto indicador de color */}
                  <span
                    className="h-2 w-2 shrink-0 rounded-full ring-1 ring-white/60"
                    style={{ backgroundColor: dotColor }}
                  />

                  {/* Nombre del estado */}
                  <span className="flex-1 text-left">{opt.label}</span>

                  {/* Check del estado activo */}
                  {isSelected && (
                    <svg
                      className="h-3.5 w-3.5 shrink-0 text-slate-400"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                    >
                      <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
                    </svg>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default StatusDropdown;
