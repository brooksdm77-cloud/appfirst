export interface SearchResultProduct {
  name: string
  brand?: string
  category: string
  emoji: string
  barcode?: string
  priceObservations: Array<{
    store: 'Woolworths' | 'PAKnSAVE' | 'NewWorld'
    price: number
    observedAt?: string
    location?: string
    source: string
  }>
}

const CATEGORY_EMOJIS: Record<string, string> = {
  milk: '🥛',
  dairy: '🥛',
  cheese: '🧀',
  butter: '🧈',
  egg: '🥚',
  bread: '🍞',
  bakery: '🥐',
  banana: '🍌',
  apple: '🍎',
  broccoli: '🥦',
  potato: '🥔',
  onion: '🧅',
  produce: '🥬',
  chicken: '🍗',
  beef: '🥩',
  meat: '🥩',
  salmon: '🐟',
  fish: '🐟',
  coffee: '☕',
  tea: '🍵',
  cereal: '🥣',
  chocolate: '🍫',
  biscuit: '🍪',
  chip: '🥔',
  snack: '🍿',
  juice: '🧃',
  drink: '🥤',
  water: '💧',
  soap: '🧼',
  cleaning: '🧹',
  paper: '🧻',
}

function detectEmoji(text: string): string {
  const lower = text.toLowerCase()
  for (const [kw, emoji] of Object.entries(CATEGORY_EMOJIS)) {
    if (lower.includes(kw)) return emoji
  }
  return '🛒'
}

export async function searchSupermarkets(query: string): Promise<SearchResultProduct[]> {
  const cleanQuery = query.trim().toLowerCase()
  if (!cleanQuery) return []

  const results: SearchResultProduct[] = []

  // 1. Live Query to Woolworths NZ Web API
  try {
    const wwUrl = `https://www.woolworths.co.nz/api/v1/products?target=search&search=${encodeURIComponent(
      cleanQuery
    )}&size=8`
    const wwResp = await fetch(wwUrl, {
      headers: {
        Accept: 'application/json, text/plain, */*',
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'X-Requested-With': 'OnlineShopping.WebApp',
      },
    })

    if (wwResp.ok) {
      const data = (await wwResp.json()) as any
      const items = data?.products?.items || []
      const retrievedAt = new Date().toISOString()

      for (const item of items) {
        if (!item.name || !item.price) continue
        const reportedPrice = item.price.salePrice > 0
          ? item.price.salePrice
          : item.price.originalPrice
        const wwPrice = Number(reportedPrice)
        if (!Number.isFinite(wwPrice) || wwPrice <= 0) continue

        const formattedName = item.name
          .trim()
          .replace(/\s+/g, ' ')
          .replace(/\b\w/g, (c: string) => c.toUpperCase())

        results.push({
          name: formattedName,
          brand: item.brand,
          category: item.variety || 'Groceries',
          emoji: detectEmoji(formattedName + ' ' + (item.variety || '')),
          barcode: item.barcode || item.sku,
          priceObservations: [{
            store: 'Woolworths',
            price: wwPrice,
            observedAt: retrievedAt,
            source: 'Woolworths NZ (retrieved)',
          }],
        })
      }
    }
  } catch (err) {
    console.warn('Woolworths live search error:', err)
  }

  // 2. Query Baskt NZ Grocery Data API
  try {
    const basktUrl = `https://baskt.nz/api/v1/assistant/cheapest-item?q=${encodeURIComponent(cleanQuery)}`
    const bResp = await fetch(basktUrl, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'SmartGrocer-NZ/1.0',
      },
    })

    if (bResp.ok) {
      const bData = (await bResp.json()) as any
      const cheapest = bData?.data?.cheapest
      if (cheapest?.item && Number.isFinite(cheapest?.price?.priceCents) && cheapest.price.priceCents > 0) {
        const price = parseFloat((cheapest.price.priceCents / 100).toFixed(2))
        const chain = (cheapest.item.chainLabel || '').toLowerCase()
        const store = chain.includes('woolworths') || chain.includes('countdown')
          ? 'Woolworths'
          : chain.includes('pak')
            ? 'PAKnSAVE'
            : chain.includes('new world')
              ? 'NewWorld'
              : null
        if (store) {
          const formattedName = cheapest.item.name
            .trim()
            .replace(/\s+/g, ' ')
            .replace(/\b\w/g, (c: string) => c.toUpperCase())

          results.push({
            name: formattedName,
            brand: cheapest.item.brand,
            category: cheapest.item.category || 'Pantry',
            emoji: detectEmoji(formattedName),
            barcode: cheapest.item.gtin || cheapest.item.externalSku,
            priceObservations: [{
              store,
              price,
              observedAt: cheapest.price.observedAt || cheapest.price.updatedAt,
              location: cheapest.location?.name || cheapest.location?.region,
              source: 'Baskt NZ (latest observed)',
            }],
          })
        }
      }
    }
  } catch (err) {
    console.warn('Baskt lookup error:', err)
  }

  return results
}
