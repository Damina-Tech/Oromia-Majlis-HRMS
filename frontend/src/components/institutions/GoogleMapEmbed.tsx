"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, ExternalLink } from "lucide-react";

interface GoogleMapEmbedProps {
  latitude: number;
  longitude: number;
  title?: string;
  height?: number;
  zoom?: number;
}

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

export default function GoogleMapEmbed({
  latitude,
  longitude,
  title = "Location",
  height = 400,
  zoom = 15,
}: GoogleMapEmbedProps) {
  const query = `${latitude},${longitude}`;
  const mapsUrl = `https://www.google.com/maps?q=${encodeURIComponent(query)}`;
  const embedUrl =
    GOOGLE_MAPS_API_KEY &&
    `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}&q=${encodeURIComponent(query)}&zoom=${zoom}`;

  return (
    <Card className="overflow-hidden shadow-md border-gray-200">
      <CardHeader className="py-4 bg-gradient-to-r from-slate-50 to-gray-50 border-b">
        <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-red-600" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {embedUrl ? (
          <iframe
            title="Google Map"
            src={embedUrl}
            width="100%"
            height={height}
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full"
          />
        ) : (
          <div
            className="flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100"
            style={{ height }}
          >
            <div className="text-center p-6 max-w-sm">
              <MapPin className="h-14 w-14 mx-auto mb-4 text-red-500/80" />
              <p className="text-sm font-medium text-gray-700 mb-1">Coordinates</p>
              <p className="text-xs text-gray-500 font-mono mb-4">
                {latitude.toFixed(6)}, {longitude.toFixed(6)}
              </p>
              <Button
                asChild
                variant="default"
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-md"
              >
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open in Google Maps
                </a>
              </Button>
              <p className="text-xs text-muted-foreground mt-4">
                Set VITE_GOOGLE_MAPS_API_KEY in .env for embedded map
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
