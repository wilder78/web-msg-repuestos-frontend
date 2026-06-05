import React, { createContext, useContext, useState, useCallback } from "react";

const ModalDockContext = createContext(null);

export const useModalDock = () => {
  const context = useContext(ModalDockContext);
  if (!context) {
    throw new Error("useModalDock must be used within a ModalDockProvider");
  }
  return context;
};

export const ModalDockProvider = ({ children }) => {
  const [windows, setWindows] = useState([]);
  const [maxZIndex, setMaxZIndex] = useState(100);

  const openWindow = useCallback((id, { title, type, data = null, size = { width: 550, height: 450 } }) => {
    setWindows((prev) => {
      // Si la ventana ya existe, solo la traemos al frente y la maximizamos
      const existing = prev.find((w) => w.id === id);
      if (existing) {
        setMaxZIndex((z) => z + 1);
        return prev.map((w) =>
          w.id === id
            ? { ...w, isMinimized: false, zIndex: maxZIndex + 1 }
            : w
        );
      }

      // Calculamos la posición centrada en la pantalla
      const defaultX = Math.max(20, (window.innerWidth - size.width) / 2);
      const defaultY = Math.max(20, (window.innerHeight - size.height) / 2);

      setMaxZIndex((z) => z + 1);
      return [
        ...prev,
        {
          id,
          title,
          type, // ej: "customer-create", "order-details"
          data, // datos iniciales o del registro
          isMinimized: false,
          position: { x: defaultX, y: defaultY },
          size,
          zIndex: maxZIndex + 1,
          formState: {}, // almacena el input actual del formulario
        },
      ];
    });
  }, [maxZIndex]);

  const minimizeWindow = useCallback((id) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isMinimized: true } : w))
    );
  }, []);

  const restoreWindow = useCallback((id) => {
    setMaxZIndex((z) => z + 1);
    setWindows((prev) =>
      prev.map((w) =>
        w.id === id
          ? { ...w, isMinimized: false, zIndex: maxZIndex + 1 }
          : w
      )
    );
  }, [maxZIndex]);

  const focusWindow = useCallback((id) => {
    setMaxZIndex((z) => z + 1);
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, zIndex: maxZIndex + 1 } : w))
    );
  }, [maxZIndex]);

  const updateWindowPosition = useCallback((id, position) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, position } : w))
    );
  }, []);

  const updateWindowFormState = useCallback((id, formState) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, formState: { ...w.formState, ...formState } } : w))
    );
  }, []);

  const closeWindow = useCallback((id) => {
    setWindows((prev) => prev.filter((w) => w.id !== id));
  }, []);

  return (
    <ModalDockContext.Provider
      value={{
        windows,
        openWindow,
        minimizeWindow,
        restoreWindow,
        focusWindow,
        updateWindowPosition,
        updateWindowFormState,
        closeWindow,
      }}
    >
      {children}
    </ModalDockContext.Provider>
  );
};
