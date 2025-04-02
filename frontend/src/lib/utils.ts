import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
/**
 * Format a date to a readable string
 */
export function formatDate(date: Date | string | number | undefined): string {
  if (!date) return 'N/A';

  const d = new Date(date);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
}

/**
 * Format a date with time to a readable string
 */
export function formatDateTime(date: Date | string | number | undefined): string {
  if (!date) return 'N/A';

  const d = new Date(date);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/**
 * Format a percentage number
 */
export function formatPercent(value: number | undefined): string {
  if (value === undefined) return 'N/A';
  return `${Math.round(value * 10) / 10}%`;
}

/**
 * Truncate text to a specified length
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}

/**
 * Convert a camelCase or snake_case string to a human-readable format
 */
export function humanizeString(str: string): string {
  // Handle camelCase
  const spacedString = str.replace(/([A-Z])/g, ' $1').trim();

  // Handle snake_case
  const withoutUnderscores = spacedString.replace(/_/g, ' ');

  // Capitalize first letter
  return withoutUnderscores.charAt(0).toUpperCase() + withoutUnderscores.slice(1).toLowerCase();
}

/**
 * Check if user has a specific role
 */
export function hasRole(userRoles: string[] | undefined, requiredRoles: string[]): boolean {
  if (!userRoles || userRoles.length === 0) return false;
  return userRoles.some(role => requiredRoles.includes(role));
}

/**
 * Format a string ID to a friendly display format
 */
export function formatId(id: string): string {
  if (!id) return '';

  // If it's a UUID, just return the first segment
  if (id.includes('-')) {
    return id.split('-')[0];
  }

  // If it's a MongoDB ObjectID, return the first 6 chars
  if (id.length === 24) {
    return id.substring(0, 6);
  }

  return id;
}
