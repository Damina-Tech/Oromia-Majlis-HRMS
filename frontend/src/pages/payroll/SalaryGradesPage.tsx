import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  listSalaryGrades,
  createSalaryGrade,
  updateSalaryGrade,
  deleteSalaryGrade,
  listSalarySteps,
  createSalaryStep,
  updateSalaryStep,
  deleteSalaryStep,
  type SalaryGrade,
  type SalaryStep,
} from "@/services/salary-grades";
import { toast } from "sonner";
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  DollarSign,
  Layers,
} from "lucide-react";

const SalaryGradesPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("payroll.process");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [grades, setGrades] = useState<SalaryGrade[]>([]);
  const [steps, setSteps] = useState<SalaryStep[]>([]);

  const [showGradeDialog, setShowGradeDialog] = useState(false);
  const [showStepDialog, setShowStepDialog] = useState(false);
  const [showDeleteGradeDialog, setShowDeleteGradeDialog] = useState(false);
  const [showDeleteStepDialog, setShowDeleteStepDialog] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<SalaryGrade | null>(null);
  const [selectedStep, setSelectedStep] = useState<SalaryStep | null>(null);
  const [stepGradeId, setStepGradeId] = useState<string>("");

  const [gradeForm, setGradeForm] = useState({
    name: "",
    code: "",
    description: "",
    minSalary: "",
    maxSalary: "",
  });

  const [stepForm, setStepForm] = useState({
    gradeId: "",
    stepNumber: "",
    salary: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [gradesData, stepsData] = await Promise.all([
        listSalaryGrades(),
        listSalarySteps(),
      ]);
      setGrades(gradesData);
      setSteps(stepsData);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to load salary grades");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGrade = async () => {
    if (!gradeForm.name || !gradeForm.code || !gradeForm.minSalary || !gradeForm.maxSalary) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setSubmitting(true);
      if (selectedGrade) {
        await updateSalaryGrade(selectedGrade.id, {
          name: gradeForm.name,
          code: gradeForm.code,
          description: gradeForm.description,
          minSalary: Number(gradeForm.minSalary),
          maxSalary: Number(gradeForm.maxSalary),
        });
        toast.success("Salary grade updated successfully");
      } else {
        await createSalaryGrade({
          name: gradeForm.name,
          code: gradeForm.code,
          description: gradeForm.description,
          minSalary: Number(gradeForm.minSalary),
          maxSalary: Number(gradeForm.maxSalary),
        });
        toast.success("Salary grade created successfully");
      }
      setShowGradeDialog(false);
      resetGradeForm();
      loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to save salary grade");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateStep = async () => {
    if (!stepForm.gradeId || !stepForm.stepNumber || !stepForm.salary) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setSubmitting(true);
      if (selectedStep) {
        await updateSalaryStep(selectedStep.id, {
          stepNumber: Number(stepForm.stepNumber),
          salary: Number(stepForm.salary),
        });
        toast.success("Salary step updated successfully");
      } else {
        await createSalaryStep({
          gradeId: stepForm.gradeId,
          stepNumber: Number(stepForm.stepNumber),
          salary: Number(stepForm.salary),
        });
        toast.success("Salary step created successfully");
      }
      setShowStepDialog(false);
      resetStepForm();
      loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to save salary step");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditGrade = (grade: SalaryGrade) => {
    setSelectedGrade(grade);
    setGradeForm({
      name: grade.name,
      code: grade.code,
      description: grade.description || "",
      minSalary: grade.minSalary.toString(),
      maxSalary: grade.maxSalary.toString(),
    });
    setShowGradeDialog(true);
  };

  const handleEditStep = (step: SalaryStep) => {
    setSelectedStep(step);
    setStepForm({
      gradeId: step.gradeId,
      stepNumber: step.stepNumber.toString(),
      salary: step.salary.toString(),
    });
    setShowStepDialog(true);
  };

  const handleDeleteGrade = async () => {
    if (!selectedGrade) return;
    try {
      await deleteSalaryGrade(selectedGrade.id);
      toast.success("Salary grade deleted successfully");
      setShowDeleteGradeDialog(false);
      setSelectedGrade(null);
      loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete salary grade");
    }
  };

  const handleDeleteStep = async () => {
    if (!selectedStep) return;
    try {
      await deleteSalaryStep(selectedStep.id);
      toast.success("Salary step deleted successfully");
      setShowDeleteStepDialog(false);
      setSelectedStep(null);
      loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete salary step");
    }
  };

  const resetGradeForm = () => {
    setGradeForm({ name: "", code: "", description: "", minSalary: "", maxSalary: "" });
    setSelectedGrade(null);
  };

  const resetStepForm = () => {
    setStepForm({ gradeId: stepGradeId || "", stepNumber: "", salary: "" });
    setSelectedStep(null);
  };

  const getStepsForGrade = (gradeId: string) => {
    return steps.filter((s) => s.gradeId === gradeId).sort((a, b) => a.stepNumber - b.stepNumber);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Salary Grades & Steps</h1>
          <p className="text-gray-600 mt-1">Manage salary structure and progression</p>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <Button onClick={() => {
              resetGradeForm();
              setShowGradeDialog(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Grade
            </Button>
          </div>
        )}
      </div>

      <Tabs defaultValue="grades" className="space-y-4">
        <TabsList>
          <TabsTrigger value="grades">Salary Grades</TabsTrigger>
          <TabsTrigger value="steps">Salary Steps</TabsTrigger>
        </TabsList>

        <TabsContent value="grades" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Salary Grades</CardTitle>
              <CardDescription>Salary grade structure and ranges</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Salary Range</TableHead>
                    <TableHead>Steps</TableHead>
                    <TableHead>Description</TableHead>
                    {canManage && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grades.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={canManage ? 6 : 5} className="text-center py-8 text-gray-500">
                        No salary grades found
                      </TableCell>
                    </TableRow>
                  ) : (
                    grades.map((grade) => (
                      <TableRow key={grade.id}>
                        <TableCell className="font-medium">{grade.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{grade.code}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3 text-gray-400" />
                            <span>
                              ETB {grade.minSalary.toLocaleString()} - ETB{" "}
                              {grade.maxSalary.toLocaleString()}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge>{getStepsForGrade(grade.id).length} steps</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {grade.description || "—"}
                        </TableCell>
                        {canManage && (
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditGrade(grade)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedGrade(grade);
                                  setShowDeleteGradeDialog(true);
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

        <TabsContent value="steps" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Salary Steps</CardTitle>
                  <CardDescription>Individual salary steps within grades</CardDescription>
                </div>
                {canManage && (
                  <Button
                    onClick={() => {
                      resetStepForm();
                      setShowStepDialog(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Step
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Grade</TableHead>
                    <TableHead>Step Number</TableHead>
                    <TableHead>Salary</TableHead>
                    {canManage && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {steps.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={canManage ? 4 : 3} className="text-center py-8 text-gray-500">
                        No salary steps found
                      </TableCell>
                    </TableRow>
                  ) : (
                    steps
                      .sort((a, b) => {
                        const gradeA = grades.find((g) => g.id === a.gradeId);
                        const gradeB = grades.find((g) => g.id === b.gradeId);
                        if (gradeA && gradeB) {
                          if (gradeA.code !== gradeB.code) {
                            return gradeA.code.localeCompare(gradeB.code);
                          }
                        }
                        return a.stepNumber - b.stepNumber;
                      })
                      .map((step) => {
                        const grade = grades.find((g) => g.id === step.gradeId);
                        return (
                          <TableRow key={step.id}>
                            <TableCell>
                              <Badge variant="outline">{grade?.code || "—"}</Badge>
                            </TableCell>
                            <TableCell>{step.stepNumber}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3 text-green-600" />
                                <span className="font-medium">
                                  ETB {step.salary.toLocaleString()}
                                </span>
                              </div>
                            </TableCell>
                            {canManage && (
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditStep(step)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedStep(step);
                                      setShowDeleteStepDialog(true);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  </Button>
                                </div>
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Grade Dialog */}
      <Dialog open={showGradeDialog} onOpenChange={(open) => {
        setShowGradeDialog(open);
        if (!open) resetGradeForm();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedGrade ? "Edit" : "Create"} Salary Grade</DialogTitle>
            <DialogDescription>
              {selectedGrade ? "Update" : "Create a new"} salary grade structure
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={gradeForm.name}
                  onChange={(e) => setGradeForm({ ...gradeForm, name: e.target.value })}
                  placeholder="e.g., Grade 1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  value={gradeForm.code}
                  onChange={(e) => setGradeForm({ ...gradeForm, code: e.target.value })}
                  placeholder="e.g., G1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minSalary">Min Salary (ETB) *</Label>
                <Input
                  id="minSalary"
                  type="number"
                  step="0.01"
                  value={gradeForm.minSalary}
                  onChange={(e) => setGradeForm({ ...gradeForm, minSalary: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxSalary">Max Salary (ETB) *</Label>
                <Input
                  id="maxSalary"
                  type="number"
                  step="0.01"
                  value={gradeForm.maxSalary}
                  onChange={(e) => setGradeForm({ ...gradeForm, maxSalary: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={gradeForm.description}
                onChange={(e) => setGradeForm({ ...gradeForm, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGradeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateGrade} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                selectedGrade ? "Update" : "Create"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Step Dialog */}
      <Dialog open={showStepDialog} onOpenChange={(open) => {
        setShowStepDialog(open);
        if (!open) resetStepForm();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedStep ? "Edit" : "Create"} Salary Step</DialogTitle>
            <DialogDescription>
              {selectedStep ? "Update" : "Create a new"} salary step
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="stepGradeId">Grade *</Label>
              <select
                id="stepGradeId"
                value={stepForm.gradeId}
                onChange={(e) => {
                  setStepForm({ ...stepForm, gradeId: e.target.value });
                  setStepGradeId(e.target.value);
                }}
                disabled={!!selectedStep}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select a grade</option>
                {grades.map((grade) => (
                  <option key={grade.id} value={grade.id}>
                    {grade.code} - {grade.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stepNumber">Step Number *</Label>
                <Input
                  id="stepNumber"
                  type="number"
                  value={stepForm.stepNumber}
                  onChange={(e) => setStepForm({ ...stepForm, stepNumber: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salary">Salary (ETB) *</Label>
                <Input
                  id="salary"
                  type="number"
                  step="0.01"
                  value={stepForm.salary}
                  onChange={(e) => setStepForm({ ...stepForm, salary: e.target.value })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStepDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateStep} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                selectedStep ? "Update" : "Create"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Grade Confirmation */}
      <Dialog open={showDeleteGradeDialog} onOpenChange={setShowDeleteGradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Salary Grade</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this salary grade? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedGrade && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm">
                <div>
                  <span className="text-gray-600">Name:</span>{" "}
                  <span className="font-medium">{selectedGrade.name}</span>
                </div>
                <div>
                  <span className="text-gray-600">Code:</span>{" "}
                  <span className="font-medium">{selectedGrade.code}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteGradeDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteGrade}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Step Confirmation */}
      <Dialog open={showDeleteStepDialog} onOpenChange={setShowDeleteStepDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Salary Step</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this salary step? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedStep && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm">
                <div>
                  <span className="text-gray-600">Step Number:</span>{" "}
                  <span className="font-medium">{selectedStep.stepNumber}</span>
                </div>
                <div>
                  <span className="text-gray-600">Salary:</span>{" "}
                  <span className="font-medium">ETB {selectedStep.salary.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteStepDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteStep}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalaryGradesPage;

