import { useAppStore } from './store/appStore'
import { AuthScreen } from './components/AuthScreen'
import { ShoppingListsPanel } from './components/ShoppingListsPanel'
import { RecommendationsPanel } from './components/RecommendationsPanel'
import { TopSpecialsBanner } from './components/TopSpecialsBanner'
import { SupermarketLogo } from './components/SupermarketLogo'

function App() {
  const loggedInUser = useAppStore((state) => state.loggedInUser)
  const logout = useAppStore((state) => state.logout)

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

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <span className="text-[11px] text-gray-500 block">Signed in as</span>
              <p className="text-xs font-mono font-semibold text-nz-primary">{loggedInUser}</p>
            </div>
            <button
              onClick={logout}
              className="btn-danger text-xs px-3 py-1.5 flex items-center gap-1.5"
            >
              <span>🚪</span>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Top Specials & Kiwi Essentials Benchmark */}
        <TopSpecialsBanner />

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
