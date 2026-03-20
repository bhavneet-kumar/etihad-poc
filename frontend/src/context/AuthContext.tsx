import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const TOKEN_KEY = 'etihad_auth_token';
const USER_KEY = 'etihad_auth_user';

export type UserRole = 'customer' | 'admin';

export interface AuthUser {
  email: string;
  role: UserRole;
}

interface AuthContextValue {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredUser(): AuthUser | null {
  try {
    const s = localStorage.getItem(USER_KEY);
    if (!s) return null;
    const u = JSON.parse(s) as AuthUser;
    if (u?.email && (u.role === 'customer' || u.role === 'admin')) return u;
  } catch {
    /* ignore */
  }
  return null;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser());

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    const onExpired = () => {
      logout();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    };
    window.addEventListener('etihad:auth-expired', onExpired);
    return () => window.removeEventListener('etihad:auth-expired', onExpired);
  }, [logout]);

  const login = useCallback(async (email: string, password: string) => {
    const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
    const url = base.endsWith('/api') ? `${base}/auth/login` : `${base.replace(/\/$/, '')}/api/auth/login`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || data.error || 'Login failed');
    }
    const t = data.token as string;
    const u = data.user as AuthUser;
    if (!t || !u?.email || !u?.role) throw new Error('Invalid login response');
    localStorage.setItem(TOKEN_KEY, t);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    setToken(t);
    setUser(u);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      login,
      logout,
    }),
    [token, user, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
