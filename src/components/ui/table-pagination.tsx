import { Button } from "./button";
import React from "react";

export interface TablePaginationProps {
  page: number;
  totalPages?: number;
  totalItems?: number;
  onPrev: () => void;
  onNext: () => void;
  disablePrev?: boolean;
  disableNext?: boolean;
  className?: string;
  label?: string; // Accessible label context (e.g., "Shops" or "Distributions")
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  page,
  totalPages,
  totalItems,
  onPrev,
  onNext,
  disablePrev,
  disableNext,
  className = "",
  label = "Pagination"
}) => {
  return (
    <div className={`flex items-center justify-between gap-4 text-xs ${className}`} aria-label={label}>
      <div className="text-muted-foreground">
        Page {page}{totalPages && totalPages > 0 ? ` of ${totalPages}`: ''}{typeof totalItems === 'number' ? ` • Total ${totalItems}`: ''}
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" disabled={disablePrev} onClick={onPrev} aria-label="Previous page">Prev</Button>
        <Button size="sm" variant="outline" disabled={disableNext} onClick={onNext} aria-label="Next page">Next</Button>
      </div>
    </div>
  );
};
