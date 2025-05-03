import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import * as LucideIcons from 'lucide-react'; // Import all icons

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

// Use a more specific type if possible, or keep ComponentType
// Ensure LucideProps is correctly imported or defined if needed
type LucideIconComponent = React.ComponentType<LucideIcons.LucideProps>;

/**
 * Converts a kebab-case string to PascalCase.
 * Example: "shield-check" -> "ShieldCheck"
 */
const kebabToPascalCase = (str: string): string => {
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
};

/**
 * Gets a Lucide icon component by its string name.
 * Returns null if the icon name is invalid or not found.
 */
export const getLucideIcon = (iconName: string | null | undefined): LucideIconComponent | null => {
  if (!iconName || typeof iconName !== 'string' || iconName.trim() === '') {
    return null;
  }

  // Convert kebab-case to PascalCase for component lookup
  const pascalCaseIconName = kebabToPascalCase(iconName);

  // Access icons safely using the correct PascalCase name
  const IconComponent = (LucideIcons as any)[pascalCaseIconName];

  // Check if the component was found
  if (IconComponent) {
    return IconComponent as LucideIconComponent;
  }
  console.warn(`[getLucideIcon] Lucide icon component not found for name: ${iconName} (tried ${pascalCaseIconName})`);
  return null;
};

// Helper function to generate initials (e.g., for fallback avatar)
// Basic implementation - replace with your actual logic if different
export function getInitials(name: string): string {
  if (!name) return '';
  const words = name.split(' ').filter(Boolean);
  if (words.length === 0) return '';
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

/**
 * Formats distance in meters to a readable string (km or m).
 */
export const formatDistance = (distanceInMeters: number | null | undefined): string | null => {
  if (distanceInMeters === null || distanceInMeters === undefined || isNaN(distanceInMeters)) {
    return null;
  }

  if (distanceInMeters < 1000) {
    // Round to nearest 10m for distances under 1km
    const roundedMeters = Math.round(distanceInMeters / 10) * 10;
    return `ca. ${roundedMeters} m`;
  } else {
    const distanceInKm = distanceInMeters / 1000;
    // Show one decimal place for km
    return `ca. ${distanceInKm.toFixed(1).replace('.', ',')} km`;
  }
};
