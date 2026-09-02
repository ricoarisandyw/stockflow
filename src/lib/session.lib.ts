import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { AuthLib, type TJwtPayload } from "@/lib/auth.lib";

const getSession = cache(async (): Promise<TJwtPayload | null> => {
  const token = (await cookies()).get(AuthLib.AUTH_COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    return await AuthLib.verifyToken(token);
  } catch {
    return null;
  }
});

export const SessionLib = {
  getSession,
};
