const DEFAULT_TAX_RATE_PERCENT = 11;

export type TMoneyLineItem = {
  unitPrice: number;
  quantity: number;
};

export type TMoneyBreakdown = {
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
};

function assertNonNegativeInteger(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative integer, received ${value}.`);
  }
}

function lineTotal(unitPrice: number, quantity: number): number {
  assertNonNegativeInteger(unitPrice, "unitPrice");
  assertNonNegativeInteger(quantity, "quantity");
  return unitPrice * quantity;
}

function subtotal(items: TMoneyLineItem[]): number {
  return items.reduce((sum, item) => sum + lineTotal(item.unitPrice, item.quantity), 0);
}

function taxAmount(subtotalValue: number, taxRatePercent: number = DEFAULT_TAX_RATE_PERCENT): number {
  assertNonNegativeInteger(subtotalValue, "subtotal");
  assertNonNegativeInteger(taxRatePercent, "taxRatePercent");
  return Math.floor((subtotalValue * taxRatePercent) / 100);
}

function total(subtotalValue: number, taxAmountValue: number): number {
  return subtotalValue + taxAmountValue;
}

function calculate(
  items: TMoneyLineItem[],
  taxRatePercent: number = DEFAULT_TAX_RATE_PERCENT
): TMoneyBreakdown {
  const subtotalValue = subtotal(items);
  const taxAmountValue = taxAmount(subtotalValue, taxRatePercent);
  return {
    subtotal: subtotalValue,
    taxRate: taxRatePercent,
    taxAmount: taxAmountValue,
    total: total(subtotalValue, taxAmountValue),
  };
}

export const MoneyUtils = {
  DEFAULT_TAX_RATE_PERCENT,
  lineTotal,
  subtotal,
  taxAmount,
  total,
  calculate,
};
