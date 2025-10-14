import React, { useState } from "react";
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
import { useAssets, useNotifications } from "@/store";
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
} from "lucide-react";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AssetManagementPage() {
  const [assets, setAssets] = useState([]);
  const [assetHistory, setAssetHistory] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [addAssetDialog, setAddAssetDialog] = useState(false);
  const [assignDialog, setAssignDialog] = useState(false);
  const [historyDialog, setHistoryDialog] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [assetForm, setAssetForm] = useState({
    name: "",
    category: "",
    serialNumber: "",
    model: "",
    brand: "",
    purchaseDate: "",
    purchasePrice: "",
    location: "",
    condition: "excellent",
    notes: "",
  });
  const [assignForm, setAssignForm] = useState({
    employeeId: "",
    employeeName: "",
    notes: "",
  });

  const addNotification = (notification) =>
    setNotifications((prev) => [...prev, notification]);

  const addAsset = (asset) => {
    setAssets((prev) => [...prev, { id: Date.now().toString(), ...asset }]);
  };

  const assignAsset = (assetId, employeeId, employeeName, notes) => {
    setAssets((prev) =>
      prev.map((a) =>
        a.id === assetId
          ? { ...a, status: "assigned", employeeId, employeeName }
          : a
      )
    );
    setAssetHistory((prev) => ({
      ...prev,
      [assetId]: [
        ...(prev[assetId] || []),
        { date: new Date(), action: "assigned", employeeName, notes },
      ],
    }));
  };

  const revokeAsset = (assetId, note) => {
    setAssets((prev) =>
      prev.map((a) =>
        a.id === assetId
          ? { ...a, status: "available", employeeId: null, employeeName: null }
          : a
      )
    );
    setAssetHistory((prev) => ({
      ...prev,
      [assetId]: [
        ...(prev[assetId] || []),
        { date: new Date(), action: "revoked", notes: note },
      ],
    }));
  };

  const getAssetHistory = (assetId) => assetHistory[assetId] || [];

  const getAssetIcon = (category) => {
    const icons = {
      laptop: Laptop,
      phone: Smartphone,
      monitor: Monitor,
      keyboard: Keyboard,
      mouse: Mouse,
      headset: Headphones,
    };
    const Icon = icons[category] || AlertCircle;
    return <Icon className="h-4 w-4" />;
  };

  const getStatusColor = (status) => {
    const map = {
      available: "bg-green-100 text-green-800",
      assigned: "bg-blue-100 text-blue-800",
      maintenance: "bg-yellow-100 text-yellow-800",
      retired: "bg-gray-100 text-gray-800",
    };
    return map[status] || "bg-gray-100 text-gray-800";
  };

  const getConditionColor = (condition) => {
    const map = {
      excellent: "bg-green-100 text-green-800",
      good: "bg-blue-100 text-blue-800",
      fair: "bg-yellow-100 text-yellow-800",
      poor: "bg-red-100 text-red-800",
    };
    return map[condition] || "bg-gray-100 text-gray-800";
  };

  const filteredAssets = assets.filter((asset) => {
    const matchSearch = [asset.name, asset.model, asset.serialNumber].some(
      (v) => v?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchStatus = statusFilter === "all" || asset.status === statusFilter;
    const matchCategory =
      categoryFilter === "all" || asset.category === categoryFilter;
    return matchSearch && matchStatus && matchCategory;
  });

  const handleAddAsset = () => {
    if (!assetForm.name || !assetForm.category || !assetForm.serialNumber) {
      return addNotification({
        title: "Missing Information",
        message: "Please fill in all required fields",
        type: "error",
      });
    }
    addAsset({
      ...assetForm,
      purchaseDate: new Date(assetForm.purchaseDate),
      purchasePrice: parseFloat(assetForm.purchasePrice) || 0,
      currentValue: parseFloat(assetForm.purchasePrice) || 0,
      status: "available",
    });
    addNotification({
      title: "Asset Added",
      message: `${assetForm.name} has been added to inventory`,
      type: "success",
    });
    setAddAssetDialog(false);
    setAssetForm({
      name: "",
      category: "",
      serialNumber: "",
      model: "",
      brand: "",
      purchaseDate: "",
      purchasePrice: "",
      location: "",
      condition: "excellent",
      notes: "",
    });
  };

  const handleAssignAsset = () => {
    if (!selectedAsset || !assignForm.employeeId || !assignForm.employeeName) {
      return addNotification({
        title: "Missing Information",
        message: "Please select an employee",
        type: "error",
      });
    }
    assignAsset(
      selectedAsset,
      assignForm.employeeId,
      assignForm.employeeName,
      assignForm.notes
    );
    addNotification({
      title: "Asset Assigned",
      message: `Asset has been assigned to ${assignForm.employeeName}`,
      type: "success",
    });
    setAssignDialog(false);
    setAssignForm({ employeeId: "", employeeName: "", notes: "" });
    setSelectedAsset(null);
  };

  const handleRevokeAsset = (assetId) => {
    revokeAsset(assetId, "Asset returned by employee");
    addNotification({
      title: "Asset Revoked",
      message: "Asset has been returned and is now available",
      type: "success",
    });
  };

  const handleUpdateStatus = (assetId, status) => {
    setAssets((prev) =>
      prev.map((a) => (a.id === assetId ? { ...a, status } : a))
    );
    addNotification({
      title: "Status Updated",
      message: `Asset status has been updated to ${status}`,
      type: "success",
    });
  };

  const showAssetHistory = (assetId) => {
    setSelectedAsset(assetId);
    setHistoryDialog(true);
  };

  const assetHistoryData = selectedAsset ? getAssetHistory(selectedAsset) : [];

  const stats = {
    total: assets.length,
    available: assets.filter((a) => a.status === "available").length,
    assigned: assets.filter((a) => a.status === "assigned").length,
    maintenance: assets.filter((a) => a.status === "maintenance").length,
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
                    <SelectItem value="laptop">Laptop</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="tablet">Tablet</SelectItem>
                    <SelectItem value="monitor">Monitor</SelectItem>
                    <SelectItem value="keyboard">Keyboard</SelectItem>
                    <SelectItem value="mouse">Mouse</SelectItem>
                    <SelectItem value="headset">Headset</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
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
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
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
              >
                Cancel
              </Button>
              <Button onClick={handleAddAsset}>Add Asset</Button>
            </div>
          </DialogContent>
        </Dialog>
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
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="retired">Retired</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="laptop">Laptop</SelectItem>
                <SelectItem value="phone">Phone</SelectItem>
                <SelectItem value="monitor">Monitor</SelectItem>
                <SelectItem value="keyboard">Keyboard</SelectItem>
                <SelectItem value="mouse">Mouse</SelectItem>
                <SelectItem value="headset">Headset</SelectItem>
                <SelectItem value="other">Other</SelectItem>
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
              {filteredAssets.map((asset) => (
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
                      {asset.status.charAt(0).toUpperCase() +
                        asset.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {asset.assignedTo ? (
                      <div>
                        <div className="font-medium">
                          Employee #{asset.assignedTo}
                        </div>
                        {asset.assignedDate && (
                          <div className="text-sm text-muted-foreground">
                            Since {format(asset.assignedDate, "MMM dd, yyyy")}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={getConditionColor(asset.condition)}>
                      {asset.condition.charAt(0).toUpperCase() +
                        asset.condition.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>{asset.location}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {asset.status === "available" && (
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedAsset(asset.id);
                              setAssignDialog(true);
                            }}
                          >
                            Assign to Employee
                          </DropdownMenuItem>
                        )}
                        {asset.status === "assigned" && (
                          <DropdownMenuItem
                            onClick={() => handleRevokeAsset(asset.id)}
                          >
                            Revoke Assignment
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() =>
                            handleUpdateStatus(asset.id, "maintenance")
                          }
                          disabled={asset.status === "maintenance"}
                        >
                          Mark as Maintenance
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => showAssetHistory(asset.id)}
                        >
                          <History className="mr-2 h-4 w-4" />
                          View History
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
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
              Assign this asset to an employee
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
                    employeeName:
                      value === "emp-001"
                        ? "John Doe"
                        : value === "emp-002"
                        ? "Jane Smith"
                        : "Unknown",
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
              <Button variant="outline" onClick={() => setAssignDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAssignAsset}>Assign Asset</Button>
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
              Complete history of asset assignments and changes
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {assetHistoryData.map((entry) => (
              <div key={entry.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium">
                      {entry.action.charAt(0).toUpperCase() +
                        entry.action.slice(1)}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {format(entry.date, "MMM dd, yyyy HH:mm")}
                  </span>
                </div>
                {entry.employeeName && (
                  <div className="text-sm text-muted-foreground mb-2">
                    Employee: {entry.employeeName}
                  </div>
                )}
                {entry.notes && <div className="text-sm">{entry.notes}</div>}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
