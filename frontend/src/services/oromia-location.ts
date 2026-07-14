import api from "./api";

export type OromiaLocationSelection = {
  zone: string;
  district: string;
  kebele?: string;
};

export type ResolvedOromiaLocationIds = {
  regionId: string;
  zoneId: string;
  woredaId: string;
  regionName: string;
  zoneName: string;
  districtName: string;
};

export async function resolveOromiaLocationIds(
  zone: string,
  district: string,
  scope: "membership" | "institutions" = "membership"
): Promise<ResolvedOromiaLocationIds> {
  const path =
    scope === "membership" ? "/membership/geography/resolve" : "/institutions/geography/resolve";
  const response = await api.post<ResolvedOromiaLocationIds>(path, {
    zoneName: zone.trim(),
    districtName: district.trim(),
  });
  return response.data;
}
