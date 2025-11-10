import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  LayoutDashboard,
  Library,
  Wrench,
  History,
} from "lucide-react";
import ReportsDashboard from "@/components/reports/ReportsDashboard";
import ReportLibrary from "@/components/reports/ReportLibrary";
import ReportBuilder from "@/components/reports/ReportBuilder";
import ReportViewer from "@/components/reports/ReportViewer";
import ReportAuditLog from "@/components/reports/ReportAuditLog";
import { ReportTemplate } from "@/services/reports";
import { useNavigate, useLocation } from "react-router-dom";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const navigate = useNavigate();

  const handleSelectTemplate = (template: ReportTemplate) => {
    // Navigate to report builder with template pre-filled
    navigate(`/reports/builder?templateId=${template.id}`);
  };

  const handleCreateCustom = () => {
    navigate("/reports/builder");
  };

  const handleGenerateReport = () => {
    navigate("/reports/builder");
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground">
            Comprehensive reports and insights for HR operations
          </p>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="dashboard">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="library">
            <Library className="mr-2 h-4 w-4" />
            Library
          </TabsTrigger>
          <TabsTrigger value="builder">
            <Wrench className="mr-2 h-4 w-4" />
            Builder
          </TabsTrigger>
          <TabsTrigger value="audit">
            <History className="mr-2 h-4 w-4" />
            Audit Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <ReportsDashboard onGenerateReport={handleGenerateReport} />
        </TabsContent>

        <TabsContent value="library" className="space-y-6">
          <ReportLibrary
            onSelectTemplate={handleSelectTemplate}
            onCreateCustom={handleCreateCustom}
          />
        </TabsContent>

        <TabsContent value="builder" className="space-y-6">
          <ReportBuilder
            onReportGenerated={(reportData) => {
              const moduleName = reportData.metadata?.module || "EMPLOYEES";
              const reportTypeName = reportData.metadata?.reportType || "SUMMARY";
              navigate(`/reports/view?module=${moduleName}&type=${reportTypeName}`, {
                state: { reportData },
              });
            }}
          />
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <ReportAuditLog />
        </TabsContent>
      </Tabs>
    </div>
  );
}
