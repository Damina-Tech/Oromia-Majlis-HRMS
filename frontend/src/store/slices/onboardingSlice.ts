import { StateCreator } from 'zustand';

export interface OnboardingTask {
  id: string;
  title: string;
  description: string;
  category: 'documentation' | 'training' | 'equipment' | 'access' | 'meeting' | 'other';
  isRequired: boolean;
  estimatedDuration: number; // in minutes
  assignedRole?: string; // Who is responsible for this task
  dependencies: string[]; // Task IDs that must be completed first
  resources: TaskResource[];
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped';
  completedAt?: Date;
  completedBy?: string;
  notes?: string;
  order: number;
}

export interface TaskResource {
  id: string;
  title: string;
  type: 'document' | 'video' | 'link' | 'form';
  url: string;
  description?: string;
  required: boolean;
}

export interface NewHire {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  department: string;
  startDate: Date;
  manager: string;
  buddy?: string; // Assigned buddy for onboarding
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  progress: number; // Percentage of tasks completed
  tasks: OnboardingTaskInstance[];
  documents: OnboardingDocument[];
  checkedInAt?: Date;
  welcomeEmailSent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OnboardingTaskInstance {
  id: string;
  taskId: string;
  newHireId: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped';
  assignedTo?: string;
  dueDate?: Date;
  startedAt?: Date;
  completedAt?: Date;
  completedBy?: string;
  notes?: string;
  feedback?: string;
}

export interface OnboardingDocument {
  id: string;
  title: string;
  type: 'upload' | 'signature' | 'form';
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  fileUrl?: string;
  uploadedAt?: Date;
  isRequired: boolean;
  description?: string;
}

export interface OnboardingSlice {
  onboardingTasks: OnboardingTask[];
  newHires: NewHire[];
  addOnboardingTask: (task: Omit<OnboardingTask, 'id'>) => void;
  updateOnboardingTask: (id: string, updates: Partial<OnboardingTask>) => void;
  deleteOnboardingTask: (id: string) => void;
  addNewHire: (newHire: Omit<NewHire, 'id' | 'tasks' | 'progress' | 'createdAt' | 'updatedAt'>) => void;
  updateNewHire: (id: string, updates: Partial<NewHire>) => void;
  deleteNewHire: (id: string) => void;
  updateTaskStatus: (newHireId: string, taskInstanceId: string, status: OnboardingTaskInstance['status'], notes?: string) => void;
  assignTask: (newHireId: string, taskInstanceId: string, assignedTo: string, dueDate?: Date) => void;
  addDocument: (newHireId: string, document: Omit<OnboardingDocument, 'id'>) => void;
  updateDocument: (newHireId: string, documentId: string, updates: Partial<OnboardingDocument>) => void;
  calculateProgress: (newHireId: string) => number;
  sendWelcomeEmail: (newHireId: string) => void;
  checkIn: (newHireId: string) => void;
  getTasksForRole: (role: string) => OnboardingTask[];
  getNewHiresByStatus: (status: NewHire['status']) => NewHire[];
}

export const onboardingSlice: StateCreator<OnboardingSlice> = (set, get) => ({
  onboardingTasks: [
  {
    id: '1',
    title: 'Complete Employee Information Form',
    description: 'Fill out personal and emergency contact information',
    category: 'documentation',
    isRequired: true,
    estimatedDuration: 30,
    assignedRole: 'employee',
    dependencies: [],
    resources: [
    {
      id: 'r1',
      title: 'Employee Information Form',
      type: 'form',
      url: '/forms/employee-info',
      description: 'Personal details and emergency contacts',
      required: true
    }],

    status: 'not_started',
    order: 1
  },
  {
    id: '2',
    title: 'Setup Workspace and Equipment',
    description: 'Receive and setup laptop, phone, and other necessary equipment',
    category: 'equipment',
    isRequired: true,
    estimatedDuration: 60,
    assignedRole: 'it',
    dependencies: [],
    resources: [
    {
      id: 'r2',
      title: 'Equipment Checklist',
      type: 'document',
      url: '/docs/equipment-checklist.pdf',
      description: 'List of standard equipment for new hires',
      required: true
    }],

    status: 'not_started',
    order: 2
  },
  {
    id: '3',
    title: 'Account Setup and Access',
    description: 'Create accounts for email, systems, and applications',
    category: 'access',
    isRequired: true,
    estimatedDuration: 45,
    assignedRole: 'it',
    dependencies: ['1'],
    resources: [],
    status: 'not_started',
    order: 3
  },
  {
    id: '4',
    title: 'Company Policies Training',
    description: 'Review and acknowledge company policies and procedures',
    category: 'training',
    isRequired: true,
    estimatedDuration: 120,
    assignedRole: 'hr',
    dependencies: [],
    resources: [
    {
      id: 'r3',
      title: 'Employee Handbook',
      type: 'document',
      url: '/docs/employee-handbook.pdf',
      description: 'Complete guide to company policies',
      required: true
    },
    {
      id: 'r4',
      title: 'Policies Training Video',
      type: 'video',
      url: '/videos/policies-training',
      description: 'Overview of key company policies',
      required: true
    }],

    status: 'not_started',
    order: 4
  },
  {
    id: '5',
    title: 'Meet Your Team',
    description: 'Introduction meeting with team members and key stakeholders',
    category: 'meeting',
    isRequired: true,
    estimatedDuration: 60,
    assignedRole: 'manager',
    dependencies: ['3'],
    resources: [],
    status: 'not_started',
    order: 5
  }],

  newHires: [
  {
    id: '1',
    employeeId: 'emp-003',
    firstName: 'Alice',
    lastName: 'Johnson',
    email: 'alice.johnson@company.com',
    position: 'Frontend Developer',
    department: 'Engineering',
    startDate: new Date('2024-02-01'),
    manager: 'mgr-001',
    buddy: 'emp-001',
    status: 'in_progress',
    progress: 60,
    tasks: [
    {
      id: 'ti1',
      taskId: '1',
      newHireId: '1',
      status: 'completed',
      completedAt: new Date('2024-02-01'),
      completedBy: 'emp-003'
    },
    {
      id: 'ti2',
      taskId: '2',
      newHireId: '1',
      status: 'completed',
      assignedTo: 'it-001',
      completedAt: new Date('2024-02-01'),
      completedBy: 'it-001'
    },
    {
      id: 'ti3',
      taskId: '3',
      newHireId: '1',
      status: 'completed',
      assignedTo: 'it-001',
      completedAt: new Date('2024-02-02'),
      completedBy: 'it-001'
    },
    {
      id: 'ti4',
      taskId: '4',
      newHireId: '1',
      status: 'in_progress',
      assignedTo: 'hr-001',
      startedAt: new Date('2024-02-02')
    },
    {
      id: 'ti5',
      taskId: '5',
      newHireId: '1',
      status: 'not_started',
      assignedTo: 'mgr-001',
      dueDate: new Date('2024-02-05')
    }],

    documents: [
    {
      id: 'd1',
      title: 'Tax Forms (W-4)',
      type: 'upload',
      status: 'submitted',
      fileUrl: '/uploads/w4-alice-johnson.pdf',
      uploadedAt: new Date('2024-02-01'),
      isRequired: true,
      description: 'Federal tax withholding form'
    },
    {
      id: 'd2',
      title: 'Employee Handbook Acknowledgment',
      type: 'signature',
      status: 'pending',
      isRequired: true,
      description: 'Digital signature confirming receipt and understanding'
    }],

    checkedInAt: new Date('2024-02-01'),
    welcomeEmailSent: true,
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-02-02')
  }],


  addOnboardingTask: (taskData) => {
    const task: OnboardingTask = {
      ...taskData,
      id: Date.now().toString()
    };

    set((state) => ({
      onboardingTasks: [...state.onboardingTasks, task]
    }));
  },

  updateOnboardingTask: (id, updates) => {
    set((state) => ({
      onboardingTasks: state.onboardingTasks.map((task) =>
      task.id === id ? { ...task, ...updates } : task
      )
    }));
  },

  deleteOnboardingTask: (id) => {
    set((state) => ({
      onboardingTasks: state.onboardingTasks.filter((task) => task.id !== id)
    }));
  },

  addNewHire: (newHireData) => {
    const tasks = get().onboardingTasks;
    const taskInstances: OnboardingTaskInstance[] = tasks.map((task) => ({
      id: `${Date.now()}-${task.id}`,
      taskId: task.id,
      newHireId: Date.now().toString(),
      status: 'not_started'
    }));

    const newHire: NewHire = {
      ...newHireData,
      id: Date.now().toString(),
      tasks: taskInstances,
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    set((state) => ({
      newHires: [...state.newHires, newHire]
    }));
  },

  updateNewHire: (id, updates) => {
    set((state) => ({
      newHires: state.newHires.map((newHire) =>
      newHire.id === id ?
      { ...newHire, ...updates, updatedAt: new Date() } :
      newHire
      )
    }));
  },

  deleteNewHire: (id) => {
    set((state) => ({
      newHires: state.newHires.filter((newHire) => newHire.id !== id)
    }));
  },

  updateTaskStatus: (newHireId, taskInstanceId, status, notes) => {
    const newHire = get().newHires.find((nh) => nh.id === newHireId);
    if (!newHire) return;

    const updatedTasks = newHire.tasks.map((task) => {
      if (task.id === taskInstanceId) {
        const updates: Partial<OnboardingTaskInstance> = {
          status,
          notes
        };

        if (status === 'in_progress' && task.status === 'not_started') {
          updates.startedAt = new Date();
        } else if (status === 'completed') {
          updates.completedAt = new Date();
          updates.completedBy = '1'; // TODO: Use actual user ID
        }

        return { ...task, ...updates };
      }
      return task;
    });

    const progress = get().calculateProgress(newHireId);

    get().updateNewHire(newHireId, {
      tasks: updatedTasks,
      progress
    });
  },

  assignTask: (newHireId, taskInstanceId, assignedTo, dueDate) => {
    const newHire = get().newHires.find((nh) => nh.id === newHireId);
    if (!newHire) return;

    const updatedTasks = newHire.tasks.map((task) => {
      if (task.id === taskInstanceId) {
        return { ...task, assignedTo, dueDate };
      }
      return task;
    });

    get().updateNewHire(newHireId, {
      tasks: updatedTasks
    });
  },

  addDocument: (newHireId, documentData) => {
    const newHire = get().newHires.find((nh) => nh.id === newHireId);
    if (!newHire) return;

    const document: OnboardingDocument = {
      ...documentData,
      id: Date.now().toString()
    };

    get().updateNewHire(newHireId, {
      documents: [...newHire.documents, document]
    });
  },

  updateDocument: (newHireId, documentId, updates) => {
    const newHire = get().newHires.find((nh) => nh.id === newHireId);
    if (!newHire) return;

    const updatedDocuments = newHire.documents.map((doc) => {
      if (doc.id === documentId) {
        const docUpdates = { ...updates };
        if (updates.fileUrl && !doc.uploadedAt) {
          docUpdates.uploadedAt = new Date();
        }
        return { ...doc, ...docUpdates };
      }
      return doc;
    });

    get().updateNewHire(newHireId, {
      documents: updatedDocuments
    });
  },

  calculateProgress: (newHireId) => {
    const newHire = get().newHires.find((nh) => nh.id === newHireId);
    if (!newHire) return 0;

    const requiredTasks = get().onboardingTasks.filter((task) => task.isRequired);
    const completedTasks = newHire.tasks.filter((task) => {
      const taskDef = get().onboardingTasks.find((t) => t.id === task.taskId);
      return taskDef?.isRequired && task.status === 'completed';
    });

    return Math.round(completedTasks.length / requiredTasks.length * 100);
  },

  sendWelcomeEmail: (newHireId) => {
    get().updateNewHire(newHireId, {
      welcomeEmailSent: true
    });
  },

  checkIn: (newHireId) => {
    get().updateNewHire(newHireId, {
      checkedInAt: new Date(),
      status: 'in_progress'
    });
  },

  getTasksForRole: (role) => {
    return get().onboardingTasks.filter((task) => task.assignedRole === role);
  },

  getNewHiresByStatus: (status) => {
    return get().newHires.filter((newHire) => newHire.status === status);
  }
});