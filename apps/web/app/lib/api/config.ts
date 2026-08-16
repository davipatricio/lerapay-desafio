/**
 * API configuration and base URL resolution for SSR and Browser environments.
 */

export function getApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    // Node.js SSR runtime: use internal server or environment configuration
    return (
      process.env.API_INTERNAL_URL ||
      process.env.API_URL ||
      process.env.VITE_API_URL ||
      'http://localhost:3000/api'
    );
  }

  // Browser runtime: use Vite client environment or fallback to localhost
  return (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:3000/api';
}
