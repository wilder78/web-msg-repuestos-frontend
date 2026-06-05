import React from "react";
import { Search } from "lucide-react";
import { Input } from "../../components/ui/input";

const TableToolbar = ({ 
  title, 
  count, 
  searchTerm, 
  onSearchChange, 
  placeholder = "Buscar..." 
}) => {
  return (
    <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-800 transition-colors duration-300">
      {/* Título y Contador */}
      <div className="flex items-center gap-2">
        <h2 className="font-semibold text-slate-700 dark:text-slate-200">{title}</h2>
        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-full text-xs font-medium">
          {count} registrados
        </span>
      </div>

      {/* Input de Búsqueda */}
      <div className="relative w-full sm:w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
        <Input
          placeholder={placeholder}
          className="pl-10 bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-600 transition-colors"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </div>
  );
};

export default TableToolbar;