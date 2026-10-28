// Product pictures.
//
// If a product has a real photo (`image_url` from the database, or `image` from the
// catalog) that is used. Otherwise we draw a clean tile with the product's own name,
// so a product is never shown with someone else's photo.

const TINTS = {
  Electronics: ['#e0ecff', '#2447a8'],
  Phones: ['#e3f4ee', '#13715a'],
  Laptops: ['#e8e6fa', '#4a3fa8'],
  Fashion: ['#fde7ee', '#a3294f'],
  Beauty: ['#fff0dc', '#9a5a0b'],
  'Home & Living': ['#eaf3dc', '#456b17'],
  Home: ['#eaf3dc', '#456b17'],
  Accessories: ['#f1ebe0', '#6b5428'],
}

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function wrap(text, max = 15, maxLines = 4) {
  const words = String(text).split(/\s+/)
  const lines = []
  let cur = ''
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > max && cur) {
      lines.push(cur)
      cur = w
    } else {
      cur = (cur + ' ' + w).trim()
    }
  }
  if (cur) lines.push(cur)
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines)
    kept[maxLines - 1] = kept[maxLines - 1].replace(/[ ,.]+$/, '') + '…'
    return kept
  }
  return lines
}

export function tileFor(product) {
  const [bg, ink] = TINTS[product.category] || ['#eceff3', '#334155']
  const lines = wrap(product.name)
  const size = lines.length > 3 ? 50 : 58
  const lineH = size * 1.2
  const top = 400 - ((lines.length - 1) * lineH) / 2 + size * 0.3
  const text = lines
    .map((l, i) => `<text x="400" y="${top + i * lineH}" text-anchor="middle" font-size="${size}" font-weight="800" fill="${ink}">${esc(l)}</text>`)
    .join('')
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" font-family="Inter,Segoe UI,Arial,sans-serif">` +
    `<rect width="800" height="800" fill="${bg}"/>` +
    `<circle cx="700" cy="110" r="190" fill="${ink}" opacity="0.07"/>` +
    `<circle cx="90" cy="740" r="230" fill="${ink}" opacity="0.07"/>` +
    `<text x="56" y="84" font-size="26" font-weight="700" letter-spacing="4" fill="${ink}" opacity="0.7">${esc(String(product.category || '').toUpperCase())}</text>` +
    text +
    `</svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

export function productImage(product) {
  return product.image_url || product.image || tileFor(product)
}
