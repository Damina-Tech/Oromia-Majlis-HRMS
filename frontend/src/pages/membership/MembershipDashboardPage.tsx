"use client";
import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, CreditCard, TrendingUp, Award, ArrowRight, UserPlus } from "lucide-react";
import { membershipApi } from "@/services/membership";
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

const COLORS = ["#6366f1", "#8b5cf6", "#a855f7", "#c084fc", "#d8b4fe"];

export default function MembershipDashboardPage() {
  const navigate = useNavigate();
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["membership-analytics"],
    queryFn: () => membershipApi.analytics(),
  });

  const pieData = analytics?.categoryDistribution?.map((d, i) => ({
    name: d.category.replace(/_/g, " "),
    value: d.count,
    fill: COLORS[i % COLORS.length],
  })) ?? [];

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" /> Total Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{analytics?.totalMembers ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Award className="h-4 w-4" /> Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">{analytics?.activeSubscriptions ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> New (This Month)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{analytics?.newRegistrationsMonth ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CreditCard className="h-4 w-4" /> Revenue (ETB)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{Number(analytics?.revenue ?? 0).toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Category Distribution</CardTitle>
            <CardDescription>Members by category</CardDescription>
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
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={pieData[i].fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8">No data yet</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
            <CardDescription>Registrations and payments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">New registrations today</span>
              <span className="font-medium">{analytics?.newRegistrationsToday ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payments completed</span>
              <span className="font-medium">{analytics?.paymentsCompleted ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Expired subscriptions</span>
              <span className="font-medium">{analytics?.expiredSubscriptions ?? 0}</span>
            </div>
            <Button variant="outline" className="w-full mt-4" onClick={() => navigate("/majlis/membership/members")}>
              View all members <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
