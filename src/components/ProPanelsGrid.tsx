import { Check, QrCode, ShieldCheck, ShoppingBag } from 'lucide-react';
import { motion, useReducedMotion, type Variants } from 'motion/react';
import { useState } from 'react';
import type { ProPanelProduct } from '../types.ts';

interface ProPanelsGridProps {
  panels: ProPanelProduct[];
  onAddToCart: (panel: ProPanelProduct) => void;
  onInstantBuy: (panel: ProPanelProduct) => void;
}

const gridVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.04,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.42,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export function ProPanelsGrid({
  panels,
  onAddToCart,
  onInstantBuy,
}: ProPanelsGridProps) {
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const prefersReducedMotion = useReducedMotion();

  return (
    <section id="pro-panels" className="border-b border-white/[0.08] py-16">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8 border-b border-white/[0.08]">
          <div className="space-y-2">
            <p className="text-xs font-medium text-zinc-400">
              Paid Optimization Panels · Instant UPI QR Access
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-white">
              Pro Ranked Panels &amp; HUD Blueprints
            </h2>
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <ShieldCheck className="h-4 w-4 text-red-400 shrink-0" aria-hidden="true" />
            <span>100% Account-Safe · Official In-Game Configs Only</span>
          </div>
        </div>

        <motion.div
          variants={prefersReducedMotion ? undefined : gridVariants}
          initial={prefersReducedMotion ? false : 'hidden'}
          whileInView={prefersReducedMotion ? undefined : 'visible'}
          viewport={{ once: true, amount: 0.08 }}
          className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {panels.map((panel) => {
            const imgFailed = failedImages[panel.id] === true;
            return (
              <motion.article
                key={panel.id}
                variants={prefersReducedMotion ? undefined : cardVariants}
                whileHover={
                  prefersReducedMotion
                    ? undefined
                    : { y: -3, transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] } }
                }
                className="group flex flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-[#12141A]"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#181B22]">
                  {!imgFailed ? (
                    <img
                      src={panel.imageUrl}
                      alt={`${panel.name} hardware preview`}
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setFailedImages((prev) => ({ ...prev, [panel.id]: true }))
                      }
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#161922] to-[#1D212D] p-6 text-center">
                      <QrCode className="h-8 w-8 text-red-500" aria-hidden="true" />
                      <span className="text-xs font-medium text-zinc-300">
                        {panel.name}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col justify-between p-6 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2 text-xs text-zinc-400">
                      <span>{panel.tierLabel}</span>
                      <span>{panel.deliveryType}</span>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-white">{panel.name}</h3>
                      <p className="mt-1 text-sm text-zinc-400 leading-relaxed">
                        {panel.subtitle}
                      </p>
                    </div>

                    <ul className="space-y-2.5 pt-2 border-t border-white/[0.06]">
                      {panel.highlights.map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-2.5 text-xs leading-relaxed text-zinc-300"
                        >
                          <Check
                            className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5"
                            aria-hidden="true"
                          />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-white/[0.08]">
                    <div className="flex items-baseline justify-between">
                      <div className="flex items-baseline gap-2.5">
                        <span className="font-mono text-2xl font-bold tabular-nums text-white">
                          ₹{panel.priceInr}
                        </span>
                        <span className="font-mono text-xs tabular-nums text-zinc-500 line-through">
                          ₹{panel.originalPriceInr}
                        </span>
                      </div>
                      <span className="text-xs text-zinc-400">One-time unlock</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => onAddToCart(panel)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/[0.14] bg-transparent px-3 py-2.5 text-xs font-semibold text-white hover:bg-white/[0.06] transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Add to Cart</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onInstantBuy(panel)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-600 px-3 py-2.5 text-xs font-semibold text-white hover:bg-red-500 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <QrCode className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Buy via QR</span>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
