import { randomUUID } from "node:crypto";
import path from "node:path";

/**
 * Builds a storage key: `uploads/<uuid>-<sanitized-original-name>`.
 */
export const buildUploadObjectKey = (originalName: string): string => {
  const basename = path.basename(originalName).normalize("NFKC");
  const sanitized = basename
    .replace(/[^\w.\-()+ ]+/g, "_")
    .replace(/\s+/g, "-")
    .replace(/^[._-]+/, "")
    .replace(/[._-]+$/, "")
    .slice(0, 100);

  const safeName = sanitized.length > 0 ? sanitized : "file";

  return `uploads/${randomUUID()}-${safeName}`;
};
