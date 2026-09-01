---
id: "UT-04"
title: "Invoice Financial Calculations & Price Snapshot Unit Test"
target_file: "src/server/services/invoiceService.ts"
category: "Invoicing"
priority: "Critical"
coverage: "[[mission#^v2-server-totals]], [[mission#^v3-tax-rate]], [[mission#^v4-snapshot-item]]"
status: "⚪ Pending"
---

# 🔬 UT-04: Invoice Financial Calculations & Price Snapshot Unit Test

## 🎯 Test Target
Validate invoice financial calculation accuracy in `invoiceService`:
1. Server computes `lineTotal`, `subtotal`, `taxAmount` (11%), and `total` authoritatively without trusting client-sent totals.
2. Calculations use integer minor units to eliminate floating-point arithmetic rounding errors.
3. `unitPrice` and `productName` are snapshotted onto line items upon creation.

---

## 🧪 Test Cases Specification

```typescript
describe("Invoice Financial Calculations & Snapshot Unit Tests", () => {
  it("should calculate lineTotal, subtotal, 11% tax, and grand total accurately", async () => {
    // Product 1: unitPrice = 50000, qty = 2 -> lineTotal = 100000
    // Product 2: unitPrice = 75000, qty = 1 -> lineTotal = 75000
    // Subtotal = 175000
    // Tax (11%) = 19250
    // Grand Total = 194250
    // Assert server-calculated totals match exact expected integer values
  });

  it("should ignore client-tampered totals and enforce server recalculation", async () => {
    // Send manipulated total: 0 or 999999 from client payload
    // Assert server overwrites with authentic calculated total
  });

  it("should snapshot unitPrice and productName onto invoice line items [V4]", async () => {
    // Create invoice with product at unitPrice = 50000
    // Modify master product unitPrice to 90000
    // Fetch invoice line items
    // Assert invoice line unitPrice remains 50000 (snapshot preserved)
  });
});
```
