import type { ProPanelProduct } from '../types.ts';

export const PRO_PANELS: ProPanelProduct[] = [
  {
    id: 'panel-sensitivity-vault',
    slug: 'sensitivity-vault',
    tierLabel: 'Tier 01 · Sensitivity Pack',
    name: 'Apex Sensitivity Vault',
    subtitle: 'OB-Updated Multi-Weapon Sensitivity Profiles & DPI Matrix',
    priceInr: 149,
    originalPriceInr: 299,
    imageUrl: '/src/assets/images/pack_sensitivity_vault_1794630908595.jpg',
    deliveryType: 'Instant Digital Unlock',
    deviceCoverage: 'All Android & iOS Models (4GB–16GB RAM)',
    highlights: [
      'Weapon-specific drag curves for Desert Eagle, M1887, MP40 & Woodpecker',
      'Exact DPI & Pointer Speed table matched to screen size & refresh rate',
      '2-Finger & 3-Finger custom fire button placement coordinates',
      'Zero third-party APKs — 100% official in-game settings',
    ],
    deliverables: {
      hudLayouts: [
        {
          name: '2-Finger Classic Drag HUD',
          grip: '2-Finger Thumb',
          fireButtonSize: 46,
          fireButtonPos: 'Bottom-Right · X: 82% / Y: 78%',
          glooWallPos: 'Bottom-Left · X: 14% / Y: 76%',
          jumpScopePos: 'Right-Mid · X: 90% / Y: 48%',
          notes: 'Leaves 3.2cm vertical drag runway above the fire button for consistent upper-chest snaps.',
        },
      ],
      deviceTuningChecklist: [
        'Set Developer Options -> Smallest Width (DPI) to your calibrated device value (never exceed 650 on 4GB RAM).',
        'Set Pointer Speed to 85% (Android) or Tracking Speed to 7/10 (iOS AssistiveTouch).',
        'Disable Battery Saver & Adaptive Brightness during ranked sessions to avoid touch-rate drops.',
        'Keep in-game Graphics on Smooth or Standard with High FPS enabled for zero drag stutter.',
      ],
      aimDrills: [
        {
          drillName: 'Training Ground Bot Head-Lock',
          duration: '10 mins daily',
          weapon: 'Desert Eagle + M1887',
          focus: 'Place crosshair beside enemy torso, pause 0.1s, then execute a clean upward J-drag.',
        },
        {
          drillName: 'Moving Target SMG Tracking',
          duration: '8 mins daily',
          weapon: 'MP40 / UMP',
          focus: 'Strafe left-right while maintaining continuous micro-upward thumb pressure.',
        },
      ],
      presetBundleNote:
        'Includes downloadable JSON + printable quick-reference card covering Low-End (4GB), Mid-Range (6–8GB), and Flagship (120Hz+) presets.',
    },
  },
  {
    id: 'panel-ranked-precision',
    slug: 'ranked-precision',
    tierLabel: 'Tier 02 · Ranked Optimization',
    name: 'Ranked Precision Panel',
    subtitle: 'Complete HUD Blueprints, FPS Tuning & Anti-Recoil Calibration',
    priceInr: 299,
    originalPriceInr: 599,
    imageUrl: '/src/assets/images/pack_ranked_panel_1794630908866.jpg',
    deliveryType: 'Instant Digital Unlock',
    deviceCoverage: 'Calibrated for 60Hz, 90Hz, 120Hz & 144Hz Panels',
    highlights: [
      'Full 2-Finger, 3-Finger & 4-Finger Claw HUD pixel coordinate maps',
      'OS-level FPS & thermal throttling prevention guide (Android & iOS)',
      'Fast Sit-Up Gloo Wall & Quick-Switch timing blueprint for BR & CS Ranked',
      'Includes full Apex Sensitivity Vault weapon presets',
    ],
    deliverables: {
      hudLayouts: [
        {
          name: '3-Finger Clash Squad Hybrid',
          grip: '3-Finger Claw',
          fireButtonSize: 44,
          fireButtonPos: 'Bottom-Right · X: 84% / Y: 79%',
          glooWallPos: 'Top-Left · X: 12% / Y: 22%',
          jumpScopePos: 'Top-Right · X: 88% / Y: 36%',
          notes: 'Dedicated left index finger triggers instant crouch + gloo wall within 180ms of firing.',
        },
        {
          name: '4-Finger Tournament Claw',
          grip: '4-Finger Claw',
          fireButtonSize: 41,
          fireButtonPos: 'Bottom-Right · X: 83% / Y: 81%',
          glooWallPos: 'Top-Left · X: 13% / Y: 19%',
          jumpScopePos: 'Top-Right · X: 86% / Y: 21%',
          notes: 'Separates movement, scope-peek, fire, and quick-switch across independent fingers.',
        },
      ],
      deviceTuningChecklist: [
        'Enable Game Mode / Pro Gamer Mode and lock Touch Sampling Rate to Maximum.',
        'Turn off Background App Refresh and system animations (Window/Transition scale 0.5x).',
        'Set Free Fire High FPS = High, Shadows = Off for zero frame drops in final 12-player zones.',
        'Clean display with microfiber before ranked queues; matte film reduces thumb friction variance.',
      ],
      aimDrills: [
        {
          drillName: 'Crouch-Shot & Instant Gloo Cycle',
          duration: '12 mins daily',
          weapon: 'M1887 + Gloo Wall',
          focus: 'Fire -> Drag Up -> Weapon Switch -> Crouch -> Place Gloo in under 0.5s.',
        },
        {
          drillName: '2x / 4x Scope Reset Drill',
          duration: '10 mins daily',
          weapon: 'Woodpecker / AC80',
          focus: 'Scope-in at mid range, fire 2-round burst, de-scope immediately to re-center aim.',
        },
      ],
      presetBundleNote:
        'Full Ranked Precision bundle with multi-finger HUD coordinate maps, OS tuning steps, and weapon recoil resets.',
    },
  },
  {
    id: 'panel-tournament-pro',
    slug: 'tournament-pro',
    tierLabel: 'Tier 03 · Tournament Master',
    name: 'Tournament Master Panel',
    subtitle: 'Esports Squad Optimization Suite, Custom Device Profile & Drills',
    priceInr: 499,
    originalPriceInr: 999,
    imageUrl: '/src/assets/images/pack_tournament_pro_1794630910062.jpg',
    deliveryType: 'Instant Digital Unlock + Lifetime OB Updates',
    deviceCoverage: 'All Mobile Devices + Custom Per-Model Calibration File',
    highlights: [
      'Lifetime seasonal OB update sensitivity recalibrations at no extra fee',
      'Role-based setups: Rusher, Sniper/AWM Quick-Switch, IGL & Flanker',
      'Advanced touch latency, thermal control & network ping stability checklist',
      'Includes Sensitivity Vault + Ranked Precision Panel deliverables',
    ],
    deliverables: {
      hudLayouts: [
        {
          name: 'Rusher Pro 4-Finger Split',
          grip: '4-Finger Claw',
          fireButtonSize: 40,
          fireButtonPos: 'Bottom-Right · X: 83% / Y: 82%',
          glooWallPos: 'Top-Left · X: 11% / Y: 18%',
          jumpScopePos: 'Top-Right · X: 87% / Y: 20%',
          notes: 'Engineered for fast entry frags, jump-peek M1887 one-taps, and instant 360 gloo coverage.',
        },
        {
          name: 'Double Sniper Quick-Switch HUD',
          grip: '3-Finger / 4-Finger',
          fireButtonSize: 43,
          fireButtonPos: 'Bottom-Right · X: 84% / Y: 78%',
          glooWallPos: 'Bottom-Left · X: 16% / Y: 74%',
          jumpScopePos: 'Top-Left Quick-Switch · X: 22% / Y: 24%',
          notes: 'Places Quick Weapon Switch directly under left index for sub-200ms AWM/M82B double-tap cycles.',
        },
      ],
      deviceTuningChecklist: [
        'Switch mobile DNS to low-latency resolver (1.1.1.1) and lock 5GHz Wi-Fi or 5G band for stable 25–40ms ping.',
        'Lock screen refresh rate to 120Hz/144Hz inside app-specific display overrides.',
        'Remove thick rubberized cases during tournament lobbies to improve thermal dissipation.',
        'Use 10-minute warm-up routine before ranked push to stabilize muscle memory.',
      ],
      aimDrills: [
        {
          drillName: 'Double AWM Zero-Scope Timing',
          duration: '15 mins daily',
          weapon: 'Double AWM / M82B',
          focus: 'Left-fire button tap -> instant Quick Weapon Switch -> fire without waiting for reload animation.',
        },
        {
          drillName: '360° Rotational One-Tap Challenge',
          duration: '15 mins daily',
          weapon: 'Desert Eagle',
          focus: 'Sprint, spin 90–180 degrees, snap crosshair to head height and execute short rotational drag.',
        },
      ],
      presetBundleNote:
        'Complete Tournament Master archive including all role HUDs, OB patch update notes, and downloadable JSON config.',
    },
  },
];
