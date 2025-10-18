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
    <nav className="pagination">
      <button
        type="button"
        className="pagination__button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!hasPreviousPage}
        aria-label="Previous page"
      >
        <i className="uil uil-angle-left"></i>
      </button>

      <ul className="pagination__list">
        {paginationRange.map((page) => (
          <li key={page}>
            <button
              type="button"
              className={`pagination__page ${
                page === currentPage ? "pagination__page--active" : ""
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
        className="pagination__button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!hasNextPage}
        aria-label="Next page"
      >
        <i className="uil uil-angle-right"></i>
      </button>
    </nav>
  );
}
