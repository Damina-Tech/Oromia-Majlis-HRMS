import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { authSlice, AuthSlice } from './slices/authSlice';
import { notificationSlice, NotificationSlice } from './slices/notificationSlice';
import { timesheetSlice, TimesheetSlice } from './slices/timesheetSlice';
import { assetSlice, AssetSlice } from './slices/assetSlice';
import { expenseSlice, ExpenseSlice } from './slices/expenseSlice';
import { documentSlice, DocumentSlice } from './slices/documentSlice';
import { onboardingSlice, OnboardingSlice } from './slices/onboardingSlice';
import { userSlice, UserSlice } from './slices/userSlice';

export interface RootState extends
  AuthSlice,
  NotificationSlice,
  TimesheetSlice,
  AssetSlice,
  ExpenseSlice,
  DocumentSlice,
  OnboardingSlice,
  UserSlice {}

export const useStore = create<RootState>()(
  devtools(
    subscribeWithSelector(
      persist(
        (...args) => ({
          ...authSlice(...args),
          ...notificationSlice(...args),
          ...timesheetSlice(...args),
          ...assetSlice(...args),
          ...expenseSlice(...args),
          ...documentSlice(...args),
          ...onboardingSlice(...args),
          ...userSlice(...args)
        }),
        {
          name: 'hr-management-store',
          partialize: (state) => ({
            user: state.user,
            isAuthenticated: state.isAuthenticated,
            notifications: state.notifications
          })
        }
      )
    ),
    {
      name: 'hr-management-store'
    }
  )
);

// Export individual slice selectors for convenience
export const useAuth = () => useStore((state) => ({
  user: state.user,
  isAuthenticated: state.isAuthenticated,
  login: state.login,
  logout: state.logout,
  updateUser: state.updateUser
}));

export const useNotifications = () => useStore((state) => ({
  notifications: state.notifications,
  unreadCount: state.unreadCount,
  addNotification: state.addNotification,
  markAsRead: state.markAsRead,
  markAllAsRead: state.markAllAsRead,
  clearNotifications: state.clearNotifications
}));

export const useTimesheet = () => useStore((state) => ({
  activeTimer: state.activeTimer,
  timesheetEntries: state.timesheetEntries,
  startTimer: state.startTimer,
  stopTimer: state.stopTimer,
  addTimesheetEntry: state.addTimesheetEntry,
  updateTimesheetEntry: state.updateTimesheetEntry,
  deleteTimesheetEntry: state.deleteTimesheetEntry,
  submitTimesheet: state.submitTimesheet
}));

export const useAssets = () => useStore((state) => ({
  assets: state.assets,
  assetHistory: state.assetHistory,
  addAsset: state.addAsset,
  updateAsset: state.updateAsset,
  assignAsset: state.assignAsset,
  revokeAsset: state.revokeAsset,
  getAssetHistory: state.getAssetHistory
}));

export const useExpenses = () => useStore((state) => ({
  expenses: state.expenses,
  addExpense: state.addExpense,
  updateExpense: state.updateExpense,
  approveExpense: state.approveExpense,
  rejectExpense: state.rejectExpense,
  submitExpense: state.submitExpense
}));

export const useDocuments = () => useStore((state) => ({
  documents: state.documents,
  templates: state.templates,
  addDocument: state.addDocument,
  updateDocument: state.updateDocument,
  generateDocument: state.generateDocument,
  uploadSignedDocument: state.uploadSignedDocument
}));

export const useOnboarding = () => useStore((state) => ({
  onboardingTasks: state.onboardingTasks,
  newHires: state.newHires,
  addOnboardingTask: state.addOnboardingTask,
  updateTaskStatus: state.updateTaskStatus,
  addNewHire: state.addNewHire,
  updateNewHire: state.updateNewHire
}));

export const useUsers = () => useStore((state) => ({
  users: state.users,
  roles: state.roles,
  permissions: state.permissions,
  settings: state.settings,
  addUser: state.addUser,
  updateUser: state.updateUserData,
  deleteUser: state.deleteUser,
  updateSettings: state.updateSettings
}));