import React, { useEffect, useState } from 'react'
import { useAppStore } from '../store/appStore'
import { NZ_REGIONS, STORE_NAMES, SUPERMARKET_METADATA } from '../utils/constants'
import { SupermarketLogo } from './SupermarketLogo'

interface AccountProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

export const AccountProfileModal: React.FC<AccountProfileModalProps> = ({ isOpen, onClose }) => {
  const currentUserData = useAppStore((state) => state.currentUserData)
  const updateProfile = useAppStore((state) => state.updateProfile)
  const logout = useAppStore((state) => state.logout)

  const [fullName, setFullName] = useState(currentUserData?.fullName || '')
  const [phone, setPhone] = useState(currentUserData?.phone || '')
  const [region, setRegion] = useState(currentUserData?.region || 'Wellington')
  const [address, setAddress] = useState(currentUserData?.address || '')
  const [postcode, setPostcode] = useState(currentUserData?.postcode || '')
  const [preferredSupermarket, setPreferredSupermarket] = useState<'Woolworths' | 'PAKnSAVE' | 'NewWorld'>(
    currentUserData?.preferredSupermarket || 'PAKnSAVE'
  )
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isOpen || !currentUserData) return
    setFullName(currentUserData.fullName || '')
    setPhone(currentUserData.phone || '')
    setRegion(currentUserData.region || 'Wellington')
    setAddress(currentUserData.address || '')
    setPostcode(currentUserData.postcode || '')
    setPreferredSupermarket(currentUserData.preferredSupermarket || 'PAKnSAVE')
    setStatusMessage(null)
  }, [
    isOpen,
    currentUserData?.email,
    currentUserData?.fullName,
    currentUserData?.phone,
    currentUserData?.region,
    currentUserData?.address,
    currentUserData?.postcode,
    currentUserData?.preferredSupermarket,
  ])

  if (!isOpen || !currentUserData) return null

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (postcode.trim() && !/^\d{4}$/.test(postcode.trim())) {
      setStatusMessage({ type: 'error', text: 'Enter a valid 4-digit New Zealand postcode.' })
      return
    }
    setSaving(true)
    setStatusMessage(null)

    try {
      await updateProfile({
        fullName,
        phone,
        region,
        address,
        postcode: postcode.trim(),
        preferredSupermarket,
      })
      setStatusMessage({ type: 'success', text: '✓ Account profile updated successfully!' })
      setTimeout(() => {
        setStatusMessage(null)
      }, 3000)
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Failed to update profile. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 animate-slide-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl font-bold border border-white/30">
              {fullName ? fullName.charAt(0).toUpperCase() : '👤'}
            </div>
            <div>
              <h2 className="text-xl font-bold leading-tight">
                {fullName || 'Customer Account'}
              </h2>
              <p className="text-xs text-blue-100 font-mono">{currentUserData.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-sm font-medium ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {statusMessage.text}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="input-field text-sm"
              placeholder="e.g. Liam Smith"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={currentUserData.email}
                disabled
                className="input-field text-sm bg-gray-100 text-gray-500 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Phone Number (Mobile)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input-field text-sm"
                placeholder="021 555 1234"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                New Zealand Region
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="input-field text-sm"
              >
                {NZ_REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-gray-400 mt-0.5 block">
                Prices vary by regional supermarket store
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Preferred Supermarket
              </label>
              <select
                value={preferredSupermarket}
                onChange={(e) =>
                  setPreferredSupermarket(e.target.value as 'Woolworths' | 'PAKnSAVE' | 'NewWorld')
                }
                className="input-field text-sm"
              >
                {STORE_NAMES.map((store) => (
                  <option key={store} value={store}>
                    {SUPERMARKET_METADATA[store].name}
                  </option>
                ))}
              </select>
              <div className="mt-1 flex items-center gap-1.5">
                <SupermarketLogo store={preferredSupermarket} size="xs" />
                <span className="text-[10px] text-gray-500">
                  {SUPERMARKET_METADATA[preferredSupermarket].tagline}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="input-field text-sm"
              placeholder="Street address and suburb"
              autoComplete="street-address"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              New Zealand Postcode
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{4}"
              maxLength={4}
              value={postcode}
              onChange={(e) => setPostcode(e.target.value.replace(/\D/g, '').slice(0, 4))}
              className="input-field text-sm"
              placeholder="e.g. 6011"
              autoComplete="postal-code"
              aria-describedby="profile-postcode-help"
            />
            <span id="profile-postcode-help" className="text-[10px] text-gray-400 mt-0.5 block">
              Used to find nearby supermarkets and local prices
            </span>
          </div>

          {/* Account Statistics */}
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <span className="text-gray-500 block">Weekly Items</span>
              <span className="text-base font-bold text-gray-900">
                {currentUserData.lists.weekly.length}
              </span>
            </div>
            <div>
              <span className="text-gray-500 block">Occasional Items</span>
              <span className="text-base font-bold text-amber-600">
                {currentUserData.lists.occasional.length}
              </span>
            </div>
            <div>
              <span className="text-gray-500 block">Receipt Prices</span>
              <span className="text-base font-bold text-emerald-600">
                {currentUserData.receiptPriceObservations?.length || 0}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-between gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={async () => {
                onClose()
                await logout()
              }}
              className="btn-danger text-xs px-3 py-2 flex items-center gap-1.5"
            >
              <span>🚪</span>
              <span>Sign Out</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary text-xs px-5 py-2 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
