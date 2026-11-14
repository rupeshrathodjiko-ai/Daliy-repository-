import { QrCode, Upload, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { MerchantQrConfig } from '../types.ts';

interface MerchantQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  merchant: MerchantQrConfig;
  authToken: string;
  onSaved: (updated: MerchantQrConfig) => void;
}

export function MerchantQrModal({
  isOpen,
  onClose,
  merchant,
  authToken,
  onSaved,
}: MerchantQrModalProps) {
  const [upiId, setUpiId] = useState(merchant.upiId);
  const [merchantName, setMerchantName] = useState(merchant.merchantName);
  const [notePrefix, setNotePrefix] = useState(merchant.notePrefix);
  const [useCustomQrImage, setUseCustomQrImage] = useState(merchant.useCustomQrImage);
  const [customQrImageUrl, setCustomQrImageUrl] = useState(merchant.customQrImageUrl);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setUpiId(merchant.upiId);
    setMerchantName(merchant.merchantName);
    setNotePrefix(merchant.notePrefix);
    setUseCustomQrImage(merchant.useCustomQrImage);
    setCustomQrImageUrl(merchant.customQrImageUrl);
  }, [merchant, isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      setError('QR image must be under 1 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCustomQrImageUrl(reader.result);
        setUseCustomQrImage(true);
        setError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const response = await fetch('/api/merchant', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          upiId,
          merchantName,
          notePrefix,
          useCustomQrImage,
          customQrImageUrl,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Could not update merchant QR settings.');
        return;
      }
      onSaved(data.merchant);
      onClose();
    } catch {
      setError('Failed to save QR gateway settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Configure Payment QR Gateway"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-xl border border-white/[0.1] bg-[#12141A] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-4">
          <div className="flex items-center gap-2">
            <QrCode className="h-4 w-4 text-red-400" aria-hidden="true" />
            <h2 className="text-base font-bold text-white">
              QR Payment Gateway Setup
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/[0.06] hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          <p className="text-xs text-zinc-400 leading-relaxed">
            Set your own UPI ID to generate dynamic amount-locked QR codes automatically, or upload
            your static merchant QR image for instant customer payments.
          </p>

          <div>
            <label
              htmlFor="merchant-upi-id"
              className="block text-xs font-medium text-zinc-300 mb-1.5"
            >
              Merchant UPI ID
            </label>
            <input
              id="merchant-upi-id"
              type="text"
              required
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="yourname@okaxis"
              className="w-full rounded-lg border border-white/[0.1] bg-[#090A0F] px-3.5 py-2.5 font-mono text-sm text-white focus:border-red-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="merchant-name"
                className="block text-xs font-medium text-zinc-300 mb-1.5"
              >
                Display Name
              </label>
              <input
                id="merchant-name"
                type="text"
                required
                value={merchantName}
                onChange={(e) => setMerchantName(e.target.value)}
                className="w-full rounded-lg border border-white/[0.1] bg-[#090A0F] px-3.5 py-2 text-sm text-white focus:border-red-500 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="merchant-note"
                className="block text-xs font-medium text-zinc-300 mb-1.5"
              >
                Order Note Prefix
              </label>
              <input
                id="merchant-note"
                type="text"
                required
                value={notePrefix}
                onChange={(e) => setNotePrefix(e.target.value)}
                className="w-full rounded-lg border border-white/[0.1] bg-[#090A0F] px-3.5 py-2 text-sm text-white focus:border-red-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-2.5 pt-2 border-t border-white/[0.08]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-300">
                QR Mode
              </span>
              <div className="flex items-center gap-1 rounded-lg bg-[#090A0F] p-1 border border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setUseCustomQrImage(false)}
                  className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer ${
                    !useCustomQrImage ? 'bg-red-600 text-white' : 'text-zinc-400'
                  }`}
                >
                  Dynamic UPI QR
                </button>
                <button
                  type="button"
                  onClick={() => setUseCustomQrImage(true)}
                  className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer ${
                    useCustomQrImage ? 'bg-red-600 text-white' : 'text-zinc-400'
                  }`}
                >
                  Custom QR Image
                </button>
              </div>
            </div>

            {useCustomQrImage && (
              <div className="space-y-2.5">
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-white/[0.2] bg-[#090A0F] px-4 py-3 text-xs text-zinc-300 hover:border-red-500 transition-colors">
                  <Upload className="h-4 w-4 text-red-400" aria-hidden="true" />
                  <span>Upload GPay / PhonePe / Paytm QR Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="sr-only"
                  />
                </label>

                {customQrImageUrl && (
                  <div className="flex items-center gap-3 rounded-lg border border-white/[0.08] bg-[#090A0F] p-2.5">
                    <img
                      src={customQrImageUrl}
                      alt="Uploaded merchant QR preview"
                      className="h-12 w-12 rounded bg-white object-contain p-1"
                    />
                    <span className="text-xs text-zinc-400 flex-1">
                      Custom merchant QR ready
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomQrImageUrl('');
                        setUseCustomQrImage(false);
                      }}
                      className="text-xs text-red-400 hover:text-red-300 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {error && (
            <p role="alert" className="text-xs text-red-400">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-white/[0.12] px-4 py-2 text-xs font-medium text-zinc-300 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-red-600 px-5 py-2 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Saving...' : 'Save QR Gateway'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
