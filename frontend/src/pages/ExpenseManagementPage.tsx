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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Receipt,
  Upload,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Calendar,
  Filter,
} from "lucide-react";
import { format } from "date-fns";
import { useDropzone } from "react-dropzone";

export default function ExpenseManagementPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [categories] = useState<string[]>([
    "Travel",
    "Meals",
    "Supplies",
    "Other",
  ]);

  const addExpense = (expense: any) => {
    setExpenses((prev) => [...prev, { ...expense, id: Date.now().toString() }]);
  };

  const addReceipt = (expenseId: string, receipt: any) => {
    setExpenses((prev) =>
      prev.map((exp) =>
        exp.id === expenseId
          ? { ...exp, receipts: [...(exp.receipts || []), receipt] }
          : exp
      )
    );
  };

  const submitExpense = (expenseId: string) => {
    setExpenses((prev) =>
      prev.map((exp) =>
        exp.id === expenseId ? { ...exp, status: "submitted" } : exp
      )
    );
  };

  const addNotification = ({
    title,
    message,
    type,
  }: {
    title: string;
    message: string;
    type: "success" | "error";
  }) => {
    console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
  };

  const [activeTab, setActiveTab] = useState("my-expenses");
  const [addExpenseDialog, setAddExpenseDialog] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [expenseForm, setExpenseForm] = useState({
    title: "",
    description: "",
    category: "",
    amount: "",
    currency: "USD",
    date: format(new Date(), "yyyy-MM-dd"),
    tags: "",
  });

  const [receipts, setReceipts] = useState<File[]>([]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/*": [".png", ".jpg", ".jpeg"],
      "application/pdf": [".pdf"],
    },
    onDrop: (acceptedFiles) => {
      setReceipts((prev) => [...prev, ...acceptedFiles]);
    },
  });

  const filteredExpenses = expenses.filter((expense) => {
    const matchesStatus =
      statusFilter === "all" || expense.status === statusFilter;
    const matchesCategory =
      categoryFilter === "all" || expense.category === categoryFilter;
    return matchesStatus && matchesCategory;
  });

  const myExpenses = filteredExpenses.filter(
    (expense) => expense.employeeId === "1"
  );
  const approvalExpenses = filteredExpenses.filter(
    (expense) =>
      expense.status === "submitted" &&
      expense.approvalFlow?.some(
        (step) => step.status === "pending" && step.approverId === "1"
      )
  );

  const handleAddExpense = () => {
    if (!expenseForm.title || !expenseForm.category || !expenseForm.amount) {
      addNotification({
        title: "Missing Information",
        message: "Please fill in all required fields",
        type: "error",
      });
      return;
    }

    const expenseId = Date.now().toString();

    const expenseData = {
      id: expenseId,
      employeeId: "1",
      employeeName: "Current User",
      title: expenseForm.title,
      description: expenseForm.description,
      category: expenseForm.category,
      amount: parseFloat(expenseForm.amount),
      currency: expenseForm.currency,
      date: new Date(expenseForm.date),
      status: "draft" as const,
      receipts: [],
      approvalFlow: [],
      tags: expenseForm.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    };

    addExpense(expenseData);

    if (receipts.length > 0) {
      receipts.forEach((file) => {
        addReceipt(expenseId, {
          fileName: file.name,
          fileUrl: URL.createObjectURL(file),
          fileSize: file.size,
        });
      });
    }

    addNotification({
      title: "Expense Added",
      message: "Your expense has been saved as draft",
      type: "success",
    });

    setAddExpenseDialog(false);
    setExpenseForm({
      title: "",
      description: "",
      category: "",
      amount: "",
      currency: "USD",
      date: format(new Date(), "yyyy-MM-dd"),
      tags: "",
    });
    setReceipts([]);
  };

  const handleSubmitExpense = (expenseId: string) => {
    submitExpense(expenseId);
    addNotification({
      title: "Expense Submitted",
      message: "Your expense has been submitted for approval",
      type: "success",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "submitted":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "reimbursed":
        return <DollarSign className="h-4 w-4 text-blue-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "submitted":
        return "bg-yellow-100 text-yellow-800";
      case "reimbursed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const stats = {
    total: myExpenses.length,
    draft: myExpenses.filter((e) => e.status === "draft").length,
    pending: myExpenses.filter((e) => e.status === "submitted").length,
    approved: myExpenses.filter(
      (e) => e.status === "approved" || e.status === "reimbursed"
    ).length,
    totalAmount: myExpenses.reduce((sum, e) => sum + e.amount, 0),
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Expense Management
          </h1>
          <p className="text-muted-foreground">
            Submit and track your business expenses
          </p>
        </div>
        <Dialog open={addExpenseDialog} onOpenChange={setAddExpenseDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Expense</DialogTitle>
              <DialogDescription>
                Submit a new business expense for approval
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Expense Title *</Label>
                  <Input
                    id="title"
                    value={expenseForm.title}
                    onChange={(e) =>
                      setExpenseForm((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="e.g., Client Lunch Meeting"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={expenseForm.category}
                    onValueChange={(value) =>
                      setExpenseForm((prev) => ({ ...prev, category: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={expenseForm.description}
                  onChange={(e) =>
                    setExpenseForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Provide details about the expense"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="amount">Amount *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={expenseForm.amount}
                    onChange={(e) =>
                      setExpenseForm((prev) => ({
                        ...prev,
                        amount: e.target.value,
                      }))
                    }
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={expenseForm.currency}
                    onValueChange={(value) =>
                      setExpenseForm((prev) => ({ ...prev, currency: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="CAD">CAD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={expenseForm.date}
                    onChange={(e) =>
                      setExpenseForm((prev) => ({
                        ...prev,
                        date: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="tags">Tags (Optional)</Label>
                <Input
                  id="tags"
                  value={expenseForm.tags}
                  onChange={(e) =>
                    setExpenseForm((prev) => ({
                      ...prev,
                      tags: e.target.value,
                    }))
                  }
                  placeholder="client, meeting, business development (comma separated)"
                />
              </div>

              <div>
                <Label>Receipts</Label>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  {isDragActive ? (
                    <p>Drop the files here...</p>
                  ) : (
                    <div>
                      <p>Drag & drop receipt files here, or click to select</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Supports images (PNG, JPG) and PDF files
                      </p>
                    </div>
                  )}
                </div>
                {receipts.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {receipts.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Receipt className="h-4 w-4" />
                        <span>{file.name}</span>
                        <span className="text-muted-foreground">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setAddExpenseDialog(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddExpense}>Add Expense</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Expenses
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Approval
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.pending}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.approved}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.totalAmount.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expense Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="my-expenses">My Expenses</TabsTrigger>
          <TabsTrigger value="approvals">Pending Approvals</TabsTrigger>
        </TabsList>

        <TabsContent value="my-expenses" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>My Expenses</CardTitle>
                  <CardDescription>
                    Track your submitted expenses and their status
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="reimbursed">Reimbursed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={categoryFilter}
                    onValueChange={setCategoryFilter}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{expense.title}</div>
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {expense.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {categories.find((c) => c.id === expense.category)
                            ?.name || expense.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono">
                        {expense.currency} {expense.amount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {format(expense.date, "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(expense.status)}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(expense.status)}
                            {expense.status.charAt(0).toUpperCase() +
                              expense.status.slice(1)}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {expense.status === "draft" && (
                          <Button
                            size="sm"
                            onClick={() => handleSubmitExpense(expense.id)}
                          >
                            Submit
                          </Button>
                        )}
                        {expense.status === "rejected" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSubmitExpense(expense.id)}
                          >
                            Resubmit
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approvals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Approvals</CardTitle>
              <CardDescription>Expenses awaiting your approval</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvalExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">
                        {expense.employeeName}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{expense.title}</div>
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {expense.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">
                        {expense.currency} {expense.amount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {format(expense.date, "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>
                        {expense.submittedAt &&
                          format(expense.submittedAt, "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Approve
                          </Button>
                          <Button size="sm" variant="outline">
                            <XCircle className="mr-1 h-3 w-3" />
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
