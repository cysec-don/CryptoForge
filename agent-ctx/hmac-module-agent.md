# Task: Create HMAC Module Component for CryptoForge

## Summary
Created the `HMACModule` component at `/home/z/my-project/src/components/cryptoforge/hmac.tsx` and integrated it into the main page.

## What was done

### 1. Fixed `computeHMAC` bug in `/home/z/my-project/src/lib/crypto.ts`
- The function was always using `CryptoJS.HmacSHA256(message, key).toString()` regardless of the selected algorithm
- Fixed to use `CryptoJS.algo.HMAC.create(cryptoAlgo, key)` pattern so the correct algorithm is used

### 2. Created HMAC Module Component
File: `/home/z/my-project/src/components/cryptoforge/hmac.tsx`

Features implemented:
- **Header**: "HMAC Generator" with Shield icon and description
- **Mode Toggle**: Generate | Verify tabs using shadcn/ui Tabs
- **Generate Mode**:
  - Algorithm selector: HMAC-MD5, HMAC-SHA1, HMAC-SHA256, HMAC-SHA384, HMAC-SHA512, HMAC-SHA224, HMAC-RIPEMD160
  - Security badge showing bit size and security level (color-coded)
  - Secret key input with show/hide toggle (Eye/EyeOff icons)
  - Generate random key button (256-bit default)
  - Quick generate buttons for 128-bit, 256-bit, 512-bit keys
  - Key preview when hidden (masked with dots)
  - Message textarea
  - Generate HMAC button (disabled when inputs empty)
  - Result display with copy button, glow effect, monospace font
- **Verify Mode**:
  - Same algorithm selector and key input
  - Message textarea
  - Expected HMAC input
  - Verify button
  - Visual match/mismatch indicator (green CheckCircle2 / red XCircle with spring animation)
  - Side-by-side comparison (computed vs expected)
  - Color-coded result text
- **Design**: Dark glassmorphism theme using `glass-card` CSS class
  - Primary #2563EB (cf-blue), Accent #06B6D4 (cf-cyan)
  - Success #10B981 (cf-green), Danger #EF4444 (cf-red)
  - Framer Motion animations (fadeInUp, stagger, spring)
  - Responsive layout with grid for side-by-side comparison

### 3. Integrated into main page
File: `/home/z/my-project/src/app/page.tsx`
- Added HMAC tab with KeyRound icon
- Cyan accent color for active state
- HMACModule rendered in content area

## Lint Check
✅ Passed with no errors
