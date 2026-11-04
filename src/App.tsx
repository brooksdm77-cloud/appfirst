import { useEffect, useState } from 'react'
import { useAppStore } from './store/appStore'
import { AuthScreen } from './components/AuthScreen'
import { ShoppingListsPanel } from './components/ShoppingListsPanel'
import { RecommendationsPanel } from './components/RecommendationsPanel'
import { TopSpecialsBanner } from './components/TopSpecialsBanner'
import { SupermarketLogo } from './components/SupermarketLogo'
import { ReceiptUploader } from './components/ReceiptUploader'
import { AccountProfileModal } from './components/AccountProfileModal'

function App() {
  const loggedInUser = useAppStore((state) => state.loggedInUser)
  const currentUserData = useAppStore((state) => state.currentUserData)
  const authReady = useAppStore((state) => state.authReady)
  const initializeAuth = useAppStore((state) => state.initializeAuth)
  const logout = useAppStore((state) => state.logout)
  const [logoutError, setLogoutError] = useState('')
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  useEffect(() => initializeAuth(), [initializeAuth])

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Loading your account…
      </div>
    )
  }
  if (!loggedInUser) {
    return <AuthScreen />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                <span>🛒</span>
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 bg-clip-text text-transparent">
                  SmartGrocer NZ
                </span>
              </h1>
              <p className="text-xs text-gray-500 hidden sm:block">
                Intelligent Price Comparison & Split-Trip Optimizer
              </p>
            </div>

            {/* Live Supermarkets Comparison Ticker */}
            <div className="hidden lg:flex items-center gap-2 bg-gray-100/80 px-3 py-1.5 rounded-xl border border-gray-200">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                Comparing:
              </span>
              <SupermarketLogo store="Woolworths" size="xs" />
              <SupermarketLogo store="PAKnSAVE" size="xs" />
              <SupermarketLogo store="NewWorld" size="xs" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsProfileOpen(true)}
              className="text-right hidden sm:flex items-center gap-2 hover:bg-gray-100 p-1.5 rounded-xl transition-all border border-transparent hover:border-gray-200"
              title="Click to view and edit account profile"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                {currentUserData?.fullName ? currentUserData.fullName.charAt(0).toUpperCase() : '👤'}
              </div>
              <div className="text-left">
                <span className="text-[10px] text-gray-400 block font-medium leading-none">
                  {currentUserData?.region || 'NZ Shopper'}
                </span>
                <p className="text-xs font-bold text-gray-900 leading-tight">
                  {currentUserData?.fullName || loggedInUser}
                </p>
              </div>
            </button>

            <button
              onClick={() => setIsProfileOpen(true)}
              className="btn-secondary text-xs px-2.5 py-1.5 flex items-center gap-1"
              title="Account Settings"
            >
              <span>⚙️</span>
              <span className="hidden md:inline">Account</span>
            </button>

            <button
              onClick={() => {
                setLogoutError('')
                void logout().catch((error: unknown) => {
                  setLogoutError(error instanceof Error ? error.message : 'Could not sign out.')
                })
              }}
              className="btn-danger text-xs px-3 py-1.5 flex items-center gap-1.5"
            >
              <span>🚪</span>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Account Profile Modal */}
      <AccountProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {logoutError && <div className="alert alert-error mb-4">{logoutError}</div>}
        {/* Top Specials & Kiwi Essentials Benchmark */}
        <TopSpecialsBanner />

        <ReceiptUploader />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel: Shopping Lists */}
          <aside className="lg:sticky lg:top-24 lg:h-fit">
            <ShoppingListsPanel />
          </aside>

          {/* Right Panel: Recommendations & Optimization */}
          <section>
            <RecommendationsPanel />
          </section>
        </div>
      </main>


      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm">
            © 2024 SmartGrocer NZ • Built with React + Vite • Deployed to{' '}
            <span className="text-white font-medium">Firebase & Cloudflare</span>
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
