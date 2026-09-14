"use client";

import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Building2, School, BookOpen, MapPin, Award, Edit, Eye, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { institutionsApi, type Institution, type InstitutionType } from "@/services/institutions";
import {
  institutionRecognitionApi,
  findActiveRecognition,
  recognitionCertificateLifecycle,
  recognitionExpiresAt,
} from "@/services/institution-recognition";
import { resolveFileUrl } from "@/config/api";
import { useAuth } from "@/contexts/AuthContext";

function typeIcon(type: InstitutionType) {
  if (type === "MADRASAH") return <School className="h-5 w-5" />;
  if (type === "MARKAZ") return <BookOpen className="h-5 w-5" />;
  return <Building2 className="h-5 w-5" />;
}

function InstitutionOwnerCard({ institution }: { institution: Institution }) {
  const navigate = useNavigate();
  const isMosque = institution.type === "MOSQUE";

  const { data: recognitions } = useQuery({
    queryKey: ["institution-recognitions", institution.id],
    queryFn: () => institutionRecognitionApi.list(institution.id),
    enabled: isMosque,
  });

  const items = recognitions?.items ?? [];
  const active = findActiveRecognition(items);
  const activeLife = active ? recognitionCertificateLifecycle(active) : null;

  return (
    <Card className="overflow-hidden border-indigo-100 shadow-md">
      {institution.imageUrl ? (
        <img
          src={resolveFileUrl(institution.imageUrl)}
          alt={institution.name}
          className="h-40 w-full object-cover"
        />
      ) : (
        <div className="h-28 bg-gradient-to-br from-indigo-100 to-slate-100 flex items-center justify-center text-indigo-700">
          {typeIcon(institution.type)}
        </div>
      )}
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-lg">{institution.name}</CardTitle>
            <CardDescription className="font-mono text-xs mt-1">{institution.institutionCode}</CardDescription>
          </div>
          <Badge variant="outline">{institution.status.split("_").join(" ")}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            {[institution.address, institution.woreda?.name, institution.zone?.name].filter(Boolean).join(" · ") ||
              "Location not set"}
          </span>
        </div>

        {isMosque ? (
          <div className="rounded-lg border bg-slate-50 p-3 text-sm space-y-1">
            <div className="flex items-center gap-2 font-medium">
              <Award className="h-4 w-4 text-emerald-700" />
              Recognition certificate
            </div>
            {active && activeLife === "active" ? (
              <p className="text-emerald-800">
                Active — {active.certificateNumber}
                {recognitionExpiresAt(active)
                  ? ` · valid until ${new Date(recognitionExpiresAt(active)!).toLocaleDateString()}`
                  : ""}
              </p>
            ) : (
              <p className="text-amber-800">No active certificate. You can request one from the institution page.</p>
            )}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => navigate(`/majlis/institutions/${institution.id}`)}>
            <Eye className="h-4 w-4 mr-1.5" />
            View & manage
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/majlis/institutions/${institution.id}/edit`)}
          >
            <Edit className="h-4 w-4 mr-1.5" />
            Edit details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MyInstitutionsPage() {
  const { user } = useAuth();
  const { data, isLoading, error } = useQuery({
    queryKey: ["my-institutions"],
    queryFn: () => institutionsApi.listMine(),
  });

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My institutions</h1>
        <p className="text-muted-foreground mt-1">
          Welcome{user?.firstName ? `, ${user.firstName}` : ""}. Manage the mosque or institution you registered and
          request recognition certificates when eligible.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading your institutions…
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-8 text-center text-red-600">Failed to load your institutions.</CardContent>
        </Card>
      ) : !data?.items?.length ? (
        <Card>
          <CardContent className="py-10 text-center space-y-4">
            <p className="text-muted-foreground">You have not registered an institution yet.</p>
            <Button asChild>
              <Link to="/register/institution">Register an institution</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {data.items.map((institution) => (
            <InstitutionOwnerCard key={institution.id} institution={institution} />
          ))}
        </div>
      )}
    </div>
  );
}
