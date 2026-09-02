import React, { useState } from 'react'
import { useAppStore } from '../store/appStore'
import { getDiscountedItems, processBasketOptimization, formatCurrency } from '../utils/optimizer'
import { OptimizationResults } from './OptimizationResults'
import { NZ_SUPERMARKET_CATALOGUE } from '../utils/constants'

export const RecommendationsPanel: React.FC = () => {
  const currentUserData = useAppStore((state) => state.currentUserData)
  const addItemToWeekly = useAppStore((state) => state.addItemToWeekly)

  const [activeCart, setActiveCart] = useState<string[]>([])
  const [injectionMessage, setInjectionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  )

  if (!currentUserData) return null

  const discountedItems = getDiscountedItems(currentUserData.lists.occasional)
  const hasDeals = discountedItems.length > 0

  // Initialize cart with weekly items if not already done
  React.useEffect(() => {
    if (activeCart.length === 0) {
      setActiveCart([...currentUserData.lists.weekly])
    }
  }, [currentUserData])

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
              const product = NZ_SUPERMARKET_CATALOGUE[item.name]
              const cheapestPrice = Math.min(
                product.prices.Woolworths,
                product.prices.PAKnSAVE,
                product.prices.NewWorld
              )

              return (
                <div key={item.name} className="alert alert-warning border-l-4 border-nz-warning">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 mb-1">
                        ✨ Smart Discount Detected!
                      </p>
                      <p className="text-sm text-gray-700 mb-2">
                        <span className="font-medium">{item.name}</span> is on sale this week at a low of{' '}
                        <span className="font-bold text-nz-warning">{formatCurrency(cheapestPrice)}</span>{' '}
                        (Historical: {formatCurrency(product.historicAvg)}).
                      </p>
                      <p className="text-sm font-medium">
                        💰 You save <span className="text-nz-success font-bold">{formatCurrency(item.savings)}</span> ({item.discount}% off)
                      </p>
                    </div>
                    <button
                      onClick={() => handleInjectItem(item.name)}
                      disabled={activeCart.includes(item.name)}
                      className="btn-primary whitespace-nowrap"
                    >
                      {activeCart.includes(item.name) ? '✓ Added' : 'Add to Cart'}
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
          <h3 className="text-lg font-semibold text-gray-900 mb-3">🛒 Active Cart Items</h3>
          <div className="flex flex-wrap gap-2">
            {activeCart.map((item) => (
              <span key={item} className="badge badge-success">
                {item}
              </span>
            ))}
          </div>
          <button
            onClick={() => setActiveCart([])}
            className="btn-secondary w-full mt-3"
          >
            Clear Cart
          </button>
        </div>
      )}
    </div>
  )
}
