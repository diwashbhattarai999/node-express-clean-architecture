import { z } from "zod";

/** Multipart body is validated by multer middleware; schema keeps asHandler typing consistent. */
export const uploadFileSchema = z.object({});

export type UploadFileSchema = typeof uploadFileSchema;
