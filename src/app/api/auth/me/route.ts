import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authMiddleware } from "@/server/middleware/auth.middleware";
import { ApiResponse } from "@/lib/api-response";
import { ErrorConstant } from "@/constants/error.constant";

export async function GET(request: NextRequest) {
  try {
    const payload = await authMiddleware(request);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) return ApiResponse.fail(ErrorConstant.USER_NOT_FOUND);

    return ApiResponse.ok({
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    });
  } catch (error) {
    return ApiResponse.handleApiError(error);
  }
}

