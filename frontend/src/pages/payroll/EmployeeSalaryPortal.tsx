import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  listPayrollRuns,
  listPayrollItems,
  getPayslipData,
  downloadPayslip,
  generatePayslip,
  getPayrollRun,
  type PayrollItem,
} from "@/services/payroll-runs";
import {
  listLoans,
  type Loan,
} from "@/services/loans";
import {
  listAdvances,
  type Advance,
} from "@/services/advances";
import { toast } from "sonner";
import {
  Download,
  FileText,
  DollarSign,
  Loader2,
  Calendar,
  TrendingUp,
  Eye,
} from "lucide-react";
import { format } from "date-fns";

const EmployeeSalaryPortal: React.FC = () => {
  const { user } = useAuth();
  const employeeId = user?.employeeId;

  const [loading, setLoading] = useState(true);
  const [payrollItems, setPayrollItems] = useState<PayrollItem[]>([]);
  const [payrollRunsMap, setPayrollRunsMap] = useState<Map<string, any>>(new Map());
  const [loans, setLoans] = useState<Loan[]>([]);
  const [advances, setAdvances] = useState<Advance[]>([]);

  useEffect(() => {
    if (employeeId) {
      loadData();
    }
  }, [employeeId]);

  const loadData = async () => {
    if (!employeeId) return;

    try {
      setLoading(true);
      
      // Get payroll runs to find items
      const runs = await listPayrollRuns({ page: 1, pageSize: 100 });
      
      // Get items for all runs, including run info
      const allItemsWithRuns: Array<{ item: PayrollItem; run: any }> = [];
      for (const run of runs.items) {
        try {
          const itemsData = await listPayrollItems({ payrollRunId: run.id, employeeId, pageSize: 1000 });
          itemsData.items.forEach((item) => {
            allItemsWithRuns.push({ item, run });
          });
        } catch (err) {
          // Skip if error loading items for this run
        }
      }

      // Sort by period start (newest first)
      allItemsWithRuns.sort((a, b) => {
        return new Date(b.run.periodStart).getTime() - new Date(a.run.periodStart).getTime();
      });

      // Store items with run info attached
      setPayrollItems(allItemsWithRuns.map(({ item }) => item));
      
      // Store runs map for display
      const runsMap = new Map(runs.items.map((r) => [r.id, r]));
      setPayrollRunsMap(runsMap);

      // Load loans and advances
      const [loansData, advancesData] = await Promise.all([
        listLoans({ employeeId, pageSize: 1000 }),
        listAdvances({ employeeId, pageSize: 1000 }),
      ]);
      
      setLoans(loansData.items || []);
      setAdvances(advancesData.items || []);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to load salary information");
    } finally {
      setLoading(false);
    }
  };

  const handleViewPayslip = async (item: PayrollItem) => {
    try {
      if (!item.payslipGenerated) {
        await generatePayslip(item.id);
        toast.success("Payslip generated successfully");
        loadData();
      } else {
        const data = await getPayslipData(item.id);
        // For now, just download - in a real app, you might show a modal
        await downloadPayslip(item.id);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to generate/view payslip");
    }
  };

  const handleDownloadPayslip = async (itemId: string) => {
    try {
      await downloadPayslip(itemId);
      toast.success("Payslip downloaded successfully");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to download payslip");
    }
  };

  if (!employeeId) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">
              Employee information not available. Please contact your administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Calculate summary stats
  const totalGross = payrollItems.reduce((sum, item) => sum + item.grossSalary, 0);
  const totalNet = payrollItems.reduce((sum, item) => sum + item.netSalary, 0);
  const activeLoans = loans.filter((l) => l.status === "ACTIVE");
  const pendingAdvances = advances.filter((a) => a.status === "PENDING" || a.status === "APPROVED");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Salary & Benefits</h1>
        <p className="text-gray-600 mt-1">View your salary history, payslips, loans, and advances</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Gross</p>
                <p className="text-2xl font-bold">ETB {totalGross.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">All time</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Net</p>
                <p className="text-2xl font-bold text-green-600">ETB {totalNet.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">All time</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Loans</p>
                <p className="text-2xl font-bold">{activeLoans.length}</p>
                <p className="text-xs text-gray-500 mt-1">
                  ETB {activeLoans.reduce((sum, l) => sum + l.remainingAmount, 0).toLocaleString()} remaining
                </p>
              </div>
              <FileText className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Advances</p>
                <p className="text-2xl font-bold">{pendingAdvances.length}</p>
                <p className="text-xs text-gray-500 mt-1">
                  ETB {pendingAdvances.reduce((sum, a) => sum + a.remainingAmount, 0).toLocaleString()} remaining
                </p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="salary" className="space-y-4">
        <TabsList>
          <TabsTrigger value="salary">Salary History</TabsTrigger>
          <TabsTrigger value="payslips">Payslips</TabsTrigger>
          <TabsTrigger value="loans">Loans</TabsTrigger>
          <TabsTrigger value="advances">Advances</TabsTrigger>
        </TabsList>

        <TabsContent value="salary">
          <Card>
            <CardHeader>
              <CardTitle>Salary History</CardTitle>
              <CardDescription>Your payroll records</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead>Gross Salary</TableHead>
                    <TableHead>Deductions</TableHead>
                    <TableHead>Net Salary</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrollItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        No salary records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    payrollItems.map((item) => {
                      const run = payrollRunsMap.get(item.payrollRunId);
                      const periodText = run
                        ? `${format(new Date(run.periodStart), "MMM dd")} - ${format(new Date(run.periodEnd), "MMM dd, yyyy")}`
                        : `Payroll ${item.id.slice(0, 8)}`;
                      
                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span>{periodText}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">ETB {item.grossSalary.toLocaleString()}</div>
                          </TableCell>
                          <TableCell>ETB {item.totalDeductions.toLocaleString()}</TableCell>
                          <TableCell>
                            <div className="font-bold text-green-600">
                              ETB {item.netSalary.toLocaleString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-800">Processed</Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payslips">
          <Card>
            <CardHeader>
              <CardTitle>Payslips</CardTitle>
              <CardDescription>Download your payslips</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead>Net Salary</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrollItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                        No payslips available
                      </TableCell>
                    </TableRow>
                  ) : (
                    payrollItems.map((item) => {
                      const run = payrollRunsMap.get(item.payrollRunId);
                      const periodText = run
                        ? `${format(new Date(run.periodStart), "MMM dd")} - ${format(new Date(run.periodEnd), "MMM dd, yyyy")}`
                        : `Payroll ${item.id.slice(0, 8)}`;
                      
                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span>{periodText}</span>
                            </div>
                          </TableCell>
                        <TableCell>
                          <div className="font-medium">ETB {item.netSalary.toLocaleString()}</div>
                        </TableCell>
                        <TableCell>
                          {item.payslipGenerated ? (
                            <Badge className="bg-green-100 text-green-800">Available</Badge>
                          ) : (
                            <Badge variant="outline">Not Generated</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.payslipGenerated ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadPayslip(item.id)}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewPayslip(item)}
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Generate
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="loans">
          <Card>
            <CardHeader>
              <CardTitle>My Loans</CardTitle>
              <CardDescription>Loan details and repayment history</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Loan Amount</TableHead>
                    <TableHead>Interest Rate</TableHead>
                    <TableHead>Remaining</TableHead>
                    <TableHead>Monthly Payment</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loans.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        No loans found
                      </TableCell>
                    </TableRow>
                  ) : (
                    loans.map((loan) => (
                      <TableRow key={loan.id}>
                        <TableCell>ETB {loan.loanAmount.toLocaleString()}</TableCell>
                        <TableCell>{loan.interestRate}%</TableCell>
                        <TableCell>
                          <div className="font-medium text-red-600">
                            ETB {loan.remainingAmount.toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>ETB {loan.monthlyPayment.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              loan.status === "ACTIVE"
                                ? "bg-green-100 text-green-800"
                                : loan.status === "COMPLETED"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                            }
                          >
                            {loan.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advances">
          <Card>
            <CardHeader>
              <CardTitle>My Advances</CardTitle>
              <CardDescription>Advance details and repayment history</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Requested Amount</TableHead>
                    <TableHead>Remaining</TableHead>
                    <TableHead>Monthly Deduction</TableHead>
                    <TableHead>Request Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {advances.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        No advances found
                      </TableCell>
                    </TableRow>
                  ) : (
                    advances.map((advance) => (
                      <TableRow key={advance.id}>
                        <TableCell>ETB {advance.requestedAmount.toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="font-medium text-red-600">
                            ETB {advance.remainingAmount.toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>ETB {advance.monthlyDeduction.toLocaleString()}</TableCell>
                        <TableCell>
                          {format(new Date(advance.requestDate), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              advance.status === "PENDING"
                                ? "bg-yellow-100 text-yellow-800"
                                : advance.status === "APPROVED"
                                ? "bg-blue-100 text-blue-800"
                                : advance.status === "REPAID"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }
                          >
                            {advance.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmployeeSalaryPortal;

