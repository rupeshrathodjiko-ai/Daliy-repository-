import {
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Minus,
  Plus,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import type {
  DeviceProfile,
  MerchantQrConfig,
  OrderRecord,
  ProPanelProduct,
} from '../types.ts';

export interface CartEntry {
  panel: ProPanelProduct;
  quantity: number;
}

interface CheckoutDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartEntry[];
  onUpdateQty: (panelId: string, delta: number) => void;
  onRemoveItem: (panelId: string) => void;
  selectedDevice: DeviceProfile;
  merchant: MerchantQrConfig;
  isOwner: boolean;
  authToken: string;
  defaultPhone?: string;
  defaultEmail?: string;
  onOrderVerified: (order: OrderRecord, panels: ProPanelProduct[]) => void;
  onOpenMerchantSettings: () => void;
}

export function CheckoutDrawer({
  isOpen,
  onClose,
  cart,
  onUpdateQty,
  onRemoveItem,
  selectedDevice,
  merchant,
  isOwner,
  authToken,
  defaultPhone = '',
  defaultEmail = '',
  onOrderVerified,
  onOpenMerchantSettings,
}: CheckoutDrawerProps) {
  const [customerPhone, setCustomerPhone] = useState(defaultPhone);
  const [customerEmail, setCustomerEmail] = useState(defaultEmail);
  const [activeOrder, setActiveOrder] = useState<OrderRecord | null>(null);
  const [utrInput, setUtrInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);

  useEffect(() => {
    setCustomerPhone(defaultPhone);
    setCustomerEmail(defaultEmail);
  }, [defaultPhone, defaultEmail]);

  const [checkingStatus, setCheckingStatus] = useState(false);

  const checkOrderStatus = useCallback(async () => {
    if (!activeOrder) return;
    setCheckingStatus(true);
    try {
      const res = await fetch(`/api/orders/${activeOrder.orderId}/status`);
      const data = await res.json();
      if (!res.ok || !data.order) return;
      setActiveOrder(data.order);
      if (data.order.status === 'VERIFIED' && data.unlockedPanels) {
        onOrderVerified(data.order, data.unlockedPanels);
      }
    } catch {
      // Ignore transient poll errors
    } finally {
      setCheckingStatus(false);
    }
  }, [activeOrder, onOrderVerified]);

  useEffect(() => {
    if (!isOpen || !activeOrder || activeOrder.status !== 'UNDER_REVIEW') return;
    const timer = window.setInterval(() => {
      checkOrderStatus();
    }, 4000);
    return () => window.clearInterval(timer);
  }, [isOpen, activeOrder, checkOrderStatus]);

  if (!isOpen) return null;

  const totalInr = cart.reduce(
    (sum, item) => sum + item.panel.priceInr * item.quantity,
    0
  );

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (cart.length === 0) {
      setErrorMessage('Add at least one Pro Panel to checkout.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map((c) => ({
            panelId: c.panel.id,
            quantity: c.quantity,
          })),
          customerPhone,
          customerEmail,
          deviceModel: `${selectedDevice.brandLabel} ${selectedDevice.model}`,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setErrorMessage(data.error || 'Could not create QR checkout session.');
        return;
      }
      setActiveOrder(data.order);
    } catch {
      setErrorMessage('Network error while initializing QR gateway.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyUtr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder) return;
    setErrorMessage(null);
    setVerifying(true);

    try {
      const response = await fetch(`/api/orders/${activeOrder.orderId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ utrReference: utrInput }),
      });
      const data = await response.json();
      if (!response.ok) {
        setErrorMessage(data.error || 'UTR submission failed.');
        return;
      }
      setActiveOrder(data.order);
      if (data.order.status === 'VERIFIED' && data.unlockedPanels) {
        onOrderVerified(data.order, data.unlockedPanels);
      }
    } catch {
      setErrorMessage('Network error while submitting UTR reference.');
    } finally {
      setVerifying(false);
    }
  };

  const handleOwnerConfirmNow = async () => {
    if (!activeOrder || !isOwner) return;
    setErrorMessage(null);
    setVerifying(true);
    try {
      const res = await fetch(`/api/owner/orders/${activeOrder.orderId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Owner approval failed.');
        return;
      }
      setActiveOrder(data.order);
      if (data.order.status === 'VERIFIED' && data.unlockedPanels) {
        onOrderVerified(data.order, data.unlockedPanels);
      }
    } catch {
      setErrorMessage('Network error confirming payment.');
    } finally {
      setVerifying(false);
    }
  };

  const handleCopyUpi = async () => {
    try {
      await navigator.clipboard.writeText(merchant.upiId);
      setCopiedUpi(true);
      window.setTimeout(() => setCopiedUpi(false), 1800);
    } catch {
      // Clipboard blocked
    }
  };

  const handleFillSampleUtr = () => {
    if (!isOwner) return;
    const sample = `4318${Math.floor(10000000 + Math.random() * 89999999)}`;
    setUtrInput(sample);
  };

  const resetCheckoutSession = () => {
    setActiveOrder(null);
    setUtrInput('');
    setErrorMessage(null);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Cart and QR Checkout"
      className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm"
    >
      <div className="flex h-full w-full max-w-lg flex-col border-l border-white/[0.1] bg-[#0D0F14] shadow-2xl">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-white">
              {activeOrder
                ? activeOrder.status === 'VERIFIED'
                  ? 'Order Verified & Unlocked'
                  : activeOrder.status === 'UNDER_REVIEW'
                    ? 'Verifying Payment'
                    : 'Scan UPI QR to Pay'
                : 'Your Pro Panel Cart'}
            </h2>
            <p className="text-xs text-zinc-400">
              {activeOrder
                ? `Order ${activeOrder.orderId} · Signature ${activeOrder.signature}`
                : `Calibrated for ${selectedDevice.brandLabel} ${selectedDevice.model}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close checkout drawer"
            className="rounded-lg p-2 text-zinc-400 hover:bg-white/[0.06] hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {!activeOrder ? (
            <>
              {cart.length === 0 ? (
                <div className="rounded-xl border border-white/[0.08] bg-[#12141A] p-8 text-center space-y-3">
                  <QrCode className="mx-auto h-8 w-8 text-zinc-500" aria-hidden="true" />
                  <p className="text-sm font-medium text-white">Your cart is empty</p>
                  <p className="text-xs text-zinc-400">
                    Choose any Pro Panel from the storefront to unlock via instant UPI QR.
                  </p>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-white/[0.08] rounded-xl border border-white/[0.08] bg-[#12141A]">
                    {cart.map((entry) => (
                      <div
                        key={entry.panel.id}
                        className="flex items-center justify-between gap-4 p-4"
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-white truncate">
                            {entry.panel.name}
                          </div>
                          <div className="mt-0.5 font-mono text-xs tabular-nums text-zinc-400">
                            ₹{entry.panel.priceInr} each
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center rounded-lg border border-white/[0.1] bg-[#090A0F]">
                            <button
                              type="button"
                              onClick={() => onUpdateQty(entry.panel.id, -1)}
                              aria-label={`Decrease quantity for ${entry.panel.name}`}
                              className="p-1.5 text-zinc-400 hover:text-white cursor-pointer"
                            >
                              <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                            <span className="px-2.5 font-mono text-xs tabular-nums text-white">
                              {entry.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => onUpdateQty(entry.panel.id, 1)}
                              aria-label={`Increase quantity for ${entry.panel.name}`}
                              className="p-1.5 text-zinc-400 hover:text-white cursor-pointer"
                            >
                              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => onRemoveItem(entry.panel.id)}
                            aria-label={`Remove ${entry.panel.name}`}
                            className="p-1.5 text-zinc-500 hover:text-red-400 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <form id="checkout-form" onSubmit={handleCreateOrder} className="space-y-4">
                    <div>
                      <label
                        htmlFor="checkout-phone"
                        className="block text-xs font-medium text-zinc-300 mb-1.5"
                      >
                        WhatsApp / Mobile Number (for receipt backup)
                      </label>
                      <input
                        id="checkout-phone"
                        type="tel"
                        required
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="+91 98XXXXXXXX"
                        className="w-full rounded-lg border border-white/[0.1] bg-[#12141A] px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-red-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="checkout-email"
                        className="block text-xs font-medium text-zinc-300 mb-1.5"
                      >
                        Email Address (Optional)
                      </label>
                      <input
                        id="checkout-email"
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="player@example.com"
                        className="w-full rounded-lg border border-white/[0.1] bg-[#12141A] px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-red-500 focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-white/[0.08] bg-[#12141A] px-4 py-3 text-xs text-zinc-400">
                      <span>
                        UPI ID: <strong className="text-zinc-200">{merchant.upiId}</strong>
                      </span>
                      {isOwner && (
                        <button
                          type="button"
                          onClick={onOpenMerchantSettings}
                          className="text-red-400 hover:text-red-300 font-medium cursor-pointer"
                        >
                          Change QR
                        </button>
                      )}
                    </div>
                  </form>
                </>
              )}
            </>
          ) : activeOrder.status === 'PENDING_PAYMENT' ||
            activeOrder.status === 'REJECTED' ? (
            <div className="space-y-6">
              {activeOrder.status === 'REJECTED' && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-500/35 bg-red-500/10 px-4 py-3 text-xs text-red-200 space-y-1"
                >
                  <div className="font-semibold text-red-300">
                    Previous UTR Could Not Be Verified
                  </div>
                  <p>
                    {activeOrder.rejectionReason ||
                      'Payment was not received for that UTR. Complete payment on the QR below and enter your valid 12-digit UTR.'}
                  </p>
                </div>
              )}

              {/* Crisp QR Code Card */}
              <div className="rounded-xl border border-white/[0.1] bg-[#12141A] p-6 text-center space-y-4">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>{merchant.merchantName}</span>
                  <span className="font-mono tabular-nums font-semibold text-white">
                    ₹{activeOrder.totalInr}.00
                  </span>
                </div>

                {merchant.useCustomQrImage && merchant.customQrImageUrl ? (
                  <div className="mx-auto w-60 overflow-hidden rounded-xl border border-white/[0.12] bg-[#090A0F]">
                    <img
                      src={activeOrder.qrDataUrl}
                      alt={`UPI QR code for ${merchant.merchantName} (${merchant.upiId})`}
                      className="w-full h-auto max-h-80 object-contain"
                    />
                  </div>
                ) : (
                  <div className="mx-auto inline-block rounded-xl bg-white p-3.5">
                    <img
                      src={activeOrder.qrDataUrl}
                      alt={`UPI QR code for ${activeOrder.totalInr} INR`}
                      className="h-52 w-52 object-contain"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-xs text-zinc-400">
                    Scan using GPay, PhonePe, Paytm, or BHIM UPI
                  </p>
                  <div className="flex items-center justify-center gap-2.5">
                    <button
                      type="button"
                      onClick={handleCopyUpi}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.12] bg-[#090A0F] px-3 py-1.5 font-mono text-xs text-zinc-200 hover:border-white/25 cursor-pointer"
                    >
                      {copiedUpi ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                          <span>Copied UPI ID</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>{merchant.upiId}</span>
                        </>
                      )}
                    </button>

                    <a
                      href={activeOrder.upiUri}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.12] bg-[#090A0F] px-3 py-1.5 text-xs font-medium text-white hover:border-white/25"
                    >
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Open UPI App</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* UTR Submission Form */}
              <form onSubmit={handleVerifyUtr} className="space-y-3">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="utr-input"
                    className="block text-xs font-medium text-zinc-300"
                  >
                    Enter 12-Digit UPI UTR / Reference Number
                  </label>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={handleFillSampleUtr}
                      className="text-xs text-zinc-400 hover:text-white underline decoration-white/20 underline-offset-2 cursor-pointer"
                    >
                      Fill Demo UTR
                    </button>
                  )}
                </div>
                <input
                  id="utr-input"
                  type="text"
                  inputMode="numeric"
                  maxLength={12}
                  required
                  value={utrInput}
                  onChange={(e) => setUtrInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="12-digit numeric UTR (e.g. 431892045128)"
                  className="w-full rounded-lg border border-white/[0.12] bg-[#12141A] px-3.5 py-2.5 font-mono text-sm text-white placeholder:text-zinc-500 focus:border-red-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={verifying}
                  className="w-full rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {verifying ? 'Submitting Payment Proof...' : 'Submit UTR for Payment Check'}
                </button>
              </form>

              <button
                type="button"
                onClick={resetCheckoutSession}
                className="w-full text-center text-xs text-zinc-400 hover:text-white cursor-pointer"
              >
                Edit Cart Items
              </button>
            </div>
          ) : activeOrder.status === 'UNDER_REVIEW' ? (
            <div className="rounded-xl border border-amber-500/30 bg-[#12141A] p-6 space-y-5">
              <div className="flex items-start gap-3">
                <Clock
                  className="h-6 w-6 text-amber-400 shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <div>
                  <h3 className="text-base font-bold text-white">
                    Awaiting Payment Verification
                  </h3>
                  <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                    Your UTR has been submitted. Once {merchant.merchantName} confirms ₹
                    {activeOrder.totalInr}.00 arrived in {merchant.upiId}, your Pro Panel unlocks
                    automatically here and in the Access Vault.
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-white/[0.08] bg-[#090A0F] p-4 space-y-2 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Order ID</span>
                  <span className="text-white">{activeOrder.orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Submitted UTR</span>
                  <span className="text-amber-300">{activeOrder.utrReference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Amount</span>
                  <span className="text-white">₹{activeOrder.totalInr}.00</span>
                </div>
              </div>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={checkOrderStatus}
                  disabled={checkingStatus}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/[0.14] bg-[#090A0F] px-4 py-2.5 text-xs font-semibold text-white hover:bg-white/[0.06] cursor-pointer"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${checkingStatus ? 'animate-spin' : ''}`}
                    aria-hidden="true"
                  />
                  <span>{checkingStatus ? 'Checking...' : 'Check Payment Status'}</span>
                </button>

                {isOwner && (
                  <button
                    type="button"
                    onClick={handleOwnerConfirmNow}
                    disabled={verifying}
                    className="w-full rounded-lg bg-red-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-50 cursor-pointer"
                  >
                    {verifying ? 'Confirming...' : 'Owner: Confirm Payment & Unlock'}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-xl border border-emerald-500/30 bg-[#12141A] p-6 space-y-5"
            >
              <div className="flex items-start gap-3">
                <CheckCircle2
                  className="h-6 w-6 text-emerald-400 shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <div>
                  <h3 className="text-base font-bold text-white">
                    Instant Access Unlocked
                  </h3>
                  <p className="mt-1 text-xs text-zinc-400">
                    Your Pro Panel deliverables are now loaded in the Access Vault below.
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-white/[0.08] bg-[#090A0F] p-4 space-y-2 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Access Key</span>
                  <span className="font-bold text-emerald-400">{activeOrder.accessKey}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Order ID</span>
                  <span className="text-white">{activeOrder.orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">UTR Reference</span>
                  <span className="text-white">{activeOrder.utrReference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Amount Paid</span>
                  <span className="text-white">₹{activeOrder.totalInr}.00</span>
                </div>
              </div>

              <a
                href="#access-vault"
                onClick={() => {
                  resetCheckoutSession();
                  onClose();
                }}
                className="block w-full rounded-lg bg-red-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-red-500 transition-colors"
              >
                Open Unlocked Panel in Vault
              </a>
            </motion.div>
          )}

          {errorMessage && (
            <div
              role="alert"
              className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300"
            >
              {errorMessage}
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        {!activeOrder && cart.length > 0 && (
          <div className="border-t border-white/[0.08] bg-[#090A0F] px-6 py-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Total Payable</span>
              <span className="font-mono text-xl font-bold tabular-nums text-white">
                ₹{totalInr}.00
              </span>
            </div>

            <button
              type="submit"
              form="checkout-form"
              disabled={submitting}
              className="w-full rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {submitting ? 'Generating Secure QR...' : 'Generate UPI QR & Pay'}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-xs text-zinc-500">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              <span>HMAC-signed order verification · Instant digital unlock</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
