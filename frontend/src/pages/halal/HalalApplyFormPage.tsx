"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
import { toast } from "sonner";
import { ArrowLeft, AlertCircle, Loader2, Building2, FileCheck, Sparkles } from "lucide-react";
import { halalApi } from "@/services/halal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function HalalApplyFormPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const preselectedBusinessId = (location.state as any)?.businessId;

  const [businessId, setBusinessId] = useState(preselectedBusinessId || "");

  const { data: applicationsData } = useQuery({
    queryKey: ["halal-applications"],
    queryFn: () => halalApi.applications.list({ limit: 100 }),
  });
  const applications = applicationsData?.items ?? [];

  const { data: businessesData } = useQuery({
    queryKey: ["halal-businesses"],
    queryFn: () => halalApi.businesses.list({ limit: 100 }),
  });
  const businesses = businessesData?.items ?? [];

  const businessIdsWithActiveApp = useMemo(() => {
    return new Set(
      applications
        .filter((a) => a.status !== "REJECTED")
        .map((a) => a.businessId)
    );
  }, [applications]);

  const eligibleBusinesses = useMemo(() => {
    return businesses.filter(
      (b) =>
        b.status === "APPROVED" &&
        !businessIdsWithActiveApp.has(b.id)
    );
  }, [businesses, businessIdsWithActiveApp]);

  useEffect(() => {
    if (preselectedBusinessId) {
      setBusinessId(preselectedBusinessId);
    }
  }, [preselectedBusinessId]);

  const createMutation = useMutation({
    mutationFn: async (bid: string) => {
      const app = await halalApi.applications.create({ businessId: bid });
      await halalApi.applications.submit(app.id);
      return app;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["halal-applications"] });
      toast.success("Application submitted successfully. You can check and sign the agreement.");
      navigate("/halal/applications/" + data.id);
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message || "Failed to create and submit application"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) {
      toast.error("Select a business");
      return;
    }
    if (businessIdsWithActiveApp.has(businessId)) {
      toast.error("This business already has an active application");
      return;
    }
    createMutation.mutate(businessId);
  };

  const isSubmitting = createMutation.isPending;

  return (
    <div className="p-4 sm:p-6 w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500/10 via-teal-500/5 to-transparent dark:from-blue-600/20 dark:via-teal-600/10 border border-blue-200/50 dark:border-blue-800/30 p-4 sm:p-6 mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/halal/apply")}
            className="text-blue-800 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-900/40"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-blue-900 dark:text-blue-100 flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-blue-600" />
              New Halal Certification Application
            </h1>
            <p className="text-blue-700/80 dark:text-blue-300/80 text-sm mt-1">
              Select an approved business to apply for Halal certification
            </p>
          </div>
        </div>
      </div>

      {/* Main card */}
      <Card className="shadow-sm border-blue-200/50 dark:border-blue-900/30 bg-gradient-to-br from-slate-50/50 to-transparent dark:from-slate-950/30">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-200">
            <Building2 className="h-5 w-5 text-blue-600" />
            Select Business
          </CardTitle>
          <CardDescription className="text-base">
            Products and documents from your business registration will be used for this application. Only approved businesses are eligible. Your application will be submitted immediately for admin review.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Business *</Label>
              <Select
                value={businessId}
                onValueChange={setBusinessId}
                required
              >
                <SelectTrigger className="h-11 border-blue-200/70 dark:border-blue-800/50 focus:ring-blue-500/30">
                  <SelectValue placeholder="Select approved business" />
                </SelectTrigger>
                <SelectContent>
                  {eligibleBusinesses.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name} ({b.category.replace("_", " ")})
                    </SelectItem>
                  ))}
                  {businesses.length > 0 && eligibleBusinesses.length === 0 && (
                    <SelectItem value="_none" disabled>
                      No approved businesses available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {businesses.length > 0 && eligibleBusinesses.length === 0 && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/30">
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    No approved businesses available. Each business can have only one active application at a time. If all your businesses have active applications, withdraw one first to create a new application.
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/halal/apply")}
                className="sm:mr-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || eligibleBusinesses.length === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Submitting…
                  </>
                ) : (
                  <>
                    <FileCheck className="h-4 w-4 mr-2" />
                    Create & Submit Application
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Info hint */}
      <p className="text-xs text-muted-foreground text-center mt-4">
        After submission, you will be directed to pay the certification fee. Admins can then review and process your application.
      </p>
    </div>
  );
}
