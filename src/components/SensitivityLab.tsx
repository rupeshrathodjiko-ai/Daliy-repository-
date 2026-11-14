import {
  ArrowLeftRight,
  Check,
  ChevronDown,
  Copy,
  Crosshair,
  Download,
  Minus,
  Plus,
  RotateCcw,
  Search,
  Smartphone,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BRAND_TABS,
  DEVICES,
  PLAYSTYLES,
  calibrateDeviceSensitivity,
} from '../data/devices.ts';
import type { ClawType, DeviceProfile, PlaystyleId } from '../types.ts';
import { DeviceCompareView } from './DeviceCompareView.tsx';

interface SensitivityLabProps {
  selectedDevice: DeviceProfile;
  onSelectDevice: (device: DeviceProfile) => void;
}

type PanelMode = 'sensitivity' | 'hud_test' | 'apply_guide';
type LabViewMode = 'single' | 'compare';

export function SensitivityLab({
  selectedDevice,
  onSelectDevice,
}: SensitivityLabProps) {
  const [labView, setLabView] = useState<LabViewMode>('single');
  const [compareDeviceB, setCompareDeviceB] = useState<DeviceProfile>(() => {
    return (
      DEVICES.find(
        (d) => d.id !== selectedDevice.id && d.brand !== selectedDevice.brand
      ) ??
      DEVICES.find((d) => d.id !== selectedDevice.id) ??
      DEVICES[0]
    );
  });

  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [highlightedIdx, setHighlightedIdx] = useState(0);
  const comboboxRef = useRef<HTMLDivElement>(null);

  const [playstyle, setPlaystyle] = useState<PlaystyleId>('onetap');
  const [clawType, setClawType] = useState<ClawType>('2_finger');
  const [customDpi, setCustomDpi] = useState<number>(selectedDevice.recommendedDpi);
  const [overrides, setOverrides] = useState<
    Partial<
      Record<
        'general' | 'redDot' | 'scope2x' | 'scope4x' | 'sniperScope' | 'freeLook',
        number
      >
    >
  >({});
  const [panelMode, setPanelMode] = useState<PanelMode>('sensitivity');
  const [copied, setCopied] = useState(false);

  // Interactive HUD drag-test state
  const dragStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const [dragResult, setDragResult] = useState<{
    status: string;
    detail: string;
    hitHead: boolean;
    deltaY: number;
  } | null>(null);
  const [isDraggingFire, setIsDraggingFire] = useState(false);

  const filteredDevices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return DEVICES.filter((device) => {
      const matchesBrand = brandFilter === 'all' || device.brand === brandFilter;
      const matchesSearch =
        q === '' ||
        device.model.toLowerCase().includes(q) ||
        device.brandLabel.toLowerCase().includes(q) ||
        `${device.ramGb}gb`.includes(q);
      return matchesBrand && matchesSearch;
    });
  }, [brandFilter, searchQuery]);

  useEffect(() => {
    setHighlightedIdx(0);
  }, [filteredDevices.length, brandFilter, searchQuery]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        comboboxRef.current &&
        !comboboxRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const calibrated = useMemo(() => {
    const base = calibrateDeviceSensitivity(
      selectedDevice,
      playstyle,
      clawType,
      customDpi
    );
    return {
      ...base,
      general: overrides.general ?? base.general,
      redDot: overrides.redDot ?? base.redDot,
      scope2x: overrides.scope2x ?? base.scope2x,
      scope4x: overrides.scope4x ?? base.scope4x,
      sniperScope: overrides.sniperScope ?? base.sniperScope,
      freeLook: overrides.freeLook ?? base.freeLook,
    };
  }, [selectedDevice, playstyle, clawType, customDpi, overrides]);

  const handleDevicePick = (device: DeviceProfile) => {
    onSelectDevice(device);
    setCustomDpi(device.recommendedDpi);
    setOverrides({});
    setSearchQuery('');
    setDropdownOpen(false);
  };

  const handleEnterCompare = () => {
    if (selectedDevice.id === compareDeviceB.id) {
      const alt =
        DEVICES.find(
          (d) => d.id !== selectedDevice.id && d.brand !== selectedDevice.brand
        ) ?? DEVICES.find((d) => d.id !== selectedDevice.id);
      if (alt) setCompareDeviceB(alt);
    }
    setLabView('compare');
  };

  const handleSwapCompareDevices = () => {
    const prevA = selectedDevice;
    const prevB = compareDeviceB;
    onSelectDevice(prevB);
    setCustomDpi(prevB.recommendedDpi);
    setOverrides({});
    setCompareDeviceB(prevA);
  };

  const handleComboboxKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!dropdownOpen && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setDropdownOpen(true);
      return;
    }
    if (e.key === 'Escape') {
      setDropdownOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIdx((prev) =>
        filteredDevices.length > 0 ? (prev + 1) % filteredDevices.length : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIdx((prev) =>
        filteredDevices.length > 0
          ? (prev - 1 + filteredDevices.length) % filteredDevices.length
          : 0
      );
    } else if (e.key === 'Enter' && dropdownOpen && filteredDevices[highlightedIdx]) {
      e.preventDefault();
      handleDevicePick(filteredDevices[highlightedIdx]);
    }
  };

  const handleResetOverrides = () => {
    setCustomDpi(selectedDevice.recommendedDpi);
    setOverrides({});
  };

  const buildConfigSummaryText = () => {
    return [
      `ApexSense Free Fire Headshot Sensitivity Profile`,
      `Device: ${calibrated.device.brandLabel} ${calibrated.device.model} (${calibrated.device.refreshHz}Hz / ${calibrated.device.ramGb}GB RAM)`,
      `Playstyle: ${PLAYSTYLES.find((p) => p.id === playstyle)?.label ?? playstyle}`,
      `Grip: ${clawType.replace('_', '-')} | Recommended DPI: ${calibrated.recommendedDpi}`,
      `----------------------------------------`,
      `General: ${calibrated.general}`,
      `Red Dot: ${calibrated.redDot}`,
      `2x Scope: ${calibrated.scope2x}`,
      `4x Scope: ${calibrated.scope4x}`,
      `Sniper Scope: ${calibrated.sniperScope}`,
      `Free Look: ${calibrated.freeLook}`,
      `Fire Button Size: ${calibrated.fireButtonSize}%`,
      `Graphics: ${calibrated.graphicsPreset}`,
      `Drag Technique: ${calibrated.dragTechnique}`,
      `Tip: ${calibrated.dragTip}`,
    ].join('\n');
  };

  const handleCopyConfig = async () => {
    try {
      await navigator.clipboard.writeText(buildConfigSummaryText());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked
    }
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([buildConfigSummaryText()], {
      type: 'text/plain;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `apexsense-${selectedDevice.id}-sensitivity.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const adjustSlider = (
    key: 'general' | 'redDot' | 'scope2x' | 'scope4x' | 'sniperScope' | 'freeLook',
    nextVal: number
  ) => {
    const clamped = Math.max(20, Math.min(200, nextVal));
    setOverrides((prev) => ({ ...prev, [key]: clamped }));
  };

  const handleFirePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDraggingFire(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: performance.now(),
    };
  };

  const handleFirePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragStartRef.current) return;
    setIsDraggingFire(false);
    const start = dragStartRef.current;
    dragStartRef.current = null;

    const dy = start.y - e.clientY; // positive = dragged upward
    const dx = Math.abs(e.clientX - start.x);
    const elapsed = Math.max(30, performance.now() - start.time);
    const velocity = (dy / elapsed) * 100;

    if (dy < 16) {
      setDragResult({
        status: 'Body Lock Only',
        detail: `Dragged ${Math.round(dy)}px upward. Swipe smoothly up ~35–75px from the fire button to snap to head height.`,
        hitHead: false,
        deltaY: Math.round(dy),
      });
    } else if (dy > 115 || velocity > 95) {
      setDragResult({
        status: 'Over-Dragged Above Head',
        detail: `Swipe too fast (${Math.round(dy)}px). Ease upward flick speed or lower General by 5 points.`,
        hitHead: false,
        deltaY: Math.round(dy),
      });
    } else {
      const curveNote =
        dx >= 8 && dx <= 36 ? 'Clean J-Curve Arc' : 'Straight Up-Drag';
      setDragResult({
        status: 'Headshot Snap Connected',
        detail: `${curveNote} (${Math.round(dy)}px lift) matched ${calibrated.general} General & ${calibrated.fireButtonSize}% Fire Button.`,
        hitHead: true,
        deltaY: Math.round(dy),
      });
    }
  };

  const sliderRows: {
    key: 'general' | 'redDot' | 'scope2x' | 'scope4x' | 'sniperScope' | 'freeLook';
    label: string;
    value: number;
    helper: string;
  }[] = [
    {
      key: 'general',
      label: 'General',
      value: calibrated.general,
      helper: 'Camera rotation & close-range one-tap drag speed',
    },
    {
      key: 'redDot',
      label: 'Red Dot',
      value: calibrated.redDot,
      helper: 'Unscoped / Red Dot head-level lock stability',
    },
    {
      key: 'scope2x',
      label: '2x Scope',
      value: calibrated.scope2x,
      helper: 'Mid-range AR & SMG drag tracking',
    },
    {
      key: 'scope4x',
      label: '4x Scope',
      value: calibrated.scope4x,
      helper: 'Long-range Woodpecker, AC80 & SCAR head bursts',
    },
    {
      key: 'sniperScope',
      label: 'Sniper Scope',
      value: calibrated.sniperScope,
      helper: 'AWM / M82B quick-scope flick precision',
    },
    {
      key: 'freeLook',
      label: 'Free Look',
      value: calibrated.freeLook,
      helper: '360° sprint awareness & flank checking',
    },
  ];

  return (
    <section id="configurator" className="border-b border-white/[0.08] py-16">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8 border-b border-white/[0.08]">
          <div className="space-y-2">
            <p className="text-xs font-medium text-zinc-400">
              Device Calibration Lab · 0–200 Scale
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-white">
              Select Your Phone Model &amp; Apply Game Settings
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div
              role="tablist"
              aria-label="Calibration lab view mode"
              className="inline-flex items-center gap-1 rounded-lg border border-white/[0.1] bg-[#12141A] p-1"
            >
              <button
                type="button"
                role="tab"
                aria-selected={labView === 'single'}
                onClick={() => setLabView('single')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  labView === 'single'
                    ? 'bg-red-600 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Single Calibrator
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={labView === 'compare'}
                onClick={handleEnterCompare}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  labView === 'compare'
                    ? 'bg-red-600 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <ArrowLeftRight className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Compare Devices</span>
              </button>
            </div>

            {labView === 'single' && (
              <button
                type="button"
                onClick={handleResetOverrides}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.12] bg-[#12141A] px-3.5 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:border-white/25 transition-colors cursor-pointer whitespace-nowrap"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Reset Defaults</span>
              </button>
            )}
          </div>
        </div>

        {labView === 'compare' ? (
          <DeviceCompareView
            deviceA={selectedDevice}
            deviceB={compareDeviceB}
            playstyle={playstyle}
            clawType={clawType}
            onChangeDeviceA={(device) => {
              onSelectDevice(device);
              setCustomDpi(device.recommendedDpi);
              setOverrides({});
            }}
            onChangeDeviceB={setCompareDeviceB}
            onSwapDevices={handleSwapCompareDevices}
            onChangePlaystyle={(next) => {
              setPlaystyle(next);
              setOverrides({});
            }}
            onChangeClawType={(next) => {
              setClawType(next);
              setOverrides({});
            }}
            onApplyToLab={(device) => {
              onSelectDevice(device);
              setCustomDpi(device.recommendedDpi);
              setOverrides({});
              setLabView('single');
            }}
          />
        ) : (
          <>

        {/* Brand Tabs */}
        <div
          role="tablist"
          aria-label="Mobile device brand filter"
          className="mt-8 flex items-center gap-1.5 overflow-x-auto pb-1"
        >
          {BRAND_TABS.map((tab) => {
            const active = brandFilter === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={active}
                type="button"
                onClick={() => {
                  setBrandFilter(tab.id);
                  setDropdownOpen(true);
                }}
                className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-red-600 text-white'
                    : 'bg-[#12141A] text-zinc-400 hover:text-white border border-white/[0.08]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Main 12-column Calibration Workspace */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Searchable Dropdown + Playstyle + Grip/DPI */}
          <div className="lg:col-span-5 space-y-6">
            {/* Searchable Device Combobox */}
            <div ref={comboboxRef} className="relative space-y-2.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="device-combobox-input"
                  className="text-xs font-medium text-zinc-400"
                >
                  Search &amp; Select Mobile Model ({filteredDevices.length})
                </label>
                <span className="text-xs text-zinc-500">Type any model</span>
              </div>

              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400"
                  aria-hidden="true"
                />
                <input
                  id="device-combobox-input"
                  type="text"
                  role="combobox"
                  aria-expanded={dropdownOpen}
                  aria-controls="device-combobox-listbox"
                  aria-autocomplete="list"
                  value={searchQuery}
                  onFocus={() => setDropdownOpen(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setDropdownOpen(true);
                  }}
                  onKeyDown={handleComboboxKeyDown}
                  placeholder={`${selectedDevice.brandLabel} ${selectedDevice.model} — search to change`}
                  className="w-full rounded-xl border border-white/[0.12] bg-[#12141A] py-3 pl-10 pr-16 text-sm text-white placeholder:text-zinc-300 focus:border-red-500 focus:outline-none"
                />

                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setDropdownOpen(true);
                      }}
                      aria-label="Clear device search"
                      className="rounded p-1 text-zinc-400 hover:text-white cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setDropdownOpen((o) => !o)}
                    aria-label="Toggle mobile model dropdown"
                    className="rounded p-1 text-zinc-400 hover:text-white cursor-pointer"
                  >
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-150 ${
                        dropdownOpen ? 'rotate-180' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                </div>
              </div>

              {/* Floating Searchable Dropdown List */}
              {dropdownOpen && (
                <div
                  id="device-combobox-listbox"
                  role="listbox"
                  aria-label="Matching mobile models"
                  className="absolute left-0 right-0 z-30 mt-1.5 max-h-72 overflow-y-auto rounded-xl border border-white/[0.14] bg-[#141720] shadow-2xl divide-y divide-white/[0.06]"
                >
                  {filteredDevices.length === 0 ? (
                    <div className="p-4 text-center text-xs text-zinc-400">
                      No mobile model matching &ldquo;{searchQuery}&rdquo;. Try another brand tab.
                    </div>
                  ) : (
                    filteredDevices.map((device, index) => {
                      const isSelected = device.id === selectedDevice.id;
                      const isHighlighted = index === highlightedIdx;
                      return (
                        <button
                          key={device.id}
                          role="option"
                          aria-selected={isSelected}
                          type="button"
                          onMouseEnter={() => setHighlightedIdx(index)}
                          onClick={() => handleDevicePick(device)}
                          className={`w-full text-left px-4 py-3 flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-red-600/20 text-white'
                              : isHighlighted
                                ? 'bg-white/[0.06] text-white'
                                : 'text-zinc-300'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="text-sm font-semibold truncate">
                              {device.brandLabel} {device.model}
                            </div>
                            <div className="mt-0.5 font-mono text-xs tabular-nums text-zinc-400">
                              {device.ramGb}GB RAM · {device.refreshHz}Hz · {device.touchSamplingHz}Hz Touch
                            </div>
                          </div>
                          {isSelected && (
                            <Check
                              className="h-4 w-4 text-red-400 shrink-0"
                              aria-hidden="true"
                            />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              )}

              {/* Active Device Hardware Readout */}
              <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-[#12141A] px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Smartphone
                    className="h-4 w-4 text-red-400 shrink-0"
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white truncate">
                      {selectedDevice.brandLabel} {selectedDevice.model}
                    </div>
                    <div className="font-mono text-xs tabular-nums text-zinc-400">
                      {selectedDevice.screenInches}&Prime; · {selectedDevice.refreshHz}Hz · {selectedDevice.ramGb}GB RAM
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDropdownOpen(true)}
                  className="text-xs font-medium text-red-400 hover:text-red-300 shrink-0 cursor-pointer"
                >
                  Change
                </button>
              </div>
            </div>

            {/* Playstyle Selector */}
            <div className="space-y-3">
              <label className="block text-xs font-medium text-zinc-400">
                Match Playstyle &amp; Weapon Focus
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {PLAYSTYLES.map((style) => {
                  const active = playstyle === style.id;
                  return (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => {
                        setPlaystyle(style.id);
                        setOverrides({});
                      }}
                      className={`rounded-lg border px-3.5 py-2.5 text-left transition-colors duration-150 cursor-pointer ${
                        active
                          ? 'border-red-500 bg-red-600/10 text-white'
                          : 'border-white/[0.08] bg-[#12141A] text-zinc-400 hover:text-white'
                      }`}
                    >
                      <div className="text-xs font-semibold">{style.label}</div>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {PLAYSTYLES.find((p) => p.id === playstyle)?.summary}
              </p>
            </div>

            {/* Finger Grip + Custom DPI */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <span className="block text-xs font-medium text-zinc-400">
                  Control Grip
                </span>
                <div className="flex items-center gap-1 p-1 rounded-lg bg-[#12141A] border border-white/[0.08]">
                  {(
                    [
                      { id: '2_finger', label: '2-Finger' },
                      { id: '3_finger', label: '3-Finger' },
                      { id: '4_finger', label: '4-Finger' },
                    ] as const
                  ).map((grip) => (
                    <button
                      key={grip.id}
                      type="button"
                      onClick={() => {
                        setClawType(grip.id);
                        setOverrides({});
                      }}
                      className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                        clawType === grip.id
                          ? 'bg-red-600 text-white'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {grip.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-zinc-400">Device DPI</span>
                  <span className="font-mono tabular-nums font-semibold text-white">
                    {customDpi} dp
                  </span>
                </div>
                <input
                  type="range"
                  min={320}
                  max={720}
                  step={10}
                  value={customDpi}
                  onChange={(e) => {
                    setCustomDpi(Number(e.target.value));
                    setOverrides({});
                  }}
                  aria-label="Device DPI calibration"
                  className="precision-slider w-full mt-2"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Game-App Style Calibration Panel */}
          <div className="lg:col-span-7 rounded-xl border border-white/[0.08] bg-[#12141A] p-6 sm:p-8 space-y-6">
            {/* Top Bar inside Game Panel */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
              <div>
                <div className="text-xs text-zinc-400">
                  Free Fire Game Settings Preset
                </div>
                <h3 className="mt-1 text-xl font-bold text-white">
                  {calibrated.device.brandLabel} {calibrated.device.model}
                </h3>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyConfig}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-500 transition-colors cursor-pointer whitespace-nowrap"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Copy Settings</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadTxt}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.12] px-3.5 py-2 text-xs font-medium text-zinc-200 hover:bg-white/[0.05] transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Download className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Save TXT</span>
                </button>
              </div>
            </div>

            {/* Game App Mode Switcher */}
            <div className="flex items-center gap-1.5 rounded-lg bg-[#090A0F] p-1 border border-white/[0.08]">
              {(
                [
                  { id: 'sensitivity', label: 'Sensitivity Bars' },
                  { id: 'hud_test', label: 'In-Game HUD & Drag Test' },
                  { id: 'apply_guide', label: 'Apply in Game Steps' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setPanelMode(tab.id)}
                  className={`flex-1 py-2 px-3 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    panelMode === tab.id
                      ? 'bg-[#1D212B] text-white border border-white/[0.1]'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Mode 1: Game-Style Horizontal Sensitivity Bars */}
            {panelMode === 'sensitivity' && (
              <div className="space-y-4">
                {sliderRows.map((row) => {
                  const pct = ((row.value - 0) / 200) * 100;
                  return (
                    <div
                      key={row.key}
                      className="rounded-lg border border-white/[0.06] bg-[#090A0F] px-4 py-3 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <label
                            htmlFor={`slider-${row.key}`}
                            className="text-sm font-semibold text-white"
                          >
                            {row.label}
                          </label>
                          <p className="text-xs text-zinc-500 truncate">
                            {row.helper}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => adjustSlider(row.key, row.value - 1)}
                            aria-label={`Decrease ${row.label}`}
                            className="rounded border border-white/[0.1] bg-[#12141A] p-1 text-zinc-400 hover:text-white cursor-pointer"
                          >
                            <Minus className="h-3 w-3" aria-hidden="true" />
                          </button>
                          <span className="w-11 text-center font-mono text-base font-bold tabular-nums text-red-400">
                            {row.value}
                          </span>
                          <button
                            type="button"
                            onClick={() => adjustSlider(row.key, row.value + 1)}
                            aria-label={`Increase ${row.label}`}
                            className="rounded border border-white/[0.1] bg-[#12141A] p-1 text-zinc-400 hover:text-white cursor-pointer"
                          >
                            <Plus className="h-3 w-3" aria-hidden="true" />
                          </button>
                        </div>
                      </div>

                      <div className="relative flex items-center">
                        <div className="pointer-events-none absolute inset-x-0 h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
                          <div
                            className="h-full bg-red-600"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <input
                          id={`slider-${row.key}`}
                          type="range"
                          min={20}
                          max={200}
                          step={1}
                          value={row.value}
                          onChange={(e) =>
                            adjustSlider(row.key, Number(e.target.value))
                          }
                          className="precision-slider relative z-10 w-full"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Mode 2: Interactive Landscape In-Game HUD & Drag Practice */}
            {panelMode === 'hud_test' && (
              <div className="space-y-4">
                <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl border border-white/[0.12] bg-gradient-to-b from-[#131722] via-[#0D1017] to-[#090A0F] select-none touch-none">
                  {/* Top Game HUD Strip */}
                  <div className="absolute top-3 left-4 right-4 flex items-center justify-between text-[11px] font-mono text-zinc-400">
                    <span>HUD: {clawType.replace('_', '-')}</span>
                    <span>Fire Button: {calibrated.fireButtonSize}%</span>
                  </div>

                  {/* Center Opponent Target Silhouette */}
                  <div className="pointer-events-none absolute left-1/2 top-[34%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors ${
                        dragResult?.hitHead
                          ? 'border-red-500 bg-red-500/20'
                          : 'border-white/30 bg-white/[0.03]'
                      }`}
                    >
                      <Crosshair
                        className={`h-5 w-5 ${
                          dragResult?.hitHead ? 'text-red-400' : 'text-zinc-300'
                        }`}
                        aria-hidden="true"
                      />
                    </div>
                    <div className="mt-1 h-11 w-6 rounded-t-md border border-white/20 bg-white/[0.04]" />
                    <span className="mt-1.5 font-mono text-[10px] text-zinc-500">
                      Target Head Zone
                    </span>
                  </div>

                  {/* Left HUD Controls (Joystick + Gloo Wall) */}
                  <div className="pointer-events-none absolute bottom-5 left-6 flex items-end gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-white/[0.04]">
                      <div className="h-6 w-6 rounded-full bg-white/25" />
                    </div>
                    <div className="rounded-lg border border-white/20 bg-white/[0.05] px-2.5 py-2 text-[10px] font-mono text-zinc-300">
                      Gloo
                    </div>
                  </div>

                  {/* Right HUD Controls (Jump, Crouch, Scope + Interactive Fire Button) */}
                  <div className="absolute right-6 bottom-5 flex items-end gap-3">
                    <div className="pointer-events-none flex flex-col gap-2 text-[10px] font-mono text-zinc-300">
                      <div className="rounded-full border border-white/20 bg-white/[0.05] px-2.5 py-1.5 text-center">
                        Scope
                      </div>
                      <div className="rounded-full border border-white/20 bg-white/[0.05] px-2.5 py-1.5 text-center">
                        Crouch
                      </div>
                    </div>

                    <button
                      type="button"
                      onPointerDown={handleFirePointerDown}
                      onPointerUp={handleFirePointerUp}
                      style={{
                        width: `${Math.round(calibrated.fireButtonSize * 1.45)}px`,
                        height: `${Math.round(calibrated.fireButtonSize * 1.45)}px`,
                      }}
                      className={`flex flex-col items-center justify-center rounded-full border-2 text-white transition-transform cursor-grab active:cursor-grabbing ${
                        isDraggingFire
                          ? 'scale-95 border-red-400 bg-red-600/40'
                          : 'border-red-500 bg-red-600/25 hover:bg-red-600/35'
                      }`}
                    >
                      <Crosshair className="h-4 w-4" aria-hidden="true" />
                      <span className="mt-0.5 font-mono text-[9px] font-bold">
                        DRAG UP
                      </span>
                    </button>
                  </div>
                </div>

                <div className="rounded-lg border border-white/[0.08] bg-[#090A0F] px-4 py-3 text-xs">
                  {dragResult ? (
                    <div className="space-y-1">
                      <div
                        className={`font-semibold ${
                          dragResult.hitHead ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {dragResult.status} ({dragResult.deltaY}px upward swipe)
                      </div>
                      <p className="text-zinc-400">{dragResult.detail}</p>
                    </div>
                  ) : (
                    <p className="text-zinc-400">
                      Hold the <strong className="text-white">DRAG UP</strong> fire button inside
                      the game preview and swipe upward to test the {calibrated.dragTechnique}{' '}
                      stroke length for your {calibrated.fireButtonSize}% button size.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Mode 3: Step-by-Step Game Application Guide */}
            {panelMode === 'apply_guide' && (
              <ol className="space-y-3 text-xs text-zinc-300">
                <li className="rounded-lg border border-white/[0.08] bg-[#090A0F] p-4 space-y-1">
                  <div className="font-semibold text-white">
                    01. Enter Sensitivity in Free Fire Settings
                  </div>
                  <p className="text-zinc-400 leading-relaxed">
                    Open Free Fire &rarr; Settings (gear icon) &rarr; Sensitivity tab, then enter:
                    General <span className="font-mono text-white">{calibrated.general}</span>, Red Dot{' '}
                    <span className="font-mono text-white">{calibrated.redDot}</span>, 2x{' '}
                    <span className="font-mono text-white">{calibrated.scope2x}</span>, 4x{' '}
                    <span className="font-mono text-white">{calibrated.scope4x}</span>, Sniper{' '}
                    <span className="font-mono text-white">{calibrated.sniperScope}</span>, Free Look{' '}
                    <span className="font-mono text-white">{calibrated.freeLook}</span>.
                  </p>
                </li>
                <li className="rounded-lg border border-white/[0.08] bg-[#090A0F] p-4 space-y-1">
                  <div className="font-semibold text-white">
                    02. Resize Fire Button in Custom HUD
                  </div>
                  <p className="text-zinc-400 leading-relaxed">
                    Go to Controls &rarr; Custom HUD &rarr; select the right Fire Button and set size
                    to <span className="font-mono text-white">{calibrated.fireButtonSize}%</span>{' '}
                    positioned low enough to give your thumb clean upward drag space.
                  </p>
                </li>
                <li className="rounded-lg border border-white/[0.08] bg-[#090A0F] p-4 space-y-1">
                  <div className="font-semibold text-white">
                    03. Set Device DPI &amp; Graphics Preset
                  </div>
                  <p className="text-zinc-400 leading-relaxed">
                    {selectedDevice.brand === 'apple'
                      ? 'Open iOS Settings → Accessibility → Touch → AssistiveTouch → Tracking Sensitivity near 70%, and set Display Graphics to '
                      : `Open Android Settings → Developer Options → Smallest Width and set ${calibrated.recommendedDpi} dp, with Display Graphics on `}
                    <span className="text-white">{calibrated.graphicsPreset}</span>.
                  </p>
                </li>
              </ol>
            )}

            {/* Hardware & Fire Button Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5 border-t border-white/[0.08]">
              <div>
                <div className="text-xs text-zinc-400">Fire Button Size</div>
                <div className="mt-1 font-mono text-lg font-semibold tabular-nums text-white">
                  {calibrated.fireButtonSize}%
                </div>
              </div>
              <div>
                <div className="text-xs text-zinc-400">Recommended DPI</div>
                <div className="mt-1 font-mono text-lg font-semibold tabular-nums text-white">
                  {calibrated.recommendedDpi} dp
                </div>
              </div>
              <div>
                <div className="text-xs text-zinc-400">Graphics &amp; FPS</div>
                <div className="mt-1 text-sm font-semibold text-white">
                  {calibrated.graphicsPreset}
                </div>
              </div>
            </div>

            {/* Technique & Device Note */}
            <div className="space-y-2 pt-5 border-t border-white/[0.08]">
              <div className="text-xs font-semibold text-zinc-300">
                Recommended Drag Technique: {calibrated.dragTechnique}
              </div>
              <p className="text-sm leading-relaxed text-zinc-400">
                {calibrated.dragTip}
              </p>
              <p className="text-xs leading-relaxed text-zinc-500">
                Hardware Note: {calibrated.device.deviceNote}
              </p>
            </div>
          </div>
        </div>
          </>
        )}
      </div>
    </section>
  );
}
