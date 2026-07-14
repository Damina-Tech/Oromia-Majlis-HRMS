"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getDistrictsForZone,
  getOromiaZoneNames,
  OROMIA_REGION_NAME,
} from "@/constants/oromia-zones-districts";

export type OromiaLocationValue = {
  zone: string;
  district: string;
  kebele?: string;
};

type Props = {
  value: OromiaLocationValue;
  onChange: (value: OromiaLocationValue) => void;
  /** Show kebele / ganda text field */
  showKebele?: boolean;
  kebeleLabel?: string;
  kebelePlaceholder?: string;
  zoneLabel?: string;
  districtLabel?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  /** Use 2-column grid on md+ screens */
  layout?: "stack" | "grid";
};

export default function OromiaLocationPicker({
  value,
  onChange,
  showKebele = false,
  kebeleLabel = "Kebele / Ganda",
  kebelePlaceholder = "Enter kebele name",
  zoneLabel = "Zone",
  districtLabel = "District / Woreda",
  required = false,
  disabled = false,
  className = "",
  layout = "grid",
}: Props) {
  const zoneNames = getOromiaZoneNames();
  const districts = value.zone ? getDistrictsForZone(value.zone) : [];
  const req = required ? <span className="text-red-600"> *</span> : null;
  const containerClass = layout === "grid" ? "grid gap-4 md:grid-cols-2" : "space-y-4";

  return (
    <div className={`space-y-4 ${className}`}>
      <div className={containerClass}>
        <div className="space-y-2 md:col-span-2">
          <Label>Region{req}</Label>
          <Input value={OROMIA_REGION_NAME} readOnly disabled className="bg-muted/60" />
        </div>
        <div className="space-y-2">
          <Label>
            {zoneLabel}
            {req}
          </Label>
          <Select
            value={value.zone || undefined}
            onValueChange={(zone) => onChange({ ...value, zone, district: "" })}
            disabled={disabled}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select zone" />
            </SelectTrigger>
            <SelectContent>
              {zoneNames.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>
            {districtLabel}
            {req}
          </Label>
          <Select
            value={value.district || undefined}
            onValueChange={(district) => onChange({ ...value, district })}
            disabled={disabled || !value.zone}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={value.zone ? "Select district" : "Select zone first"} />
            </SelectTrigger>
            <SelectContent>
              {districts.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {showKebele ? (
          <div className="space-y-2 md:col-span-2">
            <Label>{kebeleLabel}</Label>
            <Input
              value={value.kebele ?? ""}
              onChange={(e) => onChange({ ...value, kebele: e.target.value })}
              placeholder={kebelePlaceholder}
              disabled={disabled}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
