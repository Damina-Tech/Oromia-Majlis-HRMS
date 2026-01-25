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
          <Button variant="outline" onClick={() => handleExport("csv")}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => handleExport("pdf")}>
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
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
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Institutions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalInstitutions || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeAssignments || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingApprovals || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Coverage Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
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
        <Card>
          <CardHeader>
            <CardTitle>Institution Type Distribution</CardTitle>
          </CardHeader>
          <CardContent>
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

        <Card>
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Ownership Distribution */}
      {ownershipDistribution.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ownership Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ownershipDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#00C49F" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Assignment Statistics */}
      {assignmentsData && (
        <Card>
          <CardHeader>
            <CardTitle>Assignment Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label className="text-muted-foreground">Total Assignments</Label>
                <div className="text-2xl font-bold">{assignmentsData.total}</div>
              </div>
              <div>
                <Label className="text-muted-foreground">Active</Label>
                <div className="text-2xl font-bold">
                  {assignmentsData.items.filter((a) => a.status === "ACTIVE").length}
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Pending Approval</Label>
                <div className="text-2xl font-bold">
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

