import { z } from "zod";

export const DEVICE_NAME_MAX_LENGTH = 255;

export const updateSessionLabelSchema = z.object({
  params: z.object({
    sessionId: z.uuid({ error: "Session id must be a valid UUID." }),
  }),
  body: z.object({
    deviceName: z
      .string({ error: "Device name is required." })
      .trim()
      .min(1, "Device name is required.")
      .max(
        DEVICE_NAME_MAX_LENGTH,
        `Device name must be at most ${DEVICE_NAME_MAX_LENGTH} characters.`,
      ),
  }),
});

export type UpdateSessionLabelSchema = typeof updateSessionLabelSchema;
