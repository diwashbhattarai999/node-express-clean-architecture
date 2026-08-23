export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiSuccessResponseWithMeta<T, M> {
  success: true;
  message: string;
  data: T;
  meta: M;
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
