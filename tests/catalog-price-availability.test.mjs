import test, { after, before } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'vite'

let server
let catalogue
let registerDynamicProduct
let processBasketOptimization
let getDiscountedItems
let getCatalog
let catalogToLegacyProduct
let searchSupermarkets
let searchProducts
let prepareRetailerCheckout
let formatCheckoutList

before(async () => {
  server = await createServer({
    configFile: false,
    root: process.cwd(),
    logLevel: 'silent',
    server: { middlewareMode: true },
  })

  const constants = await server.ssrLoadModule('/src/utils/constants.ts')
  const optimizer = await server.ssrLoadModule('/src/utils/optimizer.ts')
  const supermarketApi = await server.ssrLoadModule('/src/services/supermarketApi.ts')
  const supermarketSearch = await server.ssrLoadModule('/src/server/supermarketSearchLogic.ts')
  const searchService = await server.ssrLoadModule('/src/services/supermarketSearch.ts')
  const checkoutService = await server.ssrLoadModule('/src/services/retailerCheckout.ts')

  catalogue = constants.NZ_SUPERMARKET_CATALOGUE
  registerDynamicProduct = constants.registerDynamicProduct
  processBasketOptimization = optimizer.processBasketOptimization
  getDiscountedItems = optimizer.getDiscountedItems
  getCatalog = supermarketApi.getCatalog
  catalogToLegacyProduct = supermarketApi.catalogToLegacyProduct
  searchSupermarkets = supermarketSearch.searchSupermarkets
  searchProducts = searchService.searchProducts
  prepareRetailerCheckout = checkoutService.prepareRetailerCheckout
  formatCheckoutList = checkoutService.formatCheckoutList
})

after(async () => {
  await server?.close()
})

test('marks bundled catalogue prices as sample data', () => {
  const products = Object.values(catalogue)
  assert.ok(products.length >= 100, 'Catalogue contains 100+ grocery items')

  assert.ok(products.every((product) => product.priceStatus === 'sample'))
})

test('excludes sample and unavailable products from optimization and deal detection', () => {
  registerDynamicProduct({
    name: 'Verified Test Product',
    category: 'Test',
    emoji: '📦',
    prices: { Woolworths: 2, PAKnSAVE: 3, NewWorld: 4 },
    historicAvg: 3,
    priceStatus: 'verified',
  })

  // Register a temporary unpriced item to verify graceful exclusion
  registerDynamicProduct({
    name: 'Unpriced Test Product',
    category: 'Test',
    emoji: '📦',
    prices: null,
    historicAvg: null,
    priceStatus: 'unavailable',
  })

  const result = processBasketOptimization([
    'Verified Test Product',
    'Anchor Blue Milk 2L',
    'Unpriced Test Product',
  ])

  assert.equal(result.pricedItemCount, 1)
  assert.deepEqual(result.unpricedItems, ['Anchor Blue Milk 2L', 'Unpriced Test Product'])
  assert.equal(result.storeTotals.Woolworths, 2)
  assert.deepEqual(getDiscountedItems(['Anchor Blue Milk 2L']), [])
  assert.deepEqual(getDiscountedItems(['Unpriced Test Product']), [])
})

test('does not recommend a store when every basket item is unpriced', () => {
  const result = processBasketOptimization(['Unpriced Test Product'])

  assert.equal(result.bestSingleStore, '')
  assert.equal(result.pricedItemCount, 0)
  assert.equal(result.bestSingleTotal, 0)
})

test('catalogue service returns products with valid pricing and legacy converter works', async () => {
  const products = await getCatalog()

  assert.ok(products.length >= 100)
  assert.ok(products.every((product) => product.priceStatus === 'sample'))
  assert.ok(
    products.some(
      (p) =>
        p.prices &&
        p.prices.Woolworths !== null &&
        p.prices.PAKnSAVE !== null &&
        p.prices.NewWorld !== null
    )
  )

  const converted = catalogToLegacyProduct({
    name: 'Unpriced product',
    category: 'Pantry',
    emoji: '📦',
    prices: { Woolworths: null, PAKnSAVE: null, NewWorld: null },
    historicAvg: null,
  })
  assert.equal(converted.prices, null)
  assert.equal(converted.priceStatus, 'unavailable')
})

test('supermarket search returns only prices actually observed at each store', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async (input) => {
    const url = String(input)
    if (url.includes('woolworths.co.nz')) {
      return Response.json({
        products: {
          items: [{
            name: 'Test Milk 2L',
            sku: 'test-123',
            price: { salePrice: 4.2, originalPrice: 5 },
          }],
        },
      })
    }

    return Response.json({
      data: {
        cheapest: {
          item: {
            name: 'Test Milk 2L',
            gtin: 'test-123',
            chainLabel: "PAK'nSAVE",
          },
          price: { priceCents: 375, observedAt: '2026-11-11T00:00:00.000Z' },
          location: { name: 'Test PAK’nSAVE' },
        },
      },
    })
  }

  try {
    const results = await searchSupermarkets('test milk')
    assert.equal(results.length, 2)
    assert.equal(results[0].priceObservations[0].store, 'Woolworths')
    assert.equal(results[0].priceObservations[0].price, 4.2)
    assert.equal(results[0].priceObservations[0].source, 'Woolworths NZ (retrieved)')
    assert.ok(results[0].priceObservations[0].observedAt)
    assert.deepEqual(results[1].priceObservations, [{
      store: 'PAKnSAVE',
      price: 3.75,
      observedAt: '2026-11-11T00:00:00.000Z',
      location: 'Test PAK’nSAVE',
      source: 'Baskt NZ (latest observed)',
    }])
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('product search never invents prices when no source returns a match', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => Response.json({ results: [] })

  try {
    assert.deepEqual(await searchProducts('no matching product xyz'), [])
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('checkout providers expose a safe manual handoff until direct integrations are approved', async () => {
  const items = [{ productName: 'Anchor Blue Milk 2L', quantity: 1, barcode: '942101' }]
  const expectedUrls = {
    Woolworths: 'https://www.woolworths.co.nz/shop/',
    PAKnSAVE: 'https://www.paknsave.co.nz/shop/',
    NewWorld: 'https://www.newworld.co.nz/shop/',
  }

  for (const [retailer, checkoutUrl] of Object.entries(expectedUrls)) {
    assert.deepEqual(await prepareRetailerCheckout(retailer, items), {
      retailer,
      checkoutUrl,
      mode: 'manual',
      affiliateTracking: 'inactive',
    })
  }

  assert.equal(formatCheckoutList(items), '1 × Anchor Blue Milk 2L')
  await assert.rejects(
    prepareRetailerCheckout('Woolworths', []),
    /at least one item/i,
  )
  await assert.rejects(
    prepareRetailerCheckout('Woolworths', [{ productName: 'Milk', quantity: 0 }]),
    /invalid item or quantity/i,
  )
})
