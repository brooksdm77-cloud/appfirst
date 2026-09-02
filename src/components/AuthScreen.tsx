import React, { useState } from 'react'
import { useAppStore } from '../store/appStore'

export const AuthScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('student@uni.ac.nz')
  const [password, setPassword] = useState('password123')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const login = useAppStore((state) => state.login)
  const register = useAppStore((state) => state.register)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }

    if (login(email, password)) {
      setSuccess('Access Granted! Loading your profile...')
      setTimeout(() => window.location.reload(), 500)
    } else {
      setError('Invalid email or password')
    }
  }

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (register(email, password)) {
      setSuccess('Account created successfully! Please sign in.')
      setActiveTab('signin')
      setPassword('')
    } else {
      setError('This email is already registered')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md card shadow-xl animate-slide-in">
        <div className="mb-8 text-center">
          <h1 className="text-4xl mb-2">🛒</h1>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Smart Grocer NZ</h2>
          <p className="text-gray-600">Automated Price & Split-Trip Optimizer</p>
        </div>

        {error && (
          <div className="alert alert-error mb-4">
            <span className="font-medium">Error: {error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success mb-4">
            <span className="font-medium">✓ {success}</span>
          </div>
        )}

        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => {
              setActiveTab('signin')
              setError('')
              setSuccess('')
            }}
            className={`flex-1 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'signin'
                ? 'border-nz-primary text-nz-primary'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            🔑 Sign In
          </button>
          <button
            onClick={() => {
              setActiveTab('signup')
              setError('')
              setSuccess('')
            }}
            className={`flex-1 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'signup'
                ? 'border-nz-primary text-nz-primary'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            ✨ Sign Up
          </button>
        </div>

        {activeTab === 'signin' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                University Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="your.email@uni.ac.nz"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="Enter your password"
              />
            </div>

            <button type="submit" className="btn-primary w-full">
              Access Account
            </button>
          </form>
        )}

        {activeTab === 'signup' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="your.email@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Create Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="Minimum 6 characters"
              />
            </div>

            <button type="submit" className="btn-primary w-full">
              Create Account
            </button>
          </form>
        )}

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200 text-sm text-gray-700">
          <p className="font-medium mb-2">Demo Account:</p>
          <p>📧 student@uni.ac.nz</p>
          <p>🔒 password123</p>
        </div>
      </div>
    </div>
  )
}
