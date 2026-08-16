import type { UserDto } from '../api/types';

const TOKEN_KEY = 'lerapay.access_token';
const USER_KEY = 'lerapay.user';

function hasWindow(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Stores the BaaS JWT access token in the browser.
 */
export function setAccessToken(token: string): void {
  if (!hasWindow()) return;
  window.localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Returns the stored access token (browser only).
 */
export function getAccessToken(): string | null {
  if (!hasWindow()) return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

/**
 * Persists the authenticated user profile for header display.
 */
export function setSessionUser(user: UserDto): void {
  if (!hasWindow()) return;
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * Returns the persisted session user (browser only).
 */
export function getSessionUser(): UserDto | null {
  if (!hasWindow()) return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserDto;
  } catch {
    return null;
  }
}

/**
 * Clears the stored access token and user profile (logout).
 */
export function clearSession(): void {
  if (!hasWindow()) return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}
