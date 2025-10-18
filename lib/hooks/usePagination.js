"use client";

import { useCallback, useMemo, useState } from "react";

export function usePagination(items = [], pageSize = 10, initialPage = 1) {
  const safePageSize = Math.max(1, Number(pageSize) || 10);
  const [currentPage, setCurrentPage] = useState(initialPage);

  const totalItems = Array.isArray(items) ? items.length : 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize));

  const page = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = (page - 1) * safePageSize;
  const endIndex = startIndex + safePageSize;

  const pageItems = useMemo(() => {
    if (!Array.isArray(items)) return [];
    return items.slice(startIndex, endIndex);
  }, [items, startIndex, endIndex]);

  const goToPage = useCallback(
    (targetPage) => {
      const next = Math.min(Math.max(1, targetPage), totalPages);
      setCurrentPage(next);
    },
    [totalPages]
  );

  const goToNextPage = useCallback(() => {
    if (page < totalPages) {
      setCurrentPage(page + 1);
    }
  }, [page, totalPages]);

  const goToPreviousPage = useCallback(() => {
    if (page > 1) {
      setCurrentPage(page - 1);
    }
  }, [page]);

  const paginationRange = useMemo(() => {
    if (totalPages <= 1) return [1];
    const range = [];
    for (let i = 1; i <= totalPages; i += 1) {
      range.push(i);
    }
    return range;
  }, [totalPages]);

  return {
    currentPage: page,
    pageSize: safePageSize,
    totalItems,
    totalPages,
    pageItems,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    paginationRange,
  };
}
