"use client";

import * as React from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import { cn } from "../../lib/utils";

/**
 * Componente Separator adaptado para React/Vite.
 * Se utiliza para crear líneas divisorias horizontales o verticales.
 */
const Separator = React.forwardRef(({ 
  className, 
  orientation = "horizontal", 
  decorative = true, 
  ...props 
}, ref) => (
  <SeparatorPrimitive.Root
    ref={ref}
    decorative={decorative}
    orientation={orientation}
    className={cn(
      "shrink-0 bg-slate-200 dark:bg-slate-800", // Color base (puedes usar 'bg-border' si tienes ese color en tailwind)
      orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
      className
    )}
    {...props}
  />
));

Separator.displayName = SeparatorPrimitive.Root.displayName;

export { Separator };