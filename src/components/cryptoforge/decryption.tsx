'use client';
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, Copy, Check, RefreshCw, KeyRound, Shield, AlertCircle, CheckCircle2, FileText, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { encryptAES, decryptAES, generateRandomBytes,
  encryptAesCtr, decryptAesCtr,
  encryptChaCha20Poly1305, decryptChaCha20Poly1305,
  encryptXChaCha20Poly1305, decryptXChaCha20Poly1305,
  encryptSalsa20, decryptSalsa20,
  encrypt3DES, decrypt3DES,
  encryptDES, decryptDES,
  encryptRC4, decryptRC4,
  encryptRabbit, decryptRabbit,
} from '@/lib/crypto';

interface AlgorithmOption {
  id: string;
  name: string;
  mode: 'AES-GCM' | 'AES-CBC' | 'AES-CTR' | 'ChaCha20-Poly1305' | 'XChaCha20-Poly1305' | 'Salsa20' | '3DES' | 'DES' | 'RC4' | 'Rabbit' | null;
  keySize: number;
  supported: boolean;
  badge?: string;
}

const ALGORITHMS: AlgorithmOption[] = [
  { id: 'aes-128-gcm', name: 'AES-128-GCM', mode: 'AES-GCM', keySize: 128, supported: true },
  { id: 'aes-256-gcm', name: 'AES-256-GCM', mode: 'AES-GCM', keySize: 256, supported: true },
  { id: 'aes-128-cbc', name: 'AES-128-CBC', mode: 'AES-CBC', keySize: 128, supported: true },
  { id: 'aes-256-cbc', name: 'AES-256-CBC', mode: 'AES-CBC', keySize: 256, supported: true },
  { id: 'aes-256-ctr', name: 'AES-256-CTR', mode: 'AES-CTR', keySize: 256, supported: true },
  { id: 'chacha20-poly1305', name: 'ChaCha20-Poly1305', mode: 'ChaCha20-Poly1305', keySize: 256, supported: true },
  { id: 'xchacha20-poly1305', name: 'XChaCha20-Poly1305', mode: 'XChaCha20-Poly1305', keySize: 256, supported: true },
  { id: 'salsa20', name: 'Salsa20', mode: 'Salsa20', keySize: 256, supported: true },
  { id: '3des', name: '3DES (Triple DES)', mode: '3DES', keySize: 192, supported: true },
  { id: 'des', name: 'DES (Legacy)', mode: 'DES', keySize: 64, supported: true },
  { id: 'rc4', name: 'RC4 (Legacy)', mode: 'RC4', keySize: 256, supported: true },
  { id: 'rabbit', name: 'Rabbit', mode: 'Rabbit', keySize: 128, supported: true },
];

function detectFormat(ciphertext: string): { format: string; confidence: number } {
  const trimmed = ciphertext.trim();
  if (!trimmed) return { format: 'Empty', confidence: 0 };

  // Check for Base64 (AES-GCM output)
  const isBase64 = /^[A-Za-z0-9+/]+=*$/.test(trimmed);
  // Check for hex:iv:base64 format (AES-CBC output)
  const hasColonSeparator = trimmed.includes(':');

  if (hasColonSeparator && isBase64) {
    const parts = trimmed.split(':');
    if (parts.length === 2 && /^[0-9a-fA-F]+$/.test(parts[0])) {
      return { format: 'AES-CBC (Hex IV : Base64 Ciphertext)', confidence: 95 };
    }
  }

  if (isBase64) {
    return { format: 'Base64 (AES-GCM with embedded IV)', confidence: 80 };
  }

  if (/^[0-9a-fA-F]+$/.test(trimmed)) {
    return { format: 'Hex encoded', confidence: 70 };
  }

  return { format: 'Unknown format', confidence: 30 };
}

export function Decryption() {
  const [selectedAlgo, setSelectedAlgo] = useState<string>('aes-256-gcm');
  const [ciphertext, setCiphertext] = useState('');
  const [key, setKey] = useState('');
  const [decryptedResult, setDecryptedResult] = useState('');
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [copiedResult, setCopiedResult] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [error, setError] = useState('');
  const [integrityCheck, setIntegrityCheck] = useState<'success' | 'failure' | null>(null);

  const currentAlgo = ALGORITHMS.find(a => a.id === selectedAlgo);
  const formatInfo = detectFormat(ciphertext);

  const handleDecrypt = useCallback(async () => {
    if (!ciphertext.trim()) {
      setError('Please enter ciphertext to decrypt');
      return;
    }
    if (!key.trim()) {
      setError('Please enter the decryption key');
      return;
    }
    if (!currentAlgo?.supported || !currentAlgo.mode) {
      setError('Selected algorithm is not yet supported');
      return;
    }

    setIsDecrypting(true);
    setError('');
    setDecryptedResult('');
    setIntegrityCheck(null);

    try {
      let result: string;

      switch (currentAlgo.id) {
        case 'aes-128-gcm':
        case 'aes-256-gcm':
          result = await decryptAES(ciphertext, key, 'AES-GCM');
          break;
        case 'aes-128-cbc':
        case 'aes-256-cbc':
          result = await decryptAES(ciphertext, key, 'AES-CBC');
          break;
        case 'aes-256-ctr':
          result = await decryptAesCtr(ciphertext, key);
          break;
        case 'chacha20-poly1305':
          result = await decryptChaCha20Poly1305(ciphertext, key);
          break;
        case 'xchacha20-poly1305':
          result = await decryptXChaCha20Poly1305(ciphertext, key);
          break;
        case 'salsa20':
          result = await decryptSalsa20(ciphertext, key);
          break;
        case '3des':
          result = decrypt3DES(ciphertext, key);
          break;
        case 'des':
          result = decryptDES(ciphertext, key);
          break;
        case 'rc4':
          result = decryptRC4(ciphertext, key);
          break;
        case 'rabbit':
          result = decryptRabbit(ciphertext, key);
          break;
        default:
          setError('Selected algorithm is not yet supported');
          return;
      }

      if (typeof result === 'string' && result.startsWith('Error:')) {
        setError(result.replace('Error: ', ''));
        setIntegrityCheck('failure');
      } else {
        setDecryptedResult(result);
        setIntegrityCheck('success');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Decryption failed');
      setIntegrityCheck('failure');
    } finally {
      setIsDecrypting(false);
    }
  }, [ciphertext, key, currentAlgo]);

  const copyToClipboard = useCallback(async (text: string, type: 'result' | 'key') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'result') {
        setCopiedResult(true);
        setTimeout(() => setCopiedResult(false), 2000);
      } else {
        setCopiedKey(true);
        setTimeout(() => setCopiedKey(false), 2000);
      }
    } catch {
      // fallback
    }
  }, []);

  const pasteFromClipboard = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      setKey(text);
    } catch {
      // clipboard access denied
    }
  }, []);

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
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-cf-cyan/10 border border-cf-cyan/20">
            <Unlock className="w-5 h-5 text-cf-cyan" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground tracking-tight">Decryption</h2>
            <p className="text-sm text-muted-foreground">Decrypt data using the corresponding algorithm and key</p>
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
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Select Algorithm</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {ALGORITHMS.map((algo) => (
                <motion.button
                  key={algo.id}
                  whileHover={algo.supported ? { scale: 1.03 } : {}}
                  whileTap={algo.supported ? { scale: 0.97 } : {}}
                  onClick={() => {
                    if (algo.supported) {
                      setSelectedAlgo(algo.id);
                      setDecryptedResult('');
                      setError('');
                      setIntegrityCheck(null);
                    }
                  }}
                  disabled={!algo.supported}
                  className={`
                    relative flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl text-center transition-all duration-200
                    ${!algo.supported
                      ? 'bg-white/[0.02] border border-white/[0.04] cursor-not-allowed opacity-50'
                      : selectedAlgo === algo.id
                        ? 'bg-cf-cyan/15 border border-cf-cyan/30 shadow-lg shadow-cf-cyan/10'
                        : 'bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.1] cursor-pointer'
                    }
                  `}
                >
                  <Shield className={`w-4 h-4 ${selectedAlgo === algo.id && algo.supported ? 'text-cf-cyan' : algo.supported ? 'text-muted-foreground' : 'text-muted-foreground/40'}`} />
                  <span className={`text-xs font-medium leading-tight ${selectedAlgo === algo.id && algo.supported ? 'text-cf-cyan' : algo.supported ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                    {algo.name}
                  </span>
                  {algo.badge && (
                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 bg-cf-cyan/10 text-cf-cyan border-cf-cyan/20">
                      {algo.badge}
                    </Badge>
                  )}
                  {selectedAlgo === algo.id && algo.supported && (
                    <motion.div
                      layoutId="algo-indicator-dec"
                      className="absolute -bottom-px left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-cf-cyan"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </motion.button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Input Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="glass-card border-0">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Ciphertext Input</CardTitle>
              {/* Auto-format detection */}
              {ciphertext.trim() && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-1.5"
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${formatInfo.confidence > 70 ? 'bg-cf-green' : formatInfo.confidence > 40 ? 'bg-cf-amber' : 'bg-cf-red'}`} />
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {formatInfo.format}
                  </span>
                </motion.div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              value={ciphertext}
              onChange={(e) => { setCiphertext(e.target.value); setError(''); setIntegrityCheck(null); }}
              placeholder="Paste encrypted ciphertext here (Base64 for AES-GCM, or HexIV:Base64 for AES-CBC)..."
              className="min-h-[120px] bg-white/[0.03] border-white/[0.08] focus:border-cf-cyan/40 focus:ring-cf-cyan/20 text-foreground placeholder:text-muted-foreground/50 resize-none font-mono text-sm"
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Key Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="glass-card border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <KeyRound className="w-4 h-4" />
              Decryption Key
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  value={key}
                  onChange={(e) => { setKey(e.target.value); setError(''); setIntegrityCheck(null); }}
                  placeholder="Enter the hex key used for encryption..."
                  className="bg-white/[0.03] border-white/[0.08] focus:border-cf-cyan/40 focus:ring-cf-cyan/20 text-foreground placeholder:text-muted-foreground/50 font-mono text-sm pr-10"
                />
                {key && (
                  <button
                    onClick={() => copyToClipboard(key, 'key')}
                    className="absolute right-10 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-cf-cyan transition-colors"
                  >
                    {copiedKey ? <Check className="w-4 h-4 text-cf-green" /> : <Copy className="w-4 h-4" />}
                  </button>
                )}
              </div>
              <Button
                onClick={pasteFromClipboard}
                variant="outline"
                className="border-cf-cyan/20 bg-cf-cyan/5 hover:bg-cf-cyan/15 text-cf-cyan hover:text-cf-cyan shrink-0"
              >
                <Copy className="w-4 h-4 mr-1.5" />
                Paste
              </Button>
            </div>

            {/* Key Info */}
            {key && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 text-xs text-muted-foreground mt-3"
              >
                <Shield className="w-3.5 h-3.5 text-cf-cyan" />
                <span>Key length: {key.length} hex chars ({key.length * 4} bits) | Algorithm: {currentAlgo?.name}</span>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Decrypt Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Button
          onClick={handleDecrypt}
          disabled={isDecrypting || !currentAlgo?.supported || !ciphertext.trim() || !key.trim()}
          className="w-full h-12 bg-cf-cyan hover:bg-cf-cyan/90 text-white font-semibold text-sm rounded-xl shadow-lg shadow-cf-cyan/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {isDecrypting ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <RefreshCw className="w-5 h-5 mr-2" />
            </motion.div>
          ) : (
            <Unlock className="w-5 h-5 mr-2" />
          )}
          {isDecrypting ? 'Decrypting...' : 'Decrypt Data'}
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
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result Section */}
      <AnimatePresence>
        {decryptedResult && (
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
                    Decrypted Result
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {/* Integrity Check Indicator */}
                    <AnimatePresence>
                      {integrityCheck && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                            integrityCheck === 'success'
                              ? 'bg-cf-green/10 text-cf-green border border-cf-green/20'
                              : 'bg-cf-red/10 text-cf-red border border-cf-red/20'
                          }`}
                        >
                          {integrityCheck === 'success' ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              Integrity Verified
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3 h-3" />
                              Integrity Failed
                            </>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <Button
                      onClick={() => copyToClipboard(decryptedResult, 'result')}
                      variant="outline"
                      size="sm"
                      className="border-cf-cyan/20 bg-cf-cyan/5 hover:bg-cf-cyan/15 text-cf-cyan hover:text-cf-cyan h-7 text-xs"
                    >
                      {copiedResult ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                      {copiedResult ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Decrypted Output */}
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 max-h-48 overflow-y-auto custom-scrollbar">
                  <p className="text-sm text-foreground break-all whitespace-pre-wrap select-all font-mono leading-relaxed">
                    {decryptedResult}
                  </p>
                </div>

                {/* Decryption Info */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Algorithm</p>
                    <p className="text-xs font-semibold text-foreground">{currentAlgo?.name}</p>
                  </div>
                  <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Mode</p>
                    <p className="text-xs font-semibold text-foreground">{currentAlgo?.mode}</p>
                  </div>
                  <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Integrity</p>
                    <p className={`text-xs font-semibold ${integrityCheck === 'success' ? 'text-cf-green' : 'text-cf-red'}`}>
                      {integrityCheck === 'success' ? 'Verified ✓' : 'Failed ✗'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
