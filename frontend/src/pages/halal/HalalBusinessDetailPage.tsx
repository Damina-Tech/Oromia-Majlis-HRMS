"use client";
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building2, FileText } from "lucide-react";
import { halalApi } from "@/services/halal";
import { useQuery } from "@tanstack/react-query";

export default function HalalBusinessDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: business, isLoading } = useQuery({
    queryKey: ["halal-business", id],
    queryFn: () => halalApi.businesses.get(id!),
    enabled: !!id,
  });

  if (!id || isLoading) return <div className="p-6">Loading…</div>;
  if (!business) return <div className="p-6">Business not found</div>;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/halal/dashboard")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">{business.name}</h1>
          <p className="text-muted-foreground text-sm">{business.category.replace("_", " ")}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" /> Business details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><span className="text-muted-foreground">Contact:</span> {business.contactName}</p>
          <p><span className="text-muted-foreground">Email:</span> {business.contactEmail}</p>
          <p><span className="text-muted-foreground">Phone:</span> {business.contactPhone}</p>
          {business.address && <p><span className="text-muted-foreground">Address:</span> {business.address}</p>}
          {business.region?.name && (
            <p><span className="text-muted-foreground">Region:</span> {business.region.name}</p>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button onClick={() => navigate("/halal/apply/new", { state: { businessId: business.id } })}>
          <FileText className="h-4 w-4 mr-2" />
          Apply for Halal certification
        </Button>
      </div>
    </div>
  );
}
