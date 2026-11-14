import express from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import QRCode from 'qrcode';
import { createServer as createViteServer } from 'vite';
import { DEVICES, calibrateDeviceSensitivity } from './src/data/devices.ts';
import { PRO_PANELS } from './src/data/panels.ts';
import type {
  AuthUser,
  ClawType,
  MerchantQrConfig,
  OrderItem,
  OrderRecord,
  PlaystyleId,
  ProPanelProduct,
} from './src/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = path.join(__dirname, '.data');
const STORE_PATH = path.join(DATA_DIR, 'store.json');
const ORDER_SECRET = process.env.ORDER_SIGNING_SECRET || 'apexsense-gateway-hmac-key';
const OWNER_EMAIL = 'rupeshrathodjiko@gmail.com';
const OWNER_PHONE = '9545247796';

interface StoreState {
  merchant: MerchantQrConfig;
  orders: Record<string, OrderRecord>;
  usedUtrs: Record<string, string>;
  panels: ProPanelProduct[];
  ownerPasskeyHash: string | null;
}

const DEFAULT_STATE: StoreState = {
  merchant: {
    upiId: '9545247796@fam',
    merchantName: 'Rupesh Rathod',
    notePrefix: 'ApexSense Order',
    useCustomQrImage: true,
    customQrImageUrl: '/assets/aistudio/IMG-20261104-WA0014_e5849775.jpg',
    updatedAt: new Date().toISOString(),
  },
  orders: {},
  usedUtrs: {},
  panels: structuredClone(PRO_PANELS),
  ownerPasskeyHash: null,
};

function loadStore(): StoreState {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<StoreState>;
      return {
        merchant: parsed.merchant ?? DEFAULT_STATE.merchant,
        orders: parsed.orders ?? {},
        usedUtrs: parsed.usedUtrs ?? {},
        panels: Array.isArray(parsed.panels) && parsed.panels.length > 0
          ? parsed.panels
          : structuredClone(PRO_PANELS),
        ownerPasskeyHash:
          typeof parsed.ownerPasskeyHash === 'string' ? parsed.ownerPasskeyHash : null,
      };
    }
  } catch {
    // Fallback to in-memory default if disk read fails
  }
  return structuredClone(DEFAULT_STATE);
}

function saveStore(state: StoreState): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_PATH, JSON.stringify(state, null, 2), 'utf-8');
  } catch {
    // Non-fatal in ephemeral environments
  }
}

function signOrderPayload(orderId: string, totalInr: number): string {
  return crypto
    .createHmac('sha256', ORDER_SECRET)
    .update(`${orderId}:${totalInr}`)
    .digest('hex')
    .slice(0, 16)
    .toUpperCase();
}

function generateAccessKey(): string {
  const bytes = crypto.randomBytes(6).toString('hex').toUpperCase();
  return `APEX-${bytes.slice(0, 4)}-${bytes.slice(4, 8)}-${bytes.slice(8, 12)}`;
}

function buildUpiUri(merchant: MerchantQrConfig, orderId: string, totalInr: number): string {
  const params = new URLSearchParams({
    pa: merchant.upiId.trim(),
    pn: merchant.merchantName.trim(),
    am: totalInr.toFixed(2),
    cu: 'INR',
    tn: `${merchant.notePrefix} ${orderId}`.slice(0, 50),
    tr: orderId,
  });
  return `upi://pay?${params.toString()}`;
}

async function generateQrDataUrl(upiUri: string): Promise<string> {
  return QRCode.toDataURL(upiUri, {
    width: 320,
    margin: 2,
    color: {
      dark: '#090A0F',
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'M',
  });
}

function signAuthToken(user: AuthUser): string {
  const payload = Buffer.from(JSON.stringify(user)).toString('base64url');
  const sig = crypto
    .createHmac('sha256', ORDER_SECRET)
    .update(payload)
    .digest('base64url');
  return `${payload}.${sig}`;
}

function verifyAuthToken(authHeader?: string): AuthUser | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expectedSig = crypto
    .createHmac('sha256', ORDER_SECRET)
    .update(payload)
    .digest('base64url');
  if (sig !== expectedSig) return null;
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8')) as AuthUser;
  } catch {
    return null;
  }
}

function hashPasskey(passkey: string): string {
  return crypto
    .createHmac('sha256', ORDER_SECRET)
    .update(`owner-passkey:${passkey}`)
    .digest('hex');
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  const store = loadStore();

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'apexsense-api' });
  });

  app.get('/api/catalog', (_req, res) => {
    res.json({ panels: store.panels });
  });

  app.get('/api/devices', (_req, res) => {
    res.json({ devices: DEVICES });
  });

  app.post('/api/calibrate', (req, res) => {
    const { deviceId, playstyle, clawType, customDpi } = req.body as {
      deviceId?: string;
      playstyle?: PlaystyleId;
      clawType?: ClawType;
      customDpi?: number;
    };

    const device = DEVICES.find((d) => d.id === deviceId) ?? DEVICES[0];
    const validPlaystyle: PlaystyleId =
      playstyle === 'onetap' ||
      playstyle === 'smg_rush' ||
      playstyle === 'ranked_br' ||
      playstyle === 'clash_squad'
        ? playstyle
        : 'onetap';
    const validClaw: ClawType =
      clawType === '2_finger' || clawType === '3_finger' || clawType === '4_finger'
        ? clawType
        : '2_finger';

    const calibrated = calibrateDeviceSensitivity(
      device,
      validPlaystyle,
      validClaw,
      typeof customDpi === 'number' && customDpi >= 300 && customDpi <= 900
        ? Math.round(customDpi)
        : undefined
    );

    res.json({ calibrated });
  });

  app.post('/api/auth/login', (req, res) => {
    const { method, identifier, displayName, ownerPasskey } = req.body as {
      method?: 'phone' | 'gmail';
      identifier?: string;
      displayName?: string;
      ownerPasskey?: string;
    };

    if (method !== 'phone' && method !== 'gmail') {
      res.status(400).json({ error: 'Choose Mobile Number or Gmail login.' });
      return;
    }

    const rawId = (identifier ?? '').trim();
    let normalizedId = rawId;
    let isOwner = false;

    if (method === 'phone') {
      const digits = rawId.replace(/\D/g, '');
      const phone10 = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
      if (!/^[6-9]\d{9}$/.test(phone10)) {
        res.status(400).json({ error: 'Enter a valid 10-digit Indian mobile number.' });
        return;
      }
      normalizedId = phone10;
      isOwner = phone10 === OWNER_PHONE;
    } else {
      const email = rawId.toLowerCase();
      if (!/^[a-z0-9._%+-]+@gmail\.com$/.test(email)) {
        res.status(400).json({ error: 'Enter a valid Gmail address (example@gmail.com).' });
        return;
      }
      normalizedId = email;
      isOwner = email === OWNER_EMAIL;
    }

    if (isOwner) {
      const suppliedKey = (ownerPasskey ?? '').trim();
      if (!store.ownerPasskeyHash) {
        if (!suppliedKey) {
          res.status(401).json({
            code: 'OWNER_SETUP_REQUIRED',
            error: 'Create an Owner Passkey (min 4 characters) to protect your Owner ID.',
          });
          return;
        }
        if (suppliedKey.length < 4 || suppliedKey.length > 32) {
          res.status(400).json({
            code: 'OWNER_SETUP_REQUIRED',
            error: 'Owner Passkey must be between 4 and 32 characters.',
          });
          return;
        }
        store.ownerPasskeyHash = hashPasskey(suppliedKey);
        saveStore(store);
      } else {
        if (!suppliedKey) {
          res.status(401).json({
            code: 'OWNER_PASSKEY_REQUIRED',
            error: 'Enter your Owner Passkey to sign in to the Owner ID.',
          });
          return;
        }
        if (hashPasskey(suppliedKey) !== store.ownerPasskeyHash) {
          res.status(403).json({
            code: 'OWNER_PASSKEY_REQUIRED',
            error: 'Incorrect Owner Passkey.',
          });
          return;
        }
      }
    }

    const cleanName =
      (displayName ?? '').trim().slice(0, 32) ||
      (isOwner
        ? 'Rupesh Rathod (Owner)'
        : method === 'phone'
          ? `Player ${normalizedId.slice(-4)}`
          : normalizedId.split('@')[0]);

    const user: AuthUser = {
      id: crypto.createHash('sha256').update(`${method}:${normalizedId}`).digest('hex').slice(0, 16),
      method,
      identifier: normalizedId,
      displayName: cleanName,
      role: isOwner ? 'owner' : 'user',
    };

    const token = signAuthToken(user);
    res.json({ user, token });
  });

  app.get('/api/auth/me', (req, res) => {
    const user = verifyAuthToken(req.headers.authorization);
    if (!user) {
      res.status(401).json({ error: 'Session expired or invalid.' });
      return;
    }
    res.json({ user });
  });

  app.get('/api/merchant', (_req, res) => {
    res.json({ merchant: store.merchant });
  });

  app.put('/api/merchant', (req, res) => {
    const user = verifyAuthToken(req.headers.authorization);
    if (!user || user.role !== 'owner') {
      res.status(403).json({ error: 'Only the store owner can modify QR gateway settings.' });
      return;
    }
    const { upiId, merchantName, notePrefix, useCustomQrImage, customQrImageUrl } = req.body as Partial<MerchantQrConfig>;

    if (typeof upiId === 'string') {
      const cleaned = upiId.trim();
      if (!cleaned.includes('@') || cleaned.length < 5 || cleaned.length > 80) {
        res.status(400).json({ error: 'Enter a valid UPI ID (example: yourname@okaxis).' });
        return;
      }
      store.merchant.upiId = cleaned;
    }

    if (typeof merchantName === 'string' && merchantName.trim().length >= 2) {
      store.merchant.merchantName = merchantName.trim().slice(0, 60);
    }

    if (typeof notePrefix === 'string' && notePrefix.trim().length >= 2) {
      store.merchant.notePrefix = notePrefix.trim().slice(0, 30);
    }

    if (typeof useCustomQrImage === 'boolean') {
      store.merchant.useCustomQrImage = useCustomQrImage;
    }

    if (typeof customQrImageUrl === 'string') {
      if (
        customQrImageUrl === '' ||
        customQrImageUrl.startsWith('data:image/') ||
        customQrImageUrl.startsWith('https://') ||
        customQrImageUrl.startsWith('/assets/')
      ) {
        store.merchant.customQrImageUrl = customQrImageUrl;
      } else {
        res.status(400).json({ error: 'Custom QR image must be an uploaded image, local asset, or HTTPS URL.' });
        return;
      }
    }

    store.merchant.updatedAt = new Date().toISOString();
    saveStore(store);
    res.json({ merchant: store.merchant });
  });

  app.post('/api/orders', async (req, res) => {
    try {
      const { items, customerPhone, customerEmail, deviceModel } = req.body as {
        items?: { panelId: string; quantity?: number }[];
        customerPhone?: string;
        customerEmail?: string;
        deviceModel?: string;
      };

      if (!Array.isArray(items) || items.length === 0) {
        res.status(400).json({ error: 'Cart is empty. Select at least one Pro Panel.' });
        return;
      }

      const resolvedItems: OrderItem[] = [];
      let totalInr = 0;

      for (const reqItem of items) {
        const product = store.panels.find((p) => p.id === reqItem.panelId);
        if (!product) {
          res.status(400).json({ error: `Unknown panel selected: ${reqItem.panelId}` });
          return;
        }
        const qty = Math.max(1, Math.min(5, Math.round(reqItem.quantity ?? 1)));
        resolvedItems.push({
          panelId: product.id,
          name: product.name,
          priceInr: product.priceInr,
          quantity: qty,
        });
        totalInr += product.priceInr * qty;
      }

      const cleanPhone = (customerPhone ?? '').trim();
      const cleanEmail = (customerEmail ?? '').trim();
      if (cleanPhone.length < 7) {
        res.status(400).json({ error: 'Enter a valid WhatsApp / Mobile number for receipt backup.' });
        return;
      }

      const orderId = `AS${Date.now().toString().slice(-6)}${crypto.randomInt(10, 99)}`;
      const upiUri = buildUpiUri(store.merchant, orderId, totalInr);
      const qrDataUrl =
        store.merchant.useCustomQrImage && store.merchant.customQrImageUrl
          ? store.merchant.customQrImageUrl
          : await generateQrDataUrl(upiUri);

      const order: OrderRecord = {
        orderId,
        items: resolvedItems,
        totalInr,
        customerPhone: cleanPhone,
        customerEmail: cleanEmail || 'instant-vault@apexsense.local',
        deviceModel: (deviceModel ?? 'Universal Mobile Profile').trim(),
        status: 'PENDING_PAYMENT',
        upiUri,
        qrDataUrl,
        signature: signOrderPayload(orderId, totalInr),
        createdAt: new Date().toISOString(),
      };

      store.orders[orderId] = order;
      saveStore(store);

      res.status(201).json({ order, merchant: store.merchant });
    } catch (error) {
      console.error('Order creation failed:', error);
      res.status(500).json({ error: 'Unable to initialize secure QR payment session.' });
    }
  });

  app.post('/api/orders/:orderId/verify', (req, res) => {
    const { orderId } = req.params;
    const { utrReference } = req.body as { utrReference?: string };

    const order = store.orders[orderId];
    if (!order) {
      res.status(404).json({ error: 'Order session not found.' });
      return;
    }

    if (order.status === 'VERIFIED') {
      const unlockedPanels = store.panels.filter((p) =>
        order.items.some((item) => item.panelId === p.id)
      );
      res.json({ order, unlockedPanels });
      return;
    }

    const cleanedUtr = (utrReference ?? '').trim();
    if (!/^\d{12}$/.test(cleanedUtr)) {
      res.status(400).json({
        error: 'Enter the exact 12-digit numeric UPI UTR / Reference Number from your payment receipt.',
      });
      return;
    }

    if (/^(\d)\1{11}$/.test(cleanedUtr) || cleanedUtr === '123456789012' || cleanedUtr === '987654321098') {
      res.status(400).json({
        error: 'Invalid UTR number. Enter the real 12-digit UTR from your UPI app transaction history.',
      });
      return;
    }

    if (store.usedUtrs[cleanedUtr] && store.usedUtrs[cleanedUtr] !== orderId) {
      res.status(409).json({
        error: 'This UTR reference has already been submitted for another order.',
      });
      return;
    }

    const expectedSig = signOrderPayload(order.orderId, order.totalInr);
    if (order.signature !== expectedSig) {
      res.status(403).json({ error: 'Order signature integrity check failed.' });
      return;
    }

    order.status = 'UNDER_REVIEW';
    order.utrReference = cleanedUtr;
    order.rejectionReason = undefined;
    order.submittedAt = new Date().toISOString();

    store.usedUtrs[cleanedUtr] = orderId;
    saveStore(store);

    res.json({ order });
  });

  app.get('/api/orders/:orderId/status', (req, res) => {
    const order = store.orders[req.params.orderId];
    if (!order) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }

    if (order.status === 'VERIFIED') {
      const unlockedPanels = store.panels.filter((p) =>
        order.items.some((item) => item.panelId === p.id)
      );
      res.json({ order, unlockedPanels });
      return;
    }

    res.json({ order });
  });

  app.get('/api/vault/:keyOrOrderId', (req, res) => {
    const query = req.params.keyOrOrderId.trim().toUpperCase();
    const matchedOrder = Object.values(store.orders).find(
      (o) =>
        o.orderId.toUpperCase() === query ||
        (o.accessKey && o.accessKey.toUpperCase() === query)
    );

    if (!matchedOrder) {
      res.status(404).json({ error: 'No verified order or access key found matching that code.' });
      return;
    }

    if (matchedOrder.status !== 'VERIFIED') {
      res.status(402).json({
        error:
          matchedOrder.status === 'UNDER_REVIEW'
            ? 'Payment proof is awaiting owner confirmation.'
            : matchedOrder.status === 'REJECTED'
              ? matchedOrder.rejectionReason || 'Payment UTR was rejected.'
              : 'Payment is still pending verification for this order.',
        order: matchedOrder,
      });
      return;
    }

    const unlockedPanels = store.panels.filter((p) =>
      matchedOrder.items.some((item) => item.panelId === p.id)
    );

    res.json({ order: matchedOrder, unlockedPanels });
  });

  // Owner-Only Management Endpoints
  app.get('/api/owner/overview', (req, res) => {
    const user = verifyAuthToken(req.headers.authorization);
    if (!user || user.role !== 'owner') {
      res.status(403).json({ error: 'Owner authorization required.' });
      return;
    }

    const ordersList = Object.values(store.orders).sort((a, b) => {
      const priority = (s: OrderRecord['status']) =>
        s === 'UNDER_REVIEW' ? 0 : s === 'PENDING_PAYMENT' ? 1 : s === 'VERIFIED' ? 2 : 3;
      const diff = priority(a.status) - priority(b.status);
      if (diff !== 0) return diff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    const verifiedOrders = ordersList.filter((o) => o.status === 'VERIFIED');
    const pendingOrders = ordersList.filter(
      (o) => o.status === 'PENDING_PAYMENT' || o.status === 'UNDER_REVIEW'
    );
    const verifiedRevenueInr = verifiedOrders.reduce((sum, o) => sum + o.totalInr, 0);

    res.json({
      ownerIdentity: {
        email: OWNER_EMAIL,
        phone: OWNER_PHONE,
        passkeyConfigured: Boolean(store.ownerPasskeyHash),
      },
      summary: {
        totalOrders: ordersList.length,
        verifiedCount: verifiedOrders.length,
        pendingCount: pendingOrders.length,
        verifiedRevenueInr,
      },
      orders: ordersList,
      panels: store.panels,
      merchant: store.merchant,
    });
  });

  app.post('/api/owner/orders/:orderId/approve', (req, res) => {
    const user = verifyAuthToken(req.headers.authorization);
    if (!user || user.role !== 'owner') {
      res.status(403).json({ error: 'Owner authorization required.' });
      return;
    }

    const order = store.orders[req.params.orderId];
    if (!order) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }

    if (order.status !== 'VERIFIED') {
      const manualUtr = `OWNER${Date.now().toString().slice(-7)}`;
      order.status = 'VERIFIED';
      order.rejectionReason = undefined;
      order.utrReference = order.utrReference || manualUtr;
      order.accessKey = order.accessKey || generateAccessKey();
      order.verifiedAt = new Date().toISOString();
      store.usedUtrs[order.utrReference] = order.orderId;
      saveStore(store);
    }

    const unlockedPanels = store.panels.filter((p) =>
      order.items.some((item) => item.panelId === p.id)
    );

    res.json({ order, unlockedPanels });
  });

  app.post('/api/owner/orders/:orderId/reject', (req, res) => {
    const user = verifyAuthToken(req.headers.authorization);
    if (!user || user.role !== 'owner') {
      res.status(403).json({ error: 'Owner authorization required.' });
      return;
    }

    const order = store.orders[req.params.orderId];
    if (!order) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }

    const { reason } = req.body as { reason?: string };
    if (order.utrReference && store.usedUtrs[order.utrReference] === order.orderId) {
      delete store.usedUtrs[order.utrReference];
    }

    order.status = 'REJECTED';
    order.rejectionReason =
      (reason ?? '').trim() ||
      'Payment not received in merchant UPI account. Check UTR and submit again.';
    saveStore(store);

    res.json({ order });
  });

  app.put('/api/owner/panels/:panelId', (req, res) => {
    const user = verifyAuthToken(req.headers.authorization);
    if (!user || user.role !== 'owner') {
      res.status(403).json({ error: 'Only the Owner ID can update Pro Panel pricing and details.' });
      return;
    }

    const panel = store.panels.find((p) => p.id === req.params.panelId);
    if (!panel) {
      res.status(404).json({ error: 'Pro Panel not found.' });
      return;
    }

    const { name, subtitle, priceInr, originalPriceInr, deliveryType } = req.body as {
      name?: string;
      subtitle?: string;
      priceInr?: number;
      originalPriceInr?: number;
      deliveryType?: string;
    };

    if (typeof name === 'string' && name.trim().length >= 2) {
      panel.name = name.trim().slice(0, 60);
    }
    if (typeof subtitle === 'string' && subtitle.trim().length >= 4) {
      panel.subtitle = subtitle.trim().slice(0, 140);
    }
    if (typeof deliveryType === 'string' && deliveryType.trim().length >= 2) {
      panel.deliveryType = deliveryType.trim().slice(0, 50);
    }
    if (typeof priceInr === 'number' && Number.isFinite(priceInr) && priceInr >= 1 && priceInr <= 99999) {
      panel.priceInr = Math.round(priceInr);
    }
    if (
      typeof originalPriceInr === 'number' &&
      Number.isFinite(originalPriceInr) &&
      originalPriceInr >= panel.priceInr &&
      originalPriceInr <= 99999
    ) {
      panel.originalPriceInr = Math.round(originalPriceInr);
    }

    saveStore(store);
    res.json({ panel, panels: store.panels });
  });

  app.put('/api/owner/passkey', (req, res) => {
    const user = verifyAuthToken(req.headers.authorization);
    if (!user || user.role !== 'owner') {
      res.status(403).json({ error: 'Only the primary Owner ID can update its passkey.' });
      return;
    }

    const { currentPasskey, newPasskey } = req.body as {
      currentPasskey?: string;
      newPasskey?: string;
    };

    if (store.ownerPasskeyHash && hashPasskey((currentPasskey ?? '').trim()) !== store.ownerPasskeyHash) {
      res.status(403).json({ error: 'Current Owner Passkey does not match.' });
      return;
    }

    const cleanedNew = (newPasskey ?? '').trim();
    if (cleanedNew.length < 4 || cleanedNew.length > 32) {
      res.status(400).json({ error: 'New Owner Passkey must be 4–32 characters.' });
      return;
    }

    store.ownerPasskeyHash = hashPasskey(cleanedNew);
    saveStore(store);
    res.json({ ok: true });
  });

  if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ApexSense server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
