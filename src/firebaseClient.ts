import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAFx66B1OsvrA9bV26IVXQm3SLR4mxDDwE',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'smart-shopper-75253.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'smart-shopper-75253',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'smart-shopper-75253.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1008632531587',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1008632531587:web:9fe6df53106fddde88e9b6',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-ES7RFWFLVE',
}

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId)

const firebaseApp = isFirebaseConfigured
  ? getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig)
  : null

export const getFirebaseAuth = () => {
  if (!firebaseApp) {
    throw new Error('Firebase is not configured.')
  }
  return getAuth(firebaseApp)
}

export const getFirebaseDatabase = () => {
  if (!firebaseApp) {
    throw new Error('Firebase is not configured.')
  }
  return getFirestore(firebaseApp)
}

export const getGoogleAuthProvider = () => {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  return provider
}
