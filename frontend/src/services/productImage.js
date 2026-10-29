// Product pictures.
//
// If a product has a real photo (`image_url` from the database, or `image` from the
// catalog) that is used. Otherwise we draw a tile showing a picture of what the product
// is (earbuds, phone, T-shirt, shoe...) plus its name, so a product is never shown with
// someone else's photo and the picture always loads, even offline.

import { ICONS } from '../data/productIcons'

// [background, ink] colour pairs per category; a product picks one by its id so
// neighbouring products of the same kind do not all look identical.
const TINTS = {
  Electronics: [['#e0ecff', '#2447a8'], ['#dff3f6', '#0f6577'], ['#e6e4fb', '#4338ca']],
  Phones: [['#e3f4ee', '#13715a'], ['#e1f1fb', '#1d6a96'], ['#eaf4dc', '#3f6b12']],
  Laptops: [['#e8e6fa', '#4a3fa8'], ['#e3ecf8', '#2b4f8c'], ['#efe6f6', '#7a3aa0']],
  Fashion: [['#fde7ee', '#a3294f'], ['#fdeee2', '#b4531a'], ['#f3e6fb', '#8a3bb0']],
  Beauty: [['#fff0dc', '#9a5a0b'], ['#fde6ef', '#a8325f'], ['#f5ecff', '#7c3fb0']],
  'Home & Living': [['#eaf3dc', '#456b17'], ['#e0f3ee', '#17685a'], ['#f6efdc', '#8a6a12']],
  Accessories: [['#f1ebe0', '#6b5428'], ['#e8eef6', '#35557f'], ['#f6e9e6', '#9a4a36']],
}

// First matching rule wins, so more specific words come first.
export const ICON_RULES = [
  // bags & sleeves first (their names contain 'laptop')
  [/backpack|duffle/i, 'Backpack'], [/laptop sleeve/i, 'Laptop'],
  // electronics
  [/desk lamp/i, 'LampDesk'], [/power bank/i, 'BatteryCharging'], [/charger/i, 'Zap'], [/cable/i, 'Cable'],
  [/soundbar|speaker/i, 'Speaker'], [/earphone|earbud|headphone/i, 'Headphones'],
  [/smartwatch|fitness band/i, 'Watch'], [/mouse/i, 'Mouse'], [/keyboard/i, 'Keyboard'],
  [/webcam/i, 'Webcam'], [/pen drive/i, 'Usb'], [/ssd/i, 'HardDrive'], [/microsd|memory card/i, 'MemoryStick'],
  [/\bring light/i, 'Aperture'], [/led bulb|bulb/i, 'Lightbulb'],
  [/smart wi-fi plug|wi-fi plug/i, 'Plug'], [/action camera/i, 'Camera'], [/\btv\b/i, 'Tv'], [/router/i, 'Router'],
  // phones & laptops
  [/chromebook|laptop/i, 'Laptop'],
  [/keypad|feature phone/i, 'Phone'], [/phone|smartphone|\b[45]g\b/i, 'Smartphone'],
  // fashion
  [/jeans|trouser|pants|palazzo|leggings|dungaree|briefs/i, 'Pants'],
  [/saree|dress|anarkali|midi/i, 'Dress'], [/dupatta|scarf/i, 'Scarf'],
  [/shoe|sneaker|sandal|flip-flop|slip-on/i, 'Footprints'],
  [/t-shirt|shirt|polo|kurta|kurti|crop top|sweatshirt|jacket|sports bra|\btop\b/i, 'Shirt'],
  // beauty
  [/lipstick|lip balm/i, 'Lipstick'], [/kajal|compact powder|foundation|nail polish/i, 'Paintbrush'],
  [/sunscreen/i, 'Sun'], [/face wash/i, 'Droplets'], [/serum|hair oil/i, 'Droplet'],
  [/shampoo|conditioner/i, 'Bottle'], [/cream|gel|mask/i, 'FlaskConical'],
  [/hair dryer/i, 'Wind'], [/straightener/i, 'Flame'], [/trimmer|shaver/i, 'Scissors'],
  [/parfum|mist/i, 'SprayCan'],
  // home
  [/bedsheet|comforter/i, 'BedDouble'], [/pillow(?! covers)/i, 'Pillow'], [/curtain/i, 'Blinds'],
  [/towel/i, 'Bath'], [/door mat/i, 'DoorOpen'], [/cookware|pressure cooker/i, 'CookingPot'],
  [/bottle/i, 'Bottle'], [/storage containers|lunch box/i, 'Container'], [/dinner set/i, 'Utensils'],
  [/mixer/i, 'Blend'], [/kettle/i, 'Coffee'], [/induction/i, 'Flame'], [/air fryer/i, 'Microwave'],
  [/sandwich/i, 'Sandwich'], [/clock/i, 'Clock'], [/photo frame/i, 'Frame'], [/candle/i, 'Candle'],
  [/cushion/i, 'Armchair'], [/string lights/i, 'Sparkles'], [/planter/i, 'Sprout'],
  [/storage boxes/i, 'Archive'], [/laundry/i, 'ShoppingBasket'], [/mop/i, 'Brush'],
  [/table fan|fan\b/i, 'Fan'], [/study table/i, 'Table'],
  // accessories
  [/yoga mat/i, 'PersonStanding'], [/resistance band/i, 'Dumbbell'],
  [/sling/i, 'Handbag'], [/tote/i, 'ShoppingBag'], [/handbag/i, 'Handbag'],
  [/wallet|card holder/i, 'Wallet'], [/analog watch|watch/i, 'Watch'], [/sunglasses|glasses/i, 'Glasses'],
  [/\bcap\b/i, 'Cap'], [/belt/i, 'Belt'], [/phone case|screen guard/i, 'Smartphone'],
  [/pouch/i, 'Briefcase'], [/umbrella/i, 'Umbrella'],
  [/necklace|earring|bracelet|jewellery/i, 'Gem'], [/hair accessories/i, 'Sparkles'],
]

const CATEGORY_ICON = {
  Electronics: 'Zap', Phones: 'Smartphone', Laptops: 'Laptop', Fashion: 'Shirt', Beauty: 'Sparkles',
  'Home & Living': 'Armchair', Home: 'Armchair', Accessories: 'ShoppingBag',
}

export function iconNameFor(product) {
  const hit = ICON_RULES.find(([re]) => re.test(product.name))
  return hit ? hit[1] : CATEGORY_ICON[product.category] || 'Package'
}

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function wrap(text, max = 22, maxLines = 3) {
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
  const set = TINTS[product.category] || TINTS.Accessories
  const [bg, ink] = set[(Number(product.id) || 0) % set.length]
  const icon = ICONS[iconNameFor(product)] || ICONS.Package
  const lines = wrap(product.name)
  const text = lines
    .map((l, i) => `<text x="400" y="${600 + i * 48}" text-anchor="middle" font-size="42" font-weight="700" fill="${ink}">${esc(l)}</text>`)
    .join('')
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" font-family="Inter,Segoe UI,Arial,sans-serif">` +
    `<rect width="800" height="800" fill="${bg}"/>` +
    `<circle cx="400" cy="330" r="215" fill="#ffffff" opacity="0.65"/>` +
    `<g transform="translate(256 186) scale(12)" fill="none" stroke="${ink}" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round">${icon}</g>` +
    text +
    `</svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

export function productImage(product) {
  return product.image_url || product.image || tileFor(product)
}
