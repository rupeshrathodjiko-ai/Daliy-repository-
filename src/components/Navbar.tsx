import { ShoppingBag } from 'lucide-react';

interface NavbarProps {
  cartCount: number;
  isOwner: boolean;
  onOpenCart: () => void;
  onOpenMerchantSettings: () => void;
  onLogout: () => void;
}

export function Navbar({
  cartCount,
  isOwner,
  onOpenCart,
  onOpenMerchantSettings,
  onLogout,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#090A0F]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-8 px-6 py-4">
        <a
          href="#top"
          className="font-display text-2xl font-bold tracking-tight text-white whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded-sm"
        >
          ApexSense
        </a>

        <nav
          aria-label="Primary"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-zinc-400"
        >
          <a
            href="#configurator"
            className="hover:text-white transition-colors duration-150 whitespace-nowrap shrink-0"
          >
            Configurator
          </a>
          <a
            href="#pro-panels"
            className="hover:text-white transition-colors duration-150 whitespace-nowrap shrink-0"
          >
            Pro Panels
          </a>
          <a
            href="#access-vault"
            className="hover:text-white transition-colors duration-150 whitespace-nowrap shrink-0"
          >
            Access Vault
          </a>
          {isOwner && (
            <button
              type="button"
              onClick={onOpenMerchantSettings}
              className="hover:text-white transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
            >
              Owner Panel
            </button>
          )}
          <button
            type="button"
            onClick={onLogout}
            className="hover:text-white transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
          >
            Sign Out
          </button>
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onOpenCart}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-500 active:scale-[0.99] transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090A0F]"
          >
            <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="tabular-nums">Cart ({cartCount})</span>
          </button>
        </div>
      </div>
    </header>
  );
}
