import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Generate asset code in format: CHIRO-YYYY-CAT-XXXX
 * Where YYYY is the year, CAT is a 3-letter category code, and XXXX is a sequential number
 */
export async function generateAssetCode(categoryId: string): Promise<string> {
  const year = new Date().getFullYear();
  
  // Get category
  const category = await prisma.assetCategory.findUnique({
    where: { id: categoryId },
  });
  
  if (!category) {
    throw new Error("Category not found");
  }
  
  // Get category code (first 3 letters of category name, uppercase)
  const categoryCode = category.name
    .substring(0, 3)
    .toUpperCase()
    .replace(/[^A-Z]/g, "");
  
  // Find the highest sequence number for this year and category
  const existingAssets = await prisma.asset.findMany({
    where: {
      assetCode: {
        startsWith: `CHIRO-${year}-${categoryCode}-`,
      },
    },
    orderBy: {
      assetCode: "desc",
    },
    take: 1,
  });
  
  let sequence = 1;
  if (existingAssets.length > 0) {
    const lastCode = existingAssets[0].assetCode;
    const lastSequence = parseInt(lastCode.split("-").pop() || "0", 10);
    sequence = lastSequence + 1;
  }
  
  // Format sequence as 4-digit number with leading zeros
  const sequenceStr = sequence.toString().padStart(4, "0");
  
  return `CHIRO-${year}-${categoryCode}-${sequenceStr}`;
}

/**
 * Calculate depreciation for an asset
 */
export function calculateDepreciation(
  purchasePrice: number,
  depreciationMethod: "STRAIGHT_LINE" | "DECLINING_BALANCE",
  depreciationRate: number,
  lifeYears: number,
  yearsElapsed: number
): {
  depreciationAmount: number;
  accumulatedDepr: number;
  bookValue: number;
} {
  if (depreciationMethod === "STRAIGHT_LINE") {
    // Straight-line: (Purchase Price - Salvage Value) / Life Years
    // Assuming salvage value is 0 for simplicity
    const annualDepreciation = purchasePrice / lifeYears;
    const depreciationAmount = annualDepreciation;
    const accumulatedDepr = annualDepreciation * yearsElapsed;
    const bookValue = purchasePrice - accumulatedDepr;
    
    return {
      depreciationAmount: Math.max(0, depreciationAmount),
      accumulatedDepr: Math.min(accumulatedDepr, purchasePrice),
      bookValue: Math.max(0, bookValue),
    };
  } else {
    // Declining balance: Purchase Price * Rate
    const depreciationAmount = purchasePrice * (depreciationRate / 100);
    const accumulatedDepr = depreciationAmount * yearsElapsed;
    const bookValue = purchasePrice - accumulatedDepr;
    
    return {
      depreciationAmount: Math.max(0, depreciationAmount),
      accumulatedDepr: Math.min(accumulatedDepr, purchasePrice),
      bookValue: Math.max(0, bookValue),
    };
  }
}

