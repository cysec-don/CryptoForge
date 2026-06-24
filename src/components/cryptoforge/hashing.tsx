'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Hash,
  Copy,
  Check,
  Download,
  Trash2,
  ChevronDown,
  ChevronUp,
  FileText,
  Type,
  GitCompareArrows,
  History,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  computeHash,
  HASH_ALGORITHMS,
  type HashAlgorithm,
} from '@/lib/crypto';

// ─── Types ────────────────────────────────────────────────────────────────────

interface HashResult {
  algorithm: HashAlgorithm;
  hash: string;
}

interface HistoryEntry {
  id: string;
  timestamp: Date;
  inputPreview: string;
  algorithms: string[];
  results: HashResult[];
}

type SecurityLevel = HashAlgorithm['security'];
type InputMode = 'text' | 'file';
type CategoryTab = 'All' | 'SHA-2' | 'SHA-3' | 'MD' | 'CRC' | 'Other';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_TABS: CategoryTab[] = [
  'All',
  'SHA-2',
  'SHA-3',
  'MD',
  'CRC',
  'Other',
];

const SECURITY_CONFIG: Record<
  SecurityLevel,
  { label: string; color: string; bgColor: string; borderColor: string }
> = {
  broken: {
    label: 'Broken',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
  },
  weak: {
    label: 'Weak',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
  },
  moderate: {
    label: 'Moderate',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/20',
  },
  strong: {
    label: 'Strong',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
  },
  'very-strong': {
    label: 'Very Strong',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/20',
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function filterByCategory(
  algorithms: HashAlgorithm[],
  category: CategoryTab
): HashAlgorithm[] {
  if (category === 'All') return algorithms;
  if (category === 'Other') {
    const known = new Set(['SHA-2', 'SHA-3', 'MD', 'CRC']);
    return algorithms.filter((a) => !known.has(a.category));
  }
  return algorithms.filter((a) => a.category === category);
}

function truncateMiddle(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  const half = Math.floor(maxLen / 2);
  return str.slice(0, half) + '...' + str.slice(str.length - half);
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Hashing() {
  // ── State ──
  const [inputText, setInputText] = useState('');
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [selectedAlgorithms, setSelectedAlgorithms] = useState<Set<string>>(
    new Set(['SHA256'])
  );
  const [activeCategory, setActiveCategory] = useState<CategoryTab>('All');
  const [hashResults, setHashResults] = useState<HashResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  // Comparison
  const [showComparison, setShowComparison] = useState(false);
  const [compareHash, setCompareHash] = useState('');

  // History
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Drag state
  const [isDragOver, setIsDragOver] = useState(false);

  // ── Derived ──
  const filteredAlgorithms = filterByCategory(
    HASH_ALGORITHMS,
    activeCategory
  );
  const allFilteredSelected =
    filteredAlgorithms.length > 0 &&
    filteredAlgorithms.every((a) => selectedAlgorithms.has(a.name));

  // ── Handlers ──

  const toggleAlgorithm = useCallback((name: string) => {
    setSelectedAlgorithms((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  const selectAllFiltered = useCallback(() => {
    setSelectedAlgorithms((prev) => {
      const next = new Set(prev);
      filteredAlgorithms.forEach((a) => next.add(a.name));
      return next;
    });
  }, [filteredAlgorithms]);

  const deselectAllFiltered = useCallback(() => {
    setSelectedAlgorithms((prev) => {
      const next = new Set(prev);
      filteredAlgorithms.forEach((a) => next.delete(a.name));
      return next;
    });
  }, [filteredAlgorithms]);

  const clearInput = useCallback(() => {
    setInputText('');
    setHashResults([]);
  }, []);

  const generateHashes = useCallback(() => {
    if (!inputText.trim() || selectedAlgorithms.size === 0) return;

    setIsGenerating(true);

    // Simulate brief processing delay for UX
    setTimeout(() => {
      const results: HashResult[] = [];
      for (const algo of HASH_ALGORITHMS) {
        if (selectedAlgorithms.has(algo.name)) {
          results.push({
            algorithm: algo,
            hash: computeHash(algo.name, inputText),
          });
        }
      }

      setHashResults(results);
      setIsGenerating(false);

      // Add to history
      const entry: HistoryEntry = {
        id: Date.now().toString(),
        timestamp: new Date(),
        inputPreview:
          inputText.length > 60 ? inputText.slice(0, 60) + '...' : inputText,
        algorithms: results.map((r) => r.algorithm.name),
        results,
      };
      setHistory((prev) => [entry, ...prev].slice(0, 20));
    }, 300);
  }, [inputText, selectedAlgorithms]);

  const copyToClipboard = useCallback(
    async (text: string, id: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      } catch {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      }
    },
    []
  );

  const copyAll = useCallback(async () => {
    if (hashResults.length === 0) return;
    const text = hashResults
      .map((r) => `${r.algorithm.name}: ${r.hash}`)
      .join('\n');
    await copyToClipboard(text, '__all__');
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  }, [hashResults, copyToClipboard]);

  const exportResults = useCallback(() => {
    if (hashResults.length === 0) return;
    const data = {
      input: inputText,
      timestamp: new Date().toISOString(),
      results: hashResults.map((r) => ({
        algorithm: r.algorithm.name,
        category: r.algorithm.category,
        outputSize: r.algorithm.outputSize,
        security: r.algorithm.security,
        hash: r.hash,
      })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hash-results-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [hashResults, inputText]);

  const loadFromHistory = useCallback((entry: HistoryEntry) => {
    setInputText(entry.inputPreview.replace('...', ''));
    setHashResults(entry.results);
    setSelectedAlgorithms(new Set(entry.algorithms));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  // ── Drag handlers ──
  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (inputMode === 'file') setIsDragOver(true);
    },
    [inputMode]
  );

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (inputMode === 'file') {
        const files = e.dataTransfer.files;
        if (files.length > 0) {
          setInputText(`[File: ${files[0].name}]`);
        }
      }
    },
    [inputMode]
  );

  // ── Render ──

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 p-4 md:p-6">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-2"
      >
        <div className="flex items-center justify-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-600/10 border border-blue-500/20">
            <Hash className="w-6 h-6 text-blue-400" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold gradient-text">
            Hash Generation
          </h1>
        </div>
        <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto">
          Generate cryptographic hashes using multiple algorithms simultaneously.
          Compare results, verify integrity, and export your findings.
        </p>
      </motion.div>

      {/* ── Input Section ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="glass-card border-0">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <Type className="w-4 h-4 text-cf-blue" />
                Input Data
              </CardTitle>
              <div className="flex items-center gap-2">
                {/* Input mode toggle */}
                <div className="flex items-center rounded-lg bg-white/5 border border-white/10 p-0.5">
                  <button
                    onClick={() => setInputMode('text')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      inputMode === 'text'
                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Type className="w-3.5 h-3.5" />
                    Text Input
                  </button>
                  <button
                    onClick={() => setInputMode('file')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      inputMode === 'file'
                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    File Input
                  </button>
                </div>
                {inputText && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearInput}
                    className="h-8 text-xs text-muted-foreground hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Clear
                  </Button>
                )}
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
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Enter text to hash..."
                    className="min-h-[120px] bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground/50 focus:border-blue-500/40 focus:ring-blue-500/20 resize-y font-mono text-sm"
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="file-input"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`min-h-[120px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 transition-all cursor-pointer ${
                      isDragOver
                        ? 'border-blue-400 bg-blue-500/10'
                        : 'border-white/15 bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.04]'
                    }`}
                  >
                    <div
                      className={`p-3 rounded-full transition-colors ${
                        isDragOver ? 'bg-blue-500/20' : 'bg-white/5'
                      }`}
                    >
                      <FileText
                        className={`w-8 h-8 transition-colors ${
                          isDragOver ? 'text-blue-400' : 'text-muted-foreground'
                        }`}
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground">
                        {isDragOver
                          ? 'Drop file here'
                          : 'Drag & drop a file here'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        or click to browse — file contents will be hashed
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Algorithm Selection ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="glass-card border-0">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <Hash className="w-4 h-4 text-cf-cyan" />
                Algorithm Selection
                <Badge
                  variant="outline"
                  className="ml-1 text-[10px] border-white/10 text-muted-foreground"
                >
                  {selectedAlgorithms.size} selected
                </Badge>
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={
                    allFilteredSelected
                      ? deselectAllFiltered
                      : selectAllFiltered
                  }
                  className="h-7 text-xs text-muted-foreground hover:text-blue-400"
                >
                  {allFilteredSelected ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Category tabs */}
            <Tabs
              value={activeCategory}
              onValueChange={(v) => setActiveCategory(v as CategoryTab)}
            >
              <TabsList className="bg-white/5 border border-white/10 h-9 p-0.5">
                {CATEGORY_TABS.map((tab) => (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    className="text-xs px-3 py-1.5 data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400 data-[state=active]:border data-[state=active]:border-blue-500/30 rounded-md transition-all"
                  >
                    {tab}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Algorithm grid - same grid for all tabs */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                <AnimatePresence mode="popLayout">
                  {filteredAlgorithms.map((algo) => {
                    const isSelected = selectedAlgorithms.has(algo.name);
                    const sec = SECURITY_CONFIG[algo.security];

                    return (
                      <motion.button
                        key={algo.name}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        onClick={() => toggleAlgorithm(algo.name)}
                        className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all border ${
                          isSelected
                            ? 'bg-blue-600/10 border-blue-500/30 shadow-lg shadow-blue-500/5'
                            : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/10'
                        }`}
                      >
                        {/* Checkbox visual */}
                        <div
                          className={`flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-blue-600 border-blue-500'
                              : 'border-white/20'
                          }`}
                        >
                          {isSelected && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground truncate">
                              {algo.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <Badge
                              variant="outline"
                              className="text-[9px] px-1.5 py-0 h-4 border-white/10 text-muted-foreground"
                            >
                              {algo.category}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="text-[9px] px-1.5 py-0 h-4 border-white/10 text-muted-foreground"
                            >
                              {algo.outputSize}-bit
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`text-[9px] px-1.5 py-0 h-4 ${sec.bgColor} ${sec.borderColor} ${sec.color}`}
                            >
                              {sec.label}
                            </Badge>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </AnimatePresence>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Generate Button ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="flex justify-center"
      >
        <Button
          onClick={generateHashes}
          disabled={
            !inputText.trim() || selectedAlgorithms.size === 0 || isGenerating
          }
          className="px-8 py-5 h-auto text-sm font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 shadow-lg shadow-blue-600/20 transition-all disabled:opacity-40 disabled:shadow-none"
        >
          {isGenerating ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full mr-2"
            />
          ) : (
            <Hash className="w-4 h-4 mr-2" />
          )}
          {isGenerating
            ? 'Generating...'
            : `Generate Hash${selectedAlgorithms.size > 1 ? 'es' : ''}`}
        </Button>
      </motion.div>

      {/* ── Results Section ── */}
      <AnimatePresence>
        {hashResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="glass-card border-0">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                    <Hash className="w-4 h-4 text-cf-green" />
                    Hash Results
                    <Badge
                      variant="outline"
                      className="text-[10px] border-white/10 text-muted-foreground"
                    >
                      {hashResults.length} algorithm
                      {hashResults.length !== 1 ? 's' : ''}
                    </Badge>
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyAll}
                      className="h-8 text-xs text-muted-foreground hover:text-cf-cyan"
                    >
                      {copiedAll ? (
                        <Check className="w-3.5 h-3.5 mr-1 text-cf-green" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 mr-1" />
                      )}
                      {copiedAll ? 'Copied!' : 'Copy All'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={exportResults}
                      className="h-8 text-xs text-muted-foreground hover:text-cf-blue"
                    >
                      <Download className="w-3.5 h-3.5 mr-1" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar pr-1">
                  <AnimatePresence>
                    {hashResults.map((result, index) => {
                      const sec = SECURITY_CONFIG[result.algorithm.security];
                      const isMatch =
                        compareHash.trim() !== '' &&
                        result.hash.toLowerCase() ===
                          compareHash.trim().toLowerCase();
                      const isCopied = copiedId === result.algorithm.name;

                      return (
                        <motion.div
                          key={result.algorithm.name}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{
                            duration: 0.3,
                            delay: index * 0.05,
                          }}
                          className={`glass-card rounded-xl p-4 transition-all ${
                            isMatch
                              ? 'ring-2 ring-green-500/40 bg-green-500/5'
                              : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              {/* Algorithm header */}
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <span className="text-sm font-semibold text-foreground">
                                  {result.algorithm.name}
                                </span>
                                <Badge
                                  variant="outline"
                                  className={`text-[9px] px-1.5 py-0 h-4 ${sec.bgColor} ${sec.borderColor} ${sec.color}`}
                                >
                                  {sec.label}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className="text-[9px] px-1.5 py-0 h-4 border-white/10 text-muted-foreground"
                                >
                                  {result.algorithm.outputSize}-bit
                                </Badge>
                                {isMatch && (
                                  <Badge className="text-[9px] px-1.5 py-0 h-4 bg-green-500/20 text-green-400 border border-green-500/30">
                                    Match
                                  </Badge>
                                )}
                              </div>

                              {/* Hash value */}
                              <div className="bg-black/30 rounded-lg p-3 border border-white/[0.04]">
                                <p className="result-display text-foreground/90 select-all">
                                  {result.hash}
                                </p>
                              </div>
                            </div>

                            {/* Copy button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                copyToClipboard(
                                  result.hash,
                                  result.algorithm.name
                                )
                              }
                              className={`flex-shrink-0 h-8 w-8 p-0 ${
                                isCopied
                                  ? 'text-green-400'
                                  : 'text-muted-foreground hover:text-blue-400'
                              }`}
                            >
                              {isCopied ? (
                                <Check className="w-4 h-4" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Hash Comparison Tool ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="glass-card border-0">
          <CardHeader
            className="cursor-pointer select-none"
            onClick={() => setShowComparison(!showComparison)}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <GitCompareArrows className="w-4 h-4 text-cf-amber" />
                Hash Comparison
              </CardTitle>
              <motion.div
                animate={{ rotate: showComparison ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </motion.div>
            </div>
          </CardHeader>
          <AnimatePresence>
            {showComparison && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <CardContent className="pt-0 space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Enter a hash value to compare against generated results.
                    Matching hashes will be highlighted in the results above.
                  </p>
                  <div className="flex gap-2">
                    <Input
                      value={compareHash}
                      onChange={(e) => setCompareHash(e.target.value)}
                      placeholder="Paste hash to compare..."
                      className="bg-white/5 border-white/10 font-mono text-sm focus:border-amber-500/40 focus:ring-amber-500/20"
                    />
                    {compareHash && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCompareHash('')}
                        className="flex-shrink-0 text-muted-foreground hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                  {compareHash.trim() && hashResults.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-1"
                    >
                      {hashResults.map((result) => {
                        const isMatch =
                          result.hash.toLowerCase() ===
                          compareHash.trim().toLowerCase();
                        return (
                          <div
                            key={result.algorithm.name}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs ${
                              isMatch
                                ? 'bg-green-500/10 text-green-400'
                                : 'bg-white/[0.02] text-muted-foreground'
                            }`}
                          >
                            <div
                              className={`w-2 h-2 rounded-full ${
                                isMatch ? 'bg-green-400' : 'bg-white/20'
                              }`}
                            />
                            <span className="font-medium">
                              {result.algorithm.name}
                            </span>
                            <span className="font-mono text-[10px] opacity-60">
                              {truncateMiddle(result.hash, 20)}
                            </span>
                            {isMatch && (
                              <span className="ml-auto text-[10px] font-semibold">
                                MATCH
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>

      {/* ── Hash History ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Card className="glass-card border-0">
          <CardHeader
            className="cursor-pointer select-none"
            onClick={() => setShowHistory(!showHistory)}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <History className="w-4 h-4 text-cf-cyan" />
                Hash History
                {history.length > 0 && (
                  <Badge
                    variant="outline"
                    className="text-[10px] border-white/10 text-muted-foreground"
                  >
                    {history.length}
                  </Badge>
                )}
              </CardTitle>
              <motion.div
                animate={{ rotate: showHistory ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              </motion.div>
            </div>
          </CardHeader>
          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <CardContent className="pt-0">
                  {history.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      <History className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p>No hash history yet</p>
                      <p className="text-xs opacity-60 mt-1">
                        Generated hashes will appear here
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
                      <div className="flex justify-end mb-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearHistory}
                          className="h-7 text-xs text-muted-foreground hover:text-red-400"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Clear History
                        </Button>
                      </div>
                      {history.map((entry) => (
                        <motion.button
                          key={entry.id}
                          onClick={() => loadFromHistory(entry)}
                          className="w-full text-left glass-card rounded-xl p-3 hover:bg-white/[0.04] transition-all group"
                          whileHover={{ scale: 1.005 }}
                          whileTap={{ scale: 0.995 }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="text-xs text-foreground/80 font-medium truncate">
                                &quot;{entry.inputPreview}&quot;
                              </p>
                              <div className="flex items-center gap-1 mt-1 flex-wrap">
                                {entry.algorithms.slice(0, 4).map((algo) => (
                                  <Badge
                                    key={algo}
                                    variant="outline"
                                    className="text-[8px] px-1 py-0 h-3.5 border-white/10 text-muted-foreground"
                                  >
                                    {algo}
                                  </Badge>
                                ))}
                                {entry.algorithms.length > 4 && (
                                  <span className="text-[8px] text-muted-foreground">
                                    +{entry.algorithms.length - 4} more
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="text-[10px] text-muted-foreground/50 flex-shrink-0">
                              {entry.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    </div>
  );
}
