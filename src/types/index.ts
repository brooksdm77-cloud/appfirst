export interface Product {
  name: string
  category?: string
  emoji?: string
  prices: StorePrices | null
  historicAvg: number | null
  priceStatus: 'sample' | 'unavailable'
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
  pricedItemCount: number
  unpricedItems: string[]
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
  password?: string
  fullName?: string
  phone?: string
  region?: string
  address?: string
  postcode?: string
  preferredSupermarket?: 'Woolworths' | 'PAKnSAVE' | 'NewWorld'
  lists: {
    weekly: string[]
    occasional: string[]
  }
  productPreferences: Record<string, string>
  receiptPriceObservations: ReceiptPriceObservation[]
}

export interface RegistrationData {
  email: string
  password: string
  fullName?: string
  phone?: string
  region?: string
  address?: string
  postcode?: string
  preferredSupermarket?: 'Woolworths' | 'PAKnSAVE' | 'NewWorld'
}

export interface ReceiptPriceObservation {
  productName: string
  store: 'Woolworths' | 'PAKnSAVE' | 'NewWorld'
  price: number
  purchasedAt: string
}

export interface AppState {
  authReady: boolean
  authError: string | null
  loggedInUser: string | null
  currentUserData: UserAccount | null
}
