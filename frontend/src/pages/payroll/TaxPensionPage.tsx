import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  listTaxRates,
  createTaxRate,
  updateTaxRate,
  deleteTaxRate,
  listPensionRates,
  createPensionRate,
  updatePensionRate,
  deletePensionRate,
  type TaxRate,
  type PensionRate,
} from "@/services/tax-pension";
import { toast } from "sonner";
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  Percent,
  DollarSign,
} from "lucide-react";

const TaxPensionPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("payroll.process");
  const canView = hasPermission("payroll.view");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [pensionRates, setPensionRates] = useState<PensionRate[]>([]);

  const [showTaxDialog, setShowTaxDialog] = useState(false);
  const [showPensionDialog, setShowPensionDialog] = useState(false);
  const [showDeleteTaxDialog, setShowDeleteTaxDialog] = useState(false);
  const [showDeletePensionDialog, setShowDeletePensionDialog] = useState(false);
  const [selectedTax, setSelectedTax] = useState<TaxRate | null>(null);
  const [selectedPension, setSelectedPension] = useState<PensionRate | null>(null);

  const [taxForm, setTaxForm] = useState({
    minIncome: "",
    maxIncome: "",
    rate: "",
    fixedAmount: "",
    year: new Date().getFullYear().toString(),
    description: "",
    isActive: true,
  });

  const [pensionForm, setPensionForm] = useState({
    employeeRate: "",
    employerRate: "",
    year: new Date().getFullYear().toString(),
    description: "",
    isActive: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [taxData, pensionData] = await Promise.all([
        listTaxRates({ pageSize: 1000 }),
        listPensionRates({ pageSize: 1000 }),
      ]);
      setTaxRates(taxData.items || []);
      setPensionRates(pensionData.items || []);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to load tax/pension rates");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTaxRate = async () => {
    if (!taxForm.minIncome || !taxForm.rate || !taxForm.year) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setSubmitting(true);
      if (selectedTax) {
        await updateTaxRate(selectedTax.id, {
          minIncome: Number(taxForm.minIncome),
          maxIncome: taxForm.maxIncome ? Number(taxForm.maxIncome) : null,
          rate: Number(taxForm.rate),
          fixedAmount: taxForm.fixedAmount ? Number(taxForm.fixedAmount) : null,
          description: taxForm.description,
          isActive: taxForm.isActive,
        });
        toast.success("Tax rate updated successfully");
      } else {
        await createTaxRate({
          minIncome: Number(taxForm.minIncome),
          maxIncome: taxForm.maxIncome ? Number(taxForm.maxIncome) : null,
          rate: Number(taxForm.rate),
          fixedAmount: taxForm.fixedAmount ? Number(taxForm.fixedAmount) : null,
          year: Number(taxForm.year),
          description: taxForm.description,
          isActive: taxForm.isActive,
        });
        toast.success("Tax rate created successfully");
      }
      setShowTaxDialog(false);
      resetTaxForm();
      loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to save tax rate");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSavePensionRate = async () => {
    if (!pensionForm.employeeRate || !pensionForm.employerRate || !pensionForm.year) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setSubmitting(true);
      if (selectedPension) {
        await updatePensionRate(selectedPension.id, {
          employeeRate: Number(pensionForm.employeeRate),
          employerRate: Number(pensionForm.employerRate),
          description: pensionForm.description,
          isActive: pensionForm.isActive,
        });
        toast.success("Pension rate updated successfully");
      } else {
        await createPensionRate({
          employeeRate: Number(pensionForm.employeeRate),
          employerRate: Number(pensionForm.employerRate),
          year: Number(pensionForm.year),
          description: pensionForm.description,
          isActive: pensionForm.isActive,
        });
        toast.success("Pension rate created successfully");
      }
      setShowPensionDialog(false);
      resetPensionForm();
      loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to save pension rate");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTaxRate = async () => {
    if (!selectedTax) return;
    try {
      await deleteTaxRate(selectedTax.id);
      toast.success("Tax rate deleted successfully");
      setShowDeleteTaxDialog(false);
      setSelectedTax(null);
      loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete tax rate");
    }
  };

  const handleDeletePensionRate = async () => {
    if (!selectedPension) return;
    try {
      await deletePensionRate(selectedPension.id);
      toast.success("Pension rate deleted successfully");
      setShowDeletePensionDialog(false);
      setSelectedPension(null);
      loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete pension rate");
    }
  };

  const resetTaxForm = () => {
    setTaxForm({
      minIncome: "",
      maxIncome: "",
      rate: "",
      fixedAmount: "",
      year: new Date().getFullYear().toString(),
      description: "",
      isActive: true,
    });
    setSelectedTax(null);
  };

  const resetPensionForm = () => {
    setPensionForm({
      employeeRate: "",
      employerRate: "",
      year: new Date().getFullYear().toString(),
      description: "",
      isActive: true,
    });
    setSelectedPension(null);
  };

  if (!canView) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">You don't have permission to view tax/pension rates.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tax & Pension Rates</h1>
          <p className="text-gray-600 mt-1">Configure tax brackets and pension contribution rates</p>
        </div>
      </div>

      <Tabs defaultValue="tax" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tax">Tax Rates</TabsTrigger>
          <TabsTrigger value="pension">Pension Rates</TabsTrigger>
        </TabsList>

        <TabsContent value="tax">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Tax Rate Brackets</CardTitle>
                  <CardDescription>Income tax brackets for payroll calculation</CardDescription>
                </div>
                {canManage && (
                  <Button
                    onClick={() => {
                      resetTaxForm();
                      setShowTaxDialog(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Tax Bracket
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Year</TableHead>
                    <TableHead>Min Income</TableHead>
                    <TableHead>Max Income</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Fixed Amount</TableHead>
                    <TableHead>Status</TableHead>
                    {canManage && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={canManage ? 7 : 6} className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : taxRates.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={canManage ? 7 : 6} className="text-center py-8 text-gray-500">
                        No tax rates found
                      </TableCell>
                    </TableRow>
                  ) : (
                    taxRates
                      .sort((a, b) => {
                        if (a.year !== b.year) return b.year - a.year;
                        return a.minIncome - b.minIncome;
                      })
                      .map((rate) => (
                        <TableRow key={rate.id}>
                          <TableCell>{rate.year}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3 text-gray-400" />
                              {rate.minIncome.toLocaleString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            {rate.maxIncome ? (
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3 text-gray-400" />
                                {rate.maxIncome.toLocaleString()}
                              </div>
                            ) : (
                              "Above"
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Percent className="h-3 w-3 text-gray-400" />
                              {rate.rate}%
                            </div>
                          </TableCell>
                          <TableCell>
                            {rate.fixedAmount ? (
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3 text-gray-400" />
                                {rate.fixedAmount.toLocaleString()}
                              </div>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={rate.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                              {rate.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          {canManage && (
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedTax(rate);
                                    setTaxForm({
                                      minIncome: rate.minIncome.toString(),
                                      maxIncome: rate.maxIncome ? rate.maxIncome.toString() : "",
                                      rate: rate.rate.toString(),
                                      fixedAmount: rate.fixedAmount ? rate.fixedAmount.toString() : "",
                                      year: rate.year.toString(),
                                      description: rate.description || "",
                                      isActive: rate.isActive,
                                    });
                                    setShowTaxDialog(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedTax(rate);
                                    setShowDeleteTaxDialog(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pension">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Pension Rates</CardTitle>
                  <CardDescription>Employee and employer contribution rates</CardDescription>
                </div>
                {canManage && (
                  <Button
                    onClick={() => {
                      resetPensionForm();
                      setShowPensionDialog(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Pension Rate
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Year</TableHead>
                    <TableHead>Employee Rate</TableHead>
                    <TableHead>Employer Rate</TableHead>
                    <TableHead>Status</TableHead>
                    {canManage && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={canManage ? 5 : 4} className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : pensionRates.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={canManage ? 5 : 4} className="text-center py-8 text-gray-500">
                        No pension rates found
                      </TableCell>
                    </TableRow>
                  ) : (
                    pensionRates
                      .sort((a, b) => b.year - a.year)
                      .map((rate) => (
                        <TableRow key={rate.id}>
                          <TableCell>{rate.year}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Percent className="h-3 w-3 text-blue-600" />
                              {rate.employeeRate}%
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Percent className="h-3 w-3 text-green-600" />
                              {rate.employerRate}%
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={rate.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                              {rate.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          {canManage && (
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedPension(rate);
                                    setPensionForm({
                                      employeeRate: rate.employeeRate.toString(),
                                      employerRate: rate.employerRate.toString(),
                                      year: rate.year.toString(),
                                      description: rate.description || "",
                                      isActive: rate.isActive,
                                    });
                                    setShowPensionDialog(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedPension(rate);
                                    setShowDeletePensionDialog(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Tax Rate Dialog */}
      <Dialog open={showTaxDialog} onOpenChange={(open) => {
        setShowTaxDialog(open);
        if (!open) resetTaxForm();
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedTax ? "Edit" : "Create"} Tax Bracket</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="taxYear">Year *</Label>
                <Input
                  id="taxYear"
                  type="number"
                  value={taxForm.year}
                  onChange={(e) => setTaxForm({ ...taxForm, year: e.target.value })}
                  disabled={!!selectedTax}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxRate">Rate (%) *</Label>
                <Input
                  id="taxRate"
                  type="number"
                  step="0.01"
                  value={taxForm.rate}
                  onChange={(e) => setTaxForm({ ...taxForm, rate: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minIncome">Min Income (ETB) *</Label>
                <Input
                  id="minIncome"
                  type="number"
                  step="0.01"
                  value={taxForm.minIncome}
                  onChange={(e) => setTaxForm({ ...taxForm, minIncome: e.target.value })}
                  disabled={!!selectedTax}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxIncome">Max Income (ETB)</Label>
                <Input
                  id="maxIncome"
                  type="number"
                  step="0.01"
                  value={taxForm.maxIncome}
                  onChange={(e) => setTaxForm({ ...taxForm, maxIncome: e.target.value })}
                  placeholder="Leave empty for highest bracket"
                  disabled={!!selectedTax}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fixedAmount">Fixed Amount (ETB)</Label>
              <Input
                id="fixedAmount"
                type="number"
                step="0.01"
                value={taxForm.fixedAmount}
                onChange={(e) => setTaxForm({ ...taxForm, fixedAmount: e.target.value })}
                placeholder="Optional fixed tax amount"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxDescription">Description</Label>
              <Textarea
                id="taxDescription"
                value={taxForm.description}
                onChange={(e) => setTaxForm({ ...taxForm, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="taxIsActive"
                checked={taxForm.isActive}
                onCheckedChange={(checked) => setTaxForm({ ...taxForm, isActive: checked })}
              />
              <Label htmlFor="taxIsActive">Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTaxDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTaxRate} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                selectedTax ? "Update" : "Create"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Pension Rate Dialog */}
      <Dialog open={showPensionDialog} onOpenChange={(open) => {
        setShowPensionDialog(open);
        if (!open) resetPensionForm();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedPension ? "Edit" : "Create"} Pension Rate</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pensionYear">Year *</Label>
              <Input
                id="pensionYear"
                type="number"
                value={pensionForm.year}
                onChange={(e) => setPensionForm({ ...pensionForm, year: e.target.value })}
                disabled={!!selectedPension}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employeeRate">Employee Rate (%) *</Label>
                <Input
                  id="employeeRate"
                  type="number"
                  step="0.01"
                  value={pensionForm.employeeRate}
                  onChange={(e) => setPensionForm({ ...pensionForm, employeeRate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employerRate">Employer Rate (%) *</Label>
                <Input
                  id="employerRate"
                  type="number"
                  step="0.01"
                  value={pensionForm.employerRate}
                  onChange={(e) => setPensionForm({ ...pensionForm, employerRate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pensionDescription">Description</Label>
              <Textarea
                id="pensionDescription"
                value={pensionForm.description}
                onChange={(e) => setPensionForm({ ...pensionForm, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="pensionIsActive"
                checked={pensionForm.isActive}
                onCheckedChange={(checked) => setPensionForm({ ...pensionForm, isActive: checked })}
              />
              <Label htmlFor="pensionIsActive">Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPensionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePensionRate} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                selectedPension ? "Update" : "Create"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Tax Rate Confirmation */}
      <Dialog open={showDeleteTaxDialog} onOpenChange={setShowDeleteTaxDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Tax Rate</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this tax rate? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteTaxDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteTaxRate}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Pension Rate Confirmation */}
      <Dialog open={showDeletePensionDialog} onOpenChange={setShowDeletePensionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Pension Rate</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this pension rate? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeletePensionDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeletePensionRate}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TaxPensionPage;

