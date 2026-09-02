import { NextRequest } from "next/server";
import { AuthLib } from "@/lib/auth.lib";
import { prismaTestUtils } from "./mocks/prisma.mock";

export function jsonRequest(url: string, body: unknown, token?: string, method = "POST") {
  return new NextRequest(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

export function authedRequest(url: string, token?: string, method = "GET") {
  return new NextRequest(url, {
    method,
    headers: token ? { authorization: `Bearer ${token}` } : undefined,
  });
}

export async function authedUser(overrides?: { email?: string }) {
  const user = prismaTestUtils.seedUser({
    email: overrides?.email ?? "staff@stockflow.dev",
    passwordHash: "irrelevant",
  });
  const token = await AuthLib.signToken({ sub: user.id, email: user.email });
  return { user, token };
}

export function routeParams<T extends Record<string, string>>(params: T) {
  return { params: Promise.resolve(params) };
}
