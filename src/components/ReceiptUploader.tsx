import React, { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { NZ_SUPERMARKET_CATALOGUE } from '../utils/constants';

// Optional: you need to have tesseract.js installed in the project.
// If not, you can install it via `npm install tesseract.js`.
import { createWorker } from 'tesseract.js';

/**
 * Component that allows the user to upload a receipt image, runs OCR on it, and
 * extracts product names that match the NZ supermarket catalogue. Matched items
 * are added to the user's weekly shopping list.
 */
export const ReceiptUploader: React.FC = () => {
  const addItemToWeekly = useAppStore((state) => state.addItemToWeekly);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'processing' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setMessage('');
    }
  };

  const processReceipt = async () => {
    if (!file) return;
    setStatus('processing');
    setMessage('Running OCR, please wait...');
    try {
      const worker = await createWorker({ logger: (m) => console.log(m) });
      await worker.load();
      await worker.loadLanguage('eng');
      await worker.initialize('eng');
      const { data } = await worker.recognize(file);
      await worker.terminate();

      const rawText = data.text as string;
      // Very naive extraction: split by lines, trim, and attempt to match catalogue keys.
      const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
      const matched: string[] = [];
      lines.forEach((line) => {
        // Check if any catalogue product name is a substring of the line (case‑insensitive).
        const lower = line.toLowerCase();
        const match = Object.keys(NZ_SUPERMARKET_CATALOGUE).find(
          (prod) => prod.toLowerCase() === lower || lower.includes(prod.toLowerCase())
        );
        if (match && !matched.includes(match)) {
          matched.push(match);
        }
      });

      if (matched.length === 0) {
        setMessage('No recognizable items found on the receipt.');
        setStatus('done');
        return;
      }

      let addedCount = 0;
      matched.forEach((item) => {
        const success = addItemToWeekly(item);
        if (success) addedCount++;
      });

      setMessage(`Added ${addedCount} item(s) to your weekly list.`);
      setStatus('done');
    } catch (err) {
      console.error(err);
      setMessage('Error processing receipt.');
      setStatus('error');
    }
  };

  return (
    <div className="card mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
        📸 Import Items from Receipt
      </h3>
      <input type="file" accept="image/*" onChange={handleFileChange} className="input-field mb-2" />
      <button
        onClick={processReceipt}
        disabled={!file || status === 'processing'}
        className="btn-primary w-full"
      >
        {status === 'processing' ? 'Processing…' : 'Add Items from Receipt'}
      </button>
      {message && (
        <div className={`mt-2 ${status === 'error' ? 'alert-error' : 'alert-success'}`}>{message}</div>
      )}
    </div>
  );
};

