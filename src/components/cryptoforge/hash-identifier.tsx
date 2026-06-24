'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Copy, Check, Trash2, Sparkles, AlertCircle, Info, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { identifyHash, type HashIdentification } from '@/lib/crypto';

// ====== EXAMPLE HASHES ======
const EXAMPLE_HASHES = [
  {
    label: 'MD5',
    hash: '5d41402abc4b2a76b9719d911017c592',
    description: 'MD5 hash of "hello"',
  },
  {
    label: 'SHA1',
    hash: 'aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d',
    description: 'SHA-1 hash of "hello"',
  },
  {
    label: 'SHA256',
    hash: '2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae',
    description: 'SHA-256 hash of "hello"',
  },
  {
    label: 'SHA512',
    hash: 'f7fbba6e0636f890e56fbbf3283e524c6fa3204ae298382d624741d0dc6638326e282c41be5e4254d8820772c5518a2c5a8c0c7f7eda19594a7eb539453e1ed7',
    description: 'SHA-512 hash of "hello"',
  },
  {
    label: 'bcrypt',
    hash: '$2a$12$WApznUPhDubN0oeveSXHp.bMbgSXNn6q26lHtD9DmJGWvZba1M6em',
    description: 'bcrypt hash with cost factor 12',
  },
];

// ====== HELPERS ======
function getConfidenceColor(confidence: number): string {
  if (confidence >= 70) return '#10B981'; // green
  if (confidence >= 40) return '#F59E0B'; // yellow/amber
  return '#EF4444'; // red
}

function getConfidenceLabel(confidence: number): string {
  if (confidence >= 85) return 'High';
  if (confidence >= 60) return 'Medium';
  if (confidence >= 30) return 'Low';
  return 'Very Low';
}

function getConfidenceGradient(confidence: number): string {
  if (confidence >= 70) return 'from-emerald-500 to-emerald-400';
  if (confidence >= 40) return 'from-amber-500 to-yellow-400';
  return 'from-red-500 to-orange-400';
}

// ====== COMPONENT ======
export function HashIdentifier() {
  const [hashInput, setHashInput] = useState('');
  const [result, setResult] = useState<HashIdentification | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  const [expandedDetails, setExpandedDetails] = useState<number | null>(null);

  // Debounced auto-analyze
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      if (!hashInput.trim()) {
        setResult(null);
        setIsAnalyzing(false);
      } else {
        setIsAnalyzing(true);
        const identification = identifyHash(hashInput);
        setResult(identification);
        setIsAnalyzing(false);
      }
    }, 300);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [hashInput]);

  const handleClear = () => {
    setHashInput('');
    setResult(null);
    setExpandedDetails(null);
  };

  const handleCopyHash = async () => {
    if (!hashInput) return;
    await navigator.clipboard.writeText(hashInput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExampleClick = (hash: string) => {
    setHashInput(hash);
    setShowExamples(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-3"
      >
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-cf-blue/10 border border-cf-blue/20">
            <Search className="w-6 h-6 text-cf-blue" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Hash Identifier
          </h2>
        </div>
        <p className="text-muted-foreground text-base max-w-md mx-auto">
          Paste a hash to identify its algorithm
        </p>
      </motion.div>

      {/* Input Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="glass-card border-white/[0.06] overflow-hidden">
          <CardContent className="p-6 space-y-4">
            {/* Textarea */}
            <div className="relative">
              <Textarea
                placeholder="Paste your hash here... (e.g., 5d41402abc4b2a76b9719d911017c592)"
                value={hashInput}
                onChange={(e) => setHashInput(e.target.value)}
                className="min-h-[120px] resize-y bg-white/[0.03] border-white/[0.08] text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-cf-blue/30 font-mono text-sm leading-relaxed pr-24"
              />
              <div className="absolute top-3 right-3 flex gap-1.5">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCopyHash}
                  disabled={!hashInput}
                  className="h-8 w-8 rounded-lg hover:bg-white/[0.06] text-muted-foreground hover:text-foreground"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-cf-green" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClear}
                  disabled={!hashInput}
                  className="h-8 w-8 rounded-lg hover:bg-white/[0.06] text-muted-foreground hover:text-cf-red"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Analyzing indicator */}
            <AnimatePresence>
              {isAnalyzing && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Sparkles className="h-4 w-4 text-cf-cyan" />
                  </motion.div>
                  Analyzing hash...
                </motion.div>
              )}
            </AnimatePresence>

            {/* Example hashes toggle */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExamples(!showExamples)}
                className="gap-2 bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06] text-muted-foreground hover:text-foreground"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {showExamples ? 'Hide Examples' : 'Show Examples'}
              </Button>
              {hashInput && result && (
                <span className="text-xs text-muted-foreground">
                  {result.possibleAlgorithms.length} algorithm{result.possibleAlgorithms.length !== 1 ? 's' : ''} found
                </span>
              )}
            </div>

            {/* Example hashes dropdown */}
            <AnimatePresence>
              {showExamples && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                      Click to load an example hash
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {EXAMPLE_HASHES.map((example) => (
                        <motion.button
                          key={example.label}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleExampleClick(example.hash)}
                          className="flex flex-col items-start p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:border-cf-blue/30 hover:bg-cf-blue/[0.05] transition-colors text-left group"
                        >
                          <span className="text-sm font-semibold text-foreground group-hover:text-cf-blue transition-colors">
                            {example.label}
                          </span>
                          <span className="text-xs text-muted-foreground mt-0.5 line-clamp-1 font-mono">
                            {example.hash.substring(0, 30)}...
                          </span>
                          <span className="text-[11px] text-muted-foreground/60 mt-1">
                            {example.description}
                          </span>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {/* Analysis Results */}
      <AnimatePresence mode="wait">
        {result && hashInput && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="space-y-4"
          >
            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="glass-card border-white/[0.06]">
                  <CardContent className="p-4">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Hash Length
                    </div>
                    <div className="text-2xl font-bold text-foreground mt-1">
                      {result.length}
                      <span className="text-sm font-normal text-muted-foreground ml-1.5">
                        chars
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.25 }}
              >
                <Card className="glass-card border-white/[0.06]">
                  <CardContent className="p-4">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Character Set
                    </div>
                    <div className="text-2xl font-bold text-foreground mt-1 capitalize">
                      {result.charset}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="col-span-2 sm:col-span-1"
              >
                <Card className="glass-card border-white/[0.06]">
                  <CardContent className="p-4">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Best Match
                    </div>
                    <div className="text-2xl font-bold text-foreground mt-1 truncate">
                      {result.possibleAlgorithms[0]?.name || 'N/A'}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Possible Algorithms */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-cf-cyan" />
                Possible Algorithms
              </h3>

              <div className="space-y-3">
                {result.possibleAlgorithms.map((algo, index) => (
                  <motion.div
                    key={algo.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + index * 0.08 }}
                  >
                    <Card className="glass-card border-white/[0.06] overflow-hidden hover:border-white/[0.12] transition-colors">
                      <CardContent className="p-5">
                        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                          {/* Algorithm name & confidence */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="text-xl font-bold text-foreground">
                                {algo.name}
                              </h4>
                              <Badge
                                variant="outline"
                                className="text-xs font-medium shrink-0"
                                style={{
                                  color: getConfidenceColor(algo.confidence),
                                  borderColor: `${getConfidenceColor(algo.confidence)}40`,
                                  backgroundColor: `${getConfidenceColor(algo.confidence)}10`,
                                }}
                              >
                                {getConfidenceLabel(algo.confidence)}
                              </Badge>
                            </div>

                            <p className="text-sm text-muted-foreground mb-3">
                              {algo.description}
                            </p>

                            {/* Confidence bar */}
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Confidence</span>
                                <span
                                  className="font-semibold tabular-nums"
                                  style={{ color: getConfidenceColor(algo.confidence) }}
                                >
                                  {algo.confidence}%
                                </span>
                              </div>
                              <div className="h-2 w-full rounded-full bg-white/[0.06] overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${algo.confidence}%` }}
                                  transition={{ duration: 0.8, delay: 0.2 + index * 0.08, ease: 'easeOut' }}
                                  className={`h-full rounded-full bg-gradient-to-r ${getConfidenceGradient(algo.confidence)}`}
                                />
                              </div>
                            </div>

                            {/* Tool references */}
                            {(algo.hashcatMode || algo.johnFormat) && (
                              <div className="flex flex-wrap gap-2 mt-3">
                                {algo.hashcatMode && algo.hashcatMode !== '-' && (
                                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/[0.06] text-xs">
                                    <span className="text-muted-foreground">Hashcat:</span>
                                    <span className="font-mono text-cf-cyan">{algo.hashcatMode}</span>
                                  </div>
                                )}
                                {algo.johnFormat && algo.johnFormat !== '-' && (
                                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/[0.06] text-xs">
                                    <span className="text-muted-foreground">JtR:</span>
                                    <span className="font-mono text-cf-blue">{algo.johnFormat}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Expand details button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setExpandedDetails(
                                expandedDetails === index ? null : index
                              )
                            }
                            className="shrink-0 h-8 w-8 rounded-lg hover:bg-white/[0.06] text-muted-foreground"
                          >
                            <Info className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Expanded details */}
                        <AnimatePresence>
                          {expandedDetails === index && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-2">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                                  Technical Details
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                  <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground">Algorithm:</span>
                                    <span className="font-medium text-foreground">{algo.name}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground">Confidence:</span>
                                    <span className="font-medium" style={{ color: getConfidenceColor(algo.confidence) }}>
                                      {algo.confidence}% ({getConfidenceLabel(algo.confidence)})
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground">Hashcat Mode:</span>
                                    <span className="font-mono text-foreground">
                                      {algo.hashcatMode || 'N/A'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground">JtR Format:</span>
                                    <span className="font-mono text-foreground">
                                      {algo.johnFormat || 'N/A'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 sm:col-span-2">
                                    <span className="text-muted-foreground">Description:</span>
                                    <span className="text-foreground">{algo.description}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 pt-2">
                                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">
                                    Identification based on hash length ({result.length} chars) and character set ({result.charset})
                                  </span>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Technical Details Panel */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="glass-card border-white/[0.06]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Info className="w-4 h-4 text-cf-cyan" />
                    Analysis Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                      <span className="text-xs text-muted-foreground block mb-1">Input Length</span>
                      <span className="text-sm font-mono font-medium text-foreground">{result.length} characters</span>
                    </div>
                    <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                      <span className="text-xs text-muted-foreground block mb-1">Character Set</span>
                      <span className="text-sm font-mono font-medium text-foreground capitalize">{result.charset}</span>
                    </div>
                    <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                      <span className="text-xs text-muted-foreground block mb-1">Candidates Found</span>
                      <span className="text-sm font-mono font-medium text-foreground">{result.possibleAlgorithms.length}</span>
                    </div>
                    <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                      <span className="text-xs text-muted-foreground block mb-1">Top Confidence</span>
                      <span className="text-sm font-mono font-medium" style={{ color: getConfidenceColor(result.possibleAlgorithms[0]?.confidence ?? 0) }}>
                        {result.possibleAlgorithms[0]?.confidence ?? 0}%
                      </span>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-cf-blue/[0.04] border border-cf-blue/10">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-cf-blue shrink-0 mt-0.5" />
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Hash identification is based on structural analysis (length, character set, prefixes).
                        Multiple algorithms may produce hashes of the same length. The confidence score reflects
                        the uniqueness of the hash characteristics. Always verify with the original source when possible.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      <AnimatePresence>
        {!hashInput && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="glass-card border-white/[0.06] border-dashed">
              <CardContent className="py-16 flex flex-col items-center justify-center text-center">
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Search className="w-12 h-12 text-muted-foreground/30 mb-4" />
                </motion.div>
                <p className="text-lg font-medium text-muted-foreground/70 mb-1">
                  No hash provided yet
                </p>
                <p className="text-sm text-muted-foreground/50 max-w-sm">
                  Paste a hash string above or click an example to get started
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
