'use client';
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Code2, Copy, Check, Trash2, ArrowRightLeft, ClipboardPaste, FileJson, Braces, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  encodeBase64, decodeBase64, encodeBase32, decodeBase32,
  encodeBase58, decodeBase58, encodeHex, decodeHex,
  encodeBinary, decodeBinary, encodeURL, decodeURL,
  encodeHTML, decodeHTML, encodeUnicode, decodeUnicode,
  parseJWT
} from '@/lib/crypto';

type Mode = 'encode' | 'decode';

interface EncodingFormat {
  id: string;
  name: string;
  icon: typeof Code2;
  description: string;
  decodeOnly?: boolean;
}

const FORMATS: EncodingFormat[] = [
  { id: 'base64', name: 'Base64', icon: Code2, description: 'Binary-to-text encoding using 64-character alphabet' },
  { id: 'base32', name: 'Base32', icon: Code2, description: 'Binary-to-text encoding using 32-character alphabet' },
  { id: 'base58', name: 'Base58', icon: Code2, description: 'Binary-to-text encoding using 58-character alphabet, no ambiguous chars' },
  { id: 'hex', name: 'Hex', icon: Code2, description: 'Hexadecimal representation of binary data' },
  { id: 'binary', name: 'Binary', icon: Code2, description: 'Binary representation using 0s and 1s' },
  { id: 'url', name: 'URL Encoding', icon: Code2, description: 'Percent-encoding for URI components' },
  { id: 'html', name: 'HTML Encoding', icon: Code2, description: 'HTML entity encoding for special characters' },
  { id: 'unicode', name: 'Unicode Escape', icon: Code2, description: 'Unicode code point escape sequences (\\uXXXX)' },
  { id: 'jwt', name: 'JWT Parse', icon: FileJson, description: 'Decode JSON Web Token structure (header.payload.signature)', decodeOnly: true },
];

export function Encoding() {
  const [mode, setMode] = useState<Mode>('encode');
  const [selectedFormat, setSelectedFormat] = useState('base64');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [jwtParsed, setJwtParsed] = useState<{ header: string; payload: string; signature: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const currentFormat = FORMATS.find(f => f.id === selectedFormat);

  const handleProcess = useCallback(() => {
    if (!input.trim()) {
      setError('Please enter input data');
      return;
    }

    setIsProcessing(true);
    setError('');
    setOutput('');
    setJwtParsed(null);

    try {
      // Small delay for visual feedback
      setTimeout(() => {
        try {
          if (selectedFormat === 'jwt') {
            const result = parseJWT(input);
            if (result) {
              setJwtParsed(result);
              setOutput(`Header:\n${result.header}\n\nPayload:\n${result.payload}\n\nSignature:\n${result.signature}`);
            } else {
              setError('Invalid JWT format. Expected: header.payload.signature');
            }
          } else {
            let result: string;
            if (mode === 'encode') {
              switch (selectedFormat) {
                case 'base64': result = encodeBase64(input); break;
                case 'base32': result = encodeBase32(input); break;
                case 'base58': result = encodeBase58(input); break;
                case 'hex': result = encodeHex(input); break;
                case 'binary': result = encodeBinary(input); break;
                case 'url': result = encodeURL(input); break;
                case 'html': result = encodeHTML(input); break;
                case 'unicode': result = encodeUnicode(input); break;
                default: result = 'Error: Unknown format';
              }
            } else {
              switch (selectedFormat) {
                case 'base64': result = decodeBase64(input); break;
                case 'base32': result = decodeBase32(input); break;
                case 'base58': result = decodeBase58(input); break;
                case 'hex': result = decodeHex(input); break;
                case 'binary': result = decodeBinary(input); break;
                case 'url': result = decodeURL(input); break;
                case 'html': result = decodeHTML(input); break;
                case 'unicode': result = decodeUnicode(input); break;
                default: result = 'Error: Unknown format';
              }
            }

            if (result.startsWith('Error:')) {
              setError(result);
            } else {
              setOutput(result);
            }
          }
        } catch (e) {
          setError(e instanceof Error ? e.message : `${mode === 'encode' ? 'Encoding' : 'Decoding'} failed`);
        }
        setIsProcessing(false);
      }, 150);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Processing failed');
      setIsProcessing(false);
    }
  }, [input, mode, selectedFormat]);

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }, []);

  const pasteFromClipboard = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
      setError('');
    } catch {
      // clipboard access denied
    }
  }, []);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setJwtParsed(null);
    setError('');
  }, []);

  const handleModeChange = useCallback((newMode: Mode) => {
    setMode(newMode);
    setOutput('');
    setJwtParsed(null);
    setError('');
    // If switching to encode and current format is decode-only, switch to base64
    if (newMode === 'encode' && currentFormat?.decodeOnly) {
      setSelectedFormat('base64');
    }
  }, [currentFormat]);

  const handleFormatChange = useCallback((formatId: string) => {
    const format = FORMATS.find(f => f.id === formatId);
    if (format?.decodeOnly && mode === 'encode') {
      // Auto-switch to decode mode for decode-only formats
      setMode('decode');
    }
    setSelectedFormat(formatId);
    setOutput('');
    setJwtParsed(null);
    setError('');
  }, [mode]);

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
            <Code2 className="w-5 h-5 text-cf-blue" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground tracking-tight">Encoding &amp; Decoding</h2>
            <p className="text-sm text-muted-foreground">Encode and decode data between various formats</p>
          </div>
        </div>
      </motion.div>

      {/* Mode Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
      >
        <Card className="glass-card border-0">
          <CardContent className="py-4">
            <div className="flex items-center justify-center gap-4">
              <Label
                htmlFor="mode-toggle"
                className={`text-sm font-semibold cursor-pointer transition-colors ${mode === 'encode' ? 'text-cf-blue' : 'text-muted-foreground'}`}
              >
                Encode
              </Label>
              <div className="relative">
                <Switch
                  id="mode-toggle"
                  checked={mode === 'decode'}
                  onCheckedChange={(checked) => handleModeChange(checked ? 'decode' : 'encode')}
                  className="data-[state=checked]:bg-cf-cyan data-[state=unchecked]:bg-cf-blue"
                />
              </div>
              <Label
                htmlFor="mode-toggle"
                className={`text-sm font-semibold cursor-pointer transition-colors ${mode === 'decode' ? 'text-cf-cyan' : 'text-muted-foreground'}`}
              >
                Decode
              </Label>
              <div className="ml-2 flex items-center gap-1.5">
                <ArrowRightLeft className="w-4 h-4 text-muted-foreground/50" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Format Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="glass-card border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Select Format
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
              {FORMATS.map((format) => {
                const isDisabled = format.decodeOnly && mode === 'encode';
                const isSelected = selectedFormat === format.id;
                return (
                  <motion.button
                    key={format.id}
                    whileHover={!isDisabled ? { scale: 1.03 } : {}}
                    whileTap={!isDisabled ? { scale: 0.97 } : {}}
                    onClick={() => !isDisabled && handleFormatChange(format.id)}
                    disabled={isDisabled}
                    className={`
                      relative flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl text-center transition-all duration-200
                      ${isDisabled
                        ? 'bg-white/[0.02] border border-white/[0.04] cursor-not-allowed opacity-40'
                        : isSelected
                          ? 'bg-cf-blue/15 border border-cf-blue/30 shadow-lg shadow-cf-blue/10'
                          : 'bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.1] cursor-pointer'
                      }
                    `}
                  >
                    <format.icon className={`w-4 h-4 ${isSelected && !isDisabled ? 'text-cf-blue' : isDisabled ? 'text-muted-foreground/40' : 'text-muted-foreground'}`} />
                    <span className={`text-xs font-medium leading-tight ${isSelected && !isDisabled ? 'text-cf-blue' : isDisabled ? 'text-muted-foreground/50' : 'text-foreground'}`}>
                      {format.name}
                    </span>
                    {format.decodeOnly && (
                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 bg-cf-cyan/10 text-cf-cyan border-cf-cyan/20">
                        Decode
                      </Badge>
                    )}
                    {isSelected && !isDisabled && (
                      <motion.div
                        layoutId="format-indicator-enc"
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

      {/* Format Info Panel */}
      <AnimatePresence>
        {currentFormat && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="glass-card border-0 bg-cf-cyan/[0.03]">
              <CardContent className="py-3">
                <div className="flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-cf-cyan mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">{currentFormat.name}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{currentFormat.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="glass-card border-0">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Input
              </CardTitle>
              <div className="flex items-center gap-1.5">
                <Button
                  onClick={pasteFromClipboard}
                  variant="outline"
                  size="sm"
                  className="border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] text-muted-foreground hover:text-foreground h-7 text-xs"
                >
                  <ClipboardPaste className="w-3.5 h-3.5 mr-1" />
                  Paste
                </Button>
                <Button
                  onClick={handleClear}
                  variant="outline"
                  size="sm"
                  className="border-white/[0.08] bg-white/[0.03] hover:bg-cf-red/10 text-muted-foreground hover:text-cf-red h-7 text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  Clear
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              value={input}
              onChange={(e) => { setInput(e.target.value); setError(''); }}
              placeholder={
                mode === 'encode'
                  ? `Enter text to encode as ${currentFormat?.name ?? ''}...`
                  : selectedFormat === 'jwt'
                    ? 'Paste JWT token (e.g., eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...)'
                    : `Enter ${currentFormat?.name ?? ''} data to decode...`
              }
              className="min-h-[140px] bg-white/[0.03] border-white/[0.08] focus:border-cf-blue/40 focus:ring-cf-blue/20 text-foreground placeholder:text-muted-foreground/50 resize-none font-mono text-sm"
            />
            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground/60">
              <span>{input.length} characters</span>
              <span>{new TextEncoder().encode(input).length} bytes</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Process Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Button
          onClick={handleProcess}
          disabled={isProcessing || !input.trim()}
          className={`w-full h-12 font-semibold text-sm rounded-xl shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all ${
            mode === 'encode'
              ? 'bg-cf-blue hover:bg-cf-blue/90 text-white shadow-cf-blue/20'
              : 'bg-cf-cyan hover:bg-cf-cyan/90 text-white shadow-cf-cyan/20'
          }`}
        >
          {isProcessing ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="mr-2"
            >
              <ArrowRightLeft className="w-5 h-5" />
            </motion.div>
          ) : (
            <ArrowRightLeft className="w-5 h-5 mr-2" />
          )}
          {isProcessing
            ? 'Processing...'
            : mode === 'encode'
              ? `Encode to ${currentFormat?.name ?? ''}`
              : selectedFormat === 'jwt'
                ? 'Parse JWT'
                : `Decode from ${currentFormat?.name ?? ''}`
          }
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
                  <Info className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Output Section */}
      <AnimatePresence>
        {(output || jwtParsed) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="space-y-4"
          >
            {/* JWT Parsed View */}
            {jwtParsed && selectedFormat === 'jwt' ? (
              <div className="space-y-3">
                {/* Header Card */}
                <Card className="glass-card border-0">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <Braces className="w-4 h-4 text-cf-blue" />
                        Header
                      </CardTitle>
                      <Button
                        onClick={() => copyToClipboard(jwtParsed.header)}
                        variant="outline"
                        size="sm"
                        className="border-cf-cyan/20 bg-cf-cyan/5 hover:bg-cf-cyan/15 text-cf-cyan hover:text-cf-cyan h-7 text-xs"
                      >
                        <Copy className="w-3.5 h-3.5 mr-1" />
                        Copy
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 max-h-48 overflow-y-auto custom-scrollbar">
                      <pre className="result-display text-cf-blue break-all whitespace-pre-wrap">{jwtParsed.header}</pre>
                    </div>
                  </CardContent>
                </Card>

                {/* Payload Card */}
                <Card className="glass-card border-0">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <FileJson className="w-4 h-4 text-cf-cyan" />
                        Payload
                      </CardTitle>
                      <Button
                        onClick={() => copyToClipboard(jwtParsed.payload)}
                        variant="outline"
                        size="sm"
                        className="border-cf-cyan/20 bg-cf-cyan/5 hover:bg-cf-cyan/15 text-cf-cyan hover:text-cf-cyan h-7 text-xs"
                      >
                        <Copy className="w-3.5 h-3.5 mr-1" />
                        Copy
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 max-h-48 overflow-y-auto custom-scrollbar">
                      <pre className="result-display text-cf-cyan break-all whitespace-pre-wrap">{jwtParsed.payload}</pre>
                    </div>
                  </CardContent>
                </Card>

                {/* Signature Card */}
                <Card className="glass-card border-0">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <Code2 className="w-4 h-4 text-cf-green" />
                        Signature
                      </CardTitle>
                      <Button
                        onClick={() => copyToClipboard(jwtParsed.signature)}
                        variant="outline"
                        size="sm"
                        className="border-cf-cyan/20 bg-cf-cyan/5 hover:bg-cf-cyan/15 text-cf-cyan hover:text-cf-cyan h-7 text-xs"
                      >
                        <Copy className="w-3.5 h-3.5 mr-1" />
                        Copy
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
                      <p className="result-display text-cf-green break-all">{jwtParsed.signature}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              /* Standard Output */
              <Card className="glass-card border-0">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-cf-green" />
                      {mode === 'encode' ? 'Encoded' : 'Decoded'} Result
                    </CardTitle>
                    <Button
                      onClick={() => copyToClipboard(output)}
                      variant="outline"
                      size="sm"
                      className="border-cf-cyan/20 bg-cf-cyan/5 hover:bg-cf-cyan/15 text-cf-cyan hover:text-cf-cyan h-7 text-xs"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 mr-1 text-cf-green" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                      {copied ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 max-h-64 overflow-y-auto custom-scrollbar">
                    <p className="result-display text-muted-foreground break-all select-all whitespace-pre-wrap">{output}</p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground/60">
                    <span>{output.length} characters</span>
                    <span>{new TextEncoder().encode(output).length} bytes</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
