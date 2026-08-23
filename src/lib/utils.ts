import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * The shadcn `cn` helper: clsx for conditional classes, tailwind-merge to resolve conflicts so a
 * later utility actually wins instead of depending on stylesheet order.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
