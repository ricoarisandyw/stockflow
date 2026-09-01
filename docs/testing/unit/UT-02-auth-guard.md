---
id: "UT-02"
title: "Protected Route & Procedure 401 Guard Unit Test"
target_file: "src/server/api/trpc.ts"
category: "Security & Guard"
priority: "Critical"
coverage: "[[mission#^a6-auth-protection]], [[mission#^n4-automated-tests]]"
status: "⚪ Pending"
---

# 🔬 UT-02: Protected Route & Procedure 401 Guard Unit Test

## 🎯 Test Target
Validate `protectedProcedure` middleware guard behavior:
1. **(N4 Requirement b)**: Any unauthenticated request without a valid session token to protected endpoints must return **HTTP 401 Unauthorized**.
2. Requests with valid session tokens must properly inject authenticated `ctx.user`.

---

## 🧪 Test Cases Specification

```typescript
describe("ProtectedProcedure Guard Unit Tests", () => {
  it("should return 401 UNAUTHORIZED when no token or session exists [N4-b]", async () => {
    // Invoke protectedProcedure with unauthenticated context (ctx.user = null)
    // Assert throws TRPCError with code 'UNAUTHORIZED' (HTTP 401)
  });

  it("should return 401 UNAUTHORIZED when token is expired or malformed", async () => {
    // Provide invalid / expired JWT token
    // Assert throws TRPCError with code 'UNAUTHORIZED'
  });

  it("should allow procedure execution when valid token is present", async () => {
    // Provide valid context with authenticated user
    // Assert procedure executes successfully and receives ctx.user
  });
});
```
