import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authMiddleware } from "@/server/middleware/auth.middleware";
import { ApiResponse } from "@/lib/api-response";
import { ErrorConstant } from "@/constants/error.constant";
import { InvoiceStatus } from "@/generated/prisma/enums";
import { InvoiceLib } from "@/lib/invoice.lib";
import { updateInvoiceSchema } from "@/schemas/invoice.schema";

type TRouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: TRouteParams) {
  try {
    const payload = await authMiddleware(request);
    const { id } = await params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!invoice || invoice.userId !== payload.sub) {
      return ApiResponse.fail(ErrorConstant.INVOICE_NOT_FOUND);
    }

    return ApiResponse.ok(invoice);
  } catch (error) {
    return ApiResponse.handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: TRouteParams) {
  try {
    const payload = await authMiddleware(request);
    const { id } = await params;

    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice || invoice.userId !== payload.sub) {
      return ApiResponse.fail(ErrorConstant.INVOICE_NOT_FOUND);
    }
    if (invoice.status !== InvoiceStatus.DRAFT) {
      return ApiResponse.fail(ErrorConstant.INVOICE_NOT_DRAFT);
    }

    const body = await request.json();
    const parsed = updateInvoiceSchema.safeParse(body);
    if (!parsed.success) return ApiResponse.failZod(parsed.error);

    const { customerName, dueDate, notes, items } = parsed.data;

    const updated = await prisma.$transaction(async (tx) => {
      if (items) {
        const lines = await InvoiceLib.resolveInvoiceLines(payload.sub, items, tx);
        const totals = InvoiceLib.calculateTotals(lines);

        await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });

        return tx.invoice.update({
          where: { id },
          data: {
            ...(customerName !== undefined ? { customerName } : {}),
            ...(dueDate !== undefined ? { dueDate } : {}),
            ...(notes !== undefined ? { notes } : {}),
            subtotal: totals.subtotal,
            taxRate: totals.taxRate,
            taxAmount: totals.taxAmount,
            total: totals.total,
            items: { create: lines },
          },
          include: { items: true },
        });
      }

      return tx.invoice.update({
        where: { id },
        data: {
          ...(customerName !== undefined ? { customerName } : {}),
          ...(dueDate !== undefined ? { dueDate } : {}),
          ...(notes !== undefined ? { notes } : {}),
        },
        include: { items: true },
      });
    });

    return ApiResponse.ok(updated);
  } catch (error) {
    return ApiResponse.handleApiError(error);
  }
}
