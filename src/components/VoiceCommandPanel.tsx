import React, { useState } from 'react'
import { useAppStore } from '../store/appStore'
import { NZ_SUPERMARKET_CATALOGUE } from '../utils/constants'

interface SpeechRecognitionWindow extends Window {
  SpeechRecognition?: new () => SpeechRecognitionLike
  webkitSpeechRecognition?: new () => SpeechRecognitionLike
}

interface SpeechRecognitionLike {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  onstart: (() => void) | null
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

/**
 * Voice Command Panel.
 * Supports spoken commands such as:
 *   "Add milk"
 *   "Add bananas to occasional"
 *   "Remove bread"
 *   "Delete eggs from weekly"
 */
export const VoiceCommandPanel: React.FC = () => {
  const currentUserData = useAppStore((s) => s.currentUserData)
  const addWeekly = useAppStore((s) => s.addItemToWeekly)
  const addOccasional = useAppStore((s) => s.addItemToOccasional)
  const removeWeekly = useAppStore((s) => s.removeFromWeekly)
  const removeOccasional = useAppStore((s) => s.removeFromOccasional)

  const [listening, setListening] = useState(false)
  const [status, setStatus] = useState<string>('')
  const [lastTranscript, setLastTranscript] = useState<string>('')

  // Compatibility handling for Web Speech API
  const SpeechRecognition =
    (typeof window !== 'undefined' &&
      ((window as SpeechRecognitionWindow).SpeechRecognition ||
        (window as SpeechRecognitionWindow).webkitSpeechRecognition)) ||
    null

  const startListening = () => {
    if (!SpeechRecognition) {
      setStatus('Speech recognition is not supported in this browser. Try Chrome or Safari.')
      return
    }

    try {
      const recognizer = new SpeechRecognition()
      recognizer.lang = 'en-NZ' // New Zealand English
      recognizer.interimResults = false
      recognizer.maxAlternatives = 1

      recognizer.onstart = () => {
        setListening(true)
        setStatus('🎙️ Listening... Speak your command (e.g. "Add milk" or "Remove bread")')
      }

      recognizer.onresult = (event) => {
        const transcript = event.results[0][0].transcript.trim()
        setLastTranscript(transcript)
        void handleCommand(transcript)
      }

      recognizer.onerror = (event) => {
        setListening(false)
        if (event.error === 'not-allowed') {
          setStatus('⚠️ Microphone access was denied. Please allow microphone permissions.')
        } else {
          setStatus(`⚠️ Speech recognition error: ${event.error}`)
        }
      }

      recognizer.onend = () => {
        setListening(false)
      }

      recognizer.start()
    } catch (err) {
      setListening(false)
      setStatus(`Failed to start speech recognition: ${(err as Error).message}`)
    }
  }

  /**
   * Helper to find best matching product name in the catalogue or current lists.
   */
  const findBestCatalogueMatch = (query: string): string | null => {
    const q = query.toLowerCase().trim()
    const catalogueNames = Object.keys(NZ_SUPERMARKET_CATALOGUE)

    // 1. Exact match
    const exact = catalogueNames.find((name) => name.toLowerCase() === q)
    if (exact) return exact

    // 2. Starts with or includes
    const substring = catalogueNames.find((name) => name.toLowerCase().includes(q))
    if (substring) return substring

    // 3. Word token overlap
    const queryWords = q.split(/\s+/).filter(Boolean)
    let bestMatch: string | null = null
    let bestScore = 0

    for (const name of catalogueNames) {
      const nameWords = name.toLowerCase().split(/\s+/)
      const matches = queryWords.filter((w) => nameWords.some((nw) => nw.includes(w) || w.includes(nw)))
      if (matches.length > bestScore) {
        bestScore = matches.length
        bestMatch = name
      }
    }

    return bestScore > 0 ? bestMatch : null
  }

  const findItemInLists = (query: string, list: string[]): string | null => {
    const q = query.toLowerCase().trim()
    const exact = list.find((item) => item.toLowerCase() === q)
    if (exact) return exact
    return list.find((item) => item.toLowerCase().includes(q)) || null
  }

  const handleCommand = async (text: string) => {
    const lower = text.toLowerCase()
    const isAdd = lower.startsWith('add ') || lower.startsWith('put ') || lower.startsWith('include ')
    const isRemove = lower.startsWith('remove ') || lower.startsWith('delete ') || lower.startsWith('take off ')

    if (!isAdd && !isRemove) {
      setStatus(`❓ Unrecognized command: "${text}". Try saying "Add milk" or "Remove bread".`)
      return
    }

    // Determine target list
    const targetOccasional = lower.includes('occasional') || lower.includes('specials')
    const targetList = targetOccasional ? 'occasional' : 'weekly'

    // Clean item name from command prefix and list identifiers
    const rawItem = lower
      .replace(/^(add|put|include|remove|delete|take off)\s+/, '')
      .replace(/\s+to\s+(the\s+)?(weekly|occasional|specials)\s*(list)?/g, '')
      .replace(/\s+from\s+(the\s+)?(weekly|occasional|specials)\s*(list)?/g, '')
      .replace(/\s+(weekly|occasional|specials)\s*(list)?/g, '')
      .trim()

    if (!rawItem) {
      setStatus('Could not detect product name from your voice command.')
      return
    }

    if (isAdd) {
      const matchedProduct = findBestCatalogueMatch(rawItem)
      if (!matchedProduct) {
        setStatus(`Could not find "${rawItem}" in the NZ supermarket catalogue.`)
        return
      }

      try {
        const success =
          targetList === 'weekly'
            ? await addWeekly(matchedProduct)
            : await addOccasional(matchedProduct)
        if (success) {
          setStatus(`✓ Added "${matchedProduct}" to your ${targetList} list!`)
        } else {
          setStatus(`ℹ️ "${matchedProduct}" is already in your shopping lists.`)
        }
      } catch (error) {
        setStatus(error instanceof Error ? `Could not save item: ${error.message}` : 'Could not save item.')
      }
    } else if (isRemove) {
      const weeklyItem = findItemInLists(rawItem, currentUserData?.lists.weekly || [])
      const occasionalItem = findItemInLists(rawItem, currentUserData?.lists.occasional || [])

      if (weeklyItem) {
        try {
          await removeWeekly(weeklyItem)
          setStatus(`✓ Removed "${weeklyItem}" from your weekly list.`)
        } catch (error) {
          setStatus(error instanceof Error ? `Could not save change: ${error.message}` : 'Could not save change.')
        }
      } else if (occasionalItem) {
        try {
          await removeOccasional(occasionalItem)
          setStatus(`✓ Removed "${occasionalItem}" from your occasional list.`)
        } catch (error) {
          setStatus(error instanceof Error ? `Could not save change: ${error.message}` : 'Could not save change.')
        }
      } else {
        setStatus(`Could not find "${rawItem}" in your active lists to remove.`)
      }
    }
  }

  return (
    <div className="card mb-6 bg-gradient-to-br from-teal-50 to-emerald-50 border-teal-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-md font-bold text-gray-900 flex items-center gap-2">
          <span>🎙️</span>
          <span>Voice Shopping Assistant</span>
        </h3>
        <span className="text-[10px] bg-teal-100 text-teal-800 font-semibold px-2 py-0.5 rounded-full border border-teal-200">
          Hands-Free
        </span>
      </div>

      <p className="text-xs text-gray-600 mb-3">
        Tap the button and speak commands like <span className="font-medium text-gray-800">"Add milk"</span>, <span className="font-medium text-gray-800">"Add Weet-Bix to occasional"</span>, or <span className="font-medium text-gray-800">"Remove bread"</span>.
      </p>

      <button
        onClick={startListening}
        disabled={listening}
        className={`w-full py-2.5 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-sm ${
          listening
            ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse'
            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
        }`}
      >
        <span>{listening ? '🔴' : '🎤'}</span>
        <span>{listening ? 'Listening... Speak Now' : 'Click to Speak Item'}</span>
      </button>

      {lastTranscript && (
        <div className="mt-2 text-xs text-gray-500 italic">
          Heard: "{lastTranscript}"
        </div>
      )}

      {status && (
        <div className="mt-2 text-xs font-medium text-teal-900 bg-white/80 p-2 rounded-lg border border-teal-100">
          {status}
        </div>
      )}
    </div>
  )
}
