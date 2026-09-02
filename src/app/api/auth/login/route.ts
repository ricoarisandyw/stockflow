import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { AuthLib } from "@/lib/auth.lib";
import { ApiResponse } from "@/lib/api-response";
import { ErrorConstant } from "@/constants/error.constant";
import { loginSchema } from "@/schemas/auth.schema";


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) return ApiResponse.failZod(parsed.error);

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return ApiResponse.fail(ErrorConstant.AUTH_INVALID_CREDENTIALS);

    const valid = await AuthLib.verifyPassword(password, user.passwordHash);
    if (!valid) return ApiResponse.fail(ErrorConstant.AUTH_INVALID_CREDENTIALS);



    const token = await AuthLib.signToken({ sub: user.id, email: user.email });

    const response = ApiResponse.ok({
      user: { id: user.id, email: user.email, name: user.name },
      token,
    });
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


