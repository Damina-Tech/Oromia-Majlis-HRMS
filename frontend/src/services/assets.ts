import api from "./api";

// Types
export interface Asset {
  id: string;
  name: string;
  category: "LAPTOP" | "DESKTOP" | "MONITOR" | "KEYBOARD" | "MOUSE" | "PHONE" | "TABLET" | "HEADSET" | "PRINTER" | "NETWORK_EQUIPMENT" | "OTHER";
  serialNumber: string;
  model?: string;
  brand?: string;
  purchaseDate?: string;
  purchasePrice?: number | string;
  currentValue?: number | string;
  condition: "EXCELLENT" | "GOOD" | "FAIR" | "POOR" | "DAMAGED";
  status: "AVAILABLE" | "ASSIGNED" | "MAINTENANCE" | "RETIRED" | "LOST" | "DAMAGED";
  location?: string;
  notes?: string;
  assignedTo?: string;
  assignedDate?: string;
  assignedBy?: string;
  createdAt: string;
  updatedAt: string;
  assignedEmployee?: {
    id: string;
    firstName: string;
    lastName: string;
    employeeCode: string;
    designation?: string;
    email?: string;
    phone?: string;
    department?: {
      id: string;
      name: string;
    };
  };
  assignedByUser?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  _count?: {
    history: number;
  };
}

export interface AssetHistory {
  id: string;
  assetId: string;
  action: "CREATED" | "ASSIGNED" | "REVOKED" | "TRANSFERRED" | "MAINTENANCE_STARTED" | "MAINTENANCE_COMPLETED" | "STATUS_CHANGED" | "CONDITION_UPDATED" | "RETIRED" | "LOST" | "FOUND";
  description?: string;
  fromEmployeeId?: string;
  toEmployeeId?: string;
  previousStatus?: string;
  newStatus?: string;
  previousCondition?: string;
  newCondition?: string;
  performedBy: string;
  createdAt: string;
  asset?: {
    id: string;
    name: string;
    serialNumber: string;
  };
  fromEmployee?: {
    id: string;
    firstName: string;
    lastName: string;
    employeeCode: string;
  };
  toEmployee?: {
    id: string;
    firstName: string;
    lastName: string;
    employeeCode: string;
  };
  performedByUser?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface AssetStats {
  totalAssets: number;
  totalValue: number;
  averageValue: number;
  statusBreakdown: Record<string, number>;
  conditionBreakdown: Record<string, number>;
  categoryBreakdown: Record<string, number>;
}

export interface ListAssetsParams {
  search?: string;
  category?: string;
  status?: string;
  condition?: string;
  location?: string;
  assignedTo?: string;
  assignedBy?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "name" | "serialNumber" | "category" | "status" | "condition" | "purchaseDate" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface AssetStatsParams {
  category?: string;
  location?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface AssetHistoryParams {
  assetId?: string;
  action?: string;
  performedBy?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateAssetData {
  name: string;
  category: string;
  serialNumber: string;
  model?: string;
  brand?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  currentValue?: number;
  condition?: string;
  location?: string;
  notes?: string;
}

export interface UpdateAssetData {
  name?: string;
  category?: string;
  serialNumber?: string;
  model?: string;
  brand?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  currentValue?: number;
  condition?: string;
  status?: string;
  location?: string;
  notes?: string;
}

export interface AssignAssetData {
  employeeId: string;
  notes?: string;
}

export interface TransferAssetData {
  toEmployeeId: string;
  notes?: string;
}

export interface UpdateAssetStatusData {
  status: string;
  notes?: string;
}

export interface BulkUpdateAssetsData {
  assetIds: string[];
  status?: string;
  condition?: string;
  location?: string;
  notes?: string;
}

// API Functions
export const listAssets = async (params?: ListAssetsParams) => {
  const response = await api.get("/assets", { params });
  return response.data;
};

export const getAsset = async (id: string): Promise<Asset> => {
  const response = await api.get(`/assets/${id}`);
  return response.data;
};

export const createAsset = async (data: CreateAssetData): Promise<Asset> => {
  const response = await api.post("/assets", data);
  return response.data;
};

export const updateAsset = async (id: string, data: UpdateAssetData): Promise<Asset> => {
  const response = await api.put(`/assets/${id}`, data);
  return response.data;
};

export const deleteAsset = async (id: string): Promise<void> => {
  await api.delete(`/assets/${id}`);
};

export const assignAsset = async (id: string, data: AssignAssetData): Promise<Asset> => {
  const response = await api.post(`/assets/${id}/assign`, data);
  return response.data;
};

export const revokeAsset = async (id: string, notes?: string): Promise<Asset> => {
  const response = await api.post(`/assets/${id}/revoke`, { notes });
  return response.data;
};

export const transferAsset = async (id: string, data: TransferAssetData): Promise<Asset> => {
  const response = await api.post(`/assets/${id}/transfer`, data);
  return response.data;
};

export const updateAssetStatus = async (id: string, data: UpdateAssetStatusData): Promise<Asset> => {
  const response = await api.put(`/assets/${id}/status`, data);
  return response.data;
};

export const getAssetStats = async (params?: AssetStatsParams): Promise<AssetStats> => {
  const response = await api.get("/assets/stats", { params });
  return response.data;
};

export const getAssetHistory = async (params?: AssetHistoryParams) => {
  const response = await api.get("/assets/history", { params });
  return response.data;
};

export const bulkUpdateAssets = async (data: BulkUpdateAssetsData) => {
  const response = await api.put("/assets/bulk/update", data);
  return response.data;
};

// Helper functions
export const getStatusColor = (status: string): string => {
  switch (status) {
    case "AVAILABLE":
      return "bg-green-100 text-green-800";
    case "ASSIGNED":
      return "bg-blue-100 text-blue-800";
    case "MAINTENANCE":
      return "bg-yellow-100 text-yellow-800";
    case "RETIRED":
      return "bg-gray-100 text-gray-800";
    case "LOST":
      return "bg-red-100 text-red-800";
    case "DAMAGED":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const getConditionColor = (condition: string): string => {
  switch (condition) {
    case "EXCELLENT":
      return "bg-green-100 text-green-800";
    case "GOOD":
      return "bg-blue-100 text-blue-800";
    case "FAIR":
      return "bg-yellow-100 text-yellow-800";
    case "POOR":
      return "bg-orange-100 text-orange-800";
    case "DAMAGED":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const getStatusLabel = (status: string): string => {
  switch (status) {
    case "AVAILABLE":
      return "Available";
    case "ASSIGNED":
      return "Assigned";
    case "MAINTENANCE":
      return "Maintenance";
    case "RETIRED":
      return "Retired";
    case "LOST":
      return "Lost";
    case "DAMAGED":
      return "Damaged";
    default:
      return status;
  }
};

export const getConditionLabel = (condition: string): string => {
  switch (condition) {
    case "EXCELLENT":
      return "Excellent";
    case "GOOD":
      return "Good";
    case "FAIR":
      return "Fair";
    case "POOR":
      return "Poor";
    case "DAMAGED":
      return "Damaged";
    default:
      return condition;
  }
};

export const getCategoryLabel = (category: string): string => {
  switch (category) {
    case "LAPTOP":
      return "Laptop";
    case "DESKTOP":
      return "Desktop";
    case "MONITOR":
      return "Monitor";
    case "KEYBOARD":
      return "Keyboard";
    case "MOUSE":
      return "Mouse";
    case "PHONE":
      return "Phone";
    case "TABLET":
      return "Tablet";
    case "HEADSET":
      return "Headset";
    case "PRINTER":
      return "Printer";
    case "NETWORK_EQUIPMENT":
      return "Network Equipment";
    case "OTHER":
      return "Other";
    default:
      return category;
  }
};

export const getActionLabel = (action: string): string => {
  switch (action) {
    case "CREATED":
      return "Created";
    case "ASSIGNED":
      return "Assigned";
    case "REVOKED":
      return "Revoked";
    case "TRANSFERRED":
      return "Transferred";
    case "MAINTENANCE_STARTED":
      return "Maintenance Started";
    case "MAINTENANCE_COMPLETED":
      return "Maintenance Completed";
    case "STATUS_CHANGED":
      return "Status Changed";
    case "CONDITION_UPDATED":
      return "Condition Updated";
    case "RETIRED":
      return "Retired";
    case "LOST":
      return "Lost";
    case "FOUND":
      return "Found";
    default:
      return action;
  }
};

export const formatCurrency = (value: number | string): string => {
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(numValue);
};

export const getAssetIcon = (category: string): string => {
  switch (category) {
    case "LAPTOP":
      return "💻";
    case "DESKTOP":
      return "🖥️";
    case "MONITOR":
      return "🖥️";
    case "KEYBOARD":
      return "⌨️";
    case "MOUSE":
      return "🖱️";
    case "PHONE":
      return "📱";
    case "TABLET":
      return "📱";
    case "HEADSET":
      return "🎧";
    case "PRINTER":
      return "🖨️";
    case "NETWORK_EQUIPMENT":
      return "🌐";
    case "OTHER":
      return "📦";
    default:
      return "📦";
  }
};
