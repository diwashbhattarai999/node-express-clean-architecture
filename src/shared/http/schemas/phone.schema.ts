import { z } from "zod";

const E164_PHONE_REGEX = /^\+[1-9]\d{6,14}$/;

export const phoneSchema = z
  .string({ error: "Phone is required." })
  .trim()
  .regex(E164_PHONE_REGEX, "Phone must be a valid E.164 number (e.g. +9779812345678).");
