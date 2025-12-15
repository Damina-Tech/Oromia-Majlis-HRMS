import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter } from
'@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  listDepartments, 
  getDepartment, 
  createDepartment, 
  updateDepartment, 
  deleteDepartment,
  type Department 
} from '@/services/departments';
import { listEmployees, type Employee } from '@/services/employees';
import { listUsers, type User } from '@/services/users';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  Building2,
  Users,
  Plus,
  Edit,
  Search,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Trash2,
  AlertCircle,
  Loader2 } from
'lucide-react';

const OrganizationPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [selectedDeptEmployees, setSelectedDeptEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [deletingDepartment, setDeletingDepartment] = useState<Department | null>(null);
  const [newDeptName, setNewDeptName] = useState('');
  const [selectedManagerId, setSelectedManagerId] = useState<string>('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canWrite = hasPermission("departments.write");

  // Load departments and employees
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [depts, emps, usersResponse] = await Promise.all([
        listDepartments(),
        listEmployees({ page: 1, pageSize: 1000 }),
        listUsers({ status: 'ACTIVE', page: 1, pageSize: 1000 }) // Only fetch active users
      ]);
      setDepartments(depts);
      setAllEmployees(emps.items);
      
      // Get active users from response
      const activeUsers = usersResponse.items.filter(user => user.status === 'ACTIVE');
      const managerIds = new Set(depts.map(d => d.managerId).filter(Boolean));
      
      setAllUsers(activeUsers.map(user => ({
        ...user,
        isManager: managerIds.has(user.id)
      })));
    } catch (err) {
      toast.error('Failed to load organization data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredDepartments = departments.filter((dept) =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDepartmentEmployees = (departmentId: string) => {
    return allEmployees.filter((emp) => emp.departmentId === departmentId);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const handleViewDepartment = async (dept: Department) => {
    setSelectedDepartment(dept);
    const employees = getDepartmentEmployees(dept.id);
    setSelectedDeptEmployees(employees);
  };

  const handleAddDepartment = async () => {
    if (!newDeptName.trim()) {
      setError('Department name is required');
      return;
    }

    if (!selectedManagerId) {
      setError('Department manager is required');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await createDepartment({ 
        name: newDeptName.trim(),
        managerId: selectedManagerId
      });
      toast.success(`Department "${newDeptName}" created successfully!`);
      setShowAddDialog(false);
      setNewDeptName('');
      setSelectedManagerId('');
      await loadData();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to create department';
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditDepartment = async () => {
    if (!editingDepartment || !newDeptName.trim()) {
      setError('Department name is required');
      return;
    }

    if (!selectedManagerId) {
      setError('Department manager is required');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await updateDepartment(editingDepartment.id, { 
        name: newDeptName.trim(),
        managerId: selectedManagerId
      });
      toast.success(`Department updated successfully!`);
      setShowEditDialog(false);
      setEditingDepartment(null);
      setNewDeptName('');
      setSelectedManagerId('');
      await loadData();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to update department';
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (dept: Department) => {
    const employeeCount = getDepartmentEmployees(dept.id).length;
    
    if (employeeCount > 0) {
      toast.error(`Cannot delete "${dept.name}" with ${employeeCount} employee(s). Please reassign employees first.`);
      return;
    }

    setDeletingDepartment(dept);
    setShowDeleteDialog(true);
  };

  const handleDeleteDepartment = async () => {
    if (!deletingDepartment) return;

    try {
      setDeleting(true);
      await deleteDepartment(deletingDepartment.id);
      toast.success(`Department "${deletingDepartment.name}" deleted successfully!`);
      setShowDeleteDialog(false);
      setDeletingDepartment(null);
      await loadData();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to delete department';
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  const openEditDialog = (dept: Department) => {
    setEditingDepartment(dept);
    setNewDeptName(dept.name);
    setSelectedManagerId(dept.managerId || '');
    setShowEditDialog(true);
    setError('');
  };

  const totalEmployees = allEmployees.length;
  const largestDept = departments.reduce((max, dept) => {
    const count = getDepartmentEmployees(dept.id).length;
    const maxCount = max ? getDepartmentEmployees(max.id).length : 0;
    return count > maxCount ? dept : max;
  }, departments[0]);
  const avgTeamSize = departments.length > 0 ? Math.round(totalEmployees / departments.length) : 0;

  // Color palette for departments - subtle, distinct colors
  const departmentColors = [
    { bg: 'from-blue-50 to-blue-100', border: 'border-blue-300', accent: 'bg-blue-500', stroke: '#3b82f6' },
    { bg: 'from-green-50 to-green-100', border: 'border-green-300', accent: 'bg-green-500', stroke: '#10b981' },
    { bg: 'from-purple-50 to-purple-100', border: 'border-purple-300', accent: 'bg-purple-500', stroke: '#a855f7' },
    { bg: 'from-orange-50 to-orange-100', border: 'border-orange-300', accent: 'bg-orange-500', stroke: '#f97316' },
    { bg: 'from-pink-50 to-pink-100', border: 'border-pink-300', accent: 'bg-pink-500', stroke: '#ec4899' },
    { bg: 'from-cyan-50 to-cyan-100', border: 'border-cyan-300', accent: 'bg-cyan-500', stroke: '#06b6d4' },
    { bg: 'from-indigo-50 to-indigo-100', border: 'border-indigo-300', accent: 'bg-indigo-500', stroke: '#6366f1' },
    { bg: 'from-teal-50 to-teal-100', border: 'border-teal-300', accent: 'bg-teal-500', stroke: '#14b8a6' },
    { bg: 'from-amber-50 to-amber-100', border: 'border-amber-300', accent: 'bg-amber-500', stroke: '#f59e0b' },
    { bg: 'from-rose-50 to-rose-100', border: 'border-rose-300', accent: 'bg-rose-500', stroke: '#f43f5e' },
    { bg: 'from-emerald-50 to-emerald-100', border: 'border-emerald-300', accent: 'bg-emerald-500', stroke: '#059669' },
    { bg: 'from-violet-50 to-violet-100', border: 'border-violet-300', accent: 'bg-violet-500', stroke: '#8b5cf6' },
  ];

  const getDepartmentColor = (index: number) => {
    return departmentColors[index % departmentColors.length];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Organization Structure</h1>
          <p className="text-gray-600 mt-1">Manage departments and organizational hierarchy</p>
        </div>
        
        {canWrite && (
          <Button onClick={() => { 
            setShowAddDialog(true); 
            setError(''); 
            setNewDeptName(''); 
            setSelectedManagerId(''); 
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Department
          </Button>
        )}
      </div>

      {/* Organization Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Departments</p>
                <p className="text-2xl font-bold">{departments.length}</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Employees</p>
                <p className="text-2xl font-bold">{totalEmployees}</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Largest Department</p>
                <p className="text-lg font-bold">{largestDept?.name || 'N/A'}</p>
                <p className="text-sm text-gray-500">
                  {largestDept ? getDepartmentEmployees(largestDept.id).length : 0} employees
                </p>
              </div>
              <Briefcase className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Team Size</p>
                <p className="text-2xl font-bold">{avgTeamSize}</p>
                <p className="text-sm text-gray-500">employees per dept</p>
              </div>
              <Users className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search departments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Organization Chart Visual */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Hierarchy</CardTitle>
          <CardDescription>Visual representation of company structure</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative flex flex-col items-center py-6">
            {/* CEO Level */}
            <div className="relative z-20 bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-5 rounded-lg text-center shadow-lg min-w-[200px]">
              <h3 className="font-bold text-lg">Mayor Office</h3>
              <p className="text-sm opacity-90">City Administration</p>
            </div>
            
            {/* Connecting Lines Container */}
            {filteredDepartments.length > 0 && (
              <div className="relative w-full flex justify-center" style={{ height: '60px', marginTop: '-10px', marginBottom: '-10px' }}>
                {/* Main vertical line from Mayor Office */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-0.5 h-full bg-blue-500" style={{ 
                  backgroundImage: 'linear-gradient(to bottom, #3b82f6, transparent)',
                  backgroundSize: '100% 50%',
                  backgroundRepeat: 'no-repeat'
                }}></div>
                
                {/* Horizontal connector line */}
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-blue-500 opacity-30"></div>
                
                {/* Individual department connection lines */}
                <div className="absolute top-1/2 left-0 right-0 h-0.5">
                  {filteredDepartments.map((dept, index) => {
                    const totalCols = Math.min(filteredDepartments.length, 4);
                    const colIndex = index % totalCols;
                    const colsPerRow = totalCols;
                    const leftPercent = colsPerRow === 1 
                      ? 50 
                      : 20 + (colIndex * (60 / Math.max(colsPerRow - 1, 1)));
                    const deptColor = getDepartmentColor(index);
                    
                    return (
                      <div
                        key={dept.id}
                        className="absolute"
                        style={{
                          left: `${leftPercent}%`,
                          transform: 'translateX(-50%)',
                        }}
                      >
                        {/* Vertical line down to department */}
                        <div 
                          className="w-0.5 bg-gradient-to-b"
                          style={{
                            height: '60px',
                            background: `linear-gradient(to bottom, ${deptColor.stroke}, transparent)`,
                            opacity: 0.6
                          }}
                        ></div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Department Heads Level */}
            <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-4 w-full mt-4">
              {filteredDepartments.map((dept, index) => {
                const employeeCount = getDepartmentEmployees(dept.id).length;
                const deptColor = getDepartmentColor(index);
                return (
                  <div
                    key={dept.id}
                    className={`bg-gradient-to-br ${deptColor.bg} border-2 ${deptColor.border} p-4 rounded-lg text-center cursor-pointer hover:shadow-md transition-all transform hover:scale-105 relative overflow-hidden`}
                    onClick={() => handleViewDepartment(dept)}
                  >
                    {/* Accent bar at top */}
                    <div className={`absolute top-0 left-0 right-0 h-1.5 ${deptColor.accent}`}></div>
                    <h4 className="font-semibold text-gray-800 mt-1">{dept.name}</h4>
                    <Badge variant="secondary" className="mt-2 bg-white/70">
                      {employeeCount} employee{employeeCount !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDepartments.map((department, index) => {
          const employees = getDepartmentEmployees(department.id);
          const deptColor = getDepartmentColor(index);

          return (
            <Card 
              key={department.id} 
              className={`hover:shadow-lg transition-all transform hover:scale-[1.02] border-2 ${deptColor.border} bg-gradient-to-br ${deptColor.bg} relative overflow-hidden`}
            >
              {/* Accent bar at top */}
              <div className={`absolute top-0 left-0 right-0 h-1.5 ${deptColor.accent}`}></div>
              
              <CardHeader className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                  <CardTitle className="text-lg text-gray-800">{department.name}</CardTitle>
                    {department.manager && (
                      <p className="text-sm text-gray-600 mt-1">
                        Manager: {department.manager.firstName} {department.manager.lastName}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline" className="bg-white/50">{employees.length} member{employees.length !== 1 ? 's' : ''}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {/* Employee Avatars */}
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-700">Team Members</p>
                  <div className="flex flex-wrap gap-2">
                    {employees.slice(0, 8).map((employee) => (
                      <Avatar key={employee.id} className="h-8 w-8 border-2 border-white shadow-sm" title={`${employee.firstName} ${employee.lastName}`}>
                        <AvatarFallback className={`${deptColor.accent} text-white text-xs`}>
                          {getInitials(employee.firstName, employee.lastName)}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {employees.length > 8 && (
                      <div className={`h-8 w-8 ${deptColor.accent} rounded-full flex items-center justify-center text-xs font-medium text-white border-2 border-white shadow-sm`}>
                        +{employees.length - 8}
                      </div>
                    )}
                    {employees.length === 0 && (
                      <p className="text-sm text-gray-500">No employees</p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleViewDepartment(department)}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    View Team
                  </Button>
                  {canWrite && (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openEditDialog(department)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteClick(department)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          );

        })}
      </div>

      {/* Department Details Modal */}
      {selectedDepartment && (
        <Dialog open={!!selectedDepartment} onOpenChange={() => setSelectedDepartment(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{selectedDepartment.name} Department</DialogTitle>
              <DialogDescription>Department details and team members</DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Department Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Team Size</p>
                      <p className="font-semibold">{selectedDeptEmployees.length} employee{selectedDeptEmployees.length !== 1 ? 's' : ''}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Department Manager</p>
                      {selectedDepartment.manager ? (
                        <div>
                          <p className="font-semibold">{selectedDepartment.manager.firstName} {selectedDepartment.manager.lastName}</p>
                          <p className="text-sm text-gray-500">{selectedDepartment.manager.email}</p>
                          {selectedDepartment.manager.employee?.designation && (
                            <p className="text-xs text-gray-400">{selectedDepartment.manager.employee.designation}</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No manager assigned</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Status</p>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Team Members</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedDeptEmployees.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">No employees in this department</p>
                    ) : (
                      <div className="space-y-3">
                        {selectedDeptEmployees.map((employee) => (
                          <div key={employee.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            <Avatar>
                              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                                {getInitials(employee.firstName, employee.lastName)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-medium">{employee.firstName} {employee.lastName}</p>
                              <p className="text-sm text-gray-500">{employee.designation || 'No designation'}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">{employee.email}</p>
                              <p className="text-xs text-gray-500">{employee.phone || 'No phone'}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Department Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => { setShowAddDialog(open); if (!open) setError(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Department</DialogTitle>
            <DialogDescription>Create a new department in the organization</DialogDescription>
          </DialogHeader>
          
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="dept-name">Department Name</Label>
              <Input
                id="dept-name"
                value={newDeptName}
                onChange={(e) => { setNewDeptName(e.target.value); setError(''); }}
                placeholder="e.g., Human Resources"
                disabled={submitting}
              />
            </div>
            <div>
              <Label htmlFor="dept-manager">Department Manager *</Label>
              <Select
                value={selectedManagerId}
                onValueChange={(value) => {
                  setSelectedManagerId(value);
                  setError('');
                }}
                disabled={submitting}
                required
              >
                <SelectTrigger id="dept-manager" className={!selectedManagerId && error ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select a manager" />
                </SelectTrigger>
                <SelectContent>
                  {allUsers.map((user: User & { isManager?: boolean }) => {
                    // In add dialog, disable users who are already managers
                    const isOtherManager = user.isManager;
                    
                    return (
                      <SelectItem 
                        key={user.id} 
                        value={user.id}
                        disabled={isOtherManager}
                        className={isOtherManager ? "opacity-50" : ""}
                      >
                        {user.firstName} {user.lastName} {user.employee?.designation ? `(${user.employee.designation})` : ''}
                        {isOtherManager && " - Already managing another department"}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {!selectedManagerId && error && error.includes('manager') && (
                <p className="text-sm text-red-500 mt-1">This field is required</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleAddDepartment} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Department
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Department Dialog */}
      <Dialog open={showEditDialog} onOpenChange={(open) => { setShowEditDialog(open); if (!open) setError(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
            <DialogDescription>Update department information</DialogDescription>
          </DialogHeader>
          
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-dept-name">Department Name</Label>
              <Input
                id="edit-dept-name"
                value={newDeptName}
                onChange={(e) => { setNewDeptName(e.target.value); setError(''); }}
                placeholder="e.g., Human Resources"
                disabled={submitting}
              />
            </div>
            <div>
              <Label htmlFor="edit-dept-manager">Department Manager *</Label>
              <Select
                value={selectedManagerId}
                onValueChange={(value) => {
                  setSelectedManagerId(value);
                  setError('');
                }}
                disabled={submitting}
                required
              >
                <SelectTrigger id="edit-dept-manager" className={!selectedManagerId && error ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select a manager" />
                </SelectTrigger>
                <SelectContent>
                  {allUsers.map((user: User & { isManager?: boolean }) => {
                    // When editing, allow current manager to be selected even if they manage another dept
                    const isCurrentManager = editingDepartment?.managerId === user.id;
                    const isOtherManager = user.isManager && !isCurrentManager;
                    
                    return (
                      <SelectItem 
                        key={user.id} 
                        value={user.id}
                        disabled={isOtherManager}
                        className={isOtherManager ? "opacity-50" : ""}
                      >
                        {user.firstName} {user.lastName} {user.employee?.designation ? `(${user.employee.designation})` : ''}
                        {isOtherManager && " - Already managing another department"}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {!selectedManagerId && error && error.includes('manager') && (
                <p className="text-sm text-red-500 mt-1">This field is required</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleEditDepartment} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Department Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={(open) => { 
        setShowDeleteDialog(open); 
        if (!open) {
          setDeletingDepartment(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Department</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the <span className="font-bold">"{deletingDepartment?.name}"</span> department? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This will permanently delete the department. Make sure there are no employees assigned to this department.
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowDeleteDialog(false);
                setDeletingDepartment(null);
              }} 
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteDepartment} 
              disabled={deleting}
            >
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete Department
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrganizationPage;
