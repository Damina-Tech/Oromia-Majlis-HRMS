"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
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
import { toast } from "sonner";
import {
  Building2,
  School,
  BookOpen,
  Users,
  MapPin,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import {
  institutionsApi,
  assignmentsApi,
  type InstitutionStats,
  type Institution,
  type InstitutionAssignment,
} from "@/services/institutions";
import { useQuery } from "@tanstack/react-query";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

export default function MajlisDashboardPage() {
  const { user } = useAuth();
  const [regionFilter, setRegionFilter] = useState<string>("");
  const [zoneFilter, setZoneFilter] = useState<string>("");
  const [woredaFilter, setWoredaFilter] = useState<string>("");

  // Determine user role and scope
  const isAdmin = user?.roles?.some((r: any) => r.name === "ADMIN");
  const isZoneCoordinator = user?.roles?.some((r: any) => r.name === "ZONE_COORDINATOR");
  const isWoredaOfficer = user?.roles?.some((r: any) => r.name === "WOREDA_OFFICER");

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["institution-stats", regionFilter, zoneFilter, woredaFilter],
    queryFn: () =>
      institutionsApi.getStats({
        regionId: regionFilter || undefined,
        zoneId: zoneFilter || undefined,
        woredaId: woredaFilter || undefined,
      }),
  });

  const { data: institutionsData } = useQuery({
    queryKey: ["institutions-dashboard", regionFilter, zoneFilter, woredaFilter],
    queryFn: () =>
      institutionsApi.list({
        limit: 100,
        regionId: regionFilter || undefined,
        zoneId: zoneFilter || undefined,
        woredaId: woredaFilter || undefined,
      }),
  });

  const { data: assignmentsData } = useQuery({
    queryKey: ["assignments-dashboard"],
    queryFn: () => assignmentsApi.list({ limit: 100 }),
  });

  if (statsLoading) {
    return <div className="p-6">Loading dashboard...</div>;
  }

  const chartData = stats
    ? [
        { name: "Mosques", value: stats.byType.MOSQUE || 0 },
        { name: "Madrasahs", value: stats.byType.MADRASAH || 0 },
        { name: "Markaz", value: stats.byType.MARKAZ || 0 },
      ]
    : [];

  const statusData = stats
    ? [
        { name: "Active", value: stats.byStatus.ACTIVE || 0 },
        { name: "Under Construction", value: stats.byStatus.UNDER_CONSTRUCTION || 0 },
        { name: "Closed", value: stats.byStatus.CLOSED || 0 },
        { name: "Suspended", value: stats.byStatus.SUSPENDED || 0 },
      ]
    : [];

  const pendingAssignments = assignmentsData?.items.filter(
    (a) => a.status === "PENDING_APPROVAL"
  ).length || 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Institution Dashboard</h1>
          <p className="text-muted-foreground">
            {isAdmin
              ? "Oromia-wide Overview"
              : isZoneCoordinator
              ? "Zone-level Overview"
              : isWoredaOfficer
              ? "Woreda-level Overview"
              : "Institution Overview"}
          </p>
        </div>
        {(isAdmin || isZoneCoordinator) && (
          <div className="flex gap-2">
            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by Region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Regions</SelectItem>
                {/* Add regions from API */}
              </SelectContent>
            </Select>
            {regionFilter && (
              <Select value={zoneFilter} onValueChange={setZoneFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by Zone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Zones</SelectItem>
                  {/* Add zones from API */}
                </SelectContent>
              </Select>
            )}
            {zoneFilter && (
              <Select value={woredaFilter} onValueChange={setWoredaFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by Woreda" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Woredas</SelectItem>
                  {/* Add woredas from API */}
                </SelectContent>
              </Select>
            )}
          </div>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Total Institutions</CardTitle>
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats?.totalInstitutions || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all types</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Active Assignments</CardTitle>
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats?.activeAssignments || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">HR personnel deployed</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500 hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Pending Approvals</CardTitle>
            <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats?.pendingApprovals || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting review</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Pending Assignments</CardTitle>
            <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{pendingAssignments}</div>
            <p className="text-xs text-muted-foreground mt-1">Require approval</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <CardTitle className="text-lg font-semibold text-gray-800">Institutions by Type</CardTitle>
            <CardDescription className="text-gray-600">Distribution of Mosque, Madrasah, and Markaz</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
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
            <CardTitle className="text-lg font-semibold text-gray-800">Institutions by Status</CardTitle>
            <CardDescription className="text-gray-600">Current operational status</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusData}>
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

      {/* Institution Type Breakdown */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <div className="h-10 w-10 rounded-lg bg-blue-500 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              Mosques
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-blue-900">{stats?.byType.MOSQUE || 0}</div>
            <p className="text-sm text-blue-700 mt-2 font-medium">Places of worship</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900">
              <div className="h-10 w-10 rounded-lg bg-green-500 flex items-center justify-center">
                <School className="h-5 w-5 text-white" />
              </div>
              Madrasahs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-900">{stats?.byType.MADRASAH || 0}</div>
            <p className="text-sm text-green-700 mt-2 font-medium">Integrated schools</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <div className="h-10 w-10 rounded-lg bg-purple-500 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              Markaz
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-purple-900">{stats?.byType.MARKAZ || 0}</div>
            <p className="text-sm text-purple-700 mt-2 font-medium">Religious education centers</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity / Quick Actions */}
      <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={() => window.location.href = "/majlis/institutions"}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
            >
              <Building2 className="h-4 w-4 mr-2" />
              View All Institutions
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = "/majlis/assignments"}
              className="border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
            >
              <Users className="h-4 w-4 mr-2" />
              Manage Assignments
            </Button>
            {pendingAssignments > 0 && (
              <Button
                onClick={() => window.location.href = "/majlis/assignments?status=PENDING_APPROVAL"}
                className="bg-yellow-500 hover:bg-yellow-600 text-white shadow-md hover:shadow-lg transition-all duration-200"
              >
                <Clock className="h-4 w-4 mr-2" />
                Review Pending ({pendingAssignments})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

