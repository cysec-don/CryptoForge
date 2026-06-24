'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Shield, Copy, Check, RefreshCw, Eye, EyeOff, CheckCircle2, XCircle, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { computeHMAC, generateRandomBytes } from '@/lib/crypto';

// ─── Types ────────────────────────────────────────────────────────────────────

type HMACAlgorithm = 'HMAC-MD5' | 'HMAC-SHA1' | 'HMAC-SHA256' | 'HMAC-SHA384' | 'HMAC-SHA512' | 'HMAC-SHA224' | 'HMAC-RIPEMD160';
type Mode = 'generate' | 'verify';

interface HMACAlgorithmInfo {
  name: HMACAlgorithm;
  outputSize: number;
  security: 'broken' | 'weak' | 'moderate' | 'strong' | 'very-strong';
}

// ─── Constants ────────────────────────────────────────────────────────────────

const HMAC_ALGORITHMS: HMACAlgorithmInfo[] = [
  { name: 'HMAC-MD5', outputSize: 128, security: 'broken' },
  { name: 'HMAC-SHA1', outputSize: 160, security: 'broken' },
  { name: 'HMAC-SHA224', outputSize: 224, security: 'strong' },
  { name: 'HMAC-SHA256', outputSize: 256, security: 'strong' },
  { name: 'HMAC-SHA384', outputSize: 384, security: 'very-strong' },
  { name: 'HMAC-SHA512', outputSize: 512, security: 'very-strong' },
  { name: 'HMAC-RIPEMD160', outputSize: 160, security: 'moderate' },
];

const SECURITY_BADGE: Record<string, { label: string; color: string; bgColor: string }> = {
  broken: { label: 'Broken', color: 'text-red-400', bgColor: 'bg-red-500/10 border-red-500/20' },
  weak: { label: 'Weak', color: 'text-amber-400', bgColor: 'bg-amber-500/10 border-amber-500/20' },
  moderate: { label: 'Moderate', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10 border-yellow-500/20' },
  strong: { label: 'Strong', color: 'text-green-400', bgColor: 'bg-green-500/10 border-green-500/20' },
  'very-strong': { label: 'Very Strong', color: 'text-cyan-400', bgColor: 'bg-cyan-500/10 border-cyan-500/20' },
};

const KEY_PRESETS = [
  { label: '128-bit', bits: 128 },
  { label: '256-bit', bits: 256 },
  { label: '512-bit', bits: 512 },
];

// ─── Animation Variants ──────────────────────────────────────────────────────

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function HMACModule() {
  // Generate mode state
  const [algorithm, setAlgorithm] = useState<HMACAlgorithm>('HMAC-SHA256');
  const [secretKey, setSecretKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [message, setMessage] = useState('');
  const [generatedHMAC, setGeneratedHMAC] = useState('');
  const [copied, setCopied] = useState(false);

  // Verify mode state
  const [verifyAlgorithm, setVerifyAlgorithm] = useState<HMACAlgorithm>('HMAC-SHA256');
  const [verifyKey, setVerifyKey] = useState('');
  const [showVerifyKey, setShowVerifyKey] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState('');
  const [expectedHMAC, setExpectedHMAC] = useState('');
  const [verifyResult, setVerifyResult] = useState<'match' | 'mismatch' | null>(null);
  const [computedVerifyHMAC, setComputedVerifyHMAC] = useState('');

  // Mode state
  const [mode, setMode] = useState<Mode>('generate');

  // ─── Handlers ────────────────────────────────────────────────────────────

  const handleGenerateKey = useCallback((bits: number) => {
    const bytes = bits / 8;
    const key = generateRandomBytes(bytes);
    setSecretKey(key);
  }, []);

  const handleGenerateVerifyKey = useCallback((bits: number) => {
    const bytes = bits / 8;
    const key = generateRandomBytes(bytes);
    setVerifyKey(key);
  }, []);

  const handleGenerateHMAC = useCallback(() => {
    if (!message.trim() || !secretKey.trim()) return;
    const result = computeHMAC(algorithm, message, secretKey);
    setGeneratedHMAC(result);
  }, [algorithm, message, secretKey]);

  const handleVerifyHMAC = useCallback(() => {
    if (!verifyMessage.trim() || !verifyKey.trim() || !expectedHMAC.trim()) return;
    const computed = computeHMAC(verifyAlgorithm, verifyMessage, verifyKey);
    setComputedVerifyHMAC(computed);
    const match = computed.toLowerCase() === expectedHMAC.toLowerCase();
    setVerifyResult(match ? 'match' : 'mismatch');
  }, [verifyAlgorithm, verifyMessage, verifyKey, expectedHMAC]);

  const handleCopy = useCallback(async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const handleModeChange = useCallback((newMode: string) => {
    setMode(newMode as Mode);
    setVerifyResult(null);
    setComputedVerifyHMAC('');
  }, []);

  // ─── Helpers ─────────────────────────────────────────────────────────────

  const getAlgorithmInfo = (algo: HMACAlgorithm) =>
    HMAC_ALGORITHMS.find(a => a.name === algo);

  const maskKey = (key: string) => {
    if (key.length <= 8) return '•'.repeat(key.length);
    return key.slice(0, 4) + '•'.repeat(Math.min(key.length - 8, 16)) + key.slice(-4);
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <motion.div
      variants={stagger}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <motion.div variants={fadeInUp} className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cf-blue/10 border border-cf-blue/20">
          <Shield className="h-6 w-6 text-cf-blue" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">HMAC Generator</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate and verify Hash-based Message Authentication Codes
          </p>
        </div>
      </motion.div>

      {/* ── Mode Tabs ──────────────────────────────────────────────────── */}
      <motion.div variants={fadeInUp}>
        <Tabs value={mode} onValueChange={handleModeChange} className="space-y-6">
          <TabsList className="glass-card rounded-lg p-1 h-auto">
            <TabsTrigger
              value="generate"
              className="data-[state=active]:bg-cf-blue/20 data-[state=active]:text-cf-blue px-6 py-2.5 rounded-md text-sm font-medium transition-all"
            >
              <KeyRound className="mr-2 h-4 w-4" />
              Generate
            </TabsTrigger>
            <TabsTrigger
              value="verify"
              className="data-[state=active]:bg-cf-cyan/20 data-[state=active]:text-cf-cyan px-6 py-2.5 rounded-md text-sm font-medium transition-all"
            >
              <Shield className="mr-2 h-4 w-4" />
              Verify
            </TabsTrigger>
          </TabsList>

          {/* ── Generate Mode ─────────────────────────────────────────── */}
          <TabsContent value="generate" className="space-y-4 mt-0">
            {/* Algorithm Selector */}
            <motion.div variants={fadeInUp}>
              <Card className="glass-card rounded-xl border-0">
                <CardContent className="p-6 space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Algorithm
                    </label>
                    <div className="flex flex-wrap items-center gap-3">
                      <Select
                        value={algorithm}
                        onValueChange={(v) => setAlgorithm(v as HMACAlgorithm)}
                      >
                        <SelectTrigger className="w-[220px] bg-white/5 border-white/10 text-white hover:bg-white/8 transition-colors">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1a2e] border-white/10">
                          {HMAC_ALGORITHMS.map((algo) => (
                            <SelectItem
                              key={algo.name}
                              value={algo.name}
                              className="text-white focus:bg-white/10 focus:text-white"
                            >
                              {algo.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {(() => {
                        const info = getAlgorithmInfo(algorithm);
                        if (!info) return null;
                        const badge = SECURITY_BADGE[info.security];
                        return (
                          <Badge
                            variant="outline"
                            className={`${badge.bgColor} ${badge.color} border text-xs`}
                          >
                            {info.outputSize}-bit · {badge.label}
                          </Badge>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Secret Key */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Secret Key
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          type={showKey ? 'text' : 'password'}
                          value={secretKey}
                          onChange={(e) => setSecretKey(e.target.value)}
                          placeholder="Enter secret key or generate one below"
                          className="pr-10 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-cf-blue/50 focus:ring-cf-blue/20"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setShowKey(!showKey)}
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-white"
                        >
                          {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleGenerateKey(256)}
                        className="shrink-0 bg-white/5 border-white/10 text-muted-foreground hover:text-cf-blue hover:border-cf-blue/30"
                        title="Generate random 256-bit key"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Quick Key Generation */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      <span className="text-xs text-white/30 self-center mr-1">Quick gen:</span>
                      {KEY_PRESETS.map((preset) => (
                        <Button
                          key={preset.bits}
                          variant="outline"
                          size="sm"
                          onClick={() => handleGenerateKey(preset.bits)}
                          className="h-7 px-2.5 text-xs bg-white/5 border-white/10 text-white/50 hover:text-cf-blue hover:border-cf-blue/30 hover:bg-cf-blue/5"
                        >
                          <KeyRound className="mr-1 h-3 w-3" />
                          {preset.label}
                        </Button>
                      ))}
                    </div>

                    {/* Key Preview */}
                    {secretKey && !showKey && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs text-white/30 font-mono"
                      >
                        {maskKey(secretKey)}
                      </motion.p>
                    )}
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Message
                    </label>
                    <Textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Enter the message to authenticate..."
                      className="min-h-[100px] bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-cf-blue/50 focus:ring-cf-blue/20 resize-y custom-scrollbar"
                    />
                  </div>

                  {/* Generate Button */}
                  <Button
                    onClick={handleGenerateHMAC}
                    disabled={!message.trim() || !secretKey.trim()}
                    className="w-full bg-cf-blue hover:bg-cf-blue/90 text-white font-medium py-5 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Generate HMAC
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Result */}
            {generatedHMAC && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="glass-card rounded-xl border-0 glow-blue">
                  <CardContent className="p-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-cf-blue animate-pulse" />
                        <span className="text-sm font-medium text-cf-blue">
                          {algorithm} Result
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(generatedHMAC)}
                        className="h-8 px-2 text-muted-foreground hover:text-white"
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
                        {generatedHMAC}
                      </p>
                    </div>
                    {copied && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-cf-green text-right"
                      >
                        Copied to clipboard!
                      </motion.p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </TabsContent>

          {/* ── Verify Mode ───────────────────────────────────────────── */}
          <TabsContent value="verify" className="space-y-4 mt-0">
            {/* Algorithm Selector */}
            <motion.div variants={fadeInUp}>
              <Card className="glass-card rounded-xl border-0">
                <CardContent className="p-6 space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Algorithm
                    </label>
                    <div className="flex flex-wrap items-center gap-3">
                      <Select
                        value={verifyAlgorithm}
                        onValueChange={(v) => {
                          setVerifyAlgorithm(v as HMACAlgorithm);
                          setVerifyResult(null);
                          setComputedVerifyHMAC('');
                        }}
                      >
                        <SelectTrigger className="w-[220px] bg-white/5 border-white/10 text-white hover:bg-white/8 transition-colors">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1a2e] border-white/10">
                          {HMAC_ALGORITHMS.map((algo) => (
                            <SelectItem
                              key={algo.name}
                              value={algo.name}
                              className="text-white focus:bg-white/10 focus:text-white"
                            >
                              {algo.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {(() => {
                        const info = getAlgorithmInfo(verifyAlgorithm);
                        if (!info) return null;
                        const badge = SECURITY_BADGE[info.security];
                        return (
                          <Badge
                            variant="outline"
                            className={`${badge.bgColor} ${badge.color} border text-xs`}
                          >
                            {info.outputSize}-bit · {badge.label}
                          </Badge>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Secret Key */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Secret Key
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          type={showVerifyKey ? 'text' : 'password'}
                          value={verifyKey}
                          onChange={(e) => {
                            setVerifyKey(e.target.value);
                            setVerifyResult(null);
                          }}
                          placeholder="Enter the secret key"
                          className="pr-10 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-cf-cyan/50 focus:ring-cf-cyan/20"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setShowVerifyKey(!showVerifyKey)}
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-white"
                        >
                          {showVerifyKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleGenerateVerifyKey(256)}
                        className="shrink-0 bg-white/5 border-white/10 text-muted-foreground hover:text-cf-cyan hover:border-cf-cyan/30"
                        title="Generate random 256-bit key"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Quick Key Generation */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      <span className="text-xs text-white/30 self-center mr-1">Quick gen:</span>
                      {KEY_PRESETS.map((preset) => (
                        <Button
                          key={preset.bits}
                          variant="outline"
                          size="sm"
                          onClick={() => handleGenerateVerifyKey(preset.bits)}
                          className="h-7 px-2.5 text-xs bg-white/5 border-white/10 text-white/50 hover:text-cf-cyan hover:border-cf-cyan/30 hover:bg-cf-cyan/5"
                        >
                          <KeyRound className="mr-1 h-3 w-3" />
                          {preset.label}
                        </Button>
                      ))}
                    </div>

                    {verifyKey && !showVerifyKey && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs text-white/30 font-mono"
                      >
                        {maskKey(verifyKey)}
                      </motion.p>
                    )}
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Message
                    </label>
                    <Textarea
                      value={verifyMessage}
                      onChange={(e) => {
                        setVerifyMessage(e.target.value);
                        setVerifyResult(null);
                      }}
                      placeholder="Enter the message to verify..."
                      className="min-h-[80px] bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-cf-cyan/50 focus:ring-cf-cyan/20 resize-y custom-scrollbar"
                    />
                  </div>

                  {/* Expected HMAC */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Expected HMAC
                    </label>
                    <Input
                      value={expectedHMAC}
                      onChange={(e) => {
                        setExpectedHMAC(e.target.value);
                        setVerifyResult(null);
                      }}
                      placeholder="Paste the expected HMAC value"
                      className="bg-white/5 border-white/10 text-white font-mono text-sm placeholder:text-white/25 focus:border-cf-cyan/50 focus:ring-cf-cyan/20"
                    />
                  </div>

                  {/* Verify Button */}
                  <Button
                    onClick={handleVerifyHMAC}
                    disabled={!verifyMessage.trim() || !verifyKey.trim() || !expectedHMAC.trim()}
                    className="w-full bg-cf-cyan hover:bg-cf-cyan/90 text-white font-medium py-5 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Verify HMAC
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Verification Result */}
            {verifyResult && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Card className={`glass-card rounded-xl border-0 ${
                  verifyResult === 'match' ? 'glow-cyan' : ''
                }`}>
                  <CardContent className="p-6 space-y-4">
                    {/* Match/Mismatch Indicator */}
                    <div className="flex items-center gap-3">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      >
                        {verifyResult === 'match' ? (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cf-green/20 border border-cf-green/30">
                            <CheckCircle2 className="h-5 w-5 text-cf-green" />
                          </div>
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cf-red/20 border border-cf-red/30">
                            <XCircle className="h-5 w-5 text-cf-red" />
                          </div>
                        )}
                      </motion.div>
                      <div>
                        <p className={`font-semibold ${
                          verifyResult === 'match' ? 'text-cf-green' : 'text-cf-red'
                        }`}>
                          {verifyResult === 'match' ? 'HMAC Verified Successfully' : 'HMAC Verification Failed'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {verifyResult === 'match'
                            ? 'The computed HMAC matches the expected value'
                            : 'The computed HMAC does not match the expected value'}
                        </p>
                      </div>
                    </div>

                    {/* Side-by-side Comparison */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Computed HMAC */}
                      <div className="rounded-lg bg-black/30 p-3 border border-white/5">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-muted-foreground">
                            Computed
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopy(computedVerifyHMAC)}
                            className="h-6 px-1.5 text-muted-foreground hover:text-white"
                          >
                            {copied ? (
                              <Check className="h-3 w-3 text-cf-green" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                        <p className="result-display text-cf-cyan break-all text-xs">
                          {computedVerifyHMAC}
                        </p>
                      </div>

                      {/* Expected HMAC */}
                      <div className="rounded-lg bg-black/30 p-3 border border-white/5">
                        <span className="text-xs font-medium text-muted-foreground block mb-2">
                          Expected
                        </span>
                        <p className={`result-display break-all text-xs ${
                          verifyResult === 'match' ? 'text-cf-green' : 'text-cf-red'
                        }`}>
                          {expectedHMAC}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
