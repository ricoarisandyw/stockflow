---
id: "UT-01"
title: "Authentication Service & Password Hashing Unit Test"
target_file: "src/server/services/authService.ts"
category: "Authentication"
priority: "Critical"
coverage: "[[mission#^a4-password-hash]], [[mission#^n4-automated-tests]], [[mission#^a9-auth-generic-error]]"
status: "⚪ Pending"
---

# 🔬 UT-01: Authentication Service & Password Hashing Unit Test

## 🎯 Test Target
Validate authentication domain logic on `authService`:
1. **(N4 Requirement a)**: Login attempt with an incorrect password must be rejected.
2. Passwords must be hashed using bcrypt with valid salt rounds.
3. Failed login attempts must return generic error messages without leaking whether the email exists.
4. Successful login returns a valid signed JWT session token.

---

## 🧪 Test Cases Specification

```typescript
describe("AuthService Unit Tests", () => {
  it("should hash password with bcrypt on registration", async () => {
    // Assert password hash starts with $2a$ or $2b$ and is not equal to plaintext
  });

  it("should reject login when password is incorrect [N4-a]", async () => {
    // Attempt login with valid user email but wrong password
    // Assert throws TRPCError with code 'UNAUTHORIZED' or 'BAD_REQUEST'
    // Assert error message is generic: 'Invalid email or password'
  });

  it("should reject login when email does not exist with same generic error", async () => {
    // Attempt login with non-existent email
    // Assert error message is identical to wrong password case
  });

  it("should successfully generate signed JWT token for valid credentials", async () => {
    // Provide correct email & password
    // Assert valid token containing userId is returned
  });
});
```
