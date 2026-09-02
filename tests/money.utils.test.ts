import { describe, it, expect } from "vitest";
import { MoneyUtils } from "@/utils/money.utils";

describe("MoneyUtils.lineTotal", () => {
  it("(V2: line total) multiplies unit price by quantity", () => {
    expect(MoneyUtils.lineTotal(850000, 2)).toBe(1700000);
  });

  it("(V2: server calculates totals) returns 0 when quantity is 0", () => {
    expect(MoneyUtils.lineTotal(850000, 0)).toBe(0);
  });

  it("(V2: never trust totals sent by the client) rejects a negative unit price", () => {
    expect(() => MoneyUtils.lineTotal(-1, 1)).toThrow(RangeError);
  });

  it("(V5: stock guard integers only) rejects a negative quantity", () => {
    expect(() => MoneyUtils.lineTotal(1000, -1)).toThrow(RangeError);
  });

  it("(V2: integer minor units, no floating point currency) rejects a non-integer unit price", () => {
    expect(() => MoneyUtils.lineTotal(1000.5, 1)).toThrow(RangeError);
  });
});

describe("MoneyUtils.subtotal", () => {
  it("(V2: subtotal) sums line totals across multiple items", () => {
    const subtotal = MoneyUtils.subtotal([
      { unitPrice: 850000, quantity: 2 },
      { unitPrice: 150000, quantity: 3 },
    ]);
    expect(subtotal).toBe(850000 * 2 + 150000 * 3);
  });

  it("(V1: invoice may have zero remaining items after validation) returns 0 for an empty item list", () => {
    expect(MoneyUtils.subtotal([])).toBe(0);
  });
});

describe("MoneyUtils.taxAmount", () => {
  it("(V3: tax calculation) floors the tax amount at the default 11% rate", () => {
    expect(MoneyUtils.taxAmount(1700000)).toBe(187000);
  });

  it("(V3: no floating-point drift) floors fractional cents instead of rounding", () => {
    expect(MoneyUtils.taxAmount(101)).toBe(11);
  });

  it("(V3: tax rate configurable) supports a custom tax rate", () => {
    expect(MoneyUtils.taxAmount(1000000, 10)).toBe(100000);
  });

  it("(V3: tax rate configurable) returns 0 tax for a 0 subtotal", () => {
    expect(MoneyUtils.taxAmount(0)).toBe(0);
  });
});

describe("MoneyUtils.total", () => {
  it("(V2: total) adds subtotal and tax amount", () => {
    expect(MoneyUtils.total(1700000, 187000)).toBe(1887000);
  });
});

describe("MoneyUtils.calculate", () => {
  it("(V2, V3: full breakdown) computes subtotal, taxRate, taxAmount, and total from line items", () => {
    const breakdown = MoneyUtils.calculate([
      { unitPrice: 850000, quantity: 2 },
    ]);

    expect(breakdown).toEqual({
      subtotal: 1700000,
      taxRate: 11,
      taxAmount: 187000,
      total: 1887000,
    });
  });

  it("(V1: matches API contract example) reproduces the documented api-contract.md calculation exactly", () => {
    const breakdown = MoneyUtils.calculate([{ unitPrice: 850000, quantity: 2 }]);

    expect(breakdown.subtotal).toBe(1700000);
    expect(breakdown.taxAmount).toBe(187000);
    expect(breakdown.total).toBe(1887000);
  });

  it("(V2: integer minor units, no floating point currency) produces only integer values", () => {
    const breakdown = MoneyUtils.calculate([
      { unitPrice: 33333, quantity: 3 },
      { unitPrice: 7, quantity: 1 },
    ]);

    expect(Number.isInteger(breakdown.subtotal)).toBe(true);
    expect(Number.isInteger(breakdown.taxAmount)).toBe(true);
    expect(Number.isInteger(breakdown.total)).toBe(true);
  });

  it("(V3: tax rate configurable) respects a custom tax rate end-to-end", () => {
    const breakdown = MoneyUtils.calculate([{ unitPrice: 1000000, quantity: 1 }], 0);

    expect(breakdown).toEqual({
      subtotal: 1000000,
      taxRate: 0,
      taxAmount: 0,
      total: 1000000,
    });
  });
});
