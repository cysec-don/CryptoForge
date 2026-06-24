'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  KeyRound,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import CryptoJS from 'crypto-js';
import {
  generateRandomBytes,
  assessPasswordStrength,
  type PasswordStrength,
} from '@/lib/crypto';

// ─── Types ────────────────────────────────────────────────────────────────────

type PasswordHashAlgorithm = 'bcrypt' | 'pbkdf2-sha256' | 'pbkdf2-sha512' | 'argon2id';

interface AlgorithmConfig {
  id: PasswordHashAlgorithm;
  name: string;
  description: string;
  supported: boolean;
  badge?: string;
}

interface HashResult {
  hash: string;
  algorithm: string;
  cost: number;
  salt: string;
  timestamp: Date;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ALGORITHMS: AlgorithmConfig[] = [
  {
    id: 'bcrypt',
    name: 'bcrypt',
    description: 'Adaptive hashing with cost factor',
    supported: true,
  },
  {
    id: 'pbkdf2-sha256',
    name: 'PBKDF2-SHA256',
    description: 'Key derivation with SHA-256',
    supported: true,
  },
  {
    id: 'pbkdf2-sha512',
    name: 'PBKDF2-SHA512',
    description: 'Key derivation with SHA-512',
    supported: true,
  },
  {
    id: 'argon2id',
    name: 'Argon2id',
    description: 'Memory-hard key derivation',
    supported: false,
    badge: 'Coming Soon',
  },
];

const STRENGTH_COLORS: Record<string, { bar: string; text: string; bg: string }> = {
  'Very Weak': { bar: 'bg-cf-red', text: 'text-cf-red', bg: 'bg-cf-red/10' },
  'Weak': { bar: 'bg-cf-amber', text: 'text-cf-amber', bg: 'bg-cf-amber/10' },
  'Fair': { bar: 'bg-cf-amber', text: 'text-cf-amber', bg: 'bg-cf-amber/10' },
  'Strong': { bar: 'bg-cf-green', text: 'text-cf-green', bg: 'bg-cf-green/10' },
  'Very Strong': { bar: 'bg-cf-green', text: 'text-cf-green', bg: 'bg-cf-green/10' },
};

// ─── Hashing Functions ────────────────────────────────────────────────────────

function hashBcrypt(password: string, salt: string, cost: number): string {
  // Approximate bcrypt using PBKDF2 with SHA-256
  const hash = CryptoJS.PBKDF2(password, salt, {
    keySize: 256 / 32,
    iterations: Math.pow(2, cost),
  }).toString();
  return `$2a$${cost}$${salt}$${hash}`;
}

function hashPBKDF2SHA256(password: string, salt: string, iterations: number): string {
  const hash = CryptoJS.PBKDF2(password, salt, {
    keySize: 512 / 32,
    iterations,
    hasher: CryptoJS.algo.SHA256,
  }).toString();
  return `pbkdf2-sha256$i=${iterations}$${salt}$${hash}`;
}

function hashPBKDF2SHA512(password: string, salt: string, iterations: number): string {
  const hash = CryptoJS.PBKDF2(password, salt, {
    keySize: 512 / 32,
    iterations,
    hasher: CryptoJS.algo.SHA512,
  }).toString();
  return `pbkdf2-sha512$i=${iterations}$${salt}$${hash}`;
}

function parseHashFormat(hashStr: string): {
  algorithm: string;
  cost: number;
  salt: string;
} | null {
  if (hashStr.startsWith('$2a$')) {
    const parts = hashStr.split('$');
    if (parts.length >= 5) {
      return {
        algorithm: 'bcrypt',
        cost: parseInt(parts[2], 10),
        salt: parts[3],
      };
    }
  }
  if (hashStr.startsWith('pbkdf2-sha256$')) {
    const parts = hashStr.split('$');
    if (parts.length >= 4) {
      const iterMatch = parts[1].match(/i=(\d+)/);
      return {
        algorithm: 'PBKDF2-SHA256',
        cost: iterMatch ? parseInt(iterMatch[1], 10) : 0,
        salt: parts[2],
      };
    }
  }
  if (hashStr.startsWith('pbkdf2-sha512$')) {
    const parts = hashStr.split('$');
    if (parts.length >= 4) {
      const iterMatch = parts[1].match(/i=(\d+)/);
      return {
        algorithm: 'PBKDF2-SHA512',
        cost: iterMatch ? parseInt(iterMatch[1], 10) : 0,
        salt: parts[2],
      };
    }
  }
  return null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PasswordHashing() {
  // Algorithm state
  const [selectedAlgo, setSelectedAlgo] = useState<PasswordHashAlgorithm>('bcrypt');
  const [bcryptCost, setBcryptCost] = useState(12);
  const [pbkdf2Iterations, setPbkdf2Iterations] = useState(100000);

  // Password state
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null);

  // Salt state
  const [salt, setSalt] = useState('');
  const [customSalt, setCustomSalt] = useState('');
  const [useCustomSalt, setUseCustomSalt] = useState(false);

  // Result state
  const [hashResult, setHashResult] = useState<HashResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);
  const [error, setError] = useState('');

  // Verify state
  const [showVerify, setShowVerify] = useState(false);
  const [verifyPassword, setVerifyPassword] = useState('');
  const [verifyHash, setVerifyHash] = useState('');
  const [verifyShowPassword, setVerifyShowPassword] = useState(false);
  const [verifyResult, setVerifyResult] = useState<'match' | 'mismatch' | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const generateSalt = useCallback(() => {
    const newSalt = generateRandomBytes(16);
    setSalt(newSalt);
    return newSalt;
  }, []);

  const handlePasswordChange = useCallback((value: string) => {
    setPassword(value);
    if (value) {
      setPasswordStrength(assessPasswordStrength(value));
    } else {
      setPasswordStrength(null);
    }
  }, []);

  const handleGenerateHash = useCallback(() => {
    if (!password.trim()) {
      setError('Please enter a password');
      return;
    }

    const activeSalt = useCustomSalt ? customSalt : salt;
    if (!activeSalt) {
      setError('Please generate or enter a salt');
      return;
    }

    const currentAlgo = ALGORITHMS.find((a) => a.id === selectedAlgo);
    if (!currentAlgo?.supported) {
      setError('Selected algorithm is not yet supported');
      return;
    }

    setIsGenerating(true);
    setError('');
    setHashResult(null);

    // Use setTimeout to allow UI to update before heavy computation
    setTimeout(() => {
      try {
        let hash: string;
        let cost: number;

        switch (selectedAlgo) {
          case 'bcrypt':
            cost = bcryptCost;
            hash = hashBcrypt(password, activeSalt, bcryptCost);
            break;
          case 'pbkdf2-sha256':
            cost = pbkdf2Iterations;
            hash = hashPBKDF2SHA256(password, activeSalt, pbkdf2Iterations);
            break;
          case 'pbkdf2-sha512':
            cost = pbkdf2Iterations;
            hash = hashPBKDF2SHA512(password, activeSalt, pbkdf2Iterations);
            break;
          default:
            throw new Error('Unsupported algorithm');
        }

        setHashResult({
          hash,
          algorithm: currentAlgo.name,
          cost,
          salt: activeSalt,
          timestamp: new Date(),
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Hash generation failed');
      } finally {
        setIsGenerating(false);
      }
    }, 50);
  }, [password, salt, customSalt, useCustomSalt, selectedAlgo, bcryptCost, pbkdf2Iterations]);

  const handleVerify = useCallback(() => {
    if (!verifyPassword.trim()) {
      return;
    }
    if (!verifyHash.trim()) {
      return;
    }

    setIsVerifying(true);
    setVerifyResult(null);

    setTimeout(() => {
      try {
        const parsed = parseHashFormat(verifyHash);
        let recomputedHash: string;

        if (parsed) {
          switch (parsed.algorithm) {
            case 'bcrypt':
              recomputedHash = hashBcrypt(verifyPassword, parsed.salt, parsed.cost);
              break;
            case 'PBKDF2-SHA256':
              recomputedHash = hashPBKDF2SHA256(verifyPassword, parsed.salt, parsed.cost);
              break;
            case 'PBKDF2-SHA512':
              recomputedHash = hashPBKDF2SHA512(verifyPassword, parsed.salt, parsed.cost);
              break;
            default:
              setVerifyResult('mismatch');
              setIsVerifying(false);
              return;
          }
        } else {
          // Try to verify with the currently selected algorithm and salt
          const activeSalt = useCustomSalt ? customSalt : salt;
          switch (selectedAlgo) {
            case 'bcrypt':
              recomputedHash = hashBcrypt(verifyPassword, activeSalt, bcryptCost);
              break;
            case 'pbkdf2-sha256':
              recomputedHash = hashPBKDF2SHA256(verifyPassword, activeSalt, pbkdf2Iterations);
              break;
            case 'pbkdf2-sha512':
              recomputedHash = hashPBKDF2SHA512(verifyPassword, activeSalt, pbkdf2Iterations);
              break;
            default:
              setVerifyResult('mismatch');
              setIsVerifying(false);
              return;
          }
        }

        setVerifyResult(recomputedHash === verifyHash ? 'match' : 'mismatch');
      } catch {
        setVerifyResult('mismatch');
      } finally {
        setIsVerifying(false);
      }
    }, 50);
  }, [verifyPassword, verifyHash, selectedAlgo, salt, customSalt, useCustomSalt, bcryptCost, pbkdf2Iterations]);

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    } catch {
      // fallback
    }
  }, []);

  const currentAlgo = ALGORITHMS.find((a) => a.id === selectedAlgo);
  const strengthConfig = passwordStrength
    ? STRENGTH_COLORS[passwordStrength.label] ?? STRENGTH_COLORS['Very Weak']
    : null;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
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
            <h2 className="text-2xl font-bold text-foreground tracking-tight">
              Password Hashing Center
            </h2>
            <p className="text-sm text-muted-foreground">
              Generate secure password hashes with industry-standard algorithms
            </p>
          </div>
        </div>
      </motion.div>

      {/* Algorithm Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="glass-card border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Select Algorithm
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {ALGORITHMS.map((algo) => (
                <motion.button
                  key={algo.id}
                  whileHover={algo.supported ? { scale: 1.02 } : {}}
                  whileTap={algo.supported ? { scale: 0.98 } : {}}
                  onClick={() => {
                    if (algo.supported) {
                      setSelectedAlgo(algo.id);
                      setHashResult(null);
                      setError('');
                    }
                  }}
                  disabled={!algo.supported}
                  className={`
                    relative flex flex-col items-center gap-2 p-4 rounded-xl text-center transition-all duration-200
                    ${
                      !algo.supported
                        ? 'bg-white/[0.02] border border-white/[0.04] cursor-not-allowed opacity-50'
                        : selectedAlgo === algo.id
                          ? 'bg-cf-blue/15 border border-cf-blue/30 shadow-lg shadow-cf-blue/10'
                          : 'bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.1] cursor-pointer'
                    }
                  `}
                >
                  <Shield
                    className={`w-5 h-5 ${
                      selectedAlgo === algo.id && algo.supported
                        ? 'text-cf-blue'
                        : algo.supported
                          ? 'text-muted-foreground'
                          : 'text-muted-foreground/40'
                    }`}
                  />
                  <span
                    className={`text-sm font-semibold ${
                      selectedAlgo === algo.id && algo.supported
                        ? 'text-cf-blue'
                        : algo.supported
                          ? 'text-foreground'
                          : 'text-muted-foreground/50'
                    }`}
                  >
                    {algo.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground leading-tight">
                    {algo.description}
                  </span>
                  {algo.badge && (
                    <Badge
                      variant="secondary"
                      className="text-[9px] px-1.5 py-0 h-4 bg-cf-cyan/10 text-cf-cyan border-cf-cyan/20"
                    >
                      {algo.badge}
                    </Badge>
                  )}
                  {selectedAlgo === algo.id && algo.supported && (
                    <motion.div
                      layoutId="algo-indicator-pwhash"
                      className="absolute -bottom-px left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-cf-blue"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </motion.button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Cost / Iteration Settings */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedAlgo}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="glass-card border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4" />
                {selectedAlgo === 'bcrypt' ? 'Cost Factor' : 'Iterations'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedAlgo === 'bcrypt' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">
                      Cost Factor (2^cost iterations)
                    </Label>
                    <Badge
                      variant="outline"
                      className="bg-cf-blue/10 text-cf-blue border-cf-blue/20 text-xs font-mono"
                    >
                      {bcryptCost}
                    </Badge>
                  </div>
                  <Slider
                    value={[bcryptCost]}
                    onValueChange={(v) => setBcryptCost(v[0])}
                    min={4}
                    max={31}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground/60">
                    <span>4 (fast)</span>
                    <span>12 (recommended)</span>
                    <span>31 (slow)</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-white/[0.02] border border-white/[0.06] rounded-lg p-2.5">
                    <Info className="w-3.5 h-3.5 text-cf-cyan shrink-0" />
                    <span>
                      Cost {bcryptCost} = {Math.pow(2, bcryptCost).toLocaleString()} iterations.{' '}
                      {bcryptCost < 10
                        ? 'Consider increasing for better security.'
                        : bcryptCost > 14
                          ? 'Higher cost increases computation time significantly.'
                          : 'Good balance of security and performance.'}
                    </span>
                  </div>
                </div>
              )}

              {(selectedAlgo === 'pbkdf2-sha256' || selectedAlgo === 'pbkdf2-sha512') && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Iterations</Label>
                    <Badge
                      variant="outline"
                      className="bg-cf-blue/10 text-cf-blue border-cf-blue/20 text-xs font-mono"
                    >
                      {pbkdf2Iterations.toLocaleString()}
                    </Badge>
                  </div>
                  <Slider
                    value={[Math.log10(pbkdf2Iterations)]}
                    onValueChange={(v) => setPbkdf2Iterations(Math.round(Math.pow(10, v[0])))}
                    min={3}
                    max={6}
                    step={0.05}
                    className="w-full"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground/60">
                    <span>1,000</span>
                    <span>100,000 (recommended)</span>
                    <span>1,000,000</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-white/[0.02] border border-white/[0.06] rounded-lg p-2.5">
                    <Info className="w-3.5 h-3.5 text-cf-cyan shrink-0" />
                    <span>
                      {pbkdf2Iterations.toLocaleString()} iterations.{' '}
                      {pbkdf2Iterations < 10000
                        ? 'Consider increasing for better security.'
                        : pbkdf2Iterations > 300000
                          ? 'Higher iterations increase computation time.'
                          : 'Good security-performance balance.'}
                    </span>
                  </div>
                </div>
              )}

              {selectedAlgo === 'argon2id' && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertTriangle className="w-4 h-4 text-cf-amber" />
                  Argon2id support is coming soon. Please select another algorithm.
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Password Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="glass-card border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Password
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Password Input with Toggle */}
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                placeholder="Enter password to hash..."
                className="bg-white/[0.03] border-white/[0.08] focus:border-cf-blue/40 focus:ring-cf-blue/20 text-foreground placeholder:text-muted-foreground/50 font-mono text-sm pr-10"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Password Strength Meter */}
            <AnimatePresence>
              {passwordStrength && password && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-2 overflow-hidden"
                >
                  {/* Strength Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Password Strength
                      </span>
                      <span
                        className={`text-xs font-semibold ${strengthConfig?.text}`}
                      >
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-white/[0.06] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${((passwordStrength.score + 1) / 5) * 100}%`,
                        }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                        className={`h-full rounded-full ${strengthConfig?.bar}`}
                      />
                    </div>
                  </div>

                  {/* Feedback Suggestions */}
                  {passwordStrength.feedback.length > 0 && (
                    <div className="space-y-1">
                      {passwordStrength.feedback.map((item, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="flex items-center gap-1.5 text-[11px] text-muted-foreground"
                        >
                          <AlertTriangle className="w-3 h-3 text-cf-amber shrink-0" />
                          {item}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {/* Salt Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="glass-card border-0">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <KeyRound className="w-4 h-4" />
                Salt
              </CardTitle>
              <Button
                onClick={() => {
                  const newSalt = generateSalt();
                  if (useCustomSalt) {
                    setCustomSalt(newSalt);
                  }
                }}
                variant="outline"
                size="sm"
                className="border-cf-cyan/20 bg-cf-cyan/5 hover:bg-cf-cyan/15 text-cf-cyan hover:text-cf-cyan h-7 text-xs"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1" />
                Generate New
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Auto-generated Salt Display */}
            {!useCustomSalt && (
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
                  Auto-Generated Salt (Hex)
                </p>
                <p className="result-display text-muted-foreground select-all break-all">
                  {salt || 'Click "Generate New" to create a salt'}
                </p>
              </div>
            )}

            {/* Custom Salt Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setUseCustomSalt(!useCustomSalt)}
                className={`
                  relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out
                  ${useCustomSalt ? 'bg-cf-blue' : 'bg-white/[0.1]'}
                `}
              >
                <span
                  className={`
                    pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform duration-200
                    ${useCustomSalt ? 'translate-x-4' : 'translate-x-0'}
                  `}
                />
              </button>
              <Label className="text-xs text-muted-foreground cursor-pointer" onClick={() => setUseCustomSalt(!useCustomSalt)}>
                Use custom salt
              </Label>
            </div>

            {/* Custom Salt Input */}
            <AnimatePresence>
              {useCustomSalt && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <Input
                    value={customSalt}
                    onChange={(e) => setCustomSalt(e.target.value)}
                    placeholder="Enter custom salt value..."
                    className="bg-white/[0.03] border-white/[0.08] focus:border-cf-blue/40 focus:ring-cf-blue/20 text-foreground placeholder:text-muted-foreground/50 font-mono text-sm"
                  />
                  <p className="text-[10px] text-muted-foreground/60 mt-1.5">
                    Enter your own salt value in hex or text format
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {/* Generate Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.35 }}
      >
        <Button
          onClick={handleGenerateHash}
          disabled={
            isGenerating ||
            !currentAlgo?.supported ||
            !password.trim() ||
            (!useCustomSalt && !salt) ||
            (useCustomSalt && !customSalt.trim())
          }
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
            <Shield className="w-5 h-5 mr-2" />
          )}
          {isGenerating ? 'Generating Hash...' : 'Generate Password Hash'}
        </Button>
      </motion.div>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="glass-card border-cf-red/20 bg-cf-red/[0.03] border">
              <CardContent className="py-3">
                <div className="flex items-center gap-2 text-cf-red text-sm">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result Section */}
      <AnimatePresence>
        {hashResult && (
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
                    <CheckCircle2 className="w-4 h-4 text-cf-green" />
                    Generated Hash
                  </CardTitle>
                  <Button
                    onClick={() => copyToClipboard(hashResult.hash)}
                    variant="outline"
                    size="sm"
                    className="border-cf-cyan/20 bg-cf-cyan/5 hover:bg-cf-cyan/15 text-cf-cyan hover:text-cf-cyan h-7 text-xs"
                  >
                    {copiedHash ? (
                      <Check className="w-3.5 h-3.5 mr-1" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 mr-1" />
                    )}
                    {copiedHash ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Hash Output */}
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 max-h-48 overflow-y-auto custom-scrollbar">
                  <p className="result-display text-muted-foreground break-all select-all">
                    {hashResult.hash}
                  </p>
                </div>

                {/* Hash Details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                      Algorithm
                    </p>
                    <p className="text-xs font-semibold text-foreground">
                      {hashResult.algorithm}
                    </p>
                  </div>
                  <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                      {selectedAlgo === 'bcrypt' ? 'Cost Factor' : 'Iterations'}
                    </p>
                    <p className="text-xs font-semibold text-foreground">
                      {hashResult.cost.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                      Salt Length
                    </p>
                    <p className="text-xs font-semibold text-foreground">
                      {hashResult.salt.length} chars
                    </p>
                  </div>
                  <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                      Hash Length
                    </p>
                    <p className="text-xs font-semibold text-foreground">
                      {hashResult.hash.length} chars
                    </p>
                  </div>
                </div>

                {/* Security Recommendations */}
                <div className="bg-cf-blue/[0.04] border border-cf-blue/10 rounded-xl p-4 space-y-2.5">
                  <div className="flex items-center gap-2 text-sm font-medium text-cf-blue">
                    <Shield className="w-4 h-4" />
                    Security Recommendations
                  </div>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cf-green shrink-0 mt-0.5" />
                      <span>
                        Never store passwords in plain text. Always hash before storage.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cf-green shrink-0 mt-0.5" />
                      <span>
                        Use a unique salt for each password to prevent rainbow table attacks.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cf-green shrink-0 mt-0.5" />
                      <span>
                        {selectedAlgo === 'bcrypt'
                          ? 'A bcrypt cost factor of 12+ is recommended for production use.'
                          : 'At least 100,000 iterations is recommended for PBKDF2 in production.'}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cf-green shrink-0 mt-0.5" />
                      <span>
                        Increase cost/iterations periodically as hardware improves.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Info className="w-3.5 h-3.5 text-cf-cyan shrink-0 mt-0.5" />
                      <span>
                        This is a client-side demonstration. For production, use server-side hashing with
                        libraries like bcryptjs or argon2.
                      </span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Verify Section (Collapsible) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="glass-card border-0">
          <CardHeader className="pb-0">
            <button
              onClick={() => setShowVerify(!showVerify)}
              className="flex items-center justify-between w-full group"
            >
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Verify Password Hash
              </CardTitle>
              <motion.div
                animate={{ rotate: showVerify ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </motion.div>
            </button>
          </CardHeader>

          <AnimatePresence>
            {showVerify && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <CardContent className="pt-4 space-y-4">
                  {/* Verify Password Input */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Password to Verify</Label>
                    <div className="relative">
                      <Input
                        type={verifyShowPassword ? 'text' : 'password'}
                        value={verifyPassword}
                        onChange={(e) => {
                          setVerifyPassword(e.target.value);
                          setVerifyResult(null);
                        }}
                        placeholder="Enter password to verify..."
                        className="bg-white/[0.03] border-white/[0.08] focus:border-cf-blue/40 focus:ring-cf-blue/20 text-foreground placeholder:text-muted-foreground/50 font-mono text-sm pr-10"
                      />
                      <button
                        onClick={() => setVerifyShowPassword(!verifyShowPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {verifyShowPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Verify Hash Input */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Hash to Verify Against</Label>
                    <Textarea
                      value={verifyHash}
                      onChange={(e) => {
                        setVerifyHash(e.target.value);
                        setVerifyResult(null);
                      }}
                      placeholder="Paste the hash to verify against..."
                      className="min-h-[80px] bg-white/[0.03] border-white/[0.08] focus:border-cf-blue/40 focus:ring-cf-blue/20 text-foreground placeholder:text-muted-foreground/50 resize-none font-mono text-xs"
                    />
                  </div>

                  {/* Verify Button */}
                  <Button
                    onClick={handleVerify}
                    disabled={
                      isVerifying ||
                      !verifyPassword.trim() ||
                      !verifyHash.trim()
                    }
                    className="w-full h-10 bg-cf-cyan/80 hover:bg-cf-cyan text-white font-semibold text-sm rounded-xl shadow-lg shadow-cf-cyan/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    {isVerifying ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                      </motion.div>
                    ) : (
                      <Shield className="w-4 h-4 mr-2" />
                    )}
                    {isVerifying ? 'Verifying...' : 'Verify Password'}
                  </Button>

                  {/* Verify Result */}
                  <AnimatePresence>
                    {verifyResult && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div
                          className={`
                            flex items-center gap-3 p-4 rounded-xl border
                            ${
                              verifyResult === 'match'
                                ? 'bg-cf-green/[0.06] border-cf-green/20'
                                : 'bg-cf-red/[0.06] border-cf-red/20'
                            }
                          `}
                        >
                          {verifyResult === 'match' ? (
                            <>
                              <CheckCircle2 className="w-6 h-6 text-cf-green shrink-0" />
                              <div>
                                <p className="text-sm font-semibold text-cf-green">
                                  Password Matches!
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  The password produces the same hash. Verification successful.
                                </p>
                              </div>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-6 h-6 text-cf-red shrink-0" />
                              <div>
                                <p className="text-sm font-semibold text-cf-red">
                                  Password Does Not Match
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  The password produces a different hash. Verification failed.
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    </div>
  );
}
