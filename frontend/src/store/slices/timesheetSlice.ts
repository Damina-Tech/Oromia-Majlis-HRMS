// timesheetStore.ts
import { StateCreator } from "zustand";

export interface TimerSession {
  id: string;
  taskId: string;
  taskName: string;
  projectId: string;
  projectName: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  description?: string;
}

export interface TimesheetEntry {
  id: string;
  employeeId: string;
  date: Date;
  sessions: TimerSession[];
  totalHours: number;
  status: "draft" | "submitted" | "approved" | "rejected";
  comments?: string;
  approvedBy?: string;
  approvedAt?: Date;
}

export interface ActiveTimer {
  id: string;
  taskId: string;
  taskName: string;
  projectId: string;
  projectName: string;
  startTime: Date;
  description?: string;
}

export interface TimesheetSlice {
  activeTimer: ActiveTimer | null;
  timesheetEntries: TimesheetEntry[];
  startTimer: (
    taskId: string,
    taskName: string,
    projectId: string,
    projectName: string,
    description?: string
  ) => void;
  stopTimer: () => TimerSession | null;
  addTimesheetEntry: (entry: Omit<TimesheetEntry, "id">) => void;
  updateTimesheetEntry: (id: string, updates: Partial<TimesheetEntry>) => void;
  deleteTimesheetEntry: (id: string) => void;
  submitTimesheet: (id: string) => void;
  approveTimesheet: (id: string, approverId: string) => void;
  rejectTimesheet: (id: string, comments: string) => void;
  getCurrentWeekEntries: () => TimesheetEntry[];
}

export const timesheetSlice: StateCreator<TimesheetSlice> = (set, get) => ({
  activeTimer: null,
  timesheetEntries: [],

  startTimer: (taskId, taskName, projectId, projectName, description) => {
    const currentTimer = get().activeTimer;
    if (currentTimer) {
      get().stopTimer();
    }

    set({
      activeTimer: {
        id: Date.now().toString(),
        taskId,
        taskName,
        projectId,
        projectName,
        startTime: new Date(),
        description,
      },
    });
  },

  stopTimer: () => {
    const activeTimer = get().activeTimer;
    if (!activeTimer) return null;

    const endTime = new Date();
    const duration = Math.floor(
      (endTime.getTime() - activeTimer.startTime.getTime()) / 60000
    );

    const session: TimerSession = {
      id: Date.now().toString(),
      taskId: activeTimer.taskId,
      taskName: activeTimer.taskName,
      projectId: activeTimer.projectId,
      projectName: activeTimer.projectName,
      startTime: activeTimer.startTime,
      endTime,
      duration,
      description: activeTimer.description,
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    set((state) => {
      const userId = "1";
      const existingIndex = state.timesheetEntries.findIndex(
        (entry) =>
          new Date(entry.date).setHours(0, 0, 0, 0) === today.getTime() &&
          entry.employeeId === userId
      );

      if (existingIndex >= 0) {
        const updatedEntries = [...state.timesheetEntries];
        const entry = updatedEntries[existingIndex];
        entry.sessions = [...entry.sessions, session];
        entry.totalHours = entry.sessions.reduce(
          (sum, s) => sum + s.duration / 60,
          0
        );

        return { timesheetEntries: updatedEntries, activeTimer: null };
      } else {
        const newEntry: TimesheetEntry = {
          id: Date.now().toString(),
          employeeId: userId,
          date: new Date(today),
          sessions: [session],
          totalHours: duration / 60,
          status: "draft",
        };

        return {
          timesheetEntries: [...state.timesheetEntries, newEntry],
          activeTimer: null,
        };
      }
    });

    return session;
  },

  addTimesheetEntry: (entryData) => {
    const entry: TimesheetEntry = {
      ...entryData,
      id: Date.now().toString(),
    };

    set((state) => ({
      timesheetEntries: [...state.timesheetEntries, entry],
    }));
  },

  updateTimesheetEntry: (id, updates) => {
    set((state) => ({
      timesheetEntries: state.timesheetEntries.map((entry) =>
        entry.id === id ? { ...entry, ...updates } : entry
      ),
    }));
  },

  deleteTimesheetEntry: (id) => {
    set((state) => ({
      timesheetEntries: state.timesheetEntries.filter(
        (entry) => entry.id !== id
      ),
    }));
  },

  submitTimesheet: (id) => {
    get().updateTimesheetEntry(id, { status: "submitted" });
  },

  approveTimesheet: (id, approverId) => {
    get().updateTimesheetEntry(id, {
      status: "approved",
      approvedBy: approverId,
      approvedAt: new Date(),
    });
  },

  rejectTimesheet: (id, comments) => {
    get().updateTimesheetEntry(id, {
      status: "rejected",
      comments,
    });
  },

  getCurrentWeekEntries: () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const start = new Date(now);
    start.setDate(now.getDate() - dayOfWeek);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    end.setHours(0, 0, 0, 0);

    return get().timesheetEntries.filter((entry) => {
      const date = new Date(entry.date);
      return date >= start && date < end;
    });
  },
});
