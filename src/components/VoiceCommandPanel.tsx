import React, { useState } from 'react';
import { useAppStore } from '../store/appStore';

/**
 * Simple voice command UI.
 * Supports commands such as:
 *   "add apples"
 *   "remove bananas"
 *   "add milk to occasional"
 *   "remove yogurt from weekly"
 *
 * Uses the Web Speech API (SpeechRecognition). Works in most modern browsers.
 */
export const VoiceCommandPanel: React.FC = () => {
  const addWeekly = useAppStore((s) => s.addItemToWeekly);
  const addOccasional = useAppStore((s) => s.addItemToOccasional);
  const removeWeekly = useAppStore((s) => s.removeFromWeekly);
  const removeOccasional = useAppStore((s) => s.removeFromOccasional);

  const [listening, setListening] = useState(false);
  const [status, setStatus] = useState<string>('');

  // Compatibility handling
  const SpeechRecognition: any =
    (typeof window !== 'undefined' &&
      (window.SpeechRecognition || (window as any).webkitSpeechRecognition)) ||
    null;

  const startListening = () => {
    if (!SpeechRecognition) {
      setStatus('Speech Recognition not supported in this browser.');
      return;
    }
    const recognizer = new SpeechRecognition();
    recognizer.lang = 'en-US';
    recognizer.interimResults = false;
    recognizer.maxAlternatives = 1;

    recognizer.onstart = () => {
      setListening(true);
      setStatus('Listening...');
    };
    recognizer.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.trim();
      handleCommand(transcript);
    };
    recognizer.onerror = (e: any) => {
      console.error(e);
      setStatus('Error: ' + e.error);
    };
    recognizer.onend = () => {
      setListening(false);
    };
    recognizer.start();
  };

  const handleCommand = (text: string) => {
    const lower = text.toLowerCase();
    const isAdd = lower.startsWith('add ');
    const isRemove = lower.startsWith('remove ') || lower.startsWith('delete ');
    if (!isAdd && !isRemove) {
      setStatus(`Unrecognized command: "${text}"`);
      return;
    }
    // Determine target list
    const targetWeekly = lower.includes('weekly');
    const targetOccasional = lower.includes('occasional');
    const target = targetOccasional ? 'occasional' : targetWeekly ? 'weekly' : 'weekly';
    // Extract item name (remove the verb and any list keywords)
    let item = lower
      .replace(/^add /, '')
      .replace(/^remove /, '')
      .replace(/^delete /, '')
      .replace(/ to weekly| from weekly| weekly/g, '')
      .replace(/ to occasional| from occasional| occasional/g, '')
      .trim();
    // Capitalise first letter for catalog matching (catalog keys are case‑sensitive)
    item = item.charAt(0).toUpperCase() + item.slice(1);

    let success = false;
    if (isAdd) {
      success = target === 'weekly' ? addWeekly(item) : addOccasional(item);
    } else if (isRemove) {
      if (target === 'weekly') removeWeekly(item);
      else removeOccasional(item);
      success = true;
    }
    setStatus(
      `${isAdd ? 'Add' : 'Remove'} ${item} ${success ? 'succeeded' : 'failed'} to ${target} list.`
    );
  };

  return (
    <div className="card mb-6 bg-gradient-to-br from-green-50 to-teal-50 border-green-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
        🎙️ Voice Command
      </h3>
      <button
        onClick={startListening}
        disabled={listening}
        className="btn-primary w-full"
      >
        {listening ? 'Listening…' : 'Speak Command'}
      </button>
      {status && <div className="mt-2 text-sm text-gray-700">{status}</div>}
    </div>
  );
};

