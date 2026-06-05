import React from 'react';
import { Tag, FileText } from 'lucide-react';
import { FormField } from "../../../components/shared/FormInput";
export function CategoryForm({ 
  formData, 
  onChange, 
  onValidityChange,
  isEditing = false 
}) {
  
  // Efecto para la validación del formulario
  React.useEffect(() => {
    if (onValidityChange) {
      const isNombreValid = (formData.nombre_categoria || "").trim().length > 0;
      onValidityChange(isNombreValid);
    }
  }, [formData.nombre_categoria, onValidityChange]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onChange({ ...formData, [name]: value });
  };

  return (
    <form id="category-form" onSubmit={(event) => event.preventDefault()} className="space-y-5 py-2">
      
      {/* Nombre de la Categoría */}
      <FormField
        label="Nombre de la Categoría"
        icon={Tag}
        name="nombre_categoria"
        placeholder="Ej: Repuestos de Motor, Accesorios, Llantas..."
        value={formData.nombre_categoria || ""}
        onChange={handleInputChange}
        required
      />

      {/* Descripción de la Categoría */}
      <FormField
        label="Descripción"
        icon={FileText}
        isTextarea
        name="descripcion"
        placeholder="Describa brevemente qué tipo de repuestos incluye esta categoría..."
        value={formData.descripcion || ""}
        onChange={handleInputChange}
        className="mt-2"
      />

      {/* Nota de ayuda visual */}
      <p className="text-[11px] text-slate-400 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-800/40 p-3 rounded-lg border border-dashed border-slate-200 dark:border-zinc-700/60">
        <span className="font-bold text-slate-500 dark:text-zinc-300 uppercase">💡 Tip de MSG:</span> 
        Las categorías bien descritas ayudan a los clientes a encontrar sus repuestos de moto más rápido en el buscador.
      </p>

    </form>
  );
}
