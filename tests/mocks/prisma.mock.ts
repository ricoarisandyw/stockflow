import { vi } from "vitest";
import { userModel, userTestUtils } from "./models/user.mock";
import { productModel, productTestUtils } from "./models/product.mock";
import { invoiceModel, invoiceTestUtils } from "./models/invoice.mock";
import { invoiceItemModel, invoiceItemTestUtils } from "./models/invoice-item.mock";

export type { MockUser } from "./models/user.mock";
export type { MockProduct } from "./models/product.mock";
export type { MockInvoice } from "./models/invoice.mock";
export type { MockInvoiceItem } from "./models/invoice-item.mock";

export const mockPrisma = {
  user: userModel,
  product: productModel,
  invoice: invoiceModel,
  invoiceItem: invoiceItemModel,
  $transaction: vi.fn(async (callback: (tx: typeof mockPrisma) => unknown) => {
    return callback(mockPrisma);
  }),
};

function resetMockDb() {
  userTestUtils.reset();
  productTestUtils.reset();
  invoiceTestUtils.reset();
  invoiceItemTestUtils.reset();
}

export const prismaTestUtils = {
  resetMockDb,
  seedUser: userTestUtils.seedUser,
  getUsers: userTestUtils.getUsers,
  seedProduct: productTestUtils.seedProduct,
  getProducts: productTestUtils.getProducts,
  seedInvoice: invoiceTestUtils.seedInvoice,
  getInvoices: invoiceTestUtils.getInvoices,
  seedInvoiceItem: invoiceItemTestUtils.seedInvoiceItem,
  getInvoiceItems: invoiceItemTestUtils.getInvoiceItems,
};
