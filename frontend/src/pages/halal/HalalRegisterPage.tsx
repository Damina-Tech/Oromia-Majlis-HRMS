"use client";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Building2, Loader2, Plus, Eye, Pencil, Trash2, Search } from "lucide-react";
import { halalApi } from "@/services/halal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const BUSINESS_STATUS_COLORS: Record<string, string> = {
  PENDING_APPROVAL: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  APPROVED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};
const BUSINESS_STATUS_LABELS: Record<string, string> = {
  PENDING_APPROVAL: "Pending Approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export default function HalalRegisterPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: businessesData, isLoading } = useQuery({
    queryKey: ["halal-businesses", searchQuery],
    queryFn: () => halalApi.businesses.list({ limit: 100, search: searchQuery || undefined }),
  });
  const businesses = businessesData?.items ?? [];

  const deleteMutation = useMutation({
    mutationFn: halalApi.businesses.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["halal-businesses"] });
      toast.success("Business deleted");
      setDeleteId(null);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Failed to delete"),
  });

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500/10 to-transparent dark:from-emerald-600/20 border border-emerald-200/50 dark:border-emerald-800/30 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/halal/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Register Business</h1>
              <p className="text-muted-foreground text-sm">Manage your registered businesses</p>
            </div>
          </div>
          <Button size="sm" className="shrink-0 bg-emerald-600 hover:bg-emerald-700" onClick={() => navigate("/halal/register/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Register Business
          </Button>
        </div>
      </div>

      <Card className="shadow-sm border-emerald-200/50 dark:border-emerald-900/30">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
                <Building2 className="h-5 w-5 text-emerald-600" />
                Registered Businesses
              </CardTitle>
              <CardDescription>Your businesses registered for Halal certification</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search businesses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : businesses.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No businesses registered yet.</p>
              <p className="text-sm mt-1">Click &quot;Register Business&quot; to add your first business.</p>
              <Button className="mt-4" onClick={() => navigate("/halal/register/new")}>
                <Plus className="h-4 w-4 mr-2" />
                Register Business
              </Button>
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Business Name</TableHead>
                      <TableHead className="hidden sm:table-cell">Category</TableHead>
                      <TableHead className="hidden sm:table-cell">Status</TableHead>
                      <TableHead className="hidden md:table-cell">Contact</TableHead>
                      <TableHead className="hidden lg:table-cell">Location</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {businesses.map((b) => (
                      <TableRow
                        key={b.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/halal/businesses/${b.id}`)}
                      >
                        <TableCell className="font-medium">{b.name}</TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">
                          {b.category.replace("_", " ")}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge className={BUSINESS_STATUS_COLORS[b.status ?? "PENDING_APPROVAL"] || "bg-muted"}>
                            {BUSINESS_STATUS_LABELS[b.status ?? "PENDING_APPROVAL"] ?? (b.status ?? "Pending Approval")}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm">
                          {b.contactName}
                          <span className="block text-muted-foreground text-xs">{b.contactEmail}</span>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                          {b.region?.name ?? b.woreda?.name ?? "—"}
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => navigate(`/halal/businesses/${b.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => navigate(`/halal/register/${b.id}/edit`)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteId(b.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="md:hidden divide-y">
                {businesses.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between p-4 hover:bg-muted/30 cursor-pointer"
                    onClick={() => navigate(`/halal/businesses/${b.id}`)}
                  >
                    <div>
                      <p className="font-medium">{b.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {b.category.replace("_", " ")} • {b.contactName}
                        <Badge className={`ml-2 ${BUSINESS_STATUS_COLORS[b.status ?? "PENDING_APPROVAL"] || "bg-muted"}`}>
                          {BUSINESS_STATUS_LABELS[b.status ?? "PENDING_APPROVAL"] ?? (b.status ?? "Pending Approval")}
                        </Badge>
                      </p>
                    </div>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/halal/businesses/${b.id}`)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/halal/register/${b.id}/edit`)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(b.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => !deleteMutation.isPending && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete business?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Businesses with existing applications cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
