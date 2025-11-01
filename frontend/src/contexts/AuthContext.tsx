import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/services/api';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  permissions: string[];
  employeeId?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithSSO: (provider: string) => Promise<boolean>;
  logout: () => void;
  refreshUserData: () => Promise<boolean>;
  isAuthenticated: boolean;
  hasPermission: (permission: string) => boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{children: React.ReactNode;}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUserData = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return false;
    
    try {
      // Try to refresh the token
      const response = await api.post('/auth/refresh');
      const { accessToken, user: userData } = response.data;
      
      const user: User = {
        id: userData.id,
        email: userData.email,
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        roles: userData.roles || [],
        permissions: userData.permissions || [],
        employeeId: userData.employeeId
      };
      
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('hrms_user', JSON.stringify(user));
      setUser(user);
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Clear invalid data
      setUser(null);
      localStorage.removeItem('hrms_user');
      localStorage.removeItem('accessToken');
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('hrms_user');
    localStorage.removeItem('accessToken');
  };

  useEffect(() => {
    // Check for stored auth token
    const storedUser = localStorage.getItem('hrms_user');
    const storedToken = localStorage.getItem('accessToken');
    
    if (storedUser && storedToken) {
      try {
        const userData = JSON.parse(storedUser);
        
        // If permissions are missing, try to refresh the token
        if (!userData.permissions || !Array.isArray(userData.permissions) || userData.permissions.length === 0) {
          console.log('Permissions missing, attempting to refresh token...');
          refreshUserData().then((success) => {
            if (!success) {
              console.warn('Token refresh failed. Please re-login.');
          localStorage.removeItem('hrms_user');
          localStorage.removeItem('accessToken');
            }
          setIsLoading(false);
          });
          return;
        }
        
        setUser(userData);
      } catch (error) {
        // Clear invalid stored data
        localStorage.removeItem('hrms_user');
        localStorage.removeItem('accessToken');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      const { accessToken, user: userData } = response.data;
      
      // Backend now returns permissions directly, no need to generate them
      const user: User = {
        id: userData.id,
        email: userData.email,
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        roles: userData.roles || [],
        permissions: userData.permissions || [], // Permissions from backend
        employeeId: userData.employeeId
      };
      
      // Store token and complete user data (with permissions from backend)
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('hrms_user', JSON.stringify(user));
      
      setUser(user);
      setIsLoading(false);
      return true;
    } catch (error: any) {
      console.error('Login failed:', error);
      setIsLoading(false);
      return false;
    }
  };

  const loginWithSSO = async (provider: string): Promise<boolean> => {
    setIsLoading(true);

    try {
      // For demo purposes, simulate SSO by logging in as admin
      const success = await login('admin@ciro.gov.et', 'Admin12345!');
      setIsLoading(false);
      return success;
    } catch (error) {
      console.error('SSO login failed:', error);
      setIsLoading(false);
      return false;
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (!user.permissions || !Array.isArray(user.permissions)) return false;
    
    // Check if user has the specific permission
    return user.permissions.includes(permission);
  };

  const value = {
    user,
    login,
    loginWithSSO,
    logout,
    refreshUserData,
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