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
import { Input } from '@/components/ui/input';
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
      'Compute a cryptographic hash of the given input data using the specified algorithm.',
    requestBody: {
      data: 'Hello, CryptoForge!',
      algorithm: 'sha-256',
    },
    responseBody: {
      algorithm: 'sha-256',
      hash: 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146',
      data: 'Hello, CryptoForge!',
    },
    curl: `curl -X POST https://api.cryptoforge.dev/api/hash \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"data":"Hello, CryptoForge!","algorithm":"sha-256"}'`,
  },
  {
    method: 'POST',
    path: '/api/encrypt',
    title: 'Encrypt Data',
    description:
      'Encrypt plaintext data using the specified algorithm and key. Returns the ciphertext along with the IV used.',
    requestBody: {
      plaintext: 'Sensitive information',
      algorithm: 'aes-256-gcm',
      key: 'base64-encoded-key',
    },
    responseBody: {
      algorithm: 'aes-256-gcm',
      ciphertext: 'base64-encoded-ciphertext',
      iv: 'base64-encoded-iv',
      tag: 'base64-encoded-tag',
    },
    curl: `curl -X POST https://api.cryptoforge.dev/api/encrypt \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"plaintext":"Sensitive information","algorithm":"aes-256-gcm","key":"base64-encoded-key"}'`,
  },
  {
    method: 'POST',
    path: '/api/decrypt',
    title: 'Decrypt Data',
    description:
      'Decrypt previously encrypted data using the specified algorithm, key, and IV.',
    requestBody: {
      ciphertext: 'base64-encoded-ciphertext',
      algorithm: 'aes-256-gcm',
      key: 'base64-encoded-key',
      iv: 'base64-encoded-iv',
      tag: 'base64-encoded-tag',
    },
    responseBody: {
      algorithm: 'aes-256-gcm',
      plaintext: 'Sensitive information',
    },
    curl: `curl -X POST https://api.cryptoforge.dev/api/decrypt \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"ciphertext":"base64-encoded-ciphertext","algorithm":"aes-256-gcm","key":"base64-encoded-key","iv":"base64-encoded-iv","tag":"base64-encoded-tag"}'`,
  },
  {
    method: 'POST',
    path: '/api/verify',
    title: 'Verify Hash',
    description:
      'Verify that the given data matches the provided hash. Returns a boolean result.',
    requestBody: {
      data: 'Hello, CryptoForge!',
      hash: 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146',
      algorithm: 'sha-256',
    },
    responseBody: {
      algorithm: 'sha-256',
      verified: true,
    },
    curl: `curl -X POST https://api.cryptoforge.dev/api/verify \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"data":"Hello, CryptoForge!","hash":"a591a6d...","algorithm":"sha-256"}'`,
  },
  {
    method: 'POST',
    path: '/api/hmac',
    title: 'Generate HMAC',
    description:
      'Generate a Hash-based Message Authentication Code using the specified algorithm and secret key.',
    requestBody: {
      data: 'Message to authenticate',
      key: 'my-secret-key',
      algorithm: 'sha-256',
    },
    responseBody: {
      algorithm: 'sha-256',
      hmac: 'base64-or-hex-encoded-hmac',
    },
    curl: `curl -X POST https://api.cryptoforge.dev/api/hmac \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"data":"Message to authenticate","key":"my-secret-key","algorithm":"sha-256"}'`,
  },
  {
    method: 'POST',
    path: '/api/identify',
    title: 'Identify Hash Algorithm',
    description:
      'Attempt to identify the hash algorithm used to produce the given hash string based on length and character patterns.',
    requestBody: {
      hash: 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146',
    },
    responseBody: {
      hash: 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146',
      possibleAlgorithms: ['SHA-256', 'SHA3-256'],
      bitLength: 256,
    },
    curl: `curl -X POST https://api.cryptoforge.dev/api/identify \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"hash":"a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146"}'`,
  },
  {
    method: 'POST',
    path: '/api/generate-key',
    title: 'Generate Key',
    description:
      'Generate a cryptographically secure random key of the specified length and encoding.',
    requestBody: {
      length: 32,
      encoding: 'base64',
    },
    responseBody: {
      key: 'base64-encoded-key',
      length: 32,
      encoding: 'base64',
    },
    curl: `curl -X POST https://api.cryptoforge.dev/api/generate-key \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"length":32,"encoding":"base64"}'`,
  },
];

const SDK_EXAMPLES: Record<string, string> = {
  nodejs: `const CryptoForge = require('cryptoforge-sdk');

const client = new CryptoForge('YOUR_API_KEY');

// Generate a SHA-256 hash
const result = await client.hash({
  data: 'Hello, CryptoForge!',
  algorithm: 'sha-256',
});

console.log(result.hash);
// => "a591a6d40bf420404a011733cfb7b..."

// Encrypt data
const encrypted = await client.encrypt({
  plaintext: 'Sensitive information',
  algorithm: 'aes-256-gcm',
  key: 'your-base64-key',
});

console.log(encrypted.ciphertext);`,
  python: `from cryptoforge import CryptoForgeClient

client = CryptoForgeClient("YOUR_API_KEY")

# Generate a SHA-256 hash
result = client.hash(
    data="Hello, CryptoForge!",
    algorithm="sha-256",
)

print(result["hash"])
# => "a591a6d40bf420404a011733cfb7b..."

# Encrypt data
encrypted = client.encrypt(
    plaintext="Sensitive information",
    algorithm="aes-256-gcm",
    key="your-base64-key",
)

print(encrypted["ciphertext"])`,
  curl: `# Generate a SHA-256 hash
curl -X POST https://api.cryptoforge.dev/api/hash \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"data":"Hello, CryptoForge!","algorithm":"sha-256"}'

# Encrypt data
curl -X POST https://api.cryptoforge.dev/api/encrypt \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"plaintext":"Sensitive info","algorithm":"aes-256-gcm","key":"your-key"}'

# Generate a secure key
curl -X POST https://api.cryptoforge.dev/api/generate-key \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"length":32,"encoding":"base64"}'`,
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
              All API requests must include a valid API key in the{' '}
              <code className="font-mono text-xs px-1.5 py-0.5 rounded bg-white/5 text-[#06B6D4]">
                Authorization
              </code>{' '}
              header using the Bearer scheme.
            </p>
            <CodeBlock
              code={`Authorization: Bearer YOUR_API_KEY`}
              language="http"
            />
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Your API Key
                </label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value="cf_sk_••••••••••••••••••••••••"
                    className="font-mono text-sm bg-[#0a0e1a] border-white/5"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0 border-white/10 hover:bg-white/5"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-amber-400/10 text-amber-400 border-amber-400/20">
                Keep your key secret
              </Badge>
              <Badge variant="secondary" className="bg-[#06B6D4]/10 text-[#06B6D4] border-[#06B6D4]/20">
                Rotate keys periodically
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
