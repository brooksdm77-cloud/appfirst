export interface Product {
  name: string
  category?: string
  emoji?: string
  prices: {
    Woolworths: number
    PAKnSAVE: number
    NewWorld: number
  }
  historicAvg: number
}


export interface StorePrices {
  Woolworths: number
  PAKnSAVE: number
  NewWorld: number
}

export interface OptimizationResult {
  storeTotals: StorePrices
  bestSingleStore: string
  bestSingleTotal: number
  optimalSplitTotal: number
  savings: number
  splitBreakdown: {
    Woolworths: string[]
    PAKnSAVE: string[]
    NewWorld: string[]
  }
}

export interface DiscountedItem {
  name: string
  discount: number
  savings: number
  store: 'Woolworths' | 'PAKnSAVE' | 'NewWorld'
  currentPrice: number
  historicAvg: number
}

export interface UserAccount {
  email: string
  password: string
  lists: {
    weekly: string[]
    occasional: string[]
  }
}

export interface AppState {
  loggedInUser: string | null
  registeredAccounts: Record<string, UserAccount>
  currentUserData: UserAccount | null
}
