"use client";
import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Plus, FileText, Award, RefreshCw } from "lucide-react";
import { halalApi, type HalalApplicationStatus } from "@/services/halal";
import { useQuery } from "@tanstack/react-query";

const STATUS_COLORS: Record<HalalApplicationStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  SUBMITTED: "bg-blue-100 text-blue-800",
  REVIEW: "bg-amber-100 text-amber-800",
  INSPECTION: "bg-purple-100 text-purple-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
};

export default function HalalDashboardPage() {
  const navigate = useNavigate();
  const { data: businesses, isLoading } = useQuery({
    queryKey: ["halal-businesses"],
    queryFn: () => halalApi.businesses.list({ limit: 50 }),
  });
  const { data: applications } = useQuery({
    queryKey: ["halal-applications"],
    queryFn: () => halalApi.applications.list({ limit: 50 }),
  });
  const { data: certificates } = useQuery({
    queryKey: ["halal-certificates"],
    queryFn: () => halalApi.certificates.list({ limit: 20 }),
  });

  const stats = {
    businesses: businesses?.total ?? 0,
    applications: applications?.total ?? 0,
    pending: applications?.items?.filter((a) => ["DRAFT", "SUBMITTED", "REVIEW", "INSPECTION"].includes(a.status)).length ?? 0,
    approved: applications?.items?.filter((a) => a.status === "APPROVED").length ?? 0,
    certificates: certificates?.total ?? 0,
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Halal Certification</h1>
          <p className="text-muted-foreground">Manage your businesses and applications</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/halal/register")}>
            <Building2 className="h-4 w-4 mr-2" />
            Register Business
          </Button>
          <Button onClick={() => navigate("/halal/apply")}>
            <Plus className="h-4 w-4 mr-2" />
            New Application
          </Button>
          <Button variant="outline" onClick={() => navigate("/halal/certificates")}>
            <Award className="h-4 w-4 mr-2" />
            Certificates
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.businesses}</p>
                <p className="text-sm text-muted-foreground">Businesses</p>
              </div>
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.applications}</p>
                <p className="text-sm text-muted-foreground">Applications</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
              <RefreshCw className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.certificates}</p>
                <p className="text-sm text-muted-foreground">Certificates</p>
              </div>
              <Award className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>My Businesses</CardTitle>
            <CardDescription>Registered businesses</CardDescription>
          </CardHeader>
          <CardContent>
            {businesses?.items?.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4">No businesses registered. Register one to get started.</p>
            ) : (
              <ul className="space-y-2">
                {businesses?.items?.map((b) => (
                  <li
                    key={b.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                    onClick={() => navigate(`/halal/businesses/${b.id}`)}
                  >
                    <div>
                      <p className="font-medium">{b.name}</p>
                      <p className="text-sm text-muted-foreground">{b.category.replace("_", " ")}</p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); navigate("/halal/apply/new", { state: { businessId: b.id } }); }}>
                      Apply
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Applications</CardTitle>
            <CardDescription>Application status</CardDescription>
          </CardHeader>
          <CardContent>
            {applications?.items?.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4">No applications yet.</p>
            ) : (
              <ul className="space-y-2">
                {applications?.items?.slice(0, 5).map((a) => {
                  const nextAction =
                    a.status === "DRAFT"
                      ? "Submit"
                      : a.status === "SUBMITTED" && !a.feePaidAt
                        ? "Pay fee"
                        : a.status === "APPROVED"
                          ? "Download certificate"
                          : null;
                  return (
                    <li
                      key={a.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                      onClick={() => navigate(`/halal/applications/${a.id}`)}
                    >
                      <div>
                        <p className="font-medium">{a.business?.name ?? a.businessId}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={STATUS_COLORS[a.status]}>{a.status}</Badge>
                          {nextAction && (
                            <span className="text-xs text-muted-foreground">→ {nextAction}</span>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
