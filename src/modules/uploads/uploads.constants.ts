/** Default limits for the sample uploads API (per-route overrides can come later). */
export const UPLOAD_MAX_FILE_SIZE_BYTES = 5_242_880; // 5 MiB

export const UPLOAD_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;
