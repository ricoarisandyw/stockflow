import { describe, it, expect } from "vitest";
import { GET as getInvoiceListHandler, POST as postCreateInvoiceHandler } from "@/app/api/invoices/route";
import { GET as getInvoiceDetailHandler, PATCH as patchInvoiceHandler } from "@/app/api/invoices/[id]/route";
import { POST as postIssueHandler } from "@/app/api/invoices/[id]/issue/route";
import { POST as postPayHandler } from "@/app/api/invoices/[id]/pay/route";
import { POST as postCancelHandler } from "@/app/api/invoices/[id]/cancel/route";
import { ErrorConstant } from "@/constants/error.constant";
import { HttpStatusConstant } from "@/constants/http-status.constant";
import { prismaTestUtils } from "./mocks/prisma.mock";
import { authedUser, authedRequest, jsonRequest, routeParams } from "./test.utils";

const BASE_URL = "http://localhost/api/invoices";

describe("GET /api/invoices", () => {
  it("(A6: protected endpoint returns 401 when unauthenticated) rejects a request with no credentials", async () => {
    const res = await getInvoiceListHandler(authedRequest(BASE_URL));
    const json = await res.json();

    expect(res.status).toBe(HttpStatusConstant.getStatusCode(ErrorConstant.AUTH_UNAUTHORIZED.code));
    expect(json.error.code).toBe(ErrorConstant.AUTH_UNAUTHORIZED.code);
 });

  it("(V10: filter by status) returns only invoices matching the status filter", async () => {
    const { user, token } = await authedUser();
    prismaTestUtils.seedInvoice({ userId: user.id, invoiceNumber: "INV-A", customerName: "A", status: "DRAFT" });
    prismaTestUtils.seedInvoice({ userId: user.id, invoiceNumber: "INV-B", customerName: "B", status: "PAID" });

    const res = await getInvoiceListHandler(authedRequest(`${BASE_URL}?status=PAID`, token));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toHaveLength(1);
    expect(json.data[0].invoiceNumber).toBe("INV-B");
 });

  it("(V10: pagination) paginates results and returns meta", async () => {
    const { user, token } = await authedUser();
    for (let i = 1; i <= 15; i++) {
      prismaTestUtils.seedInvoice({ userId: user.id, invoiceNumber: `INV-${i}`, customerName: `Customer ${i}` });
    }

    const res = await getInvoiceListHandler(authedRequest(`${BASE_URL}?page=2&limit=10`, token));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toHaveLength(5);
    expect(json.meta).toEqual({ page: 2, limit: 10, totalItems: 15, totalPages: 2 });
 });

  it("(V10: search) filters by customer name or invoice number", async () => {
    const { user, token } = await authedUser();
    prismaTestUtils.seedInvoice({ userId: user.id, invoiceNumber: "INV-A", customerName: "PT Teknologi Maju" });
    prismaTestUtils.seedInvoice({ userId: user.id, invoiceNumber: "INV-B", customerName: "CV Sejahtera" });

    const res = await getInvoiceListHandler(authedRequest(`${BASE_URL}?search=teknologi`, token));
    const json = await res.json();

    expect(json.data).toHaveLength(1);
    expect(json.data[0].customerName).toBe("PT Teknologi Maju");
 });

  it("(A7: data isolation) does not return other users' invoices", async () => {
    const { user, token } = await authedUser();
    const otherUser = prismaTestUtils.seedUser({ email: "other@stockflow.dev", passwordHash: "x" });
    prismaTestUtils.seedInvoice({ userId: user.id, invoiceNumber: "INV-MINE", customerName: "Mine" });
    prismaTestUtils.seedInvoice({ userId: otherUser.id, invoiceNumber: "INV-THEIRS", customerName: "Theirs" });

    const res = await getInvoiceListHandler(authedRequest(BASE_URL, token));
    const json = await res.json();

    expect(json.data).toHaveLength(1);
    expect(json.data[0].invoiceNumber).toBe("INV-MINE");
 });

  it("(V10: list includes itemCount) reports the number of line items per invoice", async () => {
    const { user, token } = await authedUser();
    const product = prismaTestUtils.seedProduct({ userId: user.id });
    const invoice = prismaTestUtils.seedInvoice({ userId: user.id, invoiceNumber: "INV-A", customerName: "A" });
    prismaTestUtils.seedInvoiceItem({ invoiceId: invoice.id, productId: product.id, quantity: 1 });
    prismaTestUtils.seedInvoiceItem({ invoiceId: invoice.id, productId: product.id, quantity: 2 });

    const res = await getInvoiceListHandler(authedRequest(BASE_URL, token));
    const json = await res.json();

    expect(json.data[0].itemCount).toBe(2);
 });
});

describe("POST /api/invoices", () => {
  it("(V1, V2, V3, V4: create invoice) creates a DRAFT invoice with server-computed totals and snapshotted line items", async () => {
    const { user, token } = await authedUser();
    const product = prismaTestUtils.seedProduct({ userId: user.id, name: "Mechanical Keyboard", unitPrice: 850000, quantityOnHand: 10 });

    const res = await postCreateInvoiceHandler(
      jsonRequest(BASE_URL, {
        customerName: "PT Teknologi Maju",
        dueDate: "2026-09-16T10:00:00.000Z",
        items: [{ productId: product.id, quantity: 2 }],
      }, token)
    );
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.data.status).toBe("DRAFT");
    expect(json.data.subtotal).toBe(1700000);
    expect(json.data.taxAmount).toBe(187000);
    expect(json.data.total).toBe(1887000);
    expect(json.data.items).toHaveLength(1);
    expect(json.data.items[0]).toMatchObject({
      productId: product.id,
      productName: "Mechanical Keyboard",
      unitPrice: 850000,
      quantity: 2,
      lineTotal: 1700000,
   });
    expect(json.data.invoiceNumber).toMatch(/^INV-\d{8}-\d{4}$/);
 });

  it("(V1: creating does not touch stock) leaves quantityOnHand untouched until the invoice is issued", async () => {
    const { user, token } = await authedUser();
    const product = prismaTestUtils.seedProduct({ userId: user.id, quantityOnHand: 10 });

    await postCreateInvoiceHandler(
      jsonRequest(BASE_URL, {
        customerName: "PT Teknologi Maju",
        dueDate: "2026-09-16T10:00:00.000Z",
        items: [{ productId: product.id, quantity: 3 }],
      }, token)
    );

    const stored = prismaTestUtils.getProducts().find((p) => p.id === product.id);
    expect(stored?.quantityOnHand).toBe(10);
 });

  it("(V4: snapshot immutability) does not change existing invoice items when the product price changes later", async () => {
    const { user, token } = await authedUser();
    const product = prismaTestUtils.seedProduct({ userId: user.id, unitPrice: 100000, quantityOnHand: 10 });

    const createRes = await postCreateInvoiceHandler(
      jsonRequest(BASE_URL, {
        customerName: "A",
        dueDate: "2026-09-16T10:00:00.000Z",
        items: [{ productId: product.id, quantity: 1 }],
      }, token)
    );
    const created = await createRes.json();

    const stored = prismaTestUtils.getProducts().find((p) => p.id === product.id)!;
    stored.unitPrice = 999999;

    const detailRes = await getInvoiceDetailHandler(
      authedRequest(`${BASE_URL}/${created.data.id}`, token),
      routeParams({ id: created.data.id })
    );
    const detail = await detailRes.json();

    expect(detail.data.items[0].unitPrice).toBe(100000);
 });

  it("(V5: stock guard) rejects creating an invoice line that exceeds available stock with 422", async () => {
    const { user, token } = await authedUser();
    const product = prismaTestUtils.seedProduct({ userId: user.id, quantityOnHand: 5 });

    const res = await postCreateInvoiceHandler(
      jsonRequest(BASE_URL, {
        customerName: "A",
        dueDate: "2026-09-16T10:00:00.000Z",
        items: [{ productId: product.id, quantity: 6 }],
      }, token)
    );
    const json = await res.json();

    expect(res.status).toBe(
      HttpStatusConstant.getStatusCode(ErrorConstant.INVOICE_INSUFFICIENT_STOCK.code)
    );
    expect(json.error.code).toBe(ErrorConstant.INVOICE_INSUFFICIENT_STOCK.code);

    const invoices = prismaTestUtils.getInvoices();
    expect(invoices).toHaveLength(0);
 });

  it("(V1: references existing products) rejects an item referencing a non-existent or foreign product", async () => {
    const { token } = await authedUser();

    const res = await postCreateInvoiceHandler(
      jsonRequest(BASE_URL, {
        customerName: "A",
        dueDate: "2026-09-16T10:00:00.000Z",
        items: [{ productId: "does-not-exist", quantity: 1 }],
      }, token)
    );
    const json = await res.json();

    expect(res.status).toBe(
      HttpStatusConstant.getStatusCode(ErrorConstant.INVOICE_PRODUCT_NOT_FOUND.code)
    );
    expect(json.error.code).toBe(ErrorConstant.INVOICE_PRODUCT_NOT_FOUND.code);
 });

  it("(V1: validation) rejects a payload with no line items", async () => {
    const { token } = await authedUser();

    const res = await postCreateInvoiceHandler(
      jsonRequest(BASE_URL, {
        customerName: "A",
        dueDate: "2026-09-16T10:00:00.000Z",
        items: [],
      }, token)
    );
    const json = await res.json();

    expect(res.status).toBe(HttpStatusConstant.getStatusCode(ErrorConstant.INVALID_PAYLOAD.code));
    expect(json.error.code).toBe(ErrorConstant.INVALID_PAYLOAD.code);
 });
});

describe("GET /api/invoices/[id]", () => {
  it("(A7: ownership protection) returns INVOICE_NOT_FOUND for another user's invoice", async () => {
    const { token } = await authedUser();
    const otherUser = prismaTestUtils.seedUser({ email: "other@stockflow.dev", passwordHash: "x" });
    const invoice = prismaTestUtils.seedInvoice({ userId: otherUser.id, invoiceNumber: "INV-X", customerName: "X" });

    const res = await getInvoiceDetailHandler(
      authedRequest(`${BASE_URL}/${invoice.id}`, token),
      routeParams({ id: invoice.id })
    );
    const json = await res.json();

    expect(res.status).toBe(HttpStatusConstant.getStatusCode(ErrorConstant.INVOICE_NOT_FOUND.code));
    expect(json.error.code).toBe(ErrorConstant.INVOICE_NOT_FOUND.code);
 });
});

describe("PATCH /api/invoices/[id]", () => {
  it("(V9: edit draft only) allows editing a DRAFT invoice and recalculates totals", async () => {
    const { user, token } = await authedUser();
    const product = prismaTestUtils.seedProduct({ userId: user.id, unitPrice: 100000, quantityOnHand: 10 });
    const invoice = prismaTestUtils.seedInvoice({ userId: user.id, invoiceNumber: "INV-A", customerName: "A", status: "DRAFT" });
    prismaTestUtils.seedInvoiceItem({ invoiceId: invoice.id, productId: product.id, quantity: 1, unitPrice: 100000, lineTotal: 100000, productName: product.name });

    const res = await patchInvoiceHandler(
      jsonRequest(`${BASE_URL}/${invoice.id}`, {
        items: [{ productId: product.id, quantity: 3 }],
      }, token, "PATCH"),
      routeParams({ id: invoice.id })
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.items).toHaveLength(1);
    expect(json.data.items[0].quantity).toBe(3);
    expect(json.data.subtotal).toBe(300000);
 });

  it("(V9: edit draft only) rejects editing a non-DRAFT invoice with INVOICE_NOT_DRAFT", async () => {
    const { user, token } = await authedUser();
    const invoice = prismaTestUtils.seedInvoice({ userId: user.id, invoiceNumber: "INV-A", customerName: "A", status: "ISSUED" });

    const res = await patchInvoiceHandler(
      jsonRequest(`${BASE_URL}/${invoice.id}`, { customerName: "Changed" }, token, "PATCH"),
      routeParams({ id: invoice.id })
    );
    const json = await res.json();

    expect(res.status).toBe(HttpStatusConstant.getStatusCode(ErrorConstant.INVOICE_NOT_DRAFT.code));
    expect(json.error.code).toBe(ErrorConstant.INVOICE_NOT_DRAFT.code);

    const stored = prismaTestUtils.getInvoices().find((inv) => inv.id === invoice.id);
    expect(stored?.customerName).toBe("A");
 });

  it("(V5: stock guard on edit) rejects updating items beyond available stock", async () => {
    const { user, token } = await authedUser();
    const product = prismaTestUtils.seedProduct({ userId: user.id, quantityOnHand: 5 });
    const invoice = prismaTestUtils.seedInvoice({ userId: user.id, invoiceNumber: "INV-A", customerName: "A", status: "DRAFT" });

    const res = await patchInvoiceHandler(
      jsonRequest(`${BASE_URL}/${invoice.id}`, {
        items: [{ productId: product.id, quantity: 99 }],
      }, token, "PATCH"),
      routeParams({ id: invoice.id })
    );
    const json = await res.json();

    expect(res.status).toBe(
      HttpStatusConstant.getStatusCode(ErrorConstant.INVOICE_INSUFFICIENT_STOCK.code)
    );
    expect(json.error.code).toBe(ErrorConstant.INVOICE_INSUFFICIENT_STOCK.code);
 });
});

describe("POST /api/invoices/[id]/issue", () => {
  it("(V6: atomic issue) transitions DRAFT to ISSUED and decrements stock atomically", async () => {
    const { user, token } = await authedUser();
    const product = prismaTestUtils.seedProduct({ userId: user.id, quantityOnHand: 10 });
    const invoice = prismaTestUtils.seedInvoice({ userId: user.id, invoiceNumber: "INV-A", customerName: "A", status: "DRAFT" });
    prismaTestUtils.seedInvoiceItem({ invoiceId: invoice.id, productId: product.id, quantity: 4 });

    const res = await postIssueHandler(authedRequest(`${BASE_URL}/${invoice.id}/issue`, token, "POST"), routeParams({ id: invoice.id }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.status).toBe("ISSUED");

    const stored = prismaTestUtils.getProducts().find((p) => p.id === product.id);
    expect(stored?.quantityOnHand).toBe(6);
 });

  it("(V6: insufficient stock at issue time) rejects issuing when current stock can no longer cover the invoice, and does not decrement", async () => {
    const { user, token } = await authedUser();
    const product = prismaTestUtils.seedProduct({ userId: user.id, quantityOnHand: 10 });
    const invoice = prismaTestUtils.seedInvoice({ userId: user.id, invoiceNumber: "INV-A", customerName: "A", status: "DRAFT" });
    prismaTestUtils.seedInvoiceItem({ invoiceId: invoice.id, productId: product.id, quantity: 4 });

    const stored = prismaTestUtils.getProducts().find((p) => p.id === product.id)!;
    stored.quantityOnHand = 2;

    const res = await postIssueHandler(authedRequest(`${BASE_URL}/${invoice.id}/issue`, token, "POST"), routeParams({ id: invoice.id }));
    const json = await res.json();

    expect(res.status).toBe(
      HttpStatusConstant.getStatusCode(ErrorConstant.INVOICE_INSUFFICIENT_STOCK.code)
    );
    expect(json.error.code).toBe(ErrorConstant.INVOICE_INSUFFICIENT_STOCK.code);
    expect(stored.quantityOnHand).toBe(2);

    const invoiceAfter = prismaTestUtils.getInvoices().find((inv) => inv.id === invoice.id);
    expect(invoiceAfter?.status).toBe("DRAFT");
 });

  it("(V8: status transitions) rejects issuing an already-ISSUED invoice", async () => {
    const { user, token } = await authedUser();
    const invoice = prismaTestUtils.seedInvoice({ userId: user.id, invoiceNumber: "INV-A", customerName: "A", status: "ISSUED" });

    const res = await postIssueHandler(authedRequest(`${BASE_URL}/${invoice.id}/issue`, token, "POST"), routeParams({ id: invoice.id }));
    const json = await res.json();

    expect(res.status).toBe(
      HttpStatusConstant.getStatusCode(ErrorConstant.INVOICE_INVALID_TRANSITION.code)
    );
    expect(json.error.code).toBe(ErrorConstant.INVOICE_INVALID_TRANSITION.code);
 });

  it("(A7: ownership protection) rejects issuing another user's invoice", async () => {
    const { token } = await authedUser();
    const otherUser = prismaTestUtils.seedUser({ email: "other@stockflow.dev", passwordHash: "x" });
    const invoice = prismaTestUtils.seedInvoice({ userId: otherUser.id, invoiceNumber: "INV-X", customerName: "X", status: "DRAFT" });

    const res = await postIssueHandler(authedRequest(`${BASE_URL}/${invoice.id}/issue`, token, "POST"), routeParams({ id: invoice.id }));
    const json = await res.json();

    expect(res.status).toBe(HttpStatusConstant.getStatusCode(ErrorConstant.INVOICE_NOT_FOUND.code));
    expect(json.error.code).toBe(ErrorConstant.INVOICE_NOT_FOUND.code);
 });
});

describe("POST /api/invoices/[id]/pay", () => {
  it("(V8: mark as paid) transitions ISSUED to PAID", async () => {
    const { user, token } = await authedUser();
    const invoice = prismaTestUtils.seedInvoice({ userId: user.id, invoiceNumber: "INV-A", customerName: "A", status: "ISSUED" });

    const res = await postPayHandler(authedRequest(`${BASE_URL}/${invoice.id}/pay`, token, "POST"), routeParams({ id: invoice.id }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.status).toBe("PAID");
 });

  it("(V8: immutable guard) rejects marking a DRAFT invoice as paid", async () => {
    const { user, token } = await authedUser();
    const invoice = prismaTestUtils.seedInvoice({ userId: user.id, invoiceNumber: "INV-A", customerName: "A", status: "DRAFT" });

    const res = await postPayHandler(authedRequest(`${BASE_URL}/${invoice.id}/pay`, token, "POST"), routeParams({ id: invoice.id }));
    const json = await res.json();

    expect(res.status).toBe(
      HttpStatusConstant.getStatusCode(ErrorConstant.INVOICE_INVALID_TRANSITION.code)
    );
    expect(json.error.code).toBe(ErrorConstant.INVOICE_INVALID_TRANSITION.code);
 });

  it("(V8: terminal status immutable) rejects marking an already-PAID invoice as paid again", async () => {
    const { user, token } = await authedUser();
    const invoice = prismaTestUtils.seedInvoice({ userId: user.id, invoiceNumber: "INV-A", customerName: "A", status: "PAID" });

    const res = await postPayHandler(authedRequest(`${BASE_URL}/${invoice.id}/pay`, token, "POST"), routeParams({ id: invoice.id }));
    const json = await res.json();

    expect(res.status).toBe(
      HttpStatusConstant.getStatusCode(ErrorConstant.INVOICE_INVALID_TRANSITION.code)
    );
 });

  it("(V8: terminal status immutable) rejects marking a CANCELLED invoice as paid", async () => {
    const { user, token } = await authedUser();
    const invoice = prismaTestUtils.seedInvoice({ userId: user.id, invoiceNumber: "INV-A", customerName: "A", status: "CANCELLED" });

    const res = await postPayHandler(authedRequest(`${BASE_URL}/${invoice.id}/pay`, token, "POST"), routeParams({ id: invoice.id }));

    expect(res.status).toBe(
      HttpStatusConstant.getStatusCode(ErrorConstant.INVOICE_INVALID_TRANSITION.code)
    );
 });
});

describe("POST /api/invoices/[id]/cancel", () => {
  it("(V7: cancel ISSUED restores stock) restores product stock and marks CANCELLED with restoredStock true", async () => {
    const { user, token } = await authedUser();
    const product = prismaTestUtils.seedProduct({ userId: user.id, quantityOnHand: 6 });
    const invoice = prismaTestUtils.seedInvoice({ userId: user.id, invoiceNumber: "INV-A", customerName: "A", status: "ISSUED" });
    prismaTestUtils.seedInvoiceItem({ invoiceId: invoice.id, productId: product.id, quantity: 4 });

    const res = await postCancelHandler(authedRequest(`${BASE_URL}/${invoice.id}/cancel`, token, "POST"), routeParams({ id: invoice.id }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.status).toBe("CANCELLED");
    expect(json.data.restoredStock).toBe(true);

    const stored = prismaTestUtils.getProducts().find((p) => p.id === product.id);
    expect(stored?.quantityOnHand).toBe(10);
 });

  it("(V7: cancel DRAFT restores nothing) marks CANCELLED with restoredStock false and leaves stock untouched", async () => {
    const { user, token } = await authedUser();
    const product = prismaTestUtils.seedProduct({ userId: user.id, quantityOnHand: 10 });
    const invoice = prismaTestUtils.seedInvoice({ userId: user.id, invoiceNumber: "INV-A", customerName: "A", status: "DRAFT" });
    prismaTestUtils.seedInvoiceItem({ invoiceId: invoice.id, productId: product.id, quantity: 4 });

    const res = await postCancelHandler(authedRequest(`${BASE_URL}/${invoice.id}/cancel`, token, "POST"), routeParams({ id: invoice.id }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.restoredStock).toBe(false);

    const stored = prismaTestUtils.getProducts().find((p) => p.id === product.id);
    expect(stored?.quantityOnHand).toBe(10);
 });

  it("(V8: terminal status immutable) rejects cancelling an already-PAID invoice", async () => {
    const { user, token } = await authedUser();
    const invoice = prismaTestUtils.seedInvoice({ userId: user.id, invoiceNumber: "INV-A", customerName: "A", status: "PAID" });

    const res = await postCancelHandler(authedRequest(`${BASE_URL}/${invoice.id}/cancel`, token, "POST"), routeParams({ id: invoice.id }));
    const json = await res.json();

    expect(res.status).toBe(
      HttpStatusConstant.getStatusCode(ErrorConstant.INVOICE_INVALID_TRANSITION.code)
    );
    expect(json.error.code).toBe(ErrorConstant.INVOICE_INVALID_TRANSITION.code);
 });

  it("(V8: terminal status immutable) rejects cancelling an already-CANCELLED invoice", async () => {
    const { user, token } = await authedUser();
    const invoice = prismaTestUtils.seedInvoice({ userId: user.id, invoiceNumber: "INV-A", customerName: "A", status: "CANCELLED" });

    const res = await postCancelHandler(authedRequest(`${BASE_URL}/${invoice.id}/cancel`, token, "POST"), routeParams({ id: invoice.id }));

    expect(res.status).toBe(
      HttpStatusConstant.getStatusCode(ErrorConstant.INVOICE_INVALID_TRANSITION.code)
    );
 });

  it("(A7: ownership protection) rejects cancelling another user's invoice", async () => {
    const { token } = await authedUser();
    const otherUser = prismaTestUtils.seedUser({ email: "other@stockflow.dev", passwordHash: "x" });
    const invoice = prismaTestUtils.seedInvoice({ userId: otherUser.id, invoiceNumber: "INV-X", customerName: "X", status: "ISSUED" });

    const res = await postCancelHandler(authedRequest(`${BASE_URL}/${invoice.id}/cancel`, token, "POST"), routeParams({ id: invoice.id }));
    const json = await res.json();

    expect(res.status).toBe(HttpStatusConstant.getStatusCode(ErrorConstant.INVOICE_NOT_FOUND.code));
    expect(json.error.code).toBe(ErrorConstant.INVOICE_NOT_FOUND.code);
 });
});
