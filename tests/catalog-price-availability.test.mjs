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

  catalogue = constants.NZ_SUPERMARKET_CATALOGUE
  registerDynamicProduct = constants.registerDynamicProduct
  processBasketOptimization = optimizer.processBasketOptimization
  getDiscountedItems = optimizer.getDiscountedItems
  getCatalog = supermarketApi.getCatalog
  catalogToLegacyProduct = supermarketApi.catalogToLegacyProduct
})

after(async () => {
  await server?.close()
})

test('loads catalogue products with accurate cross-supermarket prices', () => {
  const products = Object.values(catalogue)
  assert.ok(products.length >= 100, 'Catalogue contains 100+ grocery items')

  const pricedProducts = products.filter(
    (p) =>
      p.prices &&
      typeof p.prices.Woolworths === 'number' &&
      typeof p.prices.PAKnSAVE === 'number' &&
      typeof p.prices.NewWorld === 'number'
  )

  assert.ok(
    pricedProducts.length >= 100,
    `Expected at least 100 products with prices, got ${pricedProducts.length}`
  )
})

test('excludes products without complete prices from optimization and deal detection', () => {
  // Register a temporary unpriced item to verify graceful exclusion
  registerDynamicProduct({
    name: 'Unpriced Test Product',
    category: 'Test',
    emoji: '📦',
    prices: null,
    historicAvg: null,
    priceStatus: 'unavailable',
  })

  const result = processBasketOptimization(['Anchor Blue Milk 2L', 'Unpriced Test Product'])

  assert.equal(result.pricedItemCount, 1)
  assert.deepEqual(result.unpricedItems, ['Unpriced Test Product'])
  assert.equal(result.storeTotals.Woolworths, 4.5)
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
