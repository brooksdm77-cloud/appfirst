/**
 * NZ Supermarket Product & Price Scraper
 *
 * This script fetches real product data from the Foodstuffs (PAK'nSAVE & New World)
 * public guest APIs and the Woolworths NZ web API. No login or API key is required
 * for the guest endpoints — they are the same endpoints the supermarket websites
 * call when you browse without being signed in.
 *
 * Usage:
 *   npx tsx scripts/scrape-prices.ts
 *
 * Output:
 *   Writes updated data to mock-data/products.json
 *
 * ⚠️  These are undocumented guest endpoints. They may change without notice.
 *     Use responsibly — add delays between requests and respect rate limits.
 */

import * as fs from 'fs'
import * as path from 'path'

// ── Types ──────────────────────────────────────────────────────────────────────

interface ScrapedProduct {
  name: string
  category: string
  emoji: string
  barcode: string
  prices: {
    Woolworths: number | null
    PAKnSAVE: number | null
    NewWorld: number | null
  }
  historicAvg: number
  lastUpdated: string
}

// ── Configuration ──────────────────────────────────────────────────────────────

// Foodstuffs stores (PAK'nSAVE & New World) use a guest GraphQL/REST API.
// Each physical store has a unique ID. Pick a store near the user.
const PAKNSAVE_STORE_ID = '689f040e-8759-4bb2-8b3b-8ea6e1367ea6' // PAK'nSAVE Kilbirnie (Wellington)
const NEWWORLD_STORE_ID = 'a80da73a-0f32-4149-901d-b4b1a401cf2a' // New World Thorndon (Wellington)

// Woolworths NZ uses a REST API via their website backend.
const WOOLWORTHS_STORE_ID = '3120' // Woolworths Newtown (Wellington)

// Common search terms to fetch a broad product range
const SEARCH_TERMS = [
  'milk', 'bread', 'butter', 'cheese', 'eggs', 'chicken', 'beef', 'lamb',
  'banana', 'apple', 'potato', 'broccoli', 'onion', 'tomato', 'carrot',
  'rice', 'pasta', 'flour', 'sugar', 'coffee', 'tea', 'cereal',
  'chips', 'chocolate', 'biscuit', 'juice', 'water', 'cola',
  'soap', 'shampoo', 'toothpaste', 'toilet paper', 'dishwash',
  'nappies', 'baby food', 'ice cream', 'frozen peas', 'fish fingers',
  'sausage', 'bacon', 'salmon', 'yoghurt', 'cream'
]

// Category → emoji mapping
const CATEGORY_EMOJI: Record<string, string> = {
  'dairy': '🥛', 'milk': '🥛', 'cheese': '🧀', 'eggs': '🥚', 'butter': '🧈',
  'yoghurt': '🥛', 'cream': '🥛',
  'bakery': '🍞', 'bread': '🍞',
  'fruit': '🍎', 'vegetable': '🥦', 'produce': '🥬',
  'meat': '🥩', 'poultry': '🍗', 'seafood': '🐟',
  'pantry': '🥫', 'cereal': '🥣', 'coffee': '☕', 'tea': '🍵',
  'snack': '🍪', 'chocolate': '🍫', 'chip': '🥔', 'confectionery': '🍬',
  'drink': '🥤', 'juice': '🧃', 'water': '💧', 'beer': '🍺',
  'frozen': '🧊', 'ice cream': '🍦',
  'household': '🧹', 'cleaning': '🧼', 'laundry': '🧺',
  'health': '💊', 'beauty': '🧴', 'baby': '👶',
}

// ── Foodstuffs API (PAK'nSAVE & New World) ─────────────────────────────────

/**
 * Fetches products from the Foodstuffs guest API.
 * This is the same API the PAK'nSAVE and New World websites use
 * when you search for products without logging in.
 */
async function fetchFoodstuffsProducts(
  brand: 'paknsave' | 'newworld',
  storeId: string,
  searchTerm: string
): Promise<Array<{ name: string; price: number; barcode: string; category: string }>> {
  const baseUrl = brand === 'paknsave'
    ? 'https://www.paknsave.co.nz'
    : 'https://www.newworld.co.nz'

  const url = `${baseUrl}/next/api/products/search?q=${encodeURIComponent(searchTerm)}&s=popularity&pg=1&storeId=${storeId}&size=48`

  try {
    const resp = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'SmartGrocer-NZ/1.0 (price-comparison-app)',
        'x-requested-with': 'OnlineShopping',
      },
    })

    if (!resp.ok) {
      console.warn(`  ⚠️  ${brand} search "${searchTerm}" returned ${resp.status}`)
      return []
    }

    const data = await resp.json() as any

    // The response structure typically contains data.products[] or products[]
    const products = data?.products || data?.data?.products || []

    return products.map((p: any) => ({
      name: p.name || p.description || 'Unknown',
      price: p.price?.salePrice ?? p.price?.originalPrice ?? p.salePrice ?? 0,
      barcode: p.sku || p.barcode || p.productId || '',
      category: p.category?.name || p.department || searchTerm,
    }))
  } catch (err) {
    console.warn(`  ⚠️  ${brand} fetch failed for "${searchTerm}":`, (err as Error).message)
    return []
  }
}

// ── Woolworths NZ API ──────────────────────────────────────────────────────────

/**
 * Fetches products from the Woolworths NZ API.
 * This calls the same endpoint their website uses for search.
 */
async function fetchWoolworthsProducts(
  searchTerm: string,
  storeId: string
): Promise<Array<{ name: string; price: number; barcode: string; category: string }>> {
  const url = `https://www.woolworths.co.nz/api/v1/products?target=search&search=${encodeURIComponent(searchTerm)}&inStockProductsOnly=true&size=48`

  try {
    const resp = await fetch(url, {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'SmartGrocer-NZ/1.0 (price-comparison-app)',
        'x-requested-with': 'OnlineShopping',
        'cookie': `fulfilment=PICKUP;storeId=${storeId}`,
      },
    })

    if (!resp.ok) {
      console.warn(`  ⚠️  Woolworths search "${searchTerm}" returned ${resp.status}`)
      return []
    }

    const data = await resp.json() as any

    const items = data?.products?.items || data?.items || []

    return items.map((p: any) => ({
      name: p.name || p.description || 'Unknown',
      price: p.price?.salePrice ?? p.price?.originalPrice ?? p.salePrice ?? 0,
      barcode: p.sku || p.barcode || '',
      category: p.category || searchTerm,
    }))
  } catch (err) {
    console.warn(`  ⚠️  Woolworths fetch failed for "${searchTerm}":`, (err as Error).message)
    return []
  }
}

// ── Utility ────────────────────────────────────────────────────────────────────

function getEmoji(category: string): string {
  const lower = category.toLowerCase()
  for (const [key, emoji] of Object.entries(CATEGORY_EMOJI)) {
    if (lower.includes(key)) return emoji
  }
  return '📦'
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ── Main Scraper ───────────────────────────────────────────────────────────────

async function main() {
  console.log('🛒 SmartGrocer NZ — Supermarket Price Scraper')
  console.log('============================================\n')

  // Merged product map: keyed by a normalised product name
  const productMap = new Map<string, ScrapedProduct>()

  // --- 1. Fetch from PAK'nSAVE ---
  console.log("🟡 Fetching from PAK'nSAVE...")
  for (const term of SEARCH_TERMS) {
    console.log(`  Searching: "${term}"`)
    const products = await fetchFoodstuffsProducts('paknsave', PAKNSAVE_STORE_ID, term)

    for (const p of products) {
      const key = p.name.toLowerCase().trim()
      if (!productMap.has(key)) {
        productMap.set(key, {
          name: p.name,
          category: p.category,
          emoji: getEmoji(p.category),
          barcode: p.barcode,
          prices: { Woolworths: null, PAKnSAVE: p.price, NewWorld: null },
          historicAvg: p.price, // use current price as baseline
          lastUpdated: new Date().toISOString(),
        })
      } else {
        productMap.get(key)!.prices.PAKnSAVE = p.price
      }
    }

    await delay(500) // be polite — 500ms between requests
  }

  // --- 2. Fetch from New World ---
  console.log("\n🔴 Fetching from New World...")
  for (const term of SEARCH_TERMS) {
    console.log(`  Searching: "${term}"`)
    const products = await fetchFoodstuffsProducts('newworld', NEWWORLD_STORE_ID, term)

    for (const p of products) {
      const key = p.name.toLowerCase().trim()
      if (!productMap.has(key)) {
        productMap.set(key, {
          name: p.name,
          category: p.category,
          emoji: getEmoji(p.category),
          barcode: p.barcode,
          prices: { Woolworths: null, PAKnSAVE: null, NewWorld: p.price },
          historicAvg: p.price,
          lastUpdated: new Date().toISOString(),
        })
      } else {
        productMap.get(key)!.prices.NewWorld = p.price
      }
    }

    await delay(500)
  }

  // --- 3. Fetch from Woolworths NZ ---
  console.log("\n🟢 Fetching from Woolworths NZ...")
  for (const term of SEARCH_TERMS) {
    console.log(`  Searching: "${term}"`)
    const products = await fetchWoolworthsProducts(term, WOOLWORTHS_STORE_ID)

    for (const p of products) {
      const key = p.name.toLowerCase().trim()
      if (!productMap.has(key)) {
        productMap.set(key, {
          name: p.name,
          category: p.category,
          emoji: getEmoji(p.category),
          barcode: p.barcode,
          prices: { Woolworths: p.price, PAKnSAVE: null, NewWorld: null },
          historicAvg: p.price,
          lastUpdated: new Date().toISOString(),
        })
      } else {
        productMap.get(key)!.prices.Woolworths = p.price
      }
    }

    await delay(500)
  }

  // --- 4. Calculate historic averages ---
  for (const [, product] of productMap) {
    const prices = [
      product.prices.Woolworths,
      product.prices.PAKnSAVE,
      product.prices.NewWorld,
    ].filter((p): p is number => p !== null && p > 0)

    if (prices.length > 0) {
      product.historicAvg = parseFloat(
        (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2)
      )
    }
  }

  // --- 5. Write to file ---
  const allProducts = Array.from(productMap.values())
    .filter(p => {
      // Only keep products that have at least 1 valid price
      const hasPrice = (p.prices.Woolworths ?? 0) > 0 ||
                       (p.prices.PAKnSAVE ?? 0) > 0 ||
                       (p.prices.NewWorld ?? 0) > 0
      return hasPrice
    })
    .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))

  const outputPath = path.resolve(__dirname, '../mock-data/products.json')
  fs.writeFileSync(outputPath, JSON.stringify(allProducts, null, 2), 'utf-8')

  console.log(`\n✅ Done! Scraped ${allProducts.length} products.`)
  console.log(`📁 Saved to: ${outputPath}`)

  // Print summary
  const withAll3 = allProducts.filter(p =>
    p.prices.Woolworths && p.prices.PAKnSAVE && p.prices.NewWorld
  ).length
  const with2 = allProducts.filter(p => {
    const count = [p.prices.Woolworths, p.prices.PAKnSAVE, p.prices.NewWorld]
      .filter(x => x !== null && x > 0).length
    return count === 2
  }).length
  const with1 = allProducts.filter(p => {
    const count = [p.prices.Woolworths, p.prices.PAKnSAVE, p.prices.NewWorld]
      .filter(x => x !== null && x > 0).length
    return count === 1
  }).length

  console.log(`\n📊 Price coverage:`)
  console.log(`   ${withAll3} products with prices from all 3 stores`)
  console.log(`   ${with2} products with prices from 2 stores`)
  console.log(`   ${with1} products with price from 1 store only`)
}

main().catch(console.error)

