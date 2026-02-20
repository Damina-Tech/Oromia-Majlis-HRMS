"use client";
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ClipboardCheck } from "lucide-react";
import { halalApi } from "@/services/halal";
import { useQuery } from "@tanstack/react-query";

export default function HalalMyInspectionsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["halal-inspections-mine", user?.id],
    queryFn: () =>
      halalApi.inspections.list({
        limit: 50,
        completed: "false",
        inspectorId: user?.id ?? undefined,
      }),
    enabled: !!user?.id,
  });

  const pending = data?.items ?? [];

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin/halal/applications")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">My inspections</h1>
          <p className="text-muted-foreground text-sm">Assignments pending completion</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" /> Pending inspections
          </CardTitle>
          <CardDescription>
            Complete the inspection and submit your report for each assignment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : pending.length === 0 ? (
            <p className="text-muted-foreground py-4">No pending inspections.</p>
          ) : (
            <div className="space-y-2">
              {pending.map((ins) => (
                <div
                  key={ins.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div>
                    <p className="font-medium">
                      {ins.application?.business?.name ?? ins.applicationId}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Scheduled:{" "}
                      {ins.scheduledAt
                        ? new Date(ins.scheduledAt).toLocaleString()
                        : "Not set"}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => navigate(`/admin/halal/inspections/${ins.id}/complete`)}
                  >
                    Complete
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
