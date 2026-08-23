export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T | null;
}

export interface ApiSuccessResponseWithMeta<T, M> {
  success: true;
  message: string;
  data: T | null;
  meta: M | null;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  code: string;
  requestId: string;
  details?: unknown;
}

export interface IPagination {
  totalRecords: number;
  perPage: number;
  currentPage: number;
  totalPages: number;
  pagingCounter: number;
  hasPrevious: boolean;
  hasNext: boolean;
  prev: number | null;
  next: number | null;
  recordShown: number;
}
