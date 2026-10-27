import { describe, expect, it } from "vitest";

import { buildUploadObjectKey } from "@/modules/uploads/application/utils/build-upload-object-key";

describe("buildUploadObjectKey", () => {
  it("prefixes uploads/ and sanitizes path segments from the original name", () => {
    const key = buildUploadObjectKey("../../evil/report.pdf");

    expect(key).toMatch(/^uploads\/[0-9a-f-]{36}-report\.pdf$/);
  });

  it("falls back to file when the name is empty after sanitization", () => {
    const key = buildUploadObjectKey("***");

    expect(key).toMatch(/^uploads\/[0-9a-f-]{36}-file$/);
  });
});
