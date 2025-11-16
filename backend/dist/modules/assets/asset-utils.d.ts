/**
 * Generate asset code in format: CHIRO-YYYY-CAT-XXXX
 * Where YYYY is the year, CAT is a 3-letter category code, and XXXX is a sequential number
 */
export declare function generateAssetCode(categoryId: string): Promise<string>;
/**
 * Calculate depreciation for an asset
 */
export declare function calculateDepreciation(purchasePrice: number, depreciationMethod: "STRAIGHT_LINE" | "DECLINING_BALANCE", depreciationRate: number, lifeYears: number, yearsElapsed: number): {
    depreciationAmount: number;
    accumulatedDepr: number;
    bookValue: number;
};
//# sourceMappingURL=asset-utils.d.ts.map