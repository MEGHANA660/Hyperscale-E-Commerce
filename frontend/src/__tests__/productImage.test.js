import { describe, it, expect } from 'vitest'
import { productImage, onImgError, iconNameFor, tileFor } from '../services/productImage'

describe('productImage', () => {
  it('prefers the database image_url', () => {
    expect(productImage({ id: 5, image_url: 'http://x/a.jpg', image: 'b.jpg' })).toBe('http://x/a.jpg')
  })
  it('falls back to the catalog image, then to /products/<id>.jpg', () => {
    expect(productImage({ id: 5, image: 'b.jpg' })).toBe('b.jpg')
    expect(productImage({ id: 5 })).toBe('/products/5.jpg')
  })
})

describe('icon fallback', () => {
  it('picks an icon from the product name', () => {
    expect(iconNameFor({ name: 'Wireless Earbuds', category: 'Electronics' })).toBe('Headphones')
  })
  it('uses the category icon when no name rule matches', () => {
    expect(iconNameFor({ name: 'Zzzz', category: 'Phones' })).toBe('Smartphone')
  })
  it('uses a generic icon for unknown products', () => {
    expect(iconNameFor({ name: 'Zzzz', category: 'Unknown' })).toBe('Package')
  })
  it('builds an SVG data URL that escapes the product name', () => {
    const url = tileFor({ id: 1, name: '<b>Tee</b>', category: 'Fashion' })
    expect(url.startsWith('data:image/svg+xml')).toBe(true)
    expect(decodeURIComponent(url)).not.toContain('<b>')
  })
  it('swaps a broken photo for the tile, only once', () => {
    const product = { id: 9, name: 'Running Shoes', category: 'Fashion' }
    const img = { src: '/products/9.jpg' }
    const handler = onImgError(product)
    handler({ currentTarget: img })
    expect(img.src).toBe(tileFor(product))
    const before = img.src
    handler({ currentTarget: img })
    expect(img.src).toBe(before)
  })
})