/**
 * Centralized API Configuration
 * 
 * This file provides a single source of truth for API URL configuration.
 * All API-related URLs should be imported from here to prevent hardcoded values.
 * 
 * Environment variables:
 * - VITE_API_URL: The base URL for the API (e.g., https://hrms-api.ciroocity.com)
 * 
 * Usage:
 *   import { API_BASE_URL, getApiUrl } from '@/config/api';
 */

/**
 * Base API URL: explicit VITE_API_URL, or same-origin in browser, or localhost in dev.
 */
function resolveApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return "http://localhost:4000";
}

export const API_BASE_URL = resolveApiBaseUrl();

/**
 * Full API endpoint URL (includes /api/v1)
 */
export const API_URL = `${API_BASE_URL}/api/v1`;

/**
 * Helper function to resolve file/asset URLs
 * If the URL already starts with http/https, returns as-is
 * Otherwise, prepends the API base URL
 * 
 * @param url - The relative or absolute URL
 * @returns The resolved URL
 */
export function resolveFileUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return `${API_BASE_URL}${url}`;
}

/**
 * Helper function to resolve avatar URLs
 * Alias for resolveFileUrl for semantic clarity
 * 
 * @param url - The relative or absolute avatar URL
 * @returns The resolved URL
 */
export function resolveAvatarUrl(url?: string | null): string | undefined {
  return resolveFileUrl(url);
}

/**
 * Helper function to get the full API endpoint for a specific route
 * 
 * @param endpoint - The API endpoint (e.g., '/employees' or 'employees')
 * @returns The full API URL
 */
export function getApiUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_URL}${cleanEndpoint}`;
}

