import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-response";
import { ErrorConstant } from "@/constants/error.constant";
import { MoneyUtils } from "@/utils/money.utils";
import type { TInvoiceItemInput } from "@/schemas/invoice.schema";

async function generateInvoiceNumber(): Promise<string> {
  const today = new Date();
  const datePart = `${today.getUTCFullYear()}${String(today.getUTCMonth() + 1).padStart(2, "0")}${String(
    today.getUTCDate()
  ).padStart(2, "0")}`;
  const prefix = `INV-${datePart}-`;

  const countToday = await prisma.invoice.count({
    where: { invoiceNumber: { startsWith: prefix } },
  });

  return `${prefix}${String(countToday + 1).padStart(4, "0")}`;
}

type TResolvedInvoiceLine = {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

async function resolveInvoiceLines(
  userId: string,
  items: TInvoiceItemInput[]
): Promise<TResolvedInvoiceLine[]> {
  const productIds = [...new Set(items.map((item) => item.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, userId },
  });
  const productMap = new Map(products.map((product) => [product.id, product]));

  return items.map((item) => {
    const product = productMap.get(item.productId);
    if (!product) {
      throw new ApiError(ErrorConstant.INVOICE_PRODUCT_NOT_FOUND);
    }
    if (item.quantity > product.quantityOnHand) {
      throw new ApiError(
        ErrorConstant.INVOICE_INSUFFICIENT_STOCK,
        `Insufficient stock for product "${product.name}". Available: ${product.quantityOnHand}, requested: ${item.quantity}.`
      );
    }
    return {
      productId: product.id,
      productName: product.name,
      unitPrice: product.unitPrice,
      quantity: item.quantity,
      lineTotal: MoneyUtils.lineTotal(product.unitPrice, item.quantity),
    };
  });
}

function getConfiguredTaxRatePercent(): number {
  const raw = process.env.TAX_RATE_PERCENT;
  const parsed = raw !== undefined ? Number(raw) : NaN;
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : MoneyUtils.DEFAULT_TAX_RATE_PERCENT;
}

function calculateTotals(lines: TResolvedInvoiceLine[]) {
  return MoneyUtils.calculate(
    lines.map((line) => ({ unitPrice: line.unitPrice, quantity: line.quantity })),
    getConfiguredTaxRatePercent()
  );
}

export const InvoiceLib = {
  generateInvoiceNumber,
  resolveInvoiceLines,
  calculateTotals,
};
