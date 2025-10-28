/**
 * Calculate pagination offset and limit from page and pageSize
 */
export declare function paginate(page: number, pageSize: number): {
    skip: number;
    take: number;
};
/**
 * Calculate total pages from total items and page size
 */
export declare function getTotalPages(total: number, pageSize: number): number;
/**
 * Generate pagination metadata
 */
export declare function getPaginationMeta(page: number, pageSize: number, total: number): {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
};
//# sourceMappingURL=pagination.d.ts.map