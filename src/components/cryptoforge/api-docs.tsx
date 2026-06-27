'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Code2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Terminal,
  BookOpen,
  KeyRound,
  Shield,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Endpoint {
  method: 'POST';
  path: string;
  title: string;
  description: string;
  requestBody: Record<string, unknown>;
  responseBody: Record<string, unknown>;
  curl: string;
}

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const ENDPOINTS: Endpoint[] = [
  {
    method: 'POST',
    path: '/api/hash',
    title: 'Generate Hash',
    description:
      'Compute a cryptographic hash of the given input using the specified algorithm. Supports MD4, MD5, SHA1, SHA224, SHA256, SHA384, SHA512, SHA3-224, SHA3-256, SHA3-384, SHA3-512, and RIPEMD160.',
    requestBody: {
      input: 'Hello, CryptoForge!',
      algorithm: 'SHA256',
    },
    responseBody: {
      algorithm: 'SHA256',
      input: 'Hello, CryptoForge!',
      hash: 'ec86cc5d5182bb8bf8523e2498a956f36cbdc0f8d1fa1a2891e98fffe6c9c666',
      timestamp: '2025-01-15T12:00:00.000Z',
    },
    curl: `curl -X POST http://localhost:3000/api/hash \\
  -H "Content-Type: application/json" \\
  -d '{"input":"Hello, CryptoForge!","algorithm":"SHA256"}'`,
  },
  {
    method: 'POST',
    path: '/api/encrypt',
    title: 'Encrypt Data',
    description:
      'Encrypt plaintext data using AES-CBC with a UTF-8 key (padded to 32 characters). Returns the ciphertext as a colon-delimited "iv_hex:base64_ciphertext" string. AES-GCM requires the browser Web Crypto API and is not supported server-side.',
    requestBody: {
      plaintext: 'Sensitive information',
      key: 'my-secret-key',
      mode: 'AES-CBC',
    },
    responseBody: {
      algorithm: 'AES-256-CBC',
      ciphertext: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4:U2FsdGVkX1+...',
      iv: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4',
      timestamp: '2025-01-15T12:00:00.000Z',
    },
    curl: `curl -X POST http://localhost:3000/api/encrypt \\
  -H "Content-Type: application/json" \\
  -d '{"plaintext":"Sensitive information","key":"my-secret-key","mode":"AES-CBC"}'`,
  },
  {
    method: 'POST',
    path: '/api/decrypt',
    title: 'Decrypt Data',
    description:
      'Decrypt previously encrypted data using AES-CBC. The ciphertext must be in the "iv_hex:base64_ciphertext" format returned by the encrypt endpoint, using the same key.',
    requestBody: {
      ciphertext: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4:U2FsdGVkX1+...',
      key: 'my-secret-key',
      mode: 'AES-CBC',
    },
    responseBody: {
      algorithm: 'AES-256-CBC',
      plaintext: 'Sensitive information',
      timestamp: '2025-01-15T12:00:00.000Z',
    },
    curl: `curl -X POST http://localhost:3000/api/decrypt \\
  -H "Content-Type: application/json" \\
  -d '{"ciphertext":"a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4:U2FsdGVkX1+...","key":"my-secret-key","mode":"AES-CBC"}'`,
  },
  {
    method: 'POST',
    path: '/api/verify',
    title: 'Verify Hash',
    description:
      'Verify that the given input matches the provided expected hash. Returns a boolean match result along with the computed hash for comparison.',
    requestBody: {
      input: 'Hello, CryptoForge!',
      expectedHash: 'ec86cc5d5182bb8bf8523e2498a956f36cbdc0f8d1fa1a2891e98fffe6c9c666',
      algorithm: 'SHA256',
    },
    responseBody: {
      algorithm: 'SHA256',
      match: true,
      computedHash: 'ec86cc5d5182bb8bf8523e2498a956f36cbdc0f8d1fa1a2891e98fffe6c9c666',
      expectedHash: 'ec86cc5d5182bb8bf8523e2498a956f36cbdc0f8d1fa1a2891e98fffe6c9c666',
      timestamp: '2025-01-15T12:00:00.000Z',
    },
    curl: `curl -X POST http://localhost:3000/api/verify \\
  -H "Content-Type: application/json" \\
  -d '{"input":"Hello, CryptoForge!","expectedHash":"ec86cc5d5182bb8bf8523e2498a956f36cbdc0f8d1fa1a2891e98fffe6c9c666","algorithm":"SHA256"}'`,
  },
  {
    method: 'POST',
    path: '/api/hmac',
    title: 'Generate HMAC',
    description:
      'Generate a Hash-based Message Authentication Code using the specified algorithm and secret key. Supports HMAC-MD5, HMAC-SHA1, HMAC-SHA224, HMAC-SHA256, HMAC-SHA384, HMAC-SHA512, and HMAC-RIPEMD160. Optionally pass expectedHmac to verify a match.',
    requestBody: {
      message: 'Message to authenticate',
      key: 'my-secret-key',
      algorithm: 'HMAC-SHA256',
    },
    responseBody: {
      algorithm: 'HMAC-SHA256',
      hmac: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
      timestamp: '2025-01-15T12:00:00.000Z',
    },
    curl: `curl -X POST http://localhost:3000/api/hmac \\
  -H "Content-Type: application/json" \\
  -d '{"message":"Message to authenticate","key":"my-secret-key","algorithm":"HMAC-SHA256"}'`,
  },
  {
    method: 'POST',
    path: '/api/identify',
    title: 'Identify Hash Algorithm',
    description:
      'Attempt to identify the hash algorithm used to produce the given hash string based on length and character patterns. Returns possible algorithm candidates with confidence scores.',
    requestBody: {
      hash: 'ec86cc5d5182bb8bf8523e2498a956f36cbdc0f8d1fa1a2891e98fffe6c9c666',
    },
    responseBody: {
      hash: 'ec86cc5d5182bb8bf852...',
      length: 64,
      charset: 'hexadecimal',
      possibleAlgorithms: [
        {
          name: 'SHA256',
          confidence: 85,
          description: 'SHA-256 hash (256-bit)',
          hashcatMode: '1400',
          johnFormat: 'raw-sha256',
        },
      ],
      timestamp: '2025-01-15T12:00:00.000Z',
    },
    curl: `curl -X POST http://localhost:3000/api/identify \\
  -H "Content-Type: application/json" \\
  -d '{"hash":"ec86cc5d5182bb8bf8523e2498a956f36cbdc0f8d1fa1a2891e98fffe6c9c666"}'`,
  },
  {
    method: 'POST',
    path: '/api/generate-key',
    title: 'Generate Key',
    description:
      'Generate a cryptographically secure random key. Supported types: aes, jwt-secret, token, api-key, uuid, and hex. Each type returns metadata describing the generated key.',
    requestBody: {
      type: 'aes',
      keySize: 256,
    },
    responseBody: {
      type: 'aes',
      key: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
      metadata: {
        algorithm: 'AES-256',
        keySize: 256,
        format: 'hex',
      },
      timestamp: '2025-01-15T12:00:00.000Z',
    },
    curl: `curl -X POST http://localhost:3000/api/generate-key \\
  -H "Content-Type: application/json" \\
  -d '{"type":"aes","keySize":256}'`,
  },
];

const SDK_EXAMPLES: Record<string, string> = {
  nodejs: `// Generate a SHA-256 hash
const res = await fetch('http://localhost:3000/api/hash', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    input: 'Hello, CryptoForge!',
    algorithm: 'SHA256',
  }),
});

const data = await res.json();
console.log(data.hash);
// => "ec86cc5d5182bb8bf8523e2498a956f36cbdc0f8d1fa1a2891e98fffe6c9c666"

// Encrypt data (AES-CBC)
const enc = await fetch('http://localhost:3000/api/encrypt', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    plaintext: 'Sensitive information',
    key: 'my-secret-key',
    mode: 'AES-CBC',
  }),
});

console.log((await enc.json()).ciphertext);`,
  python: `import requests

# Generate a SHA-256 hash
res = requests.post(
    "http://localhost:3000/api/hash",
    json={"input": "Hello, CryptoForge!", "algorithm": "SHA256"},
)
print(res.json()["hash"])
# => "ec86cc5d5182bb8bf8523e2498a956f36cbdc0f8d1fa1a2891e98fffe6c9c666"

# Encrypt data (AES-CBC)
enc = requests.post(
    "http://localhost:3000/api/encrypt",
    json={
        "plaintext": "Sensitive information",
        "key": "my-secret-key",
        "mode": "AES-CBC",
    },
)
print(enc.json()["ciphertext"])`,
  curl: `# Generate a SHA-256 hash
curl -X POST http://localhost:3000/api/hash \\
  -H "Content-Type: application/json" \\
  -d '{"input":"Hello, CryptoForge!","algorithm":"SHA256"}'

# Encrypt data (AES-CBC)
curl -X POST http://localhost:3000/api/encrypt \\
  -H "Content-Type: application/json" \\
  -d '{"plaintext":"Sensitive information","key":"my-secret-key","mode":"AES-CBC"}'

# Generate a secure AES-256 key
curl -X POST http://localhost:3000/api/generate-key \\
  -H "Content-Type: application/json" \\
  -d '{"type":"aes","keySize":256}'`,
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7 text-muted-foreground hover:text-foreground"
      onClick={handleCopy}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  );
}

function CodeBlock({ code, language }: { code: string; language?: string }) {
  return (
    <div className="relative rounded-lg overflow-hidden" style={{ backgroundColor: '#0a0e1a' }}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
          {language ?? 'json'}
        </span>
        <CopyButton text={code} />
      </div>
      <pre className="p-4 overflow-x-auto custom-scrollbar text-sm leading-relaxed">
        <code className="font-mono text-gray-300 whitespace-pre">{code}</code>
      </pre>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Endpoint Card                                                      */
/* ------------------------------------------------------------------ */

function EndpointCard({ endpoint, index }: { endpoint: Endpoint; index: number }) {
  const [expanded, setExpanded] = useState(false);

  const methodColor = endpoint.method === 'POST' ? 'text-amber-400' : 'text-green-400';
  const methodBg = endpoint.method === 'POST' ? 'bg-amber-400/10' : 'bg-green-400/10';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Card className="glass-card overflow-hidden hover:border-white/10 transition-colors">
        {/* Collapsed header */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-left"
        >
          <div className="flex items-center justify-between p-4 sm:p-6">
            <div className="flex items-center gap-3 min-w-0">
              <span
                className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold ${methodBg} ${methodColor} shrink-0`}
              >
                {endpoint.method}
              </span>
              <code className="font-mono text-sm text-foreground/90 truncate">
                {endpoint.path}
              </code>
              <span className="hidden sm:inline text-sm text-muted-foreground truncate">
                — {endpoint.title}
              </span>
            </div>
            <motion.div
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="shrink-0 ml-2"
            >
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            </motion.div>
          </div>
        </button>

        {/* Expanded detail */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="px-4 sm:px-6 pb-6 space-y-5">
                <Separator className="bg-white/5" />

                {/* Description */}
                <div>
                  <h4 className="text-sm font-medium text-foreground/80 mb-1">
                    Description
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {endpoint.description}
                  </p>
                </div>

                {/* Request body */}
                <div>
                  <h4 className="text-sm font-medium text-foreground/80 mb-2 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-cf-cyan" />
                    Request Body
                  </h4>
                  <CodeBlock
                    code={JSON.stringify(endpoint.requestBody, null, 2)}
                    language="json"
                  />
                </div>

                {/* Response */}
                <div>
                  <h4 className="text-sm font-medium text-foreground/80 mb-2 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-cf-green" />
                    Response
                  </h4>
                  <CodeBlock
                    code={JSON.stringify(endpoint.responseBody, null, 2)}
                    language="json"
                  />
                </div>

                {/* cURL */}
                <div>
                  <h4 className="text-sm font-medium text-foreground/80 mb-2 flex items-center gap-2">
                    <Terminal className="h-3.5 w-3.5 text-cf-cyan" />
                    cURL Example
                  </h4>
                  <CodeBlock code={endpoint.curl} language="bash" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function APIDocs() {
  const [activeSDKTab, setActiveSDKTab] = useState<string>('nodejs');

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-[#2563EB]/10 glow-blue">
            <BookOpen className="h-6 w-6 text-[#2563EB]" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold gradient-text">
            API Documentation
          </h2>
        </div>
        <p className="text-muted-foreground leading-relaxed max-w-2xl">
          Integrate cryptographic operations directly into your applications with the
          CryptoForge REST API. All endpoints accept JSON payloads and return JSON responses.
        </p>
      </motion.div>

      {/* ── Authentication ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <Card className="glass-card overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <KeyRound className="h-5 w-5 text-[#06B6D4]" />
              Authentication
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Authentication is optional when self-hosting. For production
              deployments, place the API behind a reverse proxy (e.g., Nginx,
              Cloudflare) and require an API key in the{' '}
              <code className="font-mono text-xs px-1.5 py-0.5 rounded bg-white/5 text-[#06B6D4]">
                Authorization
              </code>{' '}
              header (Bearer scheme). The included API routes do not enforce
              authentication by default.
            </p>
            <CodeBlock
              code={`Authorization: Bearer YOUR_API_KEY`}
              language="http"
            />
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-[#06B6D4]/10 text-[#06B6D4] border-[#06B6D4]/20">
                No auth by default
              </Badge>
              <Badge variant="secondary" className="bg-amber-400/10 text-amber-400 border-amber-400/20">
                Use a reverse proxy in production
              </Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Endpoints ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-5 w-5 text-[#2563EB]" />
          <h3 className="text-lg font-semibold">Endpoints</h3>
          <Badge variant="secondary" className="ml-2 bg-white/5">
            {ENDPOINTS.length} available
          </Badge>
        </div>

        <div className="space-y-3">
          {ENDPOINTS.map((ep, i) => (
            <EndpointCard key={ep.path} endpoint={ep} index={i} />
          ))}
        </div>
      </motion.div>

      {/* ── Rate Limiting ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <Card className="glass-card overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-[#2563EB]" />
              Rate Limiting
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              API requests are rate-limited to ensure fair usage. Limits vary by plan and are
              communicated via response headers.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-lg p-4 bg-white/[0.02] border border-white/5">
                <p className="text-2xl font-bold text-foreground">100</p>
                <p className="text-xs text-muted-foreground mt-1">Requests / minute (Free)</p>
              </div>
              <div className="rounded-lg p-4 bg-white/[0.02] border border-white/5">
                <p className="text-2xl font-bold text-foreground">1,000</p>
                <p className="text-xs text-muted-foreground mt-1">Requests / minute (Pro)</p>
              </div>
              <div className="rounded-lg p-4 bg-white/[0.02] border border-white/5">
                <p className="text-2xl font-bold text-foreground">∞</p>
                <p className="text-xs text-muted-foreground mt-1">Requests / minute (Enterprise)</p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-foreground/80 mb-2">
                Rate Limit Headers
              </h4>
              <CodeBlock
                code={`X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1700000000`}
                language="http"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── SDK Examples ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        <Card className="glass-card overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Code2 className="h-5 w-5 text-[#06B6D4]" />
              SDK Examples
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Tab bar */}
            <div className="flex gap-2 mb-4">
              {[
                { id: 'nodejs', label: 'Node.js' },
                { id: 'python', label: 'Python' },
                { id: 'curl', label: 'cURL' },
              ].map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeSDKTab === tab.id ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveSDKTab(tab.id)}
                  className={
                    activeSDKTab === tab.id
                      ? 'bg-[#2563EB] hover:bg-[#2563EB]/90 text-white'
                      : 'text-muted-foreground hover:text-foreground'
                  }
                >
                  {tab.label}
                </Button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeSDKTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <CodeBlock
                  code={SDK_EXAMPLES[activeSDKTab]}
                  language={activeSDKTab === 'curl' ? 'bash' : activeSDKTab}
                />
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
