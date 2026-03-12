interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination = ({
  page,
  totalPages,
  onPageChange,
}: PaginationProps) => {
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm">
      <button
        type="button"
        className="rounded-md border border-slate-200 px-3 py-1 text-xs text-slate-600 disabled:opacity-50"
        disabled={!canPrev}
        onClick={() => onPageChange(page - 1)}
      >
        Anterior
      </button>
      <span className="text-xs text-slate-500">
        Pagina {page} de {totalPages}
      </span>
      <button
        type="button"
        className="rounded-md border border-slate-200 px-3 py-1 text-xs text-slate-600 disabled:opacity-50"
        disabled={!canNext}
        onClick={() => onPageChange(page + 1)}
      >
        Siguiente
      </button>
    </div>
  );
};
