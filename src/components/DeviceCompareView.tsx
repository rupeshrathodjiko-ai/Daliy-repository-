import {
  ArrowLeftRight,
  Check,
  ChevronDown,
  Crosshair,
  Search,
  Smartphone,
  Trophy,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  DEVICES,
  PLAYSTYLES,
  calibrateDeviceSensitivity,
} from '../data/devices.ts';
import type {
  CalibratedSettings,
  ClawType,
  DeviceProfile,
  PlaystyleId,
} from '../types.ts';

interface DeviceCompareViewProps {
  deviceA: DeviceProfile;
  deviceB: DeviceProfile;
  playstyle: PlaystyleId;
  clawType: ClawType;
  onChangeDeviceA: (device: DeviceProfile) => void;
  onChangeDeviceB: (device: DeviceProfile) => void;
  onSwapDevices: () => void;
  onChangePlaystyle: (playstyle: PlaystyleId) => void;
  onChangeClawType: (clawType: ClawType) => void;
  onApplyToLab: (device: DeviceProfile) => void;
}

interface HeadshotScoreBreakdown {
  total: number;
  touchResponse: number; // max 40
  dragPrecision: number; // max 35
  frameStability: number; // max 25
}

function computeHeadshotScore(
  device: DeviceProfile,
  calibrated: CalibratedSettings
): HeadshotScoreBreakdown {
  // 1. Touch & Display Latency (max 40)
  const touchPts = Math.min(
    24,
    Math.round((Math.min(device.touchSamplingHz, 720) / 360) * 18)
  );
  const refreshPts =
    device.refreshHz >= 144
      ? 16
      : device.refreshHz >= 120
        ? 14
        : device.refreshHz >= 90
          ? 10
          : 6;
  const touchResponse = Math.min(40, touchPts + refreshPts);

  // 2. Drag Precision & Sensitivity Headroom (max 35)
  const ratio = calibrated.general / Math.max(1, calibrated.redDot);
  const ratioPts = Math.max(8, Math.round(18 - Math.abs(ratio - 1.1) * 45));
  const firePts =
    calibrated.fireButtonSize <= 47
      ? 10
      : calibrated.fireButtonSize <= 50
        ? 8
        : 6;
  const headroomPts =
    calibrated.general >= 172 && calibrated.general <= 198 ? 7 : 5;
  const dragPrecision = Math.min(35, ratioPts + firePts + headroomPts);

  // 3. Sustained Frame & Drag Canvas Stability (max 25)
  const ramPts =
    device.ramGb >= 12
      ? 15
      : device.ramGb >= 8
        ? 13
        : device.ramGb >= 6
          ? 10
          : 7;
  const canvasPts = device.screenInches >= 6.5 ? 10 : 8;
  const frameStability = Math.min(25, ramPts + canvasPts);

  return {
    total: touchResponse + dragPrecision + frameStability,
    touchResponse,
    dragPrecision,
    frameStability,
  };
}

interface CompareComboboxProps {
  slotLabel: 'Device A' | 'Device B';
  accentClass: string;
  selected: DeviceProfile;
  otherDeviceId: string;
  onSelect: (device: DeviceProfile) => void;
  onApplyToLab: (device: DeviceProfile) => void;
}

function CompareCombobox({
  slotLabel,
  accentClass,
  selected,
  otherDeviceId,
  onSelect,
  onApplyToLab,
}: CompareComboboxProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DEVICES.filter((d) => {
      if (!q) return true;
      return (
        d.model.toLowerCase().includes(q) ||
        d.brandLabel.toLowerCase().includes(q) ||
        `${d.ramGb}gb`.includes(q)
      );
    });
  }, [query]);

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative rounded-xl border border-white/[0.08] bg-[#12141A] p-4 space-y-3"
    >
      <div className="flex items-center justify-between gap-2">
        <span className={`text-xs font-semibold ${accentClass}`}>
          {slotLabel}
        </span>
        <button
          type="button"
          onClick={() => onApplyToLab(selected)}
          className="text-xs font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          Open in Calibrator &rarr;
        </button>
      </div>

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400"
          aria-hidden="true"
        />
        <input
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-label={`Search ${slotLabel} phone model`}
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          placeholder={`${selected.brandLabel} ${selected.model}`}
          className="w-full rounded-lg border border-white/[0.12] bg-[#090A0F] py-2.5 pl-9 pr-14 text-sm text-white placeholder:text-zinc-200 focus:border-red-500 focus:outline-none"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setOpen(true);
              }}
              aria-label={`Clear ${slotLabel} search`}
              className="rounded p-1 text-zinc-400 hover:text-white cursor-pointer"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            aria-label={`Toggle ${slotLabel} device list`}
            className="rounded p-1 text-zinc-400 hover:text-white cursor-pointer"
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-150 ${
                open ? 'rotate-180' : ''
              }`}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {open && (
        <div
          role="listbox"
          aria-label={`${slotLabel} model options`}
          className="absolute left-4 right-4 z-30 top-[106px] max-h-64 overflow-y-auto rounded-xl border border-white/[0.14] bg-[#141720] shadow-2xl divide-y divide-white/[0.06]"
        >
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-xs text-zinc-400">
              No model matching &ldquo;{query}&rdquo;.
            </div>
          ) : (
            filtered.map((device) => {
              const isCurrent = device.id === selected.id;
              const isOther = device.id === otherDeviceId;
              return (
                <button
                  key={device.id}
                  type="button"
                  role="option"
                  aria-selected={isCurrent}
                  disabled={isOther}
                  onClick={() => {
                    onSelect(device);
                    setQuery('');
                    setOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between gap-2 transition-colors ${
                    isOther
                      ? 'opacity-45 cursor-not-allowed text-zinc-500'
                      : isCurrent
                        ? 'bg-red-600/20 text-white cursor-pointer'
                        : 'text-zinc-300 hover:bg-white/[0.06] cursor-pointer'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-xs font-semibold truncate">
                      {device.brandLabel} {device.model}
                    </div>
                    <div className="font-mono text-[11px] tabular-nums text-zinc-400">
                      {device.refreshHz}Hz · {device.touchSamplingHz}Hz Touch ·{' '}
                      {device.ramGb}GB RAM
                    </div>
                  </div>
                  {isCurrent && (
                    <Check
                      className="h-3.5 w-3.5 text-red-400 shrink-0"
                      aria-hidden="true"
                    />
                  )}
                  {isOther && (
                    <span className="text-[10px] font-mono text-zinc-500 shrink-0">
                      In other slot
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 pt-1 text-xs text-zinc-400">
        <span className="inline-flex items-center gap-1.5 font-mono tabular-nums">
          <Smartphone className="h-3.5 w-3.5 text-zinc-500" aria-hidden="true" />
          {selected.screenInches}&Prime; · {selected.refreshHz}Hz ·{' '}
          {selected.touchSamplingHz}Hz Touch
        </span>
        <span className="font-mono tabular-nums text-zinc-300">
          {selected.ramGb}GB RAM
        </span>
      </div>
    </div>
  );
}

export function DeviceCompareView({
  deviceA,
  deviceB,
  playstyle,
  clawType,
  onChangeDeviceA,
  onChangeDeviceB,
  onSwapDevices,
  onChangePlaystyle,
  onChangeClawType,
  onApplyToLab,
}: DeviceCompareViewProps) {
  const calA = useMemo(
    () => calibrateDeviceSensitivity(deviceA, playstyle, clawType),
    [deviceA, playstyle, clawType]
  );
  const calB = useMemo(
    () => calibrateDeviceSensitivity(deviceB, playstyle, clawType),
    [deviceB, playstyle, clawType]
  );

  const scoreA = useMemo(
    () => computeHeadshotScore(deviceA, calA),
    [deviceA, calA]
  );
  const scoreB = useMemo(
    () => computeHeadshotScore(deviceB, calB),
    [deviceB, calB]
  );

  const diff = scoreA.total - scoreB.total;
  const winnerSide: 'A' | 'B' | 'tie' =
    diff > 0 ? 'A' : diff < 0 ? 'B' : 'tie';
  const winnerDevice = winnerSide === 'A' ? deviceA : deviceB;
  const loserDevice = winnerSide === 'A' ? deviceB : deviceA;

  const verdictReasons = useMemo(() => {
    const reasons: string[] = [];
    if (deviceA.touchSamplingHz !== deviceB.touchSamplingHz) {
      const faster =
        deviceA.touchSamplingHz > deviceB.touchSamplingHz ? deviceA : deviceB;
      const slower = faster.id === deviceA.id ? deviceB : deviceA;
      reasons.push(
        `${faster.brandLabel} ${faster.model} samples finger drags faster (${faster.touchSamplingHz}Hz vs ${slower.touchSamplingHz}Hz touch sampling).`
      );
    }
    if (deviceA.refreshHz !== deviceB.refreshHz) {
      const smoother =
        deviceA.refreshHz > deviceB.refreshHz ? deviceA : deviceB;
      const lower = smoother.id === deviceA.id ? deviceB : deviceA;
      reasons.push(
        `${smoother.refreshHz}Hz display on ${smoother.model} renders clearer enemy head movement than ${lower.refreshHz}Hz on ${lower.model}.`
      );
    }
    if (calA.fireButtonSize !== calB.fireButtonSize) {
      const tighter =
        calA.fireButtonSize < calB.fireButtonSize ? deviceA : deviceB;
      const tighterPct = Math.min(calA.fireButtonSize, calB.fireButtonSize);
      const widerPct = Math.max(calA.fireButtonSize, calB.fireButtonSize);
      reasons.push(
        `${tighter.model} pairs with a more compact ${tighterPct}% fire button (vs ${widerPct}%) for extra upward J-drag travel.`
      );
    }
    if (deviceA.ramGb !== deviceB.ramGb) {
      const higherRam = deviceA.ramGb > deviceB.ramGb ? deviceA : deviceB;
      reasons.push(
        `${higherRam.ramGb}GB RAM sustains higher FPS stability during intense final-zone Clash Squad fights.`
      );
    }
    return reasons.slice(0, 3);
  }, [deviceA, deviceB, calA.fireButtonSize, calB.fireButtonSize]);

  const sensitivityAxes = [
    {
      label: 'General',
      helper: 'Close-range one-tap & camera flick speed',
      valA: calA.general,
      valB: calB.general,
    },
    {
      label: 'Red Dot',
      helper: 'Head-level aim-assist snap stability',
      valA: calA.redDot,
      valB: calB.redDot,
    },
    {
      label: '2x Scope',
      helper: 'Mid-range SMG & AR drag control',
      valA: calA.scope2x,
      valB: calB.scope2x,
    },
    {
      label: '4x Scope',
      helper: 'Long-range Woodpecker / AC80 bursts',
      valA: calA.scope4x,
      valB: calB.scope4x,
    },
    {
      label: 'Sniper Scope',
      helper: 'AWM / M82B quick-scope precision',
      valA: calA.sniperScope,
      valB: calB.sniperScope,
    },
    {
      label: 'Free Look',
      helper: '360° sprint & flank awareness',
      valA: calA.freeLook,
      valB: calB.freeLook,
    },
  ];

  return (
    <div className="mt-8 space-y-8">
      {/* Shared Playstyle + Grip Fairness Controls */}
      <div className="rounded-xl border border-white/[0.08] bg-[#12141A] p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <span className="block text-xs font-medium text-zinc-400">
            Matched Playstyle Preset
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {PLAYSTYLES.map((style) => {
              const active = playstyle === style.id;
              return (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => onChangePlaystyle(style.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    active
                      ? 'bg-red-600 text-white'
                      : 'bg-[#090A0F] text-zinc-400 hover:text-white border border-white/[0.08]'
                  }`}
                >
                  {style.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-1.5 shrink-0">
          <span className="block text-xs font-medium text-zinc-400">
            Control Grip
          </span>
          <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-[#090A0F] border border-white/[0.08]">
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
                onClick={() => onChangeClawType(grip.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
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
      </div>

      {/* Dual Searchable Device Selectors + Swap */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 items-center">
        <CompareCombobox
          slotLabel="Device A"
          accentClass="text-red-400"
          selected={deviceA}
          otherDeviceId={deviceB.id}
          onSelect={onChangeDeviceA}
          onApplyToLab={onApplyToLab}
        />

        <div className="flex justify-center">
          <button
            type="button"
            onClick={onSwapDevices}
            aria-label="Swap Device A and Device B"
            className="inline-flex items-center gap-2 rounded-lg border border-white/[0.12] bg-[#12141A] px-3.5 py-2.5 text-xs font-semibold text-zinc-200 hover:text-white hover:border-white/25 transition-colors cursor-pointer"
          >
            <ArrowLeftRight className="h-4 w-4 text-red-400" aria-hidden="true" />
            <span className="lg:hidden">Swap Devices</span>
          </button>
        </div>

        <CompareCombobox
          slotLabel="Device B"
          accentClass="text-sky-400"
          selected={deviceB}
          otherDeviceId={deviceA.id}
          onSelect={onChangeDeviceB}
          onApplyToLab={onApplyToLab}
        />
      </div>

      {/* Headshot Optimization Verdict Summary */}
      <div className="rounded-xl border border-white/[0.08] bg-[#12141A] p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
          <div className="flex items-start gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
              <Trophy className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <div className="text-xs font-medium text-zinc-400">
                Headshot Optimization Verdict
              </div>
              <h3 className="mt-0.5 text-lg sm:text-xl font-bold text-white">
                {winnerSide === 'tie'
                  ? `Even Match: ${deviceA.model} & ${deviceB.model} (${scoreA.total}/100)`
                  : `${winnerDevice.brandLabel} ${winnerDevice.model} leads by +${Math.abs(
                      diff
                    )} pts over ${loserDevice.model}`}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0 font-mono tabular-nums">
            <div className="text-right">
              <div className="text-[11px] text-red-400">Device A</div>
              <div className="text-2xl font-bold text-white">
                {scoreA.total}
                <span className="text-xs text-zinc-500">/100</span>
              </div>
            </div>
            <div className="h-8 w-px bg-white/[0.1]" aria-hidden="true" />
            <div className="text-left">
              <div className="text-[11px] text-sky-400">Device B</div>
              <div className="text-2xl font-bold text-white">
                {scoreB.total}
                <span className="text-xs text-zinc-500">/100</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sub-score Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              title: 'Touch & Display Latency',
              max: 40,
              a: scoreA.touchResponse,
              b: scoreB.touchResponse,
            },
            {
              title: 'Drag Ratio & Fire Headroom',
              max: 35,
              a: scoreA.dragPrecision,
              b: scoreB.dragPrecision,
            },
            {
              title: 'Ranked Frame & Canvas Stability',
              max: 25,
              a: scoreA.frameStability,
              b: scoreB.frameStability,
            },
          ].map((metric) => {
            const pctA = Math.round((metric.a / metric.max) * 100);
            const pctB = Math.round((metric.b / metric.max) * 100);
            return (
              <div
                key={metric.title}
                className="rounded-lg border border-white/[0.06] bg-[#090A0F] p-4 space-y-3"
              >
                <div className="text-xs font-medium text-zinc-300">
                  {metric.title}
                </div>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                      <span className="text-red-400 truncate pr-2">
                        {deviceA.model}
                      </span>
                      <span className="text-white font-semibold">
                        {metric.a}/{metric.max}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
                      <div
                        className="h-full bg-red-500 transition-all duration-300"
                        style={{ width: `${pctA}%` }}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                      <span className="text-sky-400 truncate pr-2">
                        {deviceB.model}
                      </span>
                      <span className="text-white font-semibold">
                        {metric.b}/{metric.max}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
                      <div
                        className="h-full bg-sky-500 transition-all duration-300"
                        style={{ width: `${pctB}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {verdictReasons.length > 0 && (
          <ul className="space-y-1.5 pt-2 border-t border-white/[0.06] text-xs text-zinc-300">
            {verdictReasons.map((reason) => (
              <li key={reason} className="flex items-start gap-2">
                <Crosshair
                  className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Side-by-Side Sensitivity Comparison Matrix (0–200 Scale) */}
      <div className="rounded-xl border border-white/[0.08] bg-[#12141A] p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-white/[0.08]">
          <div>
            <h3 className="text-base font-bold text-white">
              Side-by-Side Sensitivity Calibration (0–200 Scale)
            </h3>
            <p className="text-xs text-zinc-400">
              Comparing calibrated values at recommended DPI for each phone
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-red-400">
              A: {deviceA.brandLabel} {deviceA.model}
            </span>
            <span className="text-sky-400">
              B: {deviceB.brandLabel} {deviceB.model}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {sensitivityAxes.map((axis) => {
            const pctA = Math.min(100, Math.round((axis.valA / 200) * 100));
            const pctB = Math.min(100, Math.round((axis.valB / 200) * 100));
            const delta = axis.valA - axis.valB;
            return (
              <div
                key={axis.label}
                className="rounded-lg border border-white/[0.06] bg-[#090A0F] p-4 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-sm font-semibold text-white">
                      {axis.label}
                    </span>
                    <span className="ml-2 text-xs text-zinc-500">
                      {axis.helper}
                    </span>
                  </div>
                  <span className="font-mono text-xs tabular-nums text-zinc-400">
                    {delta === 0
                      ? 'Equal (0)'
                      : delta > 0
                        ? `Device A +${delta}`
                        : `Device B +${Math.abs(delta)}`}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                      <span className="text-zinc-400 truncate pr-2">
                        {deviceA.model}
                      </span>
                      <span className="text-sm font-bold text-red-400">
                        {axis.valA}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-white/[0.08] overflow-hidden">
                      <div
                        className="h-full bg-red-600 transition-all duration-300"
                        style={{ width: `${pctA}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                      <span className="text-zinc-400 truncate pr-2">
                        {deviceB.model}
                      </span>
                      <span className="text-sm font-bold text-sky-400">
                        {axis.valB}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-white/[0.08] overflow-hidden">
                      <div
                        className="h-full bg-sky-500 transition-all duration-300"
                        style={{ width: `${pctB}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Side-by-Side Hardware, Fire Button & Tuning Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          {
            slot: 'Device A',
            accent: 'text-red-400',
            border: 'border-red-500/20',
            device: deviceA,
            cal: calA,
            score: scoreA.total,
            isWinner: winnerSide === 'A',
          },
          {
            slot: 'Device B',
            accent: 'text-sky-400',
            border: 'border-sky-500/20',
            device: deviceB,
            cal: calB,
            score: scoreB.total,
            isWinner: winnerSide === 'B',
          },
        ].map((item) => (
          <div
            key={item.slot}
            className={`rounded-xl border ${item.border} bg-[#12141A] p-6 space-y-5 flex flex-col justify-between`}
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className={`text-xs font-semibold ${item.accent}`}>
                    {item.slot}
                    {item.isWinner ? ' · Higher Headshot Score' : ''}
                  </div>
                  <h4 className="mt-1 text-lg font-bold text-white">
                    {item.device.brandLabel} {item.device.model}
                  </h4>
                </div>
                <div className="font-mono text-lg font-bold tabular-nums text-white">
                  {item.score}/100
                </div>
              </div>

              <dl className="grid grid-cols-2 gap-3 pt-3 border-t border-white/[0.08] text-xs">
                <div className="rounded-lg bg-[#090A0F] p-3">
                  <dt className="text-zinc-400">Fire Button Size</dt>
                  <dd className="mt-1 font-mono text-base font-semibold tabular-nums text-white">
                    {item.cal.fireButtonSize}%
                  </dd>
                </div>
                <div className="rounded-lg bg-[#090A0F] p-3">
                  <dt className="text-zinc-400">Recommended DPI</dt>
                  <dd className="mt-1 font-mono text-base font-semibold tabular-nums text-white">
                    {item.cal.recommendedDpi} dp
                  </dd>
                </div>
                <div className="rounded-lg bg-[#090A0F] p-3">
                  <dt className="text-zinc-400">Display / Touch</dt>
                  <dd className="mt-1 font-mono text-sm font-semibold tabular-nums text-white">
                    {item.device.refreshHz}Hz / {item.device.touchSamplingHz}Hz
                  </dd>
                </div>
                <div className="rounded-lg bg-[#090A0F] p-3">
                  <dt className="text-zinc-400">RAM / Panel</dt>
                  <dd className="mt-1 font-mono text-sm font-semibold tabular-nums text-white">
                    {item.device.ramGb}GB · {item.device.screenInches}&Prime;
                  </dd>
                </div>
              </dl>

              <div className="space-y-1.5 text-xs">
                <div className="font-medium text-zinc-300">
                  Graphics: <span className="text-white">{item.cal.graphicsPreset}</span>
                </div>
                <p className="text-zinc-400 leading-relaxed">
                  {item.device.deviceNote}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onApplyToLab(item.device)}
              className="w-full rounded-lg border border-white/[0.12] bg-[#090A0F] py-2.5 text-xs font-semibold text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              Load {item.device.model} into Calibrator
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
