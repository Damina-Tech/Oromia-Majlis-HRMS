import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const raw = fs.readFileSync(path.join(__dirname, "../oromia sone and districts"), "utf8");
const lines = raw.split(/\r?\n/);
const zones = [];
let current = null;
for (const line of lines) {
  const t = line.trim();
  if (!t) continue;
  const m = t.match(/^(\d+)\.\s+(.+)$/);
  if (m) {
    if (current) zones.push(current);
    current = { name: m[2].trim(), districts: [] };
  } else if (current) {
    current.districts.push(t);
  }
}
if (current) zones.push(current);

const out = `/** Official Oromia Region zones and districts (woredas). */
export type OromiaZone = {
  name: string;
  districts: string[];
};

export const OROMIA_REGION_NAME = "Oromia" as const;

export const OROMIA_ZONES: OromiaZone[] = ${JSON.stringify(zones, null, 2)};

export function getDistrictsForZone(zoneName: string): string[] {
  const zone = OROMIA_ZONES.find((z) => z.name === zoneName);
  if (!zone) return [];
  return [...new Set(zone.districts)].sort((a, b) => a.localeCompare(b));
}

export function getOromiaZoneNames(): string[] {
  return OROMIA_ZONES.map((z) => z.name);
}
`;

fs.writeFileSync(path.join(__dirname, "../src/constants/oromia-zones-districts.ts"), out);
console.log("Generated", zones.length, "zones");
