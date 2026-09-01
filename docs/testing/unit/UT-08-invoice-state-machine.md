---
id: "UT-08"
title: "Invoice Status State Machine & Immutability Unit Test"
target_file: "src/server/services/invoiceService.ts"
category: "State Transitions"
priority: "High"
coverage: "[[mission#^v8-status-transitions]], [[mission#^v9-edit-draft-only]]"
status: "⚪ Pending"
---

# 🔬 UT-08: Invoice Status State Machine & Immutability Unit Test

## 🎯 Test Target
Validate invoice lifecycle state machine transitions and item immutability guards:
1. Allow valid transitions: `DRAFT -> ISSUED -> PAID`, `DRAFT -> CANCELLED`, `ISSUED -> CANCELLED`.
2. Reject illegal state transitions (e.g. `PAID -> DRAFT`, `CANCELLED -> ISSUED`).
3. Enforce item immutability: line items may only be modified while in `DRAFT` status (*immutability guard*).

---

## 🧪 Test Cases Specification

```typescript
describe("Invoice State Machine Unit Tests", () => {
  it("should allow legal transitions (DRAFT -> ISSUED -> PAID)", async () => {
    // Transition from DRAFT to ISSUED -> Success
    // Transition from ISSUED to PAID -> Success
    // Assert final status is PAID
  });

  it("should reject illegal transitions from terminal states", async () => {
    // Attempt PAID -> DRAFT -> Throws Error
    // Attempt CANCELLED -> ISSUED -> Throws Error
  });

  it("should only allow editing line items on DRAFT invoices [V9]", async () => {
    // Edit line items on DRAFT invoice -> Success
    // Issue invoice (status becomes ISSUED)
    // Attempt editing line items on ISSUED invoice -> Throws Error
  });
});
```
