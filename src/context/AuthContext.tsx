import React, { createContext, ReactElement, useContext, useEffect, useState } from 'react';
import { loginRequest, fetchMyPermissions } from 'api/auth.api';
import { setUnauthorizedHandler } from 'api/base.api';
import { clearToken, getToken, setToken } from 'lib/tokenStorage';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  userId: number | null;
  permissions: string[];
  hasPermission: (page: string) => boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }): ReactElement {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);

  const loadPermissions = async (): Promise<void> => {
    try {
      const result = await fetchMyPermissions();
      setUserId(result.user_id);
      setPermissions(result.pages);
    } catch {
      setPermissions([]);
    }
  };

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearToken();
      setIsAuthenticated(false);
      setPermissions([]);
    });

    const token = getToken();
    if (token) {
      setIsAuthenticated(true);
      loadPermissions().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await loginRequest(username, password);
      setToken(response.token);
      setIsAuthenticated(true);
      await loadPermissions();
      return true;
    } catch {
      return false;
    }
  };

  const logout = (): void => {
    clearToken();
    setIsAuthenticated(false);
    setUserId(null);
    setPermissions([]);
  };

  const hasPermission = (page: string): boolean => permissions.includes(page);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, userId, permissions, hasPermission, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
