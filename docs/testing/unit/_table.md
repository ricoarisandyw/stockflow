# 🔬 Unit & Integration Testing Dashboard

This page summarizes all unit and integration test specifications for the **StockFlow** application. The table below is automatically generated using an **Obsidian Dataview** query.

---

## 📊 Live Dataview Table

```dataview
TABLE
  id as "ID",
  category as "Category",
  target_file as "Target Service/Unit",
  priority as "Priority",
  status as "Status",
  coverage as "Mission Requirement Ref"
FROM "docs/testing/unit"
WHERE file.name != "_table"
SORT id ASC
```

---

## 📋 Static Unit Tests Reference Table

| ID | Specification Document | Target File | Category | Priority | Status | Mission Coverage |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **UT-01** | [[UT-01-auth-service\|UT-01: Auth & Password Hashing]] | `authService.ts` | Auth | Critical | `⚪ Pending` | [[mission#^a4-password-hash]], [[mission#^n4-automated-tests]] (a) |
| **UT-02** | [[UT-02-auth-guard\|UT-02: 401 Protected Guard]] | `trpc.ts` | Security | Critical | `⚪ Pending` | [[mission#^a6-auth-protection]], [[mission#^n4-automated-tests]] (b) |
| **UT-03** | [[UT-03-product-validation\|UT-03: Product Validation]] | `productService.ts` | Inventory | High | `⚪ Pending` | [[mission#^sec4-entities-schema]], [[mission#^i3-validation-err]], [[mission#^i4-delete-guard]] |
| **UT-04** | [[UT-04-invoice-financial-calc\|UT-04: Invoice Calculations]] | `invoiceService.ts` | Invoicing | Critical | `⚪ Pending` | [[mission#^v2-server-totals]], [[mission#^v3-tax-rate]], [[mission#^v4-snapshot-item]] |
| **UT-05** | [[UT-05-invoice-stock-guard\|UT-05: Stock Guard]] | `invoiceService.ts` | Invoicing | Critical | `⚪ Pending` | [[mission#^v5-stock-guard]], [[mission#^n4-automated-tests]] (c) |
| **UT-06** | [[UT-06-invoice-atomic-issue\|UT-06: Atomic Issue & Decrement]] | `invoiceService.ts` | Core Logic | Critical | `⚪ Pending` | [[mission#^v6-atomic-issue]], [[mission#^n4-automated-tests]] (d) |
| **UT-07** | [[UT-07-invoice-atomic-cancel\|UT-07: Atomic Cancel & Restore]] | `invoiceService.ts` | Core Logic | Critical | `⚪ Pending` | [[mission#^v7-atomic-cancel]], [[mission#^n4-automated-tests]] (e) |
| **UT-08** | [[UT-08-invoice-state-machine\|UT-08: State Machine Guard]] | `invoiceService.ts` | State Logic | High | `⚪ Pending` | [[mission#^v8-status-transitions]], [[mission#^v9-edit-draft-only]] |

---

### 🏷️ Status Legend:
- `⚪ Pending` : Test case not yet implemented or executed.
- `🟡 In Progress` : Currently being implemented in test runner.
- `🟢 Passed` : Test suite passed all assertions (`npm test`).
- `🔴 Failed` : Test assertion failure detected.
