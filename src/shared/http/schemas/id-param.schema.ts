import { z } from "zod";

type IdParamSchemaOptions = {
  message?: string;
};

export const createIdParamSchema = (options: IdParamSchemaOptions = {}) => {
  const { message = "Id must be a valid UUID." } = options;

  return z.object({
    id: z.uuid({ error: message }),
  });
};

export const idParamSchema = createIdParamSchema();
