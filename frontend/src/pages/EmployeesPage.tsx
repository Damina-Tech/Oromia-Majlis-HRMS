import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow } from
'@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger } from
'@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from
'@/components/ui/select';
import { useEffect, useMemo, useState } from 'react';
import { Api } from '@/services/api';
import {
  Search,
  Plus,
  Filter,
  Download,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Edit,
  Trash2,
  Eye } from
'lucide-react';

const EmployeesPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [emps, depts] = await Promise.all([
          Api.employees.list(),
          Api.departments.list()
        ]);
        if (!mounted) return;
        setEmployees(emps);
        setDepartments(depts);
      } catch (e) {
        // ignore for now; could add toast
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const filteredEmployees = useMemo(() => employees.filter((employee) => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment = departmentFilter === 'all' || employee.department === departmentFilter;
    const matchesStatus = statusFilter === 'all' || employee.status === statusFilter;

    return matchesSearch && matchesDepartment && matchesStatus;
  }), [employees, searchTerm, departmentFilter, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':return 'bg-green-100 text-green-800';
      case 'inactive':return 'bg-red-100 text-red-800';
      case 'on-leave':return 'bg-yellow-100 text-yellow-800';
      default:return 'bg-gray-100 text-gray-800';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase();
  };

  return (
    <div className="space-y-6" data-id="j45vul2fq" data-path="src/pages/EmployeesPage.tsx">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4" data-id="zw1quag7k" data-path="src/pages/EmployeesPage.tsx">
        <div data-id="rih5r5klr" data-path="src/pages/EmployeesPage.tsx">
          <h1 className="text-3xl font-bold text-gray-900" data-id="52k5o77n9" data-path="src/pages/EmployeesPage.tsx">Employee Management</h1>
          <p className="text-gray-600 mt-1" data-id="kfoqv92sg" data-path="src/pages/EmployeesPage.tsx">Manage and view employee information</p>
        </div>
        
        {hasPermission('employees.write') &&
        <div className="flex gap-2" data-id="at5omyyg0" data-path="src/pages/EmployeesPage.tsx">
            <Button variant="outline" data-id="zkn8s5uj8" data-path="src/pages/EmployeesPage.tsx">
              <Download className="h-4 w-4 mr-2" data-id="53oxfa100" data-path="src/pages/EmployeesPage.tsx" />
              Export
            </Button>
            <Button data-id="d6b7tgzym" data-path="src/pages/EmployeesPage.tsx">
              <Plus className="h-4 w-4 mr-2" data-id="h7i35ap3x" data-path="src/pages/EmployeesPage.tsx" />
              Add Employee
            </Button>
          </div>
        }
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6" data-id="osf3e5ga9" data-path="src/pages/EmployeesPage.tsx">
        <Card data-id="1jk9d9fek" data-path="src/pages/EmployeesPage.tsx">
          <CardContent className="p-6" data-id="44o1ud7tl" data-path="src/pages/EmployeesPage.tsx">
            <div className="flex items-center justify-between" data-id="80jxmgx7k" data-path="src/pages/EmployeesPage.tsx">
              <div data-id="365ep2taa" data-path="src/pages/EmployeesPage.tsx">
                <p className="text-sm font-medium text-gray-600" data-id="5tgks2sj3" data-path="src/pages/EmployeesPage.tsx">Total Employees</p>
                <p className="text-2xl font-bold" data-id="ha13ak5gw" data-path="src/pages/EmployeesPage.tsx">{employees.length}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center" data-id="zi9hm0qhj" data-path="src/pages/EmployeesPage.tsx">
                <Calendar className="h-6 w-6 text-blue-600" data-id="nztewes0u" data-path="src/pages/EmployeesPage.tsx" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-id="xk8fgcqnn" data-path="src/pages/EmployeesPage.tsx">
          <CardContent className="p-6" data-id="2ef4zmslu" data-path="src/pages/EmployeesPage.tsx">
            <div className="flex items-center justify-between" data-id="hbwbh0go3" data-path="src/pages/EmployeesPage.tsx">
              <div data-id="3t812kd14" data-path="src/pages/EmployeesPage.tsx">
                <p className="text-sm font-medium text-gray-600" data-id="n9rqchj5a" data-path="src/pages/EmployeesPage.tsx">Active</p>
                <p className="text-2xl font-bold" data-id="984loi5x1" data-path="src/pages/EmployeesPage.tsx">
                  {employees.filter((e) => e.status === 'active').length}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center" data-id="uphfd6y38" data-path="src/pages/EmployeesPage.tsx">
                <Calendar className="h-6 w-6 text-green-600" data-id="p6euk6p4o" data-path="src/pages/EmployeesPage.tsx" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-id="dfod8w99c" data-path="src/pages/EmployeesPage.tsx">
          <CardContent className="p-6" data-id="quvcytri1" data-path="src/pages/EmployeesPage.tsx">
            <div className="flex items-center justify-between" data-id="8eqb2x1bb" data-path="src/pages/EmployeesPage.tsx">
              <div data-id="eqh1slcg3" data-path="src/pages/EmployeesPage.tsx">
                <p className="text-sm font-medium text-gray-600" data-id="bji1r19ki" data-path="src/pages/EmployeesPage.tsx">On Leave</p>
                <p className="text-2xl font-bold" data-id="5yr6bqy0c" data-path="src/pages/EmployeesPage.tsx">
                  {employees.filter((e) => e.status === 'on-leave').length}
                </p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center" data-id="7y5y5a12q" data-path="src/pages/EmployeesPage.tsx">
                <Calendar className="h-6 w-6 text-yellow-600" data-id="lymrefvtf" data-path="src/pages/EmployeesPage.tsx" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-id="e5occw85i" data-path="src/pages/EmployeesPage.tsx">
          <CardContent className="p-6" data-id="cla0w8z9l" data-path="src/pages/EmployeesPage.tsx">
            <div className="flex items-center justify-between" data-id="begp9rmwl" data-path="src/pages/EmployeesPage.tsx">
              <div data-id="p57gg2ayq" data-path="src/pages/EmployeesPage.tsx">
                <p className="text-sm font-medium text-gray-600" data-id="ytt0vxv3p" data-path="src/pages/EmployeesPage.tsx">Departments</p>
                <p className="text-2xl font-bold" data-id="nz9w26jm7" data-path="src/pages/EmployeesPage.tsx">{departments.length}</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center" data-id="ryzt2oeb6" data-path="src/pages/EmployeesPage.tsx">
                <Calendar className="h-6 w-6 text-purple-600" data-id="pescqnmjf" data-path="src/pages/EmployeesPage.tsx" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card data-id="17vn8gxlf" data-path="src/pages/EmployeesPage.tsx">
        <CardHeader data-id="no4xepguy" data-path="src/pages/EmployeesPage.tsx">
          <CardTitle data-id="wlc75p9bp" data-path="src/pages/EmployeesPage.tsx">Employee Directory</CardTitle>
          <CardDescription data-id="a30x1u5dp" data-path="src/pages/EmployeesPage.tsx">Search and filter employees</CardDescription>
        </CardHeader>
        <CardContent data-id="nf2gjivr8" data-path="src/pages/EmployeesPage.tsx">
          <div className="flex flex-col sm:flex-row gap-4 mb-6" data-id="86ayriwey" data-path="src/pages/EmployeesPage.tsx">
            <div className="relative flex-1" data-id="fj3cfjixe" data-path="src/pages/EmployeesPage.tsx">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" data-id="p0jfbnkwq" data-path="src/pages/EmployeesPage.tsx" />
              <Input
                placeholder="Search by name, email, or employee ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10" data-id="rwcs44g4t" data-path="src/pages/EmployeesPage.tsx" />

            </div>
            
            <Select value={departmentFilter} onValueChange={setDepartmentFilter} data-id="47d64zyue" data-path="src/pages/EmployeesPage.tsx">
              <SelectTrigger className="w-full sm:w-48" data-id="zwmm3lp14" data-path="src/pages/EmployeesPage.tsx">
                <SelectValue placeholder="Department" data-id="9g1ldmop5" data-path="src/pages/EmployeesPage.tsx" />
              </SelectTrigger>
              <SelectContent data-id="ddkvx0iac" data-path="src/pages/EmployeesPage.tsx">
                <SelectItem value="all" data-id="hk29kvob7" data-path="src/pages/EmployeesPage.tsx">All Departments</SelectItem>
                {departments.map((dept) =>
                <SelectItem key={dept.id} value={dept.name} data-id="5bb1fyfl3" data-path="src/pages/EmployeesPage.tsx">
                    {dept.name}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter} data-id="61l2jhc9e" data-path="src/pages/EmployeesPage.tsx">
              <SelectTrigger className="w-full sm:w-48" data-id="t4jg8bq6f" data-path="src/pages/EmployeesPage.tsx">
                <SelectValue placeholder="Status" data-id="e1tav821f" data-path="src/pages/EmployeesPage.tsx" />
              </SelectTrigger>
              <SelectContent data-id="5ocum8y0w" data-path="src/pages/EmployeesPage.tsx">
                <SelectItem value="all" data-id="vgbm9i5t9" data-path="src/pages/EmployeesPage.tsx">All Status</SelectItem>
                <SelectItem value="active" data-id="rphbvx6lp" data-path="src/pages/EmployeesPage.tsx">Active</SelectItem>
                <SelectItem value="inactive" data-id="q7xbhkzar" data-path="src/pages/EmployeesPage.tsx">Inactive</SelectItem>
                <SelectItem value="on-leave" data-id="kw2mwstuz" data-path="src/pages/EmployeesPage.tsx">On Leave</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" data-id="7n814cdop" data-path="src/pages/EmployeesPage.tsx">
              <Filter className="h-4 w-4 mr-2" data-id="prv6i6ocs" data-path="src/pages/EmployeesPage.tsx" />
              More Filters
            </Button>
          </div>

          {/* Employee Table */}
          <div className="border rounded-lg" data-id="79bzjcd05" data-path="src/pages/EmployeesPage.tsx">
            <Table data-id="fy1zpdl3z" data-path="src/pages/EmployeesPage.tsx">
              <TableHeader data-id="m47lthzhp" data-path="src/pages/EmployeesPage.tsx">
                <TableRow data-id="efmcgajon" data-path="src/pages/EmployeesPage.tsx">
                  <TableHead data-id="jwz0b7sx3" data-path="src/pages/EmployeesPage.tsx">Employee</TableHead>
                  <TableHead data-id="vn8z2wze2" data-path="src/pages/EmployeesPage.tsx">Department</TableHead>
                  <TableHead data-id="iu7zrbdj6" data-path="src/pages/EmployeesPage.tsx">Status</TableHead>
                  <TableHead data-id="ze7v331rl" data-path="src/pages/EmployeesPage.tsx">Joining Date</TableHead>
                  <TableHead data-id="bskp8ypmv" data-path="src/pages/EmployeesPage.tsx">Contact</TableHead>
                  <TableHead data-id="p92jmwoxp" data-path="src/pages/EmployeesPage.tsx">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody data-id="qpwobkjma" data-path="src/pages/EmployeesPage.tsx">
                {filteredEmployees.map((employee) =>
                <TableRow key={employee.id} data-id="4hiewevjv" data-path="src/pages/EmployeesPage.tsx">
                    <TableCell data-id="ixyauz8s0" data-path="src/pages/EmployeesPage.tsx">
                      <div className="flex items-center space-x-3" data-id="cvv0e3ne5" data-path="src/pages/EmployeesPage.tsx">
                        <Avatar data-id="u7aqcdi07" data-path="src/pages/EmployeesPage.tsx">
                          <AvatarFallback className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white" data-id="oj413i0sw" data-path="src/pages/EmployeesPage.tsx">
                            {getInitials(employee.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div data-id="p9psbei6g" data-path="src/pages/EmployeesPage.tsx">
                          <p className="font-medium" data-id="cbq6o0g5b" data-path="src/pages/EmployeesPage.tsx">{employee.name}</p>
                          <p className="text-sm text-gray-500" data-id="3yb77pbjz" data-path="src/pages/EmployeesPage.tsx">{employee.designation}</p>
                          <p className="text-xs text-gray-400" data-id="i1ffnbi1g" data-path="src/pages/EmployeesPage.tsx">{employee.employeeId}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell data-id="28my6ofhd" data-path="src/pages/EmployeesPage.tsx">
                      <Badge variant="outline" data-id="jr4pa6k5k" data-path="src/pages/EmployeesPage.tsx">{employee.department}</Badge>
                    </TableCell>
                    <TableCell data-id="y8muv5y5e" data-path="src/pages/EmployeesPage.tsx">
                      <Badge className={getStatusColor(employee.status)} data-id="7gh5hws9y" data-path="src/pages/EmployeesPage.tsx">
                        {employee.status}
                      </Badge>
                    </TableCell>
                    <TableCell data-id="2s71fbmum" data-path="src/pages/EmployeesPage.tsx">
                      {new Date(employee.joiningDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell data-id="47vygnxky" data-path="src/pages/EmployeesPage.tsx">
                      <div className="space-y-1" data-id="pxlh087y6" data-path="src/pages/EmployeesPage.tsx">
                        <div className="flex items-center text-sm text-gray-600" data-id="lgtcw8hbq" data-path="src/pages/EmployeesPage.tsx">
                          <Mail className="h-3 w-3 mr-2" data-id="v9mprkbfa" data-path="src/pages/EmployeesPage.tsx" />
                          {employee.email}
                        </div>
                        <div className="flex items-center text-sm text-gray-600" data-id="wddakud2y" data-path="src/pages/EmployeesPage.tsx">
                          <Phone className="h-3 w-3 mr-2" data-id="jnioxvz0g" data-path="src/pages/EmployeesPage.tsx" />
                          {employee.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell data-id="ppspfoii3" data-path="src/pages/EmployeesPage.tsx">
                      <div className="flex items-center space-x-2" data-id="4nnhhffko" data-path="src/pages/EmployeesPage.tsx">
                        <Dialog data-id="j0kfny4w2" data-path="src/pages/EmployeesPage.tsx">
                          <DialogTrigger asChild data-id="oos8epea1" data-path="src/pages/EmployeesPage.tsx">
                            <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedEmployee(employee)} data-id="551tyajlc" data-path="src/pages/EmployeesPage.tsx">

                              <Eye className="h-4 w-4" data-id="xbiw26ii3" data-path="src/pages/EmployeesPage.tsx" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl" data-id="g04qhqtu1" data-path="src/pages/EmployeesPage.tsx">
                            <DialogHeader data-id="nldi79m6o" data-path="src/pages/EmployeesPage.tsx">
                              <DialogTitle data-id="ba2toixz1" data-path="src/pages/EmployeesPage.tsx">Employee Details</DialogTitle>
                              <DialogDescription data-id="pjd9bgyk7" data-path="src/pages/EmployeesPage.tsx">
                                Complete information for {selectedEmployee?.name}
                              </DialogDescription>
                            </DialogHeader>
                            {selectedEmployee &&
                          <div className="grid grid-cols-2 gap-6 py-4" data-id="tfaug9kcn" data-path="src/pages/EmployeesPage.tsx">
                                <div className="space-y-4" data-id="kx5nwdfim" data-path="src/pages/EmployeesPage.tsx">
                                  <div data-id="mjd266a95" data-path="src/pages/EmployeesPage.tsx">
                                    <h4 className="font-medium text-gray-900" data-id="2n7dzsedm" data-path="src/pages/EmployeesPage.tsx">Personal Information</h4>
                                    <div className="mt-2 space-y-2 text-sm" data-id="3visobg8a" data-path="src/pages/EmployeesPage.tsx">
                                      <p data-id="g8e4x2t5w" data-path="src/pages/EmployeesPage.tsx"><span className="font-medium" data-id="kf5gscm6z" data-path="src/pages/EmployeesPage.tsx">Name:</span> {selectedEmployee.name}</p>
                                      <p data-id="z5koy4wjy" data-path="src/pages/EmployeesPage.tsx"><span className="font-medium" data-id="73sy6q0vd" data-path="src/pages/EmployeesPage.tsx">Email:</span> {selectedEmployee.email}</p>
                                      <p data-id="7ws92g59x" data-path="src/pages/EmployeesPage.tsx"><span className="font-medium" data-id="gagtjte00" data-path="src/pages/EmployeesPage.tsx">Phone:</span> {selectedEmployee.phone}</p>
                                      <p data-id="34ogs3a77" data-path="src/pages/EmployeesPage.tsx"><span className="font-medium" data-id="xko9nu5dd" data-path="src/pages/EmployeesPage.tsx">Address:</span> {selectedEmployee.address}</p>
                                      <p data-id="z50awe4oa" data-path="src/pages/EmployeesPage.tsx"><span className="font-medium" data-id="0v6vt12q5" data-path="src/pages/EmployeesPage.tsx">Emergency Contact:</span> {selectedEmployee.emergencyContact}</p>
                                    </div>
                                  </div>
                                </div>
                                <div className="space-y-4" data-id="f9rjx7vqq" data-path="src/pages/EmployeesPage.tsx">
                                  <div data-id="55na8551g" data-path="src/pages/EmployeesPage.tsx">
                                    <h4 className="font-medium text-gray-900" data-id="iz3j2cs9w" data-path="src/pages/EmployeesPage.tsx">Professional Information</h4>
                                    <div className="mt-2 space-y-2 text-sm" data-id="v8x4falma" data-path="src/pages/EmployeesPage.tsx">
                                      <p data-id="u7zan5b6n" data-path="src/pages/EmployeesPage.tsx"><span className="font-medium" data-id="fh31dwtf6" data-path="src/pages/EmployeesPage.tsx">Employee ID:</span> {selectedEmployee.employeeId}</p>
                                      <p data-id="siuo2fw48" data-path="src/pages/EmployeesPage.tsx"><span className="font-medium" data-id="zwyo8dg2p" data-path="src/pages/EmployeesPage.tsx">Department:</span> {selectedEmployee.department}</p>
                                      <p data-id="xho3byyid" data-path="src/pages/EmployeesPage.tsx"><span className="font-medium" data-id="83muit8wk" data-path="src/pages/EmployeesPage.tsx">Designation:</span> {selectedEmployee.designation}</p>
                                      <p data-id="4z0g9brgp" data-path="src/pages/EmployeesPage.tsx"><span className="font-medium" data-id="idfhy8941" data-path="src/pages/EmployeesPage.tsx">Manager:</span> {selectedEmployee.manager || 'N/A'}</p>
                                      <p data-id="a5tnx1niq" data-path="src/pages/EmployeesPage.tsx"><span className="font-medium" data-id="9gkxcey1v" data-path="src/pages/EmployeesPage.tsx">Joining Date:</span> {new Date(selectedEmployee.joiningDate).toLocaleDateString()}</p>
                                      <p data-id="w5u9foqwc" data-path="src/pages/EmployeesPage.tsx"><span className="font-medium" data-id="nmzpbxbnk" data-path="src/pages/EmployeesPage.tsx">Salary:</span> ${selectedEmployee.salary.toLocaleString()}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                          }
                          </DialogContent>
                        </Dialog>
                        
                        {hasPermission('employees.write') &&
                      <>
                            <Button variant="ghost" size="sm" data-id="8kiogibeo" data-path="src/pages/EmployeesPage.tsx">
                              <Edit className="h-4 w-4" data-id="1z8xnzwpk" data-path="src/pages/EmployeesPage.tsx" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" data-id="0i4fbuzce" data-path="src/pages/EmployeesPage.tsx">
                              <Trash2 className="h-4 w-4" data-id="xkbdennfm" data-path="src/pages/EmployeesPage.tsx" />
                            </Button>
                          </>
                      }
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {filteredEmployees.length === 0 &&
          <div className="text-center py-8" data-id="nh4jejl5j" data-path="src/pages/EmployeesPage.tsx">
              <p className="text-gray-500" data-id="vghtx3cbg" data-path="src/pages/EmployeesPage.tsx">No employees found matching your criteria.</p>
            </div>
          }
        </CardContent>
      </Card>
    </div>);

};

export default EmployeesPage;