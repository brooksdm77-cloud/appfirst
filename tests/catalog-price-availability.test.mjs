import test, { after, before } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'vite'

let server
let catalogue
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
  processBasketOptimization = optimizer.processBasketOptimization
  getDiscountedItems = optimizer.getDiscountedItems
  getCatalog = supermarketApi.getCatalog
  catalogToLegacyProduct = supermarketApi.catalogToLegacyProduct
})

after(async () => {
  await server?.close()
})

test('registers 100 additional products without unverified prices', () => {
  const products = Object.values(catalogue)
  const unavailableProducts = products.filter((product) => product.priceStatus === 'unavailable')

  assert.equal(products.length, 118)
  assert.equal(unavailableProducts.length, 100)
  assert.ok(unavailableProducts.every(
    (product) => product.prices === null && product.historicAvg === null
  ))
})

test('excludes products without complete prices from optimization and deal detection', () => {
  const result = processBasketOptimization(['Anchor Blue Milk 2L', 'Anchor Lite Milk 2L'])

  assert.equal(result.pricedItemCount, 1)
  assert.deepEqual(result.unpricedItems, ['Anchor Lite Milk 2L'])
  assert.equal(result.storeTotals.Woolworths, 4.5)
  assert.deepEqual(getDiscountedItems(['Anchor Lite Milk 2L']), [])
})

test('does not recommend a store when every basket item is unpriced', () => {
  const result = processBasketOptimization(['Anchor Lite Milk 2L'])

  assert.equal(result.bestSingleStore, '')
  assert.equal(result.pricedItemCount, 0)
  assert.equal(result.bestSingleTotal, 0)
})

test('static API fallback does not expose bundled mock prices as current prices', async () => {
  const products = await getCatalog()

  assert.ok(products.length >= 100)
  assert.ok(products.every(
    (product) =>
      product.priceStatus === 'unavailable' &&
      product.prices === null &&
      product.historicAvg === null
  ))

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
