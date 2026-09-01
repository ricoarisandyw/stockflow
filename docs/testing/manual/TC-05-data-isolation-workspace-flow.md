---
id: "TC-05"
title: "Multi-Tenancy & Per-User Workspace Data Isolation Flow"
category: "Security & Data Isolation"
priority: "High"
target: "Multi-User Data Boundary"
coverage: "[[mission#^a7-data-isolation]]"
status: "⚪ Pending"
---

# 🧪 TC-05: Multi-Tenancy & Per-User Workspace Data Isolation Flow

## 🎯 Objective
Verify strict per-user workspace isolation: User A cannot view, modify, or delete inventory products or invoices owned by User B.

---

## 📋 Pre-conditions
1. User A (`userA@stockflow.dev`) registered.
2. User B (`userB@stockflow.dev`) registered.

---

## 🪜 Step-by-Step Test Procedure

| Step # | Action | Input / Payload | Expected Result | Pass / Fail |
| :--- | :--- | :--- | :--- | :--- |
| **1** | Login as `userA@stockflow.dev` | User A credentials | Successfully authenticated into User A dashboard. | `[ ]` |
| **2** | User A creates a unique product and invoice | SKU: `USRA-001`<br>Invoice: `INV-2026-A01` | Product and invoice created under User A. | `[ ]` |
| **3** | Logout from User A, then login as `userB@stockflow.dev` | User B credentials | Successfully authenticated into User B dashboard. | `[ ]` |
| **4** | User B navigates to `/products` and `/invoices` | View catalog and invoice lists | Product `USRA-001` and invoice `INV-2026-A01` **do not appear** in User B's workspace. | `[ ]` |
| **5** | User B creates a product with the same SKU (`USRA-001`) | SKU: `USRA-001`<br>Name: `User B Product` | **Succeeds**, because SKU uniqueness is constrained per user workspace (`[userId, sku]`), not globally. | `[ ]` |
| **6** | User B attempts direct URL access to User A's invoice (`/invoices/{id-user-A}`) | Open User A's invoice ID | Server returns `404 Not Found` or `403 Forbidden`. | `[ ]` |
