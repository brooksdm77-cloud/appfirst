import { Product } from '../types'

export const NZ_SUPERMARKET_CATALOGUE: Record<string, Product> = {
  // --- Dairy & Eggs ---
  "Anchor Blue Milk 2L": {
    name: "Anchor Blue Milk 2L",
    category: "Dairy & Eggs",
    emoji: "🥛",
    prices: {
      Woolworths: 4.50,
      PAKnSAVE: 3.98,
      NewWorld: 4.25,
    },
    historicAvg: 4.45,
  },
  "Mainland Tasty Cheese 700g": {
    name: "Mainland Tasty Cheese 700g",
    category: "Dairy & Eggs",
    emoji: "🧀",
    prices: {
      Woolworths: 13.90,
      PAKnSAVE: 11.95,
      NewWorld: 12.99,
    },
    historicAvg: 13.50,
  },
  "Farmer Brown Free Range Eggs 12pk": {
    name: "Farmer Brown Free Range Eggs 12pk",
    category: "Dairy & Eggs",
    emoji: "🥚",
    prices: {
      Woolworths: 9.20,
      PAKnSAVE: 8.89,
      NewWorld: 7.99, // TOP SPECIAL TODAY AT NEW WORLD
    },
    historicAvg: 9.80,
  },
  "Tararua Salted Butter 500g": {
    name: "Tararua Salted Butter 500g",
    category: "Dairy & Eggs",
    emoji: "🧈",
    prices: {
      Woolworths: 6.99,
      PAKnSAVE: 5.79,
      NewWorld: 6.49,
    },
    historicAvg: 6.80,
  },

  // --- Bakery ---
  "Tip Top Bakery Bread 700g": {
    name: "Tip Top Bakery Bread 700g",
    category: "Bakery",
    emoji: "🍞",
    prices: {
      Woolworths: 3.10,
      PAKnSAVE: 2.89,
      NewWorld: 3.40,
    },
    historicAvg: 3.35,
  },
  "Quality Bakers English Muffins 6pk": {
    name: "Quality Bakers English Muffins 6pk",
    category: "Bakery",
    emoji: "🥯",
    prices: {
      Woolworths: 4.20,
      PAKnSAVE: 3.79,
      NewWorld: 4.10,
    },
    historicAvg: 4.25,
  },

  // --- Fresh Produce ---
  "Fresh Bananas 1kg": {
    name: "Fresh Bananas 1kg",
    category: "Fresh Produce",
    emoji: "🍌",
    prices: {
      Woolworths: 3.99,
      PAKnSAVE: 3.49,
      NewWorld: 3.89,
    },
    historicAvg: 3.95,
  },
  "Royal Gala Apples 1.5kg": {
    name: "Royal Gala Apples 1.5kg",
    category: "Fresh Produce",
    emoji: "🍎",
    prices: {
      Woolworths: 4.90,
      PAKnSAVE: 4.29,
      NewWorld: 4.80,
    },
    historicAvg: 4.99,
  },
  "Broccoli Fresh Crown": {
    name: "Broccoli Fresh Crown",
    category: "Fresh Produce",
    emoji: "🥦",
    prices: {
      Woolworths: 2.49,
      PAKnSAVE: 1.89,
      NewWorld: 2.29,
    },
    historicAvg: 2.60,
  },
  "Agria Potatoes 2kg Bag": {
    name: "Agria Potatoes 2kg Bag",
    category: "Fresh Produce",
    emoji: "🥔",
    prices: {
      Woolworths: 6.20,
      PAKnSAVE: 5.49,
      NewWorld: 5.99,
    },
    historicAvg: 6.40,
  },

  // --- Meat & Poultry ---
  "Chicken Breast Fillets 1kg": {
    name: "Chicken Breast Fillets 1kg",
    category: "Meat & Poultry",
    emoji: "🍗",
    prices: {
      Woolworths: 14.50,
      PAKnSAVE: 12.99,
      NewWorld: 14.80,
    },
    historicAvg: 15.20,
  },
  "Prime Beef Mince 1kg": {
    name: "Prime Beef Mince 1kg",
    category: "Meat & Poultry",
    emoji: "🥩",
    prices: {
      Woolworths: 17.50,
      PAKnSAVE: 15.80,
      NewWorld: 16.90,
    },
    historicAvg: 17.80,
  },

  // --- Pantry & Breakfast ---
  "Sanitarium Weet-Bix 1kg": {
    name: "Sanitarium Weet-Bix 1kg",
    category: "Pantry & Breakfast",
    emoji: "🥣",
    prices: {
      Woolworths: 6.40,
      PAKnSAVE: 4.89, // TOP SPECIAL TODAY AT PAKnSAVE
      NewWorld: 6.20,
    },
    historicAvg: 6.50,
  },
  "Nescafe Instant Coffee 200g": {
    name: "Nescafe Instant Coffee 200g",
    category: "Pantry & Breakfast",
    emoji: "☕",
    prices: {
      Woolworths: 7.50, // TOP SPECIAL TODAY AT WOOLWORTHS
      PAKnSAVE: 10.50,
      NewWorld: 9.99,
    },
    historicAvg: 10.20,
  },
  "Watties Baked Beans 420g": {
    name: "Watties Baked Beans 420g",
    category: "Pantry & Breakfast",
    emoji: "🥫",
    prices: {
      Woolworths: 2.60,
      PAKnSAVE: 1.89,
      NewWorld: 2.20,
    },
    historicAvg: 2.50,
  },
  "Watties Tomato Sauce 560g": {
    name: "Watties Tomato Sauce 560g",
    category: "Pantry & Breakfast",
    emoji: "🍅",
    prices: {
      Woolworths: 3.80,
      PAKnSAVE: 3.29,
      NewWorld: 3.70,
    },
    historicAvg: 3.90,
  },

  // --- Treats & Household ---
  "Whittaker's Creamy Milk Chocolate 250g": {
    name: "Whittaker's Creamy Milk Chocolate 250g",
    category: "Treats & Household",
    emoji: "🍫",
    prices: {
      Woolworths: 6.80,
      PAKnSAVE: 5.49, // TOP SPECIAL TODAY
      NewWorld: 6.50,
    },
    historicAvg: 6.70,
  },
  "Purex Soft Toilet Tissue 12pk": {
    name: "Purex Soft Toilet Tissue 12pk",
    category: "Treats & Household",
    emoji: "🧻",
    prices: {
      Woolworths: 9.80,
      PAKnSAVE: 8.49,
      NewWorld: 9.20,
    },
    historicAvg: 9.99,
  },
}

export const STORE_NAMES = ["Woolworths", "PAKnSAVE", "NewWorld"] as const

export const STORE_DISPLAY_NAMES: Record<string, string> = {
  Woolworths: 'Woolworths',
  PAKnSAVE: "PAK'nSAVE",
  NewWorld: 'New World',
}

export interface SupermarketMeta {
  id: 'Woolworths' | 'PAKnSAVE' | 'NewWorld'
  name: string
  shortName: string
  primaryColor: string
  accentColor: string
  tagline: string
}

export const SUPERMARKET_METADATA: Record<'Woolworths' | 'PAKnSAVE' | 'NewWorld', SupermarketMeta> = {
  Woolworths: {
    id: 'Woolworths',
    name: 'Woolworths',
    shortName: 'Woolies',
    primaryColor: '#007a3d',
    accentColor: '#128842',
    tagline: "The Fresh Food People",
  },
  PAKnSAVE: {
    id: 'PAKnSAVE',
    name: "PAK'nSAVE",
    shortName: "PAK'nSAVE",
    primaryColor: '#FFE600',
    accentColor: '#000000',
    tagline: "NZ's Lowest Food Prices",
  },
  NewWorld: {
    id: 'NewWorld',
    name: 'New World',
    shortName: 'New World',
    primaryColor: '#DA291C',
    accentColor: '#DA291C',
    tagline: "Always Someone to Say Hello",
  },
}

// Everyday essentials an average Kiwi household buys on a weekly basis
export const GENERIC_WEEKLY_ESSENTIALS: string[] = [
  "Anchor Blue Milk 2L",
  "Tip Top Bakery Bread 700g",
  "Farmer Brown Free Range Eggs 12pk",
  "Mainland Tasty Cheese 700g",
  "Fresh Bananas 1kg",
  "Chicken Breast Fillets 1kg",
  "Tararua Salted Butter 500g",
  "Sanitarium Weet-Bix 1kg",
  "Royal Gala Apples 1.5kg",
  "Broccoli Fresh Crown",
  "Watties Baked Beans 420g",
]

export const DISCOUNT_THRESHOLD = 0.88 // 12% discount
export const DEMO_ACCOUNT = {
  email: "student@uni.ac.nz",
  password: "password123",
}
