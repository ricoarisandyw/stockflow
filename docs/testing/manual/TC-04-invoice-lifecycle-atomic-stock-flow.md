---
id: "TC-04"
title: "Invoice Lifecycle, Atomic Stock Decrement & Restore Flow"
category: "Core Business Logic & Transactions"
priority: "Critical"
target: "Invoice Status Actions (/invoices/[id])"
coverage: "[[mission#^n4-automated-tests]]"
status: "⚪ Pending"
---

# 🧪 TC-04: Invoice Lifecycle, Atomic Stock Decrement & Restore Flow

## 🎯 Objective
Verify database transaction integrity (`prisma.$transaction`) across the invoice lifecycle: stock decrement on `ISSUED`, stock restoration on `CANCELLED`, finalization on `PAID`, and rejection of invalid status transitions.

---

## 📋 Pre-conditions
1. User logged in as `demo@stockflow.dev`.
2. Product `Steel Widget` has initial `quantityOnHand = 20`.
3. Draft invoice exists containing `5` units of `Steel Widget`.

---

## 🪜 Step-by-Step Test Procedure

| Step # | Action | Input / Payload | Expected Result | Pass / Fail |
| :--- | :--- | :--- | :--- | :--- |
| **1** | Open draft invoice and click `[ 🚀 Issue Invoice ]` | Confirm invoice issue | Status updates to `ISSUED`. Stock for `Steel Widget` in catalog decrements automatically from `20` to `15`. | `[ ]` |
| **2** | Attempt editing items on the `ISSUED` invoice | Attempt changing quantity | Edit options unavailable or server rejects with: *"Only DRAFT invoices may have their items edited"*. | `[ ]` |
| **3** | Click `[ ⚠️ Cancel Invoice & Restore Stock ]` on `ISSUED` invoice | Confirm cancellation | Status updates to `CANCELLED`. Stock for `Steel Widget` is restored from `15` back to `20`. | `[ ]` |
| **4** | Create new draft invoice (3 units) and click `[ ❌ Cancel Invoice ]` directly from `DRAFT` | Cancel draft invoice | Status updates to `CANCELLED`. Stock for `Steel Widget` remains **unchanged** (remains 20). | `[ ]` |
| **5** | Create another invoice, issue it, then click `[ 💵 Mark as Paid ]` | Confirm payment | Status updates to `PAID`. Invoice is permanently finalized in terminal state. | `[ ]` |
| **6** | Attempt illegal status transition (e.g. `PAID` $\rightarrow$ `DRAFT` or `CANCELLED` $\rightarrow$ `ISSUED`) | Invoke illegal status action | Server rejects request with error: *"Invalid status transition"*. | `[ ]` |
