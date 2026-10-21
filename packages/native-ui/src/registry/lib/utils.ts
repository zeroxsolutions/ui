import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Joins class values and resolves Tailwind conflicts, the later class winning,
 * so a caller's `className` overrides the recipe it is merged after.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
