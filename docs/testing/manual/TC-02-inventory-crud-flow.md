---
id: "TC-02"
title: "Inventory CRUD, Search, Pagination & Deletion Guard Flow"
category: "Inventory Management"
priority: "High"
target: "Products Management (/products)"
coverage: "[[mission#^sec4-entities-schema]], [[mission#^i3-validation-err]]"
status: "⚪ Pending"
---

# 🧪 TC-02: Inventory CRUD, Search, Pagination & Deletion Guard Flow

## 🎯 Objective
Verify product inventory management: creating new products, validating non-negative values (`unitPrice >= 0`, `quantityOnHand >= 0`), enforcing per-user SKU uniqueness, real-time debounced searching, pagination, updating details, and blocking deletion of products referenced in invoices.

---

## 📋 Pre-conditions
1. User logged in as `demo@stockflow.dev`.
2. Initial products present from seed script.

---

## 🪜 Step-by-Step Test Procedure

| Step # | Action | Input / Payload | Expected Result | Pass / Fail |
| :--- | :--- | :--- | :--- | :--- |
| **1** | Click `[ + Add Product ]` and fill form | SKU: `WID-999`<br>Name: `Steel Flange`<br>Price: `50000`<br>Stock: `20` | Product is saved and immediately appears at the top of the products catalog table. | `[ ]` |
| **2** | Attempt adding product with duplicate SKU | SKU: `WID-999`<br>Name: `Duplicate Flange`<br>Price: `10000`<br>Stock: `5` | Form rejects submission with error: *"SKU already exists in your inventory"*. | `[ ]` |
| **3** | Type query into search bar | Query: `Flange` | Table automatically filters to display only products matching name or SKU `Flange`. | `[ ]` |
| **4** | Click `[ Edit ]` on `WID-999` and update price | New Unit Price: `55000` | Product updates successfully and table reflects the updated price immediately. | `[ ]` |
| **5** | Attempt deleting a product referenced by an existing invoice | Click `[ 🗑️ Delete ]` on referenced item | System blocks deletion with alert: *"Cannot delete product referenced by existing invoice"*. | `[ ]` |
| **6** | Delete an unreferenced product | Click `[ 🗑️ Delete ]` on unused product | Product is deleted and removed from the table. | `[ ]` |
