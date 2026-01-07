/**
 * GitHub Token Storage Utilities
 * 
 * Stores GitHub token in localStorage for client-side access.
 * Server-side code should use environment variables.
 */

const GITHUB_TOKEN_STORAGE_KEY = 'github_token';

export function getGitHubToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem(GITHUB_TOKEN_STORAGE_KEY);
}

export function setGitHubToken(token: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem(GITHUB_TOKEN_STORAGE_KEY, token);
}

export function clearGitHubToken(): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.removeItem(GITHUB_TOKEN_STORAGE_KEY);
}

export function hasGitHubToken(): boolean {
  return getGitHubToken() !== null;
}

