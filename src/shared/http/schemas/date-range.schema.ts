import { z } from "zod";

export const createdDateRangeSchema = z.object({
  createdFrom: z.coerce.date().optional(),
  createdTo: z.coerce.date().optional(),
});

type CreatedDateRange = {
  createdFrom?: Date | undefined;
  createdTo?: Date | undefined;
};

export const withCreatedDateRange = <T extends z.ZodRawShape>(schema: z.ZodObject<T>) => {
  return schema
    .extend({
      createdFrom: z.coerce.date().optional(),
      createdTo: z.coerce.date().optional(),
    })
    .refine(
      (query) => {
        const range = query as CreatedDateRange;

        return (
          range.createdFrom === undefined ||
          range.createdTo === undefined ||
          range.createdFrom <= range.createdTo
        );
      },
      {
        message: "createdFrom must be before or equal to createdTo.",
        path: ["createdTo"],
      },
    );
};
