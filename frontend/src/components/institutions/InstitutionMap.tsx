"use client";
import React, { useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, School, BookOpen, MapPin } from "lucide-react";
import { type Institution } from "@/services/institutions";

interface InstitutionMapProps {
  institutions: Institution[];
  onInstitutionClick?: (institution: Institution) => void;
  center?: { lat: number; lng: number };
  zoom?: number;
}

export default function InstitutionMap({
  institutions,
  onInstitutionClick,
  center,
  zoom = 10,
}: InstitutionMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map (using Leaflet as example - you can use Google Maps, Mapbox, etc.)
    // For now, we'll create a simple SVG-based map visualization
    // In production, integrate with Google Maps API or Mapbox

    const defaultCenter = center || { lat: 9.1450, lng: 38.7617 }; // Addis Ababa default

    // Simple visualization - in production, use actual map library
    if (mapRef.current) {
      mapRef.current.innerHTML = `
        <div style="width: 100%; height: 100%; background: #f0f0f0; position: relative; border-radius: 8px; overflow: hidden;">
          <div style="padding: 20px; text-align: center; color: #666;">
            <MapPin style="width: 48px; height: 48px; margin: 0 auto 10px; opacity: 0.5;" />
            <p>Map visualization</p>
            <p style="font-size: 12px; margin-top: 10px;">
              ${institutions.length} institution(s) with coordinates
            </p>
            <p style="font-size: 11px; color: #999; margin-top: 5px;">
              Integrate with Google Maps API or Mapbox for full map view
            </p>
          </div>
        </div>
      `;
    }
  }, [institutions, center, zoom]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "MOSQUE":
        return <Building2 className="h-4 w-4" />;
      case "MADRASAH":
        return <School className="h-4 w-4" />;
      case "MARKAZ":
        return <BookOpen className="h-4 w-4" />;
    }
  };

  const institutionsWithCoords = institutions.filter(
    (inst) => inst.latitude && inst.longitude
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Institution Locations</CardTitle>
        <CardDescription>
          {institutionsWithCoords.length} of {institutions.length} institutions have coordinates
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div ref={mapRef} className="w-full h-[400px] mb-4" />

        {/* Institution List with Coordinates */}
        {institutionsWithCoords.length > 0 && (
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {institutionsWithCoords.map((institution) => (
              <div
                key={institution.id}
                className="flex items-center justify-between p-2 border rounded hover:bg-gray-50 cursor-pointer"
                onClick={() => onInstitutionClick?.(institution)}
              >
                <div className="flex items-center gap-2">
                  {getTypeIcon(institution.type)}
                  <div>
                    <div className="font-medium text-sm">{institution.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {institution.latitude != null 
                        ? Number(institution.latitude).toFixed(4) 
                        : 'N/A'}, {institution.longitude != null 
                        ? Number(institution.longitude).toFixed(4) 
                        : 'N/A'}
                    </div>
                  </div>
                </div>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </div>
            ))}
          </div>
        )}

        {institutionsWithCoords.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No institutions with GPS coordinates</p>
            <p className="text-sm">Add coordinates to institutions to view on map</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

