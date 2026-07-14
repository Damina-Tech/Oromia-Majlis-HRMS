import prisma from "../../db/client.js";

export const OROMIA_REGION_NAME = "Oromia";

/** Ensure Oromia region + zone + woreda exist and return their IDs. */
export async function resolveOromiaGeography(zoneName: string, districtName: string) {
  const zone = zoneName.trim();
  const district = districtName.trim();
  if (!zone || !district) {
    throw new Error("Zone and district are required");
  }

  const region = await prisma.region.upsert({
    where: { name: OROMIA_REGION_NAME },
    create: { name: OROMIA_REGION_NAME, code: "OR" },
    update: {},
  });

  const zoneRow = await prisma.zone.upsert({
    where: { regionId_name: { regionId: region.id, name: zone } },
    create: { name: zone, regionId: region.id },
    update: {},
  });

  const woreda = await prisma.woreda.upsert({
    where: { zoneId_name: { zoneId: zoneRow.id, name: district } },
    create: { name: district, zoneId: zoneRow.id },
    update: {},
  });

  return {
    regionId: region.id,
    zoneId: zoneRow.id,
    woredaId: woreda.id,
    regionName: region.name,
    zoneName: zoneRow.name,
    districtName: woreda.name,
  };
}
