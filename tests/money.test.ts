import { describe, expect, it } from 'vitest'
import { MoneyUtils } from '@/utils/money.utils'

describe('money calculations', () => {
  it('calculates subtotal from line items', () => {
    const subtotal = MoneyUtils.calculateSubtotal([
      { unitPrice: 50000, quantity: 2 },
      { unitPrice: 35000, quantity: 1 },
    ])
    expect(subtotal).toBe(135000)
  })

  it('calculates tax at the given rate', () => {
    expect(MoneyUtils.calculateTax(100000, 11)).toBe(11000)
  })

  it('calculates total as subtotal plus tax', () => {
    expect(MoneyUtils.calculateTotal(100000, 11000)).toBe(111000)
  })
})
