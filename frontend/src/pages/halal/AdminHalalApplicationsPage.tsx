"use client";
import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye } from "lucide-react";
import { halalApi, type HalalApplicationStatus } from "@/services/halal";
import { useQuery } from "@tanstack/react-query";

const STATUSES: HalalApplicationStatus[] = ["DRAFT", "SUBMITTED", "REVIEW", "INSPECTION", "APPROVED", "REJECTED"];

export default function AdminHalalApplicationsPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const { data, isLoading } = useQuery({
    queryKey: ["halal-applications-admin", statusFilter],
    queryFn: () => halalApi.applications.list({
      limit: 50,
      status: statusFilter !== "ALL" ? (statusFilter as HalalApplicationStatus) : undefined,
    }),
  });

  if (isLoading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-bold">Halal Applications</h1>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Applications</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items?.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.business?.name ?? "—"}</TableCell>
                    <TableCell><Badge>{a.status}</Badge></TableCell>
                    <TableCell>
                      {a.status === "DRAFT" ? (
                        "—"
                      ) : a.feePaidAt ? (
                        <span className="text-green-600 text-sm">Paid</span>
                      ) : (
                        <span className="text-amber-600 text-sm">Pending</span>
                      )}
                    </TableCell>
                    <TableCell>{a.submittedAt ? new Date(a.submittedAt).toLocaleDateString() : "—"}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" onClick={() => navigate(`/admin/halal/applications/${a.id}`)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {/* Mobile cards */}
          <div className="md:hidden divide-y">
            {data?.items?.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer"
                onClick={() => navigate(`/admin/halal/applications/${a.id}`)}
              >
                <div>
                  <p className="font-medium">{a.business?.name ?? "—"}</p>
                  <p className="text-sm text-muted-foreground">
                    {a.submittedAt ? new Date(a.submittedAt).toLocaleDateString() : "—"}
                    {a.status !== "DRAFT" &&
                      (a.feePaidAt ? " • Paid" : " • Fee pending")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge>{a.status}</Badge>
                  <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); navigate(`/admin/halal/applications/${a.id}`); }}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
