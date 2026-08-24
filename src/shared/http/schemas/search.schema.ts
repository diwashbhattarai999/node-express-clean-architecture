import { z } from "zod";

const SEARCH_LIMITS = {
  MIN_LENGTH: 1,
  MAX_LENGTH: 100,
};

export const searchSchema = z
  .string()
  .trim()
  .min(SEARCH_LIMITS.MIN_LENGTH, `Search must be at least ${SEARCH_LIMITS.MIN_LENGTH} characters.`)
  .max(SEARCH_LIMITS.MAX_LENGTH, `Search must not exceed ${SEARCH_LIMITS.MAX_LENGTH} characters.`);

export const optionalSearchSchema = z
  .string()
  .trim()
  .max(SEARCH_LIMITS.MAX_LENGTH, `Search must not exceed ${SEARCH_LIMITS.MAX_LENGTH} characters.`)
  .optional();
