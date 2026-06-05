import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina clases de CSS (clsx) y resuelve conflictos de Tailwind CSS (twMerge).
 * Ejemplo: cn("p-4 bg-red-500", "p-2") -> "bg-red-500 p-2"
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}