import { describe, it, expect } from 'vitest'
import { MAX_QTY_PER_ITEM, MAX_LINE_ITEMS } from '../services/limits'

describe('cart limits', () => {
  it('match the order service (10 per item, 20 different products)', () => {
    expect(MAX_QTY_PER_ITEM).toBe(10)
    expect(MAX_LINE_ITEMS).toBe(20)
  })
})