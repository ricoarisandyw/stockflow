import { vi } from "vitest";
import { invoiceItemTestUtils, type MockInvoiceItem } from "./invoice-item.mock";

export type MockInvoiceStatus = "DRAFT" | "ISSUED" | "PAID" | "CANCELLED";

export interface MockInvoice {
  id: string;
  userId: string;
  invoiceNumber: string;
  customerName: string;
  issueDate: Date;
  dueDate: Date;
  status: MockInvoiceStatus;
  notes: string | null;
  taxRate: number;
  subtotal: number;
  taxAmount: number;
  total: number;
  createdAt: Date;
  updatedAt: Date;
}

type TInclude = { items?: boolean; _count?: { select: { items: boolean } } };

let invoices: MockInvoice[] = [];
let nextId = 1;

function reset() {
  invoices = [];
  nextId = 1;
}

function seedInvoice(
  partial: Partial<MockInvoice> & { userId: string; invoiceNumber: string; customerName: string }
): MockInvoice {
  const invoice: MockInvoice = {
    id: partial.id ?? `inv_${nextId++}`,
    userId: partial.userId,
    invoiceNumber: partial.invoiceNumber,
    customerName: partial.customerName,
    issueDate: partial.issueDate ?? new Date(),
    dueDate: partial.dueDate ?? new Date(),
    status: partial.status ?? "DRAFT",
    notes: partial.notes ?? null,
    taxRate: partial.taxRate ?? 11,
    subtotal: partial.subtotal ?? 0,
    taxAmount: partial.taxAmount ?? 0,
    total: partial.total ?? 0,
    createdAt: partial.createdAt ?? new Date(),
    updatedAt: partial.updatedAt ?? new Date(),
  };
  invoices.push(invoice);
  return invoice;
}

type TInvoiceWhere = {
  userId?: string;
  status?: MockInvoiceStatus;
  invoiceNumber?: { startsWith?: string };
  OR?: Array<{ customerName?: { contains?: string }; invoiceNumber?: { contains?: string } }>;
};

function matchesSearch(invoice: MockInvoice, search?: string) {
  if (!search) return true;
  const term = search.toLowerCase();
  return (
    invoice.customerName.toLowerCase().includes(term) ||
    invoice.invoiceNumber.toLowerCase().includes(term)
  );
}

function filterInvoices(where: TInvoiceWhere) {
  return invoices.filter((inv) => {
    if (where.userId && inv.userId !== where.userId) return false;
    if (where.status && inv.status !== where.status) return false;
    if (where.invoiceNumber?.startsWith && !inv.invoiceNumber.startsWith(where.invoiceNumber.startsWith)) {
      return false;
    }
    if (where.OR) {
      const search = where.OR[0]?.customerName?.contains ?? where.OR[0]?.invoiceNumber?.contains;
      if (!matchesSearch(inv, search)) return false;
    }
    return true;
  });
}

function withInclude(invoice: MockInvoice, include?: TInclude): MockInvoice & {
  items?: MockInvoiceItem[];
  _count?: { items: number };
} {
  if (!include) return invoice;
  const result: MockInvoice & { items?: MockInvoiceItem[]; _count?: { items: number } } = {
    ...invoice,
  };
  if (include.items) {
    result.items = invoiceItemTestUtils.getByInvoiceId(invoice.id);
  }
  if (include._count) {
    result._count = { items: invoiceItemTestUtils.getByInvoiceId(invoice.id).length };
  }
  return result;
}

export const invoiceModel = {
  findUnique: vi.fn(
    async ({ where, include }: { where: { id: string }; include?: TInclude }) => {
      const invoice = invoices.find((inv) => inv.id === where.id);
      if (!invoice) return null;
      return withInclude(invoice, include);
    }
  ),
  findMany: vi.fn(
    async ({
      where,
      orderBy,
      skip = 0,
      take,
      include,
    }: {
      where: TInvoiceWhere;
      orderBy?: Record<string, "asc" | "desc">;
      skip?: number;
      take?: number;
      include?: TInclude;
    }) => {
      let result = filterInvoices(where);
      if (orderBy) {
        const [field, dir] = Object.entries(orderBy)[0] as [keyof MockInvoice, "asc" | "desc"];
        result = [...result].sort((a, b) => {
          const av = a[field];
          const bv = b[field];
          if (av === bv) return 0;
          const cmp = av! > bv! ? 1 : -1;
          return dir === "asc" ? cmp : -cmp;
        });
      }
      const page = result.slice(skip, take ? skip + take : undefined);
      return page.map((invoice) => withInclude(invoice, include));
    }
  ),
  count: vi.fn(async ({ where }: { where: TInvoiceWhere }) => {
    return filterInvoices(where).length;
  }),
  create: vi.fn(
    async ({
      data,
      include,
    }: {
      data: Partial<MockInvoice> & {
        userId: string;
        invoiceNumber: string;
        customerName: string;
        items?: { create: Array<Omit<MockInvoiceItem, "id" | "invoiceId" | "createdAt" | "updatedAt">> };
      };
      include?: TInclude;
    }) => {
      const { items, ...invoiceData } = data;
      const invoice = seedInvoice(invoiceData);
      (items?.create ?? []).forEach((line) => {
        invoiceItemTestUtils.seedInvoiceItem({ ...line, invoiceId: invoice.id });
      });
      return withInclude(invoice, include);
    }
  ),
  update: vi.fn(
    async ({
      where,
      data,
      include,
    }: {
      where: { id: string };
      data: Partial<
        Pick<
          MockInvoice,
          | "customerName"
          | "dueDate"
          | "notes"
          | "status"
          | "subtotal"
          | "taxRate"
          | "taxAmount"
          | "total"
        >
      > & {
        items?: { create: Array<Omit<MockInvoiceItem, "id" | "invoiceId" | "createdAt" | "updatedAt">> };
      };
      include?: TInclude;
    }) => {
      const invoice = invoices.find((inv) => inv.id === where.id);
      if (!invoice) throw new Error("Invoice not found");
      const { items, ...invoiceData } = data;
      Object.assign(invoice, invoiceData, { updatedAt: new Date() });
      (items?.create ?? []).forEach((line) => {
        invoiceItemTestUtils.seedInvoiceItem({ ...line, invoiceId: invoice.id });
      });
      return withInclude(invoice, include);
    }
  ),
};

export const invoiceTestUtils = {
  reset,
  seedInvoice,
  getInvoices: () => invoices,
};
