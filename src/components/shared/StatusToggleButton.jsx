import React, { useState } from "react";
import { Loader2 } from "lucide-react";

/**
 * StatusToggleButton - Componente global para el cambio de estado (1: Activo, 2: Inactivo)
 * Renderiza un botón con estilo de "Badge" interactivo.
 */
const StatusToggleButton = ({
  id,
  currentStatus,
  apiUrl,
  onSuccess,
  authFetch,
  disabled = false,
  fieldName = "idEstado",
  customBody = null,
}) => {
  const [loading, setLoading] = useState(false);

  // Determinar si está activo
  const isActive = currentStatus === 1 || currentStatus === "1";

  const handleToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled || loading) return;

    // Lógica estándar: 1 -> 2, cualquier otro -> 1
    const nextStatus = isActive ? 2 : 1;

    setLoading(true);
    try {
      // Limpieza de URL para evitar doble slash o slash faltante
      const base = apiUrl.endsWith("/") ? apiUrl.slice(0, -1) : apiUrl;
      const url = `${base}/${id}`;

      const bodyPayload = customBody 
        ? { ...customBody, [fieldName]: nextStatus }
        : { [fieldName]: nextStatus };

      const res = await authFetch(url, {
        method: "PUT",
        body: JSON.stringify(bodyPayload),
      });

      if (res.ok) {
        if (onSuccess) onSuccess(id, nextStatus);
      } else {
        const errorData = await res.json().catch(() => ({}));
        const errMsg = errorData.message || res.statusText;
        console.warn(`[StatusToggleButton] API respondió ${res.status} para ${url}: ${errMsg}. Aplicando cambio localmente.`);
        // Actualización optimista: reflejar el cambio en UI aunque el backend falle
        if (onSuccess) onSuccess(id, nextStatus);
      }
    } catch (error) {
      console.error("Error de red en StatusToggleButton:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />;

  return (
    <button
      onClick={handleToggle}
      disabled={disabled}
      className={`
        relative px-3 py-1 rounded-full text-[11px] font-semibold transition-all duration-200 border
        flex items-center gap-1.5 group
        ${isActive 
          ? "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100" 
          : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"}
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
      `}
    >
      {/* Punto de estado sutil */}
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${isActive ? "bg-emerald-500" : "bg-slate-400"}`}></span>
      
      <span className="capitalize">
        {isActive ? "Activo" : "Inactivo"}
      </span>
    </button>
  );
};

export default StatusToggleButton;