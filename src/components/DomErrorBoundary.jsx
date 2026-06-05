import React from "react";

/**
 * DomErrorBoundary
 *
 * Atrapa silenciosamente los errores de sincronización del DOM virtual de React
 * (NotFoundError: removeChild / insertBefore) que ocurren durante transiciones
 * rápidas de estado (ej: login → redirect al dashboard).
 *
 * En lugar de mostrar una pantalla de error al usuario, limpia el estado
 * defectuoso y fuerza una recarga limpia hacia la ruta del dashboard.
 */
class DomErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Sólo interceptamos errores de reconciliación del DOM
    const isDomError =
      error instanceof TypeError ||
      error instanceof DOMException ||
      error?.name === "NotFoundError" ||
      error?.message?.includes("removeChild") ||
      error?.message?.includes("insertBefore") ||
      error?.message?.includes("Failed to execute");

    if (isDomError) {
      return { hasError: true };
    }

    // Cualquier otro error lo relanzamos para que lo vea el desarrollador
    throw error;
  }

  componentDidCatch(error, info) {
    const isDomError =
      error instanceof TypeError ||
      error instanceof DOMException ||
      error?.name === "NotFoundError" ||
      error?.message?.includes("removeChild") ||
      error?.message?.includes("insertBefore") ||
      error?.message?.includes("Failed to execute");

    if (isDomError) {
      console.warn(
        "[DomErrorBoundary] Error de sincronización del DOM capturado. Forzando recarga limpia.",
        error.message
      );

      // Esperamos un tick para que React termine su ciclo de desmontaje
      // y luego forzamos la navegación limpia al dashboard
      setTimeout(() => {
        const target = this.props.redirectTo || "/dashboard";
        window.location.replace(target);
      }, 0);
    }
  }

  render() {
    if (this.state.hasError) {
      // Pantalla mínima de transición mientras ocurre la recarga
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            background: "#f8f9fa",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              border: "4px solid #3b82f6",
              borderTopColor: "transparent",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <span style={{ color: "#64748b", fontSize: 14, fontWeight: 500 }}>
            Cargando...
          </span>
          <style>{`
            @keyframes spin { to { transform: rotate(360deg); } }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}

export default DomErrorBoundary;
