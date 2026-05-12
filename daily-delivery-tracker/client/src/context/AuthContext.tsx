import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import axios from 'axios';
import { setAccessToken } from '../lib/api';
import type { AuthUser } from '../types/index';

interface AuthContextValue {
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  const login = useCallback(async (username: string, password: string) => {
    const { data } = await axios.post<{ accessToken: string }>(
      '/auth/login',
      { username, password },
      { withCredentials: true }
    );
    setAccessToken(data.accessToken);

    // Decode the JWT payload to get user info (no signature verification needed client-side)
    const payload = JSON.parse(atob(data.accessToken.split('.')[1])) as AuthUser;
    setUser({ id: payload.id, username: payload.username, role: payload.role });
  }, []);

  const logout = useCallback(async () => {
    try {
      await axios.post('/auth/logout', {}, { withCredentials: true });
    } catch {
      // ignore errors on logout
    }
    setAccessToken(null);
    setUser(null);
  }, []);

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
