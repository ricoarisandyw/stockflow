# StockFlow Entity Relationship Diagram (ERD)

Visual Entity Relationship Diagram represented as an interactive Obsidian Canvas.

![[ERD.canvas]]

---

## 📋 Data Schema Summary

### 1. `User` Entity
- Primary key: `id` (UUID)
- Unique fields: `email`
- Security: `passwordHash` (bcrypt salted)
- Relationships: 1:N with `Product`, 1:N with `Invoice`

### 2. `Product` Entity
- Primary key: `id` (UUID)
- Composite Unique Index: `@@unique([userId, sku])` (Per-user workspace isolation)
- Money & Units: `unitPrice` (Integer minor units/cents/rupiah), `quantityOnHand` (Integer $\ge$ 0)
- Foreign key: `userId` $\rightarrow$ `User.id`

### 3. `Invoice` Entity
- Primary key: `id` (UUID)
- Unique fields: `invoiceNumber` (e.g. `INV-2026-0001`)
- Financials (Integer): `subtotal`, `taxRate` (default 11%), `taxAmount`, `total`
- Status: `InvoiceStatus` (`DRAFT`, `ISSUED`, `PAID`, `CANCELLED`)
- Foreign key: `userId` $\rightarrow$ `User.id`

### 4. `InvoiceItem` Entity (Snapshot)
- Primary key: `id` (UUID)
- Foreign keys: `invoiceId` $\rightarrow$ `Invoice.id` (Cascade), `productId` $\rightarrow$ `Product.id` (Restrict)
- Historical Snapshot: `productName`, `unitPrice` (immune to future master product price changes)
- Financials: `quantity` ($> 0$), `lineTotal` (`quantity * unitPrice`)
