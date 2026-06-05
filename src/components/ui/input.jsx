import * as React from "react"
import { cn } from "../../lib/utils"

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-slate-900 dark:text-zinc-100 ring-offset-white dark:ring-offset-zinc-900 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 dark:placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 dark:focus-visible:ring-zinc-400 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})

Input.displayName = "Input"

export { Input }

// import * as React from "react";
// import { cn } from "../../lib/utils";

// const Input = React.forwardRef(({ className, type, ...props }, ref) => {
//   return (
//     <input
//       type={type}
//       data-slot="input"
//       ref={ref}
//       className={cn(
//         // Base: Estructura y Tipografía
//         "flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm transition-all",
//         // Archivos (Input type="file")
//         "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-slate-900",
//         // Estados: Placeholder, Disabled y Focus
//         "placeholder:text-slate-500",
//         "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500",
//         "disabled:cursor-not-allowed disabled:opacity-50",
//         // Modo oscuro sutil (si lo usas) y personalización extra
//         "dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950",
//         className,
//       )}
//       {...props}
//     />
//   );
// });

// Input.displayName = "Input";

// export { Input };
