import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { AuthLib } from "@/lib/auth.lib";
import { ApiResponse } from "@/lib/api-response";
import { ErrorConstant } from "@/constants/error.constant";
import { registerSchema } from "@/schemas/auth.schema";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) return ApiResponse.failZod(parsed.error);

    const { email, password, name } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return ApiResponse.fail(ErrorConstant.AUTH_EMAIL_EXISTS);


    const passwordHash = await AuthLib.hashPassword(password);
    const user = await prisma.user.create({
      data: { email, passwordHash, name },
    });

    const token = await AuthLib.signToken({ sub: user.id, email: user.email });

    const response = ApiResponse.ok(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
        },
        token,
      },
      201
    );
    response.cookies.set(AuthLib.AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch (error) {
    return ApiResponse.handleApiError(error);
  }
}


