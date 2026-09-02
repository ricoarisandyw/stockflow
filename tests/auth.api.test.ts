import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { POST as postRegisterHandler } from "@/app/api/auth/register/route";
import { POST as postLoginHandler } from "@/app/api/auth/login/route";
import { POST as postLogoutHandler } from "@/app/api/auth/logout/route";
import { GET as getMeHandler } from "@/app/api/auth/me/route";
import { AuthLib } from "@/lib/auth.lib";
import { ErrorConstant } from "@/constants/error.constant";
import { HttpStatusConstant } from "@/constants/http-status.constant";
import { prismaTestUtils } from "./mocks/prisma.mock";

const BASE_URL = "http://localhost/api/auth";

function jsonRequest(url: string, body: unknown) {
  return new NextRequest(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function authedRequest(url: string, token: string, method = "GET") {
  return new NextRequest(url, {
    method,
    headers: { authorization: `Bearer ${token}` },
  });
}

describe("POST /api/auth/register", () => {
  it("(A1: register with email + password) creates a user and returns 201 with a token", async () => {
    const res = await postRegisterHandler(
      jsonRequest(`${BASE_URL}/register`, {
        email: "new@stockflow.dev",
        password: "Password123!",
        name: "New User",
      })
    );
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data.user.email).toBe("new@stockflow.dev");
    expect(typeof json.data.token).toBe("string");
  });

  it("(A5: minimum password policy enforced server-side) rejects a payload with an invalid email and short password", async () => {
    const res = await postRegisterHandler(
      jsonRequest(`${BASE_URL}/register`, { email: "not-an-email", password: "short" })
    );
    const json = await res.json();

    expect(res.status).toBe(HttpStatusConstant.getStatusCode(ErrorConstant.INVALID_PAYLOAD.code));
    expect(json.success).toBe(false);
    expect(json.error.code).toBe(ErrorConstant.INVALID_PAYLOAD.code);
    expect(json.error.codeNumber).toBe(ErrorConstant.INVALID_PAYLOAD.codeNumber);
    expect(json.error.details.length).toBeGreaterThan(0);
  });

  it("(A1: email must be unique) rejects a duplicate email with AUTH_EMAIL_EXISTS", async () => {
    prismaTestUtils.seedUser({
      email: "existing@stockflow.dev",
      passwordHash: await AuthLib.hashPassword("Password123!"),
    });

    const res = await postRegisterHandler(
      jsonRequest(`${BASE_URL}/register`, {
        email: "existing@stockflow.dev",
        password: "Password123!",
      })
    );
    const json = await res.json();

    expect(res.status).toBe(HttpStatusConstant.getStatusCode(ErrorConstant.AUTH_EMAIL_EXISTS.code));
    expect(json.error.code).toBe(ErrorConstant.AUTH_EMAIL_EXISTS.code);
    expect(json.error.codeNumber).toBe(ErrorConstant.AUTH_EMAIL_EXISTS.codeNumber);
    expect(json.error.message).toBe(ErrorConstant.AUTH_EMAIL_EXISTS.message);
  });

  it("(A4: passwords hashed with bcrypt/argon2) stores the password as a bcrypt hash, never plaintext or reversibly encrypted", async () => {
    const plaintextPassword = "Password123!";

    await postRegisterHandler(
      jsonRequest(`${BASE_URL}/register`, {
        email: "hash-check@stockflow.dev",
        password: plaintextPassword,
      })
    );

    const [stored] = prismaTestUtils.getUsers();
    expect(stored.passwordHash).toBeDefined();
    expect(stored.passwordHash).not.toBe(plaintextPassword);
    expect(stored.passwordHash).not.toContain(plaintextPassword);
    // bcrypt hash format: $2a$/$2b$/$2y$ + cost factor + 53-char salt+hash
    expect(stored.passwordHash).toMatch(/^\$2[aby]\$\d{2}\$.{53}$/);
  });

  it("(A4: with per-user salt) salts each password independently, so identical passwords hash differently", async () => {
    await postRegisterHandler(
      jsonRequest(`${BASE_URL}/register`, {
        email: "user-a@stockflow.dev",
        password: "SamePassword123!",
      })
    );
    await postRegisterHandler(
      jsonRequest(`${BASE_URL}/register`, {
        email: "user-b@stockflow.dev",
        password: "SamePassword123!",
      })
    );

    const [userA, userB] = prismaTestUtils.getUsers();
    expect(userA.passwordHash).not.toBe(userB.passwordHash);
  });
});

describe("POST /api/auth/login", () => {
  it("(A2: login returns a credential) authenticates with correct credentials and returns a token", async () => {
    prismaTestUtils.seedUser({
      email: "staff@stockflow.dev",
      passwordHash: await AuthLib.hashPassword("Password123!"),
      name: "Staff Distribution",
    });

    const res = await postLoginHandler(
      jsonRequest(`${BASE_URL}/login`, {
        email: "staff@stockflow.dev",
        password: "Password123!",
      })
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.user.email).toBe("staff@stockflow.dev");
    expect(typeof json.data.token).toBe("string");
  });

  it("(A9: auth errors must not leak which part was wrong) rejects an incorrect password with AUTH_INVALID_CREDENTIALS", async () => {
    prismaTestUtils.seedUser({
      email: "staff@stockflow.dev",
      passwordHash: await AuthLib.hashPassword("Password123!"),
    });

    const res = await postLoginHandler(
      jsonRequest(`${BASE_URL}/login`, {
        email: "staff@stockflow.dev",
        password: "wrong-password",
      })
    );
    const json = await res.json();

    expect(res.status).toBe(
      HttpStatusConstant.getStatusCode(ErrorConstant.AUTH_INVALID_CREDENTIALS.code)
    );
    expect(json.error.code).toBe(ErrorConstant.AUTH_INVALID_CREDENTIALS.code);
    expect(json.error.codeNumber).toBe(ErrorConstant.AUTH_INVALID_CREDENTIALS.codeNumber);
    expect(json.error.message).toBe(ErrorConstant.AUTH_INVALID_CREDENTIALS.message);
  });

  it("(A9: no user-not-found vs wrong-password distinction) rejects an unknown email with the exact same AUTH_INVALID_CREDENTIALS error", async () => {
    prismaTestUtils.seedUser({
      email: "staff@stockflow.dev",
      passwordHash: await AuthLib.hashPassword("Password123!"),
    });

    const wrongPasswordRes = await postLoginHandler(
      jsonRequest(`${BASE_URL}/login`, {
        email: "staff@stockflow.dev",
        password: "wrong-password",
      })
    );
    const unknownEmailRes = await postLoginHandler(
      jsonRequest(`${BASE_URL}/login`, {
        email: "ghost@nowhere.dev",
        password: "whatever123",
      })
    );
    const wrongPasswordJson = await wrongPasswordRes.json();
    const unknownEmailJson = await unknownEmailRes.json();

    expect(unknownEmailRes.status).toBe(
      HttpStatusConstant.getStatusCode(ErrorConstant.AUTH_INVALID_CREDENTIALS.code)
    );
    expect(unknownEmailJson.error.code).toBe(ErrorConstant.AUTH_INVALID_CREDENTIALS.code);
    expect(unknownEmailJson.error.codeNumber).toBe(
      ErrorConstant.AUTH_INVALID_CREDENTIALS.codeNumber
    );
    // Same constant used for both branches proves no user-enumeration leak.
    expect(unknownEmailJson.error.message).toBe(wrongPasswordJson.error.message);
    expect(unknownEmailJson.error.codeNumber).toBe(wrongPasswordJson.error.codeNumber);
  });
});

describe("GET /api/auth/me", () => {
  it("(A2: issued credential authenticates subsequent requests) returns the current user profile for a valid bearer token", async () => {
    const user = prismaTestUtils.seedUser({
      email: "staff@stockflow.dev",
      passwordHash: "irrelevant",
      name: "Staff Distribution",
    });
    const token = await AuthLib.signToken({ sub: user.id, email: user.email });

    const res = await getMeHandler(authedRequest(`${BASE_URL}/me`, token));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.id).toBe(user.id);
    expect(json.data.email).toBe(user.email);
  });

  it("(A6: protected endpoint returns 401 when unauthenticated) rejects a request with no credentials with AUTH_UNAUTHORIZED", async () => {
    const res = await getMeHandler(new NextRequest(`${BASE_URL}/me`));
    const json = await res.json();

    expect(res.status).toBe(HttpStatusConstant.getStatusCode(ErrorConstant.AUTH_UNAUTHORIZED.code));
    expect(json.error.code).toBe(ErrorConstant.AUTH_UNAUTHORIZED.code);
    expect(json.error.codeNumber).toBe(ErrorConstant.AUTH_UNAUTHORIZED.codeNumber);
    expect(json.error.message).toBe(ErrorConstant.AUTH_UNAUTHORIZED.message);
  });

  it("(A6: protected endpoint returns 401 for invalid credentials) rejects a request with an invalid/garbage token with AUTH_UNAUTHORIZED", async () => {
    const res = await getMeHandler(authedRequest(`${BASE_URL}/me`, "not-a-real-jwt"));
    const json = await res.json();

    expect(res.status).toBe(HttpStatusConstant.getStatusCode(ErrorConstant.AUTH_UNAUTHORIZED.code));
    expect(json.error.code).toBe(ErrorConstant.AUTH_UNAUTHORIZED.code);
    expect(json.error.codeNumber).toBe(ErrorConstant.AUTH_UNAUTHORIZED.codeNumber);
  });

  it("returns USER_NOT_FOUND when the token's subject no longer exists", async () => {
    const token = await AuthLib.signToken({ sub: "usr_does_not_exist", email: "ghost@stockflow.dev" });

    const res = await getMeHandler(authedRequest(`${BASE_URL}/me`, token));
    const json = await res.json();

    expect(res.status).toBe(HttpStatusConstant.getStatusCode(ErrorConstant.USER_NOT_FOUND.code));
    expect(json.error.code).toBe(ErrorConstant.USER_NOT_FOUND.code);
    expect(json.error.codeNumber).toBe(ErrorConstant.USER_NOT_FOUND.codeNumber);
    expect(json.error.message).toBe(ErrorConstant.USER_NOT_FOUND.message);
  });
});

describe("POST /api/auth/logout", () => {
  it("(A3: logout invalidates the client's session) clears the session cookie for an authenticated request", async () => {
    const user = prismaTestUtils.seedUser({
      email: "staff@stockflow.dev",
      passwordHash: "irrelevant",
    });
    const token = await AuthLib.signToken({ sub: user.id, email: user.email });

    const res = await postLogoutHandler(authedRequest(`${BASE_URL}/logout`, token, "POST"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain(AuthLib.AUTH_COOKIE_NAME);
  });

  it("(A6: protected endpoint returns 401 when unauthenticated) rejects logout without credentials with AUTH_UNAUTHORIZED", async () => {
    const res = await postLogoutHandler(new NextRequest(`${BASE_URL}/logout`, { method: "POST" }));
    const json = await res.json();

    expect(res.status).toBe(HttpStatusConstant.getStatusCode(ErrorConstant.AUTH_UNAUTHORIZED.code));
    expect(json.error.code).toBe(ErrorConstant.AUTH_UNAUTHORIZED.code);
    expect(json.error.codeNumber).toBe(ErrorConstant.AUTH_UNAUTHORIZED.codeNumber);
  });

  it("(A3: logout actually invalidates the token, not just the cookie) invalidates the token itself for subsequent requests", async () => {
    const user = prismaTestUtils.seedUser({
      email: "staff@stockflow.dev",
      passwordHash: "irrelevant",
    });
    const token = await AuthLib.signToken({ sub: user.id, email: user.email });

    // token works before logout
    const beforeRes = await getMeHandler(authedRequest(`${BASE_URL}/me`, token));
    expect(beforeRes.status).toBe(200);

    await postLogoutHandler(authedRequest(`${BASE_URL}/logout`, token, "POST"));

    // the same bearer token must no longer authenticate, even though the
    // cookie-clearing response header is irrelevant to a Bearer-token client
    const afterRes = await getMeHandler(authedRequest(`${BASE_URL}/me`, token));
    const afterJson = await afterRes.json();

    expect(afterRes.status).toBe(HttpStatusConstant.getStatusCode(ErrorConstant.AUTH_UNAUTHORIZED.code));
    expect(afterJson.error.code).toBe(ErrorConstant.AUTH_UNAUTHORIZED.code);
    expect(afterJson.error.codeNumber).toBe(ErrorConstant.AUTH_UNAUTHORIZED.codeNumber);
  });
});
