import { NextRequest } from "next/server";
import { authMiddleware } from "@/server/middleware/auth.middleware";
import { ApiResponse } from "@/lib/api-response";
import { AuthLib } from "@/lib/auth.lib";

export async function POST(request: NextRequest) {
  try {
    await authMiddleware(request);
    const response = ApiResponse.ok({ message: "Session terminated successfully." });

    response.cookies.delete(AuthLib.AUTH_COOKIE_NAME);
    return response;
  } catch (error) {
    return ApiResponse.handleApiError(error);
  }
}


