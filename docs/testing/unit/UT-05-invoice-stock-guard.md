---
id: "UT-05"
title: "Invoice Stock Guard Unit Test"
target_file: "src/server/services/invoiceService.ts"
category: "Invoicing & Stock"
priority: "Critical"
coverage: "[[mission#^v5-stock-guard]], [[mission#^n4-automated-tests]]"
status: "⚪ Pending"
---

# 🔬 UT-05: Invoice Stock Guard Unit Test

## 🎯 Test Target
Validate inventory stock limits in `invoiceService`:
1. **(N4 Requirement c)**: Invoice creation attempts with item quantities exceeding available stock on hand (`quantityOnHand`) must be rejected with an error explicitly identifying the product.

---

## 🧪 Test Cases Specification

```typescript
describe("Invoice Stock Guard Unit Tests", () => {
  it("should reject invoice creation when requested quantity exceeds stock on hand [N4-c]", async () => {
    // Product P has quantityOnHand = 10
    // Attempt creating invoice with line item requesting qty = 15
    // Assert creation fails with error mentioning product name/SKU and stock limit
  });

  it("should reject invoice when quantityOnHand is zero", async () => {
    // Product P has quantityOnHand = 0
    // Attempt creating invoice line item with qty = 1
    // Assert creation fails
  });

  it("should allow invoice creation when requested quantity is within available stock", async () => {
    // Product P has quantityOnHand = 10
    // Create invoice with line item requesting qty = 10 (exact match)
    // Assert creation succeeds as DRAFT
  });
});
```
