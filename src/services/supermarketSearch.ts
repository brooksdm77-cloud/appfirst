import { Product } from '../types'
import { NZ_SUPERMARKET_CATALOGUE, registerDynamicProduct } from '../utils/constants'

export interface SearchProductOption extends Product {
  source?: string
  isLive?: boolean
}

/**
 * Searches for any product entered into the app.
 * 1. Checks the local catalogue for exact and partial product-name matches.
 * 2. Queries /api/search for retailer-specific price observations.
 * 3. Never estimates missing store prices.
 */
export async function searchProducts(query: string): Promise<SearchProductOption[]> {
  const cleanQuery = query.trim().toLowerCase()
  if (!cleanQuery) return []

  const results: SearchProductOption[] = []
  // 1. Instant local search from catalogue
  for (const [name, product] of Object.entries(NZ_SUPERMARKET_CATALOGUE)) {
    if (name.toLowerCase().includes(cleanQuery) || product.category?.toLowerCase().includes(cleanQuery)) {
      results.push({
        ...product,
        source: 'Catalogue',
        isLive: false,
      })
    }
  }

  // 2. Query live scraper API (/api/search)
  try {
    const response = await fetch(`/api/search?q=${encodeURIComponent(cleanQuery)}`, {
      headers: { Accept: 'application/json' },
    })

    if (response.ok) {
      const data = await response.json()
      const liveItems = (data?.results || []) as Array<{
        name: string
        category: string
        emoji: string
        barcode?: string
        priceObservations: NonNullable<Product['priceObservations']>
      }>

      for (const item of liveItems) {
        const prod: Product = {
          name: item.name,
          category: item.category,
          emoji: item.emoji,
          barcode: item.barcode,
          prices: null,
          historicAvg: null,
          priceStatus: 'observed',
          priceObservations: item.priceObservations,
        }

        // Register into runtime catalogue so shopping list and optimizer recognize it
        registerDynamicProduct(prod)

        const identityIndex = results.findIndex((result) =>
          result.name.toLowerCase() === item.name.toLowerCase() &&
          (!result.barcode || !item.barcode || result.barcode === item.barcode)
        )
        if (identityIndex >= 0) {
          const existing = results[identityIndex]
          const priceObservations = [
            ...(existing.priceObservations ?? []),
            ...item.priceObservations,
          ]
          const observedProduct = { ...prod, priceObservations }
          registerDynamicProduct(observedProduct)
          results[identityIndex] = {
            ...observedProduct,
            source: priceObservations.map((observation) => observation.source).join(', '),
            isLive: false,
          }
        } else {
          results.unshift({
            ...prod,
            source: item.priceObservations.map((observation) => observation.source).join(', '),
            isLive: false,
          })
        }
      }
    }
  } catch (err) {
    // If offline or network fails, fallback gracefully to local catalogue results
    console.warn('Live price search unreachable, using local catalogue:', err)
  }

  return results
}
