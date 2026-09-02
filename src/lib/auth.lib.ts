import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "dev-only-secret-change-me"
);
const JWT_ALG = "HS256";
const JWT_EXPIRES_IN = "7d";

const AUTH_COOKIE_NAME = "stockflow_token";

export type TJwtPayload = {
  sub: string;
  email: string;
};

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

async function signToken(payload: TJwtPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(JWT_SECRET);
}

async function verifyToken(token: string): Promise<TJwtPayload> {
  const { payload } = await jwtVerify<TJwtPayload>(token, JWT_SECRET);
  return payload;
}

export const AuthLib = {
  AUTH_COOKIE_NAME,
  hashPassword,
  verifyPassword,
  signToken,
  verifyToken,
};


