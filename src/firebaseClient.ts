import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean)

const firebaseApp = isFirebaseConfigured
  ? getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig)
  : null

export const getFirebaseAuth = () => {
  if (!firebaseApp) {
    throw new Error('Firebase is not configured. Follow the setup instructions in README.md.')
  }
  return getAuth(firebaseApp)
}

export const getFirebaseDatabase = () => {
  if (!firebaseApp) {
    throw new Error('Firebase is not configured. Follow the setup instructions in README.md.')
  }
  return getFirestore(firebaseApp)
}
