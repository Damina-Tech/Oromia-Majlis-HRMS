"use client";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ArrowLeft, UserPlus } from "lucide-react";
import { halalApi } from "@/services/halal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function HalalInspectionAssignmentPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [applicationId, setApplicationId] = useState("");
  const [inspectorId, setInspectorId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");

  const { data: applications, isLoading: loadingApps } = useQuery({
    queryKey: ["halal-applications-assignable"],
    queryFn: () =>
      halalApi.applications.list({
        limit: 100,
        status: undefined,
      }),
  });
  const assignableApps =
    applications?.items?.filter((a) =>
      ["SUBMITTED", "REVIEW"].includes(a.status)
    ) ?? [];

  const { data: inspectors, isLoading: loadingInspectors } = useQuery({
    queryKey: ["halal-inspectors"],
    queryFn: () => halalApi.inspectors.list(),
  });

  const assignMutation = useMutation({
    mutationFn: (data: { applicationId: string; inspectorId: string; scheduledAt?: string }) =>
      halalApi.inspections.assign(data),
    onSuccess: () => {
      toast.success("Inspection assigned successfully");
      queryClient.invalidateQueries({ queryKey: ["halal-applications"] });
      queryClient.invalidateQueries({ queryKey: ["halal-inspections"] });
      setApplicationId("");
      setInspectorId("");
      setScheduledAt("");
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message ?? "Failed to assign inspection");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicationId || !inspectorId) {
      toast.error("Please select application and inspector");
      return;
    }
    assignMutation.mutate({
      applicationId,
      inspectorId,
      scheduledAt: scheduledAt || undefined,
    });
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-2xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/admin/halal/applications")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Assign Inspection</h1>
          <p className="text-muted-foreground text-sm">
            Assign an inspector to review an application
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" /> New inspection assignment
          </CardTitle>
          <CardDescription>
            Select an application and inspector. Optionally set a scheduled date.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="application">Application</Label>
              <Select
                value={applicationId}
                onValueChange={setApplicationId}
                disabled={loadingApps}
              >
                <SelectTrigger id="application" className="w-full">
                  <SelectValue placeholder="Select application" />
                </SelectTrigger>
                <SelectContent>
                  {assignableApps.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.business?.name ?? a.businessId} — {a.status}
                    </SelectItem>
                  ))}
                  {assignableApps.length === 0 && !loadingApps && (
                    <SelectItem value="_none" disabled>
                      No assignable applications
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="inspector">Inspector</Label>
              <Select
                value={inspectorId}
                onValueChange={setInspectorId}
                disabled={loadingInspectors}
              >
                <SelectTrigger id="inspector" className="w-full">
                  <SelectValue placeholder="Select inspector" />
                </SelectTrigger>
                <SelectContent>
                  {inspectors?.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.firstName} {i.lastName} ({i.email})
                    </SelectItem>
                  ))}
                  {(!inspectors || inspectors.length === 0) && !loadingInspectors && (
                    <SelectItem value="_none" disabled>
                      No inspectors available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduledAt">Scheduled date (optional)</Label>
              <Input
                id="scheduledAt"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              disabled={assignMutation.isPending || !applicationId || !inspectorId}
              className="w-full sm:w-auto"
            >
              {assignMutation.isPending ? "Assigning…" : "Assign inspection"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
