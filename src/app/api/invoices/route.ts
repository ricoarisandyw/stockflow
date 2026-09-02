import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authMiddleware } from "@/server/middleware/auth.middleware";
import { ApiResponse } from "@/lib/api-response";
import { InvoiceLib } from "@/lib/invoice.lib";
import { createInvoiceSchema, invoiceListQuerySchema } from "@/schemas/invoice.schema";

export async function GET(request: NextRequest) {
  try {
    const payload = await authMiddleware(request);

    const { searchParams } = new URL(request.url);
    const parsed = invoiceListQuerySchema.safeParse({
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      search: searchParams.get("search") ?? undefined,
    });
    if (!parsed.success) return ApiResponse.failZod(parsed.error);

    const { page, limit, status, search } = parsed.data;

    const where = {
      userId: payload.sub,
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { customerName: { contains: search } },
              { invoiceNumber: { contains: search } },
            ],
          }
        : {}),
    };

    const [invoices, totalItems] = await Promise.all([
      prisma.invoice.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { _count: { select: { items: true } } },
      }),
      prisma.invoice.count({ where }),
    ]);

    const data = invoices.map(({ _count, ...invoice }) => ({
      ...invoice,
      itemCount: _count.items,
    }));

    return ApiResponse.okPaginated(data, {
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
    const parsed = createInvoiceSchema.safeParse(body);
    if (!parsed.success) return ApiResponse.failZod(parsed.error);

    const { customerName, issueDate, dueDate, notes, items } = parsed.data;

    const lines = await InvoiceLib.resolveInvoiceLines(payload.sub, items);
    const totals = InvoiceLib.calculateTotals(lines);
    const invoiceNumber = await InvoiceLib.generateInvoiceNumber();

    const invoice = await prisma.invoice.create({
      data: {
        userId: payload.sub,
        invoiceNumber,
        customerName,
        issueDate: issueDate ?? new Date(),
        dueDate,
        notes,
        subtotal: totals.subtotal,
        taxRate: totals.taxRate,
        taxAmount: totals.taxAmount,
        total: totals.total,
        items: {
          create: lines,
        },
      },
      include: { items: true },
    });

    return ApiResponse.ok(invoice, 201);
  } catch (error) {
    return ApiResponse.handleApiError(error);
  }
}
