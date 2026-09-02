import { Product } from '../types'

export const NZ_SUPERMARKET_CATALOGUE: Record<string, Product> = {
  "Whittaker's Creamy Milk Chocolate 250g": {
    name: "Whittaker's Creamy Milk Chocolate 250g",
    prices: {
      Woolworths: 6.80,
      PAKnSAVE: 5.99,
      NewWorld: 6.50,
    },
    historicAvg: 6.70,
  },
  "Anchor Blue Milk 2L": {
    name: "Anchor Blue Milk 2L",
    prices: {
      Woolworths: 4.50,
      PAKnSAVE: 3.98,
      NewWorld: 4.25,
    },
    historicAvg: 4.45,
  },
  "Tip Top Bakery Bread 700g": {
    name: "Tip Top Bakery Bread 700g",
    prices: {
      Woolworths: 3.10,
      PAKnSAVE: 2.89,
      NewWorld: 3.40,
    },
    historicAvg: 3.35,
  },
  "Mainland Tasty Cheese 700g": {
    name: "Mainland Tasty Cheese 700g",
    prices: {
      Woolworths: 13.90,
      PAKnSAVE: 11.95,
      NewWorld: 12.99,
    },
    historicAvg: 13.50,
  },
  "Nescafe Instant Coffee 200g": {
    name: "Nescafe Instant Coffee 200g",
    prices: {
      Woolworths: 7.50,
      PAKnSAVE: 10.50,
      NewWorld: 9.99,
    },
    historicAvg: 10.20,
  },
  "Watties Baked Beans 420g": {
    name: "Watties Baked Beans 420g",
    prices: {
      Woolworths: 2.60,
      PAKnSAVE: 1.95,
      NewWorld: 2.20,
    },
    historicAvg: 2.50,
  },
}

export const STORE_NAMES = ["Woolworths", "PAKnSAVE", "NewWorld"] as const
export const DISCOUNT_THRESHOLD = 0.88 // 12% discount
export const DEMO_ACCOUNT = {
  email: "student@uni.ac.nz",
  password: "password123",
}
