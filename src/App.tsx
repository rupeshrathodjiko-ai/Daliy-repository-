/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { AccessVaultSection } from './components/AccessVaultSection.tsx';
import { CelebrationConfetti } from './components/CelebrationConfetti.tsx';
import { CheckoutDrawer, type CartEntry } from './components/CheckoutDrawer.tsx';
import { Footer } from './components/Footer.tsx';
import { HeroSection } from './components/HeroSection.tsx';
import { LoginScreen } from './components/LoginScreen.tsx';
import { Navbar } from './components/Navbar.tsx';
import { OwnerDashboardModal } from './components/OwnerDashboardModal.tsx';
import { ProPanelsGrid } from './components/ProPanelsGrid.tsx';
import { SensitivityLab } from './components/SensitivityLab.tsx';
import { DEVICES } from './data/devices.ts';
import { PRO_PANELS } from './data/panels.ts';
import type {
  AuthUser,
  DeviceProfile,
  MerchantQrConfig,
  OrderRecord,
  ProPanelProduct,
} from './types.ts';

const RECENT_ORDERS_KEY = 'apexsense_recent_orders_v1';
const AUTH_TOKEN_KEY = 'apexsense_auth_token_v1';

const DEFAULT_MERCHANT: MerchantQrConfig = {
  upiId: '9545247796@fam',
  merchantName: 'Rupesh Rathod',
  notePrefix: 'ApexSense Order',
  useCustomQrImage: true,
  customQrImageUrl: '/assets/aistudio/IMG-20261104-WA0014_e5849775.jpg',
  updatedAt: '',
};

export default function App() {
  const [authToken, setAuthToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(AUTH_TOKEN_KEY);
    } catch {
      return null;
    }
  });
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [authChecking, setAuthChecking] = useState<boolean>(() => {
    try {
      return Boolean(localStorage.getItem(AUTH_TOKEN_KEY));
    } catch {
      return false;
    }
  });

  const [panels, setPanels] = useState<ProPanelProduct[]>(PRO_PANELS);
  const [selectedDevice, setSelectedDevice] = useState<DeviceProfile>(DEVICES[0]);
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [merchantModalOpen, setMerchantModalOpen] = useState(false);
  const [merchant, setMerchant] = useState<MerchantQrConfig>(DEFAULT_MERCHANT);

  const [recentOrders, setRecentOrders] = useState<OrderRecord[]>(() => {
    try {
      const saved = localStorage.getItem(RECENT_ORDERS_KEY);
      return saved ? (JSON.parse(saved) as OrderRecord[]) : [];
    } catch {
      return [];
    }
  });
  const [unlockedOrder, setUnlockedOrder] = useState<OrderRecord | null>(null);
  const [unlockedPanels, setUnlockedPanels] = useState<ProPanelProduct[]>([]);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [celebrateBurstId, setCelebrateBurstId] = useState(0);

  useEffect(() => {
    if (!authToken) {
      setAuthChecking(false);
      setCurrentUser(null);
      return;
    }

    setAuthChecking(true);
    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setCurrentUser(data.user);
        } else {
          setAuthToken(null);
          setCurrentUser(null);
          try {
            localStorage.removeItem(AUTH_TOKEN_KEY);
          } catch {
            // Ignore
          }
        }
      })
      .catch(() => {
        setAuthToken(null);
        setCurrentUser(null);
      })
      .finally(() => {
        setAuthChecking(false);
      });
  }, [authToken]);

  useEffect(() => {
    fetch('/api/catalog')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.panels && Array.isArray(data.panels)) {
          setPanels(data.panels);
        }
      })
      .catch(() => {
        // Initial static fallback already hydrated
      });

    fetch('/api/merchant')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.merchant) {
          setMerchant(data.merchant);
        }
      })
      .catch(() => {
        // Initial static fallback already hydrated
      });
  }, []);

  const handleAuthenticated = (user: AuthUser, token: string) => {
    setCurrentUser(user);
    setAuthToken(token);
    try {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    } catch {
      // Ignore storage error
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthToken(null);
    setCartOpen(false);
    setMerchantModalOpen(false);
    try {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    } catch {
      // Ignore
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#090A0F] text-zinc-400 flex items-center justify-center text-sm">
        Verifying session...
      </div>
    );
  }

  if (!currentUser || !authToken) {
    return <LoginScreen onAuthenticated={handleAuthenticated} />;
  }

  const isOwner = currentUser.role === 'owner';
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleAddToCart = (panel: ProPanelProduct) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.panel.id === panel.id);
      if (existing) {
        return prev.map((c) =>
          c.panel.id === panel.id ? { ...c, quantity: Math.min(5, c.quantity + 1) } : c
        );
      }
      return [...prev, { panel, quantity: 1 }];
    });
    setCartOpen(true);
  };

  const handleInstantBuy = (panel: ProPanelProduct) => {
    setCart([{ panel, quantity: 1 }]);
    setCartOpen(true);
  };

  const handleUpdateQty = (panelId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) =>
          c.panel.id === panelId ? { ...c, quantity: c.quantity + delta } : c
        )
        .filter((c) => c.quantity > 0)
    );
  };

  const handleRemoveItem = (panelId: string) => {
    setCart((prev) => prev.filter((c) => c.panel.id !== panelId));
  };

  const handleOrderVerified = (order: OrderRecord, deliveredPanels: ProPanelProduct[]) => {
    setUnlockedOrder(order);
    setUnlockedPanels(deliveredPanels);
    setCart([]);
    setCelebrateBurstId((id) => id + 1);
    setRecentOrders((prev) => {
      const next = [order, ...prev.filter((o) => o.orderId !== order.orderId)].slice(0, 5);
      try {
        localStorage.setItem(RECENT_ORDERS_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage quota errors
      }
      return next;
    });
  };

  const handleLookupKey = async (keyOrOrderId: string) => {
    setLookupError(null);
    setLookupLoading(true);
    try {
      const res = await fetch(`/api/vault/${encodeURIComponent(keyOrOrderId)}`);
      const data = await res.json();
      if (!res.ok) {
        setLookupError(data.error || 'Could not find a verified order for that key.');
        return;
      }
      setUnlockedOrder(data.order);
      setUnlockedPanels(data.unlockedPanels ?? []);
      setCelebrateBurstId((id) => id + 1);
    } catch {
      setLookupError('Unable to reach Access Vault right now.');
    } finally {
      setLookupLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090A0F] text-[#F4F4F5] flex flex-col">
      <Navbar
        cartCount={cartCount}
        isOwner={isOwner}
        onOpenCart={() => setCartOpen(true)}
        onOpenMerchantSettings={() => isOwner && setMerchantModalOpen(true)}
        onLogout={handleLogout}
      />

      <main className="flex-1">
        <HeroSection />

        <SensitivityLab
          selectedDevice={selectedDevice}
          onSelectDevice={setSelectedDevice}
        />

        <ProPanelsGrid
          panels={panels}
          onAddToCart={handleAddToCart}
          onInstantBuy={handleInstantBuy}
        />

        <AccessVaultSection
          unlockedOrder={unlockedOrder}
          unlockedPanels={unlockedPanels}
          recentOrders={recentOrders}
          onLookupKey={handleLookupKey}
          lookupLoading={lookupLoading}
          lookupError={lookupError}
        />
      </main>

      <Footer
        isOwner={isOwner}
        userIdentifier={currentUser.identifier}
        onOpenMerchantSettings={() => isOwner && setMerchantModalOpen(true)}
        onLogout={handleLogout}
      />

      <CheckoutDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        onUpdateQty={handleUpdateQty}
        onRemoveItem={handleRemoveItem}
        selectedDevice={selectedDevice}
        merchant={merchant}
        isOwner={isOwner}
        authToken={authToken}
        defaultPhone={currentUser.method === 'phone' ? currentUser.identifier : ''}
        defaultEmail={currentUser.method === 'gmail' ? currentUser.identifier : ''}
        onOrderVerified={handleOrderVerified}
        onOpenMerchantSettings={() => isOwner && setMerchantModalOpen(true)}
      />

      {isOwner && (
        <OwnerDashboardModal
          isOpen={merchantModalOpen}
          onClose={() => setMerchantModalOpen(false)}
          authToken={authToken}
          merchant={merchant}
          onMerchantUpdated={(updated) => setMerchant(updated)}
          panels={panels}
          onPanelsUpdated={(updatedPanels) => setPanels(updatedPanels)}
        />
      )}

      <CelebrationConfetti burstId={celebrateBurstId} />
    </div>
  );
}
