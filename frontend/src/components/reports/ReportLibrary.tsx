import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Search,
  Play,
  Filter,
  Users,
  Calendar,
  DollarSign,
  Clock,
  Archive,
  CreditCard,
  Folder,
  Timer,
} from "lucide-react";
import {
  getReportTemplates,
  ReportTemplate,
  getModuleLabel,
  getReportTypeLabel,
} from "@/services/reports";
import { toast } from "sonner";

interface ReportLibraryProps {
  onSelectTemplate?: (template: ReportTemplate) => void;
  onCreateCustom?: () => void;
}

const moduleIcons: Record<string, any> = {
  EMPLOYEES: Users,
  DEPARTMENTS: Users,
  LEAVES: Calendar,
  ATTENDANCE: Clock,
  PAYROLL: DollarSign,
  TASKS: Clock,
  ASSETS: Archive,
  EXPENSES: CreditCard,
  DOCUMENTS: Folder,
  TIMESHEETS: Timer,
};

export default function ReportLibrary({
  onSelectTemplate,
  onCreateCustom,
}: ReportLibraryProps) {
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState<string>("all");

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await getReportTemplates();
      setTemplates(response.items);
    } catch (error: any) {
      console.error("Failed to load templates:", error);
      toast.error("Failed to load report templates");
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      searchQuery === "" ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesModule = moduleFilter === "all" || template.module === moduleFilter;
    return matchesSearch && matchesModule;
  });

  const groupedTemplates = filteredTemplates.reduce((acc, template) => {
    if (!acc[template.module]) {
      acc[template.module] = [];
    }
    acc[template.module].push(template);
    return acc;
  }, {} as Record<string, ReportTemplate[]>);

  const modules = Array.from(new Set(templates.map((t) => t.module)));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Report Library</h2>
          <p className="text-muted-foreground">
            Browse and use pre-built report templates
          </p>
        </div>
        {onCreateCustom && (
          <Button onClick={onCreateCustom}>
            <FileText className="mr-2 h-4 w-4" />
            Create Custom Report
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={moduleFilter} onValueChange={setModuleFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by module" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Modules</SelectItem>
            {modules.map((module) => (
              <SelectItem key={module} value={module}>
                {getModuleLabel(module)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Templates grouped by module */}
      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="text-muted-foreground">Loading templates...</div>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedTemplates).map(([module, moduleTemplates]) => {
            const Icon = moduleIcons[module] || FileText;
            return (
              <div key={module}>
                <div className="flex items-center gap-2 mb-4">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">{getModuleLabel(module)}</h3>
                  <Badge variant="outline">{moduleTemplates.length}</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {moduleTemplates.map((template) => (
                    <Card
                      key={template.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => onSelectTemplate?.(template)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-base">{template.name}</CardTitle>
                          {template.isSystem && (
                            <Badge variant="secondary" className="text-xs">
                              System
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="line-clamp-2">
                          {template.description || "No description"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            {getReportTypeLabel(template.reportType)}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectTemplate?.(template);
                            }}
                          >
                            <Play className="mr-1 h-3 w-3" />
                            Run
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}

          {filteredTemplates.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No templates found</p>
                {searchQuery && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Try adjusting your search or filters
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

