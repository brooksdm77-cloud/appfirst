import React, { useState, useEffect, useRef } from 'react'
import { useAppStore } from '../store/appStore'
import { getDiscountedItems, processBasketOptimization, formatCurrency } from '../utils/optimizer'
import { OptimizationResults } from './OptimizationResults'
import { NZ_SUPERMARKET_CATALOGUE } from '../utils/constants'
import { SupermarketLogo } from './SupermarketLogo'

export const RecommendationsPanel: React.FC = () => {
  const currentUserData = useAppStore((state) => state.currentUserData)

  const [activeCart, setActiveCart] = useState<string[]>([])
  const [injectionMessage, setInjectionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  )
  const prevWeeklyRef = useRef<string[]>([])

  // Synchronize cart with weekly items added/removed
  useEffect(() => {
    if (!currentUserData) return
    const prevWeekly = prevWeeklyRef.current
    const currentWeekly = currentUserData.lists.weekly

    const removedFromWeekly = prevWeekly.filter((x) => !currentWeekly.includes(x))
    const addedToWeekly = currentWeekly.filter((x) => !prevWeekly.includes(x))

    setActiveCart((prev) => {
      const base = prev.filter((item) => !removedFromWeekly.includes(item))
      return Array.from(new Set([...base, ...addedToWeekly]))
    })

    prevWeeklyRef.current = currentWeekly
  }, [currentUserData?.lists.weekly])

  if (!currentUserData) return null

  const discountedItems = getDiscountedItems(currentUserData.lists.occasional)
  const hasDeals = discountedItems.length > 0

  const handleInjectItem = (itemName: string) => {
    if (!activeCart.includes(itemName)) {
      const newCart = [...activeCart, itemName]
      setActiveCart(newCart)
      setInjectionMessage({
        type: 'success',
        text: `✓ Added ${itemName} to active cart`,
      })
      setTimeout(() => setInjectionMessage(null), 3000)
    }
  }

  const handleRemoveFromCart = (itemName: string) => {
    setActiveCart((prev) => prev.filter((item) => item !== itemName))
  }

  const optimizationResult = processBasketOptimization(activeCart)
  const showResults = activeCart.length > 0

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        💡 Live Recommendation Insights
      </h2>

      {/* Deal Alerts Section */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          ✨ Smart Discount Detector
        </h3>

        {!hasDeals ? (
          <div className="alert alert-info">
            No items within your Occasional List met the deep-discount algorithm threshold this week.
          </div>
        ) : (
          <div className="space-y-3">
            {discountedItems.map((item) => {
              const prod = NZ_SUPERMARKET_CATALOGUE[item.name]

              return (
                <div key={item.name} className="alert alert-warning border-l-4 border-nz-warning bg-amber-50/50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <SupermarketLogo store={item.store} size="xs" />
                        <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                          -{item.discount}% OFF
                        </span>
                      </div>
                      <p className="text-sm font-bold text-gray-900 mb-1 flex items-center gap-1.5">
                        <span className="text-lg">{prod?.emoji || '📦'}</span>
                        <span>{item.name}</span>
                      </p>
                      <p className="text-sm text-gray-700 mb-2">
                        On sale this week at a low of{' '}
                        <span className="font-bold text-nz-warning">{formatCurrency(item.currentPrice)}</span>{' '}
                        <span className="text-xs text-gray-400 line-through ml-1">(Baseline: {formatCurrency(item.historicAvg)})</span>
                      </p>
                      <p className="text-xs font-semibold text-emerald-700">
                        💰 You save {formatCurrency(item.savings)} by buying this week!
                      </p>
                    </div>
                    <button
                      onClick={() => handleInjectItem(item.name)}
                      disabled={activeCart.includes(item.name)}
                      className="btn-primary whitespace-nowrap text-xs px-3 py-2"
                    >
                      {activeCart.includes(item.name) ? '✓ Added' : '+ Add to Cart'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {injectionMessage && (
        <div className={`alert ${injectionMessage.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          {injectionMessage.text}
        </div>
      )}

      {/* Optimization Results Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          🏁 Automated Single vs. Multi-Store Optimization
        </h3>

        {!showResults ? (
          <div className="alert alert-info">
            Populate items inside your active profile view to see optimization metrics.
          </div>
        ) : (
          <>
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Active Running Basket:</span> {activeCart.length} distinct product items
              </p>
            </div>
            <OptimizationResults result={optimizationResult} itemCount={activeCart.length} />
          </>
        )}
      </div>

      {/* Active Cart Management */}
      {activeCart.length > 0 && (
        <div className="card bg-gray-50 border-gray-300">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">🛒 Active Cart Items</h3>
            <button
              onClick={() => setActiveCart([])}
              className="text-xs text-red-600 hover:text-red-800 font-medium underline"
            >
              Clear Cart
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeCart.map((item) => {
              const prod = NZ_SUPERMARKET_CATALOGUE[item]
              return (
                <span key={item} className="badge badge-success flex items-center gap-1.5 py-1 px-2.5">
                  <span>{prod?.emoji || '🛒'}</span>
                  <span>{item}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFromCart(item)}
                    className="text-gray-500 hover:text-red-600 font-bold px-1 ml-0.5"
                    title={`Remove ${item} from cart`}
                  >
                    ×
                  </button>
                </span>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}


