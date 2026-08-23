import { describe, expect, it } from "vitest";

import { createPaginationMeta, getPaginationOffset } from "@/shared/http/pagination";

describe("pagination helpers", () => {
  it("calculates the offset from page and limit", () => {
    expect(getPaginationOffset(1, 10)).toBe(0);
    expect(getPaginationOffset(2, 10)).toBe(10);
    expect(getPaginationOffset(3, 25)).toBe(50);
  });

  it("builds pagination meta for a populated page", () => {
    expect(
      createPaginationMeta({
        totalRecords: 25,
        page: 2,
        limit: 10,
        recordShown: 10,
      }),
    ).toEqual({
      totalRecords: 25,
      perPage: 10,
      currentPage: 2,
      totalPages: 3,
      pagingCounter: 11,
      hasPrevious: true,
      hasNext: true,
      prev: 1,
      next: 3,
      recordShown: 10,
    });
  });

  it("builds pagination meta for an empty result set", () => {
    expect(
      createPaginationMeta({
        totalRecords: 0,
        page: 1,
        limit: 10,
        recordShown: 0,
      }),
    ).toEqual({
      totalRecords: 0,
      perPage: 10,
      currentPage: 1,
      totalPages: 0,
      pagingCounter: 0,
      hasPrevious: false,
      hasNext: false,
      prev: null,
      next: null,
      recordShown: 0,
    });
  });
});
