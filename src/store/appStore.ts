import { create } from 'zustand'
import { AppState, UserAccount } from '../types'
import { DEMO_ACCOUNT, NZ_SUPERMARKET_CATALOGUE } from '../utils/constants'

const initialRegisteredAccounts: Record<string, UserAccount> = {
  [DEMO_ACCOUNT.email]: {
    email: DEMO_ACCOUNT.email,
    password: DEMO_ACCOUNT.password,
    lists: {
      weekly: ['Anchor Blue Milk 2L', 'Tip Top Bakery Bread 700g'],
      occasional: ['Nescafe Instant Coffee 200g', "Whittaker's Creamy Milk Chocolate 250g"],
    },
  },
}

interface AppStore extends AppState {
  login: (email: string, password: string) => boolean
  logout: () => void
  register: (email: string, password: string) => boolean
  addItemToWeekly: (itemName: string) => boolean
  addItemToOccasional: (itemName: string) => boolean
  removeFromWeekly: (itemName: string) => void
  removeFromOccasional: (itemName: string) => void
}

export const useAppStore = create<AppStore>((set, get) => ({
  loggedInUser: null,
  registeredAccounts: initialRegisteredAccounts,
  currentUserData: null,

  login: (email: string, password: string) => {
    const state = get()
    const account = state.registeredAccounts[email]

    if (account && account.password === password) {
      set({
        loggedInUser: email,
        currentUserData: account,
      })
      return true
    }
    return false
  },

  logout: () => {
    set({
      loggedInUser: null,
      currentUserData: null,
    })
  },

  register: (email: string, password: string) => {
    const state = get()

    if (state.registeredAccounts[email]) {
      return false // Account already exists
    }

    const newAccount: UserAccount = {
      email,
      password,
      lists: {
        weekly: [],
        occasional: [],
      },
    }

    set({
      registeredAccounts: {
        ...state.registeredAccounts,
        [email]: newAccount,
      },
    })

    return true
  },

  addItemToWeekly: (itemName: string) => {
    const state = get()
    if (!state.currentUserData) return false

    const allItems = [...state.currentUserData.lists.weekly, ...state.currentUserData.lists.occasional]
    if (allItems.includes(itemName)) return false

    const updatedData = {
      ...state.currentUserData,
      lists: {
        ...state.currentUserData.lists,
        weekly: [...state.currentUserData.lists.weekly, itemName],
      },
    }

    set({
      currentUserData: updatedData,
      registeredAccounts: {
        ...state.registeredAccounts,
        [state.loggedInUser!]: updatedData,
      },
    })

    return true
  },

  addItemToOccasional: (itemName: string) => {
    const state = get()
    if (!state.currentUserData) return false

    const allItems = [...state.currentUserData.lists.weekly, ...state.currentUserData.lists.occasional]
    if (allItems.includes(itemName)) return false

    const updatedData = {
      ...state.currentUserData,
      lists: {
        ...state.currentUserData.lists,
        occasional: [...state.currentUserData.lists.occasional, itemName],
      },
    }

    set({
      currentUserData: updatedData,
      registeredAccounts: {
        ...state.registeredAccounts,
        [state.loggedInUser!]: updatedData,
      },
    })

    return true
  },

  removeFromWeekly: (itemName: string) => {
    const state = get()
    if (!state.currentUserData) return

    const updatedData = {
      ...state.currentUserData,
      lists: {
        ...state.currentUserData.lists,
        weekly: state.currentUserData.lists.weekly.filter((item) => item !== itemName),
      },
    }

    set({
      currentUserData: updatedData,
      registeredAccounts: {
        ...state.registeredAccounts,
        [state.loggedInUser!]: updatedData,
      },
    })
  },

  removeFromOccasional: (itemName: string) => {
    const state = get()
    if (!state.currentUserData) return

    const updatedData = {
      ...state.currentUserData,
      lists: {
        ...state.currentUserData.lists,
        occasional: state.currentUserData.lists.occasional.filter((item) => item !== itemName),
      },
    }

    set({
      currentUserData: updatedData,
      registeredAccounts: {
        ...state.registeredAccounts,
        [state.loggedInUser!]: updatedData,
      },
    })
  },
}))
