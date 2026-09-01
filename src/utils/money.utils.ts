function calculateSubtotal(items: { unitPrice: number; quantity: number }[]): number {
  return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
}

function calculateTax(subtotal: number, taxRate: number): number {
  return Math.round((subtotal * taxRate) / 100)
}

function calculateTotal(subtotal: number, taxAmount: number): number {
  return subtotal + taxAmount
}

export const MoneyUtils = {
  calculateSubtotal,
  calculateTax,
  calculateTotal,
}
