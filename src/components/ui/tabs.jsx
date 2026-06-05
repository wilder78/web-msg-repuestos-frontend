import * as React from "react";
import { cn } from "../../lib/utils";

// Creamos un contexto para manejar el estado de la pestaña activa sin librerías externas
const TabsContext = React.createContext(null);

function Tabs({
  defaultValue,
  value: controlledValue,
  onValueChange,
  onChange,
  children,
  className,
  ...props
}) {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const value = controlledValue ?? internalValue;

  const setValue = React.useCallback(
    (nextValue) => {
      if (controlledValue === undefined) {
        setInternalValue(nextValue);
      }
      onValueChange?.(nextValue);
      onChange?.(nextValue);
    },
    [controlledValue, onChange, onValueChange],
  );

  return (
    <TabsContext.Provider value={{ value, setValue }}>
      <div
        data-slot="tabs"
        className={cn("flex flex-col gap-2", className)}
        {...props}
      >
        {children}
      </div>
    </TabsContext.Provider>
  );
}

function TabsList({ className, ...props }) {
  return (
    <div
      data-slot="tabs-list"
      className={cn(
        "bg-slate-100 text-slate-500 inline-flex h-10 w-fit items-center justify-center rounded-xl p-[4px]",
        className,
      )}
      {...props}
    />
  );
}

function TabsTrigger({ value, className, children, ...props }) {
  const context = React.useContext(TabsContext);
  const isActive = context.value === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      data-state={isActive ? "active" : "inactive"}
      onClick={() => context.setValue(value)}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
        // Estilos cuando está activo (Simulando el comportamiento de Radix)
        isActive
          ? "bg-white text-blue-600 shadow-sm border border-slate-200"
          : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function TabsContent({ value, className, children, ...props }) {
  const context = React.useContext(TabsContext);

  // Si esta pestaña no es la activa, no renderizamos nada
  if (context.value !== value) return null;

  return (
    <div
      data-slot="tabs-content"
      role="tabpanel"
      className={cn(
        "flex-1 outline-none animate-in fade-in-50 duration-200",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
