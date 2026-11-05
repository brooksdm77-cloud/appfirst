import React, { useState } from 'react'
import { useAppStore } from '../store/appStore'
import { SupermarketLogo } from './SupermarketLogo'
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
  const loginWithGoogle = useAppStore((state) => state.loginWithGoogle)
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
    } catch (caught: any) {
      if (
        caught?.code === 'auth/invalid-credential' ||
        caught?.code === 'auth/wrong-password' ||
        caught?.code === 'auth/user-not-found'
      ) {
        setError(
          'Incorrect email or password. If you do not have an account yet, click "Create account" above or use "Continue with Google".'
        )
      } else {
        setError(caught instanceof Error ? caught.message : 'Invalid credentials.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      await loginWithGoogle()
      setSuccess('Signed in with Google! Welcome.')
    } catch (caught: any) {
      if (caught?.code === 'auth/popup-closed-by-user') {
        // User closed popup without signing in
        return
      }
      if (caught?.code === 'auth/unauthorized-domain') {
        setError(
          'This domain is not yet authorized in Firebase. Please add your Cloudflare domain (e.g. appfirst.pages.dev) to Firebase Console > Authentication > Settings > Authorized domains.'
        )
        return
      }
      if (caught?.code === 'auth/operation-not-allowed') {
        setError('Google Sign-In is not enabled yet in your Firebase Console.')
        return
      }
      setError(caught instanceof Error ? caught.message : 'Google sign-in failed.')
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
      setSuccess(`Welcome to SmartGrocer NZ, ${fullName || 'Shopper'}! You are now logged in.`)
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

        {/* Google Authentication Button */}
        <div className="mt-5">
          <button
            type="button"
            onClick={() => void handleGoogleSignIn()}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>
        </div>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-3 font-medium text-gray-500">Or continue with email</span>
          </div>
        </div>

        {/* Demo Quick Start Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
          <span>Try without registering:</span>
          <button
            type="button"
            onClick={() => void handleQuickDemo()}
            disabled={loading}
            className="rounded-md bg-blue-600 px-3 py-1.5 font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
          >
            ⚡ Quick Demo Sign In
          </button>
        </div>

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
