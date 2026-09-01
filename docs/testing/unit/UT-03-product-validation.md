---
id: "UT-03"
title: "Product Validation & Deletion Protection Unit Test"
target_file: "src/server/services/productService.ts"
category: "Inventory"
priority: "High"
coverage: "[[mission#^sec4-entities-schema]], [[mission#^i3-validation-err]], [[mission#^i4-delete-guard]]"
status: "⚪ Pending"
---

# 🔬 UT-03: Product Validation & Deletion Protection Unit Test

## 🎯 Test Target
Validate inventory domain rules in `productService`:
1. Zod input validation (`unitPrice >= 0`, `quantityOnHand >= 0`, `sku` required).
2. Per-user SKU uniqueness constraint (`[userId, sku]`).
3. Deletion protection on products referenced by existing invoice line items (*Deletion Guard*).

---

## 🧪 Test Cases Specification

```typescript
describe("ProductService Unit Tests", () => {
  it("should create product with valid SKU, name, price, and stock", async () => {
    // Call createProduct with valid fields
    // Assert product is saved in database with integer price and positive qty
  });

  it("should reject product creation when SKU already exists for the same user", async () => {
    // Create product with SKU 'SKU-001'
    // Attempt creating another product with 'SKU-001' under same userId
    // Assert throws error with code 'CONFLICT' or 400 validation error
  });

  it("should allow same SKU for different users (per-user workspace isolation)", async () => {
    // User A creates 'SKU-001'
    // User B creates 'SKU-001'
    // Assert both succeed
  });

  it("should block deletion of product referenced by an existing invoice [I4]", async () => {
    // Product P is referenced in an invoice line item
    // Attempt deleteProduct(P.id)
    // Assert deletion is blocked and throws clear error message
  });
});
```
