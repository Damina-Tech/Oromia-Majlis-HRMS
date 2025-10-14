import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow } from
'@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from
'@/components/ui/select';
import { mockPayroll, mockEmployees } from '@/services/mockData';
import {
  DollarSign,
  Download,
  Eye,
  Calculator,
  TrendingUp,
  Users,
  Calendar,
  FileText } from
'lucide-react';

const PayrollPage: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState('November');
  const [selectedYear, setSelectedYear] = useState('2024');

  const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];


  const years = ['2024', '2023', '2022'];

  // Mock payroll summary
  const payrollSummary = {
    totalEmployees: mockEmployees.length,
    totalPayroll: 425000,
    avgSalary: 75000,
    totalDeductions: 42500,
    netPayroll: 382500,
    processed: 4,
    pending: 1
  };

  // Mock payroll breakdown
  const salaryBreakdown = {
    basicSalary: 280000,
    allowances: 85000,
    overtime: 15000,
    bonus: 45000,
    grossSalary: 425000,
    taxes: 32000,
    insurance: 8500,
    pf: 2000,
    totalDeductions: 42500,
    netSalary: 382500
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':return 'bg-green-100 text-green-800';
      case 'processed':return 'bg-blue-100 text-blue-800';
      case 'draft':return 'bg-gray-100 text-gray-800';
      default:return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="space-y-6" data-id="nc6kbnrug" data-path="src/pages/PayrollPage.tsx">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4" data-id="ar65fvlrt" data-path="src/pages/PayrollPage.tsx">
        <div data-id="n3p6s2lvl" data-path="src/pages/PayrollPage.tsx">
          <h1 className="text-3xl font-bold text-gray-900" data-id="9wt5w8q20" data-path="src/pages/PayrollPage.tsx">Payroll Management</h1>
          <p className="text-gray-600 mt-1" data-id="lshklpdub" data-path="src/pages/PayrollPage.tsx">Manage employee salaries and payroll processing</p>
        </div>
        
        <div className="flex gap-2" data-id="f79zpizdb" data-path="src/pages/PayrollPage.tsx">
          <Select value={selectedMonth} onValueChange={setSelectedMonth} data-id="kdmcmtuvh" data-path="src/pages/PayrollPage.tsx">
            <SelectTrigger className="w-32" data-id="y5m1rqirp" data-path="src/pages/PayrollPage.tsx">
              <SelectValue data-id="m17zvh0rd" data-path="src/pages/PayrollPage.tsx" />
            </SelectTrigger>
            <SelectContent data-id="r65wjp5rl" data-path="src/pages/PayrollPage.tsx">
              {months.map((month) =>
              <SelectItem key={month} value={month} data-id="f8u8ozjkl" data-path="src/pages/PayrollPage.tsx">
                  {month}
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          
          <Select value={selectedYear} onValueChange={setSelectedYear} data-id="jfolkssdd" data-path="src/pages/PayrollPage.tsx">
            <SelectTrigger className="w-24" data-id="zjs3ifvpf" data-path="src/pages/PayrollPage.tsx">
              <SelectValue data-id="zre1irqql" data-path="src/pages/PayrollPage.tsx" />
            </SelectTrigger>
            <SelectContent data-id="fn7m5bvok" data-path="src/pages/PayrollPage.tsx">
              {years.map((year) =>
              <SelectItem key={year} value={year} data-id="b5jwxob2z" data-path="src/pages/PayrollPage.tsx">
                  {year}
                </SelectItem>
              )}
            </SelectContent>
          </Select>

          {hasPermission('payroll.process') &&
          <Button data-id="2fb4uzqwe" data-path="src/pages/PayrollPage.tsx">
              <Calculator className="h-4 w-4 mr-2" data-id="noyadko7i" data-path="src/pages/PayrollPage.tsx" />
              Process Payroll
            </Button>
          }
        </div>
      </div>

      {/* Payroll Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6" data-id="p8cvzax81" data-path="src/pages/PayrollPage.tsx">
        <Card data-id="ky4r8yf5n" data-path="src/pages/PayrollPage.tsx">
          <CardContent className="p-6" data-id="159ir65gm" data-path="src/pages/PayrollPage.tsx">
            <div className="flex items-center justify-between" data-id="54i3u5cl8" data-path="src/pages/PayrollPage.tsx">
              <div data-id="mffpsjmvj" data-path="src/pages/PayrollPage.tsx">
                <p className="text-sm font-medium text-gray-600" data-id="etaupfa25" data-path="src/pages/PayrollPage.tsx">Total Payroll</p>
                <p className="text-2xl font-bold" data-id="d0wxk4u2u" data-path="src/pages/PayrollPage.tsx">${payrollSummary.totalPayroll.toLocaleString()}</p>
                <p className="text-xs text-green-600 flex items-center mt-1" data-id="9tai3r4to" data-path="src/pages/PayrollPage.tsx">
                  <TrendingUp className="h-3 w-3 mr-1" data-id="8mfp01rg5" data-path="src/pages/PayrollPage.tsx" />
                  +2.5% from last month
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" data-id="08h2hc4ya" data-path="src/pages/PayrollPage.tsx" />
            </div>
          </CardContent>
        </Card>

        <Card data-id="38ibqlp4a" data-path="src/pages/PayrollPage.tsx">
          <CardContent className="p-6" data-id="poogr721x" data-path="src/pages/PayrollPage.tsx">
            <div className="flex items-center justify-between" data-id="ylpbjqu4o" data-path="src/pages/PayrollPage.tsx">
              <div data-id="y6qx5qkcr" data-path="src/pages/PayrollPage.tsx">
                <p className="text-sm font-medium text-gray-600" data-id="fe1fjcbq1" data-path="src/pages/PayrollPage.tsx">Employees</p>
                <p className="text-2xl font-bold" data-id="6gk5oh051" data-path="src/pages/PayrollPage.tsx">{payrollSummary.totalEmployees}</p>
                <p className="text-xs text-gray-500" data-id="3mznqq681" data-path="src/pages/PayrollPage.tsx">{payrollSummary.processed} processed</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" data-id="n79a8ee4g" data-path="src/pages/PayrollPage.tsx" />
            </div>
          </CardContent>
        </Card>

        <Card data-id="9hcjcuuod" data-path="src/pages/PayrollPage.tsx">
          <CardContent className="p-6" data-id="zxbuprd3g" data-path="src/pages/PayrollPage.tsx">
            <div className="flex items-center justify-between" data-id="m8q3gvx8d" data-path="src/pages/PayrollPage.tsx">
              <div data-id="lwewud6q6" data-path="src/pages/PayrollPage.tsx">
                <p className="text-sm font-medium text-gray-600" data-id="as8ordmtg" data-path="src/pages/PayrollPage.tsx">Avg Salary</p>
                <p className="text-2xl font-bold" data-id="cmwnv1tfg" data-path="src/pages/PayrollPage.tsx">${payrollSummary.avgSalary.toLocaleString()}</p>
                <p className="text-xs text-gray-500" data-id="9iclag8b1" data-path="src/pages/PayrollPage.tsx">per employee</p>
              </div>
              <Calculator className="h-8 w-8 text-purple-600" data-id="pt5fpa1do" data-path="src/pages/PayrollPage.tsx" />
            </div>
          </CardContent>
        </Card>

        <Card data-id="d6w43g9o6" data-path="src/pages/PayrollPage.tsx">
          <CardContent className="p-6" data-id="ytmqoxdox" data-path="src/pages/PayrollPage.tsx">
            <div className="flex items-center justify-between" data-id="g0fgcrop4" data-path="src/pages/PayrollPage.tsx">
              <div data-id="ew745umk2" data-path="src/pages/PayrollPage.tsx">
                <p className="text-sm font-medium text-gray-600" data-id="flj7wi4ge" data-path="src/pages/PayrollPage.tsx">Net Payroll</p>
                <p className="text-2xl font-bold" data-id="zm7r8v6ru" data-path="src/pages/PayrollPage.tsx">${payrollSummary.netPayroll.toLocaleString()}</p>
                <p className="text-xs text-gray-500" data-id="0ukczu5j4" data-path="src/pages/PayrollPage.tsx">after deductions</p>
              </div>
              <FileText className="h-8 w-8 text-orange-600" data-id="5bfl7c1ip" data-path="src/pages/PayrollPage.tsx" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" data-id="jlti3h6xi" data-path="src/pages/PayrollPage.tsx">
        {/* Salary Breakdown */}
        <Card className="lg:col-span-2" data-id="0cmgzknht" data-path="src/pages/PayrollPage.tsx">
          <CardHeader data-id="5h3ynpwnq" data-path="src/pages/PayrollPage.tsx">
            <CardTitle data-id="a5kt26ja6" data-path="src/pages/PayrollPage.tsx">Payroll Breakdown - {selectedMonth} {selectedYear}</CardTitle>
            <CardDescription data-id="up352tpkn" data-path="src/pages/PayrollPage.tsx">Detailed salary components overview</CardDescription>
          </CardHeader>
          <CardContent data-id="gaubdoi0q" data-path="src/pages/PayrollPage.tsx">
            <div className="space-y-4" data-id="vsslfqtaw" data-path="src/pages/PayrollPage.tsx">
              {/* Earnings */}
              <div data-id="4nn4dvrvr" data-path="src/pages/PayrollPage.tsx">
                <h4 className="font-semibold text-green-600 mb-3" data-id="z7fe2v8j6" data-path="src/pages/PayrollPage.tsx">Earnings</h4>
                <div className="space-y-2" data-id="ckrhiolh2" data-path="src/pages/PayrollPage.tsx">
                  <div className="flex justify-between items-center py-2 border-b" data-id="liwoclkrf" data-path="src/pages/PayrollPage.tsx">
                    <span className="text-sm" data-id="mfkxqmy39" data-path="src/pages/PayrollPage.tsx">Basic Salary</span>
                    <span className="font-medium" data-id="yk506lr7l" data-path="src/pages/PayrollPage.tsx">${salaryBreakdown.basicSalary.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b" data-id="pnohjhwz3" data-path="src/pages/PayrollPage.tsx">
                    <span className="text-sm" data-id="ea86hnhqq" data-path="src/pages/PayrollPage.tsx">Allowances</span>
                    <span className="font-medium" data-id="9rgmuy71o" data-path="src/pages/PayrollPage.tsx">${salaryBreakdown.allowances.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b" data-id="0d8os5m6s" data-path="src/pages/PayrollPage.tsx">
                    <span className="text-sm" data-id="evi1sklzy" data-path="src/pages/PayrollPage.tsx">Overtime</span>
                    <span className="font-medium" data-id="ewbmk6iq2" data-path="src/pages/PayrollPage.tsx">${salaryBreakdown.overtime.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b" data-id="6icqsqibz" data-path="src/pages/PayrollPage.tsx">
                    <span className="text-sm" data-id="29ef1xw3t" data-path="src/pages/PayrollPage.tsx">Bonus</span>
                    <span className="font-medium" data-id="cd4xr2uha" data-path="src/pages/PayrollPage.tsx">${salaryBreakdown.bonus.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 bg-green-50 px-3 rounded" data-id="bhvz0c5ud" data-path="src/pages/PayrollPage.tsx">
                    <span className="font-semibold" data-id="9ezmyqnts" data-path="src/pages/PayrollPage.tsx">Gross Salary</span>
                    <span className="font-bold text-green-600" data-id="2nkx453xh" data-path="src/pages/PayrollPage.tsx">${salaryBreakdown.grossSalary.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div data-id="zof17e3fe" data-path="src/pages/PayrollPage.tsx">
                <h4 className="font-semibold text-red-600 mb-3" data-id="n1icdl7by" data-path="src/pages/PayrollPage.tsx">Deductions</h4>
                <div className="space-y-2" data-id="izjk4hdap" data-path="src/pages/PayrollPage.tsx">
                  <div className="flex justify-between items-center py-2 border-b" data-id="6gsqp0wbg" data-path="src/pages/PayrollPage.tsx">
                    <span className="text-sm" data-id="4xcu5kt9v" data-path="src/pages/PayrollPage.tsx">Income Tax</span>
                    <span className="font-medium" data-id="um7cah40y" data-path="src/pages/PayrollPage.tsx">${salaryBreakdown.taxes.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b" data-id="ainemdkkz" data-path="src/pages/PayrollPage.tsx">
                    <span className="text-sm" data-id="iqo9enz78" data-path="src/pages/PayrollPage.tsx">Health Insurance</span>
                    <span className="font-medium" data-id="oo5rivycz" data-path="src/pages/PayrollPage.tsx">${salaryBreakdown.insurance.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b" data-id="lpatl4um7" data-path="src/pages/PayrollPage.tsx">
                    <span className="text-sm" data-id="uubpzb29x" data-path="src/pages/PayrollPage.tsx">Provident Fund</span>
                    <span className="font-medium" data-id="3jhy1bzr8" data-path="src/pages/PayrollPage.tsx">${salaryBreakdown.pf.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 bg-red-50 px-3 rounded" data-id="3vlgme0r8" data-path="src/pages/PayrollPage.tsx">
                    <span className="font-semibold" data-id="p36m5b5aa" data-path="src/pages/PayrollPage.tsx">Total Deductions</span>
                    <span className="font-bold text-red-600" data-id="3gh4adafv" data-path="src/pages/PayrollPage.tsx">${salaryBreakdown.totalDeductions.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Net Salary */}
              <div className="bg-blue-50 p-4 rounded-lg" data-id="0qaxl3pli" data-path="src/pages/PayrollPage.tsx">
                <div className="flex justify-between items-center" data-id="z9xra97cf" data-path="src/pages/PayrollPage.tsx">
                  <span className="text-lg font-bold" data-id="xy6e3pft6" data-path="src/pages/PayrollPage.tsx">Net Salary</span>
                  <span className="text-2xl font-bold text-blue-600" data-id="lh3kz5e5i" data-path="src/pages/PayrollPage.tsx">${salaryBreakdown.netSalary.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card data-id="i7a8fgiy9" data-path="src/pages/PayrollPage.tsx">
          <CardHeader data-id="igdrgtyby" data-path="src/pages/PayrollPage.tsx">
            <CardTitle data-id="mbnkg3wst" data-path="src/pages/PayrollPage.tsx">Quick Actions</CardTitle>
            <CardDescription data-id="u2c9n7jwy" data-path="src/pages/PayrollPage.tsx">Payroll management tools</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3" data-id="z5w8j82rr" data-path="src/pages/PayrollPage.tsx">
            <Button className="w-full justify-start" variant="outline" data-id="1wmrqyk8p" data-path="src/pages/PayrollPage.tsx">
              <FileText className="h-4 w-4 mr-2" data-id="4vjskm8ex" data-path="src/pages/PayrollPage.tsx" />
              Generate Payslips
            </Button>
            <Button className="w-full justify-start" variant="outline" data-id="1gonn1neh" data-path="src/pages/PayrollPage.tsx">
              <Download className="h-4 w-4 mr-2" data-id="xky8po0db" data-path="src/pages/PayrollPage.tsx" />
              Export Report
            </Button>
            <Button className="w-full justify-start" variant="outline" data-id="2hmbzprl6" data-path="src/pages/PayrollPage.tsx">
              <Calculator className="h-4 w-4 mr-2" data-id="81xtrn55b" data-path="src/pages/PayrollPage.tsx" />
              Tax Calculator
            </Button>
            <Button className="w-full justify-start" variant="outline" data-id="gsd3ov2hl" data-path="src/pages/PayrollPage.tsx">
              <Calendar className="h-4 w-4 mr-2" data-id="3xkae7c04" data-path="src/pages/PayrollPage.tsx" />
              Payroll Calendar
            </Button>
            <Button className="w-full justify-start" variant="outline" data-id="9qrrd4sgn" data-path="src/pages/PayrollPage.tsx">
              <Users className="h-4 w-4 mr-2" data-id="6vnqaogkq" data-path="src/pages/PayrollPage.tsx" />
              Salary Reviews
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Employee Payroll Table */}
      <Card data-id="0d7olvgj0" data-path="src/pages/PayrollPage.tsx">
        <CardHeader data-id="nlzus308j" data-path="src/pages/PayrollPage.tsx">
          <CardTitle data-id="alvulioc8" data-path="src/pages/PayrollPage.tsx">Employee Payroll Details</CardTitle>
          <CardDescription data-id="g4zmrtqgy" data-path="src/pages/PayrollPage.tsx">Individual employee salary information for {selectedMonth} {selectedYear}</CardDescription>
        </CardHeader>
        <CardContent data-id="kcx6yhi5f" data-path="src/pages/PayrollPage.tsx">
          <Table data-id="gk83optw3" data-path="src/pages/PayrollPage.tsx">
            <TableHeader data-id="jdph56spu" data-path="src/pages/PayrollPage.tsx">
              <TableRow data-id="sq3k7jiv7" data-path="src/pages/PayrollPage.tsx">
                <TableHead data-id="bsu07iju2" data-path="src/pages/PayrollPage.tsx">Employee</TableHead>
                <TableHead data-id="2058rrotf" data-path="src/pages/PayrollPage.tsx">Department</TableHead>
                <TableHead data-id="zkked77jb" data-path="src/pages/PayrollPage.tsx">Basic Salary</TableHead>
                <TableHead data-id="jzi6m9i8d" data-path="src/pages/PayrollPage.tsx">Allowances</TableHead>
                <TableHead data-id="p3fawuopv" data-path="src/pages/PayrollPage.tsx">Deductions</TableHead>
                <TableHead data-id="3pf5nl2ik" data-path="src/pages/PayrollPage.tsx">Net Salary</TableHead>
                <TableHead data-id="uby48aygg" data-path="src/pages/PayrollPage.tsx">Status</TableHead>
                <TableHead data-id="lltef7owg" data-path="src/pages/PayrollPage.tsx">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody data-id="k27c7sk8k" data-path="src/pages/PayrollPage.tsx">
              {mockEmployees.map((employee) => {
                const payrollRecord = mockPayroll.find((p) => p.employeeId === employee.id) || {
                  basicSalary: employee.salary * 0.7,
                  allowances: employee.salary * 0.2,
                  deductions: employee.salary * 0.1,
                  netSalary: employee.salary * 0.9,
                  status: 'draft' as const
                };

                return (
                  <TableRow key={employee.id} data-id="m3z2ltizn" data-path="src/pages/PayrollPage.tsx">
                    <TableCell data-id="jlae9cxmm" data-path="src/pages/PayrollPage.tsx">
                      <div data-id="pmr3jek91" data-path="src/pages/PayrollPage.tsx">
                        <p className="font-medium" data-id="4zzmbi6l7" data-path="src/pages/PayrollPage.tsx">{employee.name}</p>
                        <p className="text-sm text-gray-500" data-id="5g0durldb" data-path="src/pages/PayrollPage.tsx">{employee.employeeId}</p>
                      </div>
                    </TableCell>
                    <TableCell data-id="kaxty9xe8" data-path="src/pages/PayrollPage.tsx">
                      <Badge variant="outline" data-id="4h4f1sfa7" data-path="src/pages/PayrollPage.tsx">{employee.department}</Badge>
                    </TableCell>
                    <TableCell data-id="rt9k1b2vb" data-path="src/pages/PayrollPage.tsx">${payrollRecord.basicSalary.toLocaleString()}</TableCell>
                    <TableCell data-id="xbarhq1hd" data-path="src/pages/PayrollPage.tsx">${payrollRecord.allowances.toLocaleString()}</TableCell>
                    <TableCell data-id="22o2ryayu" data-path="src/pages/PayrollPage.tsx">${payrollRecord.deductions.toLocaleString()}</TableCell>
                    <TableCell className="font-medium" data-id="2l0qraxt7" data-path="src/pages/PayrollPage.tsx">
                      ${payrollRecord.netSalary.toLocaleString()}
                    </TableCell>
                    <TableCell data-id="9fzu20ajq" data-path="src/pages/PayrollPage.tsx">
                      <Badge className={getStatusColor(payrollRecord.status)} data-id="czcky509g" data-path="src/pages/PayrollPage.tsx">
                        {payrollRecord.status}
                      </Badge>
                    </TableCell>
                    <TableCell data-id="5gpdko5j1" data-path="src/pages/PayrollPage.tsx">
                      <div className="flex space-x-2" data-id="bs0am7q8n" data-path="src/pages/PayrollPage.tsx">
                        <Button variant="ghost" size="sm" data-id="g5i508shq" data-path="src/pages/PayrollPage.tsx">
                          <Eye className="h-4 w-4" data-id="prg570t7r" data-path="src/pages/PayrollPage.tsx" />
                        </Button>
                        <Button variant="ghost" size="sm" data-id="9g8vniznc" data-path="src/pages/PayrollPage.tsx">
                          <Download className="h-4 w-4" data-id="v014rlcs5" data-path="src/pages/PayrollPage.tsx" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>);

              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Employee View - Personal Payslip */}
      {user?.role === 'employee' &&
      <Card data-id="gch9s4w27" data-path="src/pages/PayrollPage.tsx">
          <CardHeader data-id="isn23m91u" data-path="src/pages/PayrollPage.tsx">
            <CardTitle data-id="fus10val6" data-path="src/pages/PayrollPage.tsx">My Payslip - {selectedMonth} {selectedYear}</CardTitle>
            <CardDescription data-id="5ja0gdelf" data-path="src/pages/PayrollPage.tsx">Your salary details and breakdown</CardDescription>
          </CardHeader>
          <CardContent data-id="0ttnnp9x1" data-path="src/pages/PayrollPage.tsx">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-id="dig83zqcy" data-path="src/pages/PayrollPage.tsx">
              <div data-id="8fc3o2i7z" data-path="src/pages/PayrollPage.tsx">
                <h4 className="font-semibold mb-3" data-id="x25bm00f4" data-path="src/pages/PayrollPage.tsx">Earnings</h4>
                <div className="space-y-2" data-id="5khlgbmny" data-path="src/pages/PayrollPage.tsx">
                  <div className="flex justify-between" data-id="geq6mkav1" data-path="src/pages/PayrollPage.tsx">
                    <span data-id="e4g7gjb11" data-path="src/pages/PayrollPage.tsx">Basic Salary</span>
                    <span data-id="2mfbfcgrn" data-path="src/pages/PayrollPage.tsx">$49,000</span>
                  </div>
                  <div className="flex justify-between" data-id="uotfh7shz" data-path="src/pages/PayrollPage.tsx">
                    <span data-id="t86x0w7a8" data-path="src/pages/PayrollPage.tsx">Allowances</span>
                    <span data-id="5gxuigtrl" data-path="src/pages/PayrollPage.tsx">$14,000</span>
                  </div>
                  <div className="flex justify-between" data-id="e0yd7qd6u" data-path="src/pages/PayrollPage.tsx">
                    <span data-id="omq74z8og" data-path="src/pages/PayrollPage.tsx">Overtime</span>
                    <span data-id="wg0b56zxl" data-path="src/pages/PayrollPage.tsx">$3,500</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-2" data-id="9idn9u0yv" data-path="src/pages/PayrollPage.tsx">
                    <span data-id="6rqddy0gg" data-path="src/pages/PayrollPage.tsx">Gross Pay</span>
                    <span data-id="yt10ouid4" data-path="src/pages/PayrollPage.tsx">$66,500</span>
                  </div>
                </div>
              </div>
              
              <div data-id="ia9yvjvrc" data-path="src/pages/PayrollPage.tsx">
                <h4 className="font-semibold mb-3" data-id="9f0gl5zq2" data-path="src/pages/PayrollPage.tsx">Deductions</h4>
                <div className="space-y-2" data-id="nuba3q0kg" data-path="src/pages/PayrollPage.tsx">
                  <div className="flex justify-between" data-id="frmk1cb6k" data-path="src/pages/PayrollPage.tsx">
                    <span data-id="ueoi4kqil" data-path="src/pages/PayrollPage.tsx">Income Tax</span>
                    <span data-id="r5c0vn8a4" data-path="src/pages/PayrollPage.tsx">$5,320</span>
                  </div>
                  <div className="flex justify-between" data-id="q3ynw93y0" data-path="src/pages/PayrollPage.tsx">
                    <span data-id="04h1fkub9" data-path="src/pages/PayrollPage.tsx">Health Insurance</span>
                    <span data-id="ryfdmf5ta" data-path="src/pages/PayrollPage.tsx">$1,200</span>
                  </div>
                  <div className="flex justify-between" data-id="jip87u7f7" data-path="src/pages/PayrollPage.tsx">
                    <span data-id="a59zjfcik" data-path="src/pages/PayrollPage.tsx">PF Contribution</span>
                    <span data-id="kauaa2xau" data-path="src/pages/PayrollPage.tsx">$980</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-2" data-id="kwgxxt434" data-path="src/pages/PayrollPage.tsx">
                    <span data-id="3rf2ywavu" data-path="src/pages/PayrollPage.tsx">Total Deductions</span>
                    <span data-id="figti3dyq" data-path="src/pages/PayrollPage.tsx">$7,500</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-green-50 rounded-lg" data-id="8xabhqrlx" data-path="src/pages/PayrollPage.tsx">
              <div className="flex justify-between items-center" data-id="n741p6o77" data-path="src/pages/PayrollPage.tsx">
                <span className="text-lg font-bold" data-id="vfs5esmqs" data-path="src/pages/PayrollPage.tsx">Net Pay</span>
                <span className="text-2xl font-bold text-green-600" data-id="bkanxzsj7" data-path="src/pages/PayrollPage.tsx">$59,000</span>
              </div>
            </div>
            
            <div className="mt-4 flex justify-end" data-id="z1zvzkkzg" data-path="src/pages/PayrollPage.tsx">
              <Button data-id="0j21sd1zd" data-path="src/pages/PayrollPage.tsx">
                <Download className="h-4 w-4 mr-2" data-id="r8176sl0r" data-path="src/pages/PayrollPage.tsx" />
                Download Payslip
              </Button>
            </div>
          </CardContent>
        </Card>
      }
    </div>);

};

export default PayrollPage;