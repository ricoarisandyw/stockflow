import { describe, it, expect } from "vitest";
import { GET as getProductListHandler, POST as postCreateProductHandler } from "@/app/api/products/route";
import {
  GET as getProductDetailHandler,
  PATCH as patchProductHandler,
  DELETE as deleteProductHandler,
} from "@/app/api/products/[id]/route";
import { ErrorConstant } from "@/constants/error.constant";
import { HttpStatusConstant } from "@/constants/http-status.constant";
import { prismaTestUtils } from "./mocks/prisma.mock";
import { authedUser, authedRequest, jsonRequest, routeParams } from "./test.utils";

const BASE_URL = "http://localhost/api/products";

describe("GET /api/products", () => {
  it("(A6: protected endpoint returns 401 when unauthenticated) rejects a request with no credentials", async () => {
    const res = await getProductListHandler(authedRequest(BASE_URL));
    const json = await res.json();

    expect(res.status).toBe(HttpStatusConstant.getStatusCode(ErrorConstant.AUTH_UNAUTHORIZED.code));
    expect(json.error.code).toBe(ErrorConstant.AUTH_UNAUTHORIZED.code);
  });

  it("(I2: search) filters products by name or sku, scoped to the current user", async () => {
    const { user, token } = await authedUser();
    prismaTestUtils.seedProduct({ userId: user.id, sku: "KB-01", name: "Mechanical Keyboard" });
    prismaTestUtils.seedProduct({ userId: user.id, sku: "MS-01", name: "Wireless Mouse" });

    const res = await getProductListHandler(authedRequest(`${BASE_URL}?search=keyboard`, token));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toHaveLength(1);
    expect(json.data[0].sku).toBe("KB-01");
  });

  it("(I2: pagination) paginates results and returns meta", async () => {
    const { user, token } = await authedUser();
    for (let i = 1; i <= 15; i++) {
      prismaTestUtils.seedProduct({ userId: user.id, sku: `SKU-${i}`, name: `Product ${i}` });
    }

    const res = await getProductListHandler(authedRequest(`${BASE_URL}?page=2&limit=10`, token));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toHaveLength(5);
    expect(json.meta).toEqual({ page: 2, limit: 10, totalItems: 15, totalPages: 2 });
  });

  it("(A7: data isolation) does not return other users' products", async () => {
    const { user, token } = await authedUser();
    const otherUser = prismaTestUtils.seedUser({ email: "other@stockflow.dev", passwordHash: "x" });
    prismaTestUtils.seedProduct({ userId: user.id, sku: "MINE-01", name: "My Product" });
    prismaTestUtils.seedProduct({ userId: otherUser.id, sku: "THEIRS-01", name: "Their Product" });

    const res = await getProductListHandler(authedRequest(BASE_URL, token));
    const json = await res.json();

    expect(json.data).toHaveLength(1);
    expect(json.data[0].sku).toBe("MINE-01");
  });
});

describe("POST /api/products", () => {
  it("(I1: create product) creates a product and returns 201", async () => {
    const { token } = await authedUser();

    const res = await postCreateProductHandler(
      jsonRequest(BASE_URL, {
        sku: "KB-MCH-01",
        name: "Mechanical Keyboard TKL",
        description: "Wireless RGB",
        unitPrice: 850000,
        quantityOnHand: 25,
      }, token)
    );
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data.sku).toBe("KB-MCH-01");

    const stored = prismaTestUtils.getProducts().find((p) => p.id === json.data.id);
    expect(stored).toBeDefined();
    expect(stored).toMatchObject({
      sku: "KB-MCH-01",
      name: "Mechanical Keyboard TKL",
      description: "Wireless RGB",
      unitPrice: 850000,
      quantityOnHand: 25,
    });
  });

  it("(V1: validation) rejects an invalid payload with INVALID_PAYLOAD", async () => {
    const { token } = await authedUser();

    const res = await postCreateProductHandler(
      jsonRequest(BASE_URL, { sku: "", name: "", unitPrice: -1, quantityOnHand: -1 }, token)
    );
    const json = await res.json();

    expect(res.status).toBe(HttpStatusConstant.getStatusCode(ErrorConstant.INVALID_PAYLOAD.code));
    expect(json.error.code).toBe(ErrorConstant.INVALID_PAYLOAD.code);
    expect(json.error.details.length).toBeGreaterThan(0);
  });

  it("(I3: unique SKU per user) rejects a duplicate SKU for the same user with PRODUCT_SKU_EXISTS", async () => {
    const { user, token } = await authedUser();
    prismaTestUtils.seedProduct({ userId: user.id, sku: "KB-01", name: "Existing Keyboard" });

    const res = await postCreateProductHandler(
      jsonRequest(BASE_URL, {
        sku: "KB-01",
        name: "Duplicate",
        unitPrice: 1000,
        quantityOnHand: 1,
      }, token)
    );
    const json = await res.json();

    expect(res.status).toBe(HttpStatusConstant.getStatusCode(ErrorConstant.PRODUCT_SKU_EXISTS.code));
    expect(json.error.code).toBe(ErrorConstant.PRODUCT_SKU_EXISTS.code);
  });

  it("(I3: unique SKU is per-user, not global) allows two different users to use the same SKU", async () => {
    const { user, token } = await authedUser();
    const otherUser = prismaTestUtils.seedUser({ email: "other@stockflow.dev", passwordHash: "x" });
    prismaTestUtils.seedProduct({ userId: otherUser.id, sku: "SHARED-SKU", name: "Their Product" });

    const res = await postCreateProductHandler(
      jsonRequest(BASE_URL, {
        sku: "SHARED-SKU",
        name: "My Product",
        unitPrice: 1000,
        quantityOnHand: 1,
      }, token)
    );

    expect(res.status).toBe(201);
  });
});

describe("GET /api/products/[id]", () => {
  it("(I1: get detail) returns the product detail", async () => {
    const { user, token } = await authedUser();
    const product = prismaTestUtils.seedProduct({ userId: user.id, sku: "KB-01", name: "Keyboard" });

    const res = await getProductDetailHandler(authedRequest(`${BASE_URL}/${product.id}`, token), routeParams({ id: product.id }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.id).toBe(product.id);
  });

  it("returns PRODUCT_NOT_FOUND for a non-existent product", async () => {
    const { token } = await authedUser();

    const res = await getProductDetailHandler(authedRequest(`${BASE_URL}/does-not-exist`, token), routeParams({ id: "does-not-exist" }));
    const json = await res.json();

    expect(res.status).toBe(HttpStatusConstant.getStatusCode(ErrorConstant.PRODUCT_NOT_FOUND.code));
    expect(json.error.code).toBe(ErrorConstant.PRODUCT_NOT_FOUND.code);
  });

  it("(A7: ownership protection) returns PRODUCT_NOT_FOUND for another user's product", async () => {
    const { token } = await authedUser();
    const otherUser = prismaTestUtils.seedUser({ email: "other@stockflow.dev", passwordHash: "x" });
    const product = prismaTestUtils.seedProduct({ userId: otherUser.id, sku: "X-01", name: "Not Mine" });

    const res = await getProductDetailHandler(authedRequest(`${BASE_URL}/${product.id}`, token), routeParams({ id: product.id }));
    const json = await res.json();

    expect(res.status).toBe(HttpStatusConstant.getStatusCode(ErrorConstant.PRODUCT_NOT_FOUND.code));
    expect(json.error.code).toBe(ErrorConstant.PRODUCT_NOT_FOUND.code);
  });
});

describe("PATCH /api/products/[id]", () => {
  it("(I1: update) updates mutable fields and persists them, leaving other fields untouched", async () => {
    const { user, token } = await authedUser();
    const product = prismaTestUtils.seedProduct({ userId: user.id, sku: "KB-01", name: "Keyboard", unitPrice: 1000, quantityOnHand: 5 });

    const res = await patchProductHandler(
      jsonRequest(`${BASE_URL}/${product.id}`, { unitPrice: 2000, quantityOnHand: 10 }, token, "PATCH"),
      routeParams({ id: product.id })
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.unitPrice).toBe(2000);
    expect(json.data.quantityOnHand).toBe(10);

    const stored = prismaTestUtils.getProducts().find((p) => p.id === product.id);
    expect(stored).toMatchObject({
      sku: "KB-01",
      name: "Keyboard",
      unitPrice: 2000,
      quantityOnHand: 10,
    });
  });

  it("(A7: ownership protection) rejects updating another user's product with PRODUCT_NOT_FOUND and leaves it unchanged", async () => {
    const { token } = await authedUser();
    const otherUser = prismaTestUtils.seedUser({ email: "other@stockflow.dev", passwordHash: "x" });
    const product = prismaTestUtils.seedProduct({ userId: otherUser.id, sku: "X-01", name: "Not Mine" });

    const res = await patchProductHandler(
      jsonRequest(`${BASE_URL}/${product.id}`, { name: "Hacked" }, token, "PATCH"),
      routeParams({ id: product.id })
    );
    const json = await res.json();

    expect(res.status).toBe(HttpStatusConstant.getStatusCode(ErrorConstant.PRODUCT_NOT_FOUND.code));
    expect(json.error.code).toBe(ErrorConstant.PRODUCT_NOT_FOUND.code);

    const stored = prismaTestUtils.getProducts().find((p) => p.id === product.id);
    expect(stored?.name).toBe("Not Mine");
  });
});

describe("DELETE /api/products/[id]", () => {
  it("(I4: delete) deletes a product with no invoice references and it is no longer retrievable", async () => {
    const { user, token } = await authedUser();
    const product = prismaTestUtils.seedProduct({ userId: user.id, sku: "KB-01", name: "Keyboard" });

    const res = await deleteProductHandler(authedRequest(`${BASE_URL}/${product.id}`, token, "DELETE"), routeParams({ id: product.id }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);

    expect(prismaTestUtils.getProducts().find((p) => p.id === product.id)).toBeUndefined();

    const getRes = await getProductDetailHandler(
      authedRequest(`${BASE_URL}/${product.id}`, token),
      routeParams({ id: product.id })
    );
    expect(getRes.status).toBe(HttpStatusConstant.getStatusCode(ErrorConstant.PRODUCT_NOT_FOUND.code));
  });

  it("(I4: delete guard) rejects deleting a product referenced by an invoice with PRODUCT_HAS_INVOICE_ITEMS and keeps it intact", async () => {
    const { user, token } = await authedUser();
    const product = prismaTestUtils.seedProduct({ userId: user.id, sku: "KB-01", name: "Keyboard" });
    prismaTestUtils.seedInvoiceItem({ invoiceId: "inv_1", productId: product.id });

    const res = await deleteProductHandler(authedRequest(`${BASE_URL}/${product.id}`, token, "DELETE"), routeParams({ id: product.id }));
    const json = await res.json();

    expect(res.status).toBe(
      HttpStatusConstant.getStatusCode(ErrorConstant.PRODUCT_HAS_INVOICE_ITEMS.code)
    );
    expect(json.error.code).toBe(ErrorConstant.PRODUCT_HAS_INVOICE_ITEMS.code);

    expect(prismaTestUtils.getProducts().find((p) => p.id === product.id)).toBeDefined();
  });

  it("(A7: ownership protection) rejects deleting another user's product with PRODUCT_NOT_FOUND and keeps it intact", async () => {
    const { token } = await authedUser();
    const otherUser = prismaTestUtils.seedUser({ email: "other@stockflow.dev", passwordHash: "x" });
    const product = prismaTestUtils.seedProduct({ userId: otherUser.id, sku: "X-01", name: "Not Mine" });

    const res = await deleteProductHandler(authedRequest(`${BASE_URL}/${product.id}`, token, "DELETE"), routeParams({ id: product.id }));
    const json = await res.json();

    expect(res.status).toBe(HttpStatusConstant.getStatusCode(ErrorConstant.PRODUCT_NOT_FOUND.code));
    expect(json.error.code).toBe(ErrorConstant.PRODUCT_NOT_FOUND.code);

    expect(prismaTestUtils.getProducts().find((p) => p.id === product.id)).toBeDefined();
  });
});
