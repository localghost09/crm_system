/**
 * Token store: keeps the session tokens in module memory (authoritative)
 * and mirrors them to localStorage (best-effort, for persistence across
 * reloads). Some sandboxed/preview iframes restrict or partition
 * localStorage, so memory-first guarantees the current page session
 * always has its tokens, while localStorage still works in production.
 */

function readLS(key: string): string {
  try {
    return window.localStorage.getItem(key) || '';
  } catch {
    return '';
  }
}

function writeLS(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* storage unavailable — memory store still holds the session */
  }
}

function removeLS(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* noop */
  }
}

// Initialize from localStorage (if it survived the last page load)
const memory = {
  accessToken: readLS('accessToken'),
  refreshToken: readLS('refreshToken'),
};

export const tokenStore = {
  get accessToken(): string {
    return memory.accessToken;
  },
  get refreshToken(): string {
    return memory.refreshToken;
  },
  setTokens(accessToken: string, refreshToken: string): void {
    memory.accessToken = accessToken;
    memory.refreshToken = refreshToken;
    writeLS('accessToken', accessToken);
    writeLS('refreshToken', refreshToken);
  },
  setAccessToken(accessToken: string): void {
    memory.accessToken = accessToken;
    writeLS('accessToken', accessToken);
  },
  clear(): void {
    memory.accessToken = '';
    memory.refreshToken = '';
    removeLS('accessToken');
    removeLS('refreshToken');
    removeLS('user');
  },
};
