'use client';
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KeyRound, Copy, Check, RefreshCw, Shield, Zap, Fingerprint, Hash, Code2, Lock, Sparkles, Dices } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { generateUUID, generateRandomBytes, generateRandomToken, generateAPIKey, generatePassphrase, generateAESKey } from '@/lib/crypto';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type KeyType = 'aes' | 'rsa' | 'ecc' | 'jwt' | 'token' | 'apikey' | 'uuid' | 'passphrase' | 'hexbytes';

type CharSet = 'alphanumeric' | 'hex' | 'custom';

interface KeyTypeOption {
  id: KeyType;
  name: string;
  description: string;
  icon: React.ElementType;
  supported: boolean;
  badge?: string;
}

interface GeneratedResult {
  value: string;
  type: KeyType;
  size: string;
  entropyBits: number;
}

/* ------------------------------------------------------------------ */
/*  Key type definitions                                               */
/* ------------------------------------------------------------------ */

const KEY_TYPES: KeyTypeOption[] = [
  { id: 'aes', name: 'AES Key', description: '128/192/256 bit', icon: Lock, supported: true },
  { id: 'rsa', name: 'RSA Key Pair', description: 'Asymmetric', icon: KeyRound, supported: false, badge: 'Coming Soon' },
  { id: 'ecc', name: 'ECC Key Pair', description: 'Elliptic Curve', icon: Fingerprint, supported: false, badge: 'Coming Soon' },
  { id: 'jwt', name: 'JWT Secret', description: 'HMAC secret', icon: Shield, supported: true },
  { id: 'token', name: 'Random Token', description: 'Configurable', icon: Dices, supported: true },
  { id: 'apikey', name: 'API Key', description: 'Prefixed key', icon: Code2, supported: true },
  { id: 'uuid', name: 'UUID v4', description: 'Universally unique', icon: Hash, supported: true },
  { id: 'passphrase', name: 'Passphrase', description: 'Diceware style', icon: Sparkles, supported: true },
  { id: 'hexbytes', name: 'Hex Random Bytes', description: 'Raw hex output', icon: Zap, supported: true },
];

/* ------------------------------------------------------------------ */
/*  Entropy helpers                                                    */
/* ------------------------------------------------------------------ */

function getEntropyBits(type: KeyType, config: ConfigState): number {
  switch (type) {
    case 'aes':
      return config.aesKeySize;
    case 'rsa':
      return 2048;
    case 'ecc':
      return 256;
    case 'jwt':
      // Base64 chars: 6 bits per char
      return Math.floor(config.jwtLength * 6);
    case 'token':
      if (config.tokenCharset === 'hex') return config.tokenLength * 4;
      if (config.tokenCharset === 'alphanumeric') return Math.floor(config.tokenLength * 5.95);
      return Math.floor(config.tokenLength * Math.log2(config.customChars.length || 62));
    case 'apikey':
      // prefix + 32 random alphanumeric chars ≈ 190 bits
      return Math.floor(32 * 5.95);
    case 'uuid':
      return 122; // UUID v4 has 122 random bits
    case 'passphrase':
      // ~12.9 bits per word from 48-word list (log2(48) ≈ 5.58)
      return Math.floor(config.passphraseWordCount * Math.log2(48));
    case 'hexbytes':
      return config.hexByteCount * 8;
    default:
      return 0;
  }
}

function getEntropyStrength(entropyBits: number): { label: string; color: string; percent: number } {
  if (entropyBits >= 256) return { label: 'Excellent', color: '#10B981', percent: 100 };
  if (entropyBits >= 192) return { label: 'Very Strong', color: '#10B981', percent: 85 };
  if (entropyBits >= 128) return { label: 'Strong', color: '#06B6D4', percent: 70 };
  if (entropyBits >= 80) return { label: 'Moderate', color: '#F59E0B', percent: 50 };
  if (entropyBits >= 40) return { label: 'Weak', color: '#EF4444', percent: 30 };
  return { label: 'Very Weak', color: '#EF4444', percent: 15 };
}

/* ------------------------------------------------------------------ */
/*  Custom token generation with charset                               */
/* ------------------------------------------------------------------ */

function generateTokenWithCharset(length: number, charset: CharSet, customChars: string): string {
  if (charset === 'alphanumeric') return generateRandomToken(length);
  if (charset === 'hex') return generateRandomBytes(Math.ceil(length / 2)).slice(0, length);
  // custom charset
  const chars = customChars.length > 0 ? customChars : 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes).map(b => chars[b % chars.length]).join('');
}

/* ------------------------------------------------------------------ */
/*  Config state                                                       */
/* ------------------------------------------------------------------ */

interface ConfigState {
  aesKeySize: 128 | 192 | 256;
  jwtLength: number;
  tokenLength: number;
  tokenCharset: CharSet;
  customChars: string;
  apiPrefix: string;
  uuidQuantity: number;
  passphraseWordCount: number;
  hexByteCount: number;
}

const DEFAULT_CONFIG: ConfigState = {
  aesKeySize: 256,
  jwtLength: 64,
  tokenLength: 32,
  tokenCharset: 'alphanumeric',
  customChars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*',
  apiPrefix: 'cf',
  uuidQuantity: 1,
  passphraseWordCount: 6,
  hexByteCount: 32,
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function KeyGeneration() {
  const [selectedType, setSelectedType] = useState<KeyType>('aes');
  const [config, setConfig] = useState<ConfigState>(DEFAULT_CONFIG);
  const [results, setResults] = useState<GeneratedResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const currentKeyType = KEY_TYPES.find(k => k.id === selectedType);
  const entropyBits = getEntropyBits(selectedType, config);
  const entropyStrength = getEntropyStrength(entropyBits);

  /* ---- Generation ---- */
  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setResults([]);

    // Small delay for visual feedback
    await new Promise(r => setTimeout(r, 200));

    try {
      const newResults: GeneratedResult[] = [];

      switch (selectedType) {
        case 'aes': {
          const value = await generateAESKey(config.aesKeySize);
          newResults.push({ value, type: 'aes', size: `${config.aesKeySize}-bit`, entropyBits: config.aesKeySize });
          break;
        }
        case 'jwt': {
          const value = generateRandomToken(config.jwtLength);
          newResults.push({ value, type: 'jwt', size: `${config.jwtLength} chars`, entropyBits: getEntropyBits('jwt', config) });
          break;
        }
        case 'token': {
          const value = generateTokenWithCharset(config.tokenLength, config.tokenCharset, config.customChars);
          newResults.push({ value, type: 'token', size: `${config.tokenLength} chars`, entropyBits: getEntropyBits('token', config) });
          break;
        }
        case 'apikey': {
          const value = generateAPIKey(config.apiPrefix);
          newResults.push({ value, type: 'apikey', size: `${config.apiPrefix}_${32 + 9} chars`, entropyBits: getEntropyBits('apikey', config) });
          break;
        }
        case 'uuid': {
          for (let i = 0; i < config.uuidQuantity; i++) {
            const value = generateUUID();
            newResults.push({ value, type: 'uuid', size: 'v4', entropyBits: 122 });
          }
          break;
        }
        case 'passphrase': {
          const value = generatePassphrase(config.passphraseWordCount);
          newResults.push({ value, type: 'passphrase', size: `${config.passphraseWordCount} words`, entropyBits: getEntropyBits('passphrase', config) });
          break;
        }
        case 'hexbytes': {
          const value = generateRandomBytes(config.hexByteCount);
          newResults.push({ value, type: 'hexbytes', size: `${config.hexByteCount} bytes`, entropyBits: config.hexByteCount * 8 });
          break;
        }
      }

      setResults(newResults);
    } finally {
      setIsGenerating(false);
    }
  }, [selectedType, config]);

  /* ---- Copy ---- */
  const copyToClipboard = useCallback(async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      // fallback
    }
  }, []);

  /* ---- Type select handler ---- */
  const handleTypeSelect = useCallback((type: KeyType) => {
    if (!KEY_TYPES.find(k => k.id === type)?.supported) return;
    setSelectedType(type);
    setResults([]);
  }, []);

  /* ---- Config updater ---- */
  const updateConfig = useCallback(<K extends keyof ConfigState>(key: K, value: ConfigState[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    setResults([]);
  }, []);

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */

  return (
    <div className="space-y-6">
      {/* ---- Header ---- */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-2"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-cf-blue/10 border border-cf-blue/20">
            <KeyRound className="w-5 h-5 text-cf-blue" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground tracking-tight">Key Generation Center</h2>
            <p className="text-sm text-muted-foreground">Generate secure cryptographic keys, tokens, and identifiers</p>
          </div>
        </div>
      </motion.div>

      {/* ---- Key Type Selection ---- */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="glass-card border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Select Key Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
              {KEY_TYPES.map((kt) => {
                const Icon = kt.icon;
                const isSelected = selectedType === kt.id;
                return (
                  <motion.button
                    key={kt.id}
                    whileHover={kt.supported ? { scale: 1.03 } : {}}
                    whileTap={kt.supported ? { scale: 0.97 } : {}}
                    onClick={() => handleTypeSelect(kt.id)}
                    disabled={!kt.supported}
                    className={`
                      relative flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl text-center transition-all duration-200
                      ${!kt.supported
                        ? 'bg-white/[0.02] border border-white/[0.04] cursor-not-allowed opacity-50'
                        : isSelected
                          ? 'bg-cf-blue/15 border border-cf-blue/30 shadow-lg shadow-cf-blue/10'
                          : 'bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.1] cursor-pointer'
                      }
                    `}
                  >
                    <Icon className={`w-4 h-4 ${isSelected && kt.supported ? 'text-cf-blue' : kt.supported ? 'text-muted-foreground' : 'text-muted-foreground/40'}`} />
                    <span className={`text-xs font-medium leading-tight ${isSelected && kt.supported ? 'text-cf-blue' : kt.supported ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                      {kt.name}
                    </span>
                    {kt.badge && (
                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 bg-cf-cyan/10 text-cf-cyan border-cf-cyan/20">
                        {kt.badge}
                      </Badge>
                    )}
                    {isSelected && kt.supported && (
                      <motion.div
                        layoutId="keytype-indicator"
                        className="absolute -bottom-px left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-cf-blue"
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ---- Configuration Panel ---- */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="glass-card border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              {/* AES Config */}
              {selectedType === 'aes' && (
                <motion.div key="aes-config" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">Key Size</Label>
                    <div className="flex gap-2">
                      {([128, 192, 256] as const).map(size => (
                        <button
                          key={size}
                          onClick={() => updateConfig('aesKeySize', size)}
                          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                            config.aesKeySize === size
                              ? 'bg-cf-blue/15 text-cf-blue border border-cf-blue/30 shadow-lg shadow-cf-blue/10'
                              : 'bg-white/[0.03] text-muted-foreground border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.1]'
                          }`}
                        >
                          {size}-bit
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-muted-foreground/60">
                      {config.aesKeySize === 128 ? 'Standard encryption — fast and widely supported' :
                       config.aesKeySize === 192 ? 'Enhanced security — government-grade protection' :
                       'Maximum security — AES-256 is NSA-approved for TOP SECRET data'}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* JWT Config */}
              {selectedType === 'jwt' && (
                <motion.div key="jwt-config" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }} className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium text-muted-foreground">Secret Length</Label>
                      <span className="text-sm font-mono text-cf-blue">{config.jwtLength} chars</span>
                    </div>
                    <Slider
                      value={[config.jwtLength]}
                      onValueChange={([v]) => updateConfig('jwtLength', v)}
                      min={32}
                      max={256}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground/50">
                      <span>32</span>
                      <span>256</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground/60">
                      {config.jwtLength < 64 ? 'Minimum length — consider using 64+ chars for production' :
                       config.jwtLength < 128 ? 'Good length — suitable for most applications' :
                       'Excellent length — very high entropy secret'}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Token Config */}
              {selectedType === 'token' && (
                <motion.div key="token-config" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }} className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium text-muted-foreground">Token Length</Label>
                      <span className="text-sm font-mono text-cf-blue">{config.tokenLength} chars</span>
                    </div>
                    <Slider
                      value={[config.tokenLength]}
                      onValueChange={([v]) => updateConfig('tokenLength', v)}
                      min={8}
                      max={128}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground/50">
                      <span>8</span>
                      <span>128</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">Character Set</Label>
                    <div className="flex gap-2">
                      {(['alphanumeric', 'hex', 'custom'] as const).map(cs => (
                        <button
                          key={cs}
                          onClick={() => updateConfig('tokenCharset', cs)}
                          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-200 capitalize ${
                            config.tokenCharset === cs
                              ? 'bg-cf-blue/15 text-cf-blue border border-cf-blue/30'
                              : 'bg-white/[0.03] text-muted-foreground border border-white/[0.06] hover:bg-white/[0.06]'
                          }`}
                        >
                          {cs}
                        </button>
                      ))}
                    </div>
                  </div>
                  {config.tokenCharset === 'custom' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground">Custom Characters</Label>
                      <Input
                        value={config.customChars}
                        onChange={(e) => updateConfig('customChars', e.target.value)}
                        placeholder="Enter custom character set..."
                        className="bg-white/[0.03] border-white/[0.08] focus:border-cf-blue/40 focus:ring-cf-blue/20 text-foreground placeholder:text-muted-foreground/50 font-mono text-sm"
                      />
                      <p className="text-[11px] text-muted-foreground/60">
                        {config.customChars.length} unique characters ≈ {Math.floor(Math.log2(config.customChars.length || 1) * 100) / 100} bits per char
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* API Key Config */}
              {selectedType === 'apikey' && (
                <motion.div key="apikey-config" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">Key Prefix</Label>
                    <Input
                      value={config.apiPrefix}
                      onChange={(e) => updateConfig('apiPrefix', e.target.value.replace(/\s/g, ''))}
                      placeholder="e.g. cf"
                      className="bg-white/[0.03] border-white/[0.08] focus:border-cf-blue/40 focus:ring-cf-blue/20 text-foreground placeholder:text-muted-foreground/50 font-mono text-sm max-w-[200px]"
                    />
                    <p className="text-[11px] text-muted-foreground/60">
                      Format: <span className="font-mono text-cf-cyan">{config.apiPrefix || 'cf'}_XXXXXXXX_XXXXXXXXXXXXXXXXXXXXXXXX</span>
                    </p>
                  </div>
                </motion.div>
              )}

              {/* UUID Config */}
              {selectedType === 'uuid' && (
                <motion.div key="uuid-config" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }} className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium text-muted-foreground">Quantity</Label>
                      <span className="text-sm font-mono text-cf-blue">{config.uuidQuantity}</span>
                    </div>
                    <Slider
                      value={[config.uuidQuantity]}
                      onValueChange={([v]) => updateConfig('uuidQuantity', v)}
                      min={1}
                      max={10}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground/50">
                      <span>1</span>
                      <span>10</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground/60">
                      Generate up to 10 UUIDs at once for batch operations
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Passphrase Config */}
              {selectedType === 'passphrase' && (
                <motion.div key="passphrase-config" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }} className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium text-muted-foreground">Word Count</Label>
                      <span className="text-sm font-mono text-cf-blue">{config.passphraseWordCount} words</span>
                    </div>
                    <Slider
                      value={[config.passphraseWordCount]}
                      onValueChange={([v]) => updateConfig('passphraseWordCount', v)}
                      min={4}
                      max={12}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground/50">
                      <span>4</span>
                      <span>12</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground/60">
                      {config.passphraseWordCount < 6 ? 'Minimum — consider 6+ words for better security' :
                       config.passphraseWordCount < 8 ? 'Good — suitable for most password requirements' :
                       'Excellent — very high entropy passphrase'}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Hex Bytes Config */}
              {selectedType === 'hexbytes' && (
                <motion.div key="hexbytes-config" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }} className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium text-muted-foreground">Byte Count</Label>
                      <span className="text-sm font-mono text-cf-blue">{config.hexByteCount} bytes ({config.hexByteCount * 2} hex chars)</span>
                    </div>
                    <Slider
                      value={[config.hexByteCount]}
                      onValueChange={([v]) => updateConfig('hexByteCount', v)}
                      min={16}
                      max={256}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground/50">
                      <span>16 bytes</span>
                      <span>256 bytes</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground/60">
                      {config.hexByteCount < 32 ? 'Short — suitable for nonces and IVs' :
                       config.hexByteCount < 64 ? 'Standard — suitable for keys and seeds' :
                       'Extended — suitable for key material and large random data'}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {/* ---- Entropy Visualizer ---- */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
      >
        <Card className="glass-card border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Entropy Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Entropy bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Entropy Strength</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold" style={{ color: entropyStrength.color }}>
                    {entropyStrength.label}
                  </span>
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 h-5 border"
                    style={{ backgroundColor: `${entropyStrength.color}15`, color: entropyStrength.color, borderColor: `${entropyStrength.color}30` }}
                  >
                    {entropyBits} bits
                  </Badge>
                </div>
              </div>
              <div className="relative h-2.5 rounded-full bg-white/[0.04] overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${entropyStrength.percent}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  style={{
                    background: `linear-gradient(90deg, ${entropyStrength.color}88, ${entropyStrength.color})`,
                    boxShadow: `0 0 12px ${entropyStrength.color}40`,
                  }}
                />
              </div>
            </div>

            {/* Entropy details */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Entropy</p>
                <p className="text-sm font-semibold text-foreground">{entropyBits} bits</p>
              </div>
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Strength</p>
                <p className="text-sm font-semibold" style={{ color: entropyStrength.color }}>{entropyStrength.label}</p>
              </div>
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Type</p>
                <p className="text-sm font-semibold text-foreground">{currentKeyType?.name}</p>
              </div>
            </div>

            {/* Entropy comparison */}
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground/60">
              <Shield className="w-3.5 h-3.5" />
              <span>
                {entropyBits >= 128
                  ? 'This key provides sufficient entropy for cryptographic use'
                  : 'Consider increasing key size for better security'}
                {' — '}
                <span className="text-cf-cyan">NIST recommends ≥128 bits</span>
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ---- Generate Button ---- */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !currentKeyType?.supported}
          className="w-full h-12 bg-cf-blue hover:bg-cf-blue/90 text-white font-semibold text-sm rounded-xl shadow-lg shadow-cf-blue/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {isGenerating ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <RefreshCw className="w-5 h-5 mr-2" />
            </motion.div>
          ) : (
            <KeyRound className="w-5 h-5 mr-2" />
          )}
          {isGenerating ? 'Generating...' : `Generate ${currentKeyType?.name || 'Key'}`}
        </Button>
      </motion.div>

      {/* ---- Results Section ---- */}
      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="glass-card border-0">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Shield className="w-4 h-4 text-cf-green" />
                    Generated {currentKeyType?.name}
                  </CardTitle>
                  {results.length === 1 && (
                    <Button
                      onClick={() => copyToClipboard(results[0].value, 0)}
                      variant="outline"
                      size="sm"
                      className="border-cf-cyan/20 bg-cf-cyan/5 hover:bg-cf-cyan/15 text-cf-cyan hover:text-cf-cyan h-7 text-xs"
                    >
                      {copiedIndex === 0 ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                      {copiedIndex === 0 ? 'Copied!' : 'Copy'}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {results.length === 1 ? (
                  /* Single result display */
                  <div className="space-y-4">
                    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 max-h-48 overflow-y-auto custom-scrollbar">
                      <p className="result-display text-cf-cyan break-all select-all">
                        {results[0].value}
                      </p>
                    </div>

                    {/* Key metadata */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-3">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Type</p>
                        <p className="text-xs font-semibold text-foreground">{currentKeyType?.name}</p>
                      </div>
                      <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-3">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Size</p>
                        <p className="text-xs font-semibold text-foreground">{results[0].size}</p>
                      </div>
                      <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-3">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Entropy</p>
                        <p className="text-xs font-semibold text-foreground">{results[0].entropyBits} bits</p>
                      </div>
                      <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-3">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Chars</p>
                        <p className="text-xs font-semibold text-foreground">{results[0].value.length}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Multiple results (UUID batch) */
                  <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                    {results.map((result, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: idx * 0.05 }}
                        className="flex items-center gap-2 bg-white/[0.02] border border-white/[0.06] rounded-lg p-3 group"
                      >
                        <span className="text-[10px] text-muted-foreground/50 font-mono w-6 shrink-0">{idx + 1}.</span>
                        <p className="result-display text-cf-cyan break-all flex-1 select-all text-sm">
                          {result.value}
                        </p>
                        <button
                          onClick={() => copyToClipboard(result.value, idx)}
                          className="shrink-0 p-1.5 rounded-md hover:bg-white/[0.06] transition-colors text-muted-foreground hover:text-cf-cyan"
                        >
                          {copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-cf-green" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Regenerate prompt */}
                <div className="flex items-center justify-center gap-2 pt-2">
                  <Button
                    onClick={handleGenerate}
                    variant="outline"
                    size="sm"
                    className="border-cf-blue/20 bg-cf-blue/5 hover:bg-cf-blue/15 text-cf-blue hover:text-cf-blue h-8 text-xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                    Regenerate
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
