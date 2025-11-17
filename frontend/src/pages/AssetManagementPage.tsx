import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  Laptop,
  Smartphone,
  Monitor,
  Keyboard,
  Mouse,
  Headphones,
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
  getStatusColor,
  getConditionColor,
  getStatusLabel,
  getConditionLabel,
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
  
  // Selected asset
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  
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
    notes: "",
  });
  
  const [assignForm, setAssignForm] = useState({
    employeeId: "",
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

  // Reload assets when filters change
  useEffect(() => {
    if (canView) {
      const timeoutId = setTimeout(() => {
        loadAssets();
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
      return;
    }

    try {
      setSubmitting(true);
      
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
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignAsset = async () => {
    if (!selectedAsset || !assignForm.employeeId) {
      toast.error("Please select an employee");
      return;
    }

    try {
      setSubmitting(true);
      
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
    } finally {
      setSubmitting(false);
    }
  };

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
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAsset = async () => {
    if (!selectedAsset) return;

    try {
      setSubmitting(true);
      
      await deleteAsset(selectedAsset.id);
      
      setDeleteDialog(false);
      setSelectedAsset(null);
      
      await loadAssets();
      toast.success("Asset deleted successfully");
    } catch (err: any) {
      console.error("Failed to delete asset:", err);
      toast.error(err.response?.data?.message || "Failed to delete asset");
    } finally {
      setSubmitting(false);
    }
  };

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
      </div>
    );
  }

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
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-gray-600">You don't have permission to view assets.</p>
        </div>
      </div>
    );
  }

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
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
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
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned</CardTitle>
            <User className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.assigned}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.maintenance}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Asset Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
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
                        <div>
                          <div className="font-medium">{asset.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {asset.brand} {asset.model}
                          </div>
                        </div>
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
