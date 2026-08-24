import { z } from "zod";

const PASSWORD_LIMITS = {
  MIN_LENGTH: 8,
  MAX_LENGTH: 128,
};

export const passwordSchema = z
  .string({ error: "Password is required." })
  .min(
    PASSWORD_LIMITS.MIN_LENGTH,
    `Password must be at least ${PASSWORD_LIMITS.MIN_LENGTH} characters.`,
  )
  .max(
    PASSWORD_LIMITS.MAX_LENGTH,
    `Password must not exceed ${PASSWORD_LIMITS.MAX_LENGTH} characters.`,
  )
  .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
  .regex(/\d/, "Password must contain at least one number.")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character.");
