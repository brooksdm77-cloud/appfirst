import React from 'react'
import { useAppStore } from './store/appStore'
import { AuthScreen } from './components/AuthScreen'
import { ShoppingListsPanel } from './components/ShoppingListsPanel'
import { RecommendationsPanel } from './components/RecommendationsPanel'

function App() {
  const loggedInUser = useAppStore((state) => state.loggedInUser)
  const logout = useAppStore((state) => state.logout)

  if (!loggedInUser) {
    return <AuthScreen />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              🛒 Smart Grocer NZ
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              University Software Engineering Prototype — Automated Price & Split-Trip Optimizer
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Authenticated As:</span>
              <p className="font-mono text-nz-primary">{loggedInUser}</p>
            </div>
            <button
              onClick={logout}
              className="btn-danger"
            >
              🚪 Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
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
