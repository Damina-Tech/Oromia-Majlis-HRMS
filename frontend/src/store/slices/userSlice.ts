import { StateCreator } from 'zustand';

export interface SystemUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  department: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  permissions: string[];
  preferences: UserPreferences;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isSystemRole: boolean;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'manage';
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    slack: boolean;
  };
  dashboard: {
    widgets: string[];
    layout: 'grid' | 'list';
  };
}

export interface SystemSettings {
  company: {
    name: string;
    logo?: string;
    address: string;
    phone: string;
    email: string;
    website?: string;
    taxId?: string;
  };
  workingHours: {
    [day: string]: { enabled: boolean; start: string; end: string };
  };
  leaves: {
    annualLeaveDays: number;
    sickLeaveDays: number;
    maternityLeaveDays: number;
    paternityLeaveDays: number;
    carryForwardDays: number;
    maxCarryForward: number;
    probationPeriodDays: number;
  };
  payroll: {
    currency: string;
    payFrequency: 'weekly' | 'biweekly' | 'monthly';
    taxSettings: {
      federalTaxRate: number;
      stateTaxRate: number;
      socialSecurityRate: number;
      medicareRate: number;
    };
  };
  authentication: {
    passwordPolicy: {
      minLength: number;
      requireUppercase: boolean;
      requireLowercase: boolean;
      requireNumbers: boolean;
      requireSpecialChars: boolean;
      maxAge: number;
    };
    sessionTimeout: number;
    twoFactorEnabled: boolean;
    ssoEnabled: boolean;
    ssoProvider?: string;
  };
  notifications: {
    emailEnabled: boolean;
    smtpSettings?: {
      host: string;
      port: number;
      username: string;
      password: string;
      encryption: 'none' | 'tls' | 'ssl';
    };
    slackEnabled: boolean;
    slackWebhookUrl?: string;
  };
}

export interface UserSlice {
  users: SystemUser[];
  roles: Role[];
  permissions: Permission[];
  settings: SystemSettings;
  addUser: (user: Omit<SystemUser, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateUserData: (id: string, updates: Partial<SystemUser>) => void;
  deleteUser: (id: string) => void;
  addRole: (role: Omit<Role, 'id'>) => void;
  updateRole: (id: string, updates: Partial<Role>) => void;
  deleteRole: (id: string) => void;
  updateSettings: (settings: Partial<SystemSettings>) => void;
  updateUserPreferences: (userId: string, preferences: Partial<UserPreferences>) => void;
  getUsersByRole: (roleId: string) => SystemUser[];
  getActiveUsers: () => SystemUser[];
}

// ✅ Deep merge helper for nested settings
const deepMerge = <T>(target: T, source: Partial<T>): T => {
  const output = { ...target };

  for (const key in source) {
    const value = source[key];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      output[key] = deepMerge((target as any)[key] || {}, value);
    } else {
      output[key] = value as any;
    }
  }

  return output;
};

export const userSlice: StateCreator<UserSlice> = (set, get) => ({
  users: [
    {
      id: '1',
      email: 'admin@company.com',
      firstName: 'System',
      lastName: 'Administrator',
      role: {
        id: 'admin',
        name: 'Administrator',
        description: 'Full system access',
        permissions: [],
        isSystemRole: true
      },
      department: 'IT',
      isActive: true,
      lastLogin: new Date(),
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date(),
      permissions: ['all'],
      preferences: {
        theme: 'system',
        language: 'en',
        timezone: 'America/New_York',
        notifications: { email: true, push: true, slack: false },
        dashboard: {
          widgets: ['overview', 'attendance', 'leaves', 'announcements'],
          layout: 'grid'
        }
      }
    }
  ],
  roles: [],
  permissions: [],
  settings: {
    company: {
      name: 'Acme Corporation',
      address: '123 Business Ave, Suite 100, New York, NY 10001',
      phone: '+1 (555) 123-4567',
      email: 'info@acmecorp.com',
      website: 'https://acmecorp.com',
      taxId: '12-3456789'
    },
    workingHours: {
      monday: { enabled: true, start: '09:00', end: '17:00' },
      tuesday: { enabled: true, start: '09:00', end: '17:00' },
      wednesday: { enabled: true, start: '09:00', end: '17:00' },
      thursday: { enabled: true, start: '09:00', end: '17:00' },
      friday: { enabled: true, start: '09:00', end: '17:00' },
      saturday: { enabled: false, start: '09:00', end: '17:00' },
      sunday: { enabled: false, start: '09:00', end: '17:00' }
    },
    leaves: {
      annualLeaveDays: 20,
      sickLeaveDays: 10,
      maternityLeaveDays: 90,
      paternityLeaveDays: 14,
      carryForwardDays: 5,
      maxCarryForward: 25,
      probationPeriodDays: 90
    },
    payroll: {
      currency: 'USD',
      payFrequency: 'monthly',
      taxSettings: {
        federalTaxRate: 22,
        stateTaxRate: 6.5,
        socialSecurityRate: 6.2,
        medicareRate: 1.45
      }
    },
    authentication: {
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false,
        maxAge: 90
      },
      sessionTimeout: 480,
      twoFactorEnabled: false,
      ssoEnabled: false
    },
    notifications: {
      emailEnabled: true,
      slackEnabled: false
    }
  },

  addUser: (userData) => {
    const user: SystemUser = {
      ...userData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    set((state) => ({ users: [...state.users, user] }));
  },

  updateUserData: (id, updates) => {
    set((state) => ({
      users: state.users.map((user) =>
        user.id === id ? { ...user, ...updates, updatedAt: new Date() } : user
      )
    }));
  },

  deleteUser: (id) => {
    set((state) => ({
      users: state.users.filter((user) => user.id !== id)
    }));
  },

  addRole: (roleData) => {
    const role: Role = {
      ...roleData,
      id: Date.now().toString()
    };
    set((state) => ({ roles: [...state.roles, role] }));
  },

  updateRole: (id, updates) => {
    set((state) => ({
      roles: state.roles.map((role) =>
        role.id === id ? { ...role, ...updates } : role
      )
    }));
  },

  deleteRole: (id) => {
    const role = get().roles.find((r) => r.id === id);
    if (role?.isSystemRole) return;
    set((state) => ({
      roles: state.roles.filter((role) => role.id !== id)
    }));
  },

  updateSettings: (settingsUpdates) => {
    set((state) => ({
      settings: deepMerge(state.settings, settingsUpdates)
    }));
  },

  updateUserPreferences: (userId, preferences) => {
    const user = get().users.find((u) => u.id === userId);
    if (user) {
      get().updateUserData(userId, {
        preferences: deepMerge(user.preferences, preferences)
      });
    }
  },

  getUsersByRole: (roleId) => {
    return get().users.filter((user) => user.role.id === roleId);
  },

  getActiveUsers: () => {
    return get().users.filter((user) => user.isActive);
  }
});
