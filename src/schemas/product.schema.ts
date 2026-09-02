import { z } from "zod";

export const productListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional(),
  sortBy: z.enum(["name", "sku", "unitPrice", "quantityOnHand", "createdAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const createProductSchema = z.object({
  sku: z.string().trim().min(1, "SKU is required."),
  name: z.string().trim().min(1, "Name is required."),
  description: z.string().trim().optional(),
  unitPrice: z.number().int("Unit price must be an integer.").min(0, "Unit price must be >= 0."),
  quantityOnHand: z
    .number()
    .int("Quantity on hand must be an integer.")
    .min(0, "Quantity on hand must be >= 0."),
});

export const updateProductSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").optional(),
  description: z.string().trim().optional(),
  unitPrice: z.number().int("Unit price must be an integer.").min(0, "Unit price must be >= 0.").optional(),
  quantityOnHand: z
    .number()
    .int("Quantity on hand must be an integer.")
    .min(0, "Quantity on hand must be >= 0.")
    .optional(),
});

export const productResponseSchema = z.object({
  id: z.string(),
  sku: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  unitPrice: z.number(),
  quantityOnHand: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type TProductListQuery = z.infer<typeof productListQuerySchema>;
export type TCreateProductInput = z.infer<typeof createProductSchema>;
export type TUpdateProductInput = z.infer<typeof updateProductSchema>;
export type TProductResponse = z.infer<typeof productResponseSchema>;

export const productSchema = {
  listQuery: productListQuerySchema,
  create: createProductSchema,
  update: updateProductSchema,
  response: productResponseSchema,
};
