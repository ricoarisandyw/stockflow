import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-response";
import { ErrorConstant } from "@/constants/error.constant";
import { MoneyUtils } from "@/utils/money.utils";
import type { TInvoiceItemInput } from "@/schemas/invoice.schema";
import type { Prisma } from "@/generated/prisma/client";

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
  items: TInvoiceItemInput[],
  transaction: Prisma.TransactionClient = prisma
): Promise<TResolvedInvoiceLine[]> {
  const productIds = [...new Set(items.map((item) => item.productId))];
  const products = await transaction.product.findMany({
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

async function decrementStockForItems(
  items: { productId: string; quantity: number }[],
  transaction: Prisma.TransactionClient = prisma
): Promise<void> {
  for (const item of items) {
    const product = await transaction.product.findUnique({ where: { id: item.productId } });
    if (!product || item.quantity > product.quantityOnHand) {
      throw new ApiError(
        ErrorConstant.INVOICE_INSUFFICIENT_STOCK,
        product
          ? `Insufficient stock for product "${product.name}". Available: ${product.quantityOnHand}, requested: ${item.quantity}.`
          : undefined
      );
    }
    await transaction.product.update({
      where: { id: item.productId },
      data: { quantityOnHand: { decrement: item.quantity } },
    });
  }
}

async function restoreStockForItems(
  items: { productId: string; quantity: number }[],
  transaction: Prisma.TransactionClient = prisma
): Promise<void> {
  for (const item of items) {
    await transaction.product.update({
      where: { id: item.productId },
      data: { quantityOnHand: { increment: item.quantity } },
    });
  }
}

export const InvoiceLib = {
  generateInvoiceNumber,
  resolveInvoiceLines,
  calculateTotals,
  decrementStockForItems,
  restoreStockForItems,
};
