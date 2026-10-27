import { StorageError } from "@/shared/storage/errors/storage.error";

/**
 * Normalizes and validates an object key (no absolute paths or `..` segments).
 *
 * @param key - The key to normalize.
 * @returns The normalized key.
 */
export const normalizeStorageKey = (key: string): string => {
  // Replace all backslashes with forward slashes and remove leading and trailing slashes.
  const normalized = key.replaceAll("\\", "/").replace(/^\/+/, "").trim();

  // If the normalized key is empty, throw an error.
  if (!normalized) {
    throw new StorageError("Storage object key must not be empty.");
  }

  // Split the normalized key into segments and validate them.
  const segments = normalized.split("/");

  if (segments.some((segment) => segment === "" || segment === "." || segment === "..")) {
    throw new StorageError("Storage object key contains invalid path segments.");
  }

  return segments.join("/");
};
