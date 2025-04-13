import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper function to capitalize city names from slugs
export function capitalizeCity(slug: string): string {
  if (!slug) return '';
  if (slug === 'nearby') return 'In Ihrer Nähe'; // Handle nearby case
  // Replace hyphens with spaces and capitalize each word
  return slug.split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
