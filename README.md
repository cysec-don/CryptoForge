# 🔐 CryptoForge — Enterprise Cryptography Laboratory

**A modern, enterprise-grade web platform for generating, verifying, identifying, encrypting, decrypting, encoding, decoding, and learning about cryptographic algorithms — all running client-side in your browser.**

🌐 **Live Demo:** [https://cysec-don.github.io/CryptoForge/](https://cysec-don.github.io/CryptoForge/)

![CryptoForge](https://img.shields.io/badge/CryptoForge-v1.1.0-2563EB?style=for-the-badge&logo=shield&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)
![License](https://img.shields.io/badge/License-Custom%20Attribution-F59E0B?style=flat-square)
![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-222222?style=flat-square&logo=github&logoColor=white)
![Gist](https://img.shields.io/badge/Gist-Quick%20Start-6e40c9?style=flat-square&logo=gist&logoColor=white)
![Tests](https://img.shields.io/badge/Tests-56%2F56%20passing-10B981?style=flat-square)
![Algorithms](https://img.shields.io/badge/Algorithms-118%2B-06B6D4?style=flat-square)

---

## 🚀 Quick Links

| Link | Description |
|------|-------------|
| 🌐 **Live App** | [https://cysec-don.github.io/CryptoForge/](https://cysec-don.github.io/CryptoForge/) — Use CryptoForge directly in your browser, no installation needed |
| 📦 **GitHub Repo** | [https://github.com/cysec-don/CryptoForge](https://github.com/cysec-don/CryptoForge) — Source code, issues, and contributions |
| 📋 **Gist** | [https://gist.github.com/cysec-don/64b494ec6593e2e96e447e35f29e54c1](https://gist.github.com/cysec-don/64b494ec6593e2e96e447e35f29e54c1) — Quick-start script, GitHub Pages workflow & README snippet |
| 📊 **Compatibility Report** | [COMPATIBILITY_REPORT.md](./COMPATIBILITY_REPORT.md) — Full audit of existing vs. newly-added algorithms |

> **Try it now!** Open the [Live App](https://cysec-don.github.io/CryptoForge/) — all cryptographic operations run 100% client-side. Nothing leaves your browser.

---

## 📋 Table of Contents

- [Quick Links](#-quick-links)
- [Overview](#overview)
- [What's New in v1.1.0](#whats-new-in-v110)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Installation](#installation)
  - [Prerequisites](#prerequisites)
  - [Windows](#windows)
  - [macOS](#macos)
  - [Linux](#linux)
- [Configuration](#configuration)
- [GitHub Pages Deployment](#github-pages-deployment)
- [Usage Guide](#usage-guide)
- [API Reference](#api-reference)
- [Security](#security)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [License](#license)

---

## Overview

CryptoForge is a professional cryptography laboratory built as a single-page application with a dark glassmorphism design inspired by Stripe, Linear, Vercel, and Cloudflare Dashboard. It supports **118+ cryptographic algorithms** across hashing, encryption, encoding, HMAC, password hashing, key generation, asymmetric cryptography, key derivation, and checksums — all running entirely in your browser with zero data ever leaving your device.

**Key principle: Zero-knowledge.** All cryptographic operations execute client-side using the Web Crypto API, audited noble libraries, and hash-wasm. No passwords, keys, or plaintext are ever transmitted to any server.

---

## What's New in v1.1.0

This release expands CryptoForge from 22 to **118+ algorithms** through a strict audit-first incremental implementation. No existing APIs were renamed, no working implementations were replaced.

### New Modules (3 entirely new sidebar sections)
- **🔐 Asymmetric Cryptography** — Ed25519, X25519 (ECDH), ECDSA (secp256k1, P-256/384/521), RSA (1024–4096 bit) sign/verify, RSA-OAEP encrypt/decrypt
- **🔀 Key Derivation Functions** — HKDF (RFC 5869), PBKDF2 (RFC 2898), scrypt (RFC 7914), X9.63 (ANSI X9.63)
- **✅ Checksums** — 14 non-cryptographic checksums (Adler-32, Fletcher-16/32/64, FNV-1/1a, MurmurHash3, Pearson, SipHash, xxHash32/64/3, CRC32, CRC64)

### New Algorithms in Existing Modules
- **Hashing**: +19 algorithms (SHAKE128/256, cSHAKE128/256, TurboSHAKE128/256, KangarooTwelve, TupleHash128/256, ParallelHash128/256, BLAKE3, real BLAKE2b/2s, real Whirlpool, real SM3, real Keccak, xxHash32/64/3, Adler32, SHA-512/224, SHA-512/256)
- **Encryption**: +9 algorithms (ChaCha20-Poly1305, XChaCha20-Poly1305, Salsa20, AES-256-CTR, 3DES, DES, RC4, Rabbit)
- **Encoding**: +10 formats (Base16, Base36, Base45, Base62, Base64URL, Base85, Z85, Morse Code, Octal, Decimal)
- **Password Hashing**: +6 algorithms (Argon2id, Argon2i, Argon2d, scrypt, real bcrypt, PBKDF2-SHA1)

### Bug Fixes in v1.1.0
- ✅ SHA-256 Learning Center key mismatch — rich content now displays correctly
- ✅ Checksums table React DOM nesting error (`<tbody>` inside `<tbody>`) — eliminated
- ✅ Hash Identifier now parses `/etc/shadow` entries (extracts username, salt, hash, shadow metadata)
- ✅ API documentation reconciled with actual implementation (correct field names, response shapes)
- ✅ Settings page now persists to localStorage with working dark/light theme toggle
- ✅ Added missing Auto-Clear Clipboard enable toggle
- ✅ Fixed FNV-1/FNV-1a signed-hex display bug

### Library Upgrades
- `@noble/hashes` — Pure-JS audited hash functions (SHA-3, SHAKE, BLAKE2/3, HKDF, PBKDF2, scrypt)
- `@noble/ciphers` — Pure-JS audited ciphers (ChaCha20-Poly1305, XChaCha20-Poly1305, Salsa20, AES-GCM/CBC/CTR, Poly1305)
- `@noble/curves` — Pure-JS audited elliptic curves (Ed25519, X25519, secp256k1, P-256/384/521)
- `hash-wasm` — WASM-backed implementations for Argon2, bcrypt, scrypt, MD4, Whirlpool, SM3, Keccak, xxHash

---

## Features

### 🧮 Hashing Module (41 algorithms)
- **MD Family**: MD4, MD5
- **SHA-1**: SHA-1
- **SHA-2**: SHA-224, SHA-256, SHA-384, SHA-512, SHA-512/224, SHA-512/256
- **SHA-3**: SHA3-224, SHA3-256, SHA3-384, SHA3-512
- **SHAKE XOFs**: SHAKE128, SHAKE256, cSHAKE128, cSHAKE256, TurboSHAKE128, TurboSHAKE256, KangarooTwelve
- **NIST SP 800-185**: TupleHash128, TupleHash256, ParallelHash128, ParallelHash256
- **BLAKE**: BLAKE2b, BLAKE2s, BLAKE3
- **RIPEMD**: RIPEMD-160
- **Whirlpool, Keccak-224/256/384/512, SM3**
- **Non-cryptographic**: CRC32, CRC64, xxHash32, xxHash64, xxHash3, Adler32
- Batch hashing, comparison, history, JSON export

### 🔍 Hash Identifier Engine
- Automatically detects hash algorithm from structure
- **Full `/etc/shadow` parsing**: Extracts username, algorithm, salt, hash, and shadow metadata fields
- Supports: MD5 crypt, SHA-256 crypt, SHA-512 crypt, bcrypt, Argon2i/id, Apache MD5 (apr1), PHPass, NTLM, DES crypt
- Confidence scoring with visual indicators
- Hashcat mode and John the Ripper format references
- Auto-generated cracking commands

### 🔒 Encryption & Decryption (12 algorithms)
- **AES**: AES-128-GCM, AES-256-GCM, AES-128-CBC, AES-256-CBC, AES-256-CTR
- **ChaCha**: ChaCha20-Poly1305, XChaCha20-Poly1305
- **Salsa**: Salsa20
- **Legacy**: 3DES, DES, RC4, Rabbit
- Random key generation, IV/Nonce management, integrity verification

### 🔄 Encoding & Decoding (19 formats)
- Base64, Base32, Base58, Base16, Base36, Base45, Base62, Base64URL, Base85, Z85
- Hex, Binary, Octal, Decimal
- URL, HTML, Unicode Escape
- JWT Parse (decode header, payload, signature)

### 🛡️ HMAC Generator
- HMAC-MD5, HMAC-SHA1, HMAC-SHA224/256/384/512, HMAC-RIPEMD160
- Generate and Verify modes with side-by-side comparison

### 🔑 Password Hashing Center (9 algorithms)
- **Argon2**: Argon2id, Argon2i, Argon2d (configurable memory, iterations, parallelism)
- **bcrypt** (cost factor 4–31)
- **scrypt** (N, r, p parameters)
- **PBKDF2**: PBKDF2-SHA256, PBKDF2-SHA512, PBKDF2-SHA1
- Auto-salt generation, password strength meter, security recommendations

### 🔐 Key Generation Center
- AES Keys (128/192/256-bit), JWT Secrets, Random Tokens, API Keys, UUID v4, Passphrases, Hex Random Bytes
- Entropy visualizer with strength assessment

### 🔐 Asymmetric Cryptography (NEW)
- **Ed25519**: Key generation, sign, verify
- **X25519**: ECDH key exchange (Alice/Bob shared secret demo)
- **ECDSA**: secp256k1, P-256, P-384, P-521
- **RSA**: 1024/2048/3072/4096-bit key generation, sign/verify (RSASSA-PKCS1-v1_5), encrypt/decrypt (RSA-OAEP)

### 🔀 Key Derivation Functions (NEW)
- **HKDF** (RFC 5869) — SHA-256/384/512
- **PBKDF2** (RFC 2898) — async, configurable iterations
- **scrypt** (RFC 7914) — N, r, p parameters
- **X9.63** (ANSI X9.63) — for ECDH-derived key expansion

### ✅ Checksums (NEW — 14 algorithms)
- Adler-32, Fletcher-16/32/64, FNV-1, FNV-1a, MurmurHash3, Pearson, SipHash
- CRC32, CRC64, xxHash32, xxHash64, xxHash3
- Generate All button, comparison table, JSON export

### 📚 Learning Center
- Detailed algorithm pages with History, Purpose, Security Level, Weaknesses, Usage, Examples
- Interactive lab for live testing

### 📖 API Documentation
- 7 REST API endpoints with accurate request/response examples
- cURL, Node.js, Python SDK snippets
- Rate limiting and authentication guidance

### ⚙️ Settings
- **Dark/Light theme toggle** (persisted to localStorage, applied to `<html>` element)
- Compact mode
- Auto-clear clipboard (with enable toggle + timer)
- Default algorithm preferences
- Settings export/import as JSON
- Clear history / clear all data

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Animations | Framer Motion |
| Cryptography | Web Crypto API, @noble/hashes, @noble/ciphers, @noble/curves, hash-wasm, CryptoJS |
| State | React Hooks + Zustand |
| Database | Prisma ORM (SQLite) |
| Runtime | Bun |

---

## Installation

### Prerequisites

- **Node.js** ≥ 18.x (or Bun ≥ 1.0)
- **Git** ≥ 2.x
- A modern web browser (Chrome 90+, Firefox 90+, Safari 15+, Edge 90+)

---

### Windows

#### Step 1: Install Git
```powershell
winget install Git.Git
git --version
```

#### Step 2: Install Node.js
```powershell
winget install OpenJS.NodeJS.LTS
node --version
```

#### Step 3: Install Bun (Recommended)
```powershell
powershell -c "irm bun.sh/install.ps1 | iex"
bun --version
```

#### Step 4: Clone the Repository
```powershell
cd C:\Projects
git clone https://github.com/cysec-don/CryptoForge.git
cd CryptoForge
```

#### Step 5: Install Dependencies
```powershell
bun install
# Or: npm install
```

#### Step 6: Set Up the Database
```powershell
bun run db:push
bun run db:generate
```

#### Step 7: Start the Development Server
```powershell
bun run dev
```

Open your browser and navigate to `http://localhost:3000`

---

### macOS

#### Step 1: Install Homebrew
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Step 2: Install Git and Node.js
```bash
brew install git node
git --version
node --version
```

#### Step 3: Install Bun (Recommended)
```bash
curl -fsSL https://bun.sh/install | bash
source ~/.zshrc
bun --version
```

#### Step 4: Clone the Repository
```bash
cd ~/Projects
git clone https://github.com/cysec-don/CryptoForge.git
cd CryptoForge
```

#### Step 5: Install Dependencies
```bash
bun install
```

#### Step 6: Set Up the Database
```bash
bun run db:push
bun run db:generate
```

#### Step 7: Start the Development Server
```bash
bun run dev
```

Open your browser and navigate to `http://localhost:3000`

---

### Linux

#### Step 1: Install Git
```bash
# Ubuntu/Debian
sudo apt update && sudo apt install git

# Fedora/RHEL
sudo dnf install git

# Arch Linux
sudo pacman -S git

git --version
```

#### Step 2: Install Node.js
```bash
# Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install --lts
nvm use --lts
node --version
```

#### Step 3: Install Bun (Recommended)
```bash
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
bun --version
```

#### Step 4: Clone the Repository
```bash
cd ~/projects
git clone https://github.com/cysec-don/CryptoForge.git
cd CryptoForge
```

#### Step 5: Install Dependencies
```bash
bun install
```

#### Step 6: Set Up the Database
```bash
bun run db:push
bun run db:generate
```

#### Step 7: Start the Development Server
```bash
bun run dev
```

Open your browser and navigate to `http://localhost:3000`

---

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server on port 3000 |
| `bun run build` | Build for production |
| `bun run start` | Start production server |
| `bun run lint` | Run ESLint for code quality checks |
| `bun run db:push` | Push Prisma schema to database |
| `bun run db:generate` | Generate Prisma client |
| `bun run db:migrate` | Run database migrations |
| `bun run db:reset` | Reset database |
| `bun run scripts/test-crypto.ts` | Run 56-test cryptographic test suite |

---

## GitHub Pages Deployment

CryptoForge is deployed as a static site on GitHub Pages at **[https://cysec-don.github.io/CryptoForge/](https://cysec-don.github.io/CryptoForge/)**.

### How It Works

The app uses Next.js static export (`output: "export"`) with `basePath: "/CryptoForge"` to generate a fully static site. The built files are pushed to a `gh-pages` branch and served via GitHub Pages.

### Deploy an Updated Version

```bash
# 1. Temporarily move API routes (they require a server)
mv src/app/api /tmp/cf_api_backup

# 2. Build the static export
NEXT_STATIC_EXPORT=true npx next build

# 3. Add .nojekyll for GitHub Pages compatibility
touch out/.nojekyll

# 4. Add a 404.html that redirects to the main page (SPA routing)
cat > out/404.html << 'EOF'
<!DOCTYPE html><html><head><script>window.location.replace('/CryptoForge/');</script></head>
<body>Redirecting...</body></html>
EOF

# 5. Deploy to the gh-pages branch
cd out
git init
git checkout -b gh-pages
git add -A
git commit -m "Deploy CryptoForge to GitHub Pages"
git remote add origin https://github.com/cysec-don/CryptoForge.git
git push origin gh-pages --force
cd ..

# 6. Restore API routes
mv /tmp/cf_api_backup src/app/api

# 7. Clean up
rm -rf out
```

### Quick-Start Gist

The [CryptoForge Gist](https://gist.github.com/cysec-don/64b494ec6593e2e96e447e35f29e54c1) contains:
- **`quick-start.sh`** — One-command setup script
- **`deploy.yml`** — GitHub Actions workflow for automatic deployment
- **`README-SNIPPET.md`** — Concise README with live demo link

```bash
curl -sL https://gist.github.com/cysec-don/64b494ec6593e2e96e447e35f29e54c1/raw/quick-start.sh | bash
```

---

## Usage Guide

### Dashboard
The landing page provides an overview with hero section, animated counters (118+ algorithms), feature cards, and a live hash demo.

### Hashing
1. Type or paste text in the input field
2. Select algorithms using category tabs or individual checkboxes
3. Click **Generate Hash** to compute hashes for all selected algorithms
4. Use **Copy All** or **Export** for results

### Hash Identifier
1. Paste a hash string or full `/etc/shadow` entry
2. Auto-analysis shows parsed structure (username, salt, algorithm, hash) and possible algorithm matches with confidence scores
3. Example hashes available via "Show Examples" button

### Encryption & Decryption
1. Select an algorithm (AES-GCM, ChaCha20-Poly1305, 3DES, etc.)
2. Enter plaintext and generate/use a key
3. Click Encrypt — output is Base64 with embedded nonce
4. For decryption, paste ciphertext + same key

### Encoding
1. Toggle Encode/Decode mode
2. Select format (19 available including Morse, Base45, Base85)
3. Enter input and click process

### Asymmetric Crypto
1. Choose algorithm tab (Ed25519, X25519, ECDSA, RSA)
2. Generate key pair
3. Sign messages or perform key exchange
4. Verify signatures

### Key Derivation
1. Choose KDF (HKDF, PBKDF2, scrypt, X9.63)
2. Configure parameters
3. Derive keys with visual feedback

### Checksums
1. Enter input text
2. Click **Generate All** to compute all 14 checksums at once
3. Export results as JSON

### Settings
- Toggle dark/light theme (persisted)
- Enable auto-clear clipboard with timer
- Set default algorithms
- Export/clear all data

---

## API Reference

All endpoints accept POST requests with JSON bodies. No authentication required by default (use a reverse proxy in production).

### POST /api/hash
```json
{ "input": "Hello", "algorithm": "SHA256" }
```

### POST /api/encrypt
```json
{ "plaintext": "Secret", "key": "32-char-key", "mode": "AES-CBC" }
```

### POST /api/decrypt
```json
{ "ciphertext": "iv_hex:base64", "key": "32-char-key", "mode": "AES-CBC" }
```

### POST /api/verify
```json
{ "input": "hello", "expectedHash": "2cf24d...", "algorithm": "SHA256" }
```

### POST /api/hmac
```json
{ "message": "msg", "key": "secret", "algorithm": "HMAC-SHA256" }
```

### POST /api/identify
```json
{ "hash": "5d41402abc4b2a76b9719d911017c592" }
```

### POST /api/generate-key
```json
{ "type": "aes", "keySize": 256 }
```

---

## Security

- **Client-side only**: All cryptographic operations run in your browser
- **Zero-knowledge**: Passwords, keys, and plaintext never leave your device
- **Web Crypto API**: Native, audited cryptographic implementation
- **Audited libraries**: @noble/* libraries are publicly audited
- **No logging**: Sensitive values are never logged or stored persistently
- **CSP-ready**: Compatible with Content Security Policy headers

> ⚠️ The server-side API routes are provided for programmatic access. In production, secure them with authentication, rate limiting, and HTTPS via a reverse proxy.

---

## Project Structure

```
CryptoForge/
├── prisma/schema.prisma             # Database schema
├── public/logo.svg                  # Application logo
├── scripts/test-crypto.ts           # 56-test cryptographic test suite
├── src/
│   ├── app/
│   │   ├── api/                     # 7 REST API routes
│   │   ├── globals.css              # Global styles + dark/light theme
│   │   ├── layout.tsx               # Root layout
│   │   └── page.tsx                 # Main SPA page with sidebar
│   ├── components/
│   │   ├── cryptoforge/
│   │   │   ├── dashboard.tsx        # Landing page
│   │   │   ├── hashing.tsx          # 41 hash algorithms
│   │   │   ├── hash-identifier.tsx  # Hash ID + /etc/shadow parser
│   │   │   ├── encryption.tsx       # 12 encryption algorithms
│   │   │   ├── decryption.tsx       # Decryption module
│   │   │   ├── encoding.tsx         # 19 encoding formats
│   │   │   ├── hmac.tsx             # HMAC generator
│   │   │   ├── password-hashing.tsx # Argon2/bcrypt/scrypt/PBKDF2
│   │   │   ├── key-generation.tsx   # Key/token/UUID generation
│   │   │   ├── asymmetric.tsx       # Ed25519/X25519/ECDSA/RSA
│   │   │   ├── kdf.tsx              # HKDF/PBKDF2/scrypt/X9.63
│   │   │   ├── checksums.tsx        # 14 checksum algorithms
│   │   │   ├── learning-center.tsx  # Educational content
│   │   │   ├── api-docs.tsx         # API documentation
│   │   │   └── settings.tsx         # Persisted settings
│   │   └── ui/                      # shadcn/ui components
│   ├── hooks/                       # Custom React hooks
│   └── lib/
│       ├── crypto.ts                # Core crypto library (2000+ lines)
│       ├── db.ts                    # Database client
│       └── utils.ts                 # Utility functions
├── .env                             # Environment variables
├── COMPATIBILITY_REPORT.md          # Full algorithm audit report
├── LICENSE                          # CryptoForge Attribution License
├── README.md                        # This file
└── package.json                     # Dependencies
```

---

## Testing

CryptoForge includes a comprehensive test suite with **56 known-answer and round-trip tests**:

```bash
bun run scripts/test-crypto.ts
```

### Test Coverage
- **Hash KAT tests** (15): NIST FIPS 180-4 (SHA-2), FIPS 202 (SHA-3, SHAKE), RFC 6234, BLAKE2/3
- **Hash Identifier tests** (9): MD5, SHA-256, /etc/shadow parsing, bcrypt, SHA-512 crypt
- **Encoding round-trips** (10): All formats verify encode→decode returns original
- **Encryption round-trips** (9): ChaCha20-Poly1305, XChaCha20-Poly1305, Salsa20, AES-GCM, AES-CTR, 3DES, DES, RC4, Rabbit
- **KDF tests** (3): HKDF, scrypt, X9.63 produce correct-length output
- **Checksum tests** (6): Adler-32, Fletcher, FNV-1/1a, MurmurHash3 with known vectors
- **Asymmetric tests** (4): Ed25519 sign+verify (and tampered message rejection), X25519 ECDH shared-secret equality, ECDSA secp256k1

---

## License

This project is licensed under the **CryptoForge Attribution License**. See the [LICENSE](./LICENSE) file for details.

**Summary**: You are free to use, modify, and distribute this software, provided that you include prominent acknowledgement of the original author **CySec Don (cysecdon@gmail.com)** in all copies or substantial portions of the software.

---

<p align="center">
  Built with 🔐 by <strong>CySec Don</strong> · <a href="mailto:cysecdon@gmail.com">cysecdon@gmail.com</a>
</p>
