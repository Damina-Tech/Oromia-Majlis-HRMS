"use client";
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  CreditCard,
  TrendingUp,
  Award,
  UserPlus,
  AlertTriangle,
  Banknote,
  Clock,
  FileCheck,
} from "lucide-react";
import { membershipApi, type MemberCategory, type UpcomingExpiry } from "@/services/membership";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const CATEGORY_LABELS: Record<string, string> = {
  REGULAR_MEMBER: "Regular Member",
  BUSINESS_OWNER: "Business Owner",
  YOUTH_WOMEN_COUNCIL: "Youth/Women",
  FARMER: "Farmer",
  ELDER_MOTHER: "Elder/Mother",
};

const CATEGORY_COLORS = [
  "#0ea5e9", // sky
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
];

const STAT_CARD_COLORS = {
  total: "from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700",
  active: "from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700",
  expired: "from-rose-500 to-rose-600 dark:from-rose-600 dark:to-rose-700",
  new: "from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700",
  revenue: "from-teal-500 to-teal-600 dark:from-teal-600 dark:to-teal-700",
};

export default function MembershipDashboardPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get("category") as MemberCategory | null;
  const [selectedCategory, setSelectedCategory] = useState<MemberCategory | "">(categoryParam ?? "");

  useEffect(() => {
    setSelectedCategory(categoryParam ?? "");
  }, [categoryParam]);

  const { data: analytics, isLoading } = useQuery({
    queryKey: ["membership-analytics", selectedCategory || undefined],
    queryFn: () =>
      membershipApi.analytics(selectedCategory ? { category: selectedCategory as MemberCategory } : undefined),
  });

  const pieData =
    analytics?.categoryDistribution?.map((d, i) => ({
      name: d.category.replace(/_/g, " "),
      value: d.count,
      fill: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
      category: d.category,
    })) ?? [];

  const revenueChartData = [
    { name: "Monthly", value: analytics?.revenueByPlanType?.MONTHLY ?? 0, fill: "#6366f1" },
    { name: "Quarterly", value: analytics?.revenueByPlanType?.QUARTERLY ?? 0, fill: "#8b5cf6" },
    { name: "Yearly", value: analytics?.revenueByPlanType?.YEARLY ?? 0, fill: "#a855f7" },
  ].filter((d) => d.value > 0);

  const handlePieClick = (entry: { category?: string } | undefined) => {
    const cat = entry?.category as MemberCategory | undefined;
    if (!cat) return;
    const next = selectedCategory === cat ? "" : cat;
    setSelectedCategory(next);
    if (next) {
      setSearchParams({ category: next });
    } else {
      setSearchParams({});
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent dark:from-indigo-600/20 dark:via-purple-600/10 border border-indigo-200/50 dark:border-indigo-800/30 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-indigo-900 dark:text-indigo-100">
              Membership Dashboard
            </h1>
            <p className="text-indigo-700/80 dark:text-indigo-300/80 text-sm mt-1">
              Overview of Majlis online membership registration and revenue
            </p>
            {selectedCategory && (
              <div className="flex items-center gap-2 mt-2">
                <Badge
                  variant="secondary"
                  className="cursor-pointer hover:bg-indigo-200 dark:hover:bg-indigo-800"
                  onClick={() => {
                    setSelectedCategory("");
                    setSearchParams({});
                  }}
                >
                  Filtered: {CATEGORY_LABELS[selectedCategory] ?? selectedCategory} ×
                </Badge>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/majlis/membership/members")}>
              <Users className="h-4 w-4 mr-2" />
              View Members
            </Button>
            <Button size="sm" onClick={() => window.open("/register/membership", "_blank")}>
              <UserPlus className="h-4 w-4 mr-2" />
              Public Registration
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="overflow-hidden border-0 shadow-lg">
          <div className={`h-1 bg-gradient-to-r ${STAT_CARD_COLORS.total}`} />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-500" /> Total Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {analytics?.totalMembers ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden border-0 shadow-lg">
          <div className={`h-1 bg-gradient-to-r ${STAT_CARD_COLORS.active}`} />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Award className="h-4 w-4 text-emerald-500" /> Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {analytics?.activeSubscriptions ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden border-0 shadow-lg">
          <div className={`h-1 bg-gradient-to-r ${STAT_CARD_COLORS.expired}`} />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-500" /> Expired
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {analytics?.expiredMembers ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden border-0 shadow-lg">
          <div className={`h-1 bg-gradient-to-r ${STAT_CARD_COLORS.new}`} />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-amber-500" /> New (Month)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {analytics?.newRegistrationsMonth ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden border-0 shadow-lg">
          <div className={`h-1 bg-gradient-to-r ${STAT_CARD_COLORS.revenue}`} />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-teal-500" /> Revenue (ETB)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">
              {Number(analytics?.revenue ?? 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-indigo-200/50 dark:border-indigo-800/30">
          <CardHeader>
            <CardTitle>Category Distribution</CardTitle>
            <CardDescription>Click a slice to filter dashboard by category</CardDescription>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, value }) => `${name}: ${value}`}
                    onClick={(_, index) => handlePieClick(pieData[index ?? 0])}
                    style={{ cursor: "pointer" }}
                  >
                    {pieData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.fill}
                        stroke="#fff"
                        strokeWidth={selectedCategory === entry.category ? 3 : 1.5}
                        opacity={selectedCategory && selectedCategory !== entry.category ? 0.55 : 1}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`${value}`, "Members"]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8">No data yet</p>
            )}
          </CardContent>
        </Card>
        <Card className="border-indigo-200/50 dark:border-indigo-800/30">
          <CardHeader>
            <CardTitle>Revenue by Plan Type</CardTitle>
            <CardDescription>ETB earned per membership plan</CardDescription>
          </CardHeader>
          <CardContent>
            {revenueChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={revenueChartData} layout="vertical" margin={{ left: 60, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tickFormatter={(v) => `${v.toLocaleString()} ETB`} />
                  <YAxis type="category" dataKey="name" width={80} />
                  <Tooltip formatter={(v: number) => [`${Number(v).toLocaleString()} ETB`, "Revenue"]} />
                  <Bar dataKey="value" name="Revenue" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8">No revenue data yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="border-indigo-200/50 dark:border-indigo-800/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" /> Upcoming Expiry Alerts
              </CardTitle>
              <CardDescription>Members expiring in the next 30–90 days (top 6)</CardDescription>
            </CardHeader>
            <CardContent>
              {!analytics?.upcomingExpiries?.length ? (
                <p className="text-muted-foreground text-center py-8">No upcoming expiries</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-indigo-200/50 dark:border-indigo-800/30">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-indigo-200/50 dark:border-indigo-800/30">
                        <TableHead className="whitespace-nowrap">Member Name</TableHead>
                        <TableHead className="whitespace-nowrap">Category</TableHead>
                        <TableHead className="whitespace-nowrap">Expiry Date</TableHead>
                        <TableHead className="whitespace-nowrap">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(analytics.upcomingExpiries as UpcomingExpiry[]).map((row) => (
                        <TableRow
                          key={row.memberId}
                          className="border-indigo-200/30 dark:border-indigo-800/20 cursor-pointer hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30"
                          onClick={() => navigate(`/majlis/membership/members/${row.memberId}`)}
                        >
                          <TableCell className="font-medium">{row.memberName}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">
                              {CATEGORY_LABELS[row.category] ?? row.category}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {row.expiryDate
                              ? new Date(row.expiryDate).toLocaleDateString(undefined, {
                                  dateStyle: "medium",
                                })
                              : "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="default" className="bg-amber-500 hover:bg-amber-600">
                              {row.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <div>
          <Card className="border-indigo-200/50 dark:border-indigo-800/30 h-fit">
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
              <CardDescription>Shortcuts for common tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                className="w-full justify-start"
                size="sm"
                variant="outline"
                onClick={() => navigate("/majlis/membership/register")}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Register New Member
              </Button>
              <Button
                className="w-full justify-start"
                size="sm"
                variant="outline"
                onClick={() =>
                  navigate("/majlis/membership/members?membershipStatus=PENDING_PAYMENT")
                }
              >
                <Banknote className="h-4 w-4 mr-2" />
                Approve Payment
              </Button>
              <Button
                className="w-full justify-start"
                size="sm"
                variant="outline"
                onClick={() =>
                  navigate("/majlis/membership/members?membershipStatus=PENDING_PAYMENT")
                }
              >
                <FileCheck className="h-4 w-4 mr-2" />
                Pending Registrations
              </Button>
              <Button
                className="w-full justify-start"
                size="sm"
                variant="outline"
                onClick={() => navigate("/majlis/membership/members")}
              >
                <Users className="h-4 w-4 mr-2" />
                View All Members
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
