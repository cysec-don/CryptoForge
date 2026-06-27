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

export function Encryption() {
  const [selectedAlgo, setSelectedAlgo] = useState<string>('aes-256-gcm');
  const [inputMode, setInputMode] = useState<'text' | 'file'>('text');
  const [plaintext, setPlaintext] = useState('');
  const [key, setKey] = useState('');
  const [keySize, setKeySize] = useState<'64' | '128' | '192' | '256'>('256');
  const [iv, setIv] = useState('');
  const [encryptedResult, setEncryptedResult] = useState('');
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [copiedResult, setCopiedResult] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedIv, setCopiedIv] = useState(false);
  const [error, setError] = useState('');
  const [fileContent, setFileContent] = useState('');

  const currentAlgo = ALGORITHMS.find(a => a.id === selectedAlgo);

  const generateKey = useCallback(() => {
    const bytesCount = parseInt(keySize) / 8;
    const newKey = generateRandomBytes(bytesCount);
    setKey(newKey);
    // Only generate a display IV for AES modes (those routed through encryptAES);
    // other algorithms auto-generate their own nonces internally.
    if (currentAlgo?.mode === 'AES-GCM' || currentAlgo?.mode === 'AES-CBC') {
      const newIv = currentAlgo.mode === 'AES-GCM'
        ? generateRandomBytes(12)
        : generateRandomBytes(16);
      setIv(newIv);
    } else {
      setIv('');
    }
  }, [keySize, currentAlgo]);

  const handleEncrypt = useCallback(async () => {
    if (!plaintext.trim() && inputMode === 'text') {
      setError('Please enter plaintext to encrypt');
      return;
    }
    if (!key.trim()) {
      setError('Please enter or generate an encryption key');
      return;
    }
    if (!currentAlgo?.supported || !currentAlgo.mode) {
      setError('Selected algorithm is not yet supported');
      return;
    }

    setIsEncrypting(true);
    setError('');
    setEncryptedResult('');

    try {
      const input = inputMode === 'file' ? fileContent : plaintext;
      let result: string;

      switch (currentAlgo.id) {
        case 'aes-128-gcm':
        case 'aes-256-gcm':
          result = await encryptAES(input, key, 'AES-GCM');
          break;
        case 'aes-128-cbc':
        case 'aes-256-cbc':
          result = await encryptAES(input, key, 'AES-CBC');
          break;
        case 'aes-256-ctr':
          result = await encryptAesCtr(input, key);
          break;
        case 'chacha20-poly1305':
          result = await encryptChaCha20Poly1305(input, key);
          break;
        case 'xchacha20-poly1305':
          result = await encryptXChaCha20Poly1305(input, key);
          break;
        case 'salsa20':
          result = await encryptSalsa20(input, key);
          break;
        case '3des':
          result = encrypt3DES(input, key);
          break;
        case 'des':
          result = encryptDES(input, key);
          break;
        case 'rc4':
          result = encryptRC4(input, key);
          break;
        case 'rabbit':
          result = encryptRabbit(input, key);
          break;
        default:
          setError('Selected algorithm is not yet supported');
          return;
      }

      if (typeof result === 'string' && result.startsWith('Error:')) {
        setError(result);
      } else {
        setEncryptedResult(result);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Encryption failed');
    } finally {
      setIsEncrypting(false);
    }
  }, [plaintext, key, currentAlgo, inputMode, fileContent]);

  const copyToClipboard = useCallback(async (text: string, type: 'result' | 'key' | 'iv') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'result') {
        setCopiedResult(true);
        setTimeout(() => setCopiedResult(false), 2000);
      } else if (type === 'key') {
        setCopiedKey(true);
        setTimeout(() => setCopiedKey(false), 2000);
      } else {
        setCopiedIv(true);
        setTimeout(() => setCopiedIv(false), 2000);
      }
    } catch {
      // fallback
    }
  }, []);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const content = ev.target?.result as string;
        setFileContent(content);
        setPlaintext(file.name);
      };
      reader.readAsText(file);
    }
  }, []);

  const algoKeySize = currentAlgo?.keySize ?? 256;

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
            <Lock className="w-5 h-5 text-cf-blue" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground tracking-tight">Encryption</h2>
            <p className="text-sm text-muted-foreground">Encrypt data using industry-standard symmetric algorithms</p>
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
                      setKeySize(String(algo.keySize) as '64' | '128' | '192' | '256');
                      setEncryptedResult('');
                      setError('');
                      setIv('');
                    }
                  }}
                  disabled={!algo.supported}
                  className={`
                    relative flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl text-center transition-all duration-200
                    ${!algo.supported
                      ? 'bg-white/[0.02] border border-white/[0.04] cursor-not-allowed opacity-50'
                      : selectedAlgo === algo.id
                        ? 'bg-cf-blue/15 border border-cf-blue/30 shadow-lg shadow-cf-blue/10'
                        : 'bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.1] cursor-pointer'
                    }
                  `}
                >
                  <Shield className={`w-4 h-4 ${selectedAlgo === algo.id && algo.supported ? 'text-cf-blue' : algo.supported ? 'text-muted-foreground' : 'text-muted-foreground/40'}`} />
                  <span className={`text-xs font-medium leading-tight ${selectedAlgo === algo.id && algo.supported ? 'text-cf-blue' : algo.supported ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                    {algo.name}
                  </span>
                  {algo.badge && (
                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 bg-cf-cyan/10 text-cf-cyan border-cf-cyan/20">
                      {algo.badge}
                    </Badge>
                  )}
                  {selectedAlgo === algo.id && algo.supported && (
                    <motion.div
                      layoutId="algo-indicator-enc"
                      className="absolute -bottom-px left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-cf-blue"
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
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Input</CardTitle>
              <div className="flex items-center gap-1 bg-white/[0.03] rounded-lg p-0.5 border border-white/[0.06]">
                <button
                  onClick={() => setInputMode('text')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    inputMode === 'text'
                      ? 'bg-cf-blue/15 text-cf-blue border border-cf-blue/20'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Type className="w-3.5 h-3.5" />
                  Text
                </button>
                <button
                  onClick={() => setInputMode('file')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    inputMode === 'file'
                      ? 'bg-cf-blue/15 text-cf-blue border border-cf-blue/20'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  File
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              {inputMode === 'text' ? (
                <motion.div
                  key="text-input"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Textarea
                    value={plaintext}
                    onChange={(e) => { setPlaintext(e.target.value); setError(''); }}
                    placeholder="Enter plaintext to encrypt..."
                    className="min-h-[120px] bg-white/[0.03] border-white/[0.08] focus:border-cf-blue/40 focus:ring-cf-blue/20 text-foreground placeholder:text-muted-foreground/50 resize-none font-mono text-sm"
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="file-input"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-3"
                >
                  <label className="flex flex-col items-center justify-center w-full min-h-[120px] border-2 border-dashed border-white/[0.08] rounded-xl cursor-pointer hover:border-cf-blue/30 hover:bg-cf-blue/[0.02] transition-all">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <FileText className="w-8 h-8 text-muted-foreground/50 mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {fileContent ? plaintext : 'Click to select a file'}
                      </p>
                      <p className="text-xs text-muted-foreground/50 mt-1">Text files only</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept=".txt,.csv,.json,.xml,.html"
                      onChange={handleFileUpload}
                    />
                  </label>
                </motion.div>
              )}
            </AnimatePresence>
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
              Encryption Key
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Key Input */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  value={key}
                  onChange={(e) => { setKey(e.target.value); setError(''); }}
                  placeholder="Enter hex key or generate random..."
                  className="bg-white/[0.03] border-white/[0.08] focus:border-cf-blue/40 focus:ring-cf-blue/20 text-foreground placeholder:text-muted-foreground/50 font-mono text-sm pr-10"
                />
                {key && (
                  <button
                    onClick={() => copyToClipboard(key, 'key')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-cf-cyan transition-colors"
                  >
                    {copiedKey ? <Check className="w-4 h-4 text-cf-green" /> : <Copy className="w-4 h-4" />}
                  </button>
                )}
              </div>
              <Button
                onClick={generateKey}
                variant="outline"
                className="border-cf-cyan/20 bg-cf-cyan/5 hover:bg-cf-cyan/15 text-cf-cyan hover:text-cf-cyan shrink-0"
              >
                <RefreshCw className="w-4 h-4 mr-1.5" />
                Generate
              </Button>
            </div>

            {/* Key Size Selector & IV Display */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Key Size */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Key Size</label>
                <Select value={keySize} onValueChange={(v) => setKeySize(v as '64' | '128' | '192' | '256')}>
                  <SelectTrigger className="bg-white/[0.03] border-white/[0.08] focus:border-cf-blue/40 text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a2e] border-white/[0.08]">
                    <SelectItem value="64">64-bit</SelectItem>
                    <SelectItem value="128">128-bit</SelectItem>
                    <SelectItem value="192">192-bit</SelectItem>
                    <SelectItem value="256">256-bit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* IV / Nonce */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                  <span>{currentAlgo?.mode === 'AES-GCM' ? 'IV (Nonce)' : currentAlgo?.mode === 'AES-CBC' ? 'IV' : 'Nonce'}</span>
                  {iv && (
                    <button
                      onClick={() => copyToClipboard(iv, 'iv')}
                      className="text-muted-foreground hover:text-cf-cyan transition-colors"
                    >
                      {copiedIv ? <Check className="w-3 h-3 text-cf-green" /> : <Copy className="w-3 h-3" />}
                    </button>
                  )}
                </label>
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-md px-3 py-2 font-mono text-xs text-muted-foreground truncate">
                  {iv || 'Auto-generated on encrypt'}
                </div>
              </div>
            </div>

            {/* Key Info */}
            {key && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 text-xs text-muted-foreground"
              >
                <Shield className="w-3.5 h-3.5 text-cf-blue" />
                <span>Key length: {key.length} hex chars ({key.length * 4} bits) | Algorithm: {currentAlgo?.name}</span>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Encrypt Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Button
          onClick={handleEncrypt}
          disabled={isEncrypting || !currentAlgo?.supported || (!plaintext.trim() && inputMode === 'text') || !key.trim()}
          className="w-full h-12 bg-cf-blue hover:bg-cf-blue/90 text-white font-semibold text-sm rounded-xl shadow-lg shadow-cf-blue/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {isEncrypting ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <RefreshCw className="w-5 h-5 mr-2" />
            </motion.div>
          ) : (
            <Lock className="w-5 h-5 mr-2" />
          )}
          {isEncrypting ? 'Encrypting...' : 'Encrypt Data'}
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
        {encryptedResult && (
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
                    Encrypted Result
                  </CardTitle>
                  <Button
                    onClick={() => copyToClipboard(encryptedResult, 'result')}
                    variant="outline"
                    size="sm"
                    className="border-cf-cyan/20 bg-cf-cyan/5 hover:bg-cf-cyan/15 text-cf-cyan hover:text-cf-cyan h-7 text-xs"
                  >
                    {copiedResult ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                    {copiedResult ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Encrypted Output */}
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 max-h-48 overflow-y-auto custom-scrollbar">
                  <p className="result-display text-muted-foreground break-all select-all">
                    {encryptedResult}
                  </p>
                </div>

                {/* Key Info Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Algorithm</p>
                    <p className="text-xs font-semibold text-foreground">{currentAlgo?.name}</p>
                  </div>
                  <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Mode</p>
                    <p className="text-xs font-semibold text-foreground">{currentAlgo?.mode}</p>
                  </div>
                  <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Key Size</p>
                    <p className="text-xs font-semibold text-foreground">{algoKeySize}-bit</p>
                  </div>
                  <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Output</p>
                    <p className="text-xs font-semibold text-foreground">Base64</p>
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
