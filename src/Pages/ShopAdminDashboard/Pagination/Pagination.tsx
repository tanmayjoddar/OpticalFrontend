import { Button } from "@/components/ui/button";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <Button disabled={page === 1} onClick={() => onPageChange(page - 1)}>Prev</Button>
      <span>{page} / {totalPages}</span>
      <Button disabled={page === totalPages} onClick={() => onPageChange(page + 1)}>Next</Button>
    </div>
  );
}
