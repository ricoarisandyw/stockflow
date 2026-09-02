import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authMiddleware } from "@/server/middleware/auth.middleware";
import { ApiResponse } from "@/lib/api-response";
import { ErrorConstant } from "@/constants/error.constant";
import { createProductSchema, productListQuerySchema } from "@/schemas/product.schema";

export async function GET(request: NextRequest) {
  try {
    const payload = await authMiddleware(request);

    const { searchParams } = new URL(request.url);
    const parsed = productListQuerySchema.safeParse({
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      sortBy: searchParams.get("sortBy") ?? undefined,
      sortOrder: searchParams.get("sortOrder") ?? undefined,
    });
    if (!parsed.success) return ApiResponse.failZod(parsed.error);

    const { page, limit, search, sortBy, sortOrder } = parsed.data;

    const where = {
      userId: payload.sub,
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { sku: { contains: search } },
            ],
          }
        : {}),
    };

    const [items, totalItems] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return ApiResponse.okPaginated(items, {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit) || 1,
    });
  } catch (error) {
    return ApiResponse.handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await authMiddleware(request);

    const body = await request.json();
    const parsed = createProductSchema.safeParse(body);
    if (!parsed.success) return ApiResponse.failZod(parsed.error);

    const { sku, name, description, unitPrice, quantityOnHand } = parsed.data;

    const existing = await prisma.product.findUnique({
      where: { userId_sku: { userId: payload.sub, sku } },
    });
    if (existing) return ApiResponse.fail(ErrorConstant.PRODUCT_SKU_EXISTS);

    const product = await prisma.product.create({
      data: {
        userId: payload.sub,
        sku,
        name,
        description,
        unitPrice,
        quantityOnHand,
      },
    });

    return ApiResponse.ok(product, 201);
  } catch (error) {
    return ApiResponse.handleApiError(error);
  }
}
