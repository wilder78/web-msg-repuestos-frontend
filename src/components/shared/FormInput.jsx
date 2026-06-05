import React, { useState } from "react";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { cn } from "../../lib/utils";
import { Eye, EyeOff } from "lucide-react";

export function FormField({ 
  label, 
  icon: Icon, 
  type = "text", 
  isTextarea = false,
  error,
  required = false,
  children, 
  className,
  ...props 
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const currentType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className={cn("space-y-2 w-full", className)}>
      {/* 1. Etiqueta con indicador de requerido */}
      {!!label && (
        <Label className="text-slate-700 dark:text-zinc-300 font-bold flex items-center gap-1">
          {label}
          {!!required && <span className="text-emerald-500">*</span>}
        </Label>
      )}
      
      <div className="relative group flex items-center w-full">
        {/* 2. Icono dinámico con efecto de enfoque */}
        {!!Icon && (
          <Icon 
            className={cn(
              "absolute left-3 text-slate-400 transition-colors group-focus-within:text-emerald-600 z-10",
              isTextarea ? "top-3" : ""
            )} 
            size={16} 
          />
        )}

        {/* 3. Lógica de renderizado triple */}
        {children ? (
          /* CASO A: Es un Select u otro componente personalizado */
          <div className={cn("w-full", Icon && "relative")}>
             {children}
          </div>
        ) : isTextarea ? (
          /* CASO B: Es un área de texto */
          <Textarea
            {...props}
            className={cn(
              "w-full pl-10 bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white min-h-[100px] rounded-xl focus-visible:ring-emerald-500 focus-visible:ring-offset-0 resize-none",
              error && "border-red-500",
              props.className
            )}
          />
        ) : (
          /* CASO C: Es un input estándar */
          <div className="relative w-full">
            <Input
              type={currentType}
              {...props}
              className={cn(
                "w-full bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white h-11 rounded-xl focus-visible:ring-emerald-500 focus-visible:ring-offset-0",
                Icon ? "pl-10" : "px-4",
                isPassword ? "pr-10" : "",
                error && "border-red-500",
                props.className
              )}
            />
            {!!isPassword && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            )}
          </div>
        )}
      </div>

      {/* 4. Mensaje de Error (Feedback visual) */}
      {!!error && (
        <p className="text-[11px] text-red-500 font-medium mt-1 ml-1 animate-in fade-in slide-in-from-top-1">
          {error}
        </p>
      )}
    </div>
  );
}