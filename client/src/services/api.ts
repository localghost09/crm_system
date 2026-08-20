import axios from 'axios';
import { tokenStore } from './tokenStore';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Attach access token to every request (memory-first via tokenStore)
api.interceptors.request.use((config) => {
  const token = tokenStore.accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Single-flight refresh: multiple parallel 401s share ONE refresh call
let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshToken(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = tokenStore.refreshToken;
      if (!refreshToken) return false;
      try {
        const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });
        if (data?.data?.accessToken) {
          tokenStore.setTokens(data.data.accessToken, data.data.refreshToken);
          return true;
        }
        return false;
      } catch {
        return false;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // Refresh token rotation on 401, except for the auth endpoints themselves
    if (status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true;
      const isAuthCall =
        String(originalRequest?.url || '').includes('/auth/login') ||
        String(originalRequest?.url || '').includes('/auth/register');

      if (!isAuthCall) {
        const refreshed = await tryRefreshToken();
        if (refreshed) {
          // Re-read from memory store (authoritative) — guaranteed fresh
          const token = tokenStore.accessToken;
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }
      }

      // Refresh failed → session is genuinely dead. Soft redirect (no hard
      // reload) so nothing gets clobbered mid-navigation.
      tokenStore.clear();
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login');
      }
    }

    return Promise.reject(error);
  }
);

export default api;
