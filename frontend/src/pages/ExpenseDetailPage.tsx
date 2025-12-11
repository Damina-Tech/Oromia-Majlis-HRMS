import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  DollarSign,
  Calendar,
  FileText,
  Download,
  CreditCard,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  getExpense,
  approveExpense,
  rejectExpense,
  payExpense,
  getStatusLabel,
  getStatusColor,
  getExpenseTypeLabel,
  getPaymentMethodLabel,
  type Expense,
} from "@/services/expenses";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import api from "@/services/api";

export default function ExpenseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission, user } = useAuth();
  const canApprove = hasPermission("expense.approve");
  const canPay = hasPermission("expense.pay");

  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<Expense["paymentMethod"]>("CASH");
  const [paymentReference, setPaymentReference] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (id) {
      loadExpense();
    }
  }, [id]);

  const loadExpense = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await getExpense(id);
      setExpense(data);
    } catch (err: any) {
      console.error("Failed to load expense:", err);
      toast.error("Failed to load expense");
      navigate("/expenses");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!expense) return;
    try {
      setProcessing(true);
      await approveExpense(expense.id, comment);
      toast.success("Expense approved");
      setApproveDialogOpen(false);
      setComment("");
      loadExpense();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to approve expense");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!expense || !comment.trim()) {
      toast.error("Please provide a rejection comment");
      return;
    }
    try {
      setProcessing(true);
      await rejectExpense(expense.id, comment);
      toast.success("Expense rejected");
      setRejectDialogOpen(false);
      setComment("");
      loadExpense();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to reject expense");
    } finally {
      setProcessing(false);
    }
  };

  const handlePay = async () => {
    if (!expense) return;
    try {
      setProcessing(true);
      await payExpense(expense.id, paymentMethod!, paymentReference || undefined);
      toast.success("Expense marked as paid");
      setPayDialogOpen(false);
      setPaymentMethod("CASH");
      setPaymentReference("");
      loadExpense();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to mark expense as paid");
    } finally {
      setProcessing(false);
    }
  };

  const downloadReceipt = () => {
    if (!expense?.receiptUrl) return;
    const url = `${api.defaults.baseURL}${expense.receiptUrl}`;
    window.open(url, "_blank");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!expense) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Expense Not Found</h3>
          <Button variant="outline" onClick={() => navigate("/expenses")}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/expenses")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{expense.title}</h1>
            <p className="text-gray-600 mt-1">Reference: {expense.referenceNo}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(expense.status)}>
            {getStatusLabel(expense.status)}
          </Badge>
          {expense.status === "SUBMITTED" && canApprove && (
            <>
              <Button
                variant="outline"
                className="text-green-600"
                onClick={() => {
                  setComment("");
                  setApproveDialogOpen(true);
                }}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button
                variant="outline"
                className="text-red-600"
                onClick={() => {
                  setComment("");
                  setRejectDialogOpen(true);
                }}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </>
          )}
          {expense.status === "APPROVED" && canPay && (
            <Button
              onClick={() => {
                setPaymentMethod("CASH");
                setPaymentReference("");
                setPayDialogOpen(true);
              }}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Mark as Paid
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Expense Details */}
          <Card>
            <CardHeader>
              <CardTitle>Expense Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">Type</Label>
                  <p className="font-medium">
                    <Badge variant="outline">{getExpenseTypeLabel(expense.expenseType)}</Badge>
                  </p>
                </div>
                <div>
                  <Label className="text-gray-600">Amount</Label>
                  <p className="font-medium text-lg">
                    {expense.amount.toLocaleString()} {expense.currency}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-600">Incurred Date</Label>
                  <p className="font-medium">
                    {format(new Date(expense.incurredDate), "MMMM dd, yyyy")}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-600">Department</Label>
                  <p className="font-medium">{expense.department?.name || "—"}</p>
                </div>
                {expense.asset && (
                  <div>
                    <Label className="text-gray-600">Asset</Label>
                    <p className="font-medium">
                      {expense.asset.assetCode} - {expense.asset.name}
                    </p>
                  </div>
                )}
                {expense.vendor && (
                  <div>
                    <Label className="text-gray-600">Vendor</Label>
                    <p className="font-medium">{expense.vendor.name}</p>
                  </div>
                )}
                {expense.paymentMethod && (
                  <div>
                    <Label className="text-gray-600">Payment Method</Label>
                    <p className="font-medium">{getPaymentMethodLabel(expense.paymentMethod)}</p>
                  </div>
                )}
              </div>
              {expense.description && (
                <div>
                  <Label className="text-gray-600">Description</Label>
                  <p className="text-gray-700 whitespace-pre-wrap">{expense.description}</p>
                </div>
              )}
              {expense.receiptUrl && (
                <div>
                  <Label className="text-gray-600">Receipt</Label>
                  <div className="mt-2">
                    <Button variant="outline" onClick={downloadReceipt}>
                      <Download className="h-4 w-4 mr-2" />
                      Download Receipt
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Approval History */}
          {expense.approvals && expense.approvals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Approval History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {expense.approvals.map((approval) => (
                    <div key={approval.id} className="border-l-2 border-gray-200 pl-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {approval.approver.firstName} {approval.approver.lastName}
                          </p>
                          <p className="text-sm text-gray-600">
                            {approval.action === "SUBMITTED" && "Submitted"}
                            {approval.action === "APPROVED" && "Approved"}
                            {approval.action === "REJECTED" && "Rejected"}
                          </p>
                        </div>
                        <p className="text-sm text-gray-500">
                          {format(new Date(approval.createdAt), "MMM dd, yyyy HH:mm")}
                        </p>
                      </div>
                      {approval.comment && (
                        <p className="text-sm text-gray-700 mt-2">{approval.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment History */}
          {expense.payments && expense.payments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {expense.payments.map((payment) => (
                    <div key={payment.id} className="border-l-2 border-green-200 pl-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {payment.paidAmount.toLocaleString()} {expense.currency}
                          </p>
                          <p className="text-sm text-gray-600">
                            {getPaymentMethodLabel(payment.paymentMethod)}
                            {payment.paymentReference && ` - ${payment.paymentReference}`}
                          </p>
                          <p className="text-sm text-gray-600">
                            Paid by {payment.paidByEmployee.firstName} {payment.paidByEmployee.lastName}
                          </p>
                        </div>
                        <p className="text-sm text-gray-500">
                          {format(new Date(payment.paidAt), "MMM dd, yyyy HH:mm")}
                        </p>
                      </div>
                      {payment.notes && (
                        <p className="text-sm text-gray-700 mt-2">{payment.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Submitted By</CardTitle>
            </CardHeader>
            <CardContent>
              {expense.submittedByEmployee ? (
                <div>
                  <p className="font-medium">
                    {expense.submittedByEmployee.firstName} {expense.submittedByEmployee.lastName}
                  </p>
                  <p className="text-sm text-gray-600">{expense.submittedByEmployee.employeeCode}</p>
                  <p className="text-sm text-gray-600 mt-2">
                    {format(new Date(expense.createdAt), "MMM dd, yyyy")}
                  </p>
                </div>
              ) : (
                <p className="text-gray-600">—</p>
              )}
            </CardContent>
          </Card>

          {expense.approvedByEmployee && (
            <Card>
              <CardHeader>
                <CardTitle>Approved By</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <p className="font-medium">
                    {expense.approvedByEmployee.firstName} {expense.approvedByEmployee.lastName}
                  </p>
                  {expense.approvedAt && (
                    <p className="text-sm text-gray-600">
                      {format(new Date(expense.approvedAt), "MMM dd, yyyy HH:mm")}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {expense.paidByEmployee && (
            <Card>
              <CardHeader>
                <CardTitle>Paid By</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <p className="font-medium">
                    {expense.paidByEmployee.firstName} {expense.paidByEmployee.lastName}
                  </p>
                  {expense.paidAt && (
                    <p className="text-sm text-gray-600">
                      {format(new Date(expense.paidAt), "MMM dd, yyyy HH:mm")}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Expense</DialogTitle>
            <DialogDescription>
              Approve "{expense.title}" for payment?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Comment (Optional)</Label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add approval comment..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={processing}>
              {processing ? "Approving..." : "Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Expense</DialogTitle>
            <DialogDescription>
              Reject "{expense.title}"? Please provide a reason.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Rejection Comment *</Label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Provide reason for rejection..."
                rows={3}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={processing || !comment.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {processing ? "Rejecting..." : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pay Dialog */}
      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Paid</DialogTitle>
            <DialogDescription>
              Record payment for "{expense.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Payment Method *</Label>
              <Select
                value={paymentMethod || "CASH"}
                onValueChange={(value: any) => setPaymentMethod(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  <SelectItem value="E_BIRR">e-Birr</SelectItem>
                  <SelectItem value="TELEBIRR">Telebirr</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Payment Reference (Optional)</Label>
              <Input
                type="text"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="Transaction reference, check number, etc."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePay} disabled={processing}>
              {processing ? "Processing..." : "Mark as Paid"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

