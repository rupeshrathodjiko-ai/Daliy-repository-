import {
  CheckCircle2,
  KeyRound,
  Package,
  QrCode,
  RefreshCw,
  Shield,
  Upload,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type {
  MerchantQrConfig,
  OrderRecord,
  ProPanelProduct,
} from '../types.ts';

interface OwnerDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  authToken: string;
  merchant: MerchantQrConfig;
  onMerchantUpdated: (updated: MerchantQrConfig) => void;
  panels: ProPanelProduct[];
  onPanelsUpdated: (updatedPanels: ProPanelProduct[]) => void;
}

type OwnerTab = 'orders' | 'panels' | 'qr' | 'security';

interface OwnerOverviewResponse {
  ownerIdentity: {
    email: string;
    phone: string;
    passkeyConfigured: boolean;
  };
  summary: {
    totalOrders: number;
    verifiedCount: number;
    pendingCount: number;
    verifiedRevenueInr: number;
  };
  orders: OrderRecord[];
  panels: ProPanelProduct[];
  merchant: MerchantQrConfig;
}

export function OwnerDashboardModal({
  isOpen,
  onClose,
  authToken,
  merchant,
  onMerchantUpdated,
  panels,
  onPanelsUpdated,
}: OwnerDashboardModalProps) {
  const [activeTab, setActiveTab] = useState<OwnerTab>('orders');
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState<OwnerOverviewResponse | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Panel editing drafts
  const [panelDrafts, setPanelDrafts] = useState<
    Record<
      string,
      {
        name: string;
        subtitle: string;
        priceInr: number;
        originalPriceInr: number;
        deliveryType: string;
      }
    >
  >({});
  const [savingPanelId, setSavingPanelId] = useState<string | null>(null);
  const [approvingOrderId, setApprovingOrderId] = useState<string | null>(null);

  // QR Gateway drafts
  const [upiId, setUpiId] = useState(merchant.upiId);
  const [merchantName, setMerchantName] = useState(merchant.merchantName);
  const [notePrefix, setNotePrefix] = useState(merchant.notePrefix);
  const [useCustomQrImage, setUseCustomQrImage] = useState(merchant.useCustomQrImage);
  const [customQrImageUrl, setCustomQrImageUrl] = useState(merchant.customQrImageUrl);
  const [savingQr, setSavingQr] = useState(false);

  // Passkey update
  const [currentPasskey, setCurrentPasskey] = useState('');
  const [newPasskey, setNewPasskey] = useState('');
  const [savingPasskey, setSavingPasskey] = useState(false);

  const syncPanelDrafts = useCallback((list: ProPanelProduct[]) => {
    const next: Record<
      string,
      {
        name: string;
        subtitle: string;
        priceInr: number;
        originalPriceInr: number;
        deliveryType: string;
      }
    > = {};
    for (const p of list) {
      next[p.id] = {
        name: p.name,
        subtitle: p.subtitle,
        priceInr: p.priceInr,
        originalPriceInr: p.originalPriceInr,
        deliveryType: p.deliveryType,
      };
    }
    setPanelDrafts(next);
  }, []);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/owner/overview', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Could not load owner console.');
        return;
      }
      setOverview(data);
      syncPanelDrafts(data.panels);
      onPanelsUpdated(data.panels);
    } catch {
      setErrorMessage('Network error loading owner dashboard.');
    } finally {
      setLoading(false);
    }
  }, [authToken, onPanelsUpdated, syncPanelDrafts]);

  useEffect(() => {
    if (!isOpen) return;
    setStatusMessage(null);
    setErrorMessage(null);
    setUpiId(merchant.upiId);
    setMerchantName(merchant.merchantName);
    setNotePrefix(merchant.notePrefix);
    setUseCustomQrImage(merchant.useCustomQrImage);
    setCustomQrImageUrl(merchant.customQrImageUrl);
    syncPanelDrafts(panels);
    loadOverview();
  }, [isOpen, merchant, panels, loadOverview, syncPanelDrafts]);

  if (!isOpen) return null;

  const handleApproveOrder = async (orderId: string) => {
    setErrorMessage(null);
    setStatusMessage(null);
    setApprovingOrderId(orderId);
    try {
      const res = await fetch(`/api/owner/orders/${orderId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Could not approve order.');
        return;
      }
      setStatusMessage(`Order ${orderId} verified · Access Key ${data.order.accessKey}`);
      await loadOverview();
    } catch {
      setErrorMessage('Network error approving order.');
    } finally {
      setApprovingOrderId(null);
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    setErrorMessage(null);
    setStatusMessage(null);
    setApprovingOrderId(orderId);
    try {
      const res = await fetch(`/api/owner/orders/${orderId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          reason: 'Payment not received in 9545247796@fam. Please pay via QR and enter your real 12-digit UTR.',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Could not reject order.');
        return;
      }
      setStatusMessage(`Order ${orderId} marked rejected (fake/unreceived UTR).`);
      await loadOverview();
    } catch {
      setErrorMessage('Network error rejecting order.');
    } finally {
      setApprovingOrderId(null);
    }
  };

  const handleSavePanel = async (panelId: string) => {
    const draft = panelDrafts[panelId];
    if (!draft) return;
    setErrorMessage(null);
    setStatusMessage(null);
    setSavingPanelId(panelId);

    try {
      const res = await fetch(`/api/owner/panels/${panelId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(draft),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Could not update panel.');
        return;
      }
      onPanelsUpdated(data.panels);
      setStatusMessage(`${data.panel.name} updated live on the storefront.`);
    } catch {
      setErrorMessage('Network error saving panel.');
    } finally {
      setSavingPanelId(null);
    }
  };

  const handleQrFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      setErrorMessage('QR image must be under 1 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCustomQrImageUrl(reader.result);
        setUseCustomQrImage(true);
        setErrorMessage(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveQr = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);
    setSavingQr(true);
    try {
      const res = await fetch('/api/merchant', {
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
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Could not update QR gateway.');
        return;
      }
      onMerchantUpdated(data.merchant);
      setStatusMessage('Payment QR gateway updated.');
    } catch {
      setErrorMessage('Network error saving QR settings.');
    } finally {
      setSavingQr(false);
    }
  };

  const handleUpdatePasskey = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);
    setSavingPasskey(true);
    try {
      const res = await fetch('/api/owner/passkey', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ currentPasskey, newPasskey }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Could not update Owner Passkey.');
        return;
      }
      setCurrentPasskey('');
      setNewPasskey('');
      setStatusMessage('Owner Passkey updated successfully.');
    } catch {
      setErrorMessage('Network error updating Owner Passkey.');
    } finally {
      setSavingPasskey(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Owner Control Center"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
    >
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-white/[0.1] bg-[#0D0F14] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <Shield className="h-4 w-4 text-red-400" aria-hidden="true" />
            <div>
              <h2 className="text-base font-bold text-white">
                Owner Control Center
              </h2>
              <p className="text-xs text-zinc-400">
                Locked to Owner ID: rupeshrathodjiko@gmail.com · 9545247796
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadOverview}
              disabled={loading}
              aria-label="Refresh owner data"
              className="rounded-lg border border-white/[0.1] p-2 text-zinc-400 hover:text-white cursor-pointer"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close owner control center"
              className="rounded-lg p-2 text-zinc-400 hover:bg-white/[0.06] hover:text-white cursor-pointer"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 border-b border-white/[0.08] bg-[#12141A] px-6 py-2.5 overflow-x-auto">
          {(
            [
              { id: 'orders', label: 'Orders & Revenue', icon: CheckCircle2 },
              { id: 'panels', label: 'Update Panels & Prices', icon: Package },
              { id: 'qr', label: 'QR Gateway', icon: QrCode },
              { id: 'security', label: 'Owner ID & Passkey', icon: KeyRound },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setStatusMessage(null);
                  setErrorMessage(null);
                }}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-red-600 text-white'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {statusMessage && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-300">
              {statusMessage}
            </div>
          )}
          {errorMessage && (
            <div
              role="alert"
              className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300"
            >
              {errorMessage}
            </div>
          )}

          {/* TAB 1: ORDERS & REVENUE */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl border border-white/[0.08] bg-[#12141A] p-4">
                  <div className="text-xs text-zinc-400">Verified Revenue</div>
                  <div className="mt-1 font-mono text-xl font-bold tabular-nums text-emerald-400">
                    ₹{overview?.summary.verifiedRevenueInr ?? 0}
                  </div>
                </div>
                <div className="rounded-xl border border-white/[0.08] bg-[#12141A] p-4">
                  <div className="text-xs text-zinc-400">Verified Orders</div>
                  <div className="mt-1 font-mono text-xl font-bold tabular-nums text-white">
                    {overview?.summary.verifiedCount ?? 0}
                  </div>
                </div>
                <div className="rounded-xl border border-white/[0.08] bg-[#12141A] p-4">
                  <div className="text-xs text-zinc-400">Pending Payment</div>
                  <div className="mt-1 font-mono text-xl font-bold tabular-nums text-amber-400">
                    {overview?.summary.pendingCount ?? 0}
                  </div>
                </div>
                <div className="rounded-xl border border-white/[0.08] bg-[#12141A] p-4">
                  <div className="text-xs text-zinc-400">Total Orders</div>
                  <div className="mt-1 font-mono text-xl font-bold tabular-nums text-white">
                    {overview?.summary.totalOrders ?? 0}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.08] bg-[#12141A] divide-y divide-white/[0.06]">
                {!overview || overview.orders.length === 0 ? (
                  <div className="p-8 text-center text-sm text-zinc-400">
                    No customer orders placed yet.
                  </div>
                ) : (
                  overview.orders.map((ord) => (
                    <div
                      key={ord.orderId}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-mono font-bold text-white">
                            {ord.orderId}
                          </span>
                          <span className="text-zinc-500">·</span>
                          <span className="font-mono tabular-nums font-semibold text-white">
                            ₹{ord.totalInr}
                          </span>
                          <span className="text-zinc-500">·</span>
                          <span
                            className={
                              ord.status === 'VERIFIED'
                                ? 'text-emerald-400 font-semibold'
                                : ord.status === 'REJECTED'
                                  ? 'text-red-400 font-semibold'
                                  : 'text-amber-400 font-semibold'
                            }
                          >
                            {ord.status === 'VERIFIED'
                              ? 'Verified'
                              : ord.status === 'UNDER_REVIEW'
                                ? 'UTR Submitted · Check FamApp'
                                : ord.status === 'REJECTED'
                                  ? 'Rejected'
                                  : 'Awaiting QR Payment'}
                          </span>
                        </div>
                        <div className="text-xs text-zinc-300 truncate">
                          {ord.items.map((i) => `${i.name} ×${i.quantity}`).join(', ')}
                        </div>
                        <div className="font-mono text-xs text-zinc-400">
                          {ord.customerPhone} · {ord.deviceModel}
                          {ord.utrReference ? ` · UTR ${ord.utrReference}` : ''}
                          {ord.accessKey ? ` · Key ${ord.accessKey}` : ''}
                        </div>
                      </div>

                      {(ord.status === 'UNDER_REVIEW' || ord.status === 'PENDING_PAYMENT') && (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleApproveOrder(ord.orderId)}
                            disabled={approvingOrderId === ord.orderId}
                            className="rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 cursor-pointer"
                          >
                            {approvingOrderId === ord.orderId
                              ? 'Working...'
                              : 'Confirm Payment'}
                          </button>
                          {ord.status === 'UNDER_REVIEW' && (
                            <button
                              type="button"
                              onClick={() => handleRejectOrder(ord.orderId)}
                              disabled={approvingOrderId === ord.orderId}
                              className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/20 disabled:opacity-50 cursor-pointer"
                            >
                              Reject Fake UTR
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: UPDATE PANELS & PRICES */}
          {activeTab === 'panels' && (
            <div className="space-y-4">
              {panels.map((panel) => {
                const draft = panelDrafts[panel.id] ?? {
                  name: panel.name,
                  subtitle: panel.subtitle,
                  priceInr: panel.priceInr,
                  originalPriceInr: panel.originalPriceInr,
                  deliveryType: panel.deliveryType,
                };
                return (
                  <div
                    key={panel.id}
                    className="rounded-xl border border-white/[0.08] bg-[#12141A] p-5 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-zinc-400">
                        {panel.tierLabel}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSavePanel(panel.id)}
                        disabled={savingPanelId === panel.id}
                        className="rounded-lg bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-50 cursor-pointer"
                      >
                        {savingPanelId === panel.id ? 'Saving...' : 'Save Panel'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">
                          Panel Title
                        </label>
                        <input
                          type="text"
                          value={draft.name}
                          onChange={(e) =>
                            setPanelDrafts((prev) => ({
                              ...prev,
                              [panel.id]: { ...draft, name: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-white/[0.1] bg-[#090A0F] px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">
                          Delivery Label
                        </label>
                        <input
                          type="text"
                          value={draft.deliveryType}
                          onChange={(e) =>
                            setPanelDrafts((prev) => ({
                              ...prev,
                              [panel.id]: { ...draft, deliveryType: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-white/[0.1] bg-[#090A0F] px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs text-zinc-400 mb-1">
                          Subtitle
                        </label>
                        <input
                          type="text"
                          value={draft.subtitle}
                          onChange={(e) =>
                            setPanelDrafts((prev) => ({
                              ...prev,
                              [panel.id]: { ...draft, subtitle: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-white/[0.1] bg-[#090A0F] px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">
                          Selling Price (INR ₹)
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={draft.priceInr}
                          onChange={(e) =>
                            setPanelDrafts((prev) => ({
                              ...prev,
                              [panel.id]: {
                                ...draft,
                                priceInr: Number(e.target.value),
                              },
                            }))
                          }
                          className="w-full rounded-lg border border-white/[0.1] bg-[#090A0F] px-3 py-2 font-mono text-sm text-white focus:border-red-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">
                          MRP / Strike Price (INR ₹)
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={draft.originalPriceInr}
                          onChange={(e) =>
                            setPanelDrafts((prev) => ({
                              ...prev,
                              [panel.id]: {
                                ...draft,
                                originalPriceInr: Number(e.target.value),
                              },
                            }))
                          }
                          className="w-full rounded-lg border border-white/[0.1] bg-[#090A0F] px-3 py-2 font-mono text-sm text-white focus:border-red-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: QR GATEWAY */}
          {activeTab === 'qr' && (
            <form onSubmit={handleSaveQr} className="space-y-4 rounded-xl border border-white/[0.08] bg-[#12141A] p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Merchant UPI ID
                  </label>
                  <input
                    type="text"
                    required
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full rounded-lg border border-white/[0.1] bg-[#090A0F] px-3.5 py-2.5 font-mono text-sm text-white focus:border-red-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={merchantName}
                    onChange={(e) => setMerchantName(e.target.value)}
                    className="w-full rounded-lg border border-white/[0.1] bg-[#090A0F] px-3.5 py-2.5 text-sm text-white focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/[0.08]">
                <span className="text-xs font-medium text-zinc-300">QR Mode</span>
                <div className="flex items-center gap-1 rounded-lg bg-[#090A0F] p-1 border border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => setUseCustomQrImage(false)}
                    className={`px-3 py-1 rounded text-xs font-medium cursor-pointer ${
                      !useCustomQrImage ? 'bg-red-600 text-white' : 'text-zinc-400'
                    }`}
                  >
                    Dynamic UPI QR
                  </button>
                  <button
                    type="button"
                    onClick={() => setUseCustomQrImage(true)}
                    className={`px-3 py-1 rounded text-xs font-medium cursor-pointer ${
                      useCustomQrImage ? 'bg-red-600 text-white' : 'text-zinc-400'
                    }`}
                  >
                    Custom QR Image
                  </button>
                </div>
              </div>

              {useCustomQrImage && (
                <div className="space-y-3">
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-white/[0.2] bg-[#090A0F] px-4 py-3 text-xs text-zinc-300 hover:border-red-500 transition-colors">
                    <Upload className="h-4 w-4 text-red-400" aria-hidden="true" />
                    <span>Upload New QR Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleQrFileUpload}
                      className="sr-only"
                    />
                  </label>

                  {customQrImageUrl && (
                    <div className="flex items-center gap-4 rounded-lg border border-white/[0.08] bg-[#090A0F] p-3">
                      <img
                        src={customQrImageUrl}
                        alt="Active merchant QR"
                        className="h-16 w-16 rounded object-contain bg-black"
                      />
                      <div className="text-xs text-zinc-400 flex-1 truncate">
                        Active custom QR image configured
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingQr}
                  className="rounded-lg bg-red-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-50 cursor-pointer"
                >
                  {savingQr ? 'Saving...' : 'Save QR Settings'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: OWNER ID & PASSKEY */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-white/[0.08] bg-[#12141A] p-5 space-y-3">
                <div className="text-xs font-semibold text-zinc-300">
                  Fixed Primary Owner ID (Protected)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                  <div className="rounded-lg border border-white/[0.08] bg-[#090A0F] p-3">
                    <div className="text-zinc-500">Owner Gmail</div>
                    <div className="mt-1 text-white">
                      {overview?.ownerIdentity.email ?? 'rupeshrathodjiko@gmail.com'}
                    </div>
                  </div>
                  <div className="rounded-lg border border-white/[0.08] bg-[#090A0F] p-3">
                    <div className="text-zinc-500">Owner Mobile</div>
                    <div className="mt-1 text-white">
                      +91 {overview?.ownerIdentity.phone ?? '9545247796'}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Only this Owner ID can view orders, verify payments, update panel prices, and
                  modify QR gateway settings. Regular user logins have read/purchase access only.
                </p>
              </div>

              <form
                onSubmit={handleUpdatePasskey}
                className="rounded-xl border border-white/[0.08] bg-[#12141A] p-5 space-y-4"
              >
                <div className="text-xs font-semibold text-zinc-300">
                  Update Owner Passkey
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">
                      Current Passkey
                    </label>
                    <input
                      type="password"
                      required
                      value={currentPasskey}
                      onChange={(e) => setCurrentPasskey(e.target.value)}
                      className="w-full rounded-lg border border-white/[0.1] bg-[#090A0F] px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">
                      New Passkey (4–32 characters)
                    </label>
                    <input
                      type="password"
                      required
                      value={newPasskey}
                      onChange={(e) => setNewPasskey(e.target.value)}
                      className="w-full rounded-lg border border-white/[0.1] bg-[#090A0F] px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={savingPasskey}
                    className="rounded-lg bg-red-600 px-5 py-2 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-50 cursor-pointer"
                  >
                    {savingPasskey ? 'Updating...' : 'Update Owner Passkey'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
