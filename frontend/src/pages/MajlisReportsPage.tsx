"use client";
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Download,
  FileText,
  BarChart3,
  Filter,
  Calendar,
} from "lucide-react";
import {
  institutionsApi,
  assignmentsApi,
  type InstitutionStats,
} from "@/services/institutions";
import { useQuery } from "@tanstack/react-query";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, LineChart, Line } from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

export default function MajlisReportsPage() {
  const [regionFilter, setRegionFilter] = useState<string>("");
  const [zoneFilter, setZoneFilter] = useState<string>("");
  const [woredaFilter, setWoredaFilter] = useState<string>("");
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });

  const { data: stats } = useQuery({
    queryKey: ["institution-stats-report", regionFilter, zoneFilter, woredaFilter],
    queryFn: () =>
      institutionsApi.getStats({
        regionId: regionFilter || undefined,
        zoneId: zoneFilter || undefined,
        woredaId: woredaFilter || undefined,
      }),
  });

  const { data: institutionsData } = useQuery({
    queryKey: ["institutions-report", regionFilter, zoneFilter, woredaFilter],
    queryFn: () =>
      institutionsApi.list({
        limit: 1000,
        regionId: regionFilter || undefined,
        zoneId: zoneFilter || undefined,
        woredaId: woredaFilter || undefined,
      }),
  });

  const { data: assignmentsData } = useQuery({
    queryKey: ["assignments-report"],
    queryFn: () => assignmentsApi.list({ limit: 1000 }),
  });

  const handleExport = (format: "csv" | "pdf") => {
    toast.info(`Exporting report as ${format.toUpperCase()}...`);
    // Implement export functionality
  };

  const typeDistribution = stats
    ? [
        { name: "Mosques", value: stats.byType.MOSQUE || 0 },
        { name: "Madrasahs", value: stats.byType.MADRASAH || 0 },
        { name: "Markaz", value: stats.byType.MARKAZ || 0 },
      ]
    : [];

  const statusDistribution = stats
    ? Object.entries(stats.byStatus).map(([name, value]) => ({
        name: name.replace("_", " "),
        value: value || 0,
      }))
    : [];

  const ownershipDistribution = stats
    ? Object.entries(stats.byOwnership).map(([name, value]) => ({
        name: name.replace("_", " "),
        value: value || 0,
      }))
    : [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Majlis Reports</h1>
          <p className="text-muted-foreground">Comprehensive analytics and insights</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => handleExport("csv")}
            className="border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button 
            variant="outline" 
            onClick={() => handleExport("pdf")}
            className="border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
          >
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="shadow-sm border-gray-200">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Filter className="h-5 w-5 text-blue-600" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <Label>Region</Label>
              <Select value={regionFilter || "all"} onValueChange={(v) => setRegionFilter(v === "all" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Regions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  {/* Add regions from API */}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Zone</Label>
              <Select value={zoneFilter || "all"} onValueChange={(v) => setZoneFilter(v === "all" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Zones" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Zones</SelectItem>
                  {/* Add zones from API */}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Woreda</Label>
              <Select value={woredaFilter || "all"} onValueChange={(v) => setWoredaFilter(v === "all" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Woredas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Woredas</SelectItem>
                  {/* Add woredas from API */}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date Range</Label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                />
                <Input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Total Institutions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats?.totalInstitutions || 0}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Active Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats?.activeAssignments || 0}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500 hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats?.pendingApprovals || 0}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Coverage Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {stats && stats.totalInstitutions > 0
                ? ((stats.activeAssignments / stats.totalInstitutions) * 100).toFixed(1)
                : 0}
              %
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <CardTitle className="text-lg font-semibold text-gray-800">Institution Type Distribution</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={typeDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {typeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
            <CardTitle className="text-lg font-semibold text-gray-800">Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Ownership Distribution */}
      {ownershipDistribution.length > 0 && (
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b">
            <CardTitle className="text-lg font-semibold text-gray-800">Ownership Distribution</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ownershipDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                <Bar dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Assignment Statistics */}
      {assignmentsData && (
        <Card className="shadow-md">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
            <CardTitle className="text-lg font-semibold text-gray-800">Assignment Statistics</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Label className="text-sm font-medium text-blue-700">Total Assignments</Label>
                <div className="text-3xl font-bold text-blue-900 mt-2">{assignmentsData.total}</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <Label className="text-sm font-medium text-green-700">Active</Label>
                <div className="text-3xl font-bold text-green-900 mt-2">
                  {assignmentsData.items.filter((a) => a.status === "ACTIVE").length}
                </div>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <Label className="text-sm font-medium text-yellow-700">Pending Approval</Label>
                <div className="text-3xl font-bold text-yellow-900 mt-2">
                  {assignmentsData.items.filter((a) => a.status === "PENDING_APPROVAL").length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

