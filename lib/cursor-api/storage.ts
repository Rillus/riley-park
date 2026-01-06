/**
 * API Key Storage Utilities
 * 
 * For MVP, we'll use localStorage. In production, this should be
 * stored securely (encrypted, server-side, etc.)
 */

const API_KEY_STORAGE_KEY = 'cursor_api_key';

export function getApiKey(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem(API_KEY_STORAGE_KEY);
}

export function setApiKey(apiKey: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
}

export function clearApiKey(): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.removeItem(API_KEY_STORAGE_KEY);
}

export function hasApiKey(): boolean {
  return getApiKey() !== null;
}

