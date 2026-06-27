'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckSquare,
  Copy,
  Check,
  Trash2,
  Download,
  Hash,
  Loader2,
  Type,
  Zap,
  Cpu,
  Binary,
  Hash as HashIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  computeCRC32,
  computeCRC64,
  computeAdler32,
  computeFletcher16,
  computeFletcher32,
  computeFletcher64,
  computeFNV1,
  computeFNV1a,
  computeMurmurHash3,
  computePearson,
  computeSipHash,
  computeHashAsync,
} from '@/lib/crypto';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChecksumDef {
  id: string;
  name: string;
  description: string;
  size: number; // output bit width
  category: 'CRC' | 'Fletcher' | 'FNV' | 'Hash' | 'Other';
  icon: React.ElementType;
  /** Compute function — sync or async, returns hex string. */
  compute: (input: string) => string | Promise<string>;
}

interface ChecksumResult {
  id: string;
  name: string;
  hex: string;
  bits: number;
  durationMs: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ALGORITHMS: ChecksumDef[] = [
  {
    id: 'crc32',
    name: 'CRC32',
    description: 'Cyclic redundancy check (IEEE 802.3)',
    size: 32,
    category: 'CRC',
    icon: Hash,
    compute: (s) => computeCRC32(s),
  },
  {
    id: 'crc64',
    name: 'CRC64',
    description: 'CRC-64 with ECMA-182 polynomial',
    size: 64,
    category: 'CRC',
    icon: Hash,
    compute: (s) => computeCRC64(s),
  },
  {
    id: 'adler32',
    name: 'Adler-32',
    description: 'Zlib checksum (sums + mod)',
    size: 32,
    category: 'Other',
    icon: Hash,
    compute: (s) => computeAdler32(s),
  },
  {
    id: 'fletcher16',
    name: 'Fletcher-16',
    description: 'Fletcher checksum, 16-bit',
    size: 16,
    category: 'Fletcher',
    icon: Hash,
    compute: (s) => computeFletcher16(s),
  },
  {
    id: 'fletcher32',
    name: 'Fletcher-32',
    description: 'Fletcher checksum, 32-bit',
    size: 32,
    category: 'Fletcher',
    icon: Hash,
    compute: (s) => computeFletcher32(s),
  },
  {
    id: 'fletcher64',
    name: 'Fletcher-64',
    description: 'Fletcher checksum, 64-bit',
    size: 64,
    category: 'Fletcher',
    icon: Hash,
    compute: (s) => computeFletcher64(s),
  },
  {
    id: 'fnv1',
    name: 'FNV-1',
    description: 'Fowler–Noll–Vo (32-bit)',
    size: 32,
    category: 'FNV',
    icon: Hash,
    compute: (s) => computeFNV1(s),
  },
  {
    id: 'fnv1a',
    name: 'FNV-1a',
    description: 'FNV-1a variant (32-bit)',
    size: 32,
    category: 'FNV',
    icon: Hash,
    compute: (s) => computeFNV1a(s),
  },
  {
    id: 'murmur3',
    name: 'MurmurHash3',
    description: 'Non-cryptographic 32-bit hash',
    size: 32,
    category: 'Hash',
    icon: Cpu,
    compute: (s) => computeMurmurHash3(s),
  },
  {
    id: 'pearson',
    name: 'Pearson',
    description: 'Byte-oriented lookup-table hash',
    size: 8,
    category: 'Hash',
    icon: Binary,
    compute: (s) => computePearson(s),
  },
  {
    id: 'siphash',
    name: 'SipHash',
    description: 'SipHash-2-4 (PRF, 64-bit)',
    size: 64,
    category: 'Hash',
    icon: Zap,
    compute: (s) => computeSipHash(s),
  },
  {
    id: 'xxhash32',
    name: 'xxHash32',
    description: 'Extremely fast 32-bit hash',
    size: 32,
    category: 'Hash',
    icon: Zap,
    compute: async (s) => computeHashAsync('xxHash32', s),
  },
  {
    id: 'xxhash64',
    name: 'xxHash64',
    description: 'Extremely fast 64-bit hash',
    size: 64,
    category: 'Hash',
    icon: Zap,
    compute: async (s) => computeHashAsync('xxHash64', s),
  },
  {
    id: 'xxhash3',
    name: 'xxHash3',
    description: 'Modern, vectorised, variable-width',
    size: 64,
    category: 'Hash',
    icon: Zap,
    compute: async (s) => computeHashAsync('xxHash3', s),
  },
];

const CATEGORY_COLORS: Record<
  ChecksumDef['category'],
  { text: string; bg: string; border: string }
> = {
  CRC: { text: 'text-cf-blue', bg: 'bg-cf-blue/10', border: 'border-cf-blue/30' },
  Fletcher: { text: 'text-cf-cyan', bg: 'bg-cf-cyan/10', border: 'border-cf-cyan/30' },
  FNV: { text: 'text-cf-green', bg: 'bg-cf-green/10', border: 'border-cf-green/30' },
  Hash: { text: 'text-cf-amber', bg: 'bg-cf-amber/10', border: 'border-cf-amber/30' },
  Other: { text: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
};

// ─── Animation Variants ───────────────────────────────────────────────────────

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.05 } },
};

const rowVariants = {
  initial: { opacity: 0, x: -8 },
  animate: { opacity: 1, x: 0 },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function Checksums() {
  const [input, setInput] = useState('');
  const [results, setResults] = useState<ChecksumResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState('');

  // ── Derived ──────────────────────────────────────────────────────────────

  const inputByteCount = useMemo(() => {
    if (!input) return 0;
    return new TextEncoder().encode(input).length;
  }, [input]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleClear = useCallback(() => {
    setInput('');
    setResults([]);
    setError('');
  }, []);

  const copyToClipboard = useCallback(
    async (text: string, id: string) => {
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
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    },
    []
  );

  const handleGenerateAll = useCallback(async () => {
    if (!input.trim()) {
      setError('Please enter some input text first');
      return;
    }
    setIsGenerating(true);
    setError('');
    setResults([]);

    // Yield to the event loop so the spinner can render before the heavy work.
    await new Promise((r) => setTimeout(r, 30));

    const newResults: ChecksumResult[] = [];
    for (const algo of ALGORITHMS) {
      const start = performance.now();
      try {
        const hex = await algo.compute(input);
        const durationMs = performance.now() - start;
        newResults.push({
          id: algo.id,
          name: algo.name,
          hex,
          bits: algo.size,
          durationMs,
        });
      } catch (e) {
        newResults.push({
          id: algo.id,
          name: algo.name,
          hex: `Error: ${e instanceof Error ? e.message : 'failed'}`,
          bits: algo.size,
          durationMs: performance.now() - start,
        });
      }
    }
    setResults(newResults);
    setIsGenerating(false);
  }, [input]);

  const handleExport = useCallback(() => {
    if (results.length === 0) return;
    const data = {
      tool: 'CryptoForge Checksums',
      timestamp: new Date().toISOString(),
      input,
      inputBytes: inputByteCount,
      results: results.map((r) => ({
        algorithm: r.name,
        bits: r.bits,
        hex: r.hex,
        durationMs: Number(r.durationMs.toFixed(3)),
      })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `checksums-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [results, input, inputByteCount]);

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
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cf-cyan/10 border border-cf-cyan/20">
          <CheckSquare className="h-6 w-6 text-cf-cyan" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">
            Checksums
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Compute non-cryptographic checksums and hashes for data integrity
          </p>
        </div>
      </motion.div>

      {/* ── Input Section ─────────────────────────────────────────────── */}
      <motion.div variants={fadeInUp}>
        <Card className="glass-card rounded-xl border-0">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Type className="h-4 w-4 text-cf-blue" />
                Input Data
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="text-[10px] border-white/10 text-muted-foreground font-mono"
                >
                  {input.length} chars
                </Badge>
                <Badge
                  variant="outline"
                  className="text-[10px] border-white/10 text-muted-foreground font-mono"
                >
                  {inputByteCount} bytes
                </Badge>
                {input && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClear}
                    className="h-8 text-xs text-muted-foreground hover:text-cf-red"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter text to compute checksums for…"
              className="min-h-[120px] bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground/40 focus:border-cf-cyan/50 focus:ring-cf-cyan/20 resize-y custom-scrollbar"
            />
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-4">
              <Button
                onClick={handleGenerateAll}
                disabled={isGenerating || !input.trim()}
                className="flex-1 bg-cf-cyan hover:bg-cf-cyan/90 text-white font-medium py-5 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {isGenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="mr-2 h-4 w-4" />
                )}
                {isGenerating
                  ? 'Computing all checksums…'
                  : `Generate All (${ALGORITHMS.length} algorithms)`}
              </Button>
              <Button
                variant="outline"
                onClick={handleExport}
                disabled={results.length === 0}
                className="sm:flex-shrink-0 bg-white/5 border-white/10 text-muted-foreground hover:text-cf-green hover:border-cf-green/30 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Download className="mr-2 h-4 w-4" />
                Export JSON
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Error ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <Card className="glass-card rounded-xl border-cf-red/30">
              <CardContent className="p-4 flex items-center gap-3">
                <span className="text-sm text-cf-red">{error}</span>
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

      {/* ── Algorithm Grid ────────────────────────────────────────────── */}
      <motion.div variants={fadeInUp}>
        <Card className="glass-card rounded-xl border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <HashIcon className="h-4 w-4 text-cf-cyan" />
              Available Algorithms
              <Badge
                variant="outline"
                className="text-[10px] border-white/10 text-muted-foreground ml-1"
              >
                {ALGORITHMS.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {ALGORITHMS.map((algo, i) => {
                const Icon = algo.icon;
                const cat = CATEGORY_COLORS[algo.category];
                const result = results.find((r) => r.id === algo.id);
                return (
                  <motion.div
                    key={algo.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.03 }}
                    whileHover={{ y: -2 }}
                    className="glass-card rounded-xl p-3 border border-white/[0.06] hover:border-white/[0.12] transition-all"
                  >
                    <div className="flex items-start gap-2">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${cat.bg} border ${cat.border}`}
                      >
                        <Icon className={`h-4 w-4 ${cat.text}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold text-foreground truncate">
                            {algo.name}
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-[9px] px-1.5 py-0 h-4 ${cat.bg} ${cat.text} ${cat.border} border`}
                          >
                            {algo.size}-bit
                          </Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                          {algo.description}
                        </p>
                      </div>
                    </div>
                    {result && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-2 pt-2 border-t border-white/[0.04]"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <code className="text-[10px] font-mono text-cf-cyan truncate">
                            {result.hex.length > 20
                              ? result.hex.slice(0, 18) + '…'
                              : result.hex}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(result.hex, result.id)}
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground shrink-0"
                          >
                            {copiedId === result.id ? (
                              <Check className="h-3 w-3 text-cf-green" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Results Table ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="glass-card rounded-xl border-0">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-cf-green" />
                    Results
                    <Badge
                      variant="outline"
                      className="text-[10px] border-cf-green/30 text-cf-green bg-cf-green/10"
                    >
                      {results.length} computed
                    </Badge>
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(
                      results
                        .map((r) => `${r.name}: ${r.hex}`)
                        .join('\n'),
                      '__all__'
                    )}
                    className="h-8 text-xs text-muted-foreground hover:text-foreground"
                  >
                    {copiedId === '__all__' ? (
                      <Check className="h-3.5 w-3.5 text-cf-green mr-1" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 mr-1" />
                    )}
                    Copy All
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto custom-scrollbar">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/[0.06] hover:bg-transparent">
                        <TableHead className="text-[11px] uppercase tracking-wider text-muted-foreground pl-6">
                          Algorithm
                        </TableHead>
                        <TableHead className="text-[11px] uppercase tracking-wider text-muted-foreground">
                          Size
                        </TableHead>
                        <TableHead className="text-[11px] uppercase tracking-wider text-muted-foreground">
                          Hex Value
                        </TableHead>
                        <TableHead className="text-[11px] uppercase tracking-wider text-muted-foreground text-right pr-6 w-[120px]">
                          Time / Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <motion.tbody
                        variants={stagger}
                        initial="initial"
                        animate="animate"
                      >
                        {results.map((r) => {
                          const def = ALGORITHMS.find((a) => a.id === r.id);
                          const cat = def
                            ? CATEGORY_COLORS[def.category]
                            : CATEGORY_COLORS.Other;
                          const isError = r.hex.startsWith('Error:');
                          return (
                            <motion.tr
                              key={r.id}
                              variants={rowVariants}
                              transition={{ duration: 0.25 }}
                              className="border-white/[0.04] hover:bg-white/[0.02] group"
                            >
                              <TableCell className="pl-6 py-3">
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`h-1.5 w-1.5 rounded-full ${cat.bg.replace('/10', '')}`}
                                  />
                                  <span className="text-sm font-medium text-foreground">
                                    {r.name}
                                  </span>
                                  {def && (
                                    <Badge
                                      variant="outline"
                                      className={`text-[9px] px-1.5 py-0 h-3.5 ${cat.bg} ${cat.text} ${cat.border} border hidden sm:inline-flex`}
                                    >
                                      {def.category}
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="py-3">
                                <Badge
                                  variant="outline"
                                  className="text-[10px] border-white/10 text-muted-foreground font-mono"
                                >
                                  {r.bits}b
                                </Badge>
                              </TableCell>
                              <TableCell className="py-3">
                                <code
                                  className={`text-xs font-mono break-all ${
                                    isError ? 'text-cf-red' : 'text-cf-cyan'
                                  }`}
                                >
                                  {r.hex}
                                </code>
                              </TableCell>
                              <TableCell className="pr-6 py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <span className="text-[10px] text-muted-foreground/60 font-mono hidden sm:inline">
                                    {r.durationMs.toFixed(2)}ms
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(r.hex, r.id)}
                                    disabled={isError}
                                    className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground opacity-60 group-hover:opacity-100 transition-opacity disabled:opacity-30"
                                  >
                                    {copiedId === r.id ? (
                                      <Check className="h-3.5 w-3.5 text-cf-green" />
                                    ) : (
                                      <Copy className="h-3.5 w-3.5" />
                                    )}
                                  </Button>
                                </div>
                              </TableCell>
                            </motion.tr>
                          );
                        })}
                      </motion.tbody>
                    </TableBody>
                  </Table>
                </div>

                {/* Summary */}
                <div className="px-6 py-3 border-t border-white/[0.06] flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span>
                      Total:{' '}
                      <span className="text-foreground font-mono">
                        {results.reduce((acc, r) => acc + r.durationMs, 0).toFixed(2)}ms
                      </span>
                    </span>
                    <span className="text-muted-foreground/40">·</span>
                    <span>
                      Input:{' '}
                      <span className="text-foreground font-mono">
                        {inputByteCount} bytes
                      </span>
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExport}
                    className="h-7 text-xs bg-white/5 border-white/10 text-muted-foreground hover:text-cf-green hover:border-cf-green/30"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Export Results
                  </Button>
                </div>
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
              <HashIcon className="h-5 w-5 text-cf-amber shrink-0 mt-px" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  About non-cryptographic checksums
                </p>
                <p className="text-xs text-muted-foreground">
                  These algorithms are <span className="text-cf-amber">not</span>{' '}
                  suitable for security purposes — they are designed for speed and
                  collision-resistance against accidental corruption, not adversarial
                  inputs. Use SHA-256 or stronger from the Hashing module for any
                  security-sensitive use case.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
