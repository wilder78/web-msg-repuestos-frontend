import React from "react";

const StatusBadge = ({ statusId, onClick, disabled = false }) => {
  // Configuración de estilos según el ID de estado
  // Adaptable: 1 es Activo, cualquier otro es Inactivo
  const isActive = statusId === 1 || statusId === "1";

  const activeStyles =
    "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200";
  const inactiveStyles =
    "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200";

  return (
    <button
      onClick={(e) => {
        e.stopPropagation(); // Evita disparar eventos de la fila de la tabla
        if (!disabled && onClick) onClick();
      }}
      disabled={disabled}
      className={`
        px-3 py-1 rounded-full text-xs font-semibold border transition-all duration-200
        ${isActive ? activeStyles : inactiveStyles}
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
      `}
    >
      <span className="flex items-center gap-1.5">
        <span
          className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-slate-400"}`}
        />
        {isActive ? "Activo" : "Inactivo"}
      </span>
    </button>
  );
};

export default StatusBadge;
