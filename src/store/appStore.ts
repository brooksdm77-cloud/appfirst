import { create } from 'zustand'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import {
  doc,
  runTransaction,
  type DocumentData,
} from 'firebase/firestore'
import { AppState, ReceiptPriceObservation, RegistrationData, UserAccount } from '../types'
import { getFirebaseAuth, getFirebaseDatabase, isFirebaseConfigured } from '../firebaseClient'
import {
  DEMO_ACCOUNT,
  getProductPreferenceKeys,
  NZ_SUPERMARKET_CATALOGUE,
} from '../utils/constants'

interface AppStore extends AppState {
  initializeAuth: () => () => void
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  register: (data: RegistrationData | { email: string; password: string }) => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateProfile: (updates: Partial<UserAccount>) => Promise<void>
  addItemToWeekly: (itemName: string) => Promise<boolean>
  addItemToOccasional: (itemName: string) => Promise<boolean>
  removeFromWeekly: (itemName: string) => Promise<void>
  removeFromOccasional: (itemName: string) => Promise<void>
  loadWeeklyPreset: (items: string[]) => Promise<void>
  saveReceiptProduct: (productName: string, observation: ReceiptPriceObservation) => Promise<void>
}

// ── Local Storage Keys (used when Firebase is not configured or in local demo mode) ──
const LOCAL_ACCOUNTS_KEY = 'smartgrocer-registered-accounts'
const SESSION_USER_KEY = 'smartgrocer-active-user-session'

const getInitialLocalAccounts = (): Record<string, UserAccount> => {
  const defaultDemo: UserAccount = {
    email: DEMO_ACCOUNT.email,
    password: DEMO_ACCOUNT.password,
    fullName: DEMO_ACCOUNT.fullName,
    phone: DEMO_ACCOUNT.phone,
    region: DEMO_ACCOUNT.region,
    preferredSupermarket: DEMO_ACCOUNT.preferredSupermarket,
    lists: {
      weekly: ['Anchor Blue Milk 2L', 'Tip Top Bakery Bread 700g'],
      occasional: ['Nescafe Instant Coffee 200g', "Whittaker's Creamy Milk Chocolate 250g"],
    },
    productPreferences: {},
    receiptPriceObservations: [],
  }

  if (typeof window === 'undefined') {
    return { [DEMO_ACCOUNT.email.toLowerCase()]: defaultDemo }
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_ACCOUNTS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed
      }
    }
  } catch (err) {
    console.warn('Could not read local accounts storage:', err)
  }

  // Save initial seed with demo account
  const seed = { [DEMO_ACCOUNT.email.toLowerCase()]: defaultDemo }
  try {
    window.localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(seed))
  } catch (e) {
    // ignore
  }
  return seed
}

const saveLocalAccounts = (accounts: Record<string, UserAccount>) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts))
  } catch (err) {
    console.error('Failed to save accounts to localStorage:', err)
  }
}

const createEmptyAccount = (email: string, details?: Partial<UserAccount>): UserAccount => ({
  email,
  password: details?.password,
  fullName: details?.fullName || '',
  phone: details?.phone || '',
  region: details?.region || 'Auckland',
  address: details?.address || '',
  postcode: details?.postcode || '',
  preferredSupermarket: details?.preferredSupermarket || 'Woolworths',
  lists: { weekly: [], occasional: [] },
  productPreferences: {},
  receiptPriceObservations: [],
})

const hydrateAccount = (email: string, data?: DocumentData): UserAccount => ({
  email,
  fullName: typeof data?.fullName === 'string' ? data.fullName : '',
  phone: typeof data?.phone === 'string' ? data.phone : '',
  region: typeof data?.region === 'string' ? data.region : 'Auckland',
  address: typeof data?.address === 'string' ? data.address : '',
  postcode: typeof data?.postcode === 'string' ? data.postcode : '',
  preferredSupermarket: data?.preferredSupermarket || 'Woolworths',
  lists: {
    weekly: Array.isArray(data?.lists?.weekly)
      ? data.lists.weekly.filter((item: unknown) => typeof item === 'string')
      : [],
    occasional: Array.isArray(data?.lists?.occasional)
      ? data.lists.occasional.filter((item: unknown) => typeof item === 'string')
      : [],
  },
  productPreferences:
    data?.productPreferences && typeof data.productPreferences === 'object'
      ? data.productPreferences
      : {},
  receiptPriceObservations: Array.isArray(data?.receiptPriceObservations)
    ? data.receiptPriceObservations
    : [],
})

const accountToFirestore = (account: UserAccount) => ({
  fullName: account.fullName || '',
  phone: account.phone || '',
  region: account.region || 'Auckland',
  address: account.address || '',
  postcode: account.postcode || '',
  preferredSupermarket: account.preferredSupermarket || 'Woolworths',
  lists: account.lists,
  productPreferences: account.productPreferences,
  receiptPriceObservations: account.receiptPriceObservations.slice(-200),
})

const resolveListItemName = (itemName: string, account: UserAccount): string => {
  const normalizedName = itemName.trim().toLowerCase()
  const catalogueName = Object.keys(NZ_SUPERMARKET_CATALOGUE).find(
    (name) => name.toLowerCase() === normalizedName
  )
  return catalogueName ?? account.productPreferences?.[normalizedName] ?? itemName.trim()
}

export const useAppStore = create<AppStore>((set, get) => ({
  authReady: false,
  authError: null,
  loggedInUser: null,
  currentUserData: null,

  initializeAuth: () => {
    // ── Local Fallback Mode (No Firebase configured) ──
    if (!isFirebaseConfigured) {
      try {
        const accounts = getInitialLocalAccounts()
        const savedSessionEmail = typeof window !== 'undefined'
          ? window.localStorage.getItem(SESSION_USER_KEY)
          : null

        if (savedSessionEmail && accounts[savedSessionEmail.toLowerCase()]) {
          const account = accounts[savedSessionEmail.toLowerCase()]
          set({
            authReady: true,
            loggedInUser: account.email,
            currentUserData: account,
            authError: null,
          })
        } else {
          set({
            authReady: true,
            loggedInUser: null,
            currentUserData: null,
            authError: null,
          })
        }
      } catch (err) {
        set({ authReady: true, loggedInUser: null, currentUserData: null })
      }
      return () => undefined
    }

    // ── Firebase Mode ──
    return onAuthStateChanged(getFirebaseAuth(), async (user) => {
      if (!user) {
        set({ authReady: true, loggedInUser: null, currentUserData: null, authError: null })
        return
      }
      if (!user.emailVerified) {
        set({ authReady: true, loggedInUser: null, currentUserData: null })
        return
      }

      try {
        const database = getFirebaseDatabase()
        const profileRef = doc(database, 'users', user.uid)
        const account = await runTransaction(database, async (transaction) => {
          const latest = await transaction.get(profileRef)
          if (latest.exists()) {
            return hydrateAccount(user.email ?? '', latest.data())
          }
          const newAccount = createEmptyAccount(user.email ?? '')
          transaction.set(profileRef, accountToFirestore(newAccount))
          return newAccount
        })

        set({
          authReady: true,
          loggedInUser: user.email,
          currentUserData: account,
          authError: null,
        })
      } catch (error) {
        console.error('Could not load user profile from Firestore:', error)
        set({
          authReady: true,
          loggedInUser: null,
          currentUserData: null,
          authError: 'Could not load your profile. Check your connection.',
        })
      }
    })
  },

  login: async (email, password) => {
    const cleanEmail = email.trim().toLowerCase()

    if (!isFirebaseConfigured) {
      const accounts = getInitialLocalAccounts()
      const account = accounts[cleanEmail]

      if (!account || account.password !== password) {
        throw new Error('Invalid email or password.')
      }

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(SESSION_USER_KEY, account.email)
      }

      set({
        loggedInUser: account.email,
        currentUserData: account,
        authError: null,
      })
      return
    }

    const credential = await signInWithEmailAndPassword(getFirebaseAuth(), cleanEmail, password)
    if (!credential.user.emailVerified) {
      try {
        await sendEmailVerification(credential.user)
      } finally {
        await signOut(getFirebaseAuth())
      }
      throw new Error('Your email is not verified. A new verification link has been sent to your inbox.')
    }
  },

  logout: async () => {
    if (!isFirebaseConfigured) {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(SESSION_USER_KEY)
      }
      set({ loggedInUser: null, currentUserData: null })
      return
    }
    await signOut(getFirebaseAuth())
  },

  register: async (data) => {
    const email = data.email.trim().toLowerCase()
    const password = data.password

    if (!isFirebaseConfigured) {
      const accounts = getInitialLocalAccounts()
      if (accounts[email]) {
        throw new Error('This email is already registered. Please sign in instead.')
      }

      const newAccount: UserAccount = {
        email: data.email.trim(),
        password,
        fullName: 'fullName' in data ? data.fullName : '',
        phone: 'phone' in data ? data.phone : '',
        region: 'region' in data ? data.region : 'Auckland',
        address: 'address' in data ? data.address : '',
        postcode: 'postcode' in data ? data.postcode : '',
        preferredSupermarket: 'preferredSupermarket' in data ? data.preferredSupermarket : 'Woolworths',
        lists: { weekly: [], occasional: [] },
        productPreferences: {},
        receiptPriceObservations: [],
      }

      accounts[email] = newAccount
      saveLocalAccounts(accounts)

      // Auto sign-in locally
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(SESSION_USER_KEY, newAccount.email)
      }

      set({
        loggedInUser: newAccount.email,
        currentUserData: newAccount,
        authError: null,
      })
      return
    }

    // Firebase Registration
    const credential = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password)
    const database = getFirebaseDatabase()
    const profileRef = doc(database, 'users', credential.user.uid)

    const initialAccount: UserAccount = {
      email: data.email.trim(),
      fullName: 'fullName' in data ? data.fullName : '',
      phone: 'phone' in data ? data.phone : '',
      region: 'region' in data ? data.region : 'Auckland',
      address: 'address' in data ? data.address : '',
      postcode: 'postcode' in data ? data.postcode : '',
      preferredSupermarket: 'preferredSupermarket' in data ? data.preferredSupermarket : 'Woolworths',
      lists: { weekly: [], occasional: [] },
      productPreferences: {},
      receiptPriceObservations: [],
    }

    await runTransaction(database, async (tx) => {
      tx.set(profileRef, accountToFirestore(initialAccount))
    })

    await sendEmailVerification(credential.user)
    await signOut(getFirebaseAuth())
  },

  updateProfile: async (updates) => {
    const current = get().currentUserData
    if (!current) return

    const updatedAccount: UserAccount = {
      ...current,
      ...updates,
      lists: current.lists, // maintain lists intact
    }

    if (!isFirebaseConfigured) {
      const accounts = getInitialLocalAccounts()
      accounts[current.email.toLowerCase()] = updatedAccount
      saveLocalAccounts(accounts)
      set({ currentUserData: updatedAccount })
      return
    }

    const user = getFirebaseAuth().currentUser
    if (!user) throw new Error('Not authenticated')

    const database = getFirebaseDatabase()
    const profileRef = doc(database, 'users', user.uid)
    await runTransaction(database, async (tx) => {
      tx.set(profileRef, accountToFirestore(updatedAccount), { merge: true })
    })

    set({ currentUserData: updatedAccount })
  },

  resetPassword: async (email) => {
    if (!isFirebaseConfigured) {
      const accounts = getInitialLocalAccounts()
      if (!accounts[email.trim().toLowerCase()]) {
        throw new Error('No account found with this email.')
      }
      return
    }
    await sendPasswordResetEmail(getFirebaseAuth(), email.trim())
  },

  addItemToWeekly: async (itemName) => {
    const current = get().currentUserData
    if (!current) return false

    const name = resolveListItemName(itemName, current)
    const allItems = [...current.lists.weekly, ...current.lists.occasional]
    if (!name || allItems.includes(name)) return false

    const updatedAccount: UserAccount = {
      ...current,
      lists: {
        ...current.lists,
        weekly: [...current.lists.weekly, name],
      },
    }

    if (!isFirebaseConfigured) {
      const accounts = getInitialLocalAccounts()
      accounts[current.email.toLowerCase()] = updatedAccount
      saveLocalAccounts(accounts)
      set({ currentUserData: updatedAccount })
      return true
    }

    const user = getFirebaseAuth().currentUser
    if (!user) return false

    const database = getFirebaseDatabase()
    const profileRef = doc(database, 'users', user.uid)
    await runTransaction(database, async (tx) => {
      tx.set(profileRef, accountToFirestore(updatedAccount))
    })
    set({ currentUserData: updatedAccount })
    return true
  },

  addItemToOccasional: async (itemName) => {
    const current = get().currentUserData
    if (!current) return false

    const name = resolveListItemName(itemName, current)
    const allItems = [...current.lists.weekly, ...current.lists.occasional]
    if (!name || allItems.includes(name)) return false

    const updatedAccount: UserAccount = {
      ...current,
      lists: {
        ...current.lists,
        occasional: [...current.lists.occasional, name],
      },
    }

    if (!isFirebaseConfigured) {
      const accounts = getInitialLocalAccounts()
      accounts[current.email.toLowerCase()] = updatedAccount
      saveLocalAccounts(accounts)
      set({ currentUserData: updatedAccount })
      return true
    }

    const user = getFirebaseAuth().currentUser
    if (!user) return false

    const database = getFirebaseDatabase()
    const profileRef = doc(database, 'users', user.uid)
    await runTransaction(database, async (tx) => {
      tx.set(profileRef, accountToFirestore(updatedAccount))
    })
    set({ currentUserData: updatedAccount })
    return true
  },

  removeFromWeekly: async (itemName) => {
    const current = get().currentUserData
    if (!current) return

    const updatedAccount: UserAccount = {
      ...current,
      lists: {
        ...current.lists,
        weekly: current.lists.weekly.filter((i) => i !== itemName),
      },
    }

    if (!isFirebaseConfigured) {
      const accounts = getInitialLocalAccounts()
      accounts[current.email.toLowerCase()] = updatedAccount
      saveLocalAccounts(accounts)
      set({ currentUserData: updatedAccount })
      return
    }

    const user = getFirebaseAuth().currentUser
    if (!user) return

    const database = getFirebaseDatabase()
    const profileRef = doc(database, 'users', user.uid)
    await runTransaction(database, async (tx) => {
      tx.set(profileRef, accountToFirestore(updatedAccount))
    })
    set({ currentUserData: updatedAccount })
  },

  removeFromOccasional: async (itemName) => {
    const current = get().currentUserData
    if (!current) return

    const updatedAccount: UserAccount = {
      ...current,
      lists: {
        ...current.lists,
        occasional: current.lists.occasional.filter((i) => i !== itemName),
      },
    }

    if (!isFirebaseConfigured) {
      const accounts = getInitialLocalAccounts()
      accounts[current.email.toLowerCase()] = updatedAccount
      saveLocalAccounts(accounts)
      set({ currentUserData: updatedAccount })
      return
    }

    const user = getFirebaseAuth().currentUser
    if (!user) return

    const database = getFirebaseDatabase()
    const profileRef = doc(database, 'users', user.uid)
    await runTransaction(database, async (tx) => {
      tx.set(profileRef, accountToFirestore(updatedAccount))
    })
    set({ currentUserData: updatedAccount })
  },

  loadWeeklyPreset: async (items) => {
    const current = get().currentUserData
    if (!current) return

    const updatedAccount: UserAccount = {
      ...current,
      lists: {
        weekly: [...items],
        occasional: current.lists.occasional.filter((i) => !items.includes(i)),
      },
    }

    if (!isFirebaseConfigured) {
      const accounts = getInitialLocalAccounts()
      accounts[current.email.toLowerCase()] = updatedAccount
      saveLocalAccounts(accounts)
      set({ currentUserData: updatedAccount })
      return
    }

    const user = getFirebaseAuth().currentUser
    if (!user) return

    const database = getFirebaseDatabase()
    const profileRef = doc(database, 'users', user.uid)
    await runTransaction(database, async (tx) => {
      tx.set(profileRef, accountToFirestore(updatedAccount))
    })
    set({ currentUserData: updatedAccount })
  },

  saveReceiptProduct: async (productName, observation) => {
    const current = get().currentUserData
    if (!current) return

    const preferences = { ...(current.productPreferences || {}) }
    getProductPreferenceKeys(productName).forEach((key) => {
      preferences[key] = productName
    })

    const updatedAccount: UserAccount = {
      ...current,
      productPreferences: preferences,
      receiptPriceObservations: [...(current.receiptPriceObservations || []), observation].slice(-200),
    }

    if (!isFirebaseConfigured) {
      const accounts = getInitialLocalAccounts()
      accounts[current.email.toLowerCase()] = updatedAccount
      saveLocalAccounts(accounts)
      set({ currentUserData: updatedAccount })
      return
    }

    const user = getFirebaseAuth().currentUser
    if (!user) return

    const database = getFirebaseDatabase()
    const profileRef = doc(database, 'users', user.uid)
    await runTransaction(database, async (tx) => {
      tx.set(profileRef, accountToFirestore(updatedAccount))
    })
    set({ currentUserData: updatedAccount })
  },
}))
