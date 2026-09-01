---
id: "UT-06"
title: "Invoice Atomic Issuance & Stock Decrement Unit Test"
target_file: "src/server/services/invoiceService.ts"
category: "Core Transactions"
priority: "Critical"
coverage: "[[mission#^v6-atomic-issue]], [[mission#^n4-automated-tests]]"
status: "⚪ Pending"
---

# 🔬 UT-06: Invoice Atomic Issuance & Stock Decrement Unit Test

## 🎯 Test Target
Validate ACID database transactions (`prisma.$transaction`) when transitioning an invoice from `DRAFT` to `ISSUED`:
1. **(N4 Requirement d)**: Issuing an invoice decrements product `quantityOnHand` accurately and atomically across all lines.
2. Transation is atomic (all-or-nothing): if any line item fails, all stock decrements are rolled back.

---

## 🧪 Test Cases Specification

```typescript
describe("Invoice Atomic Issuance Unit Tests", () => {
  it("should decrement quantityOnHand correctly when issuing an invoice [N4-d]", async () => {
    // Product 1 initial stock = 20, Product 2 initial stock = 15
    // Create draft invoice: Product 1 qty = 5, Product 2 qty = 3
    // Execute issueInvoice(invoiceId)
    // Assert status becomes 'ISSUED'
    // Assert Product 1 stock is now 15
    // Assert Product 2 stock is now 12
  });

  it("should rollback all stock changes if any line item fails during issue", async () => {
    // Simulate race condition where Product 2 stock depleted before transaction commits
    // Attempt issueInvoice
    // Assert issue fails and Product 1 stock remains at initial 20 (no partial decrement)
  });
});
```
