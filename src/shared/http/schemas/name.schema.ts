import { z } from "zod";

type NameSchemaOptions = {
  requiredMessage?: string;
  max?: number;
  maxMessage?: string;
};

export const createNameSchema = (options: NameSchemaOptions = {}) => {
  const {
    requiredMessage = "Name is required.",
    max = 100,
    maxMessage = `Name must be at most ${max} characters.`,
  } = options;

  return z.string({ error: requiredMessage }).trim().min(1, requiredMessage).max(max, maxMessage);
};

export const nameSchema = createNameSchema();
