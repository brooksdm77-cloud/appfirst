import React, { useRef, useState } from 'react'
import { createWorker } from 'tesseract.js'
import { useAppStore } from '../store/appStore'
import { NZ_SUPERMARKET_CATALOGUE } from '../utils/constants'

interface ShoppingListItemReview {
  id: number
  sourceText: string
  itemName: string
  confirmed: boolean
  matchedCatalogue: boolean
}

const normalizeItem = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ')

const createReviewItems = (text: string): ShoppingListItemReview[] =>
  text
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim())
    .filter(Boolean)
    .map((sourceText, id) => {
      const catalogueMatch = Object.keys(NZ_SUPERMARKET_CATALOGUE).find(
        (name) => normalizeItem(name) === normalizeItem(sourceText)
      )
      return {
        id,
        sourceText,
        itemName: catalogueMatch || sourceText,
        confirmed: Boolean(catalogueMatch),
        matchedCatalogue: Boolean(catalogueMatch),
      }
    })

export const ShoppingListPhotoImport: React.FC = () => {
  const addItemToWeekly = useAppStore((state) => state.addItemToWeekly)
  const addItemToOccasional = useAppStore((state) => state.addItemToOccasional)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const uploadInputRef = useRef<HTMLInputElement>(null)
  const [image, setImage] = useState<File | null>(null)
  const [items, setItems] = useState<ShoppingListItemReview[]>([])
  const [targetList, setTargetList] = useState<'weekly' | 'occasional'>('weekly')
  const [status, setStatus] = useState<'idle' | 'reading' | 'saving'>('idle')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedImage = event.target.files?.[0] ?? null
    event.target.value = ''
    setImage(selectedImage)
    setItems([])
    setMessage('')
  }

  const readImage = async () => {
    if (!image) return
    setStatus('reading')
    setMessage('Reading the image on this device. The image is not uploaded or saved.')
    let worker: Awaited<ReturnType<typeof createWorker>> | undefined

    try {
      worker = await createWorker('eng', 1)
      const { data } = await worker.recognize(image)
      const recognizedItems = createReviewItems(data.text)
      setItems(recognizedItems)
      setMessage(
        recognizedItems.length
          ? 'Review each item. Any item we could not match confidently must be confirmed before it can be added.'
        : 'No text was recognized. Try a clearer, well-lit photo or add items manually.'
      )
      setMessageType(recognizedItems.length ? 'success' : 'error')
    } catch (error) {
      console.error('Shopping-list image OCR failed:', error)
      setMessage(error instanceof Error ? `Could not read the image: ${error.message}` : 'Could not read the image.')
      setMessageType('error')
    } finally {
      await worker?.terminate()
      setStatus('idle')
    }
  }

  const updateItem = (id: number, updates: Partial<ShoppingListItemReview>) => {
    setItems((current) => current.map((item) => item.id === id ? { ...item, ...updates } : item))
  }

  const addManualItem = () => {
    const id = items.reduce((max, item) => Math.max(max, item.id), -1) + 1
    setItems((current) => [...current, {
      id,
      sourceText: '',
      itemName: '',
      confirmed: false,
      matchedCatalogue: false,
    }])
  }

  const addItems = async () => {
    const validItems = items.filter((item) => item.itemName.trim())
    if (!validItems.length) {
      setMessage('Add or recognize at least one item first.')
      setMessageType('error')
      return
    }
    if (items.some((item) => !item.itemName.trim() || !item.confirmed)) {
      setMessage('Fill in or remove blank rows, and confirm every uncertain item before adding the list.')
      setMessageType('error')
      return
    }

    setStatus('saving')
    setMessage('')
    let added = 0
    let alreadyPresent = 0

    try {
      for (const item of Array.from(new Set(validItems.map((row) => row.itemName.trim())))) {
        const wasAdded = targetList === 'weekly'
          ? await addItemToWeekly(item)
          : await addItemToOccasional(item)
        if (wasAdded) added += 1
        else alreadyPresent += 1
      }
      setMessage(
        `Added ${added} item${added === 1 ? '' : 's'} to your ${targetList} list` +
          (alreadyPresent ? `; ${alreadyPresent} already in a list.` : '.')
      )
      setMessageType('success')
      setImage(null)
      setItems([])
    } catch (error) {
      console.error('Could not add imported shopping-list items:', error)
      setMessage(
        `Added ${added} item${added === 1 ? '' : 's'} before saving stopped. ${
          error instanceof Error ? error.message : 'Please try again.'
        }`
      )
      setMessageType('error')
    } finally {
      setStatus('idle')
    }
  }

  return (
    <section className="card mb-6">
      <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold text-gray-900">
        📷 Add a shopping list from a photo
      </h3>
      <p className="mb-4 text-sm text-gray-600">
        Take a picture or upload a photo of a printed or handwritten list. Text recognition runs in your browser;
        review the result before adding items. Unmatched items need your confirmation before they are saved.
      </p>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleImageChange}
        className="hidden"
        aria-label="Take a photo of a shopping list"
      />
      <input
        ref={uploadInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        className="hidden"
        aria-label="Upload a shopping list photo"
      />
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => cameraInputRef.current?.click()} className="btn-secondary">
          Take photo
        </button>
        <button type="button" onClick={() => uploadInputRef.current?.click()} className="btn-secondary">
          Upload photo
        </button>
        {image && <span className="self-center text-sm text-gray-600">{image.name}</span>}
      </div>

      {image && (
        <button
          type="button"
          onClick={() => void readImage()}
          disabled={status !== 'idle'}
          className="btn-primary mt-3 w-full disabled:opacity-50"
        >
          {status === 'reading' ? 'Reading image…' : 'Recognize list items'}
        </button>
      )}

      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-sm font-semibold text-gray-800">Review list items</h4>
          <button type="button" onClick={addManualItem} className="text-sm font-medium text-blue-700 hover:underline">
            Add item manually
          </button>
        </div>
        {items.map((item) => (
          <div key={item.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            {!item.confirmed && (
              <p className="mb-2 text-sm font-medium text-amber-800">
                We couldn’t confidently identify “{item.sourceText || 'this item'}”. Please confirm or correct it.
              </p>
            )}
            <label className="block text-sm font-medium text-gray-700">
              Product name
              <input
                type="text"
                list="shopping-list-catalogue"
                value={item.itemName}
                onChange={(event) => updateItem(item.id, {
                  itemName: event.target.value,
                  confirmed: false,
                  matchedCatalogue: false,
                })}
                className="input-field mt-1"
                placeholder="Enter or choose a product"
                required
              />
            </label>
            {!item.matchedCatalogue && (
              <label className="mt-2 flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={item.confirmed}
                  onChange={(event) => updateItem(item.id, { confirmed: event.target.checked })}
                />
                I confirm this is the correct item
              </label>
            )}
            {item.confirmed && item.matchedCatalogue && (
              <p className="mt-1 text-xs text-green-700">Matched to a catalogue item.</p>
            )}
            <button
              type="button"
              onClick={() => setItems((current) => current.filter((row) => row.id !== item.id))}
              className="mt-2 text-xs font-medium text-red-700 hover:underline"
            >
              Remove this line
            </button>
          </div>
        ))}
        <datalist id="shopping-list-catalogue">
          {Object.keys(NZ_SUPERMARKET_CATALOGUE).map((name) => <option key={name} value={name} />)}
        </datalist>
        {items.length === 0 && (
          <p className="text-sm text-gray-500">Recognize a photo or add an item manually.</p>
        )}
      </div>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="block flex-1 text-sm font-medium text-gray-700">
          Add items to
          <select
            value={targetList}
            onChange={(event) => setTargetList(event.target.value as 'weekly' | 'occasional')}
            className="input-field mt-1.5"
          >
            <option value="weekly">Weekly list</option>
            <option value="occasional">Occasional list</option>
          </select>
        </label>
        <button
          type="button"
          onClick={() => void addItems()}
          disabled={status !== 'idle' || !items.some((item) => item.itemName.trim()) || items.some((item) => !item.itemName.trim() || !item.confirmed)}
          className="btn-primary disabled:opacity-50"
        >
          {status === 'saving' ? 'Adding items…' : `Add ${items.filter((item) => item.itemName.trim()).length || ''} items to list`}
        </button>
      </div>

      {message && (
        <p role={messageType === 'error' ? 'alert' : 'status'} className={`mt-3 text-sm ${
          messageType === 'error' ? 'text-red-700' : 'text-gray-700'
        }`}>
          {message}
        </p>
      )}
    </section>
  )
}
