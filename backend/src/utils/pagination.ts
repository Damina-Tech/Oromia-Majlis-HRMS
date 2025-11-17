/**
 * Calculate pagination offset and limit from page and pageSize
 */
export function paginate(page: number, pageSize: number): { skip: number; take: number } {
  const skip = (page - 1) * pageSize;
  const take = pageSize;
  
  return { skip, take };
}

/**
 * Calculate total pages from total items and page size
 */
export function getTotalPages(total: number, pageSize: number): number {
  return Math.ceil(total / pageSize);
}

/**
 * Generate pagination metadata
 */
export function getPaginationMeta(page: number, pageSize: number, total: number) {
  return {
    page,
    pageSize,
    total,
    totalPages: getTotalPages(total, pageSize),
    hasNext: page < getTotalPages(total, pageSize),
    hasPrev: page > 1,
  };
}
