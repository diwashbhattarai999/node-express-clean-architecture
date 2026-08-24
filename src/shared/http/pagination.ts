import type { IPagination } from "@/shared/http/api-response";

import type { Pagination } from "../kernel/pagination/pagination";

export interface PaginationMetaInput extends Pagination {
  totalRecords: number;
  recordShown: number;
}

export function getPaginationOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Creates a pagination meta object.
 *
 * @param input - The input object containing the total records, limit, and page.
 * @returns The pagination meta object.
 */
export function createPaginationMeta(input: PaginationMetaInput): IPagination {
  const totalPages = input.totalRecords === 0 ? 0 : Math.ceil(input.totalRecords / input.limit);
  const currentPage = totalPages === 0 ? 1 : Math.min(input.page, totalPages);
  const hasPrevious = currentPage > 1;
  const hasNext = totalPages > 0 && currentPage < totalPages;

  return {
    totalRecords: input.totalRecords,
    perPage: input.limit,
    currentPage,
    totalPages,
    pagingCounter: input.totalRecords === 0 ? 0 : (currentPage - 1) * input.limit + 1,
    hasPrevious,
    hasNext,
    prev: hasPrevious ? currentPage - 1 : null,
    next: hasNext ? currentPage + 1 : null,
    recordShown: input.recordShown,
  };
}
