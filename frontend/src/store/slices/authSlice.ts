import { StateCreator } from 'zustand';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  department?: string;
  position?: string;
  permissions: string[];
}

export interface AuthSlice {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  setLoading: (loading: boolean) => void;
}

export const authSlice: StateCreator<AuthSlice> = (set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true });

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock authentication logic
      if (email === 'admin@company.com' && password === 'admin123') {
        const user: User = {
          id: '1',
          name: 'John Doe',
          email: 'admin@company.com',
          role: 'Admin',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face&auto=format',
          department: 'IT',
          position: 'System Administrator',
          permissions: ['all']
        };

        set({
          user,
          isAuthenticated: true,
          isLoading: false
        });
      } else if (email === 'user@company.com' && password === 'user123') {
        const user: User = {
          id: '2',
          name: 'Jane Smith',
          email: 'user@company.com',
          role: 'Employee',
          avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face&auto=format',
          department: 'HR',
          position: 'HR Specialist',
          permissions: ['read', 'write:own']
        };

        set({
          user,
          isAuthenticated: true,
          isLoading: false
        });
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false
    });
  },

  updateUser: (userData: Partial<User>) => {
    const currentUser = get().user;
    if (currentUser) {
      set({
        user: {
          ...currentUser,
          ...userData
        }
      });
    }
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  }
});