export type BrandKey =
  | 'all'
  | 'apple'
  | 'samsung'
  | 'xiaomi'
  | 'oneplus'
  | 'iqoo'
  | 'oppo'
  | 'realme'
  | 'rog'
  | 'infinix';

export type PlaystyleId =
  | 'onetap'
  | 'smg_rush'
  | 'ranked_br'
  | 'clash_squad';

export type ClawType = '2_finger' | '3_finger' | '4_finger';

export interface DeviceProfile {
  id: string;
  brand: Exclude<BrandKey, 'all'>;
  brandLabel: string;
  model: string;
  ramGb: number;
  refreshHz: number;
  touchSamplingHz: number;
  screenInches: number;
  defaultDpi: number;
  recommendedDpi: number;
  baseGeneral: number;
  baseRedDot: number;
  base2x: number;
  base4x: number;
  baseSniper: number;
  baseFreeLook: number;
  fireButtonPct: number;
  recommendedGraphics: string;
  deviceNote: string;
}

export interface CalibratedSettings {
  device: DeviceProfile;
  playstyle: PlaystyleId;
  clawType: ClawType;
  general: number;
  redDot: number;
  scope2x: number;
  scope4x: number;
  sniperScope: number;
  freeLook: number;
  fireButtonSize: number;
  recommendedDpi: number;
  graphicsPreset: string;
  dragTechnique: string;
  dragTip: string;
}

export interface ProPanelProduct {
  id: string;
  slug: string;
  tierLabel: string;
  name: string;
  subtitle: string;
  priceInr: number;
  originalPriceInr: number;
  imageUrl: string;
  deliveryType: string;
  deviceCoverage: string;
  highlights: string[];
  deliverables: {
    hudLayouts: {
      name: string;
      grip: string;
      fireButtonSize: number;
      fireButtonPos: string;
      glooWallPos: string;
      jumpScopePos: string;
      notes: string;
    }[];
    deviceTuningChecklist: string[];
    aimDrills: {
      drillName: string;
      duration: string;
      weapon: string;
      focus: string;
    }[];
    presetBundleNote: string;
  };
}

export interface MerchantQrConfig {
  upiId: string;
  merchantName: string;
  notePrefix: string;
  useCustomQrImage: boolean;
  customQrImageUrl: string;
  updatedAt: string;
}

export interface OrderItem {
  panelId: string;
  name: string;
  priceInr: number;
  quantity: number;
}

export interface OrderRecord {
  orderId: string;
  items: OrderItem[];
  totalInr: number;
  customerPhone: string;
  customerEmail: string;
  deviceModel: string;
  status: 'PENDING_PAYMENT' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED';
  upiUri: string;
  qrDataUrl: string;
  utrReference?: string;
  rejectionReason?: string;
  accessKey?: string;
  signature: string;
  createdAt: string;
  submittedAt?: string;
  verifiedAt?: string;
}

export interface AuthUser {
  id: string;
  method: 'phone' | 'gmail';
  identifier: string;
  displayName: string;
  role: 'user' | 'owner';
}

