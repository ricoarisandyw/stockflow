# StockFlow

Fullstack Inventory & invoicing web app for small distributors

## Table of contents

- [Setup](#setup)
- [Running tests](#running-tests)
- [API documentation](#api-documentation)
- [Key design decisions & trade-offs](#key-design-decisions--trade-offs)
- [Possible future improvements](#possible-future-improvements)
- [AI usage](#ai-usage)
- [Tech stack](#tech-stack)
- [Hours spent](#hours-spent)
- [If I had one more week](#if-i-had-one-more-week)

## Setup
### File Setup

```bash
git clone https://github.com/ricoarisandyw/stockflow
cd stockflow
npm install
cp .env.example .env
```

See `.env.example` for the required variables and their defaults.

### Data Setup

```bash
npm run db:setup # contain products, invoice, 1 user demo
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to `/login`.

### Demo credentials

```
Email:    staff@stockflow.dev
Password: Password123!
```

or use the **"Use demo credentials"** button

## Running tests

```bash
npm test
```

Runs against a mocked Prisma client — no real database or network access required.

## API documentation

- Open [localhost:3000/api/docs](http://localhost:3000/api/docs)
- OpenAPI 3.1 spec: [`public/openapi.yaml`](public/openapi.yaml)

### Success response shape

```json
{
  "success": true,
  "data": { "id": "prd_01", "sku": "KB-MCH-01", "unitPrice": 850000 }
}
```

Paginated list endpoints add a `meta` object:

```json
{
  "success": true,
  "data": [ /* ... */ ],
  "meta": { "page": 1, "limit": 10, "totalItems": 42, "totalPages": 5 }
}
```

### Error response shape

Every API error uses the same JSON envelope, with an HTTP status mapped from a stable domain error code:

```json
{
  "success": false,
  "error": {
    "code": "UNPROCESSABLE_ENTITY",
    "codeNumber": 3003,
    "message": "Insufficient stock for one or more products.",
    "details": [{ "field": "items.0.quantity", "message": "..." }]
  }
}
```

| HTTP status | `code` | Used for |
|---|---|---|
| 400 | `BAD_REQUEST` | Invalid payload shape, invalid status transition |
| 401 | `UNAUTHORIZED` | Missing/invalid session, wrong credentials |
| 404 | `NOT_FOUND` | Resource doesn't exist or isn't owned by the caller |
| 409 | `CONFLICT` | Duplicate email, duplicate SKU, product referenced by an invoice |
| 422 | `UNPROCESSABLE_ENTITY` | Insufficient stock |
| 500 | `INTERNAL_SERVER_ERROR` | Unexpected server error |

## Key design decisions & trade-offs

- **Money as integers, not floats**
  - `unitPrice`, `subtotal`, `taxAmount`, `total` are `Int` in the DB, computed in `src/utils/money.utils.ts`
  - No floating-point drift; UI formats raw integers itself (IDR has no common minor unit)
- **All money/stock calculations happen server-side**
  - Client sends only `productId` + `quantity`
  - The invoice form's "live calculation" is a preview only, never trusted for the write
- **Snapshot pricing on invoice line items**
  - `InvoiceItem` stores `productName` + `unitPrice` at creation time
  - Later product changes never retroactively alter historical invoices
- **Atomic stock transitions via `prisma.$transaction`**
  - Stock decrement (issue) and restoration (cancel) share a transaction with the status update
  - A partial failure can't desync stock and invoice status
- **Uniform auth error messages**
  - Wrong email and wrong password both return the same `AUTH_INVALID_CREDENTIALS` error
  - Prevents user enumeration
- **Layout-based route protection instead of global middleware**
  - Each route group's `layout.tsx` calls `SessionLib.getSession()` and redirects explicitly
  - Keeps the protection boundary and its exceptions (e.g. `openapi.yaml`) explicit per route group, instead of one shared regex matcher
- **SQLite via `better-sqlite3` instead of Postgres/MySQL**
  - Zero-setup local dev, no external DB service
  - Would need a networked DB with connection pooling for real concurrent production use
- **Forms use React Hook Form + Zod, submitted via TanStack Query mutations**
  - Validation schemas shared between route handlers (source of truth) and client forms (fast feedback)
- **Inline show/hide forms instead of modals or separate routes**
  - Product and invoice create/edit forms toggle inline in the list page
  - Simpler state, no extra navigation hop for a page-scoped action
- **No refresh token / token rotation**
  - Single JWT in an HTTP-only cookie, fixed expiry, server-side in-memory revocation set for logout
  - Won't survive a server restart or multi-instance deployment — production would need a persisted revocation store (e.g. Redis) or short-lived access tokens with refresh rotation

## Possible future improvements

- Persisted (not in-memory) token revocation store, so logout survives server restarts and works across multiple server instances.
- Soft-delete for products instead of a hard delete guard, to preserve full historical reporting even for products no longer sold.
- Server-driven pagination cursor instead of offset-based `page`/`limit`, for stable pagination under concurrent writes.
- Move from SQLite to a networked database (Postgres) before any real multi-user concurrent deployment.

## AI usage

Planning started in Obsidian, working with AI to draft the ERD, UI flows, tech stack, and API contract before writing a line of code. From there, I turned that plan into `TODO.md`. I told AI to broke down into commits I could test one at a time, so I could check my progress along the way instead of one big shoot.

Once the AI generated code, I reviewed it through GitHub Desktop against coding standards I'd already set going in, which meant reviews stayed fast. I was checking whether the code matched those standards, not figuring out what it was trying to do from scratch. When something was off, I stayed responsible for it and fixed it myself rather than trusting the diff blindly.

## Tech stack

- Next.js 16
- Prisma 7 + better-sqlite3
- Zod 4
- React Hook Form + `@hookform/resolvers/zod`
- TanStack Query
- jose + bcryptjs
- Tailwind CSS 4
- Vitest
- OpenAPI 3.1 + Swagger UI + `openapi-typescript`

## Hours spent

I originally planned to build this on tRPC for its out-of-the-box type safety with Next.js. Partway through, I hit friction testing the API. tRPC's batched, array-shaped requests made it awkward to hit individual endpoints the way the test scenarios needed. I switched to plain Next.js route handlers instead and didn't look back. All in, this took about 8 hours.

## If I had one more week

I'd wire up observability — telemetry and basic monitoring — so issues surface before users report them. I'd also invest in the UI with a proper component kit instead of hand-rolled Tailwind, add end-to-end tests on top of the current integration suite, and tighten the loop between test scenarios and unit tests so they reinforce each other instead of overlapping.