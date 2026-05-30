"use client";

import { Button } from "@/components/ui/button";

interface PaginationControlsProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
  className?: string;
}

export function PaginationControls({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  itemLabel = "registros",
  className = "",
}: PaginationControlsProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const from = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const to = Math.min(safeCurrentPage * pageSize, totalItems);

  if (totalItems === 0) return null;

  return (
    <div
      className={`flex flex-col gap-3 border-t pt-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <span>
        Mostrando {from} - {to} de {totalItems} {itemLabel}.
      </span>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={safeCurrentPage <= 1}
          onClick={() => onPageChange(Math.max(1, safeCurrentPage - 1))}
        >
          Anterior
        </Button>
        <span className="min-w-[92px] text-center font-medium text-foreground">
          Página {safeCurrentPage} de {totalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={safeCurrentPage >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, safeCurrentPage + 1))}
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
}
