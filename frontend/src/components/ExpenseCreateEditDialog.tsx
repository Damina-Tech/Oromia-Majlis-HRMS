import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import {
  createExpense,
  updateExpense,
  uploadReceipt,
  getExpenseTypeLabel,
  type Expense,
  type CreateExpenseData,
  type UpdateExpenseData,
} from "@/services/expenses";
import { listDepartments } from "@/services/departments";
import { listAssets } from "@/services/assets";
import { listAssetVendors } from "@/services/assets";
import type { Department } from "@/services/departments";
import type { Asset, AssetVendor } from "@/services/assets";

interface ExpenseCreateEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: Expense | null;
  onSuccess?: () => void;
}

export default function ExpenseCreateEditDialog({
  open,
  onOpenChange,
  expense,
  onSuccess,
}: ExpenseCreateEditDialogProps) {
  const { hasPermission, user } = useAuth();
  const isEdit = !!expense;
  const canSubmit = hasPermission("expense.submit");

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [vendors, setVendors] = useState<AssetVendor[]>([]);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  const [formData, setFormData] = useState<CreateExpenseData>({
    title: "",
    description: "",
    amount: 0,
    currency: "ETB",
    expenseType: "OPERATIONAL",
    incurredDate: new Date().toISOString().split("T")[0],
    departmentId: "",
    assetId: undefined,
    vendorId: undefined,
    paymentMethod: undefined,
    submit: false,
  });

  useEffect(() => {
    if (open) {
      loadData();
      if (expense) {
        setFormData({
          title: expense.title,
          description: expense.description || "",
          amount: expense.amount,
          currency: expense.currency,
          expenseType: expense.expenseType,
          incurredDate: expense.incurredDate.split("T")[0],
          departmentId: expense.departmentId,
          assetId: expense.assetId,
          vendorId: expense.vendorId,
          paymentMethod: expense.paymentMethod,
          submit: false,
        });
        setReceiptFile(null);
      } else {
        // Reset form for new expense
        setFormData({
          title: "",
          description: "",
          amount: 0,
          currency: "ETB",
          expenseType: "OPERATIONAL",
          incurredDate: new Date().toISOString().split("T")[0],
          departmentId: "",
          assetId: undefined,
          vendorId: undefined,
          paymentMethod: undefined,
          submit: false,
        });
        setReceiptFile(null);
      }
    }
  }, [open, expense, user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [deptsRes, assetsRes, vendorsRes] = await Promise.all([
        listDepartments(),
        listAssets({ pageSize: 1000 }),
        listAssetVendors({ pageSize: 1000 }),
      ]);
      setDepartments(deptsRes);
      setAssets(assetsRes.items);
      setVendors(vendorsRes.items);
    } catch (err: any) {
      console.error("Failed to load data:", err);
      toast.error("Failed to load form data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (submit: boolean = false) => {
    try {
      setSubmitting(true);

      if (isEdit) {
        const updateData: UpdateExpenseData = {
          title: formData.title,
          description: formData.description,
          amount: formData.amount,
          currency: formData.currency,
          expenseType: formData.expenseType,
          incurredDate: formData.incurredDate,
          departmentId: formData.departmentId,
          assetId: (formData.assetId === "none" || !formData.assetId) ? null : formData.assetId,
          vendorId: (formData.vendorId === "none" || !formData.vendorId) ? null : formData.vendorId,
          paymentMethod: (formData.paymentMethod === "none" || !formData.paymentMethod) ? null : formData.paymentMethod,
        };
        await updateExpense(expense!.id, updateData);

        // Upload receipt if provided
        if (receiptFile) {
          setUploadingReceipt(true);
          try {
            await uploadReceipt(expense!.id, receiptFile);
          } catch (err) {
            console.error("Failed to upload receipt:", err);
            toast.error("Expense updated but receipt upload failed");
          } finally {
            setUploadingReceipt(false);
          }
        }

        toast.success("Expense updated successfully");
      } else {
        const createData: CreateExpenseData = {
          ...formData,
          assetId: (formData.assetId === "none" || !formData.assetId) ? undefined : formData.assetId,
          vendorId: (formData.vendorId === "none" || !formData.vendorId) ? undefined : formData.vendorId,
          paymentMethod: (formData.paymentMethod === "none" || !formData.paymentMethod) ? undefined : formData.paymentMethod,
          submit,
        };
        const newExpense = await createExpense(createData);

        // Upload receipt if provided
        if (receiptFile) {
          setUploadingReceipt(true);
          try {
            await uploadReceipt(newExpense.id, receiptFile);
          } catch (err) {
            console.error("Failed to upload receipt:", err);
            toast.error("Expense created but receipt upload failed");
          } finally {
            setUploadingReceipt(false);
          }
        }

        toast.success(submit ? "Expense submitted successfully" : "Expense saved as draft");
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (err: any) {
      console.error("Failed to save expense:", err);
      toast.error(err.response?.data?.message || "Failed to save expense");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      setReceiptFile(file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Expense" : "Create Expense"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update expense details. Only draft expenses can be edited."
              : "Fill in the expense details below. You can save as draft or submit for approval."}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Expense title"
                />
              </div>
              <div>
                <Label htmlFor="expenseType">Expense Type *</Label>
                <Select
                  value={formData.expenseType}
                  onValueChange={(value: any) => setFormData({ ...formData, expenseType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPERATIONAL">Operational</SelectItem>
                    <SelectItem value="TRAVEL">Travel</SelectItem>
                    <SelectItem value="REIMBURSEMENT">Reimbursement</SelectItem>
                    <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                    <SelectItem value="RENT">Rent</SelectItem>
                    <SelectItem value="UTILITIES">Utilities</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Expense description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Input
                  id="currency"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  placeholder="ETB"
                />
              </div>
              <div>
                <Label htmlFor="incurredDate">Incurred Date *</Label>
                <Input
                  id="incurredDate"
                  type="date"
                  value={formData.incurredDate}
                  onChange={(e) => setFormData({ ...formData, incurredDate: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="departmentId">Department *</Label>
                <Select
                  value={formData.departmentId}
                  onValueChange={(value) => setFormData({ ...formData, departmentId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select
                  value={formData.paymentMethod || undefined}
                  onValueChange={(value: any) => setFormData({ ...formData, paymentMethod: value === "none" ? undefined : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                    <SelectItem value="E_BIRR">e-Birr</SelectItem>
                    <SelectItem value="TELEBIRR">Telebirr</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="assetId">Asset (Optional)</Label>
                <Select
                  value={formData.assetId || "none"}
                  onValueChange={(value) => setFormData({ ...formData, assetId: value === "none" ? undefined : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select asset (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {assets.map((asset) => (
                      <SelectItem key={asset.id} value={asset.id}>
                        {asset.assetCode} - {asset.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="vendorId">Vendor (Optional)</Label>
                <Select
                  value={formData.vendorId || "none"}
                  onValueChange={(value) => setFormData({ ...formData, vendorId: value === "none" ? undefined : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vendor (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {vendors.map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="receipt">Receipt (Optional)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="receipt"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="flex-1"
                />
                {receiptFile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReceiptFile(null)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {receiptFile && (
                <p className="text-sm text-gray-500 mt-1">{receiptFile.name}</p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting || uploadingReceipt}>
                Cancel
              </Button>
              {!isEdit && (
                <Button
                  variant="outline"
                  onClick={() => handleSubmit(false)}
                  disabled={submitting || uploadingReceipt}
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save Draft
                </Button>
              )}
              {canSubmit && (
                <Button
                  onClick={() => handleSubmit(true)}
                  disabled={submitting || uploadingReceipt || !formData.title || !formData.amount || !formData.departmentId}
                >
                  {submitting || uploadingReceipt ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {isEdit ? "Update" : "Submit for Approval"}
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

