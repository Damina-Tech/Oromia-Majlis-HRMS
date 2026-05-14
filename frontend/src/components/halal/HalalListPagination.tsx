import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const HALAL_LIST_PAGE_SIZE = 15;

type HalalListPaginationProps = {
  page: number;
  total: number;
  pageSize?: number;
  onPageChange: (nextPage: number) => void;
  className?: string;
};

/**
 * Previous / Next controls when the list has more rows than pageSize (default 15).
 */
export function HalalListPagination({
  page,
  total,
  pageSize = HALAL_LIST_PAGE_SIZE,
  onPageChange,
  className,
}: HalalListPaginationProps) {
  if (total <= pageSize) return null;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, total);

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-t bg-muted/20 px-4 py-3 text-sm text-muted-foreground",
        className
      )}
    >
      <span className="tabular-nums">
        {start}–{end} of {total}
      </span>
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" disabled={safePage <= 1} onClick={() => onPageChange(safePage - 1)}>
          Previous
        </Button>
        <span className="text-xs tabular-nums px-1">
          Page {safePage} / {totalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
