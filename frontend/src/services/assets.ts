import api from "./api";

// Types
<<<<<<< HEAD
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
=======
export interface AssetCategory {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    assets: number;
  };
}

export interface AssetLocation {
  id: string;
  name: string;
  address?: string;
  type: "STORE" | "BRANCH" | "OFFICE";
  createdAt: string;
  updatedAt: string;
  _count?: {
    assets: number;
  };
}

export interface AssetVendor {
  id: string;
  name: string;
  contact?: string;
  phone?: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    assets: number;
    maintenance: number;
  };
}

export interface Asset {
  id: string;
  assetCode: string;
  name: string;
  categoryId: string;
  category?: AssetCategory;
  brand?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: string;
  purchasePrice?: number | string;
  currency: string;
  vendorId?: string;
  vendor?: AssetVendor;
  warrantyUntil?: string;
  locationId?: string;
  location?: AssetLocation;
  assignedToEmployeeId?: string;
  departmentId?: string;
  department?: {
    id: string;
    name: string;
  };
  condition: "NEW" | "GOOD" | "NEEDS_REPAIR" | "RETIRED";
  status: "IN_STOCK" | "ASSIGNED" | "IN_MAINTENANCE" | "DISPOSED";
  depreciationMethod?: "STRAIGHT_LINE" | "DECLINING_BALANCE";
  depreciationRate?: number | string;
  lifeYears?: number | string;
  notes?: string;
  createdBy: string;
  createdByUser?: {
    id: string;
    firstName: string;
    lastName: string;
  };
>>>>>>> dev
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
<<<<<<< HEAD
=======
  assignments?: AssetAssignment[];
  maintenance?: AssetMaintenance[];
  depreciation?: AssetDepreciation[];
  disposals?: AssetDisposal[];
  history?: AssetHistory[];
  auditLogs?: AssetAuditLog[];
  _count?: {
    history: number;
    assignments: number;
    maintenance: number;
  };
}

export interface AssetAssignment {
  id: string;
  assetId: string;
  employeeId: string;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    employeeCode: string;
  };
  assignedAt: string;
  assignedBy: string;
>>>>>>> dev
  assignedByUser?: {
    id: string;
    firstName: string;
    lastName: string;
  };
<<<<<<< HEAD
  _count?: {
    history: number;
  };
=======
  returnedAt?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssetMaintenance {
  id: string;
  assetId: string;
  asset?: {
    id: string;
    name: string;
    assetCode: string;
  };
  date: string;
  type: "PREVENTIVE" | "CORRECTIVE";
  vendorId?: string;
  vendor?: AssetVendor;
  cost?: number | string;
  performedBy?: string;
  performedByEmployee?: {
    id: string;
    firstName: string;
    lastName: string;
    employeeCode: string;
  };
  nextDueDate?: string;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssetDisposal {
  id: string;
  assetId: string;
  asset?: {
    id: string;
    name: string;
    assetCode: string;
  };
  disposalDate: string;
  method: "SALE" | "DONATION" | "SCRAP" | "TRANSFER" | "OTHER";
  saleAmount?: number | string;
  notes?: string;
  approvedBy?: string;
  approvedByUser?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AssetDepreciation {
  id: string;
  assetId: string;
  asset?: {
    id: string;
    name: string;
    assetCode: string;
  };
  year: number;
  month?: number;
  depreciationAmount: number | string;
  accumulatedDepr: number | string;
  bookValue: number | string;
  createdAt: string;
>>>>>>> dev
}

export interface AssetHistory {
  id: string;
  assetId: string;
<<<<<<< HEAD
  action: "CREATED" | "ASSIGNED" | "REVOKED" | "TRANSFERRED" | "MAINTENANCE_STARTED" | "MAINTENANCE_COMPLETED" | "STATUS_CHANGED" | "CONDITION_UPDATED" | "RETIRED" | "LOST" | "FOUND";
=======
  action: "CREATED" | "ASSIGNED" | "REVOKED" | "TRANSFERRED" | "MAINTENANCE_STARTED" | "MAINTENANCE_COMPLETED" | "STATUS_CHANGED" | "CONDITION_UPDATED" | "RETIRED" | "DISPOSED";
>>>>>>> dev
  description?: string;
  fromEmployeeId?: string;
  toEmployeeId?: string;
  previousStatus?: string;
  newStatus?: string;
  previousCondition?: string;
  newCondition?: string;
  performedBy: string;
<<<<<<< HEAD
  createdAt: string;
  asset?: {
    id: string;
    name: string;
    serialNumber: string;
=======
  performedByUser?: {
    id: string;
    firstName: string;
    lastName: string;
>>>>>>> dev
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
<<<<<<< HEAD
  performedByUser?: {
=======
  createdAt: string;
}

export interface AssetAuditLog {
  id: string;
  assetId: string;
  changedBy: string;
  changedByUser?: {
>>>>>>> dev
    id: string;
    firstName: string;
    lastName: string;
  };
<<<<<<< HEAD
=======
  changeSummary: string;
  timestamp: string;
>>>>>>> dev
}

export interface AssetStats {
  totalAssets: number;
  totalValue: number;
  averageValue: number;
<<<<<<< HEAD
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
=======
  assignedCount: number;
  maintenanceCount: number;
  disposedCount: number;
  statusBreakdown: Record<string, number>;
  conditionBreakdown: Record<string, number>;
  categoryBreakdown: Record<string, number>;
  locationBreakdown: Record<string, number>;
}

// Parameter Interfaces
export interface ListAssetsParams {
  search?: string;
  categoryId?: string;
  status?: string;
  condition?: string;
  locationId?: string;
  departmentId?: string;
  assignedToEmployeeId?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "name" | "assetCode" | "categoryId" | "status" | "condition" | "purchaseDate" | "createdAt";
>>>>>>> dev
  sortOrder?: "asc" | "desc";
}

export interface AssetStatsParams {
<<<<<<< HEAD
  category?: string;
  location?: string;
=======
  categoryId?: string;
  locationId?: string;
  departmentId?: string;
>>>>>>> dev
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
<<<<<<< HEAD
  category: string;
  serialNumber: string;
  model?: string;
  brand?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  currentValue?: number;
  condition?: string;
  location?: string;
=======
  categoryId: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  currency?: string;
  vendorId?: string;
  warrantyUntil?: string;
  locationId?: string;
  departmentId?: string;
  condition?: "NEW" | "GOOD" | "NEEDS_REPAIR" | "RETIRED";
  depreciationMethod?: "STRAIGHT_LINE" | "DECLINING_BALANCE";
  depreciationRate?: number;
  lifeYears?: number;
>>>>>>> dev
  notes?: string;
}

export interface UpdateAssetData {
  name?: string;
<<<<<<< HEAD
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
=======
  categoryId?: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  currency?: string;
  vendorId?: string;
  warrantyUntil?: string;
  locationId?: string;
  departmentId?: string;
  condition?: "NEW" | "GOOD" | "NEEDS_REPAIR" | "RETIRED";
  status?: "IN_STOCK" | "ASSIGNED" | "IN_MAINTENANCE" | "DISPOSED";
  depreciationMethod?: "STRAIGHT_LINE" | "DECLINING_BALANCE";
  depreciationRate?: number;
  lifeYears?: number;
>>>>>>> dev
  notes?: string;
}

export interface AssignAssetData {
  employeeId: string;
<<<<<<< HEAD
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
=======
  note?: string;
}

export interface ReturnAssetData {
  note?: string;
}

export interface CreateAssetMaintenanceData {
  date: string;
  type: "PREVENTIVE" | "CORRECTIVE";
  vendorId?: string;
  cost?: number;
  performedBy?: string;
  nextDueDate?: string;
  status?: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  notes?: string;
}

export interface CreateAssetDisposalData {
  disposalDate: string;
  method: "SALE" | "DONATION" | "SCRAP" | "TRANSFER" | "OTHER";
  saleAmount?: number;
  notes?: string;
}

export interface RunDepreciationParams {
  year: number;
  month?: number;
}

// Asset CRUD API Functions
export const listAssets = async (params?: ListAssetsParams) => {
  const response = await api.get("/assets", { params });
  return response.data as { items: Asset[]; total: number; page: number; pageSize: number; totalPages: number };
>>>>>>> dev
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

<<<<<<< HEAD
=======
// Asset Assignment API Functions
>>>>>>> dev
export const assignAsset = async (id: string, data: AssignAssetData): Promise<Asset> => {
  const response = await api.post(`/assets/${id}/assign`, data);
  return response.data;
};

<<<<<<< HEAD
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

=======
export const returnAsset = async (id: string, data?: ReturnAssetData): Promise<Asset> => {
  const response = await api.post(`/assets/${id}/return`, data || {});
  return response.data;
};

// Asset Category API Functions
export const listAssetCategories = async (): Promise<AssetCategory[]> => {
  const response = await api.get("/assets/categories/all");
  return response.data;
};

export const getAssetCategory = async (id: string): Promise<AssetCategory> => {
  const response = await api.get(`/assets/categories/${id}`);
  return response.data;
};

export const createAssetCategory = async (data: { name: string; description?: string }): Promise<AssetCategory> => {
  const response = await api.post("/assets/categories", data);
  return response.data;
};

export const updateAssetCategory = async (id: string, data: { name?: string; description?: string }): Promise<AssetCategory> => {
  const response = await api.put(`/assets/categories/${id}`, data);
  return response.data;
};

export const deleteAssetCategory = async (id: string): Promise<void> => {
  await api.delete(`/assets/categories/${id}`);
};

// Asset Location API Functions
export const listAssetLocations = async (): Promise<AssetLocation[]> => {
  const response = await api.get("/assets/locations/all");
  return response.data;
};

export const getAssetLocation = async (id: string): Promise<AssetLocation> => {
  const response = await api.get(`/assets/locations/${id}`);
  return response.data;
};

export const createAssetLocation = async (data: { name: string; address?: string; type: "STORE" | "BRANCH" | "OFFICE" }): Promise<AssetLocation> => {
  const response = await api.post("/assets/locations", data);
  return response.data;
};

export const updateAssetLocation = async (id: string, data: { name?: string; address?: string; type?: "STORE" | "BRANCH" | "OFFICE" }): Promise<AssetLocation> => {
  const response = await api.put(`/assets/locations/${id}`, data);
  return response.data;
};

export const deleteAssetLocation = async (id: string): Promise<void> => {
  await api.delete(`/assets/locations/${id}`);
};

// Asset Vendor API Functions
export const listAssetVendors = async (params?: { page?: number; pageSize?: number; search?: string }) => {
  const response = await api.get("/assets/vendors", { params });
  return response.data as { items: AssetVendor[]; total: number; page: number; pageSize: number; totalPages: number };
};

export const getAssetVendor = async (id: string): Promise<AssetVendor> => {
  const response = await api.get(`/assets/vendors/${id}`);
  return response.data;
};

export const createAssetVendor = async (data: { name: string; contact?: string; phone?: string; email?: string }): Promise<AssetVendor> => {
  const response = await api.post("/assets/vendors", data);
  return response.data;
};

export const updateAssetVendor = async (id: string, data: { name?: string; contact?: string; phone?: string; email?: string }): Promise<AssetVendor> => {
  const response = await api.put(`/assets/vendors/${id}`, data);
  return response.data;
};

export const deleteAssetVendor = async (id: string): Promise<void> => {
  await api.delete(`/assets/vendors/${id}`);
};

// Asset Maintenance API Functions
export const listAssetMaintenance = async (params?: { assetId?: string; page?: number; pageSize?: number }) => {
  const response = await api.get("/assets/maintenance", { params });
  return response.data as { items: AssetMaintenance[]; total: number; page: number; pageSize: number; totalPages: number };
};

export const getAssetMaintenance = async (id: string): Promise<AssetMaintenance> => {
  const response = await api.get(`/assets/maintenance/${id}`);
  return response.data;
};

export const createAssetMaintenance = async (assetId: string, data: CreateAssetMaintenanceData): Promise<AssetMaintenance> => {
  const response = await api.post(`/assets/${assetId}/maintenance`, data);
  return response.data;
};

export const updateAssetMaintenance = async (id: string, data: Partial<CreateAssetMaintenanceData>): Promise<AssetMaintenance> => {
  const response = await api.put(`/assets/maintenance/${id}`, data);
  return response.data;
};

export const deleteAssetMaintenance = async (id: string): Promise<void> => {
  await api.delete(`/assets/maintenance/${id}`);
};

// Asset Disposal API Functions
export const listAssetDisposals = async (params?: { assetId?: string; page?: number; pageSize?: number }) => {
  const response = await api.get("/assets/disposals", { params });
  return response.data as { items: AssetDisposal[]; total: number; page: number; pageSize: number; totalPages: number };
};

export const getAssetDisposal = async (id: string): Promise<AssetDisposal> => {
  const response = await api.get(`/assets/disposals/${id}`);
  return response.data;
};

export const createAssetDisposal = async (assetId: string, data: CreateAssetDisposalData): Promise<AssetDisposal> => {
  const response = await api.post(`/assets/${assetId}/dispose`, data);
  return response.data;
};

// Asset Depreciation API Functions
export const listAssetDepreciation = async (params?: { assetId?: string; year?: number; page?: number; pageSize?: number }) => {
  const response = await api.get("/assets/depreciation", { params });
  return response.data as { items: AssetDepreciation[]; total: number; page: number; pageSize: number; totalPages: number };
};

export const getAssetDepreciation = async (id: string): Promise<AssetDepreciation> => {
  const response = await api.get(`/assets/depreciation/${id}`);
  return response.data;
};

export const runDepreciation = async (params: RunDepreciationParams) => {
  const response = await api.post("/assets/depreciation/run", null, { params });
  return response.data as {
    success: boolean;
    processed: number;
    failed: number;
    results: Array<{ assetId: string; assetCode: string; depreciationRecord: AssetDepreciation }>;
    errors: Array<{ assetId: string; assetCode: string; error: string }>;
  };
};

// Asset Stats and History API Functions
>>>>>>> dev
export const getAssetStats = async (params?: AssetStatsParams): Promise<AssetStats> => {
  const response = await api.get("/assets/stats", { params });
  return response.data;
};

export const getAssetHistory = async (params?: AssetHistoryParams) => {
  const response = await api.get("/assets/history", { params });
<<<<<<< HEAD
  return response.data;
};

export const bulkUpdateAssets = async (data: BulkUpdateAssetsData) => {
=======
  return response.data as { items: AssetHistory[]; total: number; page: number; pageSize: number; totalPages: number };
};

export const bulkUpdateAssets = async (data: { assetIds: string[]; status?: string; condition?: string; locationId?: string; notes?: string }) => {
>>>>>>> dev
  const response = await api.put("/assets/bulk/update", data);
  return response.data;
};

// Helper functions
export const getStatusColor = (status: string): string => {
  switch (status) {
<<<<<<< HEAD
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
=======
    case "IN_STOCK":
      return "bg-green-100 text-green-800";
    case "ASSIGNED":
      return "bg-blue-100 text-blue-800";
    case "IN_MAINTENANCE":
      return "bg-yellow-100 text-yellow-800";
    case "DISPOSED":
      return "bg-gray-100 text-gray-800";
>>>>>>> dev
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const getConditionColor = (condition: string): string => {
  switch (condition) {
<<<<<<< HEAD
    case "EXCELLENT":
      return "bg-green-100 text-green-800";
    case "GOOD":
      return "bg-blue-100 text-blue-800";
    case "FAIR":
      return "bg-yellow-100 text-yellow-800";
    case "POOR":
      return "bg-orange-100 text-orange-800";
    case "DAMAGED":
=======
    case "NEW":
      return "bg-green-100 text-green-800";
    case "GOOD":
      return "bg-blue-100 text-blue-800";
    case "NEEDS_REPAIR":
      return "bg-yellow-100 text-yellow-800";
    case "RETIRED":
>>>>>>> dev
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const getStatusLabel = (status: string): string => {
  switch (status) {
<<<<<<< HEAD
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
=======
    case "IN_STOCK":
      return "In Stock";
    case "ASSIGNED":
      return "Assigned";
    case "IN_MAINTENANCE":
      return "In Maintenance";
    case "DISPOSED":
      return "Disposed";
>>>>>>> dev
    default:
      return status;
  }
};

export const getConditionLabel = (condition: string): string => {
  switch (condition) {
<<<<<<< HEAD
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
=======
    case "NEW":
      return "New";
    case "GOOD":
      return "Good";
    case "NEEDS_REPAIR":
      return "Needs Repair";
    case "RETIRED":
      return "Retired";
>>>>>>> dev
    default:
      return condition;
  }
};

<<<<<<< HEAD
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
=======
export const formatCurrency = (value: number | string, currency: string = "USD"): string => {
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(numValue)) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(numValue);
>>>>>>> dev
};

export const getActionLabel = (action: string): string => {
  switch (action) {
    case "CREATED":
      return "Created";
    case "ASSIGNED":
      return "Assigned";
    case "REVOKED":
<<<<<<< HEAD
      return "Revoked";
=======
      return "Returned";
>>>>>>> dev
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
<<<<<<< HEAD
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
=======
    case "DISPOSED":
      return "Disposed";
    default:
      return action;
  }
};
>>>>>>> dev
