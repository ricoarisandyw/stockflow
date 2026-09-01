# StockFlow Architecture Canvas

Visual architecture map for StockFlow represented as an interactive Obsidian Canvas with Next.js App Router and tRPC.

![[STACK-ARCHITECT.canvas]]

---

## Canvas Layer Guide

1. **🎨 Frontend Client & Server Components (Cyan)**: Halaman Next.js App Router (`/login`, `/register`, `/products`, `/invoices`) dengan hooks type-safe tRPC (`useQuery`, `useMutation` via TanStack Query) dan direct Server Caller untuk Server Components.
2. **⚡ tRPC Layer & Middleware Guard (Yellow)**: `createTRPCContext` untuk ekstraksi session JWT & Prisma client, `protectedProcedure` auth guard (HTTP 401), dan unified fetch handler `app/api/trpc/[trpc]/route.ts`.
3. **🔀 tRPC AppRouter & Procedures (Orange)**: `authRouter`, `productRouter`, dan `invoiceRouter` dengan input Zod validation.
4. **⚙️ Business Logic & Transaction Layer (Green)**: Skema validasi Zod dan layer Service untuk transaksi atomik stok (Issue & Cancel invoice).
5. **🗄️ Data & Persistence Layer (Purple)**: Prisma ORM Client dengan transaksi ACID (`prisma.$transaction`) dan database SQLite / PostgreSQL.
