import React, { useState } from 'react'
import { useAppStore } from '../store/appStore'
import { NZ_SUPERMARKET_CATALOGUE } from '../utils/constants'

export const ShoppingListsPanel: React.FC = () => {
  const currentUserData = useAppStore((state) => state.currentUserData)
  const addItemToWeekly = useAppStore((state) => state.addItemToWeekly)
  const addItemToOccasional = useAppStore((state) => state.addItemToOccasional)
  const removeFromWeekly = useAppStore((state) => state.removeFromWeekly)
  const removeFromOccasional = useAppStore((state) => state.removeFromOccasional)

  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [frequency, setFrequency] = useState<'weekly' | 'occasional'>('weekly')
  const [addMessage, setAddMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  if (!currentUserData) return null

  const productNames = Object.keys(NZ_SUPERMARKET_CATALOGUE)

  const handleAddItem = () => {
    if (!selectedProduct) return

    setAddMessage(null)

    const success =
      frequency === 'weekly'
        ? addItemToWeekly(selectedProduct)
        : addItemToOccasional(selectedProduct)

    if (success) {
      setAddMessage({
        type: 'success',
        text: `✓ Added to ${frequency} list`,
      })
      setSelectedProduct('')
      setTimeout(() => setAddMessage(null), 3000)
    } else {
      setAddMessage({
        type: 'error',
        text: '⚠️ Item already in a list',
      })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          📝 Saved Shopping Lists
        </h2>

        {/* Weekly Items */}
        <div className="card mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            🔄 Regular Weekly Base Items
          </h3>
          {currentUserData.lists.weekly.length === 0 ? (
            <p className="text-sm text-gray-500 italic">Your core weekly list is empty.</p>
          ) : (
            <div className="space-y-2">
              {currentUserData.lists.weekly.map((item) => (
                <div key={item} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                  <span className="text-gray-900">🍏 {item}</span>
                  <button
                    onClick={() => removeFromWeekly(item)}
                    className="btn-danger text-sm px-3 py-1"
                  >
                    ❌ Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Occasional Items */}
        <div className="card mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            🌟 Occasional Target Items (Price Monitored)
          </h3>
          {currentUserData.lists.occasional.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No custom special alerts tracked.</p>
          ) : (
            <div className="space-y-2">
              {currentUserData.lists.occasional.map((item) => (
                <div key={item} className="flex items-center justify-between bg-yellow-50 p-3 rounded-lg">
                  <span className="text-gray-900">📦 {item} <span className="text-xs text-yellow-600">Monitored</span></span>
                  <button
                    onClick={() => removeFromOccasional(item)}
                    className="btn-danger text-sm px-3 py-1"
                  >
                    ❌ Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Items Section */}
      <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          ➕ Add Items to Your Profile
        </h3>

        {addMessage && (
          <div className={`alert mb-4 ${addMessage.type === 'success' ? 'alert-success' : 'alert-error'}`}>
            {addMessage.text}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search NZ Product Registry
            </label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="input-field"
            >
              <option value="">-- Choose Item --</option>
              {productNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Shopping Strategy
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  checked={frequency === 'weekly'}
                  onChange={() => setFrequency('weekly')}
                  className="w-4 h-4 text-nz-primary"
                />
                <span className="text-gray-700">Buy standard every week</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  checked={frequency === 'occasional'}
                  onChange={() => setFrequency('occasional')}
                  className="w-4 h-4 text-nz-primary"
                />
                <span className="text-gray-700">Buy only when heavily discounted</span>
              </label>
            </div>
          </div>

          <button onClick={handleAddItem} className="btn-primary w-full">
            Add Product to My List
          </button>
        </div>
      </div>
    </div>
  )
}
