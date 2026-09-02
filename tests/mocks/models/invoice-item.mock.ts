import { vi } from "vitest";

export interface MockInvoiceItem {
  id: string;
  invoiceId: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  createdAt: Date;
  updatedAt: Date;
}

let invoiceItems: MockInvoiceItem[] = [];
let nextId = 1;

function reset() {
  invoiceItems = [];
  nextId = 1;
}

function seedInvoiceItem(
  partial: Partial<MockInvoiceItem> & { invoiceId: string; productId: string }
): MockInvoiceItem {
  const item: MockInvoiceItem = {
    id: partial.id ?? `itm_${nextId++}`,
    invoiceId: partial.invoiceId,
    productId: partial.productId,
    productName: partial.productName ?? "",
    unitPrice: partial.unitPrice ?? 0,
    quantity: partial.quantity ?? 1,
    lineTotal: partial.lineTotal ?? 0,
    createdAt: partial.createdAt ?? new Date(),
    updatedAt: partial.updatedAt ?? new Date(),
  };
  invoiceItems.push(item);
  return item;
}

function getByInvoiceId(invoiceId: string) {
  return invoiceItems.filter((i) => i.invoiceId === invoiceId);
}

function deleteByInvoiceId(invoiceId: string) {
  const remaining = invoiceItems.filter((i) => i.invoiceId !== invoiceId);
  const deletedCount = invoiceItems.length - remaining.length;
  invoiceItems = remaining;
  return deletedCount;
}

export const invoiceItemModel = {
  findMany: vi.fn(async ({ where }: { where: { invoiceId?: string; productId?: string } }) => {
    return invoiceItems.filter((i) => {
      if (where.invoiceId && i.invoiceId !== where.invoiceId) return false;
      if (where.productId && i.productId !== where.productId) return false;
      return true;
    });
  }),
  count: vi.fn(async ({ where }: { where: { productId: string } }) => {
    return invoiceItems.filter((i) => i.productId === where.productId).length;
  }),
  create: vi.fn(
    async ({
      data,
    }: {
      data: Partial<MockInvoiceItem> & { invoiceId: string; productId: string };
    }) => seedInvoiceItem(data)
  ),
  deleteMany: vi.fn(async ({ where }: { where: { invoiceId: string } }) => {
    const count = deleteByInvoiceId(where.invoiceId);
    return { count };
  }),
};

export const invoiceItemTestUtils = {
  reset,
  seedInvoiceItem,
  getInvoiceItems: () => invoiceItems,
  getByInvoiceId,
};
