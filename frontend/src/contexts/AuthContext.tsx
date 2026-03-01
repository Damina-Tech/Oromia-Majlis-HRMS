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
  avatarUrl?: string | null;
}

/** Default redirect path after login based on user role */
export function getLoginRedirect(user: User, explicitRedirect?: string): string {
  if (explicitRedirect && explicitRedirect.startsWith("/") && !explicitRedirect.startsWith("//")) {
    return explicitRedirect;
  }
  if (user.roles?.includes("HALAL_BUSINESS") && user.permissions?.includes("halal.business")) {
    return "/halal/dashboard";
  }
  if (user.roles?.includes("MEMBER") && user.permissions?.includes("majlis.member")) {
    return "/my-membership";
  }
  return "/dashboard";
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (payload: { email: string; password: string; firstName: string; lastName: string }) => Promise<{ success: boolean; redirectTo?: string }>;
  loginWithSSO: (provider: string) => Promise<boolean>;
  logout: () => void;
  refreshUserData: () => Promise<boolean>;
  updateUserProfile: (patch: Partial<User>) => void;
  storeAuthFromResponse: (accessToken: string, userData: { id: string; email: string; firstName: string; lastName: string; roles: string[]; permissions: string[]; employeeId?: string; avatarUrl?: string | null }) => void;
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
        employeeId: userData.employeeId,
        avatarUrl: userData.avatarUrl ?? null,
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

  const updateUserProfile = (patch: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...patch };
      localStorage.setItem('hrms_user', JSON.stringify(updated));
      return updated;
    });
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
      storeAuthFromResponse(accessToken, userData);
      setIsLoading(false);
      return true;
    } catch (error: any) {
      console.error('Login failed:', error);
      setIsLoading(false);
      return false;
    }
  };

  const storeAuthFromResponse = (accessToken: string, userData: { id: string; email: string; firstName: string; lastName: string; roles: string[]; permissions: string[]; employeeId?: string; avatarUrl?: string | null }) => {
    const user: User = {
      id: userData.id,
      email: userData.email,
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      roles: userData.roles || [],
      permissions: userData.permissions || [],
      employeeId: userData.employeeId,
      avatarUrl: userData.avatarUrl ?? null,
    };
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('hrms_user', JSON.stringify(user));
    setUser(user);
  };

  const register = async (payload: { email: string; password: string; firstName: string; lastName: string }): Promise<{ success: boolean; redirectTo?: string }> => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/register', payload);
      const { accessToken, user: userData, redirectTo } = response.data;
      storeAuthFromResponse(accessToken, userData);
      setIsLoading(false);
      return { success: true, redirectTo };
    } catch (error: any) {
      console.error('Register failed:', error);
      setIsLoading(false);
      return { success: false };
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
    register,
    loginWithSSO,
    logout,
    refreshUserData,
    updateUserProfile,
    storeAuthFromResponse,
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