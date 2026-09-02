import { NextRequest } from "next/server";
import { AuthLib, type TJwtPayload } from "@/lib/auth.lib";
import { ApiError } from "@/lib/api-response";
import { ErrorConstant } from "@/constants/error.constant";

export async function authMiddleware(request: NextRequest): Promise<TJwtPayload> {
  const bearer = request.headers.get("authorization");
  const bearerToken = bearer?.startsWith("Bearer ") ? bearer.slice(7) : undefined;
  const cookieToken = request.cookies.get(AuthLib.AUTH_COOKIE_NAME)?.value;
  const token = bearerToken ?? cookieToken;

  if (!token) {
    throw new ApiError(ErrorConstant.AUTH_UNAUTHORIZED);
  }

  try {
    return await AuthLib.verifyToken(token);
  } catch {
    throw new ApiError(ErrorConstant.AUTH_UNAUTHORIZED);
  }
}



