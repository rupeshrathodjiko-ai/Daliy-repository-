import { KeyRound, Mail, Phone, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import type { AuthUser } from '../types.ts';

interface LoginScreenProps {
  onAuthenticated: (user: AuthUser, token: string) => void;
}

export function LoginScreen({ onAuthenticated }: LoginScreenProps) {
  const [method, setMethod] = useState<'phone' | 'gmail'>('phone');
  const [phone, setPhone] = useState('');
  const [gmail, setGmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [ownerPasskey, setOwnerPasskey] = useState('');
  const [passkeyPromptMode, setPasskeyPromptMode] = useState<
    'none' | 'setup' | 'verify'
  >('none');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const identifier = method === 'phone' ? phone.trim() : gmail.trim().toLowerCase();
    if (!identifier) {
      setError(
        method === 'phone'
          ? 'Enter your 10-digit mobile number to continue.'
          : 'Enter your Gmail address to continue.'
      );
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method,
          identifier,
          displayName: displayName.trim(),
          ownerPasskey: ownerPasskey.trim() || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.code === 'OWNER_SETUP_REQUIRED') {
          setPasskeyPromptMode('setup');
        } else if (data.code === 'OWNER_PASSKEY_REQUIRED') {
          setPasskeyPromptMode('verify');
        }
        setError(data.error || 'Could not sign in. Please check your details.');
        return;
      }
      onAuthenticated(data.user, data.token);
    } catch {
      setError('Unable to reach server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetPasskeyFlow = () => {
    setPasskeyPromptMode('none');
    setOwnerPasskey('');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#090A0F] text-[#F4F4F5] flex flex-col justify-between px-6 py-10">
      <div className="mx-auto w-full max-w-[1200px] flex items-center justify-between">
        <span className="font-display text-2xl font-bold tracking-tight text-white">
          ApexSense
        </span>
        <span className="text-xs text-zinc-500">
          Free Fire Calibration &amp; Pro Panels
        </span>
      </div>

      <main className="mx-auto w-full max-w-md my-12">
        <div className="rounded-xl border border-white/[0.08] bg-[#12141A] p-7 sm:p-8 space-y-6">
          <div className="space-y-2">
            <p className="text-xs font-medium text-zinc-400">
              Player Access · Instant Entry
            </p>
            <h1 className="font-display text-3xl font-bold tracking-tight text-white">
              Sign in to ApexSense
            </h1>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Continue with your mobile number or Gmail to access device sensitivity calibration,
              Pro Panels, and your Access Vault.
            </p>
          </div>

          {/* Login Method Toggle */}
          <div
            role="tablist"
            aria-label="Login method"
            className="grid grid-cols-2 gap-1 rounded-lg bg-[#090A0F] p-1 border border-white/[0.08]"
          >
            <button
              type="button"
              role="tab"
              aria-selected={method === 'phone'}
              onClick={() => {
                setMethod('phone');
                resetPasskeyFlow();
              }}
              className={`inline-flex items-center justify-center gap-2 rounded-md py-2 text-xs font-semibold transition-colors cursor-pointer ${
                method === 'phone'
                  ? 'bg-red-600 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Phone className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Mobile Number</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={method === 'gmail'}
              onClick={() => {
                setMethod('gmail');
                resetPasskeyFlow();
              }}
              className={`inline-flex items-center justify-center gap-2 rounded-md py-2 text-xs font-semibold transition-colors cursor-pointer ${
                method === 'gmail'
                  ? 'bg-red-600 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Mail className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Gmail</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {method === 'phone' ? (
              <div>
                <label
                  htmlFor="login-phone"
                  className="block text-xs font-medium text-zinc-300 mb-1.5"
                >
                  Mobile Number
                </label>
                <div className="flex">
                  <span className="inline-flex items-center rounded-l-lg border border-r-0 border-white/[0.1] bg-[#090A0F] px-3 font-mono text-xs text-zinc-400">
                    +91
                  </span>
                  <input
                    id="login-phone"
                    type="tel"
                    inputMode="numeric"
                    required
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (passkeyPromptMode !== 'none') setPasskeyPromptMode('none');
                    }}
                    placeholder="9876543210"
                    className="w-full rounded-r-lg border border-white/[0.1] bg-[#090A0F] px-3.5 py-2.5 font-mono text-sm text-white placeholder:text-zinc-500 focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label
                  htmlFor="login-gmail"
                  className="block text-xs font-medium text-zinc-300 mb-1.5"
                >
                  Gmail Address
                </label>
                <input
                  id="login-gmail"
                  type="email"
                  required
                  value={gmail}
                  onChange={(e) => {
                    setGmail(e.target.value);
                    if (passkeyPromptMode !== 'none') setPasskeyPromptMode('none');
                  }}
                  placeholder="playername@gmail.com"
                  className="w-full rounded-lg border border-white/[0.1] bg-[#090A0F] px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-red-500 focus:outline-none"
                />
              </div>
            )}

            {passkeyPromptMode !== 'none' ? (
              <div>
                <label
                  htmlFor="owner-passkey-input"
                  className="flex items-center gap-1.5 text-xs font-medium text-amber-300 mb-1.5"
                >
                  <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>
                    {passkeyPromptMode === 'setup'
                      ? 'Create Your Owner Passkey (4–32 chars)'
                      : 'Enter Owner Passkey'}
                  </span>
                </label>
                <input
                  id="owner-passkey-input"
                  type="password"
                  required
                  autoFocus
                  value={ownerPasskey}
                  onChange={(e) => setOwnerPasskey(e.target.value)}
                  placeholder={
                    passkeyPromptMode === 'setup'
                      ? 'Choose a private Owner Passkey'
                      : 'Enter Owner Passkey'
                  }
                  className="w-full rounded-lg border border-amber-500/40 bg-[#090A0F] px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-red-500 focus:outline-none"
                />
              </div>
            ) : (
              <div>
                <label
                  htmlFor="login-name"
                  className="block text-xs font-medium text-zinc-300 mb-1.5"
                >
                  In-Game Name (Optional)
                </label>
                <input
                  id="login-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. AceStriker"
                  className="w-full rounded-lg border border-white/[0.1] bg-[#090A0F] px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-red-500 focus:outline-none"
                />
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-300"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {loading
                ? 'Signing in...'
                : passkeyPromptMode === 'setup'
                  ? 'Save Passkey & Open Owner Panel'
                  : passkeyPromptMode === 'verify'
                    ? 'Unlock Owner Account'
                    : 'Continue to App'}
            </button>
          </form>

          <div className="flex items-center justify-center gap-1.5 pt-2 border-t border-white/[0.06] text-xs text-zinc-500">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Official in-game sensitivity &amp; secure QR checkout</span>
          </div>
        </div>
      </main>

      <div className="mx-auto w-full max-w-[1200px] text-center text-xs text-zinc-600">
        ApexSense Mobile Calibration
      </div>
    </div>
  );
}
