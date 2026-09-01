# 🧪 Manual Testing Scenarios Dashboard

This page summarizes all manual test scenarios for the **StockFlow** application. The table below is automatically generated using an **Obsidian Dataview** query.

---

## 📊 Live Dataview Table

```dataview
TABLE
  id as "ID",
  category as "Category",
  priority as "Priority",
  status as "Status",
  target as "Target Flow",
  coverage as "Mission Requirement Ref"
FROM "docs/testing/manual"
WHERE file.name != "_table"
SORT id ASC
```

---

## 📋 Static Scenarios Reference Table

| ID | Scenario Document | Category | Priority | Status | Target Flow | Mission Ref |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-01** | [[TC-01-auth-flow\|TC-01: Auth & Protection]] | Authentication | Critical | `⚪ Pending` | `/login`, `/register`, Route Guard | [[mission#^a2-login-jwt]], [[mission#^a6-auth-protection]] |
| **TC-02** | [[TC-02-inventory-crud-flow\|TC-02: Inventory CRUD]] | Inventory | High | `⚪ Pending` | `/products`, Search, Pagination | [[mission#^sec4-entities-schema]], [[mission#^i3-validation-err]] |
| **TC-03** | [[TC-03-invoice-creation-calc-flow\|TC-03: Invoice Creation]] | Invoicing | Critical | `⚪ Pending` | `/invoices/new`, Totals, Stock Guard | [[mission#^n4-automated-tests]] |
| **TC-04** | [[TC-04-invoice-lifecycle-atomic-stock-flow\|TC-04: Atomic Stock Flow]] | Core Business | Critical | `⚪ Pending` | `/invoices/[id]`, Issue & Cancel Stock | [[mission#^n4-automated-tests]] |
| **TC-05** | [[TC-05-data-isolation-workspace-flow\|TC-05: Data Isolation]] | Security | High | `⚪ Pending` | Per-user multi-tenancy boundary | [[mission#^a7-data-isolation]] |

---

### 🏷️ Status Legend:
- `⚪ Pending` : Scenario has not yet been executed.
- `🟡 In Progress` : Scenario is currently being verified.
- `🟢 Passed` : Scenario verified successfully according to specifications.
- `🔴 Failed` : Issue or bug identified during execution.
