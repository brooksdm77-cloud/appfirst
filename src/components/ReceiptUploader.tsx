import React, { useState } from 'react'
import { createWorker } from 'tesseract.js'
import { useAppStore } from '../store/appStore'
import { NZ_SUPERMARKET_CATALOGUE } from '../utils/constants'
import { ReceiptPriceObservation } from '../types'

type StoreName = ReceiptPriceObservation['store']

interface ReceiptRow {
  id: number
  description: string
  price: string
  productName: string
  confirmed: boolean
  skip: boolean
  addToWeekly: boolean
}

const receiptPricePattern = /(?:\$|NZD\s*)?\s*(\d{1,3}(?:,\d{3})*|\d+)\.(\d{2})\s*$/i
const ignoredReceiptLinePattern = /\b(subtotal|total|gst|tax|change|cash|eftpos|visa|mastercard|savings?)\b/i

const suggestProduct = (description: string): string => {
  const descriptionWords = new Set(description.toLowerCase().match(/[a-z0-9]+/g) ?? [])
  let bestMatch = ''
  let bestScore = 0

  Object.keys(NZ_SUPERMARKET_CATALOGUE).forEach((productName) => {
    const words = productName.toLowerCase().match(/[a-z0-9]+/g) ?? []
    const matchedWords = words.filter((word) => descriptionWords.has(word)).length
    const score = matchedWords / words.length
    if (score > bestScore) {
      bestScore = score
      bestMatch = productName
    }
  })

  return bestScore >= 0.25 ? bestMatch : ''
}

const normalizeProductName = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ')

const parseReceiptRows = (text: string): ReceiptRow[] => {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !ignoredReceiptLinePattern.test(line))
    .flatMap((line, index) => {
      const priceMatch = line.match(receiptPricePattern)
      if (!priceMatch) return []

      const price = Number(`${priceMatch[1].replace(/,/g, '')}.${priceMatch[2]}`)
      const description = line.slice(0, priceMatch.index).replace(/[\s:*-]+$/, '').trim()
      if (!description || price <= 0) return []
      const productName = suggestProduct(description)
      const exactCatalogueMatch = Object.keys(NZ_SUPERMARKET_CATALOGUE).some(
        (name) => normalizeProductName(name) === normalizeProductName(description)
      )

      return [{
        id: index,
        description,
        price: price.toFixed(2),
        productName,
        confirmed: exactCatalogueMatch,
        skip: false,
        addToWeekly: true,
      }]
    })
}

const localDate = (): string => {
  const now = new Date()
  const timezoneOffset = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - timezoneOffset).toISOString().slice(0, 10)
}

export const ReceiptUploader: React.FC = () => {
  const currentUserData = useAppStore((state) => state.currentUserData)
  const addItemToWeekly = useAppStore((state) => state.addItemToWeekly)
  const saveReceiptProduct = useAppStore((state) => state.saveReceiptProduct)
  const [file, setFile] = useState<File | null>(null)
  const [rows, setRows] = useState<ReceiptRow[]>([])
  const [store, setStore] = useState<StoreName | ''>('')
  const [purchasedAt, setPurchasedAt] = useState(localDate)
  const [status, setStatus] = useState<'idle' | 'processing' | 'review' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')

  if (!currentUserData) return null

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] ?? null
    setFile(selectedFile)
    setRows([])
    setMessage('')
    setStatus('idle')
  }

  const processReceipt = async () => {
    if (!file) return

    setStatus('processing')
    setMessage('Reading receipt text. No image is saved by this app.')
    let worker: Awaited<ReturnType<typeof createWorker>> | undefined

    try {
      worker = await createWorker('eng', 1)
      const { data } = await worker.recognize(file)
      const receiptRows = parseReceiptRows(data.text)
      setRows(receiptRows)
      setStatus('review')
      setMessage(
        receiptRows.length
          ? 'Review each line, correct product matches and prices, and select the supermarket before saving.'
          : 'No priced item lines were detected. Try a clearer image or a different receipt.'
      )
    } catch (error) {
      console.error('Receipt OCR failed:', error)
      setStatus('error')
      setMessage(error instanceof Error ? `Could not read receipt: ${error.message}` : 'Could not read the receipt.')
    } finally {
      await worker?.terminate()
    }
  }

  const updateRow = (id: number, updates: Partial<ReceiptRow>) => {
    setRows((currentRows) =>
      currentRows.map((row) => (row.id === id ? { ...row, ...updates } : row))
    )
  }

  const saveReceipt = async () => {
    if (!store) {
      setMessage('Choose the supermarket shown on the receipt before saving.')
      return
    }
    if (!purchasedAt) {
      setMessage('Enter the purchase date shown on the receipt before saving.')
      return
    }

    if (rows.some((row) => !row.confirmed)) {
      setMessage('Confirm or skip every uncertain receipt line before saving.')
      return
    }

    const confirmedRows = rows.filter((row) => row.productName && !row.skip)
    if (confirmedRows.length === 0) {
      setMessage('Choose a product for at least one receipt line before saving.')
      return
    }
    if (confirmedRows.some((row) => !Number.isFinite(Number(row.price)) || Number(row.price) <= 0)) {
      setMessage('Correct the detected price for every selected product before saving.')
      return
    }

    let addedCount = 0
    let savedPriceCount = 0
    try {
      for (const row of confirmedRows) {
        const price = Number(row.price)
        if (row.addToWeekly && await addItemToWeekly(row.productName)) {
          addedCount += 1
        }
        await saveReceiptProduct(row.productName, {
          productName: row.productName,
          store,
          price,
          purchasedAt,
        })
        savedPriceCount += 1
      }
      setStatus('done')
      setMessage(
        `Saved ${savedPriceCount} receipt price${savedPriceCount === 1 ? '' : 's'} and learned product preferences. Added ${addedCount} new item${addedCount === 1 ? '' : 's'} to your weekly list.`
      )
    } catch (error) {
      console.error('Could not save receipt data:', error)
      setStatus('error')
      setMessage(
        `Saving stopped after ${savedPriceCount} item${savedPriceCount === 1 ? '' : 's'} because the profile could not be saved. ${error instanceof Error ? error.message : ''}`
      )
    }
  }

  return (
    <section className="card mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
        📸 Learn Products and Prices from a Receipt
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        OCR suggests product matches and prices for you to review. Uncertain receipt lines must be confirmed or
        skipped before saving. Confirmed brands and sizes become your usual milk or bread choice. Receipt
        observations are saved to your account in Firestore; they are not live supermarket prices.
      </p>

      <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="receipt-image">
        Receipt image
      </label>
      <input
        id="receipt-image"
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="input-field mb-4"
      />
      <button
        type="button"
        onClick={processReceipt}
        disabled={!file || status === 'processing'}
        className="btn-primary w-full"
      >
        {status === 'processing' ? 'Reading receipt…' : 'Read Receipt'}
      </button>

      {status === 'review' && rows.length > 0 && (
        <div className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-gray-700">
              Supermarket on receipt
              <select
                value={store}
                onChange={(event) => setStore(event.target.value as StoreName | '')}
                className="input-field mt-1"
                required
              >
                <option value="">Choose a supermarket</option>
                <option value="Woolworths">Woolworths</option>
                <option value="PAKnSAVE">PAK'nSAVE</option>
                <option value="NewWorld">New World</option>
              </select>
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Purchase date
              <input
                type="date"
                value={purchasedAt}
                onChange={(event) => setPurchasedAt(event.target.value)}
                className="input-field mt-1"
              />
              <span className="mt-1 block text-xs font-normal text-gray-500">
                Defaults to today; change it for an older receipt.
              </span>
            </label>
          </div>

          <div className="space-y-3">
            {rows.map((row) => (
              <div key={row.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-sm text-gray-600 mb-2">Receipt text: {row.description}</p>
                {!row.confirmed && (
                  <p className="mb-2 text-sm font-medium text-amber-800">
                    We couldn’t confidently identify this receipt item. Confirm the suggested product, choose
                    another, or mark this line to skip.
                  </p>
                )}
                <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
                  <label className="block text-sm font-medium text-gray-700">
                    Confirm product
                    <select
                      value={row.productName}
                      disabled={row.skip}
                      onChange={(event) => updateRow(row.id, {
                        productName: event.target.value,
                        confirmed: Boolean(event.target.value),
                        skip: false,
                      })}
                      className="input-field mt-1"
                    >
                      <option value="">Not a catalogue product / skip</option>
                      {Object.keys(NZ_SUPERMARKET_CATALOGUE).map((productName) => (
                        <option key={productName} value={productName}>
                          {productName}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm font-medium text-gray-700">
                    Paid (NZD)
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={row.price}
                      onChange={(event) => updateRow(row.id, { price: event.target.value })}
                      className="input-field mt-1"
                    />
                  </label>
                </div>
                {row.productName && !row.skip && !row.confirmed && (
                  <label className="mt-3 flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={row.confirmed}
                      onChange={(event) => updateRow(row.id, { confirmed: event.target.checked })}
                    />
                    I confirm “{row.productName}” is the correct product
                  </label>
                )}
                {!row.productName && (
                  <label className="mt-3 flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={row.skip}
                      onChange={(event) => updateRow(row.id, {
                        skip: event.target.checked,
                        confirmed: event.target.checked,
                      })}
                    />
                    Skip this receipt line
                  </label>
                )}
                {row.productName && (
                  <label className="mt-3 flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={row.addToWeekly}
                      onChange={(event) => updateRow(row.id, { addToWeekly: event.target.checked })}
                    />
                    Add this product to my weekly list
                  </label>
                )}
              </div>
            ))}
          </div>
          <button type="button" onClick={saveReceipt} className="btn-primary w-full">
            Confirm Products and Save Prices
          </button>
        </div>
      )}

      {message && (
        <p
          role={status === 'error' ? 'alert' : 'status'}
          className={`mt-3 text-sm ${status === 'error' ? 'text-red-700' : 'text-gray-700'}`}
        >
          {message}
        </p>
      )}

      {(currentUserData.receiptPriceObservations ?? []).length > 0 && (
        <div className="mt-5 border-t border-gray-200 pt-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">
            Recently saved receipt prices
          </h3>
          <ul className="space-y-1 text-sm text-gray-600">
            {(currentUserData.receiptPriceObservations ?? []).slice(-3).reverse().map((observation, index) => (
              <li key={`${observation.productName}-${observation.purchasedAt}-${index}`}>
                {observation.productName}: ${observation.price.toFixed(2)} at {observation.store} on {observation.purchasedAt}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
