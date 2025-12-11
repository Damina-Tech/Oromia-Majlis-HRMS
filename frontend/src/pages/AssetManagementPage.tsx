import React, { useState, useEffect } from "react";
<<<<<<< HEAD
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
=======
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
>>>>>>> dev
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
<<<<<<< HEAD
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
=======
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
>>>>>>> dev
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
<<<<<<< HEAD
import { Textarea } from "@/components/ui/textarea";
import {
  Laptop,
  Smartphone,
  Monitor,
  Keyboard,
  Mouse,
  Headphones,
=======
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
>>>>>>> dev
  Plus,
  Search,
  MoreHorizontal,
  User,
  Calendar,
  History,
  AlertCircle,
  CheckCircle2,
  Loader2,
  XCircle,
<<<<<<< HEAD
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  listAssets,
  createAsset,
  assignAsset,
  revokeAsset,
  updateAssetStatus,
  deleteAsset,
  getAssetStats,
  getAssetHistory,
=======
  Eye,
  Edit,
  Trash2,
  Archive,
  Wrench,
  TrendingUp,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  listAssets,
  getAsset,
  createAsset,
  updateAsset,
  assignAsset,
  returnAsset,
  deleteAsset,
  getAssetStats,
  getAssetHistory,
  listAssetCategories,
  listAssetLocations,
  listAssetVendors,
>>>>>>> dev
  getStatusColor,
  getConditionColor,
  getStatusLabel,
  getConditionLabel,
<<<<<<< HEAD
  getCategoryLabel,
  formatCurrency,
  type Asset,
  type AssetHistory,
  type CreateAssetData,
  type AssignAssetData,
} from "@/services/assets";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AssetManagementPage() {
  const { user } = useAuth();
  
  // State
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetHistory, setAssetHistory] = useState<AssetHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  
  // Dialog states
  const [addAssetDialog, setAddAssetDialog] = useState(false);
  const [assignDialog, setAssignDialog] = useState(false);
  const [historyDialog, setHistoryDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
=======
  formatCurrency,
  type Asset,
  type AssetHistory,
  type AssetCategory,
  type AssetLocation,
  type AssetVendor,
  type CreateAssetData,
  type AssignAssetData,
} from "@/services/assets";
import { listEmployees as fetchEmployees, type Employee } from "@/services/employees";
import { listDepartments as fetchDepartments, type Department } from "@/services/departments";
import AssetDetailDialog from "@/components/assets/AssetDetailDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";

export default function AssetManagementPage() {
  const { user, hasPermission } = useAuth();
  const navigate = useNavigate();
  const canView = hasPermission("assets.view");
  const canManage = hasPermission("assets.manage");

  // State
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState<any>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  
  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  
  // Dialog states
  const [addAssetDialog, setAddAssetDialog] = useState(false);
  const [editAssetDialog, setEditAssetDialog] = useState(false);
  const [assignDialog, setAssignDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [detailDialog, setDetailDialog] = useState(false);
>>>>>>> dev
  
  // Selected asset
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  
<<<<<<< HEAD
  // Form states
  const [assetForm, setAssetForm] = useState({
    name: "",
    category: "",
    serialNumber: "",
    model: "",
    brand: "",
    purchaseDate: "",
    purchasePrice: "",
    currentValue: "",
    location: "",
    condition: "EXCELLENT",
=======
  // Dropdown data
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [locations, setLocations] = useState<AssetLocation[]>([]);
  const [vendors, setVendors] = useState<AssetVendor[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  
  // Form states
  const [assetForm, setAssetForm] = useState<Partial<CreateAssetData> & { status?: string }>({
    name: "",
    categoryId: "",
    brand: "",
    model: "",
    serialNumber: "",
    purchaseDate: "",
    purchasePrice: undefined,
    currency: "USD",
    vendorId: "",
    warrantyUntil: "",
    locationId: "",
    departmentId: "",
    condition: "NEW",
    depreciationMethod: undefined,
    depreciationRate: undefined,
    lifeYears: undefined,
>>>>>>> dev
    notes: "",
  });
  
  const [assignForm, setAssignForm] = useState({
    employeeId: "",
<<<<<<< HEAD
    notes: "",
  });

  // Check permissions
  const canView = user?.permissions?.includes("assets.view");
  const canManage = user?.permissions?.includes("assets.manage");

  // Load assets
  useEffect(() => {
    if (canView) {
      loadAssets();
    } else {
      setLoading(false);
    }
  }, [canView]);

  const loadAssets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await listAssets({
        search: searchTerm || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        category: categoryFilter !== "all" ? categoryFilter : undefined,
        pageSize: 100,
      });
      
      setAssets(response.items || []);
    } catch (err: any) {
      console.error("Failed to load assets:", err);
      setError(err.response?.data?.message || "Failed to load assets");
      toast.error("Failed to load assets");
    } finally {
      setLoading(false);
    }
  };

=======
    note: "",
  });

  // Form validation errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [assignFormErrors, setAssignFormErrors] = useState<Record<string, string>>({});

  // Load initial data
  useEffect(() => {
    if (canView) {
      loadInitialData();
      loadAssets();
      loadStats();
    }
  }, [canView]);

>>>>>>> dev
  // Reload assets when filters change
  useEffect(() => {
    if (canView) {
      const timeoutId = setTimeout(() => {
        loadAssets();
<<<<<<< HEAD
      }, 500); // Debounce search
      return () => clearTimeout(timeoutId);
    }
  }, [searchTerm, statusFilter, categoryFilter]);

  const getAssetIcon = (category: string) => {
    const icons: Record<string, any> = {
      LAPTOP: Laptop,
      PHONE: Smartphone,
      MONITOR: Monitor,
      KEYBOARD: Keyboard,
      MOUSE: Mouse,
      HEADSET: Headphones,
      TABLET: Smartphone,
      DESKTOP: Monitor,
      PRINTER: AlertCircle,
      NETWORK_EQUIPMENT: AlertCircle,
      OTHER: AlertCircle,
    };
    const Icon = icons[category] || AlertCircle;
    return <Icon className="h-4 w-4" />;
  };

  const handleAddAsset = async () => {
    if (!assetForm.name || !assetForm.category || !assetForm.serialNumber) {
      toast.error("Please fill in all required fields");
=======
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [searchTerm, statusFilter, categoryFilter, locationFilter, departmentFilter, page]);

  const loadInitialData = async () => {
    try {
      const [cats, locs, emps, depts] = await Promise.all([
        listAssetCategories(),
        listAssetLocations(),
        fetchEmployees({ pageSize: 1000 }),
        fetchDepartments(),
      ]);
      setCategories(cats);
      setLocations(locs);
      setEmployees(emps.items);
      setDepartments(depts);
    } catch (err: any) {
      console.error("Failed to load initial data:", err);
    }
  };

  const loadVendors = async () => {
    try {
      const response = await listAssetVendors({ pageSize: 1000 });
      setVendors(response.items);
    } catch (err: any) {
      console.error("Failed to load vendors:", err);
    }
  };

  const loadAssets = async () => {
    try {
      setLoading(true);
      const response = await listAssets({
        search: searchTerm || undefined,
        status: statusFilter !== "all" ? statusFilter as any : undefined,
        categoryId: categoryFilter !== "all" ? categoryFilter : undefined,
        locationId: locationFilter !== "all" ? locationFilter : undefined,
        departmentId: departmentFilter !== "all" ? departmentFilter : undefined,
        page,
        pageSize,
      });
      setAssets(response.items || []);
      setTotal(response.total || 0);
    } catch (err: any) {
      console.error("Failed to load assets:", err);
      toast.error(err.response?.data?.message || "Failed to load assets");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await getAssetStats();
      setStats(statsData);
    } catch (err: any) {
      console.error("Failed to load stats:", err);
    }
  };

  const validateAssetForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!assetForm.name?.trim()) {
      errors.name = "Asset name is required";
    } else if (assetForm.name.trim().length < 2) {
      errors.name = "Asset name must be at least 2 characters";
    }
    
    if (!assetForm.categoryId) {
      errors.categoryId = "Category is required";
    }
    
    if (assetForm.purchasePrice !== undefined && assetForm.purchasePrice < 0) {
      errors.purchasePrice = "Purchase price cannot be negative";
    }
    
    if (assetForm.depreciationRate !== undefined) {
      if (assetForm.depreciationRate < 0 || assetForm.depreciationRate > 100) {
        errors.depreciationRate = "Depreciation rate must be between 0 and 100";
      }
    }
    
    if (assetForm.lifeYears !== undefined && assetForm.lifeYears <= 0) {
      errors.lifeYears = "Life years must be greater than 0";
    }

    if (assetForm.purchaseDate && assetForm.warrantyUntil) {
      const purchaseDate = new Date(assetForm.purchaseDate);
      const warrantyDate = new Date(assetForm.warrantyUntil);
      if (warrantyDate <= purchaseDate) {
        errors.warrantyUntil = "Warranty date must be after purchase date";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddAsset = async () => {
    if (!validateAssetForm()) {
      toast.error("Please fix the form errors");
>>>>>>> dev
      return;
    }

    try {
      setSubmitting(true);
<<<<<<< HEAD
      
      const assetData: CreateAssetData = {
        name: assetForm.name,
        category: assetForm.category,
        serialNumber: assetForm.serialNumber,
        model: assetForm.model || undefined,
        brand: assetForm.brand || undefined,
        purchaseDate: assetForm.purchaseDate || undefined,
        purchasePrice: assetForm.purchasePrice ? parseFloat(assetForm.purchasePrice) : undefined,
        currentValue: assetForm.currentValue ? parseFloat(assetForm.currentValue) : undefined,
        location: assetForm.location || undefined,
        condition: assetForm.condition,
        notes: assetForm.notes || undefined,
      };

      await createAsset(assetData);
      
      setAddAssetDialog(false);
      setAssetForm({
        name: "",
        category: "",
        serialNumber: "",
        model: "",
        brand: "",
        purchaseDate: "",
        purchasePrice: "",
        currentValue: "",
        location: "",
        condition: "EXCELLENT",
        notes: "",
      });
      
      await loadAssets();
      toast.success("Asset added successfully");
    } catch (err: any) {
      console.error("Failed to add asset:", err);
      toast.error(err.response?.data?.message || "Failed to add asset");
=======
      setFormErrors({});
      await createAsset(assetForm as CreateAssetData);
      setAddAssetDialog(false);
      resetAssetForm();
      await loadAssets();
      await loadStats();
      toast.success("Asset created successfully");
    } catch (err: any) {
      console.error("Failed to create asset:", err);
      const errorMessage = err.response?.data?.message || "Failed to create asset";
      toast.error(errorMessage);
      
      // Set field-specific errors if available
      if (err.response?.data?.errors) {
        setFormErrors(err.response.data.errors);
      }
>>>>>>> dev
    } finally {
      setSubmitting(false);
    }
  };

<<<<<<< HEAD
  const handleAssignAsset = async () => {
    if (!selectedAsset || !assignForm.employeeId) {
      toast.error("Please select an employee");
=======
  const handleEditAsset = async () => {
    if (!selectedAsset) return;
    
    if (!validateAssetForm()) {
      toast.error("Please fix the form errors");
      return;
    }

    try {
      setSubmitting(true);
      setFormErrors({});
      const updateData: any = { ...assetForm };
      if (updateData.status && typeof updateData.status === "string") {
        updateData.status = updateData.status as "IN_STOCK" | "ASSIGNED" | "IN_MAINTENANCE" | "DISPOSED";
      }
      await updateAsset(selectedAsset.id, updateData);
      setEditAssetDialog(false);
      resetAssetForm();
      setSelectedAsset(null);
      await loadAssets();
      await loadStats();
      toast.success("Asset updated successfully");
    } catch (err: any) {
      console.error("Failed to update asset:", err);
      const errorMessage = err.response?.data?.message || "Failed to update asset";
      toast.error(errorMessage);
      
      if (err.response?.data?.errors) {
        setFormErrors(err.response.data.errors);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const validateAssignForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!assignForm.employeeId) {
      errors.employeeId = "Please select an employee";
    }
    
    setAssignFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAssignAsset = async () => {
    if (!selectedAsset) return;
    
    if (!validateAssignForm()) {
      toast.error("Please fix the form errors");
>>>>>>> dev
      return;
    }

    try {
      setSubmitting(true);
<<<<<<< HEAD
      
      const assignData: AssignAssetData = {
        employeeId: assignForm.employeeId,
        notes: assignForm.notes || undefined,
      };

      await assignAsset(selectedAsset.id, assignData);
      
      setAssignDialog(false);
      setAssignForm({ employeeId: "", notes: "" });
      setSelectedAsset(null);
      
      await loadAssets();
      toast.success("Asset assigned successfully");
    } catch (err: any) {
      console.error("Failed to assign asset:", err);
      toast.error(err.response?.data?.message || "Failed to assign asset");
=======
      setAssignFormErrors({});
      await assignAsset(selectedAsset.id, assignForm);
      setAssignDialog(false);
      setAssignForm({ employeeId: "", note: "" });
      setSelectedAsset(null);
      await loadAssets();
      await loadStats();
      toast.success("Asset assigned successfully");
    } catch (err: any) {
      console.error("Failed to assign asset:", err);
      const errorMessage = err.response?.data?.message || "Failed to assign asset";
      toast.error(errorMessage);
      
      if (err.response?.data?.errors) {
        setAssignFormErrors(err.response.data.errors);
      }
>>>>>>> dev
    } finally {
      setSubmitting(false);
    }
  };

<<<<<<< HEAD
  const handleRevokeAsset = async (asset: Asset) => {
    try {
      setSubmitting(true);
      
      await revokeAsset(asset.id, "Asset returned by employee");
      
      await loadAssets();
      toast.success("Asset assignment revoked successfully");
    } catch (err: any) {
      console.error("Failed to revoke asset:", err);
      toast.error(err.response?.data?.message || "Failed to revoke asset assignment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (asset: Asset, status: string) => {
    try {
      setSubmitting(true);
      
      await updateAssetStatus(asset.id, { status, notes: `Status updated to ${status}` });
      
      await loadAssets();
      toast.success("Asset status updated successfully");
    } catch (err: any) {
      console.error("Failed to update asset status:", err);
      toast.error(err.response?.data?.message || "Failed to update asset status");
=======
  const handleReturnAsset = async (asset: Asset) => {
    try {
      setSubmitting(true);
      await returnAsset(asset.id);
      await loadAssets();
      await loadStats();
      toast.success("Asset returned successfully");
    } catch (err: any) {
      console.error("Failed to return asset:", err);
      toast.error(err.response?.data?.message || "Failed to return asset");
>>>>>>> dev
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAsset = async () => {
    if (!selectedAsset) return;

    try {
      setSubmitting(true);
<<<<<<< HEAD
      
      await deleteAsset(selectedAsset.id);
      
      setDeleteDialog(false);
      setSelectedAsset(null);
      
      await loadAssets();
=======
      await deleteAsset(selectedAsset.id);
      setDeleteDialog(false);
      setSelectedAsset(null);
      await loadAssets();
      await loadStats();
>>>>>>> dev
      toast.success("Asset deleted successfully");
    } catch (err: any) {
      console.error("Failed to delete asset:", err);
      toast.error(err.response?.data?.message || "Failed to delete asset");
    } finally {
      setSubmitting(false);
    }
  };

<<<<<<< HEAD
  const showAssetHistory = async (asset: Asset) => {
    try {
      setSelectedAsset(asset);
      setHistoryDialog(true);
      
      const response = await getAssetHistory({ assetId: asset.id });
      setAssetHistory(response.items || []);
    } catch (err: any) {
      console.error("Failed to load asset history:", err);
      toast.error("Failed to load asset history");
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading assets...</span>
=======
  const openEditDialog = (asset: Asset) => {
    setSelectedAsset(asset);
    setAssetForm({
      name: asset.name,
      categoryId: asset.categoryId,
      brand: asset.brand || "",
      model: asset.model || "",
      serialNumber: asset.serialNumber || "",
      purchaseDate: asset.purchaseDate || "",
      purchasePrice: typeof asset.purchasePrice === "string" ? parseFloat(asset.purchasePrice) : asset.purchasePrice,
      currency: asset.currency || "USD",
      vendorId: asset.vendorId || "",
      warrantyUntil: asset.warrantyUntil || "",
      locationId: asset.locationId || "",
      departmentId: asset.departmentId || "",
      condition: asset.condition,
      status: asset.status as any,
      depreciationMethod: asset.depreciationMethod,
      depreciationRate: typeof asset.depreciationRate === "string" ? parseFloat(asset.depreciationRate) : asset.depreciationRate,
      lifeYears: typeof asset.lifeYears === "string" ? parseFloat(asset.lifeYears) : asset.lifeYears,
      notes: asset.notes || "",
    });
    setEditAssetDialog(true);
  };

  const openDetailDialog = async (asset: Asset) => {
    try {
      const fullAsset = await getAsset(asset.id);
      setSelectedAsset(fullAsset);
      setDetailDialog(true);
    } catch (err: any) {
      toast.error("Failed to load asset details");
    }
  };

  const resetAssetForm = () => {
    setAssetForm({
      name: "",
      categoryId: "",
      brand: "",
      model: "",
      serialNumber: "",
      purchaseDate: "",
      purchasePrice: undefined,
      currency: "USD",
      vendorId: "",
      warrantyUntil: "",
      locationId: "",
      departmentId: "",
      condition: "NEW",
      depreciationMethod: undefined,
      depreciationRate: undefined,
      lifeYears: undefined,
      notes: "",
    });
    setFormErrors({});
  };

  if (loading && assets.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
>>>>>>> dev
      </div>
    );
  }

<<<<<<< HEAD
  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error Loading Assets</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadAssets}>Try Again</Button>
        </div>
      </div>
    );
  }

  // Show access denied state
  if (!canView) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
=======
  if (!canView) {
    return (
      <div className="flex items-center justify-center h-96">
>>>>>>> dev
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-gray-600">You don't have permission to view assets.</p>
        </div>
      </div>
    );
  }

<<<<<<< HEAD
  const stats = {
    total: assets.length,
    available: assets.filter((a) => a.status === "AVAILABLE").length,
    assigned: assets.filter((a) => a.status === "ASSIGNED").length,
    maintenance: assets.filter((a) => a.status === "MAINTENANCE").length,
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Asset Management
          </h1>
          <p className="text-muted-foreground">
            Track and manage company assets and equipment
          </p>
        </div>
        {canManage && (
          <Dialog open={addAssetDialog} onOpenChange={setAddAssetDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Asset
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Asset</DialogTitle>
                <DialogDescription>
                  Add a new asset to the company inventory
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Asset Name *</Label>
                  <Input
                    id="name"
                    value={assetForm.name}
                    onChange={(e) =>
                      setAssetForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="e.g., MacBook Pro 16\"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={assetForm.category}
                    onValueChange={(value) =>
                      setAssetForm((prev) => ({ ...prev, category: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LAPTOP">Laptop</SelectItem>
                      <SelectItem value="DESKTOP">Desktop</SelectItem>
                      <SelectItem value="PHONE">Phone</SelectItem>
                      <SelectItem value="TABLET">Tablet</SelectItem>
                      <SelectItem value="MONITOR">Monitor</SelectItem>
                      <SelectItem value="KEYBOARD">Keyboard</SelectItem>
                      <SelectItem value="MOUSE">Mouse</SelectItem>
                      <SelectItem value="HEADSET">Headset</SelectItem>
                      <SelectItem value="PRINTER">Printer</SelectItem>
                      <SelectItem value="NETWORK_EQUIPMENT">Network Equipment</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="serial">Serial Number *</Label>
                  <Input
                    id="serial"
                    value={assetForm.serialNumber}
                    onChange={(e) =>
                      setAssetForm((prev) => ({
                        ...prev,
                        serialNumber: e.target.value,
                      }))
                    }
                    placeholder="Unique serial number"
                  />
                </div>
                <div>
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    value={assetForm.model}
                    onChange={(e) =>
                      setAssetForm((prev) => ({ ...prev, model: e.target.value }))
                    }
                    placeholder="Device model"
                  />
                </div>
                <div>
                  <Label htmlFor="brand">Brand</Label>
                  <Input
                    id="brand"
                    value={assetForm.brand}
                    onChange={(e) =>
                      setAssetForm((prev) => ({ ...prev, brand: e.target.value }))
                    }
                    placeholder="Manufacturer"
                  />
                </div>
                <div>
                  <Label htmlFor="purchase-date">Purchase Date</Label>
                  <Input
                    id="purchase-date"
                    type="date"
                    value={assetForm.purchaseDate}
                    onChange={(e) =>
                      setAssetForm((prev) => ({
                        ...prev,
                        purchaseDate: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="price">Purchase Price</Label>
                  <Input
                    id="price"
                    type="number"
                    value={assetForm.purchasePrice}
                    onChange={(e) =>
                      setAssetForm((prev) => ({
                        ...prev,
                        purchasePrice: e.target.value,
                      }))
                    }
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="current-value">Current Value</Label>
                  <Input
                    id="current-value"
                    type="number"
                    value={assetForm.currentValue}
                    onChange={(e) =>
                      setAssetForm((prev) => ({
                        ...prev,
                        currentValue: e.target.value,
                      }))
                    }
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={assetForm.location}
                    onChange={(e) =>
                      setAssetForm((prev) => ({
                        ...prev,
                        location: e.target.value,
                      }))
                    }
                    placeholder="Office location or storage"
                  />
                </div>
                <div>
                  <Label htmlFor="condition">Condition</Label>
                  <Select
                    value={assetForm.condition}
                    onValueChange={(value) =>
                      setAssetForm((prev) => ({ ...prev, condition: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EXCELLENT">Excellent</SelectItem>
                      <SelectItem value="GOOD">Good</SelectItem>
                      <SelectItem value="FAIR">Fair</SelectItem>
                      <SelectItem value="POOR">Poor</SelectItem>
                      <SelectItem value="DAMAGED">Damaged</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={assetForm.notes}
                    onChange={(e) =>
                      setAssetForm((prev) => ({ ...prev, notes: e.target.value }))
                    }
                    placeholder="Additional information about the asset"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setAddAssetDialog(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddAsset} disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Asset"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
=======
  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Asset Management</h1>
          <p className="text-gray-600 mt-1">Track and manage company assets and equipment</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/assets/dashboard")}>
            <TrendingUp className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
          <Button variant="outline" onClick={() => navigate("/assets/reports")}>
            <FileText className="h-4 w-4 mr-2" />
            Reports
          </Button>
          {canManage && (
            <Button onClick={() => { resetAssetForm(); setAddAssetDialog(true); loadVendors(); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Asset
            </Button>
          )}
        </div>
>>>>>>> dev
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
<<<<<<< HEAD
            <Laptop className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.available}
            </div>
=======
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalAssets || 0}</div>
            <p className="text-xs text-muted-foreground">Total inventory value: {formatCurrency(stats?.totalValue || 0)}</p>
>>>>>>> dev
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned</CardTitle>
            <User className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
<<<<<<< HEAD
            <div className="text-2xl font-bold text-blue-600">
              {stats.assigned}
            </div>
=======
            <div className="text-2xl font-bold text-blue-600">{stats?.assignedCount || 0}</div>
            <p className="text-xs text-muted-foreground">Currently in use</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Stock</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.statusBreakdown?.["in_stock"] || 0}
            </div>
            <p className="text-xs text-muted-foreground">Available for assignment</p>
>>>>>>> dev
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
<<<<<<< HEAD
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.maintenance}
            </div>
=======
            <Wrench className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats?.maintenanceCount || 0}</div>
            <p className="text-xs text-muted-foreground">Under maintenance</p>
>>>>>>> dev
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
<<<<<<< HEAD
          <CardTitle>Asset Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
=======
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
>>>>>>> dev
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search assets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
<<<<<<< HEAD
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="AVAILABLE">Available</SelectItem>
                <SelectItem value="ASSIGNED">Assigned</SelectItem>
                <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                <SelectItem value="RETIRED">Retired</SelectItem>
                <SelectItem value="LOST">Lost</SelectItem>
                <SelectItem value="DAMAGED">Damaged</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="LAPTOP">Laptop</SelectItem>
                <SelectItem value="DESKTOP">Desktop</SelectItem>
                <SelectItem value="PHONE">Phone</SelectItem>
                <SelectItem value="TABLET">Tablet</SelectItem>
                <SelectItem value="MONITOR">Monitor</SelectItem>
                <SelectItem value="KEYBOARD">Keyboard</SelectItem>
                <SelectItem value="MOUSE">Mouse</SelectItem>
                <SelectItem value="HEADSET">Headset</SelectItem>
                <SelectItem value="PRINTER">Printer</SelectItem>
                <SelectItem value="NETWORK_EQUIPMENT">Network Equipment</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Serial Number</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="text-center">
                      <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Assets Found</h3>
                      <p className="text-muted-foreground mb-4">
                        {searchTerm || statusFilter !== "all" || categoryFilter !== "all"
                          ? "No assets match your current filters."
                          : "You haven't added any assets yet."}
                      </p>
                      {canManage && (
                        <Button onClick={() => setAddAssetDialog(true)}>
                          <Plus className="mr-2 h-4 w-4" />
                          Add First Asset
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                assets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getAssetIcon(asset.category)}
=======
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="IN_STOCK">In Stock</SelectItem>
                <SelectItem value="ASSIGNED">Assigned</SelectItem>
                <SelectItem value="IN_MAINTENANCE">In Maintenance</SelectItem>
                <SelectItem value="DISPOSED">Disposed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(statusFilter !== "all" || categoryFilter !== "all" || locationFilter !== "all" || departmentFilter !== "all" || searchTerm) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStatusFilter("all");
                  setCategoryFilter("all");
                  setLocationFilter("all");
                  setDepartmentFilter("all");
                  setSearchTerm("");
                }}
                className="whitespace-nowrap"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Assets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Asset Inventory</CardTitle>
          <CardDescription>Manage and track all company assets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[120px]">Asset Code</TableHead>
                  <TableHead className="min-w-[200px]">Name</TableHead>
                  <TableHead className="min-w-[120px]">Category</TableHead>
                  <TableHead className="min-w-[100px]">Status</TableHead>
                  <TableHead className="min-w-[150px]">Assigned To</TableHead>
                  <TableHead className="min-w-[120px]">Location</TableHead>
                  <TableHead className="min-w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="text-center">
                        <Archive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Assets Found</h3>
                        <p className="text-muted-foreground mb-4">
                          {searchTerm || statusFilter !== "all" || categoryFilter !== "all"
                            ? "No assets match your current filters."
                            : "You haven't added any assets yet."}
                        </p>
                        {canManage && (
                          <Button onClick={() => { resetAssetForm(); setAddAssetDialog(true); loadVendors(); }}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add First Asset
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  assets.map((asset) => (
                    <TableRow key={asset.id}>
                      <TableCell className="font-mono text-sm">{asset.assetCode}</TableCell>
                      <TableCell>
>>>>>>> dev
                        <div>
                          <div className="font-medium">{asset.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {asset.brand} {asset.model}
                          </div>
                        </div>
<<<<<<< HEAD
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {asset.serialNumber}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(asset.status)}>
                        {getStatusLabel(asset.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {asset.assignedEmployee ? (
                        <div>
                          <div className="font-medium">
                            {asset.assignedEmployee.firstName} {asset.assignedEmployee.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {asset.assignedEmployee.employeeCode}
                          </div>
                          {asset.assignedDate && (
                            <div className="text-xs text-muted-foreground">
                              Since {format(new Date(asset.assignedDate), "MMM dd, yyyy")}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getConditionColor(asset.condition)}>
                        {getConditionLabel(asset.condition)}
                      </Badge>
                    </TableCell>
                    <TableCell>{asset.location || "N/A"}</TableCell>
                    <TableCell>
                      {canManage && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {asset.status === "AVAILABLE" && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedAsset(asset);
                                  setAssignDialog(true);
                                }}
                              >
                                Assign to Employee
                              </DropdownMenuItem>
                            )}
                            {asset.status === "ASSIGNED" && (
                              <DropdownMenuItem
                                onClick={() => handleRevokeAsset(asset)}
                              >
                                Revoke Assignment
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() =>
                                handleUpdateStatus(asset, "MAINTENANCE")
                              }
                              disabled={asset.status === "MAINTENANCE"}
                            >
                              Mark as Maintenance
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => showAssetHistory(asset)}
                            >
                              <History className="mr-2 h-4 w-4" />
                              View History
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedAsset(asset);
                                setDeleteDialog(true);
                              }}
                              className="text-red-600"
                            >
                              Delete Asset
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

=======
                      </TableCell>
                      <TableCell>{asset.category?.name || "N/A"}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(asset.status)}>
                          {getStatusLabel(asset.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {asset.assignedEmployee ? (
                          <div>
                            <div className="font-medium">
                              {asset.assignedEmployee.firstName} {asset.assignedEmployee.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {asset.assignedEmployee.employeeCode}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>{asset.location?.name || "N/A"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDetailDialog(asset)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {canManage && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditDialog(asset)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                {asset.status === "IN_STOCK" && (
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedAsset(asset);
                                      setAssignDialog(true);
                                    }}
                                  >
                                    <User className="mr-2 h-4 w-4" />
                                    Assign to Employee
                                  </DropdownMenuItem>
                                )}
                                {asset.status === "ASSIGNED" && (
                                  <DropdownMenuItem onClick={() => handleReturnAsset(asset)}>
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Return Asset
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedAsset(asset);
                                    setDeleteDialog(true);
                                  }}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {total > pageSize && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total} assets
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page * pageSize >= total}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Asset Dialog */}
      <Dialog open={addAssetDialog} onOpenChange={setAddAssetDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Asset</DialogTitle>
            <DialogDescription>
              Add a new asset to the company inventory. Asset code will be auto-generated.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name">Asset Name *</Label>
              <Input
                id="name"
                value={assetForm.name}
                onChange={(e) => {
                  setAssetForm((prev) => ({ ...prev, name: e.target.value }));
                  if (formErrors.name) {
                    setFormErrors((prev) => ({ ...prev, name: "" }));
                  }
                }}
                placeholder="e.g., MacBook Pro 16-inch"
                className={formErrors.name ? "border-red-500" : ""}
              />
              {formErrors.name && (
                <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {formErrors.name}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select
                value={assetForm.categoryId}
                onValueChange={(value) => {
                  setAssetForm((prev) => ({ ...prev, categoryId: value }));
                  if (formErrors.categoryId) {
                    setFormErrors((prev) => ({ ...prev, categoryId: "" }));
                  }
                }}
              >
                <SelectTrigger className={formErrors.categoryId ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.categoryId && (
                <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {formErrors.categoryId}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="serial">Serial Number</Label>
              <Input
                id="serial"
                value={assetForm.serialNumber}
                onChange={(e) => setAssetForm((prev) => ({ ...prev, serialNumber: e.target.value }))}
                placeholder="Optional"
              />
            </div>
            <div>
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                value={assetForm.brand}
                onChange={(e) => setAssetForm((prev) => ({ ...prev, brand: e.target.value }))}
                placeholder="Manufacturer"
              />
            </div>
            <div>
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={assetForm.model}
                onChange={(e) => setAssetForm((prev) => ({ ...prev, model: e.target.value }))}
                placeholder="Device model"
              />
            </div>
            <div>
              <Label htmlFor="purchase-date">Purchase Date</Label>
              <Input
                id="purchase-date"
                type="date"
                value={assetForm.purchaseDate}
                onChange={(e) => setAssetForm((prev) => ({ ...prev, purchaseDate: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="price">Purchase Price</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={assetForm.purchasePrice || ""}
                onChange={(e) => {
                  const value = e.target.value ? parseFloat(e.target.value) : undefined;
                  setAssetForm((prev) => ({ ...prev, purchasePrice: value }));
                  if (formErrors.purchasePrice) {
                    setFormErrors((prev) => ({ ...prev, purchasePrice: "" }));
                  }
                }}
                placeholder="0.00"
                className={formErrors.purchasePrice ? "border-red-500" : ""}
              />
              {formErrors.purchasePrice && (
                <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {formErrors.purchasePrice}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={assetForm.currency}
                onValueChange={(value) => setAssetForm((prev) => ({ ...prev, currency: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="ETB">ETB</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="vendor">Vendor</Label>
              <Select
                value={assetForm.vendorId || ""}
                onValueChange={(value) => setAssetForm((prev) => ({ ...prev, vendorId: value || undefined }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {vendors.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="warranty">Warranty Until</Label>
              <Input
                id="warranty"
                type="date"
                value={assetForm.warrantyUntil}
                onChange={(e) => {
                  setAssetForm((prev) => ({ ...prev, warrantyUntil: e.target.value }));
                  if (formErrors.warrantyUntil) {
                    setFormErrors((prev) => ({ ...prev, warrantyUntil: "" }));
                  }
                }}
                min={assetForm.purchaseDate || undefined}
                className={formErrors.warrantyUntil ? "border-red-500" : ""}
              />
              {formErrors.warrantyUntil && (
                <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {formErrors.warrantyUntil}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Select
                value={assetForm.locationId || ""}
                onValueChange={(value) => setAssetForm((prev) => ({ ...prev, locationId: value || undefined }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="department">Department</Label>
              <Select
                value={assetForm.departmentId || ""}
                onValueChange={(value) => setAssetForm((prev) => ({ ...prev, departmentId: value || undefined }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="condition">Condition</Label>
              <Select
                value={assetForm.condition}
                onValueChange={(value: any) => setAssetForm((prev) => ({ ...prev, condition: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NEW">New</SelectItem>
                  <SelectItem value="GOOD">Good</SelectItem>
                  <SelectItem value="NEEDS_REPAIR">Needs Repair</SelectItem>
                  <SelectItem value="RETIRED">Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="depreciation-method">Depreciation Method</Label>
              <Select
                value={assetForm.depreciationMethod || ""}
                onValueChange={(value) => setAssetForm((prev) => ({ 
                  ...prev, 
                  depreciationMethod: value === "__none__" ? undefined : (value as "STRAIGHT_LINE" | "DECLINING_BALANCE" | undefined)
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  <SelectItem value="STRAIGHT_LINE">Straight Line</SelectItem>
                  <SelectItem value="DECLINING_BALANCE">Declining Balance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {assetForm.depreciationMethod && (
              <>
                <div>
                  <Label htmlFor="depreciation-rate">Depreciation Rate (%)</Label>
                  <Input
                    id="depreciation-rate"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={assetForm.depreciationRate || ""}
                    onChange={(e) => {
                      const value = e.target.value ? parseFloat(e.target.value) : undefined;
                      setAssetForm((prev) => ({ ...prev, depreciationRate: value }));
                      if (formErrors.depreciationRate) {
                        setFormErrors((prev) => ({ ...prev, depreciationRate: "" }));
                      }
                    }}
                    placeholder="e.g., 25"
                    className={formErrors.depreciationRate ? "border-red-500" : ""}
                  />
                  {formErrors.depreciationRate && (
                    <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {formErrors.depreciationRate}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="life-years">Life Years</Label>
                  <Input
                    id="life-years"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={assetForm.lifeYears || ""}
                    onChange={(e) => {
                      const value = e.target.value ? parseFloat(e.target.value) : undefined;
                      setAssetForm((prev) => ({ ...prev, lifeYears: value }));
                      if (formErrors.lifeYears) {
                        setFormErrors((prev) => ({ ...prev, lifeYears: "" }));
                      }
                    }}
                    placeholder="e.g., 4"
                    className={formErrors.lifeYears ? "border-red-500" : ""}
                  />
                  {formErrors.lifeYears && (
                    <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {formErrors.lifeYears}
                    </p>
                  )}
                </div>
              </>
            )}
            <div className="col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={assetForm.notes}
                onChange={(e) => setAssetForm((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional information about the asset"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddAssetDialog(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleAddAsset} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Asset"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Asset Dialog */}
      <Dialog open={editAssetDialog} onOpenChange={setEditAssetDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Asset</DialogTitle>
            <DialogDescription>
              Update asset information
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="edit-name">Asset Name *</Label>
              <Input
                id="edit-name"
                value={assetForm.name}
                onChange={(e) => setAssetForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="edit-category">Category *</Label>
              <Select
                value={assetForm.categoryId}
                onValueChange={(value) => setAssetForm((prev) => ({ ...prev, categoryId: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={assetForm.status || ""}
                onValueChange={(value: any) => setAssetForm((prev) => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IN_STOCK">In Stock</SelectItem>
                  <SelectItem value="ASSIGNED">Assigned</SelectItem>
                  <SelectItem value="IN_MAINTENANCE">In Maintenance</SelectItem>
                  <SelectItem value="DISPOSED">Disposed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-serial">Serial Number</Label>
              <Input
                id="edit-serial"
                value={assetForm.serialNumber}
                onChange={(e) => setAssetForm((prev) => ({ ...prev, serialNumber: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="edit-brand">Brand</Label>
              <Input
                id="edit-brand"
                value={assetForm.brand}
                onChange={(e) => setAssetForm((prev) => ({ ...prev, brand: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="edit-model">Model</Label>
              <Input
                id="edit-model"
                value={assetForm.model}
                onChange={(e) => setAssetForm((prev) => ({ ...prev, model: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="edit-purchase-date">Purchase Date</Label>
              <Input
                id="edit-purchase-date"
                type="date"
                value={assetForm.purchaseDate}
                onChange={(e) => setAssetForm((prev) => ({ ...prev, purchaseDate: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="edit-price">Purchase Price</Label>
              <Input
                id="edit-price"
                type="number"
                step="0.01"
                value={assetForm.purchasePrice || ""}
                onChange={(e) => setAssetForm((prev) => ({ ...prev, purchasePrice: e.target.value ? parseFloat(e.target.value) : undefined }))}
              />
            </div>
            <div>
              <Label htmlFor="edit-vendor">Vendor</Label>
              <Select
                value={assetForm.vendorId || ""}
                onValueChange={(value) => setAssetForm((prev) => ({ ...prev, vendorId: value || undefined }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {vendors.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-location">Location</Label>
              <Select
                value={assetForm.locationId || ""}
                onValueChange={(value) => setAssetForm((prev) => ({ ...prev, locationId: value || undefined }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-department">Department</Label>
              <Select
                value={assetForm.departmentId || ""}
                onValueChange={(value) => setAssetForm((prev) => ({ ...prev, departmentId: value || undefined }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-condition">Condition</Label>
              <Select
                value={assetForm.condition}
                onValueChange={(value: any) => setAssetForm((prev) => ({ ...prev, condition: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NEW">New</SelectItem>
                  <SelectItem value="GOOD">Good</SelectItem>
                  <SelectItem value="NEEDS_REPAIR">Needs Repair</SelectItem>
                  <SelectItem value="RETIRED">Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={assetForm.notes}
                onChange={(e) => setAssetForm((prev) => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditAssetDialog(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleEditAsset} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Asset"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

>>>>>>> dev
      {/* Assign Asset Dialog */}
      <Dialog open={assignDialog} onOpenChange={setAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Asset</DialogTitle>
            <DialogDescription>
              Assign {selectedAsset?.name} to an employee
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
<<<<<<< HEAD
              <Label htmlFor="employee">Employee</Label>
              <Select
                value={assignForm.employeeId}
                onValueChange={(value) => {
                  setAssignForm((prev) => ({
                    ...prev,
                    employeeId: value,
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="emp-001">
                    John Doe - Senior Developer
                  </SelectItem>
                  <SelectItem value="emp-002">
                    Jane Smith - HR Specialist
                  </SelectItem>
                  <SelectItem value="emp-003">
                    Alice Johnson - Frontend Developer
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="assign-notes">Notes (Optional)</Label>
              <Textarea
                id="assign-notes"
                value={assignForm.notes}
                onChange={(e) =>
                  setAssignForm((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Additional notes about this assignment"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setAssignDialog(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button onClick={handleAssignAsset} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  "Assign Asset"
                )}
              </Button>
            </div>
          </div>
=======
              <Label htmlFor="assign-employee">Employee *</Label>
              <Select
                value={assignForm.employeeId}
                onValueChange={(value) => {
                  setAssignForm((prev) => ({ ...prev, employeeId: value }));
                  if (assignFormErrors.employeeId) {
                    setAssignFormErrors((prev) => ({ ...prev, employeeId: "" }));
                  }
                }}
              >
                <SelectTrigger className={assignFormErrors.employeeId ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees
                    .filter((emp) => emp.status === "ACTIVE")
                    .map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} - {emp.employeeCode}
                        {emp.department && ` (${emp.department.name})`}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {assignFormErrors.employeeId && (
                <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {assignFormErrors.employeeId}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="assign-note">Notes (Optional)</Label>
              <Textarea
                id="assign-note"
                value={assignForm.note}
                onChange={(e) => setAssignForm((prev) => ({ ...prev, note: e.target.value }))}
                placeholder="Additional notes about this assignment"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialog(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleAssignAsset} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                "Assign Asset"
              )}
            </Button>
          </DialogFooter>
>>>>>>> dev
        </DialogContent>
      </Dialog>

      {/* Delete Asset Dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Asset</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedAsset?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
<<<<<<< HEAD
          <div className="space-y-4">
            {selectedAsset && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">
                  <div><strong>Serial Number:</strong> {selectedAsset.serialNumber}</div>
                  <div><strong>Category:</strong> {getCategoryLabel(selectedAsset.category)}</div>
                  <div><strong>Status:</strong> {getStatusLabel(selectedAsset.status)}</div>
                  {selectedAsset.assignedEmployee && (
                    <div><strong>Assigned to:</strong> {selectedAsset.assignedEmployee.firstName} {selectedAsset.assignedEmployee.lastName}</div>
                  )}
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setDeleteDialog(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteAsset}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Asset"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Asset History Dialog */}
      <Dialog open={historyDialog} onOpenChange={setHistoryDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Asset History</DialogTitle>
            <DialogDescription>
              Complete history of {selectedAsset?.name} assignments and changes
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {assetHistory.length === 0 ? (
              <div className="text-center py-8">
                <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No history available for this asset.</p>
              </div>
            ) : (
              assetHistory.map((entry) => (
                <div key={entry.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium">
                        {getActionLabel(entry.action)}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(entry.createdAt), "MMM dd, yyyy HH:mm")}
                    </span>
                  </div>
                  {entry.description && (
                    <div className="text-sm text-gray-600 mb-2">
                      {entry.description}
                    </div>
                  )}
                  {entry.fromEmployee && (
                    <div className="text-sm text-muted-foreground mb-1">
                      <strong>From:</strong> {entry.fromEmployee.firstName} {entry.fromEmployee.lastName} ({entry.fromEmployee.employeeCode})
                    </div>
                  )}
                  {entry.toEmployee && (
                    <div className="text-sm text-muted-foreground mb-1">
                      <strong>To:</strong> {entry.toEmployee.firstName} {entry.toEmployee.lastName} ({entry.toEmployee.employeeCode})
                    </div>
                  )}
                  {entry.performedByUser && (
                    <div className="text-xs text-muted-foreground">
                      Performed by: {entry.performedByUser.firstName} {entry.performedByUser.lastName}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
=======
          {selectedAsset && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
              <div><strong>Asset Code:</strong> {selectedAsset.assetCode}</div>
              <div><strong>Serial Number:</strong> {selectedAsset.serialNumber || "N/A"}</div>
              <div><strong>Category:</strong> {selectedAsset.category?.name || "N/A"}</div>
              <div><strong>Status:</strong> {getStatusLabel(selectedAsset.status)}</div>
              {selectedAsset.assignedEmployee && (
                <div><strong>Assigned to:</strong> {selectedAsset.assignedEmployee.firstName} {selectedAsset.assignedEmployee.lastName}</div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAsset} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Asset"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Asset Detail Dialog */}
      {selectedAsset && (
        <AssetDetailDialog
          asset={selectedAsset}
          open={detailDialog}
          onOpenChange={setDetailDialog}
          canManage={canManage}
          onAssetUpdate={loadAssets}
        />
      )}
    </div>
  );
}
>>>>>>> dev
