import { z } from "zod";
import { InvoiceStatus } from "@/generated/prisma/enums";

const invoiceStatusEnum = z.enum([
  InvoiceStatus.DRAFT,
  InvoiceStatus.ISSUED,
  InvoiceStatus.PAID,
  InvoiceStatus.CANCELLED,
]);

export const invoiceItemInputSchema = z.object({
  productId: z.string().min(1, "productId is required."),
  quantity: z.number().int("Quantity must be an integer.").positive("Quantity must be > 0."),
});

export const createInvoiceSchema = z.object({
  customerName: z.string().trim().min(1, "Customer name is required."),
  issueDate: z.coerce.date().optional(),
  dueDate: z.coerce.date({ error: "dueDate is required and must be a valid date." }),
  notes: z.string().trim().optional(),
  items: z.array(invoiceItemInputSchema).min(1, "At least one line item is required."),
});

export const updateInvoiceSchema = z.object({
  customerName: z.string().trim().min(1, "Customer name is required.").optional(),
  dueDate: z.coerce.date().optional(),
  notes: z.string().trim().optional(),
  items: z.array(invoiceItemInputSchema).min(1, "At least one line item is required.").optional(),
});

export const invoiceListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: invoiceStatusEnum.optional(),
  search: z.string().trim().optional(),
});

export const invoiceItemResponseSchema = z.object({
  id: z.string(),
  productId: z.string(),
  productName: z.string(),
  unitPrice: z.number(),
  quantity: z.number(),
  lineTotal: z.number(),
});

export const invoiceListItemResponseSchema = z.object({
  id: z.string(),
  invoiceNumber: z.string(),
  customerName: z.string(),
  issueDate: z.date(),
  dueDate: z.date(),
  status: invoiceStatusEnum,
  subtotal: z.number(),
  taxRate: z.number(),
  taxAmount: z.number(),
  total: z.number(),
  itemCount: z.number(),
  createdAt: z.date(),
});

export const invoiceDetailResponseSchema = z.object({
  id: z.string(),
  invoiceNumber: z.string(),
  customerName: z.string(),
  issueDate: z.date(),
  dueDate: z.date(),
  status: invoiceStatusEnum,
  notes: z.string().nullable().optional(),
  subtotal: z.number(),
  taxRate: z.number(),
  taxAmount: z.number(),
  total: z.number(),
  items: z.array(invoiceItemResponseSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type TInvoiceItemInput = z.infer<typeof invoiceItemInputSchema>;
export type TCreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type TUpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
export type TInvoiceListQuery = z.infer<typeof invoiceListQuerySchema>;
export type TInvoiceItemResponse = z.infer<typeof invoiceItemResponseSchema>;
export type TInvoiceListItemResponse = z.infer<typeof invoiceListItemResponseSchema>;
export type TInvoiceDetailResponse = z.infer<typeof invoiceDetailResponseSchema>;

export const invoiceSchema = {
  itemInput: invoiceItemInputSchema,
  create: createInvoiceSchema,
  update: updateInvoiceSchema,
  listQuery: invoiceListQuerySchema,
  itemResponse: invoiceItemResponseSchema,
  listItemResponse: invoiceListItemResponseSchema,
  detailResponse: invoiceDetailResponseSchema,
};
