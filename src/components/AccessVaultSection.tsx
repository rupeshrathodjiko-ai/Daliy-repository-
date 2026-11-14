import { Download, KeyRound, Search } from 'lucide-react';
import { useState } from 'react';
import type { OrderRecord, ProPanelProduct } from '../types.ts';

interface AccessVaultSectionProps {
  unlockedOrder: OrderRecord | null;
  unlockedPanels: ProPanelProduct[];
  recentOrders: OrderRecord[];
  onLookupKey: (keyOrOrderId: string) => Promise<void>;
  lookupLoading: boolean;
  lookupError: string | null;
}

export function AccessVaultSection({
  unlockedOrder,
  unlockedPanels,
  recentOrders,
  onLookupKey,
  lookupLoading,
  lookupError,
}: AccessVaultSectionProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    await onLookupKey(query.trim());
  };

  const handleDownloadJsonBundle = (panel: ProPanelProduct) => {
    const payload = {
      orderId: unlockedOrder?.orderId ?? 'VAULT',
      accessKey: unlockedOrder?.accessKey ?? 'ACTIVE',
      deviceModel: unlockedOrder?.deviceModel ?? 'Universal Mobile',
      panelName: panel.name,
      deliverables: panel.deliverables,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `apexsense-${panel.slug}-panel.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section id="access-vault" className="py-16">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Lookup Panel */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-2">
              <p className="text-xs font-medium text-zinc-400">
                Instant Delivery Vault · Order Retrieval
              </p>
              <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-white">
                Access Your Unlocked Pro Panels
              </h2>
              <p className="text-sm leading-relaxed text-zinc-400">
                After completing UPI QR verification, enter your Order ID or Access Key below to
                inspect HUD coordinates, device FPS tuning steps, and downloadable presets anytime.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <label htmlFor="vault-key-input" className="block text-xs font-medium text-zinc-400">
                Access Key or Order ID
              </label>
              <div className="flex gap-2.5">
                <div className="relative flex-1">
                  <KeyRound
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500"
                    aria-hidden="true"
                  />
                  <input
                    id="vault-key-input"
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="APEX-XXXX-XXXX-XXXX or AS..."
                    className="w-full rounded-lg border border-white/[0.1] bg-[#12141A] py-2.5 pl-10 pr-4 font-mono text-sm text-white placeholder:text-zinc-500 focus:border-red-500 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={lookupLoading}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Search className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{lookupLoading ? 'Checking...' : 'Unlock'}</span>
                </button>
              </div>
              {lookupError && (
                <p role="alert" className="text-xs text-red-400">
                  {lookupError}
                </p>
              )}
            </form>

            {recentOrders.length > 0 && (
              <div className="space-y-2.5 pt-2">
                <div className="text-xs font-medium text-zinc-400">
                  Recent Verified Orders on This Device
                </div>
                <div className="divide-y divide-white/[0.06] rounded-xl border border-white/[0.08] bg-[#12141A]">
                  {recentOrders.map((ord) => (
                    <button
                      key={ord.orderId}
                      type="button"
                      onClick={() => onLookupKey(ord.accessKey || ord.orderId)}
                      className="w-full px-4 py-3 text-left hover:bg-white/[0.03] transition-colors flex items-center justify-between gap-4 cursor-pointer"
                    >
                      <div className="min-w-0">
                        <div className="font-mono text-xs font-semibold text-white truncate">
                          {ord.accessKey || ord.orderId}
                        </div>
                        <div className="mt-0.5 text-xs text-zinc-400 truncate">
                          {ord.items.map((i) => i.name).join(', ')}
                        </div>
                      </div>
                      <span className="font-mono text-xs tabular-nums text-emerald-400 shrink-0">
                        ₹{ord.totalInr} · Verified
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Unlocked Deliverable Viewer */}
          <div className="lg:col-span-7">
            {unlockedOrder && unlockedPanels.length > 0 ? (
              <div className="rounded-xl border border-white/[0.08] bg-[#12141A] p-6 sm:p-8 space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
                  <div>
                    <div className="text-xs text-emerald-400 font-medium">
                      Verified Access · Order {unlockedOrder.orderId}
                    </div>
                    <h3 className="mt-1 font-mono text-lg font-bold text-white">
                      {unlockedOrder.accessKey}
                    </h3>
                    <p className="mt-0.5 text-xs text-zinc-400">
                      Calibrated for {unlockedOrder.deviceModel} · UTR {unlockedOrder.utrReference}
                    </p>
                  </div>
                </div>

                {unlockedPanels.map((panel) => (
                  <div key={panel.id} className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-lg font-bold text-white">{panel.name}</h4>
                        <p className="text-xs text-zinc-400">
                          {panel.deliverables.presetBundleNote}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDownloadJsonBundle(panel)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.14] px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/[0.06] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <Download className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Download Pack (.json)</span>
                      </button>
                    </div>

                    {/* HUD Blueprints */}
                    <div className="space-y-3">
                      <div className="text-xs font-semibold text-zinc-300">
                        Custom HUD Coordinate Blueprints
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {panel.deliverables.hudLayouts.map((hud) => (
                          <div
                            key={hud.name}
                            className="rounded-lg border border-white/[0.08] bg-[#090A0F] p-4 space-y-2.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-semibold text-white">
                                {hud.name}
                              </span>
                              <span className="font-mono text-xs text-red-400">
                                Fire {hud.fireButtonSize}%
                              </span>
                            </div>
                            <div className="space-y-1 text-xs font-mono text-zinc-400">
                              <div>Grip: {hud.grip}</div>
                              <div>Fire: {hud.fireButtonPos}</div>
                              <div>Gloo: {hud.glooWallPos}</div>
                              <div>Jump/Scope: {hud.jumpScopePos}</div>
                            </div>
                            <p className="text-xs text-zinc-400 leading-relaxed pt-1">
                              {hud.notes}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Device Optimization Checklist */}
                    <div className="space-y-2.5">
                      <div className="text-xs font-semibold text-zinc-300">
                        Device Performance &amp; Frame Stability Checklist
                      </div>
                      <ul className="space-y-2 text-xs text-zinc-300 leading-relaxed">
                        {panel.deliverables.deviceTuningChecklist.map((step, idx) => (
                          <li key={step} className="flex items-start gap-2.5">
                            <span className="font-mono text-zinc-500 shrink-0">
                              0{idx + 1}.
                            </span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Daily Drills */}
                    <div className="space-y-2.5">
                      <div className="text-xs font-semibold text-zinc-300">
                        Ranked Warm-Up &amp; Drag Drills
                      </div>
                      <div className="divide-y divide-white/[0.06] rounded-lg border border-white/[0.08] bg-[#090A0F]">
                        {panel.deliverables.aimDrills.map((drill) => (
                          <div key={drill.drillName} className="p-3.5 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-white">
                                {drill.drillName}
                              </span>
                              <span className="font-mono text-xs text-zinc-400">
                                {drill.weapon} · {drill.duration}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-400">{drill.focus}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-white/[0.08] bg-[#12141A] p-8 sm:p-10 text-center space-y-3">
                <KeyRound className="mx-auto h-8 w-8 text-zinc-500" aria-hidden="true" />
                <h3 className="text-base font-semibold text-white">
                  No Panel Unlocked Yet
                </h3>
                <p className="mx-auto max-w-md text-sm text-zinc-400 leading-relaxed">
                  Select a Pro Panel above and complete the UPI QR checkout—or enter an existing
                  Access Key on the left—to view your HUD blueprints, device optimization steps, and
                  downloadable sensitivity pack here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
