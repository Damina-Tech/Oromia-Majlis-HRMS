"use client";
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ClipboardCheck, Calendar } from "lucide-react";
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
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-transparent dark:from-violet-600/20 dark:via-purple-600/10 border border-violet-200/50 dark:border-violet-800/30 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/admin/halal/inspections")}
              className="self-start text-violet-800 dark:text-violet-200 hover:bg-violet-100 dark:hover:bg-violet-900/40"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-violet-900 dark:text-violet-100">
                My inspections
              </h1>
              <p className="text-violet-700/80 dark:text-violet-300/80 text-sm mt-1">
                Assignments pending completion
              </p>
            </div>
          </div>
        </div>
      </div>

      <Card className="shadow-sm border-violet-200/50 dark:border-violet-900/30 overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-violet-800 dark:text-violet-200">
            <ClipboardCheck className="h-5 w-5 text-violet-600" /> Pending inspections
          </CardTitle>
          <CardDescription>
            Complete the inspection and submit your report for each assignment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="p-8 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-violet-600 border-t-transparent" />
            </div>
          ) : pending.length === 0 ? (
            <div className="py-12 text-center">
              <ClipboardCheck className="h-14 w-14 mx-auto text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground font-medium">No pending inspections</p>
              <p className="text-sm text-muted-foreground mt-1">
                You have no inspection assignments at the moment.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => navigate("/admin/halal/inspections")}
              >
                View all inspections
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {pending.map((ins) => (
                <div
                  key={ins.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-violet-200/50 dark:border-violet-800/30 bg-violet-50/30 dark:bg-violet-950/20 hover:border-violet-300/60 dark:hover:border-violet-700/40 transition-colors"
                >
                  <div>
                    <p className="font-semibold text-violet-900 dark:text-violet-100">
                      {ins.application?.business?.name ?? ins.applicationId}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Scheduled:{" "}
                      {ins.scheduledAt
                        ? new Date(ins.scheduledAt).toLocaleString()
                        : "Not set"}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="shrink-0 bg-violet-600 hover:bg-violet-700"
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
