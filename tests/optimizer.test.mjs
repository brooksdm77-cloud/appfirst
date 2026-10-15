import test from 'node:test'
import assert from 'node:assert/strict'

// Import constants and functions
const NZ_SUPERMARKET_CATALOGUE = {
  "Whittaker's Creamy Milk Chocolate 250g": {
    name: "Whittaker's Creamy Milk Chocolate 250g",
    prices: { Woolworths: 6.80, PAKnSAVE: 5.99, NewWorld: 6.50 },
    historicAvg: 6.70,
  },
  "Anchor Blue Milk 2L": {
    name: "Anchor Blue Milk 2L",
    prices: { Woolworths: 4.50, PAKnSAVE: 3.98, NewWorld: 4.25 },
    historicAvg: 4.45,
  },
  "Tip Top Bakery Bread 700g": {
    name: "Tip Top Bakery Bread 700g",
    prices: { Woolworths: 3.10, PAKnSAVE: 2.89, NewWorld: 3.40 },
    historicAvg: 3.35,
  },
  "Mainland Tasty Cheese 700g": {
    name: "Mainland Tasty Cheese 700g",
    prices: { Woolworths: 13.90, PAKnSAVE: 11.95, NewWorld: 12.99 },
    historicAvg: 13.50,
  },
  "Nescafe Instant Coffee 200g": {
    name: "Nescafe Instant Coffee 200g",
    prices: { Woolworths: 7.50, PAKnSAVE: 10.50, NewWorld: 9.99 },
    historicAvg: 10.20,
  },
  "Watties Baked Beans 420g": {
    name: "Watties Baked Beans 420g",
    prices: { Woolworths: 2.60, PAKnSAVE: 1.95, NewWorld: 2.20 },
    historicAvg: 2.50,
  },
}

function processBasketOptimization(itemsList) {
  if (itemsList.length === 0) {
    return {
      storeTotals: { Woolworths: 0, PAKnSAVE: 0, NewWorld: 0 },
      bestSingleStore: '',
      bestSingleTotal: 0,
      optimalSplitTotal: 0,
      savings: 0,
      splitBreakdown: { Woolworths: [], PAKnSAVE: [], NewWorld: [] },
    }
  }

  const storeTotals = { Woolworths: 0, PAKnSAVE: 0, NewWorld: 0 }
  const splitBreakdown = { Woolworths: [], PAKnSAVE: [], NewWorld: [] }
  let optimalSplitTotal = 0

  for (const itemName of itemsList) {
    const product = NZ_SUPERMARKET_CATALOGUE[itemName]
    if (!product) continue

    storeTotals.Woolworths += product.prices.Woolworths
    storeTotals.PAKnSAVE += product.prices.PAKnSAVE
    storeTotals.NewWorld += product.prices.NewWorld

    let cheapestStore = 'Woolworths'
    let lowestPrice = product.prices.Woolworths

    for (const store of ['PAKnSAVE', 'NewWorld']) {
      if (product.prices[store] < lowestPrice) {
        cheapestStore = store
        lowestPrice = product.prices[store]
      }
    }

    splitBreakdown[cheapestStore].push(itemName)
    optimalSplitTotal += lowestPrice
  }

  let bestSingleStore = 'Woolworths'
  let lowestStoreTotal = storeTotals.Woolworths

  for (const store of ['PAKnSAVE', 'NewWorld']) {
    if (storeTotals[store] < lowestStoreTotal) {
      bestSingleStore = store
      lowestStoreTotal = storeTotals[store]
    }
  }

  const bestSingleTotal = storeTotals[bestSingleStore]
  const savings = bestSingleTotal - optimalSplitTotal

  return {
    storeTotals,
    bestSingleStore,
    bestSingleTotal,
    optimalSplitTotal,
    savings,
    splitBreakdown,
  }
}

function getDiscountedItems(items, threshold = 0.88) {
  return items
    .map((itemName) => {
      const product = NZ_SUPERMARKET_CATALOGUE[itemName]
      if (!product) return null

      let cheapestStore = 'Woolworths'
      let lowestPrice = product.prices.Woolworths

      for (const store of ['PAKnSAVE', 'NewWorld']) {
        if (product.prices[store] < lowestPrice) {
          cheapestStore = store
          lowestPrice = product.prices[store]
        }
      }

      if (lowestPrice <= product.historicAvg * threshold) {
        return {
          name: itemName,
          discount: parseFloat(((1 - lowestPrice / product.historicAvg) * 100).toFixed(1)),
          savings: parseFloat((product.historicAvg - lowestPrice).toFixed(2)),
          store: cheapestStore,
          currentPrice: lowestPrice,
          historicAvg: product.historicAvg,
        }
      }
      return null
    })
    .filter((item) => item !== null)
}

test('processBasketOptimization returns zeros on empty list', () => {
  const res = processBasketOptimization([])
  assert.equal(res.bestSingleTotal, 0)
  assert.equal(res.optimalSplitTotal, 0)
  assert.equal(res.savings, 0)
  assert.equal(res.splitBreakdown.Woolworths.length, 0)
})

test('processBasketOptimization calculates multi-store savings correctly', () => {
  // Nescafe is cheapest at Woolworths ($7.50), Milk is cheapest at PAK'nSAVE ($3.98)
  const items = ['Nescafe Instant Coffee 200g', 'Anchor Blue Milk 2L']
  const res = processBasketOptimization(items)

  // Woolworths: 7.50 + 4.50 = 12.00
  // PAKnSAVE: 10.50 + 3.98 = 14.48
  // NewWorld: 9.99 + 4.25 = 14.24
  assert.equal(res.bestSingleStore, 'Woolworths')
  assert.equal(res.bestSingleTotal, 12.00)

  // Optimal split: Nescafe at Woolworths (7.50) + Milk at PAKnSAVE (3.98) = 11.48
  assert.equal(Math.round(res.optimalSplitTotal * 100) / 100, 11.48)
  assert.equal(Math.round(res.savings * 100) / 100, 0.52)
  assert.deepEqual(res.splitBreakdown.Woolworths, ['Nescafe Instant Coffee 200g'])
  assert.deepEqual(res.splitBreakdown.PAKnSAVE, ['Anchor Blue Milk 2L'])
})

test('getDiscountedItems detects deals surpassing 12% discount threshold', () => {
  // Nescafe is $7.50 at Woolworths vs historic 10.20 (26.5% discount)
  // Milk is $3.98 at PAKnSAVE vs historic 4.45 (10.6% discount - should NOT trigger)
  const deals = getDiscountedItems(['Nescafe Instant Coffee 200g', 'Anchor Blue Milk 2L'])
  assert.equal(deals.length, 1)
  assert.equal(deals[0].name, 'Nescafe Instant Coffee 200g')
  assert.equal(deals[0].store, 'Woolworths')
  assert.equal(deals[0].currentPrice, 7.50)
  assert.equal(deals[0].savings, 2.70)
  assert.equal(deals[0].discount, 26.5)
})

