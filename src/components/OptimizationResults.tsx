import React from 'react'
import { OptimizationResult } from '../types'
import { formatCurrency } from '../utils/optimizer'

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
      <div className="grid grid-cols-2 gap-4">
        {/* One-Stop Option */}
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            🏪 Best One-Stop Option
          </h3>
          <div className="bg-white rounded-lg p-4 border-2 border-nz-primary">
            <p className="text-2xl font-bold text-nz-primary mb-2">🏆 {result.bestSingleStore}</p>
            <div className="text-3xl font-bold text-gray-900">
              {formatCurrency(result.bestSingleTotal)}
            </div>
            <p className="text-sm text-gray-600 mt-2">Total for {itemCount} items</p>
          </div>
        </div>

        {/* Multi-Store Option */}
        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-300">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            🛣️ Best Multi-Store Trip
          </h3>
          <div className="bg-white rounded-lg p-4 border-2 border-nz-success">
            <p className="text-2xl font-bold text-nz-success mb-2">💡 Optimized Split</p>
            <div className="text-3xl font-bold text-gray-900">
              {formatCurrency(result.optimalSplitTotal)}
            </div>
            <p className="text-sm text-gray-600 mt-2">Total for {itemCount} items</p>
          </div>
        </div>
      </div>

      {/* Savings Card */}
      <div className="card bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-300">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 font-medium mb-1">💰 Your Potential Savings</p>
            <div className="text-4xl font-bold text-nz-warning">
              {formatCurrency(result.savings)}
            </div>
            <p className="text-sm text-gray-600 mt-2">{percentageSavings}% cheaper with multi-store trip</p>
          </div>
          <div className="text-6xl opacity-20">💰</div>
        </div>
      </div>

      {/* Store Breakdown */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Price Comparison by Store</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {Object.entries(result.storeTotals).map(([store, total]) => (
            <div
              key={store}
              className={`p-4 rounded-lg border-2 ${
                store === result.bestSingleStore
                  ? 'border-nz-primary bg-blue-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <p className="text-sm font-medium text-gray-600 mb-1">{store}</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(total)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Split Trip Breakdown */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🗺️ Split Trip Breakdown</h3>
        <div className="space-y-3">
          {Object.entries(result.splitBreakdown).map(([store, items]) =>
            items.length > 0 ? (
              <div key={store} className="border-l-4 border-nz-primary pl-4">
                <p className="font-semibold text-gray-900 mb-2">
                  {store} <span className="badge badge-success">{items.length} items</span>
                </p>
                <ul className="space-y-1">
                  {items.map((item) => (
                    <li key={item} className="text-sm text-gray-600 flex items-center gap-2">
                      <span className="text-nz-primary">✓</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null
          )}
        </div>
      </div>
    </div>
  )
}
