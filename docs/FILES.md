# 🗂️ StockFlow Project Files & Directory Structure

This document outlines the planned file and directory structure for the **StockFlow** application, referencing the corresponding requirements from [[mission#^sec2-backend-req]].

---

## 📁 Root & Configuration
- `package.json`: Project manifest, dependencies, scripts (`dev`, `build`, `start`, `test`).
- `tsconfig.json`: TypeScript configuration (Strict mode enabled) — [[mission#^sec2-lang-pref]].
- `tailwind.config.ts` & `postcss.config.js`: Styling setup using Tailwind CSS — [[mission#^sec2-styling-opt]].
- `vitest.config.ts`: Vitest test runner configuration — [[mission#^n4-automated-tests]].
- `.env.example`: Environment variables template with safe placeholders — [[mission#^n2-env-example]].
- `README.md`: Setup guide, architecture rationale, demo credentials, AI usage, and trade-offs — [[mission#^n1-readme-setup]].

---

## 🗄️ Database & Persistence (`prisma/`)
- `prisma/schema.prisma`: Prisma data models (`User`, `Product`, `Invoice`, `InvoiceItem`, `InvoiceStatus`) — [[mission#^sec4-entities-schema]].
- `prisma/seed.ts`: Seed script initializing demo account (`demo@stockflow.dev`) and initial products — [[mission#^n3-demo-credentials]].
- `prisma/migrations/`: Versioned database migration files.

---

## 🌐 Application Core (`src/`)

### 1. Application Pages (`src/app/`)
- `src/app/layout.tsx`: Root layout with TanStack Query + tRPC Provider and font configurations.
- `src/app/(auth)/login/page.tsx`: Sign-in page with server error feedback — [[mission#^f1-auth-pages]].
- `src/app/(auth)/register/page.tsx`: Registration page with password validation — [[mission#^f1-auth-pages]].
- `src/app/(dashboard)/layout.tsx`: Authenticated dashboard shell with navigation and session guards — [[mission#^f5-auth-layout]].
- `src/app/(dashboard)/products/page.tsx`: Inventory catalog with real-time search, pagination, and modal CRUD — [[mission#^f2-products-page]].
- `src/app/(dashboard)/invoices/page.tsx`: Invoices list with status filter tabs and pagination — [[mission#^f4-invoice-detail]].
- `src/app/(dashboard)/invoices/new/page.tsx`: Invoice creation form with live totals and stock validation — [[mission#^f3-invoice-create]].
- `src/app/(dashboard)/invoices/[id]/page.tsx`: Invoice detail view with status action buttons (Issue, Mark as Paid, Cancel) — [[mission#^f4-invoice-detail]].
- `src/app/api/trpc/[trpc]/route.ts`: Next.js Route Handler adapter for tRPC endpoints.

### 2. tRPC Server Layer (`src/server/`)
- `src/server/api/trpc.ts`: Context creation (`createTRPCContext`), `publicProcedure`, and `protectedProcedure` auth guard — [[mission#^a6-auth-protection]].
- `src/server/api/root.ts`: App router root combining auth, product, and invoice sub-routers.
- `src/server/api/routers/auth.ts`: Authentication router (register, login, logout, me).
- `src/server/api/routers/product.ts`: Inventory router (list, create, update, delete) — [[mission#^i1-crud-product]].
- `src/server/api/routers/invoice.ts`: Invoicing router (list, getById, create, updateStatus) — [[mission#^v10-list-invoices]].

### 3. Business Logic & Services (`src/server/services/`)
- `src/server/services/authService.ts`: Password hashing (bcrypt) and JWT session management — [[mission#^a4-password-hash]].
- `src/server/services/productService.ts`: Inventory operations, SKU uniqueness per user, and invoice deletion protection — [[mission#^i4-delete-guard]].
- `src/server/services/invoiceService.ts`: Authoritative totals calculation, stock limit validation, and atomic stock transaction state machine — [[mission#^v2-server-totals]], [[mission#^v6-atomic-issue]], [[mission#^v7-atomic-cancel]].

### 4. Utilities & Validations (`src/lib/`, `src/validations/`)
- `src/lib/prisma.ts`: Global Prisma Client singleton.
- `src/lib/auth.ts`: JWT signing/verification and cookie helper utilities.
- `src/lib/money.ts`: Integer minor units calculation helper functions.
- `src/validations/authSchema.ts`: Zod validation schemas for registration and login.
- `src/validations/productSchema.ts`: Zod validation schemas for product creation and update — [[mission#^i3-validation-err]].
- `src/validations/invoiceSchema.ts`: Zod validation schemas for invoice creation.

---

## 🧪 Automated Testing Suite (`tests/`)
- `tests/helpers.ts`: Test setup and tRPC caller context generator.
- `tests/auth.test.ts`: Automated tests for login rejection and 401 unauthenticated guard — [[mission#^n4-automated-tests]].
- `tests/inventory.test.ts`: Automated tests for SKU uniqueness and deletion guard.
- `tests/invoices.test.ts`: Automated tests for stock limit guard, atomic stock decrement on issue, and stock restore on cancel — [[mission#^n4-automated-tests]].
