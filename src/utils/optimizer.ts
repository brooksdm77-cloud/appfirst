import { OptimizationResult, StorePrices } from '../types'
import { NZ_SUPERMARKET_CATALOGUE, STORE_NAMES } from './constants'

export function processBasketOptimization(itemsList: string[]): OptimizationResult {
  if (itemsList.length === 0) {
    return {
      storeTotals: { Woolworths: 0, PAKnSAVE: 0, NewWorld: 0 },
      bestSingleStore: '',
      bestSingleTotal: 0,
      optimalSplitTotal: 0,
      savings: 0,
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
  const splitBreakdown: Record<string, string[]> = {
    Woolworths: [],
    PAKnSAVE: [],
    NewWorld: [],
  }

  let optimalSplitTotal = 0

  // Process each item
  for (const itemName of itemsList) {
    const product = NZ_SUPERMARKET_CATALOGUE[itemName]
    if (!product) continue

    // Add to store totals
    storeTotals.Woolworths += product.prices.Woolworths
    storeTotals.PAKnSAVE += product.prices.PAKnSAVE
    storeTotals.NewWorld += product.prices.NewWorld

    // Find cheapest store for this item
    const cheapestStore = (
      Object.entries(product.prices) as Array<[string, number]>
    ).reduce(
      (min, [store, price]) => (price < min.price ? { store, price } : min),
      { store: 'Woolworths', price: product.prices.Woolworths }
    ).store

    // Add to split trip breakdown
    splitBreakdown[cheapestStore].push(itemName)
    optimalSplitTotal += product.prices[cheapestStore as keyof typeof product.prices]
  }

  // Find best single store
  const bestSingleStore = (
    Object.entries(storeTotals) as Array<[string, number]>
  ).reduce(
    (min, [store, total]) => (total < min.total ? { store, total } : min),
    { store: 'Woolworths', total: storeTotals.Woolworths }
  ).store

  const bestSingleTotal = storeTotals[bestSingleStore as keyof StorePrices]
  const savings = bestSingleTotal - optimalSplitTotal

  return {
    storeTotals,
    bestSingleStore,
    bestSingleTotal,
    optimalSplitTotal,
    savings,
    splitBreakdown: splitBreakdown as Record<string, string[]>,
  }
}

export function getDiscountedItems(
  items: string[],
  threshold: number = 0.88
): Array<{ name: string; discount: number; savings: number }> {
  return items
    .map((itemName) => {
      const product = NZ_SUPERMARKET_CATALOGUE[itemName]
      if (!product) return null

      const cheapestCurrent = Math.min(
        product.prices.Woolworths,
        product.prices.PAKnSAVE,
        product.prices.NewWorld
      )

      if (cheapestCurrent <= product.historicAvg * threshold) {
        return {
          name: itemName,
          discount: ((1 - cheapestCurrent / product.historicAvg) * 100).toFixed(1),
          savings: parseFloat((product.historicAvg - cheapestCurrent).toFixed(2)),
        }
      }
      return null
    })
    .filter((item) => item !== null) as Array<{ name: string; discount: string; savings: number }>
}

export function formatCurrency(value: number): string {
  return `$${value.toFixed(2)}`
}
