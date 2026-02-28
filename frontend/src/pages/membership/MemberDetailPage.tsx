"use client";
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, User, CreditCard, Award, Banknote, Link2, Loader2 } from "lucide-react";
import { membershipApi } from "@/services/membership";
import { useAuth } from "@/contexts/AuthContext";
import { listUsers } from "@/services/users";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { API_BASE_URL } from "@/config/api";

const CATEGORY_LABELS: Record<string, string> = {
  REGULAR_MEMBER: "Regular Member",
  BUSINESS_OWNER: "Business Owner",
  YOUTH_WOMEN_COUNCIL: "Youth/Women Council",
  FARMER: "Farmer",
  ELDER_MOTHER: "Elder/Mother",
};

export default function MemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const [manualSubId, setManualSubId] = useState<string | null>(null);
  const [manualReceipt, setManualReceipt] = useState<File | null>(null);
  const [linkUserId, setLinkUserId] = useState<string>("");

  const isAdmin = hasPermission("majlis.membership.admin");

  const { data: member, isLoading } = useQuery({
    queryKey: ["membership-member", id],
    queryFn: () => membershipApi.members.get(id!),
    enabled: !!id,
  });
  const { data: usersData } = useQuery({
    queryKey: ["users-list"],
    queryFn: () => listUsers({ pageSize: 200 }),
    enabled: isAdmin && !!member,
  });

  useEffect(() => {
    if (member) setLinkUserId(member.userId ?? "");
  }, [member?.id]);

  const manualPaymentMutation = useMutation({
    mutationFn: (subId: string) => {
      const formData = new FormData();
      if (manualReceipt) formData.append("receipt", manualReceipt);
      return membershipApi.subscriptions.confirmManual(subId, formData);
    },
    onSuccess: () => {
      toast.success("Payment confirmed. Certificate generated.");
      setManualSubId(null);
      setManualReceipt(null);
      queryClient.invalidateQueries({ queryKey: ["membership-member", id] });
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message ?? "Failed to confirm payment");
    },
  });

  const linkUserMutation = useMutation({
    mutationFn: (userId: string | null) => membershipApi.members.update(id!, { userId }),
    onSuccess: (_, userId) => {
      toast.success(userId ? "Member linked to user." : "Link removed.");
      queryClient.invalidateQueries({ queryKey: ["membership-member", id] });
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message ?? "Failed to update");
    },
  });

  if (isLoading || !member) {
    return (
      <div className="p-6 flex justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/majlis/membership/members")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-xl font-bold">Member details</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" /> {member.fullName}
          </CardTitle>
          <CardDescription>
            <Badge>{CATEGORY_LABELS[member.category] ?? member.category}</Badge>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><span className="text-muted-foreground">Phone:</span> {member.phone}</p>
          {member.email && <p><span className="text-muted-foreground">Email:</span> {member.email}</p>}
          {member.region && <p><span className="text-muted-foreground">Region:</span> {member.region.name} {member.zone && ` / ${member.zone.name}`} {member.woreda && ` / ${member.woreda.name}`}</p>}
          {member.addressLine && <p><span className="text-muted-foreground">Address:</span> {member.addressLine}</p>}
          {isAdmin && (
            <div className="pt-4 border-t mt-4">
              <Label className="flex items-center gap-2 mb-2"><Link2 className="h-4 w-4" /> Link to user (portal access)</Label>
              <div className="flex gap-2 items-center">
                <Select
                  value={linkUserId}
                  onValueChange={(v) => setLinkUserId(v)}
                >
                  <SelectTrigger className="max-w-xs">
                    <SelectValue placeholder="No user linked" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No user linked</SelectItem>
                    {usersData?.items?.map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.email})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  onClick={() => linkUserMutation.mutate(linkUserId ? linkUserId : null)}
                  disabled={linkUserMutation.isPending}
                >
                  {linkUserMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Linking allows this member to sign in and see their profile & certificates.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" /> Subscriptions
          </CardTitle>
          <CardDescription>Membership history and certificates</CardDescription>
        </CardHeader>
        <CardContent>
          {member.subscriptions?.length ? (
            <ul className="space-y-3">
              {member.subscriptions.map((sub) => (
                <li key={sub.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div>
                    <p className="font-medium">{sub.plan?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {sub.status} · {sub.startDate && new Date(sub.startDate).toLocaleDateString()} – {sub.endDate && new Date(sub.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {sub.status === "PENDING_PAYMENT" && (isAdmin || hasPermission("majlis.membership.register")) && (
                      <Button size="sm" variant="outline" onClick={() => setManualSubId(sub.id)}>
                        <Banknote className="h-4 w-4 mr-1" />
                        Mark manual payment
                      </Button>
                    )}
                    {sub.certificate && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`${API_BASE_URL}/api/v1/membership/certificates/by-id/${sub.certificate.certificateId}/download`, "_blank")}
                      >
                        <Award className="h-4 w-4 mr-1" />
                        Download cert
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No subscriptions yet.</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!manualSubId} onOpenChange={(open) => !open && setManualSubId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark manual / cash payment</DialogTitle>
            <DialogDescription>
              Confirm payment received. Optionally upload receipt. Certificate will be generated.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label>Receipt (optional)</Label>
            <Input type="file" accept="image/*,.pdf" onChange={(e) => setManualReceipt(e.target.files?.[0] ?? null)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManualSubId(null)}>Cancel</Button>
            <Button
              onClick={() => manualSubId && manualPaymentMutation.mutate(manualSubId)}
              disabled={manualPaymentMutation.isPending}
            >
              {manualPaymentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirm payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
