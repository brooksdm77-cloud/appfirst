import React, { useState } from 'react'
import { SupermarketLogo } from './SupermarketLogo'
import {
  GENERIC_WEEKLY_ESSENTIALS,
  NZ_SUPERMARKET_CATALOGUE,
} from '../utils/constants'
import { formatCurrency, processBasketOptimization } from '../utils/optimizer'
import { useAppStore } from '../store/appStore'

export const TopSpecialsBanner: React.FC = () => {
  const loadWeeklyPreset = useAppStore((state) => state.loadWeeklyPreset)
  const addItemToWeekly = useAppStore((state) => state.addItemToWeekly)
  const addItemToOccasional = useAppStore((state) => state.addItemToOccasional)
  const currentUserData = useAppStore((state) => state.currentUserData)

  const [notification, setNotification] = useState<string | null>(null)

  // Compute generic weekly basket benchmark
  const genericBenchmark = processBasketOptimization(GENERIC_WEEKLY_ESSENTIALS)

  // Compute top deals of the day (items with >15% discount vs historic baseline)
  const allDeals = Object.values(NZ_SUPERMARKET_CATALOGUE).map((product) => {
    let cheapestStore: 'Woolworths' | 'PAKnSAVE' | 'NewWorld' = 'Woolworths'
    let lowestPrice = product.prices.Woolworths

    const stores: Array<'PAKnSAVE' | 'NewWorld'> = ['PAKnSAVE', 'NewWorld']
    for (const store of stores) {
      if (product.prices[store] < lowestPrice) {
        cheapestStore = store
        lowestPrice = product.prices[store]
      }
    }

    const discountPct = ((1 - lowestPrice / product.historicAvg) * 100)
    const savings = product.historicAvg - lowestPrice

    return {
      product,
      store: cheapestStore,
      lowestPrice,
      savings,
      discountPct: parseFloat(discountPct.toFixed(1)),
    }
  })

  // Sort by highest discount percentage and take top 5
  const topSpecials = allDeals
    .filter((d) => d.discountPct >= 15)
    .sort((a, b) => b.discountPct - a.discountPct)
    .slice(0, 5)

  const handleLoadGenericWeekly = () => {
    loadWeeklyPreset(GENERIC_WEEKLY_ESSENTIALS)
    setNotification('✓ Loaded 11 Kiwi Family Essentials into your Weekly List!')
    setTimeout(() => setNotification(null), 4000)
  }

  const handleAddSpecial = (itemName: string) => {
    const success = addItemToWeekly(itemName)
    if (success) {
      setNotification(`✓ Added ${itemName} to Weekly List`)
    } else {
      addItemToOccasional(itemName)
      setNotification(`✓ Added ${itemName} to Occasional List`)
    }
    setTimeout(() => setNotification(null), 3000)
  }

  return (
    <div className="space-y-6 mb-8">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-in border border-gray-700">
          <span className="text-xl">🛒</span>
          <span className="font-medium text-sm">{notification}</span>
        </div>
      )}

      {/* 1. Generic Weekly Shop Benchmark Card */}
      <div className="card bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white border-none shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 text-xs font-semibold px-3 py-1 rounded-full border border-blue-500/30 mb-3">
              <span>🇳🇿</span>
              <span>Kiwi Household Weekly Price Index</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">
              Best Price for an Average Weekly Shop
            </h2>
            <p className="text-gray-300 text-sm mt-1 max-w-xl">
              Real-time basket total for <span className="text-white font-semibold">11 essential everyday items</span> (Milk, Bread, Eggs, Cheese, Bananas, Chicken, Butter, Weet-Bix, Apples, Broccoli & Baked Beans).
            </p>
          </div>

          <div className="flex items-center">
            <button
              onClick={handleLoadGenericWeekly}
              className="px-5 py-3 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-gray-950 font-bold rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center gap-2 whitespace-nowrap text-sm"
            >
              <span>⚡</span>
              <span>Load 11 Kiwi Essentials</span>
            </button>
          </div>
        </div>

        {/* Store Comparison Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
          {/* Woolworths */}
          <div className="bg-white/5 hover:bg-white/10 transition-colors p-3.5 rounded-xl border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <SupermarketLogo store="Woolworths" size="xs" />
            </div>
            <div className="text-2xl font-extrabold text-white">
              {formatCurrency(genericBenchmark.storeTotals.Woolworths)}
            </div>
            <p className="text-xs text-gray-400 mt-1">One-Stop Shop</p>
          </div>

          {/* PAK'nSAVE */}
          <div className="bg-[#FFE600]/15 p-3.5 rounded-xl border-2 border-[#FFE600] relative">
            <span className="absolute -top-2.5 right-2 bg-[#FFE600] text-black text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
              Cheapest Store
            </span>
            <div className="flex items-center justify-between mb-2">
              <SupermarketLogo store="PAKnSAVE" size="xs" />
            </div>
            <div className="text-2xl font-extrabold text-[#FFE600]">
              {formatCurrency(genericBenchmark.storeTotals.PAKnSAVE)}
            </div>
            <p className="text-xs text-yellow-200/80 mt-1">One-Stop Leader</p>
          </div>

          {/* New World */}
          <div className="bg-white/5 hover:bg-white/10 transition-colors p-3.5 rounded-xl border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <SupermarketLogo store="NewWorld" size="xs" />
            </div>
            <div className="text-2xl font-extrabold text-white">
              {formatCurrency(genericBenchmark.storeTotals.NewWorld)}
            </div>
            <p className="text-xs text-gray-400 mt-1">One-Stop Shop</p>
          </div>

          {/* Multi-Store Optimal */}
          <div className="bg-emerald-500/20 p-3.5 rounded-xl border-2 border-emerald-400">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-wide flex items-center gap-1">
                <span>🛣️</span> Split Trip
              </span>
              <span className="bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                Save {formatCurrency(genericBenchmark.savings)}
              </span>
            </div>
            <div className="text-2xl font-extrabold text-emerald-300">
              {formatCurrency(genericBenchmark.optimalSplitTotal)}
            </div>
            <p className="text-xs text-emerald-200/80 mt-1">Smart Multi-Store</p>
          </div>
        </div>
      </div>

      {/* 2. Top Specials of the Day Carousel / Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span>🔥</span>
              <span>Top Specials of the Day</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Deepest discounts across NZ supermarkets compared to historical baselines
            </p>
          </div>
          <span className="text-xs bg-amber-100 text-amber-800 font-semibold px-2.5 py-1 rounded-full border border-amber-200">
            Updated Today
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {topSpecials.map((deal) => {
            const isAlreadyAdded =
              currentUserData?.lists.weekly.includes(deal.product.name) ||
              currentUserData?.lists.occasional.includes(deal.product.name)

            return (
              <div
                key={deal.product.name}
                className="card p-4 hover:shadow-lg transition-all transform hover:-translate-y-1 flex flex-col justify-between border-t-4 border-nz-warning"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <SupermarketLogo store={deal.store} size="xs" />
                    <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
                      -{deal.discountPct}%
                    </span>
                  </div>

                  <div className="text-3xl my-2 text-center select-none">
                    {deal.product.emoji || '🛒'}
                  </div>

                  <h4 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">
                    {deal.product.name}
                  </h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">{deal.product.category}</p>

                  <div className="mt-3 pt-2 border-t border-gray-100 flex items-baseline justify-between">
                    <div>
                      <span className="text-lg font-bold text-gray-900">
                        {formatCurrency(deal.lowestPrice)}
                      </span>
                      <span className="text-xs text-gray-400 line-through ml-1.5">
                        {formatCurrency(deal.product.historicAvg)}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-600">
                      Save {formatCurrency(deal.savings)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleAddSpecial(deal.product.name)}
                  disabled={isAlreadyAdded}
                  className={`mt-3 w-full py-1.5 px-2 rounded-lg text-xs font-medium transition-colors ${
                    isAlreadyAdded
                      ? 'bg-gray-100 text-gray-400 cursor-default'
                      : 'bg-nz-primary hover:bg-blue-700 text-white shadow-sm'
                  }`}
                >
                  {isAlreadyAdded ? '✓ In Your Lists' : '+ Add to List'}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

