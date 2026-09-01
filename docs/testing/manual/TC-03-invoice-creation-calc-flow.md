---
id: "TC-03"
title: "Invoice Creation, Calculation, Snapshot & Stock Guard Flow"
category: "Invoicing & Financial Calculations"
priority: "Critical"
target: "Create Invoice (/invoices/new)"
coverage: "[[mission#^n4-automated-tests]]"
status: "⚪ Pending"
---

# 🧪 TC-03: Invoice Creation, Calculation, Snapshot & Stock Guard Flow

## 🎯 Objective
Verify multi-line invoice creation: client and server financial calculations (Subtotal, 11% Tax, Grand Total), price snapshotting, and stock limit guard enforcement.

---

## 📋 Pre-conditions
1. User logged in as `demo@stockflow.dev`.
2. Product `Brass Gadget` exists with `unitPrice = 75000` and `quantityOnHand = 10`.

---

## 🪜 Step-by-Step Test Procedure

| Step # | Action | Input / Payload | Expected Result | Pass / Fail |
| :--- | :--- | :--- | :--- | :--- |
| **1** | Open `/invoices/new` and select `Brass Gadget` with excess quantity | Product: `Brass Gadget`<br>Quantity: `15` (Stock: 10) | Stock Guard error displays: *"Quantity exceeds available stock (10)"*. Submit button is disabled. | `[ ]` |
| **2** | Adjust quantity to valid amount within stock limits | Quantity: `4` | Line Total displays `300.000`. Subtotal = `300.000`, Tax (11%) = `33.000`, Total = `333.000`. | `[ ]` |
| **3** | Add a second product line item | Product: `Steel Widget` (`50000`)<br>Qty: `2` | Line Total = `100.000`. Subtotal = `400.000`, Tax (11%) = `44.000`, Total = `444.000`. | `[ ]` |
| **4** | Click `[ Save as Draft ]` | Customer: `Acme Corp` | Invoice is created in `DRAFT` status with sequential number `INV-2026-0001`. Stock in catalog is unchanged. | `[ ]` |
| **5** | Navigate to `/products` and update master price of `Brass Gadget` | Change price to `90000` | Price in catalog updates to `90000`. | `[ ]` |
| **6** | Reopen draft invoice `INV-2026-0001` | View invoice line items | Unit price for `Brass Gadget` on invoice remains `75000` (snapshot preserved). | `[ ]` |
