# 📋 StockFlow Implementation Plan & Checkable Checklist

This document is the step-by-step execution roadmap for engineering the **StockFlow** application. Each phase includes verifiable **UI & API Checkables** that can be directly tested in the browser or terminal.

---

## 🚀 Phase 1: Project Scaffolding & Database Infrastructure

Establish the core Next.js App Router project foundation with TypeScript, Tailwind CSS, tRPC, Prisma ORM, and SQLite database.

### 🔨 Tasks & Steps:
- [x] Initialize Next.js 14/15 App Router with TypeScript and Tailwind CSS.
- [x] Setup tRPC v10/v11 (`@trpc/server`, `@trpc/client`, `@trpc/react-query`, `@tanstack/react-query`).
- [x] Configure Prisma Schema (`prisma/schema.prisma`):
  - `User` model (`id`, `email`, `passwordHash`, `name`, timestamps).
  - `Product` model (`id`, `userId`, `sku`, `name`, `description`, `unitPrice`, `quantityOnHand`, timestamps) with `@@unique([userId, sku])`.
  - `Invoice` model (`id`, `userId`, `invoiceNumber`, `customerName`, `issueDate`, `dueDate`, `status`, `subtotal`, `taxRate`, `taxAmount`, `total`).
  - `InvoiceItem` model (`id`, `invoiceId`, `productId`, `productName`, `unitPrice`, `quantity`, `lineTotal`).
  - `InvoiceStatus` enum (`DRAFT`, `ISSUED`, `PAID`, `CANCELLED`).
- [x] Create environment template `.env.example` (containing `DATABASE_URL`, `JWT_SECRET`, `DEFAULT_TAX_RATE=11`).
- [x] Run initial Prisma migrations to generate local SQLite database `dev.db`.
- [x] Create seed script `prisma/seed.ts` to initialize demo account (`demo@stockflow.dev` / `password123`) and 5 sample products.
- [x] Configure Vitest test runner (`vitest.config.ts`).

### 🔍 Verification & Checkables:
- [x] **DB Check:** Run `npx prisma db seed` $\rightarrow$ Seeds demo user and products without errors.
- [x] **App Check:** Run `npm run dev` $\rightarrow$ Dev server runs at `http://localhost:3000` with zero console errors.
- [x] **Test Check:** Run `npm test` $\rightarrow$ Vitest runner activates and executes baseline placeholder test.

---

## 🔐 Phase 2: Authentication, Route Protection & App Shell
*Coverage:* [[mission#^a1-register]], [[mission#^a2-login-jwt]], [[mission#^a4-password-hash]], [[mission#^a6-auth-protection]], [[mission#^a9-auth-generic-error]]

Implement stateless authentication with bcrypt password hashing, JWT in `httpOnly` cookie, route middleware guard, and app shell layout.

### 🔨 Tasks & Steps:
- [ ] Implement `src/lib/auth.ts`: bcrypt password hashing (`bcryptjs`) and JWT signing / verification (`jose`).
- [ ] Setup tRPC Context (`src/server/api/trpc.ts`): read `stockflow_token` cookie, verify JWT, and inject `ctx.user`.
- [ ] Implement `protectedProcedure` middleware guard: throws `TRPCError({ code: 'UNAUTHORIZED' })` if `ctx.user` is null.
- [ ] Build tRPC Router `src/server/api/routers/auth.ts`:
  - `auth.register`: Zod validation (valid email, password $\ge$ 8 chars), hash password, create user in database.
  - `auth.login`: Verify email & password hash, return generic error if invalid, set `httpOnly` session cookie on success.
  - `auth.logout`: Invalidate / clear `stockflow_token` session cookie.
  - `auth.me`: Fetch currently authenticated user profile.
- [ ] Configure Next.js `src/middleware.ts`: protect `/products` and `/invoices` routes, redirect unauthenticated users to `/login`.
- [ ] Build UI components:
  - `/login` page (email form, password form, error banner alert).
  - `/register` page (name form, email form, password min 8 characters).
  - App Navbar (`src/components/Navbar.tsx`) with user indicator and `[ Logout ]` button.

### 🔍 Verification & Checkables (UI & API):
- [ ] **UI Test (F1):** Open `/login` $\rightarrow$ Enter `demo@stockflow.dev` with wrong password $\rightarrow$ Generic error banner appears: *"Invalid email or password"*.
- [ ] **UI Test (F1):** Enter correct password `password123` $\rightarrow$ Login succeeds and redirects to `/products`.
- [ ] **UI Test (F1):** Open `/register` $\rightarrow$ Register new account `test@stockflow.dev` (pwd: `secret123`) $\rightarrow$ User successfully created.
- [ ] **UI Test (F5):** Click `[ Logout ]` in navbar $\rightarrow$ Session cookie deleted, redirected to `/login`.
- [ ] **UI Test (F5):** Attempt opening `http://localhost:3000/products` while logged out $\rightarrow$ Automatically redirected to `/login`.

---

## 📦 Phase 3: Inventory Management & Search Catalog
*Coverage:* [[mission#^sec4-entities-schema]], [[mission#^i1-crud-product]], [[mission#^i2-list-search]], [[mission#^i3-validation-err]], [[mission#^i4-delete-guard]], [[mission#^a7-data-isolation]]

Build inventory catalog management with validation guards, real-time debounced search, pagination, and multi-tenant data isolation.

### 🔨 Tasks & Steps:
- [ ] Create Zod schemas `src/validations/productSchema.ts` (`sku` required, `name` required, `unitPrice >= 0`, `quantityOnHand >= 0`).
- [ ] Implement `src/server/services/productService.ts` & `src/server/api/routers/product.ts`:
  - `product.list`: Database query filtered by `userId = ctx.user.id`, debounced search by name/SKU, and pagination (`take`, `skip`).
  - `product.create`: Validate SKU uniqueness per user (`where: { userId_sku: { userId, sku } }`), save product.
  - `product.update`: Update product name, price, stock, and description.
  - `product.delete`: Verify relation to `invoiceItems` $\rightarrow$ Block deletion if referenced by existing invoices.
- [ ] Build UI `/products`:
  - Search bar input with debounced query update.
  - Products catalog table (SKU, Name, Formatted Price, Quantity on Hand, `[ Edit ]` and `[ Delete ]` action buttons).
  - Pagination controls (`[ < Prev ]`, Page Indicators, `[ Next > ]`).
  - Modal dialogs for `[ + Add Product ]` and `[ Edit Product ]`.

### 🔍 Verification & Checkables (UI & API):
- [ ] **UI Test (F2):** Open `/products` $\rightarrow$ Initial products from database seeder display in table.
- [ ] **UI Test (F2):** Click `[ + Add Product ]` $\rightarrow$ Fill SKU `VAL-001`, Name `Ball Valve`, Price `50000`, Stock `25` $\rightarrow$ Product appears in table immediately.
- [ ] **UI Test (I3):** Attempt adding another product with duplicate SKU `VAL-001` $\rightarrow$ Validation error displays: *"SKU already exists in your inventory"*.
- [ ] **UI Test (I2):** Type `Valve` in search box $\rightarrow$ Table filters in real-time.
- [ ] **UI Test (F2):** Click `[ Edit ]` on `VAL-001` $\rightarrow$ Change price to `55000` $\rightarrow$ Table price refreshes instantly.
- [ ] **UI Test (I4):** Attempt deleting product referenced by an existing invoice $\rightarrow$ Deletion blocked with clear alert: *"Cannot delete product referenced by existing invoice"*.

---

## 📝 Phase 4: Invoice Creation & Authoritative Financial Calculations
*Coverage:* [[mission#^v1-create-invoice]], [[mission#^v2-server-totals]], [[mission#^v3-tax-rate]], [[mission#^v4-snapshot-item]], [[mission#^v5-stock-guard]]

Build multi-line invoice creation form with live preview totals, authoritative server recalculation, price snapshotting, and stock limit guards.

### 🔨 Tasks & Steps:
- [ ] Create Zod schemas `src/validations/invoiceSchema.ts` (customer name required, due date, items array min 1 item, quantity $> 0$).
- [ ] Implement financial calculation helper `src/lib/money.ts` (subtotal, 11% tax, grand total using integer minor units).
- [ ] Implement `invoice.create` in `src/server/api/routers/invoice.ts`:
  - Auto-generate sequential invoice number (`INV-2026-0001`).
  - Enforce Stock Guard: query current `quantityOnHand` for each product $\rightarrow$ If `requestedQty > stock`, reject creation.
  - Calculate `lineTotal`, `subtotal`, `taxAmount` (11%), and `total` on the server.
  - Snapshot `unitPrice` and `productName` onto `InvoiceItem`.
  - Save invoice in initial `DRAFT` status.
- [ ] Build UI `/invoices/new`:
  - Customer information fields (Customer Name, Issue Date, Due Date, Notes).
  - Dynamic line items builder: Product selector dropdown (displaying available stock), auto price autofill, quantity input, `[ 🗑️ Remove ]` button, and `[ + Add Line Item ]` button.
  - Live summary preview card (Subtotal, Tax 11%, Grand Total).
  - Action buttons: `[ Cancel ]`, `[ Save as Draft ]`, and `[ Save & Issue Immediately ]`.

### 🔍 Verification & Checkables (UI & API):
- [ ] **UI Test (V5):** On `/invoices/new`, pick product with stock 10, enter quantity 15 $\rightarrow$ Stock Guard alert displays and submission is blocked.
- [ ] **UI Test (F3):** Add 2 valid line items $\rightarrow$ Live preview Subtotal, Tax 11%, and Grand Total compute accurately.
- [ ] **UI Test (V1):** Click `[ Save as Draft ]` $\rightarrow$ Invoice created in `DRAFT` status, redirected to detail page.
- [ ] **UI Test (V4):** Open `/products` $\rightarrow$ Update master product price $\rightarrow$ Open draft invoice $\rightarrow$ Invoice line unit price **remains unchanged** (snapshot verified).
- [ ] **UI Test (V1):** Check stock in `/products` $\rightarrow$ Stock is **not decremented** while invoice remains in `DRAFT` status.

---

## 🔄 Phase 5: Invoice Lifecycle & Atomic Stock Transactions
*Coverage:* [[mission#^v6-atomic-issue]], [[mission#^v7-atomic-cancel]], [[mission#^v8-status-transitions]], [[mission#^v9-edit-draft-only]], [[mission#^v10-list-invoices]]

Implement atomic database transactions for stock decrement on issue, stock restoration on cancellation, and status state machine enforcement.

### 🔨 Tasks & Steps:
- [ ] Implement atomic transactions in `src/server/services/invoiceService.ts`:
  - `issueInvoice(invoiceId)`: Within `prisma.$transaction`, verify stock sufficiency across all lines $\rightarrow$ Decrement `quantityOnHand` for each product $\rightarrow$ Update status to `ISSUED`.
  - `cancelInvoice(invoiceId)`: Within `prisma.$transaction`, if status was `ISSUED` $\rightarrow$ Restore consumed stock $\rightarrow$ Update status to `CANCELLED`. If status was `DRAFT` $\rightarrow$ Update status to `CANCELLED` without modifying stock.
  - `markAsPaid(invoiceId)`: Update status `ISSUED` $\rightarrow$ `PAID`.
  - State machine guard: Reject illegal transitions (e.g. `PAID` $\rightarrow$ `DRAFT`, `CANCELLED` $\rightarrow$ `ISSUED`).
- [ ] Implement `invoice.list` router (with status filter tabs `ALL|DRAFT|ISSUED|PAID|CANCELLED` and pagination) and `invoice.getById`.
- [ ] Build UI:
  - `/invoices` page (invoice list table, status filter tabs, status badges).
  - `/invoices/[id]` page (complete invoice breakdown, snapshotted line items, financial totals, and contextual action buttons `[ 🚀 Issue Invoice ]`, `[ 💵 Mark as Paid ]`, `[ ⚠️ Cancel Invoice ]`).

### 🔍 Verification & Checkables (UI & API):
- [ ] **UI Test (V6):** On `DRAFT` invoice, click `[ 🚀 Issue Invoice ]` $\rightarrow$ Status updates to `ISSUED`, product inventory stock decrements atomically.
- [ ] **UI Test (V7):** On `ISSUED` invoice, click `[ ⚠️ Cancel Invoice & Restore Stock ]` $\rightarrow$ Status updates to `CANCELLED`, product inventory stock restores atomically.
- [ ] **UI Test (V7):** Cancel a `DRAFT` invoice $\rightarrow$ Status updates to `CANCELLED`, inventory stock **remains unchanged**.
- [ ] **UI Test (V8):** On `ISSUED` invoice, click `[ 💵 Mark as Paid ]` $\rightarrow$ Status updates to `PAID` and actions become read-only.
- [ ] **UI Test (F4):** Open `/invoices` and click `[ ISSUED ]` tab $\rightarrow$ Only `ISSUED` invoices are displayed in table.

---

## 🧪 Phase 6: Automated Test Suites (Vitest Runner)
*Coverage:* [[mission#^n4-automated-tests]], [[mission#^n6-consistent-errors]]

Write comprehensive automated test suites to verify all 5 mandatory test requirements and core business logic.

### 🔨 Tasks & Steps:
- [ ] Setup tRPC caller test context helper (`tests/helpers.ts`).
- [ ] `tests/auth.test.ts`:
  - **Test (a):** Login with incorrect password is rejected with generic error.
  - **Test (b):** Request to protected route without credentials returns HTTP 401.
- [ ] `tests/inventory.test.ts`:
  - Zod validation and per-user SKU uniqueness.
  - Deletion guard on product referenced by existing invoices.
- [ ] `tests/invoices.test.ts`:
  - **Test (c):** Invoicing more than available stock is rejected.
  - **Test (d):** Issuing an invoice decrements product stock accurately and atomically.
  - **Test (e):** Cancelling an issued invoice restores product stock accurately and atomically.
  - Financial calculations and price snapshot integrity.
  - Illegal status transition rejection.
- [ ] Configure `npm test` script in `package.json`.

### 🔍 Verification & Checkables (Automated):
- [ ] **Automated Test Check:** Run `npm test` $\rightarrow$ All 5 mandatory test scenarios (a–e) and integration suites pass 100% (*all green*).

---

## 📄 Phase 7: Project Documentation, AI Usage & Final Polish
*Coverage:* [[mission#^n1-readme-setup]], [[mission#^n2-env-example]], [[mission#^n3-demo-credentials]], [[mission#^sec8-ai-usage]], [[mission#^sec9-readme-contents]]

Finalize project documentation, perform repository hygiene audit, and verify clean-clone setup.

### 🔨 Tasks & Steps:
- [ ] Write comprehensive `README.md` including:
  - Prerequisites & setup steps (clean clone execution guide).
  - Demo login credentials (`demo@stockflow.dev` / `password123`).
  - Architecture decisions & rationale (5–10 bullet points).
  - Trade-offs & known limitations.
  - What you would do with one more week.
  - **AI Usage Section**: Documentation of AI tools used and their purpose.
  - Total time spent (*hours spent*).
- [ ] Audit `.env.example`: verify all environment variables have safe placeholder values.
- [ ] Audit Git history: ensure incremental, meaningful commits free of secrets or local agent configurations.

### 🔍 Verification & Checkables:
- [ ] **Script Validation:** Run `python3 .agents/skills/rico-obsidian/scripts/check-link.py` $\rightarrow$ 0 missing links.
- [ ] **Git Check:** Run `git status` $\rightarrow$ No untracked secrets `.env` or `.agents/` folders tracked.
- [ ] **Clean Run Simulation:** Test clean clone in separate directory following `README.md` $\rightarrow$ Application boots and functions within 1 minute.
