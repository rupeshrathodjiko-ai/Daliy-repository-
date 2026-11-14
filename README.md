# ApexSense — Free Fire Sensitivity & Pro Panels

Device-calibrated Free Fire headshot sensitivity configurator (0–200 scale), side-by-side **Compare Devices** tool, and Pro Optimization Panels store with UPI QR checkout and an Owner Verification Panel.

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Framer Motion (`motion/react`), Lucide Icons
- **Backend:** Express (`server.ts`), QRCode generator, HMAC-signed order & owner auth tokens

## Local Development

```bash
npm install
npm run dev
```

App runs on `http://localhost:3000`.

## Production Build & Start

```bash
npm install
npm run build
NODE_ENV=production npx tsx server.ts
```

## Environment Variables

See `.env.example`:

- `PORT` — Server port (defaults to `3000`)
- `ORDER_SIGNING_SECRET` — Strong random secret string for HMAC token/order signing
