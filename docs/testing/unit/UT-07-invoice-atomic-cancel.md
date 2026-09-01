---
id: "UT-07"
title: "Invoice Cancellation & Atomic Stock Restore Unit Test"
target_file: "src/server/services/invoiceService.ts"
category: "Core Transactions"
priority: "Critical"
coverage: "[[mission#^v7-atomic-cancel]], [[mission#^n4-automated-tests]]"
status: "⚪ Pending"
---

# 🔬 UT-07: Invoice Cancellation & Atomic Stock Restore Unit Test

## 🎯 Test Target
Validate inventory stock restoration rules on invoice cancellation:
1. **(N4 Requirement e)**: Cancelling an `ISSUED` invoice restores the stock it consumed accurately and atomically.
2. Cancelling a `DRAFT` invoice **does not change inventory stock**.

---

## 🧪 Test Cases Specification

```typescript
describe("Invoice Cancellation & Stock Restore Unit Tests", () => {
  it("should restore stock accurately when cancelling an ISSUED invoice [N4-e]", async () => {
    // Initial stock = 20
    // Issue invoice with 5 units (stock becomes 15)
    // Execute cancelInvoice(invoiceId)
    // Assert status becomes 'CANCELLED'
    // Assert stock is restored back to 20
  });

  it("should NOT change stock when cancelling a DRAFT invoice", async () => {
    // Initial stock = 20
    // Create draft invoice with 5 units (stock is still 20)
    // Execute cancelInvoice(invoiceId)
    // Assert status becomes 'CANCELLED'
    // Assert stock remains 20 (nothing restored because nothing was decremented)
  });
});
```
