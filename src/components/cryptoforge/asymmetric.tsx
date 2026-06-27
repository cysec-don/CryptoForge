'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, KeyRound, Copy, Check, RefreshCw, AlertCircle,
  CheckCircle2, XCircle, Lock, Unlock, Zap, Fingerprint,
  FileSignature, ArrowLeftRight, ArrowRight, Loader2,
  Eye, EyeOff, Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  generateEd25519KeyPair, signEd25519, verifyEd25519,
  generateX25519KeyPair, computeX25519SharedSecret,
  generateSecp256k1KeyPair, signECDSA, verifyECDSA,
  generateRSAKeyPair, signRSA, verifyRSA, rsaOaepEncrypt, rsaOaepDecrypt,
} from '@/lib/crypto';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type AlgorithmTab = 'ed25519' | 'x25519' | 'ecdsa' | 'rsa';
type ECDSACurve = 'secp256k1' | 'P-256' | 'P-384' | 'P-521';
type RSAKeySize = '1024' | '2048' | '3072' | '4096';
type RSASubTab = 'sign-verify' | 'encrypt-decrypt';
type VerifyState = 'valid' | 'invalid' | null;

interface KeyPair {
  publicKey: string;
  privateKey: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const ALGORITHM_TABS: {
  id: AlgorithmTab;
  name: string;
  description: string;
  icon: React.ElementType;
  accent: string;
}[] = [
  { id: 'ed25519', name: 'Ed25519', description: 'EdDSA Signing', icon: FileSignature, accent: 'cf-blue' },
  { id: 'x25519', name: 'X25519', description: 'ECDH Key Exchange', icon: ArrowLeftRight, accent: 'cf-cyan' },
  { id: 'ecdsa', name: 'ECDSA', description: 'Elliptic Curve Signatures', icon: Fingerprint, accent: 'cf-green' },
  { id: 'rsa', name: 'RSA', description: 'Sign, Verify, Encrypt, Decrypt', icon: KeyRound, accent: 'cf-amber' },
];

const ECDSA_CURVES: { id: ECDSACurve; name: string; bits: number }[] = [
  { id: 'secp256k1', name: 'secp256k1', bits: 256 },
  { id: 'P-256', name: 'P-256 (NIST)', bits: 256 },
  { id: 'P-384', name: 'P-384 (NIST)', bits: 384 },
  { id: 'P-521', name: 'P-521 (NIST)', bits: 521 },
];

const RSA_KEY_SIZES: { id: RSAKeySize; name: string; note: string }[] = [
  { id: '1024', name: '1024-bit', note: 'Legacy / weak' },
  { id: '2048', name: '2048-bit', note: 'Recommended' },
  { id: '3072', name: '3072-bit', note: 'Strong' },
  { id: '4096', name: '4096-bit', note: 'Very strong · slow' },
];

/* ------------------------------------------------------------------ */
/*  Animation Variants                                                 */
/* ------------------------------------------------------------------ */

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
};

/* ------------------------------------------------------------------ */
/*  Helper Components                                                  */
/* ------------------------------------------------------------------ */

function CopyIconButton({
  value,
  className = '',
}: {
  value: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* noop */
    }
  }, [value]);
  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={!value}
      aria-label="Copy to clipboard"
      className={`text-muted-foreground hover:text-cf-cyan transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.span key="check" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}>
            <Check className="w-4 h-4 text-cf-green" />
          </motion.span>
        ) : (
          <motion.span key="copy" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}>
            <Copy className="w-4 h-4" />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

function KeyField({
  label,
  value,
  accent,
  placeholder,
  mono = true,
  onCopy,
}: {
  label: string;
  value: string;
  accent: 'cf-blue' | 'cf-cyan' | 'cf-green' | 'cf-amber' | 'cf-red';
  placeholder?: string;
  mono?: boolean;
  onCopy?: () => void;
}) {
  const accentColor: Record<string, string> = {
    'cf-blue': 'text-cf-blue',
    'cf-cyan': 'text-cf-cyan',
    'cf-green': 'text-cf-green',
    'cf-amber': 'text-cf-amber',
    'cf-red': 'text-cf-red',
  };
  const accentBg: Record<string, string> = {
    'cf-blue': 'bg-cf-blue/5 border-cf-blue/15',
    'cf-cyan': 'bg-cf-cyan/5 border-cf-cyan/15',
    'cf-green': 'bg-cf-green/5 border-cf-green/15',
    'cf-amber': 'bg-cf-amber/5 border-cf-amber/15',
    'cf-red': 'bg-cf-red/5 border-cf-red/15',
  };
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className={`text-xs font-semibold uppercase tracking-wider ${accentColor[accent]}`}>
          {label}
        </Label>
        {value && (
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(value).then(() => {
                onCopy?.();
              });
            }}
            className="text-[10px] text-muted-foreground hover:text-cf-cyan transition-colors flex items-center gap-1"
          >
            <Copy className="w-3 h-3" />
            <span>Copy</span>
          </button>
        )}
      </div>
      <div
        className={`min-h-[44px] max-h-32 overflow-y-auto custom-scrollbar rounded-lg border px-3 py-2 ${accentBg[accent]} ${mono ? 'font-mono text-xs' : 'text-xs'}`}
      >
        {value ? (
          <p className="text-foreground/90 break-all leading-relaxed">{value}</p>
        ) : (
          <p className="text-muted-foreground/40 italic">{placeholder || '—'}</p>
        )}
      </div>
    </div>
  );
}

function VerifyResultBanner({ result, label }: { result: VerifyState; label?: string }) {
  if (result === null) return null;
  const isValid = result === 'valid';
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={`rounded-lg border px-4 py-3 flex items-center gap-3 ${
        isValid
          ? 'bg-cf-green/[0.06] border-cf-green/25'
          : 'bg-cf-red/[0.06] border-cf-red/25'
      }`}
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
          isValid ? 'bg-cf-green/15 text-cf-green' : 'bg-cf-red/15 text-cf-red'
        }`}
      >
        {isValid ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
      </div>
      <div>
        <p className={`text-sm font-semibold ${isValid ? 'text-cf-green' : 'text-cf-red'}`}>
          {isValid ? 'Signature Verified' : 'Verification Failed'}
        </p>
        <p className="text-xs text-muted-foreground">
          {label || (isValid ? 'The signature is valid for the given message and public key.' : 'The signature does not match the message or public key.')}
        </p>
      </div>
    </motion.div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="rounded-lg border border-cf-red/25 bg-cf-red/[0.06] px-4 py-3 flex items-start gap-3"
    >
      <AlertCircle className="w-4 h-4 text-cf-red shrink-0 mt-0.5" />
      <p className="text-xs text-cf-red">{message}</p>
    </motion.div>
  );
}

function SectionTitle({
  icon: Icon,
  title,
  subtitle,
  accent = 'cf-blue',
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  accent?: 'cf-blue' | 'cf-cyan' | 'cf-green' | 'cf-amber' | 'cf-red';
}) {
  const accentColor: Record<string, string> = {
    'cf-blue': 'text-cf-blue',
    'cf-cyan': 'text-cf-cyan',
    'cf-green': 'text-cf-green',
    'cf-amber': 'text-cf-amber',
    'cf-red': 'text-cf-red',
  };
  const accentBg: Record<string, string> = {
    'cf-blue': 'bg-cf-blue/10 border-cf-blue/20',
    'cf-cyan': 'bg-cf-cyan/10 border-cf-cyan/20',
    'cf-green': 'bg-cf-green/10 border-cf-green/20',
    'cf-amber': 'bg-cf-amber/10 border-cf-amber/20',
    'cf-red': 'bg-cf-red/10 border-cf-red/20',
  };
  return (
    <div className="flex items-center gap-3">
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg border ${accentBg[accent]}`}>
        <Icon className={`w-4.5 h-4.5 ${accentColor[accent]}`} />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Ed25519 Tab                                                        */
/* ------------------------------------------------------------------ */

function Ed25519Tab() {
  const [keyPair, setKeyPair] = useState<KeyPair | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState('Hello, Ed25519!');
  const [signature, setSignature] = useState('');
  const [isSigning, setIsSigning] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState('');
  const [verifySignature, setVerifySignature] = useState('');
  const [verifyPublicKey, setVerifyPublicKey] = useState('');
  const [verifyResult, setVerifyResult] = useState<VerifyState>(null);
  const [error, setError] = useState('');

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setError('');
    try {
      const kp = await generateEd25519KeyPair();
      setKeyPair(kp);
      setVerifyPublicKey(kp.publicKey);
      setVerifyMessage(message);
      setSignature('');
      setVerifyResult(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate key pair');
    } finally {
      setIsGenerating(false);
    }
  }, [message]);

  const handleSign = useCallback(() => {
    if (!keyPair) {
      setError('Please generate a key pair first');
      return;
    }
    if (!message.trim()) {
      setError('Please enter a message to sign');
      return;
    }
    setError('');
    try {
      const sig = signEd25519(message, keyPair.privateKey);
      setSignature(sig);
      setVerifySignature(sig);
      setVerifyMessage(message);
      setVerifyResult(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Signing failed');
    }
  }, [keyPair, message]);

  const handleVerify = useCallback(() => {
    if (!verifyMessage.trim() || !verifySignature.trim() || !verifyPublicKey.trim()) {
      setError('Please fill in all fields to verify');
      return;
    }
    setError('');
    try {
      const ok = verifyEd25519(verifyMessage, verifySignature, verifyPublicKey);
      setVerifyResult(ok ? 'valid' : 'invalid');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Verification failed');
      setVerifyResult('invalid');
    }
  }, [verifyMessage, verifySignature, verifyPublicKey]);

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-5">
      {/* Generate */}
      <motion.div variants={fadeInUp}>
        <Card className="glass-card border-0">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <SectionTitle
                icon={KeyRound}
                title="Ed25519 Key Pair"
                subtitle="EdDSA · 128-bit security · 64-byte signatures"
                accent="cf-blue"
              />
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="bg-cf-blue hover:bg-cf-blue/90 text-white shadow-lg shadow-cf-blue/20 shrink-0"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                {isGenerating ? 'Generating...' : 'Generate Key Pair'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {keyPair ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <KeyField
                  label="Public Key (hex)"
                  value={keyPair.publicKey}
                  accent="cf-green"
                  placeholder="Generate a key pair..."
                />
                <KeyField
                  label="Private Key (hex)"
                  value={keyPair.privateKey}
                  accent="cf-red"
                  placeholder="Generate a key pair..."
                />
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.01] px-6 py-10 text-center">
                <KeyRound className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  No key pair generated yet.
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Click <span className="text-cf-blue">Generate Key Pair</span> to create a new Ed25519 key pair.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Sign */}
      <motion.div variants={fadeInUp}>
        <Card className="glass-card border-0">
          <CardHeader className="pb-3">
            <SectionTitle
              icon={FileSignature}
              title="Sign Message"
              subtitle="Produce a deterministic signature with your private key"
              accent="cf-cyan"
            />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Message</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter message to sign..."
                className="min-h-[80px] bg-white/[0.03] border-white/[0.08] focus:border-cf-cyan/40 focus:ring-cf-cyan/20 text-foreground placeholder:text-muted-foreground/50 resize-none text-sm"
              />
            </div>
            <Button
              onClick={handleSign}
              disabled={isSigning || !keyPair || !message.trim()}
              className="w-full h-11 bg-cf-cyan/15 hover:bg-cf-cyan/25 text-cf-cyan border border-cf-cyan/30 font-medium"
              variant="outline"
            >
              {isSigning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileSignature className="w-4 h-4 mr-2" />}
              Sign Message
            </Button>
            <AnimatePresence>
              {signature && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <KeyField
                    label="Signature (hex)"
                    value={signature}
                    accent="cf-cyan"
                    placeholder="Signature will appear here"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {/* Verify */}
      <motion.div variants={fadeInUp}>
        <Card className="glass-card border-0">
          <CardHeader className="pb-3">
            <SectionTitle
              icon={Shield}
              title="Verify Signature"
              subtitle="Confirm authenticity using the message, signature, and public key"
              accent="cf-green"
            />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Message</Label>
              <Textarea
                value={verifyMessage}
                onChange={(e) => { setVerifyMessage(e.target.value); setVerifyResult(null); }}
                placeholder="Enter the original message..."
                className="min-h-[64px] bg-white/[0.03] border-white/[0.08] focus:border-cf-green/40 focus:ring-cf-green/20 text-foreground placeholder:text-muted-foreground/50 resize-none text-sm"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Signature (hex)</Label>
                <Textarea
                  value={verifySignature}
                  onChange={(e) => { setVerifySignature(e.target.value); setVerifyResult(null); }}
                  placeholder="Enter hex signature..."
                  className="min-h-[64px] bg-white/[0.03] border-white/[0.08] focus:border-cf-green/40 focus:ring-cf-green/20 text-foreground placeholder:text-muted-foreground/50 resize-none font-mono text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Public Key (hex)</Label>
                <Textarea
                  value={verifyPublicKey}
                  onChange={(e) => { setVerifyPublicKey(e.target.value); setVerifyResult(null); }}
                  placeholder="Enter hex public key..."
                  className="min-h-[64px] bg-white/[0.03] border-white/[0.08] focus:border-cf-green/40 focus:ring-cf-green/20 text-foreground placeholder:text-muted-foreground/50 resize-none font-mono text-xs"
                />
              </div>
            </div>
            <Button
              onClick={handleVerify}
              disabled={!verifyMessage.trim() || !verifySignature.trim() || !verifyPublicKey.trim()}
              className="w-full h-11 bg-cf-green/15 hover:bg-cf-green/25 text-cf-green border border-cf-green/30 font-medium"
              variant="outline"
            >
              <Shield className="w-4 h-4 mr-2" />
              Verify Signature
            </Button>
            <AnimatePresence>
              {error && <ErrorBanner message={error} />}
            </AnimatePresence>
            <AnimatePresence>
              {verifyResult !== null && (
                <VerifyResultBanner result={verifyResult} />
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  X25519 Tab                                                         */
/* ------------------------------------------------------------------ */

function X25519Tab() {
  const [alice, setAlice] = useState<KeyPair | null>(null);
  const [bob, setBob] = useState<KeyPair | null>(null);
  const [aliceSecret, setAliceSecret] = useState('');
  const [bobSecret, setBobSecret] = useState('');
  const [isGeneratingAlice, setIsGeneratingAlice] = useState(false);
  const [isGeneratingBob, setIsGeneratingBob] = useState(false);
  const [error, setError] = useState('');

  const handleGenerateAlice = useCallback(async () => {
    setIsGeneratingAlice(true);
    setError('');
    try {
      const kp = await generateX25519KeyPair();
      setAlice(kp);
      setAliceSecret('');
      setBobSecret('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate Alice key pair');
    } finally {
      setIsGeneratingAlice(false);
    }
  }, []);

  const handleGenerateBob = useCallback(async () => {
    setIsGeneratingBob(true);
    setError('');
    try {
      const kp = await generateX25519KeyPair();
      setBob(kp);
      setAliceSecret('');
      setBobSecret('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate Bob key pair');
    } finally {
      setIsGeneratingBob(false);
    }
  }, []);

  const handleComputeAliceSecret = useCallback(() => {
    if (!alice || !bob) {
      setError('Both key pairs are required to compute the shared secret');
      return;
    }
    setError('');
    try {
      const secret = computeX25519SharedSecret(alice.privateKey, bob.publicKey);
      setAliceSecret(secret);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to compute shared secret');
    }
  }, [alice, bob]);

  const handleComputeBobSecret = useCallback(() => {
    if (!alice || !bob) {
      setError('Both key pairs are required to compute the shared secret');
      return;
    }
    setError('');
    try {
      const secret = computeX25519SharedSecret(bob.privateKey, alice.publicKey);
      setBobSecret(secret);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to compute shared secret');
    }
  }, [alice, bob]);

  const bothComputed = aliceSecret && bobSecret;
  const secretsMatch = bothComputed && aliceSecret === bobSecret;

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-5">
      <motion.div variants={fadeInUp}>
        <Card className="glass-card border-0">
          <CardHeader className="pb-3">
            <SectionTitle
              icon={ArrowLeftRight}
              title="X25519 Key Exchange (ECDH)"
              subtitle="Two parties derive a shared secret without ever transmitting it"
              accent="cf-cyan"
            />
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 flex items-start gap-3">
              <Zap className="w-4 h-4 text-cf-cyan shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Each party generates their own key pair. They exchange <span className="text-cf-green">public keys</span> openly,
                then each combines their <span className="text-cf-red">private key</span> with the other&rsquo;s public key
                to derive the same shared secret.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Key pairs */}
      <motion.div variants={fadeInUp}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Alice */}
          <Card className="glass-card border-0">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cf-blue/15 border border-cf-blue/25 text-cf-blue font-bold text-xs">
                    A
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold text-foreground">Alice&rsquo;s Key Pair</CardTitle>
                    <p className="text-xs text-muted-foreground">Private + Public</p>
                  </div>
                </div>
                <Button
                  onClick={handleGenerateAlice}
                  disabled={isGeneratingAlice}
                  size="sm"
                  className="bg-cf-blue hover:bg-cf-blue/90 text-white shrink-0"
                >
                  {isGeneratingAlice ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 mr-1.5" />}
                  Generate
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <KeyField label="Private Key (hex)" value={alice?.privateKey || ''} accent="cf-red" placeholder="Click Generate" />
              <KeyField label="Public Key (hex)" value={alice?.publicKey || ''} accent="cf-green" placeholder="Click Generate" />
            </CardContent>
          </Card>

          {/* Bob */}
          <Card className="glass-card border-0">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cf-cyan/15 border border-cf-cyan/25 text-cf-cyan font-bold text-xs">
                    B
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold text-foreground">Bob&rsquo;s Key Pair</CardTitle>
                    <p className="text-xs text-muted-foreground">Private + Public</p>
                  </div>
                </div>
                <Button
                  onClick={handleGenerateBob}
                  disabled={isGeneratingBob}
                  size="sm"
                  className="bg-cf-cyan hover:bg-cf-cyan/90 text-white shrink-0"
                >
                  {isGeneratingBob ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 mr-1.5" />}
                  Generate
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <KeyField label="Private Key (hex)" value={bob?.privateKey || ''} accent="cf-red" placeholder="Click Generate" />
              <KeyField label="Public Key (hex)" value={bob?.publicKey || ''} accent="cf-green" placeholder="Click Generate" />
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Shared Secret Computation */}
      <motion.div variants={fadeInUp}>
        <Card className="glass-card border-0">
          <CardHeader className="pb-3">
            <SectionTitle
              icon={Lock}
              title="Compute Shared Secrets"
              subtitle="Each side derives the same secret independently"
              accent="cf-amber"
            />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 items-stretch">
              {/* Alice's shared secret */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-cf-blue font-bold text-sm">A</span>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-cf-green font-bold text-sm">B</span>
                    <span className="text-xs text-muted-foreground ml-1">Alice computes</span>
                  </div>
                  <Button
                    onClick={handleComputeAliceSecret}
                    disabled={!alice || !bob}
                    size="sm"
                    variant="outline"
                    className="border-cf-blue/30 bg-cf-blue/10 hover:bg-cf-blue/20 text-cf-blue h-7 text-xs"
                  >
                    <Lock className="w-3 h-3 mr-1" />
                    Compute
                  </Button>
                </div>
                <KeyField
                  label="Alice&rsquo;s Shared Secret (hex)"
                  value={aliceSecret}
                  accent="cf-blue"
                  placeholder="Awaiting computation..."
                />
              </div>

              {/* Match indicator */}
              <div className="flex lg:flex-col items-center justify-center gap-2 px-2">
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-full border-2 transition-all ${
                    bothComputed
                      ? secretsMatch
                        ? 'bg-cf-green/15 border-cf-green/40 text-cf-green shadow-lg shadow-cf-green/10'
                        : 'bg-cf-red/15 border-cf-red/40 text-cf-red shadow-lg shadow-cf-red/10'
                      : 'bg-white/[0.03] border-white/[0.08] text-muted-foreground/40'
                  }`}
                >
                  {bothComputed ? (
                    secretsMatch ? <CheckCircle2 className="w-7 h-7" /> : <XCircle className="w-7 h-7" />
                  ) : (
                    <ArrowLeftRight className="w-6 h-6" />
                  )}
                </div>
                <AnimatePresence>
                  {bothComputed && (
                    <motion.span
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`text-[10px] font-bold uppercase tracking-wider ${secretsMatch ? 'text-cf-green' : 'text-cf-red'}`}
                    >
                      {secretsMatch ? 'Match' : 'Mismatch'}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              {/* Bob's shared secret */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-cf-cyan font-bold text-sm">B</span>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-cf-green font-bold text-sm">A</span>
                    <span className="text-xs text-muted-foreground ml-1">Bob computes</span>
                  </div>
                  <Button
                    onClick={handleComputeBobSecret}
                    disabled={!alice || !bob}
                    size="sm"
                    variant="outline"
                    className="border-cf-cyan/30 bg-cf-cyan/10 hover:bg-cf-cyan/20 text-cf-cyan h-7 text-xs"
                  >
                    <Lock className="w-3 h-3 mr-1" />
                    Compute
                  </Button>
                </div>
                <KeyField
                  label="Bob&rsquo;s Shared Secret (hex)"
                  value={bobSecret}
                  accent="cf-cyan"
                  placeholder="Awaiting computation..."
                />
              </div>
            </div>

            <AnimatePresence>
              {error && <ErrorBanner message={error} />}
            </AnimatePresence>

            <AnimatePresence>
              {bothComputed && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className={`rounded-lg border px-4 py-3 flex items-center gap-3 ${
                    secretsMatch
                      ? 'bg-cf-green/[0.06] border-cf-green/25'
                      : 'bg-cf-red/[0.06] border-cf-red/25'
                  }`}
                >
                  {secretsMatch ? (
                    <CheckCircle2 className="w-4 h-4 text-cf-green shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-cf-red shrink-0" />
                  )}
                  <p className={`text-xs ${secretsMatch ? 'text-cf-green' : 'text-cf-red'}`}>
                    {secretsMatch
                      ? 'Both parties derived an identical 32-byte shared secret. This can be used as a symmetric key.'
                      : 'The derived secrets do not match. This should never happen with valid X25519 key pairs.'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  ECDSA Tab                                                          */
/* ------------------------------------------------------------------ */

function ECDSATab() {
  const [curve, setCurve] = useState<ECDSACurve>('secp256k1');
  const [keyPair, setKeyPair] = useState<KeyPair | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState('Hello, ECDSA!');
  const [signature, setSignature] = useState('');
  const [isSigning, setIsSigning] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState('');
  const [verifySignature, setVerifySignature] = useState('');
  const [verifyPublicKey, setVerifyPublicKey] = useState('');
  const [verifyResult, setVerifyResult] = useState<VerifyState>(null);
  const [error, setError] = useState('');

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setError('');
    try {
      const kp = await generateSecp256k1KeyPair();
      setKeyPair(kp);
      setVerifyPublicKey(kp.publicKey);
      setVerifyMessage(message);
      setSignature('');
      setVerifyResult(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate key pair');
    } finally {
      setIsGenerating(false);
    }
  }, [message]);

  const handleSign = useCallback(async () => {
    if (!keyPair) {
      setError('Please generate a key pair first');
      return;
    }
    if (!message.trim()) {
      setError('Please enter a message to sign');
      return;
    }
    setError('');
    setIsSigning(true);
    try {
      const sig = await signECDSA(message, keyPair.privateKey, curve);
      setSignature(sig);
      setVerifySignature(sig);
      setVerifyMessage(message);
      setVerifyResult(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Signing failed');
    } finally {
      setIsSigning(false);
    }
  }, [keyPair, message, curve]);

  const handleVerify = useCallback(async () => {
    if (!verifyMessage.trim() || !verifySignature.trim() || !verifyPublicKey.trim()) {
      setError('Please fill in all fields to verify');
      return;
    }
    setError('');
    try {
      const ok = await verifyECDSA(verifyMessage, verifySignature, verifyPublicKey, curve);
      setVerifyResult(ok ? 'valid' : 'invalid');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Verification failed');
      setVerifyResult('invalid');
    }
  }, [verifyMessage, verifySignature, verifyPublicKey, curve]);

  const curveInfo = ECDSA_CURVES.find(c => c.id === curve);

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-5">
      {/* Curve selector + generate */}
      <motion.div variants={fadeInUp}>
        <Card className="glass-card border-0">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <SectionTitle
                icon={Fingerprint}
                title="ECDSA Key Pair"
                subtitle="Elliptic Curve Digital Signature Algorithm"
                accent="cf-green"
              />
              <div className="flex items-center gap-2">
                <div className="w-[200px]">
                  <Select value={curve} onValueChange={(v) => setCurve(v as ECDSACurve)}>
                    <SelectTrigger className="bg-white/[0.03] border-white/[0.08] focus:border-cf-green/40 text-foreground h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a2e] border-white/[0.08]">
                      {ECDSA_CURVES.map((c) => (
                        <SelectItem key={c.id} value={c.id} className="text-foreground focus:bg-white/10">
                          <div className="flex items-center gap-2">
                            <span>{c.name}</span>
                            <span className="text-xs text-muted-foreground">· {c.bits}-bit</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="bg-cf-green hover:bg-cf-green/90 text-white shadow-lg shadow-cf-green/20 shrink-0"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                  Generate
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {curveInfo && (
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="bg-cf-green/10 text-cf-green border-cf-green/20 text-[11px]">
                  {curveInfo.name}
                </Badge>
                <Badge variant="outline" className="bg-white/[0.03] text-muted-foreground border-white/[0.08] text-[11px]">
                  {curveInfo.bits}-bit security
                </Badge>
                <Badge variant="outline" className="bg-white/[0.03] text-muted-foreground border-white/[0.08] text-[11px]">
                  Compact signature (r ∥ s)
                </Badge>
              </div>
            )}
            {keyPair ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <KeyField label="Public Key (hex)" value={keyPair.publicKey} accent="cf-green" placeholder="Generate a key pair..." />
                <KeyField label="Private Key (hex)" value={keyPair.privateKey} accent="cf-red" placeholder="Generate a key pair..." />
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.01] px-6 py-10 text-center">
                <Fingerprint className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No key pair generated yet.</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Pick a curve and click <span className="text-cf-green">Generate</span>.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Sign */}
      <motion.div variants={fadeInUp}>
        <Card className="glass-card border-0">
          <CardHeader className="pb-3">
            <SectionTitle icon={FileSignature} title="Sign Message" subtitle={`Sign with ${curve}`} accent="cf-cyan" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Message</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter message to sign..."
                className="min-h-[80px] bg-white/[0.03] border-white/[0.08] focus:border-cf-cyan/40 focus:ring-cf-cyan/20 text-foreground placeholder:text-muted-foreground/50 resize-none text-sm"
              />
            </div>
            <Button
              onClick={handleSign}
              disabled={isSigning || !keyPair || !message.trim()}
              className="w-full h-11 bg-cf-cyan/15 hover:bg-cf-cyan/25 text-cf-cyan border border-cf-cyan/30 font-medium"
              variant="outline"
            >
              {isSigning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileSignature className="w-4 h-4 mr-2" />}
              Sign Message
            </Button>
            <AnimatePresence>
              {signature && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-2">
                  <KeyField label="Signature (hex · compact)" value={signature} accent="cf-cyan" placeholder="Signature will appear here" />
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {/* Verify */}
      <motion.div variants={fadeInUp}>
        <Card className="glass-card border-0">
          <CardHeader className="pb-3">
            <SectionTitle icon={Shield} title="Verify Signature" subtitle={`Verify with ${curve}`} accent="cf-green" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Message</Label>
              <Textarea
                value={verifyMessage}
                onChange={(e) => { setVerifyMessage(e.target.value); setVerifyResult(null); }}
                placeholder="Enter the original message..."
                className="min-h-[64px] bg-white/[0.03] border-white/[0.08] focus:border-cf-green/40 focus:ring-cf-green/20 text-foreground placeholder:text-muted-foreground/50 resize-none text-sm"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Signature (hex)</Label>
                <Textarea
                  value={verifySignature}
                  onChange={(e) => { setVerifySignature(e.target.value); setVerifyResult(null); }}
                  placeholder="Enter hex signature..."
                  className="min-h-[64px] bg-white/[0.03] border-white/[0.08] focus:border-cf-green/40 focus:ring-cf-green/20 text-foreground placeholder:text-muted-foreground/50 resize-none font-mono text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Public Key (hex)</Label>
                <Textarea
                  value={verifyPublicKey}
                  onChange={(e) => { setVerifyPublicKey(e.target.value); setVerifyResult(null); }}
                  placeholder="Enter hex public key..."
                  className="min-h-[64px] bg-white/[0.03] border-white/[0.08] focus:border-cf-green/40 focus:ring-cf-green/20 text-foreground placeholder:text-muted-foreground/50 resize-none font-mono text-xs"
                />
              </div>
            </div>
            <Button
              onClick={handleVerify}
              disabled={!verifyMessage.trim() || !verifySignature.trim() || !verifyPublicKey.trim()}
              className="w-full h-11 bg-cf-green/15 hover:bg-cf-green/25 text-cf-green border border-cf-green/30 font-medium"
              variant="outline"
            >
              <Shield className="w-4 h-4 mr-2" />
              Verify Signature
            </Button>
            <AnimatePresence>{error && <ErrorBanner message={error} />}</AnimatePresence>
            <AnimatePresence>
              {verifyResult !== null && <VerifyResultBanner result={verifyResult} />}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  RSA Tab                                                            */
/* ------------------------------------------------------------------ */

function RSATab() {
  const [keySize, setKeySize] = useState<RSAKeySize>('2048');
  const [keyPair, setKeyPair] = useState<KeyPair | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPrivate, setShowPrivate] = useState(false);
  const [subTab, setSubTab] = useState<RSASubTab>('sign-verify');
  const [error, setError] = useState('');

  // Sign/Verify state
  const [signMessage, setSignMessage] = useState('Hello, RSA!');
  const [signature, setSignature] = useState('');
  const [isSigning, setIsSigning] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState('');
  const [verifySignature, setVerifySignature] = useState('');
  const [verifyPublicKey, setVerifyPublicKey] = useState('');
  const [verifyResult, setVerifyResult] = useState<VerifyState>(null);

  // Encrypt/Decrypt state
  const [plaintext, setPlaintext] = useState('Secret message for RSA-OAEP.');
  const [ciphertext, setCiphertext] = useState('');
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [decrypted, setDecrypted] = useState('');
  const [isDecrypting, setIsDecrypting] = useState(false);

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setError('');
    setKeyPair(null);
    setSignature('');
    setCiphertext('');
    setDecrypted('');
    setVerifyResult(null);
    try {
      const kp = await generateRSAKeyPair(parseInt(keySize) as 1024 | 2048 | 3072 | 4096);
      setKeyPair(kp);
      setVerifyPublicKey(kp.publicKey);
      setVerifyMessage(signMessage);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate RSA key pair');
    } finally {
      setIsGenerating(false);
    }
  }, [keySize, signMessage]);

  const handleSign = useCallback(async () => {
    if (!keyPair) {
      setError('Please generate an RSA key pair first');
      return;
    }
    if (!signMessage.trim()) {
      setError('Please enter a message to sign');
      return;
    }
    setError('');
    setIsSigning(true);
    try {
      const sig = await signRSA(signMessage, keyPair.privateKey);
      setSignature(sig);
      setVerifySignature(sig);
      setVerifyMessage(signMessage);
      setVerifyResult(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Signing failed');
    } finally {
      setIsSigning(false);
    }
  }, [keyPair, signMessage]);

  const handleVerify = useCallback(async () => {
    if (!verifyMessage.trim() || !verifySignature.trim() || !verifyPublicKey.trim()) {
      setError('Please fill in all fields to verify');
      return;
    }
    setError('');
    try {
      const ok = await verifyRSA(verifyMessage, verifySignature, verifyPublicKey);
      setVerifyResult(ok ? 'valid' : 'invalid');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Verification failed');
      setVerifyResult('invalid');
    }
  }, [verifyMessage, verifySignature, verifyPublicKey]);

  const handleEncrypt = useCallback(async () => {
    if (!keyPair) {
      setError('Please generate an RSA key pair first');
      return;
    }
    if (!plaintext.trim()) {
      setError('Please enter plaintext to encrypt');
      return;
    }
    setError('');
    setIsEncrypting(true);
    try {
      const ct = await rsaOaepEncrypt(plaintext, keyPair.publicKey);
      setCiphertext(ct);
      setDecrypted('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Encryption failed');
    } finally {
      setIsEncrypting(false);
    }
  }, [keyPair, plaintext]);

  const handleDecrypt = useCallback(async () => {
    if (!keyPair) {
      setError('Please generate an RSA key pair first');
      return;
    }
    if (!ciphertext.trim()) {
      setError('Please provide ciphertext to decrypt');
      return;
    }
    setError('');
    setIsDecrypting(true);
    try {
      const pt = await rsaOaepDecrypt(ciphertext, keyPair.privateKey);
      setDecrypted(pt);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Decryption failed');
    } finally {
      setIsDecrypting(false);
    }
  }, [keyPair, ciphertext]);

  const sizeInfo = RSA_KEY_SIZES.find(s => s.id === keySize);

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-5">
      {/* Generate */}
      <motion.div variants={fadeInUp}>
        <Card className="glass-card border-0">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <SectionTitle
                icon={KeyRound}
                title="RSA Key Pair"
                subtitle="RSASSA-PKCS1-v1_5 · SHA-256 · via Web Crypto API"
                accent="cf-amber"
              />
              <div className="flex items-center gap-2">
                <div className="w-[200px]">
                  <Select value={keySize} onValueChange={(v) => setKeySize(v as RSAKeySize)}>
                    <SelectTrigger className="bg-white/[0.03] border-white/[0.08] focus:border-cf-amber/40 text-foreground h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a2e] border-white/[0.08]">
                      {RSA_KEY_SIZES.map((s) => (
                        <SelectItem key={s.id} value={s.id} className="text-foreground focus:bg-white/10">
                          <div className="flex items-center gap-2">
                            <span>{s.name}</span>
                            <span className="text-xs text-muted-foreground">· {s.note}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="bg-cf-amber hover:bg-cf-amber/90 text-white shadow-lg shadow-cf-amber/20 shrink-0"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                  {isGenerating ? 'Generating...' : 'Generate'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isGenerating && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-xl border border-cf-amber/25 bg-cf-amber/[0.06] px-4 py-4 flex items-center gap-3"
              >
                <Loader2 className="w-5 h-5 text-cf-amber animate-spin shrink-0" />
                <div>
                  <p className="text-sm font-medium text-cf-amber">Generating {keySize}-bit RSA key pair...</p>
                  <p className="text-xs text-muted-foreground">
                    Larger key sizes take longer (4096-bit may take several seconds).
                  </p>
                </div>
              </motion.div>
            )}
            {sizeInfo && !isGenerating && (
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="bg-cf-amber/10 text-cf-amber border-cf-amber/20 text-[11px]">
                  {sizeInfo.name}
                </Badge>
                <Badge variant="outline" className="bg-white/[0.03] text-muted-foreground border-white/[0.08] text-[11px]">
                  {sizeInfo.note}
                </Badge>
                {keyPair && (
                  <Badge variant="outline" className="bg-cf-green/10 text-cf-green border-cf-green/20 text-[11px]">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                )}
              </div>
            )}
            {keyPair ? (
              <div className="space-y-4">
                <KeyField
                  label="Public Key (SPKI · base64)"
                  value={keyPair.publicKey}
                  accent="cf-green"
                  placeholder="Generate a key pair..."
                />
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-cf-red">
                      Private Key (PKCS#8 · base64)
                    </Label>
                    <button
                      type="button"
                      onClick={() => setShowPrivate(!showPrivate)}
                      className="text-[10px] text-muted-foreground hover:text-cf-cyan transition-colors flex items-center gap-1"
                    >
                      {showPrivate ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      {showPrivate ? 'Hide' : 'Reveal'}
                    </button>
                  </div>
                  <div className="min-h-[44px] max-h-32 overflow-y-auto custom-scrollbar rounded-lg border border-cf-red/15 bg-cf-red/5 px-3 py-2 font-mono text-xs">
                    {showPrivate ? (
                      <p className="text-foreground/90 break-all leading-relaxed">{keyPair.privateKey}</p>
                    ) : (
                      <p className="text-muted-foreground/40 italic font-sans">•••••••••••••••••••••• (hidden)</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              !isGenerating && (
                <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.01] px-6 py-10 text-center">
                  <KeyRound className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No RSA key pair generated yet.</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Pick a key size and click <span className="text-cf-amber">Generate</span>.
                  </p>
                </div>
              )
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Sub-tabs: Sign/Verify & Encrypt/Decrypt */}
      <motion.div variants={fadeInUp}>
        <Tabs value={subTab} onValueChange={(v) => { setSubTab(v as RSASubTab); setError(''); setVerifyResult(null); }}>
          <TabsList className="glass-card rounded-lg p-1 h-auto w-full grid grid-cols-2">
            <TabsTrigger
              value="sign-verify"
              className="data-[state=active]:bg-cf-amber/20 data-[state=active]:text-cf-amber px-6 py-2.5 rounded-md text-sm font-medium transition-all"
            >
              <FileSignature className="mr-2 h-4 w-4" />
              Sign / Verify
            </TabsTrigger>
            <TabsTrigger
              value="encrypt-decrypt"
              className="data-[state=active]:bg-cf-amber/20 data-[state=active]:text-cf-amber px-6 py-2.5 rounded-md text-sm font-medium transition-all"
            >
              <Lock className="mr-2 h-4 w-4" />
              Encrypt / Decrypt (RSA-OAEP)
            </TabsTrigger>
          </TabsList>

          {/* Sign / Verify */}
          <TabsContent value="sign-verify" className="space-y-5 mt-5">
            <Card className="glass-card border-0">
              <CardHeader className="pb-3">
                <SectionTitle icon={FileSignature} title="Sign Message" subtitle="RSASSA-PKCS1-v1_5 + SHA-256" accent="cf-cyan" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">Message</Label>
                  <Textarea
                    value={signMessage}
                    onChange={(e) => setSignMessage(e.target.value)}
                    placeholder="Enter message to sign..."
                    className="min-h-[80px] bg-white/[0.03] border-white/[0.08] focus:border-cf-cyan/40 focus:ring-cf-cyan/20 text-foreground placeholder:text-muted-foreground/50 resize-none text-sm"
                  />
                </div>
                <Button
                  onClick={handleSign}
                  disabled={isSigning || !keyPair || !signMessage.trim()}
                  className="w-full h-11 bg-cf-cyan/15 hover:bg-cf-cyan/25 text-cf-cyan border border-cf-cyan/30 font-medium"
                  variant="outline"
                >
                  {isSigning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileSignature className="w-4 h-4 mr-2" />}
                  Sign Message
                </Button>
                <AnimatePresence>
                  {signature && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-2">
                      <KeyField label="Signature (base64)" value={signature} accent="cf-cyan" placeholder="Signature will appear here" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>

            <Card className="glass-card border-0">
              <CardHeader className="pb-3">
                <SectionTitle icon={Shield} title="Verify Signature" subtitle="Authenticate with public key + signature" accent="cf-green" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">Message</Label>
                  <Textarea
                    value={verifyMessage}
                    onChange={(e) => { setVerifyMessage(e.target.value); setVerifyResult(null); }}
                    placeholder="Enter the original message..."
                    className="min-h-[64px] bg-white/[0.03] border-white/[0.08] focus:border-cf-green/40 focus:ring-cf-green/20 text-foreground placeholder:text-muted-foreground/50 resize-none text-sm"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">Signature (base64)</Label>
                    <Textarea
                      value={verifySignature}
                      onChange={(e) => { setVerifySignature(e.target.value); setVerifyResult(null); }}
                      placeholder="Enter base64 signature..."
                      className="min-h-[64px] bg-white/[0.03] border-white/[0.08] focus:border-cf-green/40 focus:ring-cf-green/20 text-foreground placeholder:text-muted-foreground/50 resize-none font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">Public Key (SPKI · base64)</Label>
                    <Textarea
                      value={verifyPublicKey}
                      onChange={(e) => { setVerifyPublicKey(e.target.value); setVerifyResult(null); }}
                      placeholder="Enter base64 public key..."
                      className="min-h-[64px] bg-white/[0.03] border-white/[0.08] focus:border-cf-green/40 focus:ring-cf-green/20 text-foreground placeholder:text-muted-foreground/50 resize-none font-mono text-xs"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleVerify}
                  disabled={!verifyMessage.trim() || !verifySignature.trim() || !verifyPublicKey.trim()}
                  className="w-full h-11 bg-cf-green/15 hover:bg-cf-green/25 text-cf-green border border-cf-green/30 font-medium"
                  variant="outline"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Verify Signature
                </Button>
                <AnimatePresence>{error && <ErrorBanner message={error} />}</AnimatePresence>
                <AnimatePresence>
                  {verifyResult !== null && <VerifyResultBanner result={verifyResult} />}
                </AnimatePresence>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Encrypt / Decrypt */}
          <TabsContent value="encrypt-decrypt" className="space-y-5 mt-5">
            <Card className="glass-card border-0">
              <CardHeader className="pb-3">
                <SectionTitle icon={Lock} title="Encrypt with Public Key" subtitle="RSA-OAEP · SHA-256 · max ~190 bytes for 2048-bit" accent="cf-cyan" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">Plaintext</Label>
                  <Textarea
                    value={plaintext}
                    onChange={(e) => setPlaintext(e.target.value)}
                    placeholder="Enter plaintext to encrypt..."
                    className="min-h-[80px] bg-white/[0.03] border-white/[0.08] focus:border-cf-cyan/40 focus:ring-cf-cyan/20 text-foreground placeholder:text-muted-foreground/50 resize-none text-sm"
                  />
                </div>
                <Button
                  onClick={handleEncrypt}
                  disabled={isEncrypting || !keyPair || !plaintext.trim()}
                  className="w-full h-11 bg-cf-cyan/15 hover:bg-cf-cyan/25 text-cf-cyan border border-cf-cyan/30 font-medium"
                  variant="outline"
                >
                  {isEncrypting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lock className="w-4 h-4 mr-2" />}
                  Encrypt
                </Button>
                <AnimatePresence>
                  {ciphertext && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-2">
                      <KeyField label="Ciphertext (base64)" value={ciphertext} accent="cf-cyan" placeholder="Ciphertext will appear here" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>

            <Card className="glass-card border-0">
              <CardHeader className="pb-3">
                <SectionTitle icon={Unlock} title="Decrypt with Private Key" subtitle="Reverse RSA-OAEP to recover plaintext" accent="cf-green" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">Ciphertext (base64)</Label>
                  <Textarea
                    value={ciphertext}
                    onChange={(e) => { setCiphertext(e.target.value); setDecrypted(''); }}
                    placeholder="Enter base64 ciphertext or encrypt above..."
                    className="min-h-[80px] bg-white/[0.03] border-white/[0.08] focus:border-cf-green/40 focus:ring-cf-green/20 text-foreground placeholder:text-muted-foreground/50 resize-none font-mono text-xs"
                  />
                </div>
                <Button
                  onClick={handleDecrypt}
                  disabled={isDecrypting || !keyPair || !ciphertext.trim()}
                  className="w-full h-11 bg-cf-green/15 hover:bg-cf-green/25 text-cf-green border border-cf-green/30 font-medium"
                  variant="outline"
                >
                  {isDecrypting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Unlock className="w-4 h-4 mr-2" />}
                  Decrypt
                </Button>
                <AnimatePresence>
                  {decrypted !== '' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-cf-green">Decrypted Plaintext</Label>
                      <div className="min-h-[44px] max-h-40 overflow-y-auto custom-scrollbar rounded-lg border border-cf-green/15 bg-cf-green/5 px-3 py-2 text-sm">
                        <p className="text-foreground/90 break-all leading-relaxed">{decrypted}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <AnimatePresence>{error && <ErrorBanner message={error} />}</AnimatePresence>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function AsymmetricCrypto() {
  const [activeTab, setActiveTab] = useState<AlgorithmTab>('ed25519');

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeInUp} className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cf-blue/10 border border-cf-blue/20">
          <KeyRound className="h-6 w-6 text-cf-blue" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-bold text-foreground tracking-tight">Asymmetric Cryptography</h2>
            <Badge variant="outline" className="bg-cf-cyan/10 text-cf-cyan border-cf-cyan/20 text-[11px]">
              <Sparkles className="w-3 h-3 mr-1" />
              Public / Private Key
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate key pairs, sign, verify, encrypt, and decrypt with asymmetric algorithms
          </p>
        </div>
      </motion.div>

      {/* Algorithm Tabs */}
      <motion.div variants={fadeInUp}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {ALGORITHM_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const accentBg: Record<string, string> = {
              'cf-blue': 'bg-cf-blue/15 border-cf-blue/30 shadow-lg shadow-cf-blue/10',
              'cf-cyan': 'bg-cf-cyan/15 border-cf-cyan/30 shadow-lg shadow-cf-cyan/10',
              'cf-green': 'bg-cf-green/15 border-cf-green/30 shadow-lg shadow-cf-green/10',
              'cf-amber': 'bg-cf-amber/15 border-cf-amber/30 shadow-lg shadow-cf-amber/10',
            };
            const accentText: Record<string, string> = {
              'cf-blue': 'text-cf-blue',
              'cf-cyan': 'text-cf-cyan',
              'cf-green': 'text-cf-green',
              'cf-amber': 'text-cf-amber',
            };
            const Icon = tab.icon;
            return (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex flex-col items-start gap-1.5 p-3.5 rounded-xl border text-left transition-all duration-200 ${
                  isActive
                    ? accentBg[tab.accent]
                    : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.1]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${isActive ? accentText[tab.accent] : 'text-muted-foreground'}`} />
                  <span className={`text-sm font-semibold ${isActive ? accentText[tab.accent] : 'text-foreground'}`}>
                    {tab.name}
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground leading-tight">{tab.description}</span>
                {isActive && (
                  <motion.div
                    layoutId="asym-tab-indicator"
                    className="absolute -bottom-px left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-current"
                    style={{ color: `var(--color-${tab.accent})` }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Active tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >
          {activeTab === 'ed25519' && <Ed25519Tab />}
          {activeTab === 'x25519' && <X25519Tab />}
          {activeTab === 'ecdsa' && <ECDSATab />}
          {activeTab === 'rsa' && <RSATab />}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
