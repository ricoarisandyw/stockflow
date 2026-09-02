import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authMiddleware } from "@/server/middleware/auth.middleware";
import { ApiResponse } from "@/lib/api-response";
import { ErrorConstant } from "@/constants/error.constant";
import { InvoiceStatus } from "@/generated/prisma/enums";
import { InvoiceLib } from "@/lib/invoice.lib";

type TRouteParams = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: TRouteParams) {
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
    if (invoice.status !== InvoiceStatus.DRAFT && invoice.status !== InvoiceStatus.ISSUED) {
      return ApiResponse.fail(ErrorConstant.INVOICE_INVALID_TRANSITION);
    }

    const restoredStock = invoice.status === InvoiceStatus.ISSUED;

    const updated = await prisma.$transaction(async (tx) => {
      if (restoredStock) {
        await InvoiceLib.restoreStockForItems(invoice.items, tx);
      }

      return tx.invoice.update({
        where: { id },
        data: { status: InvoiceStatus.CANCELLED },
      });
    });

    return ApiResponse.ok({
      id: updated.id,
      status: updated.status,
      restoredStock,
      updatedAt: updated.updatedAt,
    });
  } catch (error) {
    return ApiResponse.handleApiError(error);
  }
}
