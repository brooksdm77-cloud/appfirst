export const CHECKOUT_RETAILERS = ['Woolworths', 'PAKnSAVE', 'NewWorld'] as const

export type CheckoutRetailer = (typeof CHECKOUT_RETAILERS)[number]

export interface CheckoutItem {
  productName: string
  quantity: number
  barcode?: string
}

export interface PreparedCheckout {
  retailer: CheckoutRetailer
  checkoutUrl: string
  mode: 'manual' | 'cart'
  affiliateTracking: 'inactive' | 'active'
}

export interface RetailerCheckoutProvider {
  prepareCheckout: (items: CheckoutItem[]) => Promise<PreparedCheckout>
}

const onlineShopUrls: Record<CheckoutRetailer, string> = {
  Woolworths: 'https://www.woolworths.co.nz/shop/',
  PAKnSAVE: 'https://www.paknsave.co.nz/shop/',
  NewWorld: 'https://www.newworld.co.nz/shop/',
}

const createManualProvider = (retailer: CheckoutRetailer): RetailerCheckoutProvider => ({
  async prepareCheckout(items) {
    if (items.length === 0) {
      throw new Error('Add at least one item to the selected shopping list first.')
    }

    return {
      retailer,
      checkoutUrl: onlineShopUrls[retailer],
      mode: 'manual',
      affiliateTracking: 'inactive',
    }
  },
})

const checkoutProviders: Record<CheckoutRetailer, RetailerCheckoutProvider> = {
  Woolworths: createManualProvider('Woolworths'),
  PAKnSAVE: createManualProvider('PAKnSAVE'),
  NewWorld: createManualProvider('NewWorld'),
}

export const prepareRetailerCheckout = (
  retailer: CheckoutRetailer,
  items: CheckoutItem[],
): Promise<PreparedCheckout> => {
  const validItems = items.filter(
    (item) => item.productName.trim() && Number.isInteger(item.quantity) && item.quantity > 0,
  )

  if (validItems.length !== items.length) {
    return Promise.reject(new Error('Shopping list contains an invalid item or quantity.'))
  }

  return checkoutProviders[retailer].prepareCheckout(validItems)
}

export const formatCheckoutList = (items: CheckoutItem[]): string =>
  items.map(({ productName, quantity }) => `${quantity} × ${productName}`).join('\n')
