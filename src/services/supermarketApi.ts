/**
 * SupermarketApi — Client-side service for fetching product catalogues.
 *
 * Currently reads product metadata from the local mock-data JSON file via Vite's static import.
 * When a real API is available, simply replace the implementation of getCatalog()
 * with a fetch() call to the real endpoint.
 */

import type { Product } from '../types'

// ── Shared types ───────────────────────────────────────────────────────────────

export interface CatalogProduct {
  name: string
  category: string
  emoji: string
  barcode?: string
  prices: {
    Woolworths: number | null
    PAKnSAVE: number | null
    NewWorld: number | null
  } | null
  historicAvg: number | null
  priceStatus?: 'sample' | 'unavailable'
  lastUpdated?: string
}

// ── Configuration ──────────────────────────────────────────────────────────────

/**
 * When you have a real backend or mock server, configure via environment variables:
 *   VITE_SUPERMARKET_API_URL='http://localhost:4000'         ← local Node mock server
 *   VITE_SPREAD_API_URL='https://spread.butterup.app/api'    ← Spread (NZ grocery aggregator)
 */
const API_BASE_URL: string | null = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPERMARKET_API_URL) || null
const SPREAD_API_KEY: string | null = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SPREAD_API_KEY) || null

// ── Static import (fallback when no API server is running) ─────────────────

// Vite can import JSON files directly — this works without any backend
import catalogData from '../../mock-data/products.json'

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Fetch the full product catalogue.
 *
 * Priority:
 *   1. If API_BASE_URL is set → fetch from that endpoint
 *   2. Otherwise → use the static JSON bundled with the app
 */
export async function getCatalog(): Promise<CatalogProduct[]> {
  // --- Option 1: Fetch from live API ---
  if (API_BASE_URL) {
    try {
      const headers: Record<string, string> = { 'Accept': 'application/json' }
      if (SPREAD_API_KEY) {
        headers['Authorization'] = `Bearer ${SPREAD_API_KEY}`
      }
      const resp = await fetch(`${API_BASE_URL}/api/products`, { headers })
      if (!resp.ok) throw new Error(`API returned ${resp.status}`)
      return (await resp.json()) as CatalogProduct[]
    } catch (err) {
      console.warn('⚠️ Live API unreachable, falling back to static data:', err)
      // Fall through to static import
    }
  }

  // The bundled JSON contains sample prices, so expose metadata only until
  // an authorized, verified price source is configured.
  return catalogData.map(({ name, category, emoji, barcode }) => ({
    name,
    category,
    emoji,
    barcode,
    prices: null,
    historicAvg: null,
    priceStatus: 'unavailable',
  }))
}

/**
 * Convert a CatalogProduct into the legacy Product shape used by the rest of the
 * app (constants.ts / optimizer.ts / components). This bridges the gap between
 * the new catalogue format and the existing codebase.
 */
export function catalogToLegacyProduct(cp: CatalogProduct): Product {
  let prices: Product['prices'] = null
  if (
    cp.prices &&
    cp.prices.Woolworths !== null &&
    cp.prices.PAKnSAVE !== null &&
    cp.prices.NewWorld !== null
  ) {
    prices = {
      Woolworths: cp.prices.Woolworths,
      PAKnSAVE: cp.prices.PAKnSAVE,
      NewWorld: cp.prices.NewWorld,
    }
  }

  return {
    name: cp.name,
    category: cp.category,
    emoji: cp.emoji,
    prices,
    historicAvg: cp.historicAvg,
    priceStatus: cp.priceStatus ?? (prices ? 'sample' : 'unavailable'),
  }
}

/**
 * Build a Record<name, Product> from the catalogue — drop-in replacement for
 * the static NZ_SUPERMARKET_CATALOGUE in constants.ts
 */
export function catalogToRecord(catalog: CatalogProduct[]): Record<string, Product> {
  const record: Record<string, Product> = {}
  for (const cp of catalog) {
    record[cp.name] = catalogToLegacyProduct(cp)
  }
  return record
}

/**
 * Search the catalogue by name (case-insensitive substring match).
 */
export function searchCatalog(catalog: CatalogProduct[], query: string): CatalogProduct[] {
  const q = query.toLowerCase().trim()
  if (!q) return catalog
  return catalog.filter(p => p.name.toLowerCase().includes(q))
}

/**
 * Get the cheapest store for a product.
 */
export function getCheapestStore(product: CatalogProduct): {
  store: 'Woolworths' | 'PAKnSAVE' | 'NewWorld'
  price: number
} | null {
  if (!product.prices) return null

  const entries = Object.entries(product.prices) as Array<
    ['Woolworths' | 'PAKnSAVE' | 'NewWorld', number | null]
  >

  let best: { store: 'Woolworths' | 'PAKnSAVE' | 'NewWorld'; price: number } | null = null

  for (const [store, price] of entries) {
    if (price !== null && price > 0) {
      if (!best || price < best.price) {
        best = { store, price }
      }
    }
  }

  return best
}
