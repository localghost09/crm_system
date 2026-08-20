import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { tokenStore } from '../services/tokenStore';
import type { User, AuthResponse, ApiResponse } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const readUserFromStorage = (): User | null => {
  try {
    const raw = window.localStorage.getItem('user');
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => readUserFromStorage());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      // If we have a token in memory/storage, validate it against /auth/me
      if (tokenStore.accessToken) {
        try {
          const { data } = await api.get<ApiResponse<{ user: User }>>('/auth/me');
          setUser(data.data.user);
          try { window.localStorage.setItem('user', JSON.stringify(data.data.user)); } catch {}
        } catch {
          // Token invalid/expired — interceptor already tried to refresh.
          // If refresh succeeded, /auth/me would have succeeded; if not,
          // the session is dead.
          tokenStore.clear();
          setUser(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    // Clear any stale session first so in-flight 401s from a previous
    // session cannot interfere with the new one.
    tokenStore.clear();
    setUser(null);

    const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/login', { email, password });
    const { user: userData, accessToken, refreshToken } = data.data;
    tokenStore.setTokens(accessToken, refreshToken);
    try { window.localStorage.setItem('user', JSON.stringify(userData)); } catch {}
    setUser(userData);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, role?: string) => {
    tokenStore.clear();
    setUser(null);

    const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/register', { name, email, password, role });
    const { user: userData, accessToken, refreshToken } = data.data;
    tokenStore.setTokens(accessToken, refreshToken);
    try { window.localStorage.setItem('user', JSON.stringify(userData)); } catch {}
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {}
    tokenStore.clear();
    setUser(null);
  }, []);

  const updateUser = useCallback((userData: User) => {
    setUser(userData);
    try { window.localStorage.setItem('user', JSON.stringify(userData)); } catch {}
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
