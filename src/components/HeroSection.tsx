import { ArrowRight, Crosshair } from 'lucide-react';
import { useState } from 'react';

export function HeroSection() {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <section id="top" className="border-b border-white/[0.08]">
      <div className="mx-auto max-w-[1200px] px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-between gap-8">
            <div className="space-y-5">
              <p className="text-xs font-medium tracking-wide text-zinc-400">
                Free Fire OB Calibration · Android &amp; iOS · Zero Third-Party APKs
              </p>

              <h1
                className="font-display font-bold tracking-tight text-white leading-[0.98]"
                style={{
                  fontSize: 'clamp(2.5rem, 4.4vw, 4rem)',
                  textWrap: 'balance',
                }}
              >
                Headshot Sensitivity &amp; Ranked Mobile Panels
              </h1>

              <p className="max-w-xl text-base leading-relaxed text-zinc-300">
                Calibrate exact Free Fire sensitivity, fire button size, and Android/iOS DPI for
                your exact phone model—or unlock a paid Pro Panel via instant UPI QR checkout for
                ranked HUD blueprints and FPS tuning.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-5 pt-2">
              <a
                href="#configurator"
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-6 py-3 text-sm font-semibold text-white hover:bg-red-500 transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090A0F]"
              >
                <span>Configure Sensitivity</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>

              <a
                href="#pro-panels"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-300 hover:text-white underline decoration-white/25 underline-offset-4 transition-colors duration-150 whitespace-nowrap shrink-0"
              >
                <span>Browse Paid Pro Panels</span>
              </a>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative h-full min-h-[280px] lg:min-h-[380px] overflow-hidden rounded-xl border border-white/[0.08] bg-[#12141A]">
              {!imgFailed ? (
                <img
                  src="/src/assets/images/hero_mobile_esports_1794630907174.jpg"
                  alt="Flagship gaming smartphone displaying precision sensitivity calibration grid"
                  referrerPolicy="no-referrer"
                  onError={() => setImgFailed(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#12141A] to-[#1A1D26] p-8 text-center">
                  <Crosshair className="h-10 w-10 text-red-500" aria-hidden="true" />
                  <p className="text-sm font-medium text-zinc-300">
                    Mobile Sensitivity Calibration Hardware
                  </p>
                </div>
              )}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#090A0F]/75 via-transparent to-transparent"
              />
              <div className="absolute bottom-4 left-5 right-5 flex items-center justify-between text-xs text-zinc-300">
                <span>Touch-Rate &amp; DPI Matched</span>
                <span className="font-mono tabular-nums text-zinc-400">60Hz — 165Hz</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-px overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.08]">
          <div className="bg-[#12141A] px-5 py-4">
            <div className="font-mono text-xl font-semibold tabular-nums text-white">
              22+ Series
            </div>
            <div className="mt-1 text-xs text-zinc-400">
              iPhone, Samsung, POCO, OnePlus, iQOO &amp; ROG
            </div>
          </div>
          <div className="bg-[#12141A] px-5 py-4">
            <div className="font-mono text-xl font-semibold tabular-nums text-white">
              0 — 200 Scale
            </div>
            <div className="mt-1 text-xs text-zinc-400">
              Updated for modern OB sensitivity caps
            </div>
          </div>
          <div className="bg-[#12141A] px-5 py-4">
            <div className="font-mono text-xl font-semibold tabular-nums text-white">
              100% Safe
            </div>
            <div className="mt-1 text-xs text-zinc-400">
              Official in-game HUD &amp; DPI settings only
            </div>
          </div>
          <div className="bg-[#12141A] px-5 py-4">
            <div className="font-mono text-xl font-semibold tabular-nums text-white">
              Instant QR
            </div>
            <div className="mt-1 text-xs text-zinc-400">
              Dynamic UPI QR checkout &amp; key delivery
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
