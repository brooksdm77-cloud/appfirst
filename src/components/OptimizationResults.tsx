import React from 'react'
import { OptimizationResult } from '../types'
import { formatCurrency } from '../utils/optimizer'
import { SupermarketLogo } from './SupermarketLogo'

interface OptimizationResultsProps {
  result: OptimizationResult
  itemCount: number
}

export const OptimizationResults: React.FC<OptimizationResultsProps> = ({ result, itemCount }) => {
  const percentageSavings = result.bestSingleTotal > 0 
    ? ((result.savings / result.bestSingleTotal) * 100).toFixed(1)
    : '0'

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* One-Stop Option */}
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            🏪 Best One-Stop Option
          </h3>
          <div className="bg-white rounded-lg p-4 border-2 border-nz-primary shadow-sm">
            <div className="mb-2">
              <SupermarketLogo store={result.bestSingleStore} size="md" />
            </div>
            <div className="text-3xl font-extrabold text-gray-900">
              {formatCurrency(result.bestSingleTotal)}
            </div>
            <p className="text-xs text-gray-600 mt-1">Total for {itemCount} items at one store</p>
          </div>
        </div>

        {/* Multi-Store Option */}
        <div className="card bg-gradient-to-br from-emerald-50 to-green-100 border-emerald-300">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            🛣️ Best Multi-Store Trip
          </h3>
          <div className="bg-white rounded-lg p-4 border-2 border-nz-success shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">💡</span>
              <span className="font-bold text-nz-success text-lg">Optimized Split Routing</span>
            </div>
            <div className="text-3xl font-extrabold text-gray-900">
              {formatCurrency(result.optimalSplitTotal)}
            </div>
            <p className="text-xs text-gray-600 mt-1">Split across stores for lowest price</p>
          </div>
        </div>
      </div>

      {/* Savings Card */}
      <div className="card bg-gradient-to-r from-amber-50 to-yellow-100 border-yellow-300 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-amber-900 font-semibold text-sm mb-1">💰 Your Potential Savings</p>
            <div className="text-4xl font-black text-amber-600">
              {formatCurrency(result.savings)}
            </div>
            <p className="text-xs text-gray-700 mt-1 font-medium">
              Save {percentageSavings}% by splitting items across supermarkets
            </p>
          </div>
          <div className="text-5xl opacity-80">🎉</div>
        </div>
      </div>

      {/* Store Breakdown */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Price Comparison by Store</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {Object.entries(result.storeTotals).map(([store, total]) => {
            const isWinner = store === result.bestSingleStore
            return (
              <div
                key={store}
                className={`p-4 rounded-xl border-2 transition-all ${
                  isWinner
                    ? 'border-nz-primary bg-blue-50/70 shadow-sm ring-2 ring-blue-200'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <SupermarketLogo store={store} size="xs" />
                  {isWinner && (
                    <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                      Best Single
                    </span>
                  )}
                </div>
                <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(total)}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Split Trip Breakdown */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🗺️ Recommended Split Trip Itinerary</h3>
        <div className="space-y-4">
          {Object.entries(result.splitBreakdown).map(([store, items]) => {
            return items.length > 0 ? (
              <div key={store} className="border-l-4 border-nz-primary pl-4 bg-gray-50/60 p-3 rounded-r-lg">
                <div className="flex items-center gap-2 mb-2">
                  <SupermarketLogo store={store} size="xs" />
                  <span className="badge badge-success text-xs font-semibold">{items.length} items to buy here</span>
                </div>
                <ul className="space-y-1.5 mt-2">
                  {items.map((item) => (
                    <li key={item} className="text-xs text-gray-700 flex items-center gap-2 font-medium">
                      <span className="text-nz-primary font-bold">✓</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null
          })}
        </div>
      </div>
    </div>
  )
}


