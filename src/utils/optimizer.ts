import { DiscountedItem, OptimizationResult, StorePrices } from '../types'
import { NZ_SUPERMARKET_CATALOGUE } from './constants'

type Supermarket = 'Woolworths' | 'PAKnSAVE' | 'NewWorld'

export function processBasketOptimization(itemsList: string[]): OptimizationResult {
  if (itemsList.length === 0) {
    return {
      storeTotals: { Woolworths: 0, PAKnSAVE: 0, NewWorld: 0 },
      bestSingleStore: '',
      bestSingleTotal: 0,
      optimalSplitTotal: 0,
      savings: 0,
      pricedItemCount: 0,
      unpricedItems: [],
      splitBreakdown: {
        Woolworths: [],
        PAKnSAVE: [],
        NewWorld: [],
      },
    }
  }

  // Calculate totals for each store if buying everything from one store
  const storeTotals: StorePrices = {
    Woolworths: 0,
    PAKnSAVE: 0,
    NewWorld: 0,
  }

  // Track items for split trip optimization
  const splitBreakdown: {
    Woolworths: string[]
    PAKnSAVE: string[]
    NewWorld: string[]
  } = {
    Woolworths: [],
    PAKnSAVE: [],
    NewWorld: [],
  }

  let optimalSplitTotal = 0
  const unpricedItems: string[] = []
  let pricedItemCount = 0
  const stores: Supermarket[] = ['Woolworths', 'PAKnSAVE', 'NewWorld']

  // Process each item
  for (const itemName of itemsList) {
    const product = NZ_SUPERMARKET_CATALOGUE[itemName]
    if (
      !product ||
      !product.prices ||
      product.priceStatus === 'unavailable'
    ) {
      unpricedItems.push(itemName)
      continue
    }
    const prices = product.prices
    if (!stores.every((store) => Number.isFinite(prices[store]) && prices[store] > 0)) {
      unpricedItems.push(itemName)
      continue
    }
    pricedItemCount += 1

    // Add to store totals
    storeTotals.Woolworths += prices.Woolworths
    storeTotals.PAKnSAVE += prices.PAKnSAVE
    storeTotals.NewWorld += prices.NewWorld

    // Find cheapest store for this item
    let cheapestStore: Supermarket = 'Woolworths'
    let lowestPrice = prices.Woolworths

    const otherStores: Supermarket[] = ['PAKnSAVE', 'NewWorld']
    for (const store of otherStores) {
      if (prices[store] < lowestPrice) {
        cheapestStore = store
        lowestPrice = prices[store]
      }
    }

    // Add to split trip breakdown
    splitBreakdown[cheapestStore].push(itemName)
    optimalSplitTotal += lowestPrice
  }

  if (pricedItemCount === 0) {
    return {
      storeTotals,
      bestSingleStore: '',
      bestSingleTotal: 0,
      optimalSplitTotal: 0,
      savings: 0,
      pricedItemCount,
      unpricedItems,
      splitBreakdown,
    }
  }

  // Find best single store
  let bestSingleStore: Supermarket = 'Woolworths'
  let lowestStoreTotal = storeTotals.Woolworths

  const otherStores: Supermarket[] = ['PAKnSAVE', 'NewWorld']
  for (const store of otherStores) {
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
    pricedItemCount,
    unpricedItems,
    splitBreakdown,
  }
}

export function getDiscountedItems(
  items: string[],
  threshold: number = 0.88
): DiscountedItem[] {
  return items
    .map((itemName) => {
      const product = NZ_SUPERMARKET_CATALOGUE[itemName]
      if (
        !product?.prices ||
        product.priceStatus === 'unavailable' ||
        product.historicAvg === null
      ) return null

      let cheapestStore: Supermarket = 'Woolworths'
      let lowestPrice = product.prices.Woolworths

      const otherStores: Supermarket[] = ['PAKnSAVE', 'NewWorld']
      for (const store of otherStores) {
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
    .filter((item): item is DiscountedItem => item !== null)
}

export function formatCurrency(value: number): string {
  return `$${value.toFixed(2)}`
}
