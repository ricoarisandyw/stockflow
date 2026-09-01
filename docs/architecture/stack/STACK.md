# Tech Stack Decisions & Architecture Rationale

This document defines the architectural patterns and technologies chosen for the **StockFlow** project, along with technical justifications referencing the test specification requirements.

---

## 1. Architectural Pattern: Full-Stack Type-Safe Modular Monolith
> Mentioned at:
> - [[mission#^sec2-backend-req]] : *"NestJS, Express, Fastify, Hapi, Koa, or Next.js API routes / Route Handlers."*
> - [[mission#^sec2-frontend-req]] : *"Any JS framework — React, Next.js, Vue, Nuxt, Svelte, Angular, or Remix."*
> - [[mission#^sec2-hard-rules]] : *"the server runtime must be Node.js, and the whole thing must run locally with a documented setup."*
> - [[mission#^clean-clone-readme]] : *"Does it run from a clean clone by following your README?"*

### Architecture Justification:
- **Zero-Friction Reviewer Setup**: Reviewers can execute and evaluate the entire application (both frontend and backend) via a single command (`npm install && npm run dev`) without managing multiple terminals or monorepo workspace tooling.
- **End-to-End Type Safety**: Uses tRPC on top of Next.js App Router to connect backend router procedures directly with frontend React Query hooks without manual API schema mapping or code generation steps.
- **Unified TypeScript Domain Model**: Zod schemas, Prisma database models, and DTO types are shared seamlessly across the entire application stack.

---

## 2. Core Framework & API Layer: Next.js (App Router) + tRPC
> Mentioned at:
> - [[mission#^sec2-backend-req]] : *"Next.js API routes / Route Handlers"*
> - [[mission#^sec2-frontend-req]] : *"Next.js"*
> - [[mission#^a6-auth-protection]] : *"Every inventory and invoice endpoint requires authentication and returns 401 when unauthenticated."*
> - [[mission#^n6-consistent-errors]] : *"Consistent error responses with correct HTTP status codes"*

### Architecture Justification:
- **End-to-End Autocompletion**: Schema modifications on backend routers are instantly reflected across client components during development.
- **Declarative Auth Guard (`protectedProcedure`)**: tRPC middleware automatically validates the JWT session token and throws `TRPCError({ code: 'UNAUTHORIZED' })` (HTTP 401) whenever an unauthenticated request is detected.
- **Native TanStack Query Integration**: `@trpc/react-query` provides hooks (`useQuery`, `useMutation`, automatic caching, background refetching) out-of-the-box with zero boilerplate.
- **Server Component Integration**: Inside React Server Components (RSC), tRPC procedures can be called directly via server callers (`api.product.list()`) without HTTP network overhead.

---

## 3. Language: TypeScript (Full-Stack)
> Mentioned at:
> - [[mission#^sec2-lang-pref]] : *"JavaScript or TypeScript (TypeScript is preferred)"*

### Architecture Justification:
- **Strict Type Safety**: Prevents runtime errors and type mismatches during inventory stock transactions and invoice status state transitions.
- **Explicit Requirement Preference**: The test specification explicitly declares that *TypeScript is preferred*.

---

## 4. Database & ORM: SQLite (Local) / PostgreSQL + Prisma ORM
> Mentioned at:
> - [[mission#^sec2-database-opt]] : *"PostgreSQL, MySQL/MariaDB, SQLite, or MongoDB"*
> - [[mission#^sec2-orm-opt]] : *"Prisma, TypeORM, Drizzle, Sequelize, Mongoose, Knex, or raw SQL"*
> - [[mission#^sec2-hard-rules]] : *"Use a real database (SQLite counts) — not an in-memory array that dies on restart."*

### Architecture Justification:
- **Zero-Dependency Local Execution**: SQLite operates directly from a local file (`prisma/dev.db`), eliminating the need for reviewers to install external database engines or run Docker containers.
- **Prisma Transactions & Migrations**: Enables ACID transaction execution (`prisma.$transaction`) essential for atomic stock decrement on invoice issue and stock restoration on invoice cancellation.
- **Automated Database Seeding**: Pre-configured seed runner (`prisma/seed.ts`) executable via `npx prisma db seed`.

---

## 5. UI & Styling: Tailwind CSS + Lucide Icons
> Mentioned at:
> - [[mission#^sec2-styling-opt]] : *"Tailwind, MUI, Chakra, shadcn/ui, Bootstrap, or plain CSS"*
> - [[mission#^clean-clone-readme]] : *"plain and functional is fine"*

### Architecture Justification:
- **Rapid UI Construction**: Enables building functional, responsive, and clean user interfaces quickly (login forms, product catalogs, multi-line invoice forms).
- **Zero Runtime Overhead**: Utility-first CSS compiling to static CSS without heavy runtime component library penalties.

---

## 6. Authentication & Security: bcryptjs + JWT / httpOnly Cookies
> Mentioned at:
> - [[mission#^a2-login-jwt]] : *"Login returning a credential (JWT or httpOnly session cookie — your call)."*
> - [[mission#^a4-password-hash]] : *"Passwords hashed with bcrypt or argon2 (with per-user salt). Plaintext or reversible encryption is an automatic fail."*
> - [[mission#^a6-auth-protection]] : *"Every inventory and invoice endpoint requires authentication and returns 401 when unauthenticated."*

### Architecture Justification:
- **Secure Password Hashing**: Utilizes `bcryptjs` with salt rounds $\ge 10$ to ensure passwords are never stored in plaintext or reversible formats.
- **Stateless & Portable Session**: Signed JWT tokens verified in tRPC Context (`createTRPCContext`) and injected into `ctx.user`, enforcing per-user data isolation.

---

## 7. Input Validation: Zod
> Mentioned at:
> - [[mission#^i3-validation-err]] : *"Server-side validation: sku unique, unitPrice >= 0, quantityOnHand >= 0, required fields present. Return a clear 400/422 with field-level messages."*

### Architecture Justification:
- **Direct tRPC Input Validation**: Serves as the authoritative schema validator plugged into `.input(zodSchema)`.
- **Field-Level Error Messages**: Structured validation error objects are automatically formatted and returned to the client upon input invalidity.

---

## 8. Testing: Vitest + tRPC Caller
> Mentioned at:
> - [[mission#^n4-automated-tests]] : *"Automated tests — at minimum 5 meaningful tests... Unit or integration, your choice."*

### Architecture Justification:
- **Direct Procedure Testing (`createCaller`)**: Tests domain logic, authorization guards, and database transactions directly without spawning a background HTTP network server.
- **Fast Execution**: Comprehensive test suites complete in milliseconds via `npm test`.

---

## Project Directory Structure

```text
stockflow/
├── prisma/
│   ├── schema.prisma        # Database schema (User, Product, Invoice, InvoiceItem)
│   └── seed.ts              # Seeder (demo credentials & sample inventory)
├── src/
│   ├── app/
│   │   ├── (auth)/          # Pages: /login & /register
│   │   ├── (dashboard)/     # Pages: /products, /invoices, /invoices/new, /invoices/[id]
│   │   ├── api/
│   │   │   └── trpc/[trpc]/ # tRPC HTTP fetch handler route
│   │   ├── layout.tsx       # Root layout with TRPCProvider
│   │   └── page.tsx         # Root redirect / landing
│   ├── components/          # UI Components (Navbar, Tables, Modals, Forms)
│   ├── lib/                 # Utilities: prisma client, jwt, password hasher
│   ├── server/
│   │   ├── api/
│   │   │   ├── routers/     # tRPC Routers: auth.ts, product.ts, invoice.ts
│   │   │   ├── root.ts      # Merged AppRouter definition
│   │   │   └── trpc.ts      # tRPC initialization, context, & protectedProcedure
│   │   └── services/        # Business Logic: product service, invoice transaction service
│   ├── trpc/
│   │   ├── client.ts        # Client-side tRPC hooks (powered by TanStack Query)
│   │   └── server.ts        # Server-side tRPC direct caller (RSC)
│   └── validations/         # Zod schemas for auth, products, and invoices
├── tests/                   # Automated test suites for the 5 mandatory scenarios
├── docs/                    # Architecture & Project Documentation
│   ├── FILES.md
│   └── architecture/
│       ├── stack/
│       │   ├── STACK.md
│       │   ├── STACK-ARCHITECT.md
│       │   ├── STACK-ARCHITECT.canvas
│       │   ├── ERD.md
│       │   └── ERD.canvas
│       └── ui/
│           └── UI.canvas
├── .env.example
├── README.md
└── package.json
```
