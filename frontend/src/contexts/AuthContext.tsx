import React, { createContext, useContext, useState, useEffect } from 'react';
import { Api } from '@/services/api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'hr' | 'manager' | 'employee';
  department: string;
  designation: string;
  avatar?: string;
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithSSO: (provider: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  hasPermission: (permission: string) => boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// No local mock users; rely on backend


export const AuthProvider: React.FC<{children: React.ReactNode;}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth token
    const storedUser = localStorage.getItem('hrms_user');
    if (storedUser) setUser(JSON.parse(storedUser));
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { token, user } = await Api.login(email, password);
      localStorage.setItem('hrms_token', token);
      localStorage.setItem('hrms_user', JSON.stringify(user));
      setUser(user);
      return true;
    } catch (e) {
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithSSO = async (provider: string): Promise<boolean> => {
    // Not implemented; fallback false
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('hrms_user');
    localStorage.removeItem('hrms_token');
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.permissions.includes('*')) return true;
    return user.permissions.includes(permission);
  };

  const value = {
    user,
    login,
    loginWithSSO,
    logout,
    isAuthenticated: !!user,
    hasPermission,
    isLoading
  };

  return (
    <AuthContext.Provider value={value} data-id="1wbnso042" data-path="src/contexts/AuthContext.tsx">
      {children}
    </AuthContext.Provider>);

};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};