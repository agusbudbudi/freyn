"use client";

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  hasNextPage,
  hasPreviousPage,
  paginationRange,
}) {
  if (totalPages <= 1) return null;

  return (
    <nav className="flex items-center justify-center gap-2">
      <button
        type="button"
        className="border border-solid border-slate-100 bg-white text-slate-900 rounded-lg w-9 h-9 inline-flex items-center justify-center cursor-pointer transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed enabled:hover:border-sky-wash enabled:hover:text-signal-blue"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!hasPreviousPage}
        aria-label="Previous page"
      >
        <i className="uil uil-angle-left"></i>
      </button>

      <ul className="flex items-center gap-1.5 list-none m-0 p-0">
        {paginationRange.map((page) => (
          <li key={page}>
            <button
              type="button"
              className={`border border-solid rounded-lg min-w-[36px] h-9 px-2.5 inline-flex items-center justify-center transition-all duration-200 ${
                page === currentPage
                  ? "bg-signal-blue text-white border-signal-blue cursor-default"
                  : "bg-white text-slate-900 border-slate-100 cursor-pointer hover:border-sky-wash hover:text-signal-blue"
              }`}
              onClick={() => onPageChange(page)}
              aria-current={page === currentPage ? "page" : undefined}
            >
              {page}
            </button>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className="border border-solid border-slate-100 bg-white text-slate-900 rounded-lg w-9 h-9 inline-flex items-center justify-center cursor-pointer transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed enabled:hover:border-sky-wash enabled:hover:text-signal-blue"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!hasNextPage}
        aria-label="Next page"
      >
        <i className="uil uil-angle-right"></i>
      </button>
    </nav>
  );
}
