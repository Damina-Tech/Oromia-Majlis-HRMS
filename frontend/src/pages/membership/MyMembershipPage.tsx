"use client";
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Award, CreditCard, ExternalLink, Loader2 } from "lucide-react";
import { membershipApi } from "@/services/membership";
import { useQuery } from "@tanstack/react-query";
import { API_BASE_URL } from "@/config/api";

const CATEGORY_LABELS: Record<string, string> = {
  REGULAR_MEMBER: "Regular Member",
  BUSINESS_OWNER: "Business Owner",
  YOUTH_WOMEN_COUNCIL: "Youth/Women Council",
  FARMER: "Farmer",
  ELDER_MOTHER: "Elder/Mother",
};

export default function MyMembershipPage() {
  const { data: member, isLoading, error } = useQuery({
    queryKey: ["membership-me"],
    queryFn: () => membershipApi.members.getMe(),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="p-4 sm:p-6 max-w-xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>My Membership</CardTitle>
            <CardDescription>
              No member profile is linked to your account. If you have registered for Majlis membership, ask an administrator to link your account to your member record.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild>
              <a href="/register/membership" target="_blank" rel="noopener noreferrer">
                Register for membership <ExternalLink className="h-4 w-4 ml-2" />
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const subscriptions = member.subscriptions ?? [];
  const activeCert = subscriptions.find((s) => s.certificate && s.status === "ACTIVE")?.certificate;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-2xl mx-auto">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent dark:from-indigo-600/20 dark:via-purple-600/10 border border-indigo-200/50 dark:border-indigo-800/30 p-4 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-bold text-indigo-900 dark:text-indigo-100">
          My Membership
        </h1>
        <p className="text-indigo-700/80 dark:text-indigo-300/80 text-sm mt-1">
          Your Majlis membership profile and certificates
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" /> Profile
          </CardTitle>
          <CardDescription>
            <Badge>{CATEGORY_LABELS[member.category] ?? member.category}</Badge>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><span className="text-muted-foreground">Name:</span> {member.fullName}</p>
          <p><span className="text-muted-foreground">Phone:</span> {member.phone}</p>
          {member.email && <p><span className="text-muted-foreground">Email:</span> {member.email}</p>}
          {member.region && (
            <p><span className="text-muted-foreground">Region:</span> {member.region.name}
              {member.zone && ` / ${member.zone.name}`}
              {member.woreda && ` / ${member.woreda.name}`}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" /> Subscriptions & certificates
          </CardTitle>
          <CardDescription>Your membership history. Download your current certificate below.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscriptions.length === 0 ? (
            <p className="text-muted-foreground">No subscriptions yet.</p>
          ) : (
            <ul className="space-y-3">
              {subscriptions.map((sub) => (
                <li key={sub.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div>
                    <p className="font-medium">{sub.plan?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {sub.status} · {sub.startDate && new Date(sub.startDate).toLocaleDateString()} – {sub.endDate && new Date(sub.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  {sub.certificate && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`${API_BASE_URL}/api/v1/membership/certificates/by-id/${sub.certificate.certificateId}/download`, "_blank")}
                    >
                      <Award className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {activeCert && (
            <div className="pt-2">
              <Button asChild>
                <a href={`${API_BASE_URL}/api/v1/membership/certificates/by-id/${activeCert.certificateId}/download`} target="_blank" rel="noopener noreferrer">
                  <Award className="h-4 w-4 mr-2" />
                  Download current certificate
                </a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Renewal</CardTitle>
          <CardDescription>
            When your membership is near expiry, you can renew online. Visit the public registration page and complete payment, or contact the office for manual renewal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <a href="/register/membership" target="_blank" rel="noopener noreferrer">
              Open registration page <ExternalLink className="h-4 w-4 ml-2" />
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
