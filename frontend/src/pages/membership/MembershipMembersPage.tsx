"use client";
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { ArrowLeft, Users, Search, Eye, Trash2, ChevronLeft, ChevronRight, UserPlus } from "lucide-react";
import { membershipApi, type MemberCategory, type Member } from "@/services/membership";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const ALL_CATEGORIES = "__all__";
const ALL_STATUSES = "__all__";
const PAGE_SIZE = 15;

type MembershipStatusFilter = "ACTIVE" | "PENDING_PAYMENT" | "EXPIRED" | "NONE";

const CATEGORY_LABELS: Record<MemberCategory, string> = {
  REGULAR_MEMBER: "Regular Member",
  BUSINESS_OWNER: "Business Owner",
  YOUTH_WOMEN_COUNCIL: "Youth/Women",
  FARMER: "Farmer",
  ELDER_MOTHER: "Elder/Mother",
};

const STATUS_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: ALL_STATUSES, label: "All statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "PENDING_PAYMENT", label: "Pending" },
  { value: "EXPIRED", label: "Expired" },
  { value: "NONE", label: "None" },
];

function getMembershipStatus(member: Member): string {
  const subs = member.subscriptions ?? [];
  if (subs.some((s) => s.status === "ACTIVE")) return "Active";
  if (subs.some((s) => s.status === "PENDING_PAYMENT")) return "Pending";
  if (subs.some((s) => s.status === "EXPIRED")) return "Expired";
  return "None";
}

function getMembershipPlanName(member: Member): string {
  const subs = member.subscriptions ?? [];
  const active = subs.find((s) => s.status === "ACTIVE");
  if (active?.plan?.name) return active.plan.name;
  const latest = [...subs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  return latest?.plan?.name ?? "—";
}

function StatusBadge({ status }: { status: string }) {
  const classes = {
    Active: "text-emerald-600 dark:text-emerald-400",
    Pending: "text-amber-600 dark:text-amber-400",
    Expired: "text-red-600 dark:text-red-400",
    None: "text-slate-600 dark:text-slate-400",
  };
  return (
    <Badge variant="secondary" className={classes[status as keyof typeof classes] ?? "text-slate-600 dark:text-slate-400"}>
      {status}
    </Badge>
  );
}

export default function MembershipMembersPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>(ALL_CATEGORIES);
  const [membershipStatus, setMembershipStatus] = useState<string>(ALL_STATUSES);
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);

  useEffect(() => {
    const status = searchParams.get("membershipStatus");
    const cat = searchParams.get("category");
    if (status && ["ACTIVE", "PENDING_PAYMENT", "EXPIRED", "NONE"].includes(status)) {
      setMembershipStatus(status);
    }
    if (cat && cat !== ALL_CATEGORIES) {
      setCategory(cat);
    }
  }, [searchParams]);

  const isAdmin = hasPermission("majlis.membership.admin");

  const { data, isLoading } = useQuery({
    queryKey: ["membership-members", search, category, membershipStatus, page],
    queryFn: () =>
      membershipApi.members.list({
        limit: PAGE_SIZE,
        page,
        search: search || undefined,
        category: category === ALL_CATEGORIES ? undefined : (category as MemberCategory),
        membershipStatus: membershipStatus === ALL_STATUSES ? undefined : (membershipStatus as MembershipStatusFilter),
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => membershipApi.members.delete(id),
    onSuccess: () => {
      toast.success("Member deleted.");
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["membership-members"] });
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message ?? "Failed to delete member");
    },
  });

  const members = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const showPagination = total > PAGE_SIZE;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent dark:from-indigo-600/20 dark:via-purple-600/10 border border-indigo-200/50 dark:border-indigo-800/30 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/majlis/membership")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-indigo-900 dark:text-indigo-100">
                Members
              </h1>
              <p className="text-indigo-700/80 dark:text-indigo-300/80 text-sm">
                Registered Majlis members
              </p>
            </div>
          </div>
          <Button size="sm" onClick={() => navigate("/majlis/membership/register")}>
            <UserPlus className="h-4 w-4 mr-2" />
            Register Member
          </Button>
        </div>
      </div>

      <Card className="border-indigo-200/50 dark:border-indigo-800/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-indigo-900 dark:text-indigo-100">
            <Users className="h-5 w-5" /> All members
          </CardTitle>
          <CardDescription>
            Search and filter members. Use View or Delete to manage. Edit from the member details page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, phone, email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
            <Select
              value={category}
              onValueChange={(v) => {
                setCategory(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_CATEGORIES}>All categories</SelectItem>
                {(Object.entries(CATEGORY_LABELS) as [MemberCategory, string][]).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={membershipStatus}
              onValueChange={(v) => {
                setMembershipStatus(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTER_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {isLoading ? (
            <div className="py-8 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" />
            </div>
          ) : members.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No members found.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-indigo-200/50 dark:border-indigo-800/30 -mx-1 sm:mx-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-indigo-200/50 dark:border-indigo-800/30">
                      <TableHead className="whitespace-nowrap">Name</TableHead>
                      <TableHead className="whitespace-nowrap">Phone</TableHead>
                      <TableHead className="whitespace-nowrap hidden sm:table-cell">Category</TableHead>
                      <TableHead className="whitespace-nowrap">Membership plan</TableHead>
                      <TableHead className="whitespace-nowrap">Status</TableHead>
                      <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((m) => (
                      <TableRow
                        key={m.id}
                        className="border-indigo-200/30 dark:border-indigo-800/20 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30"
                      >
                        <TableCell className="font-medium">{m.fullName}</TableCell>
                        <TableCell className="whitespace-nowrap">{m.phone}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="secondary">{CATEGORY_LABELS[m.category]}</Badge>
                        </TableCell>
                        <TableCell>{getMembershipPlanName(m)}</TableCell>
                        <TableCell>
                          <StatusBadge status={getMembershipStatus(m)} />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1 flex-wrap">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/majlis/membership/members/${m.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {isAdmin && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => setDeleteTarget(m)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {showPagination && (
                <div className="flex items-center justify-between gap-4 pt-2">
                  <p className="text-sm text-muted-foreground">
                    Page {page} of {totalPages} · {total} total
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deleteTarget?.fullName}? This will remove all subscriptions and certificates. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
