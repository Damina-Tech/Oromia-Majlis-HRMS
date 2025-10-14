import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger } from
'@/components/ui/dialog';
import { mockDepartments, mockEmployees } from '@/services/mockData';
import {
  Building2,
  Users,
  Plus,
  Edit,
  Search,
  Mail,
  Phone,
  MapPin,
  Briefcase } from
'lucide-react';

const OrganizationPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<any>(null);

  const filteredDepartments = mockDepartments.filter((dept) =>
  dept.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDepartmentEmployees = (departmentName: string) => {
    return mockEmployees.filter((emp) => emp.department === departmentName);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase();
  };

  return (
    <div className="space-y-6" data-id="orajpu125" data-path="src/pages/OrganizationPage.tsx">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4" data-id="76xujvyzy" data-path="src/pages/OrganizationPage.tsx">
        <div data-id="a9hugma3z" data-path="src/pages/OrganizationPage.tsx">
          <h1 className="text-3xl font-bold text-gray-900" data-id="22ljc0zwu" data-path="src/pages/OrganizationPage.tsx">Organization Structure</h1>
          <p className="text-gray-600 mt-1" data-id="w9uy91qaq" data-path="src/pages/OrganizationPage.tsx">Manage departments and organizational hierarchy</p>
        </div>
        
        <div className="flex gap-2" data-id="ve6vvfscu" data-path="src/pages/OrganizationPage.tsx">
          <Button variant="outline" data-id="6rdzkqway" data-path="src/pages/OrganizationPage.tsx">
            <Plus className="h-4 w-4 mr-2" data-id="isxul3kzj" data-path="src/pages/OrganizationPage.tsx" />
            Add Department
          </Button>
          <Button data-id="cl862ujrn" data-path="src/pages/OrganizationPage.tsx">
            <Building2 className="h-4 w-4 mr-2" data-id="yg576parl" data-path="src/pages/OrganizationPage.tsx" />
            View Org Chart
          </Button>
        </div>
      </div>

      {/* Organization Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6" data-id="z89xjkhwt" data-path="src/pages/OrganizationPage.tsx">
        <Card data-id="937ncv3zv" data-path="src/pages/OrganizationPage.tsx">
          <CardContent className="p-6" data-id="egaz47lli" data-path="src/pages/OrganizationPage.tsx">
            <div className="flex items-center justify-between" data-id="qei3p7f54" data-path="src/pages/OrganizationPage.tsx">
              <div data-id="1mho9k2qg" data-path="src/pages/OrganizationPage.tsx">
                <p className="text-sm font-medium text-gray-600" data-id="s4ovz1ubr" data-path="src/pages/OrganizationPage.tsx">Total Departments</p>
                <p className="text-2xl font-bold" data-id="1b74jrkuu" data-path="src/pages/OrganizationPage.tsx">{mockDepartments.length}</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-600" data-id="z4kl3rrqd" data-path="src/pages/OrganizationPage.tsx" />
            </div>
          </CardContent>
        </Card>

        <Card data-id="9tktz71i5" data-path="src/pages/OrganizationPage.tsx">
          <CardContent className="p-6" data-id="nlliwigdo" data-path="src/pages/OrganizationPage.tsx">
            <div className="flex items-center justify-between" data-id="uli6qxdjn" data-path="src/pages/OrganizationPage.tsx">
              <div data-id="3g4bwrxvy" data-path="src/pages/OrganizationPage.tsx">
                <p className="text-sm font-medium text-gray-600" data-id="j9wwkits5" data-path="src/pages/OrganizationPage.tsx">Total Employees</p>
                <p className="text-2xl font-bold" data-id="kxzex9501" data-path="src/pages/OrganizationPage.tsx">{mockEmployees.length}</p>
              </div>
              <Users className="h-8 w-8 text-green-600" data-id="5033hhd4p" data-path="src/pages/OrganizationPage.tsx" />
            </div>
          </CardContent>
        </Card>

        <Card data-id="75guni2xp" data-path="src/pages/OrganizationPage.tsx">
          <CardContent className="p-6" data-id="i8dpkalma" data-path="src/pages/OrganizationPage.tsx">
            <div className="flex items-center justify-between" data-id="8qvwdzb2h" data-path="src/pages/OrganizationPage.tsx">
              <div data-id="o4zug9585" data-path="src/pages/OrganizationPage.tsx">
                <p className="text-sm font-medium text-gray-600" data-id="4tkf92hz9" data-path="src/pages/OrganizationPage.tsx">Largest Department</p>
                <p className="text-lg font-bold" data-id="07krky8fq" data-path="src/pages/OrganizationPage.tsx">Engineering</p>
                <p className="text-sm text-gray-500" data-id="6qi8hldtx" data-path="src/pages/OrganizationPage.tsx">25 employees</p>
              </div>
              <Briefcase className="h-8 w-8 text-purple-600" data-id="k3cno2y4x" data-path="src/pages/OrganizationPage.tsx" />
            </div>
          </CardContent>
        </Card>

        <Card data-id="v3rlowo23" data-path="src/pages/OrganizationPage.tsx">
          <CardContent className="p-6" data-id="p0ayz6zrp" data-path="src/pages/OrganizationPage.tsx">
            <div className="flex items-center justify-between" data-id="qnlhfls5u" data-path="src/pages/OrganizationPage.tsx">
              <div data-id="ng9r87r6t" data-path="src/pages/OrganizationPage.tsx">
                <p className="text-sm font-medium text-gray-600" data-id="8hunwi18a" data-path="src/pages/OrganizationPage.tsx">Average Team Size</p>
                <p className="text-2xl font-bold" data-id="95eyhk0jm" data-path="src/pages/OrganizationPage.tsx">12</p>
                <p className="text-sm text-gray-500" data-id="q1y4z8q6z" data-path="src/pages/OrganizationPage.tsx">employees per dept</p>
              </div>
              <Users className="h-8 w-8 text-orange-600" data-id="3end1z0zn" data-path="src/pages/OrganizationPage.tsx" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card data-id="rukeym9nj" data-path="src/pages/OrganizationPage.tsx">
        <CardContent className="p-6" data-id="jd4x3ca9a" data-path="src/pages/OrganizationPage.tsx">
          <div className="relative" data-id="p8q9po63k" data-path="src/pages/OrganizationPage.tsx">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" data-id="koqnxv9vm" data-path="src/pages/OrganizationPage.tsx" />
            <Input
              placeholder="Search departments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10" data-id="2zoa16jnk" data-path="src/pages/OrganizationPage.tsx" />

          </div>
        </CardContent>
      </Card>

      {/* Organization Chart Visual */}
      <Card data-id="rmspry0cp" data-path="src/pages/OrganizationPage.tsx">
        <CardHeader data-id="864gwwfbf" data-path="src/pages/OrganizationPage.tsx">
          <CardTitle data-id="m25nio721" data-path="src/pages/OrganizationPage.tsx">Organization Hierarchy</CardTitle>
          <CardDescription data-id="9r94tcqbr" data-path="src/pages/OrganizationPage.tsx">Visual representation of company structure</CardDescription>
        </CardHeader>
        <CardContent data-id="lwuxy7jyi" data-path="src/pages/OrganizationPage.tsx">
          <div className="flex flex-col items-center space-y-8" data-id="iii1x097u" data-path="src/pages/OrganizationPage.tsx">
            {/* CEO Level */}
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-4 rounded-lg text-center" data-id="78481yoky" data-path="src/pages/OrganizationPage.tsx">
              <h3 className="font-bold" data-id="e9rtsvx7q" data-path="src/pages/OrganizationPage.tsx">CEO / Managing Director</h3>
              <p className="text-sm opacity-90" data-id="smgioc1bp" data-path="src/pages/OrganizationPage.tsx">Executive Leadership</p>
            </div>
            
            {/* Department Heads Level */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" data-id="ofgibyh5g" data-path="src/pages/OrganizationPage.tsx">
              {mockDepartments.map((dept) =>
              <div
                key={dept.id}
                className="bg-gray-100 p-4 rounded-lg text-center cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={() => setSelectedDepartment(dept)} data-id="e093a8ycj" data-path="src/pages/OrganizationPage.tsx">

                  <h4 className="font-semibold" data-id="3jwcpyz8z" data-path="src/pages/OrganizationPage.tsx">{dept.name}</h4>
                  <p className="text-sm text-gray-600" data-id="8yhog5eeo" data-path="src/pages/OrganizationPage.tsx">{dept.head}</p>
                  <Badge variant="secondary" className="mt-2" data-id="684devc5m" data-path="src/pages/OrganizationPage.tsx">
                    {dept.employeeCount} employees
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-id="zv6wk1nua" data-path="src/pages/OrganizationPage.tsx">
        {filteredDepartments.map((department) => {
          const employees = getDepartmentEmployees(department.name);

          return (
            <Card key={department.id} className="hover:shadow-lg transition-shadow" data-id="s6hcbg3oh" data-path="src/pages/OrganizationPage.tsx">
              <CardHeader data-id="74srz47dc" data-path="src/pages/OrganizationPage.tsx">
                <div className="flex items-center justify-between" data-id="9y7gy5zq2" data-path="src/pages/OrganizationPage.tsx">
                  <CardTitle className="text-lg" data-id="wqf2g7m7l" data-path="src/pages/OrganizationPage.tsx">{department.name}</CardTitle>
                  <Badge variant="outline" data-id="bx5kax31h" data-path="src/pages/OrganizationPage.tsx">{employees.length} members</Badge>
                </div>
                <CardDescription data-id="pakg0jx78" data-path="src/pages/OrganizationPage.tsx">{department.description}</CardDescription>
              </CardHeader>
              <CardContent data-id="l9fmjlgfu" data-path="src/pages/OrganizationPage.tsx">
                {/* Department Head */}
                <div className="mb-4 p-3 bg-blue-50 rounded-lg" data-id="oxosozotp" data-path="src/pages/OrganizationPage.tsx">
                  <p className="text-sm font-medium text-blue-800" data-id="vvluudfby" data-path="src/pages/OrganizationPage.tsx">Department Head</p>
                  <p className="font-semibold" data-id="qgbotsj5b" data-path="src/pages/OrganizationPage.tsx">{department.head}</p>
                </div>

                {/* Employee Avatars */}
                <div className="space-y-3" data-id="854kcotrf" data-path="src/pages/OrganizationPage.tsx">
                  <p className="text-sm font-medium text-gray-700" data-id="epp1gflpv" data-path="src/pages/OrganizationPage.tsx">Team Members</p>
                  <div className="flex flex-wrap gap-2" data-id="mlt2cqu30" data-path="src/pages/OrganizationPage.tsx">
                    {employees.slice(0, 6).map((employee) =>
                    <Dialog key={employee.id} data-id="qdrbdogm9" data-path="src/pages/OrganizationPage.tsx">
                        <DialogTrigger asChild data-id="1txvlskq3" data-path="src/pages/OrganizationPage.tsx">
                          <div className="cursor-pointer" data-id="ljyvajck7" data-path="src/pages/OrganizationPage.tsx">
                            <Avatar className="h-8 w-8" data-id="0nuul2yco" data-path="src/pages/OrganizationPage.tsx">
                              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs" data-id="psisa2v5a" data-path="src/pages/OrganizationPage.tsx">
                                {getInitials(employee.name)}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        </DialogTrigger>
                        <DialogContent data-id="3vaixt68w" data-path="src/pages/OrganizationPage.tsx">
                          <DialogHeader data-id="d3wndzsen" data-path="src/pages/OrganizationPage.tsx">
                            <DialogTitle data-id="qcy0hx8da" data-path="src/pages/OrganizationPage.tsx">{employee.name}</DialogTitle>
                            <DialogDescription data-id="yogpj14p9" data-path="src/pages/OrganizationPage.tsx">{employee.designation}</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4" data-id="6pzt09545" data-path="src/pages/OrganizationPage.tsx">
                            <div className="flex items-center space-x-3" data-id="te4v41ztd" data-path="src/pages/OrganizationPage.tsx">
                              <Mail className="h-4 w-4 text-gray-400" data-id="rx9dv1c72" data-path="src/pages/OrganizationPage.tsx" />
                              <span className="text-sm" data-id="vdu7oaqs9" data-path="src/pages/OrganizationPage.tsx">{employee.email}</span>
                            </div>
                            <div className="flex items-center space-x-3" data-id="zm2501iw1" data-path="src/pages/OrganizationPage.tsx">
                              <Phone className="h-4 w-4 text-gray-400" data-id="vyvif1woo" data-path="src/pages/OrganizationPage.tsx" />
                              <span className="text-sm" data-id="zo76xga9s" data-path="src/pages/OrganizationPage.tsx">{employee.phone}</span>
                            </div>
                            <div className="flex items-center space-x-3" data-id="lw60zo61w" data-path="src/pages/OrganizationPage.tsx">
                              <Briefcase className="h-4 w-4 text-gray-400" data-id="gbh5cf2u1" data-path="src/pages/OrganizationPage.tsx" />
                              <span className="text-sm" data-id="e3etengjl" data-path="src/pages/OrganizationPage.tsx">{employee.department}</span>
                            </div>
                            <div className="flex items-center space-x-3" data-id="3zkfv7enw" data-path="src/pages/OrganizationPage.tsx">
                              <MapPin className="h-4 w-4 text-gray-400" data-id="9djt1w80d" data-path="src/pages/OrganizationPage.tsx" />
                              <span className="text-sm" data-id="h86fk7ej3" data-path="src/pages/OrganizationPage.tsx">Joined {new Date(employee.joiningDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                    {employees.length > 6 &&
                    <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium" data-id="qozrte3z6" data-path="src/pages/OrganizationPage.tsx">
                        +{employees.length - 6}
                      </div>
                    }
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex space-x-2" data-id="rftjbtzz4" data-path="src/pages/OrganizationPage.tsx">
                  <Button variant="outline" size="sm" className="flex-1" data-id="sygkqf731" data-path="src/pages/OrganizationPage.tsx">
                    <Users className="h-4 w-4 mr-2" data-id="fxqn5gu7n" data-path="src/pages/OrganizationPage.tsx" />
                    View Team
                  </Button>
                  <Button variant="outline" size="sm" data-id="pzp1qikii" data-path="src/pages/OrganizationPage.tsx">
                    <Edit className="h-4 w-4" data-id="ql7yhksy9" data-path="src/pages/OrganizationPage.tsx" />
                  </Button>
                </div>
              </CardContent>
            </Card>);

        })}
      </div>

      {/* Department Details Modal */}
      {selectedDepartment &&
      <Dialog open={!!selectedDepartment} onOpenChange={() => setSelectedDepartment(null)} data-id="tlf9q95ny" data-path="src/pages/OrganizationPage.tsx">
          <DialogContent className="max-w-4xl" data-id="unsseals3" data-path="src/pages/OrganizationPage.tsx">
            <DialogHeader data-id="ie3e3yxgq" data-path="src/pages/OrganizationPage.tsx">
              <DialogTitle data-id="x4k54z44r" data-path="src/pages/OrganizationPage.tsx">{selectedDepartment.name} Department</DialogTitle>
              <DialogDescription data-id="bpuivem9v" data-path="src/pages/OrganizationPage.tsx">{selectedDepartment.description}</DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" data-id="fdt6vyu6c" data-path="src/pages/OrganizationPage.tsx">
              <div className="lg:col-span-1" data-id="aobyoj9sn" data-path="src/pages/OrganizationPage.tsx">
                <Card data-id="vm11uegoh" data-path="src/pages/OrganizationPage.tsx">
                  <CardHeader data-id="2ji23fdf9" data-path="src/pages/OrganizationPage.tsx">
                    <CardTitle className="text-lg" data-id="d4sn8i4by" data-path="src/pages/OrganizationPage.tsx">Department Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4" data-id="mcincmd9c" data-path="src/pages/OrganizationPage.tsx">
                    <div data-id="770jeb7r0" data-path="src/pages/OrganizationPage.tsx">
                      <p className="text-sm font-medium text-gray-600" data-id="188k6y212" data-path="src/pages/OrganizationPage.tsx">Department Head</p>
                      <p className="font-semibold" data-id="ayof06byc" data-path="src/pages/OrganizationPage.tsx">{selectedDepartment.head}</p>
                    </div>
                    <div data-id="6aki9kehm" data-path="src/pages/OrganizationPage.tsx">
                      <p className="text-sm font-medium text-gray-600" data-id="v0jhzyyzv" data-path="src/pages/OrganizationPage.tsx">Team Size</p>
                      <p className="font-semibold" data-id="oc5n0w0z3" data-path="src/pages/OrganizationPage.tsx">{getDepartmentEmployees(selectedDepartment.name).length} employees</p>
                    </div>
                    <div data-id="jhj9um0on" data-path="src/pages/OrganizationPage.tsx">
                      <p className="text-sm font-medium text-gray-600" data-id="eq0g729lk" data-path="src/pages/OrganizationPage.tsx">Status</p>
                      <Badge className="bg-green-100 text-green-800" data-id="10t0dno7r" data-path="src/pages/OrganizationPage.tsx">Active</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="lg:col-span-2" data-id="s8x0zk1dv" data-path="src/pages/OrganizationPage.tsx">
                <Card data-id="7davzw4v9" data-path="src/pages/OrganizationPage.tsx">
                  <CardHeader data-id="qad1za7bl" data-path="src/pages/OrganizationPage.tsx">
                    <CardTitle className="text-lg" data-id="wg4zkz7ru" data-path="src/pages/OrganizationPage.tsx">Team Members</CardTitle>
                  </CardHeader>
                  <CardContent data-id="l3pf1ibqm" data-path="src/pages/OrganizationPage.tsx">
                    <div className="space-y-3" data-id="htmmwbt5i" data-path="src/pages/OrganizationPage.tsx">
                      {getDepartmentEmployees(selectedDepartment.name).map((employee) =>
                    <div key={employee.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg" data-id="dmu2z3gwl" data-path="src/pages/OrganizationPage.tsx">
                          <Avatar data-id="jgp5jougs" data-path="src/pages/OrganizationPage.tsx">
                            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white" data-id="z1eb8hw51" data-path="src/pages/OrganizationPage.tsx">
                              {getInitials(employee.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1" data-id="ofqvivk04" data-path="src/pages/OrganizationPage.tsx">
                            <p className="font-medium" data-id="k2qat0vpa" data-path="src/pages/OrganizationPage.tsx">{employee.name}</p>
                            <p className="text-sm text-gray-500" data-id="8vqrstcar" data-path="src/pages/OrganizationPage.tsx">{employee.designation}</p>
                          </div>
                          <div className="text-right" data-id="ekdy2v2yj" data-path="src/pages/OrganizationPage.tsx">
                            <p className="text-sm font-medium" data-id="uqd0aurvv" data-path="src/pages/OrganizationPage.tsx">{employee.email}</p>
                            <p className="text-xs text-gray-500" data-id="gtsxofw54" data-path="src/pages/OrganizationPage.tsx">{employee.phone}</p>
                          </div>
                        </div>
                    )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      }
    </div>);

};

export default OrganizationPage;