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
 * Gets a Lucide icon component by its string name.
 * Returns null if the icon name is invalid or not found.
 */
export const getLucideIcon = (iconName: string | null | undefined): LucideIconComponent | null => {
  console.log(`[getLucideIcon] Received iconName: ${iconName}`); // Log input
  if (!iconName || typeof iconName !== 'string' || iconName.trim() === '') {
    console.log(`[getLucideIcon] Invalid or empty iconName.`);
    return null;
  }

  const pascalCaseIconName = iconName.charAt(0).toUpperCase() + iconName.slice(1);
  console.log(`[getLucideIcon] Converted to PascalCase: ${pascalCaseIconName}`); // Log PascalCase name

  // Access icons safely using the PascalCase name
  const IconComponent = (LucideIcons as any)[pascalCaseIconName];
  console.log(`[getLucideIcon] Looked up component for ${pascalCaseIconName}:`, IconComponent); // Log the result of lookup

  // Check if the component was found (is truthy), not necessarily typeof 'function'
  if (IconComponent) {
    console.log(`[getLucideIcon] Component found for ${pascalCaseIconName}. Returning component.`);
    // Cast is likely still okay here as we expect a component type
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
