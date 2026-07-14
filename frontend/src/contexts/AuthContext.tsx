import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/services/api';
import {
  isSuperAdminUser,
  userCanUsePermissionInScope,
  userHasDivision,
  type UserDivisionContext,
} from '@/lib/division-access';

export type { UserDivisionContext };

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  permissions: string[];
  employeeId?: string;
  avatarUrl?: string | null;
  isSuperAdmin?: boolean;
  divisions?: UserDivisionContext[];
}

/** Default redirect path after login based on user role */
export function getLoginRedirect(user: User, explicitRedirect?: string): string {
  if (explicitRedirect && explicitRedirect.startsWith("/") && !explicitRedirect.startsWith("//")) {
    return explicitRedirect;
  }
  if (user.roles?.includes("HALAL_COMPETENCY") && user.permissions?.includes("halal.competency")) {
    return "/halal/competency";
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
  register: (payload: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    registrationPurpose: "halal_business_certificate" | "halal_competency_certificate";
  }) => Promise<{ success: boolean; redirectTo?: string }>;
  loginWithSSO: (provider: string) => Promise<boolean>;
  logout: () => void;
  refreshUserData: () => Promise<boolean>;
  updateUserProfile: (patch: Partial<User>) => void;
  storeAuthFromResponse: (accessToken: string, userData: Partial<User> & { id: string; email: string; firstName: string; lastName: string; roles: string[]; permissions: string[] }) => void;
  isAuthenticated: boolean;
  hasPermission: (permission: string) => boolean;
  isSuperAdmin: () => boolean;
  hasDivision: (code: string) => boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapAuthUser(userData: Partial<User> & { id: string; email: string; firstName: string; lastName: string; roles: string[]; permissions: string[] }): User {
  return {
    id: userData.id,
    email: userData.email,
    firstName: userData.firstName || '',
    lastName: userData.lastName || '',
    roles: userData.roles || [],
    permissions: userData.permissions || [],
    employeeId: userData.employeeId,
    avatarUrl: userData.avatarUrl ?? null,
    isSuperAdmin: userData.isSuperAdmin,
    divisions: userData.divisions ?? [],
  };
}

export const AuthProvider: React.FC<{children: React.ReactNode;}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUserData = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return false;

    try {
      // Prefer /auth/me: rebuilds session from DB with access token (includes employeeId).
      // Falls back to cookie-based /auth/refresh when /me is unavailable.
      let response;
      try {
        response = await api.get('/auth/me');
      } catch (meError: any) {
        if (meError?.response?.status === 401 || meError?.response?.status === 404) {
          response = await api.post('/auth/refresh');
        } else {
          throw meError;
        }
      }

      const { accessToken, user: userData } = response.data;
      const nextUser = mapAuthUser(userData);

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('hrms_user', JSON.stringify(nextUser));
      setUser(nextUser);
      return true;
    } catch (error: any) {
      console.error('Session sync failed:', error);
      const status = error?.response?.status;
      // Only force logout on definitive auth failures — keep local session for network blips.
      if (status === 401 || status === 403) {
        setUser(null);
        localStorage.removeItem('hrms_user');
        localStorage.removeItem('accessToken');
      }
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
    const storedUser = localStorage.getItem('hrms_user');
    const storedToken = localStorage.getItem('accessToken');

    if (!storedUser || !storedToken) {
      setIsLoading(false);
      return;
    }

    try {
      const userData = JSON.parse(storedUser) as User;
      const needsSync =
        !userData.permissions ||
        !Array.isArray(userData.permissions) ||
        userData.permissions.length === 0 ||
        !userData.employeeId;

      // Hydrate immediately so UI can render, then sync from backend.
      setUser(userData);

      if (needsSync) {
        refreshUserData().finally(() => setIsLoading(false));
        return;
      }

      // Still sync in background so roles/permissions/employeeId stay current.
      refreshUserData().finally(() => setIsLoading(false));
    } catch {
      localStorage.removeItem('hrms_user');
      localStorage.removeItem('accessToken');
      setIsLoading(false);
    }
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

  const storeAuthFromResponse = (accessToken: string, userData: Partial<User> & { id: string; email: string; firstName: string; lastName: string; roles: string[]; permissions: string[] }) => {
    const user = mapAuthUser(userData);
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('hrms_user', JSON.stringify(user));
    setUser(user);
  };

  const register = async (payload: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    registrationPurpose: "halal_business_certificate" | "halal_competency_certificate";
  }): Promise<{ success: boolean; redirectTo?: string }> => {
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
      const success = await login('admin@oriasc.org', 'Admin12345!');
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
    return userCanUsePermissionInScope(user, permission);
  };

  const isSuperAdmin = (): boolean => isSuperAdminUser(user);

  const hasDivision = (code: string): boolean => userHasDivision(user, code);

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
    isSuperAdmin,
    hasDivision,
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