import { StateCreator } from 'zustand';

export interface Asset {
  id: string;
  name: string;
  category: 'laptop' | 'phone' | 'tablet' | 'monitor' | 'keyboard' | 'mouse' | 'headset' | 'other';
  serialNumber: string;
  model: string;
  brand: string;
  purchaseDate: Date;
  purchasePrice: number;
  currentValue: number;
  status: 'available' | 'assigned' | 'maintenance' | 'retired';
  assignedTo?: string;
  assignedDate?: Date;
  location: string;
  warranty?: {
    expiryDate: Date;
    provider: string;
  };
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  notes?: string;
}

export interface AssetHistory {
  id: string;
  assetId: string;
  action: 'assigned' | 'revoked' | 'maintenance' | 'returned' | 'retired';
  employeeId?: string;
  employeeName?: string;
  date: Date;
  notes?: string;
  performedBy: string;
}

export interface AssetSlice {
  assets: Asset[];
  assetHistory: AssetHistory[];
  addAsset: (asset: Omit<Asset, 'id'>) => void;
  updateAsset: (id: string, updates: Partial<Asset>) => void;
  deleteAsset: (id: string) => void;
  assignAsset: (assetId: string, employeeId: string, employeeName: string, notes?: string) => void;
  revokeAsset: (assetId: string, notes?: string) => void;
  getAssetHistory: (assetId: string) => AssetHistory[];
  getEmployeeAssets: (employeeId: string) => Asset[];
  updateAssetStatus: (assetId: string, status: Asset['status'], notes?: string) => void;
}

export const assetSlice: StateCreator<AssetSlice> = (set, get) => ({
  assets: [
  {
    id: '1',
    name: 'MacBook Pro 16"',
    category: 'laptop',
    serialNumber: 'MBP-001-2023',
    model: 'MacBook Pro 16-inch',
    brand: 'Apple',
    purchaseDate: new Date('2023-01-15'),
    purchasePrice: 2500,
    currentValue: 2000,
    status: 'assigned',
    assignedTo: 'emp-001',
    assignedDate: new Date('2023-01-20'),
    location: 'Office - Floor 2',
    warranty: {
      expiryDate: new Date('2026-01-15'),
      provider: 'Apple'
    },
    condition: 'excellent',
    notes: 'Primary development machine'
  },
  {
    id: '2',
    name: 'iPhone 14 Pro',
    category: 'phone',
    serialNumber: 'IP14-002-2023',
    model: 'iPhone 14 Pro',
    brand: 'Apple',
    purchaseDate: new Date('2023-03-10'),
    purchasePrice: 1000,
    currentValue: 800,
    status: 'available',
    location: 'Office - Storage',
    warranty: {
      expiryDate: new Date('2025-03-10'),
      provider: 'Apple'
    },
    condition: 'good'
  },
  {
    id: '3',
    name: 'Dell Monitor 27"',
    category: 'monitor',
    serialNumber: 'DM27-003-2023',
    model: 'UltraSharp U2723QE',
    brand: 'Dell',
    purchaseDate: new Date('2023-02-01'),
    purchasePrice: 500,
    currentValue: 400,
    status: 'assigned',
    assignedTo: 'emp-002',
    assignedDate: new Date('2023-02-05'),
    location: 'Office - Floor 1',
    condition: 'excellent'
  }],

  assetHistory: [
  {
    id: '1',
    assetId: '1',
    action: 'assigned',
    employeeId: 'emp-001',
    employeeName: 'John Doe',
    date: new Date('2023-01-20'),
    notes: 'Initial assignment for development work',
    performedBy: 'admin-001'
  },
  {
    id: '2',
    assetId: '3',
    action: 'assigned',
    employeeId: 'emp-002',
    employeeName: 'Jane Smith',
    date: new Date('2023-02-05'),
    notes: 'Monitor for workstation setup',
    performedBy: 'admin-001'
  }],


  addAsset: (assetData) => {
    const asset: Asset = {
      ...assetData,
      id: Date.now().toString()
    };

    set((state) => ({
      assets: [...state.assets, asset]
    }));

    // Add history entry
    const historyEntry: AssetHistory = {
      id: Date.now().toString(),
      assetId: asset.id,
      action: 'assigned',
      date: new Date(),
      notes: 'Asset added to inventory',
      performedBy: '1' // TODO: Use actual user ID
    };

    set((state) => ({
      assetHistory: [...state.assetHistory, historyEntry]
    }));
  },

  updateAsset: (id, updates) => {
    set((state) => ({
      assets: state.assets.map((asset) =>
      asset.id === id ? { ...asset, ...updates } : asset
      )
    }));
  },

  deleteAsset: (id) => {
    set((state) => ({
      assets: state.assets.filter((asset) => asset.id !== id),
      assetHistory: state.assetHistory.filter((history) => history.assetId !== id)
    }));
  },

  assignAsset: (assetId, employeeId, employeeName, notes) => {
    const asset = get().assets.find((a) => a.id === assetId);
    if (!asset || asset.status !== 'available') return;

    // Update asset
    get().updateAsset(assetId, {
      status: 'assigned',
      assignedTo: employeeId,
      assignedDate: new Date()
    });

    // Add history entry
    const historyEntry: AssetHistory = {
      id: Date.now().toString(),
      assetId,
      action: 'assigned',
      employeeId,
      employeeName,
      date: new Date(),
      notes,
      performedBy: '1' // TODO: Use actual user ID
    };

    set((state) => ({
      assetHistory: [...state.assetHistory, historyEntry]
    }));
  },

  revokeAsset: (assetId, notes) => {
    const asset = get().assets.find((a) => a.id === assetId);
    if (!asset || asset.status !== 'assigned') return;

    const employeeId = asset.assignedTo;
    const employeeName = 'Employee'; // TODO: Get actual employee name

    // Update asset
    get().updateAsset(assetId, {
      status: 'available',
      assignedTo: undefined,
      assignedDate: undefined
    });

    // Add history entry
    const historyEntry: AssetHistory = {
      id: Date.now().toString(),
      assetId,
      action: 'revoked',
      employeeId,
      employeeName,
      date: new Date(),
      notes,
      performedBy: '1' // TODO: Use actual user ID
    };

    set((state) => ({
      assetHistory: [...state.assetHistory, historyEntry]
    }));
  },

  getAssetHistory: (assetId) => {
    return get().assetHistory.filter((history) => history.assetId === assetId);
  },

  getEmployeeAssets: (employeeId) => {
    return get().assets.filter((asset) => asset.assignedTo === employeeId);
  },

  updateAssetStatus: (assetId, status, notes) => {
    get().updateAsset(assetId, { status });

    // Add history entry
    const historyEntry: AssetHistory = {
      id: Date.now().toString(),
      assetId,
      action: status === 'maintenance' ? 'maintenance' : 'returned',
      date: new Date(),
      notes,
      performedBy: '1' // TODO: Use actual user ID
    };

    set((state) => ({
      assetHistory: [...state.assetHistory, historyEntry]
    }));
  }
});