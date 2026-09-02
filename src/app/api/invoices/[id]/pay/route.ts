import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authMiddleware } from "@/server/middleware/auth.middleware";
import { ApiResponse } from "@/lib/api-response";
import { ErrorConstant } from "@/constants/error.constant";
import { InvoiceStatus } from "@/generated/prisma/enums";

type TRouteParams = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: TRouteParams) {
  try {
    const payload = await authMiddleware(request);
    const { id } = await params;

    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice || invoice.userId !== payload.sub) {
      return ApiResponse.fail(ErrorConstant.INVOICE_NOT_FOUND);
    }
    if (invoice.status !== InvoiceStatus.ISSUED) {
      return ApiResponse.fail(ErrorConstant.INVOICE_INVALID_TRANSITION);
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: { status: InvoiceStatus.PAID },
      include: { items: true },
    });

    return ApiResponse.ok(updated);
  } catch (error) {
    return ApiResponse.handleApiError(error);
  }
}
