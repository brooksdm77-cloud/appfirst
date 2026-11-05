import React, { useState, useEffect, useRef } from 'react'
import { useAppStore } from '../store/appStore'
import {
  NZ_SUPERMARKET_CATALOGUE,
} from '../utils/constants'
import { VoiceCommandPanel } from './VoiceCommandPanel'
import { ShoppingListPhotoImport } from './ShoppingListPhotoImport'
import { searchProducts, SearchProductOption } from '../services/supermarketSearch'

export const ShoppingListsPanel: React.FC = () => {
  const currentUserData = useAppStore((state) => state.currentUserData)
  const addItemToWeekly = useAppStore((state) => state.addItemToWeekly)
  const addItemToOccasional = useAppStore((state) => state.addItemToOccasional)
  const removeFromWeekly = useAppStore((state) => state.removeFromWeekly)
  const removeFromOccasional = useAppStore((state) => state.removeFromOccasional)

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchProductOption[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [addMessage, setAddMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchProducts(searchQuery)
        setSearchResults(results.slice(0, 8))
      } catch (err) {
        console.error('Search error:', err)
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    }
  }, [searchQuery])

  if (!currentUserData) return null

  const handleAddDirect = async (item: SearchProductOption, list: 'weekly' | 'occasional') => {
    setAddMessage(null)
    try {
      const success =
        list === 'weekly'
          ? await addItemToWeekly(item.name)
          : await addItemToOccasional(item.name)

      if (success) {
        setAddMessage({ type: 'success', text: `✓ Added "${item.name}" to ${list} list!` })
        setSearchQuery('')
        setSearchResults([])
        setTimeout(() => setAddMessage(null), 3000)
      } else {
        setAddMessage({ type: 'error', text: `⚠️ "${item.name}" is already in your shopping lists.` })
      }
    } catch (error) {
      setAddMessage({
        type: 'error',
        text: error instanceof Error ? `Could not save item: ${error.message}` : 'Could not save item.',
      })
    }
  }

  const handleRemoveItem = async (item: string, list: 'weekly' | 'occasional') => {
    try {
      if (list === 'weekly') await removeFromWeekly(item)
      else await removeFromOccasional(item)
    } catch (error) {
      setAddMessage({
        type: 'error',
        text: error instanceof Error ? `Could not save change: ${error.message}` : 'Could not save change.',
      })
    }
  }

  const renderPriceBadges = (prod?: typeof NZ_SUPERMARKET_CATALOGUE[string]) => {
    if (!prod?.prices) {
      return (
        <span className="text-xs text-gray-500 italic">Price lookup pending</span>
      )
    }

    const { Woolworths, PAKnSAVE, NewWorld } = prod.prices
    const cheapest = Math.min(Woolworths, PAKnSAVE, NewWorld)

    return (
      <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
        <span
          className={`px-2 py-0.5 rounded ${
            PAKnSAVE === cheapest
              ? 'bg-amber-100 text-amber-900 border border-amber-300'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          PAKnSAVE: ${PAKnSAVE.toFixed(2)}
        </span>
        <span
          className={`px-2 py-0.5 rounded ${
            Woolworths === cheapest
              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          Woolies: ${Woolworths.toFixed(2)}
        </span>
        <span
          className={`px-2 py-0.5 rounded ${
            NewWorld === cheapest
              ? 'bg-red-100 text-red-900 border border-red-300'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          New World: ${NewWorld.toFixed(2)}
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ── Search & Scrape Supermarket Prices ── */}
      <div className="card bg-gradient-to-br from-blue-50 via-indigo-50 to-emerald-50 border-blue-200 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span>🔍</span>
            <span>Search & Scrape Supermarket Prices</span>
          </h3>
          <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live NZ Pricing Active
          </span>
        </div>
        <p className="text-xs text-gray-600 mb-4">
          Type any product to search live prices across Woolworths, PAK'nSAVE, and New World.
        </p>

        {addMessage && (
          <div className={`alert mb-4 ${addMessage.type === 'success' ? 'alert-success' : 'alert-error'}`}>
            {addMessage.text}
          </div>
        )}

        <div className="relative">
          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-gray-400 text-lg">🔎</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search or enter any product (e.g. oat milk, chicken breasts, coffee, tim tam)..."
              className="w-full pl-10 pr-24 py-3 rounded-xl border border-gray-300 bg-white shadow-sm text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-gray-900 placeholder:text-gray-400"
            />
            {isSearching && (
              <span className="absolute right-3 text-xs text-blue-600 font-semibold animate-pulse flex items-center gap-1">
                Scraping...
              </span>
            )}
          </div>

          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
            <div className="mt-2 divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden">
              {searchResults.map((item) => (
                <div
                  key={item.name}
                  className="p-3.5 hover:bg-blue-50/50 transition flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{item.emoji || '🛒'}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900">{item.name}</span>
                        {item.isLive && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                            Live
                          </span>
                        )}
                        <span className="text-xs text-gray-500">({item.category})</span>
                      </div>
                      <div className="mt-1">
                        {renderPriceBadges(item)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void handleAddDirect(item, 'weekly')}
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
                    >
                      + Weekly
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleAddDirect(item, 'occasional')}
                      className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-amber-600 transition"
                    >
                      + Occasional
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Saved Shopping Lists ── */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          📝 Saved Shopping Lists
        </h2>

        {/* Weekly Items */}
        <div className="card mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center justify-between">
            <span className="flex items-center gap-2">🔄 Regular Weekly Base Items</span>
            <span className="text-xs font-medium text-gray-500">
              {currentUserData.lists.weekly.length} items
            </span>
          </h3>
          {currentUserData.lists.weekly.length === 0 ? (
            <p className="text-sm text-gray-500 italic">Your core weekly list is empty. Search products above to add items.</p>
          ) : (
            <div className="space-y-2">
              {currentUserData.lists.weekly.map((item) => {
                const prod = NZ_SUPERMARKET_CATALOGUE[item]
                return (
                  <div
                    key={item}
                    className="flex flex-wrap items-center justify-between gap-2 bg-gray-50 p-3 rounded-lg border border-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{prod?.emoji || '🍏'}</span>
                      <div>
                        <div className="text-gray-900 font-semibold text-sm">{item}</div>
                        <div className="mt-1">{renderPriceBadges(prod)}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => void handleRemoveItem(item, 'weekly')}
                      className="btn-danger text-xs px-2.5 py-1"
                    >
                      Remove
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Occasional Items */}
        <div className="card mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center justify-between">
            <span className="flex items-center gap-2">🌟 Occasional Target Items (Price Monitored)</span>
            <span className="text-xs font-medium text-gray-500">
              {currentUserData.lists.occasional.length} items
            </span>
          </h3>
          {currentUserData.lists.occasional.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No custom special alerts tracked.</p>
          ) : (
            <div className="space-y-2">
              {currentUserData.lists.occasional.map((item) => {
                const prod = NZ_SUPERMARKET_CATALOGUE[item]
                return (
                  <div
                    key={item}
                    className="flex flex-wrap items-center justify-between gap-2 bg-yellow-50/60 p-3 rounded-lg border border-yellow-200"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{prod?.emoji || '📦'}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-900 font-semibold text-sm">{item}</span>
                          <span className="text-[10px] text-yellow-800 bg-yellow-200 px-1.5 py-0.5 rounded font-semibold">
                            Monitored
                          </span>
                        </div>
                        <div className="mt-1">{renderPriceBadges(prod)}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => void handleRemoveItem(item, 'occasional')}
                      className="btn-danger text-xs px-2.5 py-1"
                    >
                      Remove
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Voice Assistant Section */}
      <VoiceCommandPanel />

      {/* Photo Import */}
      <ShoppingListPhotoImport />
    </div>
  )
}
