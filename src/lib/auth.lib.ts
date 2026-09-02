import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { randomUUID } from "crypto";
import { ApiError } from "@/lib/api-response";
import { ErrorConstant } from "@/constants/error.constant";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "dev-only-secret-change-me"
);
const JWT_ALG = "HS256";
const JWT_EXPIRES_IN = "7d";

const AUTH_COOKIE_NAME = "stockflow_token";

export type TJwtPayload = {
  sub: string;
  email: string;
  jti: string;
};

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

async function signToken(payload: Omit<TJwtPayload, "jti">): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: JWT_ALG })
    .setJti(randomUUID())
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(JWT_SECRET);
}

const revokedTokenIds = new Set<string>();

async function verifyToken(token: string): Promise<TJwtPayload> {
  const { payload } = await jwtVerify<TJwtPayload>(token, JWT_SECRET);
  if (payload.jti && revokedTokenIds.has(payload.jti)) {
    throw new ApiError(ErrorConstant.AUTH_UNAUTHORIZED);
  }
  return payload;
}

function revokeToken(payload: TJwtPayload): void {
  if (payload.jti) revokedTokenIds.add(payload.jti);
}

export const AuthLib = {
  AUTH_COOKIE_NAME,
  hashPassword,
  verifyPassword,
  signToken,
  verifyToken,
  revokeToken,
};


