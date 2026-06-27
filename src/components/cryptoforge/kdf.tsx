'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  KeyRound,
  Copy,
  Check,
  RefreshCw,
  Eye,
  EyeOff,
  Shield,
  Hash,
  Cpu,
  Zap,
  Info,
  AlertTriangle,
  Loader2,
  Binary,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  deriveHKDF,
  derivePbkdf2,
  deriveScrypt,
  deriveX963,
  generateRandomBytes,
} from '@/lib/crypto';

// ─── Types ────────────────────────────────────────────────────────────────────

type KDFAlgorithm = 'hkdf' | 'pbkdf2' | 'scrypt' | 'x963';
type HashAlgo = 'SHA-256' | 'SHA-384' | 'SHA-512';

interface DeriveResult {
  hex: string;
  bytes: number;
  algorithm: string;
  timestamp: Date;
  durationMs: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ALGO_TABS: {
  id: KDFAlgorithm;
  label: string;
  rfc: string;
  icon: React.ElementType;
  accent: string;
}[] = [
  { id: 'hkdf', label: 'HKDF', rfc: 'RFC 5869', icon: Zap, accent: 'cf-blue' },
  { id: 'pbkdf2', label: 'PBKDF2', rfc: 'RFC 2898', icon: Hash, accent: 'cf-cyan' },
  { id: 'scrypt', label: 'scrypt', rfc: 'RFC 7914', icon: Cpu, accent: 'cf-green' },
  { id: 'x963', label: 'X9.63', rfc: 'ANSI X9.63', icon: Binary, accent: 'cf-amber' },
];

const SCRYPT_N_OPTIONS = [16384, 32768, 65536, 131072];

const ACCENT_MAP: Record<
  string,
  {
    text: string;
    bgSoft: string;
    border: string;
    bgSolid: string;
    ring: string;
    shadow: string;
  }
> = {
  'cf-blue': {
    text: 'text-cf-blue',
    bgSoft: 'bg-cf-blue/10',
    border: 'border-cf-blue/30',
    bgSolid: 'bg-cf-blue',
    ring: 'focus:border-cf-blue/50 focus:ring-cf-blue/20',
    shadow: 'glow-blue',
  },
  'cf-cyan': {
    text: 'text-cf-cyan',
    bgSoft: 'bg-cf-cyan/10',
    border: 'border-cf-cyan/30',
    bgSolid: 'bg-cf-cyan',
    ring: 'focus:border-cf-cyan/50 focus:ring-cf-cyan/20',
    shadow: 'glow-cyan',
  },
  'cf-green': {
    text: 'text-cf-green',
    bgSoft: 'bg-cf-green/10',
    border: 'border-cf-green/30',
    bgSolid: 'bg-cf-green',
    ring: 'focus:border-cf-green/50 focus:ring-cf-green/20',
    shadow: 'glow-cyan',
  },
  'cf-amber': {
    text: 'text-cf-amber',
    bgSoft: 'bg-cf-amber/10',
    border: 'border-cf-amber/30',
    bgSolid: 'bg-cf-amber',
    ring: 'focus:border-cf-amber/50 focus:ring-cf-amber/20',
    shadow: 'glow-blue',
  },
};

// ─── Animation Variants ───────────────────────────────────────────────────────

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function truncateMiddle(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  const half = Math.floor(maxLen / 2);
  return str.slice(0, half) + '…' + str.slice(str.length - half);
}

function isHex(value: string): boolean {
  return /^[0-9a-fA-F]*$/.test(value) && value.length % 2 === 0;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function KDF() {
  // Active tab
  const [activeTab, setActiveTab] = useState<KDFAlgorithm>('hkdf');

  // HKDF state
  const [hkdfIkm, setHkdfIkm] = useState('');
  const [hkdfSalt, setHkdfSalt] = useState('');
  const [hkdfInfo, setHkdfInfo] = useState('');
  const [hkdfHash, setHkdfHash] = useState<HashAlgo>('SHA-256');
  const [hkdfLen, setHkdfLen] = useState(32);

  // PBKDF2 state
  const [pbkdf2Password, setPbkdf2Password] = useState('');
  const [pbkdf2ShowPw, setPbkdf2ShowPw] = useState(false);
  const [pbkdf2Salt, setPbkdf2Salt] = useState('');
  const [pbkdf2Iterations, setPbkdf2Iterations] = useState(100000);
  const [pbkdf2Hash, setPbkdf2Hash] = useState<HashAlgo>('SHA-256');
  const [pbkdf2Len, setPbkdf2Len] = useState(32);

  // scrypt state
  const [scryptPassword, setScryptPassword] = useState('');
  const [scryptShowPw, setScryptShowPw] = useState(false);
  const [scryptSalt, setScryptSalt] = useState('');
  const [scryptN, setScryptN] = useState(16384);
  const [scryptR, setScryptR] = useState(8);
  const [scryptP, setScryptP] = useState(1);
  const [scryptLen, setScryptLen] = useState(32);

  // X9.63 state
  const [x963Secret, setX963Secret] = useState('');
  const [x963Info, setX963Info] = useState('');
  const [x963Len, setX963Len] = useState(32);

  // Result state
  const [result, setResult] = useState<DeriveResult | null>(null);
  const [isDeriving, setIsDeriving] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const currentTab = ALGO_TABS.find((t) => t.id === activeTab)!;
  const accent = ACCENT_MAP[currentTab.accent];

  // ── Handlers ──────────────────────────────────────────────────────────────

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const handleGenerateSalt = useCallback(
    (setter: (v: string) => void, bytes = 16) => {
      setter(generateRandomBytes(bytes));
    },
    []
  );

  const handleGenerateX963Secret = useCallback(() => {
    setX963Secret(generateRandomBytes(32));
  }, []);

  const resetResult = useCallback(() => {
    setResult(null);
    setError('');
  }, []);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab as KDFAlgorithm);
    resetResult();
  }, [resetResult]);

  // ── Derive handlers ──────────────────────────────────────────────────────

  const handleDeriveHKDF = useCallback(() => {
    if (!hkdfIkm.trim()) {
      setError('Input Keying Material (IKM) is required');
      return;
    }
    setIsDeriving(true);
    setError('');
    setResult(null);
    const start = performance.now();
    setTimeout(() => {
      try {
        const hex = deriveHKDF(hkdfIkm, hkdfSalt, hkdfInfo, hkdfLen, hkdfHash);
        const durationMs = performance.now() - start;
        setResult({
          hex,
          bytes: hkdfLen,
          algorithm: `HKDF-${hkdfHash}`,
          timestamp: new Date(),
          durationMs,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'HKDF derivation failed');
      } finally {
        setIsDeriving(false);
      }
    }, 30);
  }, [hkdfIkm, hkdfSalt, hkdfInfo, hkdfLen, hkdfHash]);

  const handleDerivePBKDF2 = useCallback(async () => {
    if (!pbkdf2Password.trim()) {
      setError('Password is required');
      return;
    }
    if (!pbkdf2Salt.trim()) {
      setError('Salt is required (use the generate button to create one)');
      return;
    }
    setIsDeriving(true);
    setError('');
    setResult(null);
    const start = performance.now();
    try {
      const hex = await derivePbkdf2(
        pbkdf2Password,
        pbkdf2Salt,
        pbkdf2Iterations,
        pbkdf2Len,
        pbkdf2Hash
      );
      const durationMs = performance.now() - start;
      setResult({
        hex,
        bytes: pbkdf2Len,
        algorithm: `PBKDF2-HMAC-${pbkdf2Hash}`,
        timestamp: new Date(),
        durationMs,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'PBKDF2 derivation failed');
    } finally {
      setIsDeriving(false);
    }
  }, [pbkdf2Password, pbkdf2Salt, pbkdf2Iterations, pbkdf2Len, pbkdf2Hash]);

  const handleDeriveScrypt = useCallback(() => {
    if (!scryptPassword.trim()) {
      setError('Password is required');
      return;
    }
    if (!scryptSalt.trim()) {
      setError('Salt is required (use the generate button to create one)');
      return;
    }
    setIsDeriving(true);
    setError('');
    setResult(null);
    const start = performance.now();
    // scrypt can be slow — defer to next tick so the spinner can render
    setTimeout(() => {
      try {
        const hex = deriveScrypt(
          scryptPassword,
          scryptSalt,
          scryptN,
          scryptR,
          scryptP,
          scryptLen
        );
        const durationMs = performance.now() - start;
        setResult({
          hex,
          bytes: scryptLen,
          algorithm: `scrypt(N=${scryptN}, r=${scryptR}, p=${scryptP})`,
          timestamp: new Date(),
          durationMs,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'scrypt derivation failed');
      } finally {
        setIsDeriving(false);
      }
    }, 30);
  }, [scryptPassword, scryptSalt, scryptN, scryptR, scryptP, scryptLen]);

  const handleDeriveX963 = useCallback(() => {
    if (!x963Secret.trim()) {
      setError('Shared Secret (Z) is required');
      return;
    }
    if (!isHex(x963Secret)) {
      setError('Shared Secret must be a valid even-length hex string');
      return;
    }
    setIsDeriving(true);
    setError('');
    setResult(null);
    const start = performance.now();
    setTimeout(() => {
      try {
        const hex = deriveX963(x963Secret, x963Info, x963Len);
        const durationMs = performance.now() - start;
        setResult({
          hex,
          bytes: x963Len,
          algorithm: 'X9.63-KDF (SHA-256)',
          timestamp: new Date(),
          durationMs,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'X9.63 derivation failed');
      } finally {
        setIsDeriving(false);
      }
    }, 30);
  }, [x963Secret, x963Info, x963Len]);

  // ── Slider helpers ───────────────────────────────────────────────────────

  const renderLengthSlider = (
    value: number,
    onChange: (v: number) => void,
    label = 'Output Length'
  ) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={`${accent.bgSoft} ${accent.text} ${accent.border} text-xs font-mono`}
          >
            {value} bytes
          </Badge>
          <span className="text-[10px] text-muted-foreground/60">
            {value * 8} bits
          </span>
        </div>
      </div>
      <Slider
        value={[value]}
        onValueChange={(v) => onChange(v[0])}
        min={16}
        max={128}
        step={1}
        className="w-full"
      />
      <div className="flex justify-between text-[10px] text-muted-foreground/60">
        <span>16</span>
        <span>64</span>
        <span>128</span>
      </div>
    </div>
  );

  const renderHashSelector = (
    value: HashAlgo,
    onChange: (v: HashAlgo) => void
  ) => (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">Hash Function</Label>
      <Select value={value} onValueChange={(v) => onChange(v as HashAlgo)}>
        <SelectTrigger
          className={`w-full bg-white/5 border-white/10 text-foreground hover:bg-white/[0.08] transition-colors ${accent.ring}`}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-[#1a1f35] border-white/10">
          {(['SHA-256', 'SHA-384', 'SHA-512'] as HashAlgo[]).map((h) => (
            <SelectItem
              key={h}
              value={h}
              className="text-foreground focus:bg-white/10 focus:text-foreground"
            >
              {h}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <motion.div
      variants={stagger}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      {/* ── Header ────────────────────────────────────────────────────── */}
      <motion.div variants={fadeInUp} className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cf-blue/10 border border-cf-blue/20">
          <KeyRound className="h-6 w-6 text-cf-blue" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">
            Key Derivation Functions
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Derive cryptographic keys from passwords or shared secrets
          </p>
        </div>
      </motion.div>

      {/* ── Algorithm Tabs ────────────────────────────────────────────── */}
      <motion.div variants={fadeInUp}>
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="space-y-6"
        >
          <TabsList className="glass-card rounded-lg p-1 h-auto flex-wrap">
            {ALGO_TABS.map((tab) => {
              const Icon = tab.icon;
              const tabAccent = ACCENT_MAP[tab.accent];
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className={`data-[state=active]:${tabAccent.bgSoft} data-[state=active]:${tabAccent.text} data-[state=active]:${tabAccent.border} px-4 sm:px-6 py-2.5 rounded-md text-sm font-medium transition-all border border-transparent data-[state=active]:border flex items-center gap-2`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                  <Badge
                    variant="outline"
                    className="ml-1 text-[9px] px-1.5 py-0 h-4 border-white/10 text-muted-foreground hidden sm:inline-flex"
                  >
                    {tab.rfc}
                  </Badge>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* ── HKDF Tab ─────────────────────────────────────────────── */}
          <TabsContent value="hkdf" className="space-y-4 mt-0">
            <motion.div variants={fadeInUp}>
              <Card className="glass-card rounded-xl border-0">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Zap className={`h-4 w-4 ${accent.text}`} />
                    HKDF — HMAC-based Key Derivation Function
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex items-start gap-2 text-xs text-muted-foreground bg-white/[0.02] border border-white/[0.06] rounded-lg p-2.5">
                    <Info className="h-3.5 w-3.5 text-cf-cyan shrink-0 mt-px" />
                    <span>
                      HKDF extracts and expands key material using HMAC. Suitable for
                      deriving keys from already-uniform shared secrets (e.g. ECDH
                      output). Defined in RFC 5869.
                    </span>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">
                      Input Keying Material (IKM)
                    </Label>
                    <Textarea
                      value={hkdfIkm}
                      onChange={(e) => setHkdfIkm(e.target.value)}
                      placeholder="Enter the input keying material (e.g. ECDH shared secret)..."
                      className={`min-h-[80px] bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground/40 resize-y custom-scrollbar ${accent.ring}`}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        Salt <span className="opacity-60">(optional)</span>
                      </Label>
                      <Input
                        value={hkdfSalt}
                        onChange={(e) => setHkdfSalt(e.target.value)}
                        placeholder="Optional salt..."
                        className={`bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground/40 ${accent.ring}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        Info <span className="opacity-60">(optional)</span>
                      </Label>
                      <Input
                        value={hkdfInfo}
                        onChange={(e) => setHkdfInfo(e.target.value)}
                        placeholder="Optional context info..."
                        className={`bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground/40 ${accent.ring}`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {renderHashSelector(hkdfHash, setHkdfHash)}
                    {renderLengthSlider(hkdfLen, setHkdfLen)}
                  </div>

                  <Button
                    onClick={handleDeriveHKDF}
                    disabled={isDeriving || !hkdfIkm.trim()}
                    className={`w-full ${accent.bgSolid} hover:opacity-90 text-white font-medium py-5 disabled:opacity-40 disabled:cursor-not-allowed transition-all`}
                  >
                    {isDeriving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Zap className="mr-2 h-4 w-4" />
                    )}
                    Derive Key (HKDF)
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* ── PBKDF2 Tab ───────────────────────────────────────────── */}
          <TabsContent value="pbkdf2" className="space-y-4 mt-0">
            <motion.div variants={fadeInUp}>
              <Card className="glass-card rounded-xl border-0">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Hash className={`h-4 w-4 ${accent.text}`} />
                    PBKDF2 — Password-Based Key Derivation Function 2
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex items-start gap-2 text-xs text-muted-foreground bg-white/[0.02] border border-white/[0.06] rounded-lg p-2.5">
                    <Info className="h-3.5 w-3.5 text-cf-cyan shrink-0 mt-px" />
                    <span>
                      PBKDF2 derives a key from a password using a salted HMAC with
                      many iterations. Asynchronous — higher iteration counts slow
                      brute-force attacks. Defined in RFC 2898.
                    </span>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        type={pbkdf2ShowPw ? 'text' : 'password'}
                        value={pbkdf2Password}
                        onChange={(e) => setPbkdf2Password(e.target.value)}
                        placeholder="Enter password..."
                        className={`pr-10 bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground/40 font-mono ${accent.ring}`}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setPbkdf2ShowPw(!pbkdf2ShowPw)}
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                      >
                        {pbkdf2ShowPw ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground">Salt</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGenerateSalt(setPbkdf2Salt, 16)}
                        className={`h-7 px-2.5 text-xs bg-white/5 border-white/10 text-muted-foreground hover:${accent.text} hover:border-white/20`}
                      >
                        <RefreshCw className="mr-1 h-3 w-3" />
                        Generate Random
                      </Button>
                    </div>
                    <Input
                      value={pbkdf2Salt}
                      onChange={(e) => setPbkdf2Salt(e.target.value)}
                      placeholder="Salt (hex) — paste your own or generate..."
                      className={`font-mono bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground/40 ${accent.ring}`}
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground">
                        Iterations
                      </Label>
                      <Badge
                        variant="outline"
                        className={`${accent.bgSoft} ${accent.text} ${accent.border} text-xs font-mono`}
                      >
                        {pbkdf2Iterations.toLocaleString()}
                      </Badge>
                    </div>
                    <Slider
                      value={[Math.log10(pbkdf2Iterations)]}
                      onValueChange={(v) =>
                        setPbkdf2Iterations(Math.round(Math.pow(10, v[0])))
                      }
                      min={3}
                      max={6}
                      step={0.05}
                      className="w-full"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground/60">
                      <span>1,000</span>
                      <span>100,000 (default)</span>
                      <span>1,000,000</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {renderHashSelector(pbkdf2Hash, setPbkdf2Hash)}
                    {renderLengthSlider(pbkdf2Len, setPbkdf2Len)}
                  </div>

                  <Button
                    onClick={handleDerivePBKDF2}
                    disabled={isDeriving || !pbkdf2Password.trim() || !pbkdf2Salt.trim()}
                    className={`w-full ${accent.bgSolid} hover:opacity-90 text-white font-medium py-5 disabled:opacity-40 disabled:cursor-not-allowed transition-all`}
                  >
                    {isDeriving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Hash className="mr-2 h-4 w-4" />
                    )}
                    {isDeriving ? 'Deriving…' : 'Derive Key (PBKDF2)'}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* ── scrypt Tab ───────────────────────────────────────────── */}
          <TabsContent value="scrypt" className="space-y-4 mt-0">
            <motion.div variants={fadeInUp}>
              <Card className="glass-card rounded-xl border-0">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Cpu className={`h-4 w-4 ${accent.text}`} />
                    scrypt — Memory-Hard KDF
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex items-start gap-2 text-xs text-amber-400/80 bg-amber-500/[0.04] border border-amber-500/20 rounded-lg p-2.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-px" />
                    <span>
                      scrypt is memory-hard and intentionally slow. High N values
                      (e.g. 131072) can take several seconds and consume a lot of
                      memory. Defined in RFC 7914.
                    </span>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        type={scryptShowPw ? 'text' : 'password'}
                        value={scryptPassword}
                        onChange={(e) => setScryptPassword(e.target.value)}
                        placeholder="Enter password..."
                        className={`pr-10 bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground/40 font-mono ${accent.ring}`}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setScryptShowPw(!scryptShowPw)}
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                      >
                        {scryptShowPw ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground">Salt</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGenerateSalt(setScryptSalt, 16)}
                        className={`h-7 px-2.5 text-xs bg-white/5 border-white/10 text-muted-foreground hover:${accent.text} hover:border-white/20`}
                      >
                        <RefreshCw className="mr-1 h-3 w-3" />
                        Generate Random
                      </Button>
                    </div>
                    <Input
                      value={scryptSalt}
                      onChange={(e) => setScryptSalt(e.target.value)}
                      placeholder="Salt (hex)..."
                      className={`font-mono bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground/40 ${accent.ring}`}
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground">
                        N — CPU/Memory Cost Factor
                      </Label>
                      <Badge
                        variant="outline"
                        className={`${accent.bgSoft} ${accent.text} ${accent.border} text-xs font-mono`}
                      >
                        {scryptN.toLocaleString()}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {SCRYPT_N_OPTIONS.map((n) => (
                        <button
                          key={n}
                          onClick={() => setScryptN(n)}
                          className={`py-2 rounded-lg text-xs font-mono font-medium transition-all border ${
                            scryptN === n
                              ? `${accent.bgSoft} ${accent.text} ${accent.border}`
                              : 'bg-white/[0.03] border-white/[0.06] text-muted-foreground hover:bg-white/[0.06] hover:text-foreground'
                          }`}
                        >
                          {n.toLocaleString()}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground/60">
                      N must be a power of 2. Memory usage ≈ 128 · N · r bytes.
                      Current: ~{(128 * scryptN * scryptR / 1024).toFixed(0)} KB
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        r — Block Size Factor
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        max={32}
                        value={scryptR}
                        onChange={(e) => setScryptR(Math.max(1, Number(e.target.value) || 1))}
                        className={`font-mono bg-white/5 border-white/10 text-foreground ${accent.ring}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        p — Parallelism Factor
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        max={16}
                        value={scryptP}
                        onChange={(e) => setScryptP(Math.max(1, Number(e.target.value) || 1))}
                        className={`font-mono bg-white/5 border-white/10 text-foreground ${accent.ring}`}
                      />
                    </div>
                  </div>

                  {renderLengthSlider(scryptLen, setScryptLen)}

                  <Button
                    onClick={handleDeriveScrypt}
                    disabled={isDeriving || !scryptPassword.trim() || !scryptSalt.trim()}
                    className={`w-full ${accent.bgSolid} hover:opacity-90 text-white font-medium py-5 disabled:opacity-40 disabled:cursor-not-allowed transition-all`}
                  >
                    {isDeriving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Cpu className="mr-2 h-4 w-4" />
                    )}
                    {isDeriving ? 'Deriving (this may take a moment)…' : 'Derive Key (scrypt)'}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* ── X9.63 Tab ────────────────────────────────────────────── */}
          <TabsContent value="x963" className="space-y-4 mt-0">
            <motion.div variants={fadeInUp}>
              <Card className="glass-card rounded-xl border-0">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Binary className={`h-4 w-4 ${accent.text}`} />
                    X9.63 — ANSI X9.63 Key Derivation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex items-start gap-2 text-xs text-muted-foreground bg-white/[0.02] border border-white/[0.06] rounded-lg p-2.5">
                    <Info className="h-3.5 w-3.5 text-cf-cyan shrink-0 mt-px" />
                    <span>
                      X9.63 KDF derives keying material from a shared secret (typically
                      an ECDH result) by iterating
                      <span className="font-mono mx-1">
                        Hash(Z ‖ Counter ‖ SharedInfo)
                      </span>
                      using SHA-256. Standardised in ANSI X9.63 / NIST SP 800-56A.
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-muted-foreground">
                        Shared Secret (Z) — hex
                      </Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleGenerateX963Secret}
                        className={`h-7 px-2.5 text-xs bg-white/5 border-white/10 text-muted-foreground hover:${accent.text} hover:border-white/20`}
                      >
                        <RefreshCw className="mr-1 h-3 w-3" />
                        Generate 32 bytes
                      </Button>
                    </div>
                    <Textarea
                      value={x963Secret}
                      onChange={(e) => setX963Secret(e.target.value)}
                      placeholder="Enter the shared secret Z in hex (e.g. 1a2b3c...)"
                      className={`min-h-[80px] font-mono bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground/40 resize-y custom-scrollbar ${accent.ring}`}
                    />
                    {x963Secret && !isHex(x963Secret) && (
                      <p className="text-[10px] text-cf-red flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Must be a valid even-length hex string
                      </p>
                    )}
                    {x963Secret && isHex(x963Secret) && (
                      <p className="text-[10px] text-muted-foreground/60">
                        {x963Secret.length / 2} bytes ({x963Secret.length * 4} bits)
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      Shared Info <span className="opacity-60">(optional)</span>
                    </Label>
                    <Input
                      value={x963Info}
                      onChange={(e) => setX963Info(e.target.value)}
                      placeholder="Optional shared info string..."
                      className={`bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground/40 ${accent.ring}`}
                    />
                  </div>

                  {renderLengthSlider(x963Len, setX963Len)}

                  <Button
                    onClick={handleDeriveX963}
                    disabled={isDeriving || !x963Secret.trim() || !isHex(x963Secret)}
                    className={`w-full ${accent.bgSolid} hover:opacity-90 text-white font-medium py-5 disabled:opacity-40 disabled:cursor-not-allowed transition-all`}
                  >
                    {isDeriving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Binary className="mr-2 h-4 w-4" />
                    )}
                    Derive Key (X9.63)
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* ── Error ───────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <Card className="glass-card rounded-xl border-0 border-cf-red/30 border">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-cf-red shrink-0" />
                <p className="text-sm text-cf-red">{error}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setError('')}
                  className="ml-auto h-7 text-muted-foreground hover:text-foreground"
                >
                  Dismiss
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Result ──────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            key={result.algorithm + result.timestamp.getTime()}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.3 }}
          >
            <Card className={`glass-card rounded-xl border-0 ${accent.shadow}`}>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-2 w-2 rounded-full ${accent.bgSolid} animate-pulse`}
                    />
                    <span className={`text-sm font-medium ${accent.text}`}>
                      {result.algorithm} Result
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] border-white/10 text-muted-foreground"
                    >
                      {result.bytes} bytes · {result.bytes * 8} bits
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-[10px] border-white/10 text-muted-foreground"
                    >
                      {result.durationMs.toFixed(2)} ms
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(result.hex)}
                    className="h-8 px-2 text-muted-foreground hover:text-foreground"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-cf-green" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <div className="rounded-lg bg-black/30 p-4 border border-white/5">
                  <p className="result-display text-cf-cyan break-all">
                    {result.hex}
                  </p>
                </div>

                {/* Byte group view */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-[11px] text-muted-foreground/70 uppercase tracking-wider">
                      Byte groups
                    </Label>
                    <span className="text-[10px] text-muted-foreground/50 font-mono">
                      {result.hex.length} hex chars
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto custom-scrollbar">
                    {result.hex.match(/.{1,2}/g)?.map((byte, i) => (
                      <span
                        key={i}
                        className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] text-muted-foreground"
                      >
                        {byte}
                      </span>
                    ))}
                  </div>
                </div>

                {copied && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-cf-green text-right flex items-center justify-end gap-1"
                  >
                    <Check className="h-3 w-3" />
                    Copied {truncateMiddle(result.hex, 24)} to clipboard
                  </motion.p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Educational Note ───────────────────────────────────────────── */}
      <motion.div variants={fadeInUp}>
        <Card className="glass-card rounded-xl border-0">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-cf-green shrink-0 mt-px" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  Choosing the right KDF
                </p>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>
                    <span className="text-cf-blue font-medium">HKDF</span> — fast,
                    designed for already-high-entropy input (ECDH output, PRK).
                  </li>
                  <li>
                    <span className="text-cf-cyan font-medium">PBKDF2</span> —
                    password-based, tune iterations for cost; widely standardised.
                  </li>
                  <li>
                    <span className="text-cf-green font-medium">scrypt</span> —
                    memory-hard, resists GPU/ASIC attacks; pick N for cost/memory.
                  </li>
                  <li>
                    <span className="text-cf-amber font-medium">X9.63</span> — used
                    in ECIES and NIST SP 800-56A for deriving keys from a shared
                    secret.
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
