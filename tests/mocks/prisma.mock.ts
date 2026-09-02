import { userModel, userTestUtils } from "./models/user.mock";
import { productModel, productTestUtils } from "./models/product.mock";
import { invoiceItemModel, invoiceItemTestUtils } from "./models/invoice-item.mock";

export type { MockUser } from "./models/user.mock";
export type { MockProduct } from "./models/product.mock";
export type { MockInvoiceItem } from "./models/invoice-item.mock";

export const mockPrisma = {
  user: userModel,
  product: productModel,
  invoiceItem: invoiceItemModel,
};

function resetMockDb() {
  userTestUtils.reset();
  productTestUtils.reset();
  invoiceItemTestUtils.reset();
}

export const prismaTestUtils = {
  resetMockDb,
  seedUser: userTestUtils.seedUser,
  getUsers: userTestUtils.getUsers,
  seedProduct: productTestUtils.seedProduct,
  getProducts: productTestUtils.getProducts,
  seedInvoiceItem: invoiceItemTestUtils.seedInvoiceItem,
  getInvoiceItems: invoiceItemTestUtils.getInvoiceItems,
};
