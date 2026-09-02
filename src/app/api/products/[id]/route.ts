import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authMiddleware } from "@/server/middleware/auth.middleware";
import { ApiResponse } from "@/lib/api-response";
import { ErrorConstant } from "@/constants/error.constant";
import { updateProductSchema } from "@/schemas/product.schema";

type TRouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: TRouteParams) {
  try {
    const payload = await authMiddleware(request);
    const { id } = await params;

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product || product.userId !== payload.sub) {
      return ApiResponse.fail(ErrorConstant.PRODUCT_NOT_FOUND);
    }

    return ApiResponse.ok(product);
  } catch (error) {
    return ApiResponse.handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: TRouteParams) {
  try {
    const payload = await authMiddleware(request);
    const { id } = await params;

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product || product.userId !== payload.sub) {
      return ApiResponse.fail(ErrorConstant.PRODUCT_NOT_FOUND);
    }

    const body = await request.json();
    const parsed = updateProductSchema.safeParse(body);
    if (!parsed.success) return ApiResponse.failZod(parsed.error);

    const updated = await prisma.product.update({
      where: { id },
      data: parsed.data,
    });

    return ApiResponse.ok(updated);
  } catch (error) {
    return ApiResponse.handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: TRouteParams) {
  try {
    const payload = await authMiddleware(request);
    const { id } = await params;

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product || product.userId !== payload.sub) {
      return ApiResponse.fail(ErrorConstant.PRODUCT_NOT_FOUND);
    }

    const linkedItemCount = await prisma.invoiceItem.count({ where: { productId: id } });
    if (linkedItemCount > 0) {
      return ApiResponse.fail(ErrorConstant.PRODUCT_HAS_INVOICE_ITEMS);
    }

    await prisma.product.delete({ where: { id } });

    return ApiResponse.ok({ message: "Produk berhasil dihapus." });
  } catch (error) {
    return ApiResponse.handleApiError(error);
  }
}
