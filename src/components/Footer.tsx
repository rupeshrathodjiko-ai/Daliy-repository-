interface FooterProps {
  isOwner: boolean;
  userIdentifier: string;
  onOpenMerchantSettings: () => void;
  onLogout: () => void;
}

export function Footer({
  isOwner,
  userIdentifier,
  onOpenMerchantSettings,
  onLogout,
}: FooterProps) {
  return (
    <footer className="border-t border-white/[0.08] bg-[#090A0F]">
      <div className="mx-auto flex max-w-[1200px] flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-8 text-xs text-zinc-500">
        <div className="space-y-1">
          <div className="font-semibold text-zinc-300">
            ApexSense Mobile Calibration &amp; Pro Panels
          </div>
          <p>
            Signed in as <span className="text-zinc-300">{userIdentifier}</span> · Official in-game
            sensitivity settings only.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-6 shrink-0">
          <a href="#configurator" className="hover:text-zinc-300 transition-colors">
            Configurator
          </a>
          <a href="#pro-panels" className="hover:text-zinc-300 transition-colors">
            Pro Panels
          </a>
          <a href="#access-vault" className="hover:text-zinc-300 transition-colors">
            Access Vault
          </a>
          {isOwner && (
            <button
              type="button"
              onClick={onOpenMerchantSettings}
              className="hover:text-zinc-300 transition-colors cursor-pointer"
            >
              Owner Panel
            </button>
          )}
          <button
            type="button"
            onClick={onLogout}
            className="hover:text-zinc-300 transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>
    </footer>
  );
}
