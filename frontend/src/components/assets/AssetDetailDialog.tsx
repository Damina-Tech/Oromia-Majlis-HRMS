import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import {
  getAsset,
  getAssetHistory,
  listAssetMaintenance,
  listAssetDepreciation,
  getStatusColor,
  getConditionColor,
  getStatusLabel,
  getConditionLabel,
  formatCurrency,
  getActionLabel,
  type Asset,
  type AssetHistory,
  type AssetMaintenance,
  type AssetDepreciation,
} from "@/services/assets";
import {
  User,
  Calendar,
  DollarSign,
  MapPin,
  Building2,
  Wrench,
  TrendingDown,
  FileText,
  History,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface AssetDetailDialogProps {
  asset: Asset;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canManage: boolean;
  onAssetUpdate: () => void;
}

export default function AssetDetailDialog({
  asset: initialAsset,
  open,
  onOpenChange,
  canManage,
  onAssetUpdate,
}: AssetDetailDialogProps) {
  const [asset, setAsset] = useState<Asset>(initialAsset);
  const [history, setHistory] = useState<AssetHistory[]>([]);
  const [maintenance, setMaintenance] = useState<AssetMaintenance[]>([]);
  const [depreciation, setDepreciation] = useState<AssetDepreciation[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (open) {
      loadAssetDetails();
    }
  }, [open, initialAsset.id]);

  const loadAssetDetails = async () => {
    try {
      setLoading(true);
      const [assetData, historyData, maintenanceData, depreciationData] = await Promise.all([
        getAsset(initialAsset.id),
        getAssetHistory({ assetId: initialAsset.id, pageSize: 100 }),
        listAssetMaintenance({ assetId: initialAsset.id, pageSize: 100 }),
        listAssetDepreciation({ assetId: initialAsset.id, pageSize: 100 }),
      ]);
      setAsset(assetData);
      setHistory(historyData.items || []);
      setMaintenance(maintenanceData.items || []);
      setDepreciation(depreciationData.items || []);
    } catch (err: any) {
      console.error("Failed to load asset details:", err);
      toast.error("Failed to load asset details");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <span>{asset.name}</span>
                <Badge className={getStatusColor(asset.status)}>
                  {getStatusLabel(asset.status)}
                </Badge>
              </DialogTitle>
              <DialogDescription className="mt-1">
                Asset Code: <span className="font-mono">{asset.assetCode}</span>
                {asset.serialNumber && (
                  <> • Serial: <span className="font-mono">{asset.serialNumber}</span></>
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid grid-cols-5 w-full flex-shrink-0">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="assignments">Assignments</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
              <TabsTrigger value="depreciation">Depreciation</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Category:</span>
                      <span className="font-medium">{asset.category?.name || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Brand:</span>
                      <span className="font-medium">{asset.brand || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Model:</span>
                      <span className="font-medium">{asset.model || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Serial Number:</span>
                      <span className="font-mono font-medium">{asset.serialNumber || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Condition:</span>
                      <Badge className={getConditionColor(asset.condition)}>
                        {getConditionLabel(asset.condition)}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Financial Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {asset.purchasePrice && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Purchase Price:</span>
                        <span className="font-medium">
                          {formatCurrency(asset.purchasePrice, asset.currency)}
                        </span>
                      </div>
                    )}
                    {asset.purchaseDate && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Purchase Date:</span>
                        <span className="font-medium">
                          {format(new Date(asset.purchaseDate), "MMM dd, yyyy")}
                        </span>
                      </div>
                    )}
                    {asset.warrantyUntil && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Warranty Until:</span>
                        <span className="font-medium">
                          {format(new Date(asset.warrantyUntil), "MMM dd, yyyy")}
                        </span>
                      </div>
                    )}
                    {asset.depreciationMethod && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Depreciation Method:</span>
                          <span className="font-medium">{asset.depreciationMethod}</span>
                        </div>
                        {asset.depreciationRate && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Depreciation Rate:</span>
                            <span className="font-medium">{asset.depreciationRate}%</span>
                          </div>
                        )}
                        {asset.lifeYears && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Life Years:</span>
                            <span className="font-medium">{asset.lifeYears}</span>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Location & Assignment</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Location:</span>
                      <span className="font-medium">{asset.location?.name || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Department:</span>
                      <span className="font-medium">{asset.department?.name || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vendor:</span>
                      <span className="font-medium">{asset.vendor?.name || "N/A"}</span>
                    </div>
                    {asset.assignedEmployee && (
                      <div className="pt-2 border-t">
                        <div className="flex items-center gap-2 mb-1">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {asset.assignedEmployee.firstName} {asset.assignedEmployee.lastName}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground ml-6">
                          {asset.assignedEmployee.employeeCode}
                          {asset.assignedEmployee.department && ` • ${asset.assignedEmployee.department.name}`}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Additional Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created:</span>
                      <span className="font-medium">
                        {format(new Date(asset.createdAt), "MMM dd, yyyy")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Updated:</span>
                      <span className="font-medium">
                        {format(new Date(asset.updatedAt), "MMM dd, yyyy")}
                      </span>
                    </div>
                    {asset.createdByUser && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Created By:</span>
                        <span className="font-medium">
                          {asset.createdByUser.firstName} {asset.createdByUser.lastName}
                        </span>
                      </div>
                    )}
                    {asset.notes && (
                      <div className="pt-2 border-t">
                        <div className="text-muted-foreground mb-1">Notes:</div>
                        <div className="text-sm">{asset.notes}</div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="assignments" className="space-y-4 overflow-y-auto flex-1">
              <Card>
                <CardHeader>
                  <CardTitle>Assignment History</CardTitle>
                  <CardDescription>Complete history of asset assignments</CardDescription>
                </CardHeader>
                <CardContent>
                  {asset.assignments && asset.assignments.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee</TableHead>
                          <TableHead>Assigned At</TableHead>
                          <TableHead>Returned At</TableHead>
                          <TableHead>Assigned By</TableHead>
                          <TableHead>Note</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {asset.assignments.map((assignment) => (
                          <TableRow key={assignment.id}>
                            <TableCell>
                              {assignment.employee ? (
                                <div>
                                  <div className="font-medium">
                                    {assignment.employee.firstName} {assignment.employee.lastName}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {assignment.employee.employeeCode}
                                  </div>
                                </div>
                              ) : (
                                "N/A"
                              )}
                            </TableCell>
                            <TableCell>
                              {format(new Date(assignment.assignedAt), "MMM dd, yyyy")}
                            </TableCell>
                            <TableCell>
                              {assignment.returnedAt
                                ? format(new Date(assignment.returnedAt), "MMM dd, yyyy")
                                : <Badge variant="outline">Active</Badge>}
                            </TableCell>
                            <TableCell>
                              {assignment.assignedByUser
                                ? `${assignment.assignedByUser.firstName} ${assignment.assignedByUser.lastName}`
                                : "N/A"}
                            </TableCell>
                            <TableCell>{assignment.note || "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No assignment history available
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="maintenance" className="space-y-4 overflow-y-auto flex-1">
              <Card>
                <CardHeader>
                  <CardTitle>Maintenance Records</CardTitle>
                  <CardDescription>All maintenance activities for this asset</CardDescription>
                </CardHeader>
                <CardContent>
                  {maintenance.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Cost</TableHead>
                          <TableHead>Vendor</TableHead>
                          <TableHead>Performed By</TableHead>
                          <TableHead>Next Due</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {maintenance.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell>
                              {format(new Date(record.date), "MMM dd, yyyy")}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{record.type}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge>{record.status}</Badge>
                            </TableCell>
                            <TableCell>
                              {record.cost
                                ? formatCurrency(typeof record.cost === "string" ? parseFloat(record.cost) : record.cost)
                                : "—"}
                            </TableCell>
                            <TableCell>{record.vendor?.name || "—"}</TableCell>
                            <TableCell>
                              {record.performedByEmployee
                                ? `${record.performedByEmployee.firstName} ${record.performedByEmployee.lastName}`
                                : "—"}
                            </TableCell>
                            <TableCell>
                              {record.nextDueDate
                                ? format(new Date(record.nextDueDate), "MMM dd, yyyy")
                                : "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No maintenance records available
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="depreciation" className="space-y-4 overflow-y-auto flex-1">
              <Card>
                <CardHeader>
                  <CardTitle>Depreciation History</CardTitle>
                  <CardDescription>Depreciation calculations and book values</CardDescription>
                </CardHeader>
                <CardContent>
                  {depreciation.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Period</TableHead>
                          <TableHead>Depreciation Amount</TableHead>
                          <TableHead>Accumulated Depreciation</TableHead>
                          <TableHead>Book Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {depreciation.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell>
                              {record.month
                                ? format(new Date(record.year, record.month - 1, 1), "MMM yyyy")
                                : record.year.toString()}
                            </TableCell>
                            <TableCell>
                              {formatCurrency(
                                typeof record.depreciationAmount === "string"
                                  ? parseFloat(record.depreciationAmount)
                                  : record.depreciationAmount,
                                asset.currency
                              )}
                            </TableCell>
                            <TableCell>
                              {formatCurrency(
                                typeof record.accumulatedDepr === "string"
                                  ? parseFloat(record.accumulatedDepr)
                                  : record.accumulatedDepr,
                                asset.currency
                              )}
                            </TableCell>
                            <TableCell>
                              <span className="font-medium">
                                {formatCurrency(
                                  typeof record.bookValue === "string"
                                    ? parseFloat(record.bookValue)
                                    : record.bookValue,
                                  asset.currency
                                )}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No depreciation records available
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-4 overflow-y-auto flex-1">
              <Card>
                <CardHeader>
                  <CardTitle>Change History</CardTitle>
                  <CardDescription>Complete audit trail of all changes</CardDescription>
                </CardHeader>
                <CardContent>
                  {history.length > 0 ? (
                    <div className="space-y-4">
                      {history.map((entry) => (
                        <div key={entry.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <History className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{getActionLabel(entry.action)}</span>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(entry.createdAt), "MMM dd, yyyy HH:mm")}
                            </span>
                          </div>
                          {entry.description && (
                            <div className="text-sm text-gray-600 mb-2">{entry.description}</div>
                          )}
                          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                            {entry.fromEmployee && (
                              <div>
                                <strong>From:</strong> {entry.fromEmployee.firstName} {entry.fromEmployee.lastName}
                              </div>
                            )}
                            {entry.toEmployee && (
                              <div>
                                <strong>To:</strong> {entry.toEmployee.firstName} {entry.toEmployee.lastName}
                              </div>
                            )}
                            {entry.performedByUser && (
                              <div>
                                <strong>By:</strong> {entry.performedByUser.firstName} {entry.performedByUser.lastName}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No history available
                    </div>
                  )}
                </CardContent>
              </Card>

              {asset.auditLogs && asset.auditLogs.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Audit Logs</CardTitle>
                    <CardDescription>System-generated audit trail</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {asset.auditLogs.map((log) => (
                        <div key={log.id} className="border rounded p-3 text-sm">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">{log.changeSummary}</span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(log.timestamp), "MMM dd, yyyy HH:mm")}
                            </span>
                          </div>
                          {log.changedByUser && (
                            <div className="text-xs text-muted-foreground">
                              Changed by: {log.changedByUser.firstName} {log.changedByUser.lastName}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
