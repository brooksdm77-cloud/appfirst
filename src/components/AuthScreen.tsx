import React, { useState } from 'react'
import { useAppStore } from '../store/appStore'
import { SupermarketLogo } from './SupermarketLogo'
import { isFirebaseConfigured } from '../firebaseClient'
import { DEMO_ACCOUNT, NZ_REGIONS, STORE_NAMES, SUPERMARKET_METADATA } from '../utils/constants'

export const AuthScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [postcode, setPostcode] = useState('')
  const [region, setRegion] = useState('Auckland')
  const [preferredSupermarket, setPreferredSupermarket] = useState<'Woolworths' | 'PAKnSAVE' | 'NewWorld'>('PAKnSAVE')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const login = useAppStore((state) => state.login)
  const register = useAppStore((state) => state.register)
  const resetPassword = useAppStore((state) => state.resetPassword)
  const authError = useAppStore((state) => state.authError)

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      await login(email, password)
      setSuccess('Signed in successfully! Loading your profile...')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Invalid credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickDemo = async () => {
    setError('')
    setSuccess('')
    setLoading(true)
    setEmail(DEMO_ACCOUNT.email)
    setPassword(DEMO_ACCOUNT.password)
    try {
      await login(DEMO_ACCOUNT.email, DEMO_ACCOUNT.password)
      setSuccess('Demo signed in! Welcome, Kiwi Shopper.')
    } catch {
      try {
        await register({
          email: DEMO_ACCOUNT.email,
          password: DEMO_ACCOUNT.password,
          fullName: DEMO_ACCOUNT.fullName,
          phone: DEMO_ACCOUNT.phone,
          region: DEMO_ACCOUNT.region,
          preferredSupermarket: DEMO_ACCOUNT.preferredSupermarket,
        })
        setSuccess('Demo signed in! Welcome, Kiwi Shopper.')
      } catch (registrationError) {
        setError(registrationError instanceof Error ? registrationError.message : 'Could not launch demo account.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    if (!signupEmail.trim() || !signupPassword.trim()) {
      setError('Email and password are required.')
      return
    }
    if (signupPassword.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (!/^\d{4}$/.test(postcode.trim())) {
      setError('Enter a valid 4-digit New Zealand postcode so we can find nearby supermarket prices.')
      return
    }

    setLoading(true)
    try {
      await register({
        email: signupEmail,
        password: signupPassword,
        fullName,
        phone,
        address,
        postcode: postcode.trim(),
        region,
        preferredSupermarket,
      })
      if (isFirebaseConfigured) {
        setSuccess('Account created! Please check your email for verification, then sign in.')
        setActiveTab('signin')
        setEmail(signupEmail)
        setPassword('')
      } else {
        setSuccess(`Welcome to SmartGrocer NZ, ${fullName || 'Shopper'}! You are now logged in.`)
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordReset = async () => {
    setError('')
    setSuccess('')
    if (!email.trim()) {
      setError('Please enter your email address in the field above first.')
      return
    }
    setLoading(true)
    try {
      await resetPassword(email)
      setSuccess('Password reset instructions have been sent if this email is registered.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not process password reset.')
    } finally {
      setLoading(false)
    }
  }

  const inputClassName =
    'mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 px-4 py-10 text-gray-900">
      <header className="mx-auto mb-8 flex max-w-5xl flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black">
            <span>🛒</span>
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 bg-clip-text text-transparent">
              SmartGrocer NZ
            </span>
          </h1>
          <p className="mt-1 text-sm text-gray-600">Compare supermarket prices and plan smarter shopping trips.</p>
        </div>
        <div className="flex items-center gap-3">
          <SupermarketLogo store="Woolworths" size="xs" />
          <SupermarketLogo store="PAKnSAVE" size="xs" />
          <SupermarketLogo store="NewWorld" size="xs" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-xl sm:p-8">
        <h2 className="text-xl font-bold">Your shopping, made smarter</h2>
        <p className="mt-1 text-sm text-gray-600">Sign in or create an account to manage your shopping lists.</p>

        {!isFirebaseConfigured && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
            <span>Try the app with a demo session.</span>
            <button
              type="button"
              onClick={() => void handleQuickDemo()}
              disabled={loading}
              className="rounded-md bg-blue-600 px-3 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Quick demo
            </button>
          </div>
        )}

        {(error || authError) && (
          <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {error || authError}
          </div>
        )}
        {success && (
          <div role="status" className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
            {success}
          </div>
        )}

        <div className="mt-6 flex border-b border-gray-200">
          {(['signin', 'signup'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setActiveTab(tab)
                setError('')
                setSuccess('')
              }}
              className={`flex-1 border-b-2 px-3 py-2.5 text-sm font-medium ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          ))}
        </div>

        {activeTab === 'signin' ? (
          <form onSubmit={handleLogin} className="mt-5 space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Email address
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
                className={inputClassName}
              />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
                className={inputClassName}
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
            <button
              type="button"
              onClick={() => void handlePasswordReset()}
              disabled={loading}
              className="w-full text-sm font-medium text-blue-700 hover:underline disabled:opacity-50"
            >
              Forgot password?
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="mt-5 space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Full name
              <input
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                autoComplete="name"
                required
                className={inputClassName}
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-medium text-gray-700">
                Email address
                <input
                  type="email"
                  value={signupEmail}
                  onChange={(event) => setSignupEmail(event.target.value)}
                  autoComplete="email"
                  required
                  className={inputClassName}
                />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Phone (optional)
                <input
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  autoComplete="tel"
                  className={inputClassName}
                />
              </label>
            </div>
            <label className="block text-sm font-medium text-gray-700">
              Address
              <input
                type="text"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                autoComplete="street-address"
                placeholder="Street address and suburb"
                className={inputClassName}
              />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              New Zealand postcode
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{4}"
                maxLength={4}
                value={postcode}
                onChange={(event) => setPostcode(event.target.value.replace(/\D/g, '').slice(0, 4))}
                autoComplete="postal-code"
                placeholder="e.g. 6011"
                required
                aria-describedby="signup-postcode-help"
                className={inputClassName}
              />
              <span id="signup-postcode-help" className="mt-1 block text-xs font-normal text-gray-500">
                Used to identify nearby supermarkets and local prices.
              </span>
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-medium text-gray-700">
                New Zealand region
                <select value={region} onChange={(event) => setRegion(event.target.value)} className={inputClassName}>
                  {NZ_REGIONS.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Preferred supermarket
                <select
                  value={preferredSupermarket}
                  onChange={(event) =>
                    setPreferredSupermarket(event.target.value as 'Woolworths' | 'PAKnSAVE' | 'NewWorld')
                  }
                  className={inputClassName}
                >
                  {STORE_NAMES.map((store) => (
                    <option key={store} value={store}>{SUPERMARKET_METADATA[store].name}</option>
                  ))}
                </select>
              </label>
            </div>
            <label className="block text-sm font-medium text-gray-700">
              Password
              <input
                type="password"
                value={signupPassword}
                onChange={(event) => setSignupPassword(event.target.value)}
                autoComplete="new-password"
                minLength={6}
                required
                className={inputClassName}
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating account…' : 'Create customer account'}
            </button>
          </form>
        )}
      </main>
      <p className="mx-auto mt-6 max-w-lg text-center text-xs text-gray-500">
        Prices shown in the app are sample data and may not reflect current supermarket prices.
      </p>
    </div>
  )
}
