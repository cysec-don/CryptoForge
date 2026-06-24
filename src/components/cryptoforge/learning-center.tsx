'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  Search,
  ArrowLeft,
  Copy,
  Check,
  BookOpen,
  Shield,
  AlertTriangle,
  Zap,
  Target,
  Terminal,
  Lightbulb,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  ALGORITHM_LEARNING_DATA,
  getDefaultAlgorithmInfo,
  computeHash,
  type AlgorithmInfo,
} from '@/lib/crypto';

// ─── Types ────────────────────────────────────────────────────────────────────

type CategoryTab = 'All' | 'Hash Functions' | 'Symmetric' | 'Asymmetric' | 'Password Hashing';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_TABS: CategoryTab[] = [
  'All',
  'Hash Functions',
  'Symmetric',
  'Asymmetric',
  'Password Hashing',
];

const CATEGORY_MAP: Record<string, CategoryTab> = {
  'Hash Function': 'Hash Functions',
  'Symmetric Encryption': 'Symmetric',
  'Asymmetric Encryption': 'Asymmetric',
  'Password Hashing': 'Password Hashing',
};

const CATEGORY_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  'Hash Function': { text: 'text-cf-blue', bg: 'bg-cf-blue/10', border: 'border-cf-blue/20' },
  'Symmetric Encryption': { text: 'text-cf-green', bg: 'bg-cf-green/10', border: 'border-cf-green/20' },
  'Asymmetric Encryption': { text: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  'Password Hashing': { text: 'text-cf-amber', bg: 'bg-cf-amber/10', border: 'border-cf-amber/20' },
  'Cryptographic Algorithm': { text: 'text-cf-cyan', bg: 'bg-cf-cyan/10', border: 'border-cf-cyan/20' },
};

const SECURITY_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  'broken': { text: 'text-cf-red', bg: 'bg-cf-red/10', border: 'border-cf-red/20' },
  'weak': { text: 'text-cf-amber', bg: 'bg-cf-amber/10', border: 'border-cf-amber/20' },
  'moderate': { text: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  'strong': { text: 'text-cf-green', bg: 'bg-cf-green/10', border: 'border-cf-green/20' },
  'very strong': { text: 'text-cf-cyan', bg: 'bg-cf-cyan/10', border: 'border-cf-cyan/20' },
};

function getSecurityColorKey(level: string): string {
  const lower = level.toLowerCase();
  if (lower.includes('broken')) return 'broken';
  if (lower.includes('weak')) return 'weak';
  if (lower.includes('moderate')) return 'moderate';
  if (lower.includes('very strong')) return 'very strong';
  if (lower.includes('strong')) return 'strong';
  return 'moderate';
}

// ─── Section Icons ────────────────────────────────────────────────────────────

const SECTION_ICONS: Record<string, React.ReactNode> = {
  history: <BookOpen className="w-4 h-4" />,
  purpose: <Target className="w-4 h-4" />,
  security: <Shield className="w-4 h-4" />,
  weaknesses: <AlertTriangle className="w-4 h-4" />,
  usage: <Lightbulb className="w-4 h-4" />,
  command: <Terminal className="w-4 h-4" />,
  cases: <ChevronRight className="w-4 h-4" />,
  performance: <Zap className="w-4 h-4" />,
};

// ─── Component ────────────────────────────────────────────────────────────────

export function LearningCenter() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryTab>('All');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string | null>(null);
  const [copiedCommand, setCopiedCommand] = useState(false);
  const [copiedResult, setCopiedResult] = useState(false);
  const [labInput, setLabInput] = useState('');
  const [labResult, setLabResult] = useState('');

  // ── Derived Data ──
  const allAlgorithms = useMemo(() => {
    return Object.values(ALGORITHM_LEARNING_DATA);
  }, []);

  const filteredAlgorithms = useMemo(() => {
    let result = allAlgorithms;

    // Filter by category
    if (activeCategory !== 'All') {
      result = result.filter((algo) => CATEGORY_MAP[algo.category] === activeCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (algo) =>
          algo.name.toLowerCase().includes(query) ||
          algo.category.toLowerCase().includes(query) ||
          algo.purpose.toLowerCase().includes(query)
      );
    }

    return result;
  }, [allAlgorithms, activeCategory, searchQuery]);

  const currentAlgorithm: AlgorithmInfo | null = selectedAlgorithm
    ? ALGORITHM_LEARNING_DATA[selectedAlgorithm] ?? getDefaultAlgorithmInfo(selectedAlgorithm)
    : null;

  // ── Handlers ──
  const handleCopy = async (text: string, type: 'command' | 'result') => {
    await navigator.clipboard.writeText(text);
    if (type === 'command') {
      setCopiedCommand(true);
      setTimeout(() => setCopiedCommand(false), 2000);
    } else {
      setCopiedResult(true);
      setTimeout(() => setCopiedResult(false), 2000);
    }
  };

  const handleLabCompute = () => {
    if (!labInput.trim() || !currentAlgorithm) return;
    try {
      const result = computeHash(currentAlgorithm.name, labInput);
      setLabResult(result);
    } catch {
      setLabResult('Algorithm not supported for live demo');
    }
  };

  const handleBack = () => {
    setSelectedAlgorithm(null);
    setLabInput('');
    setLabResult('');
  };

  // ── Render ──
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-cf-blue/20 to-cf-cyan/20 border border-white/[0.08] mb-4 shadow-lg shadow-cf-blue/10">
          <GraduationCap className="w-7 h-7 text-cf-blue" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
          Learning Center
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
          Explore cryptographic algorithms, their history, and best practices
        </p>
      </motion.div>

      {/* Content with AnimatePresence for list/detail transitions */}
      <AnimatePresence mode="wait">
        {!selectedAlgorithm ? (
          <motion.div
            key="browser"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Algorithm Browser */}
            <div className="space-y-4">
              {/* Search & Filter Bar */}
              <Card className="glass-card">
                <CardContent className="p-4 space-y-4">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search algorithms..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-white/[0.03] border-white/[0.08] focus:border-cf-blue/30"
                    />
                  </div>

                  {/* Category Filter Tabs */}
                  <Tabs
                    value={activeCategory}
                    onValueChange={(v) => setActiveCategory(v as CategoryTab)}
                  >
                    <TabsList className="bg-white/[0.03] border border-white/[0.06] w-full flex flex-wrap h-auto gap-1 p-1">
                      {CATEGORY_TABS.map((tab) => (
                        <TabsTrigger
                          key={tab}
                          value={tab}
                          className="text-xs data-[state=active]:bg-cf-blue/15 data-[state=active]:text-cf-blue flex-1 min-w-[80px]"
                        >
                          {tab}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Algorithm Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAlgorithms.map((algo, index) => {
                  const catColors = CATEGORY_COLORS[algo.category] ?? CATEGORY_COLORS['Cryptographic Algorithm'];
                  const secKey = getSecurityColorKey(algo.securityLevel);
                  const secColors = SECURITY_COLORS[secKey] ?? SECURITY_COLORS['moderate'];

                  return (
                    <motion.div
                      key={algo.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <Card
                        className="glass-card cursor-pointer group hover:border-cf-blue/20 transition-all duration-300 hover:shadow-lg hover:shadow-cf-blue/5"
                        onClick={() => setSelectedAlgorithm(algo.name)}
                      >
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="font-semibold text-base text-foreground group-hover:text-cf-blue transition-colors">
                              {algo.name}
                            </h3>
                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-cf-blue transition-colors mt-0.5" />
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Badge
                              variant="outline"
                              className={`${catColors.text} ${catColors.bg} ${catColors.border} text-[10px] px-2 py-0.5`}
                            >
                              {algo.category}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`${secColors.text} ${secColors.bg} ${secColors.border} text-[10px] px-2 py-0.5`}
                            >
                              <Shield className="w-3 h-3 mr-1" />
                              {algo.securityLevel.split(' - ')[0]}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-3 line-clamp-2 leading-relaxed">
                            {algo.purpose}
                          </p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>

              {/* Empty State */}
              {filteredAlgorithms.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground text-sm">
                    No algorithms found matching your search.
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-cf-blue hover:text-cf-blue"
                    onClick={() => {
                      setSearchQuery('');
                      setActiveCategory('All');
                    }}
                  >
                    Clear filters
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            {currentAlgorithm && (
              <AlgorithmDetail
                algorithm={currentAlgorithm}
                onBack={handleBack}
                copiedCommand={copiedCommand}
                copiedResult={copiedResult}
                onCopy={handleCopy}
                labInput={labInput}
                labResult={labResult}
                onLabInputChange={setLabInput}
                onLabCompute={handleLabCompute}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Algorithm Detail Sub-Component ──────────────────────────────────────────

interface AlgorithmDetailProps {
  algorithm: AlgorithmInfo;
  onBack: () => void;
  copiedCommand: boolean;
  copiedResult: boolean;
  onCopy: (text: string, type: 'command' | 'result') => void;
  labInput: string;
  labResult: string;
  onLabInputChange: (value: string) => void;
  onLabCompute: () => void;
}

function AlgorithmDetail({
  algorithm,
  onBack,
  copiedCommand,
  copiedResult,
  onCopy,
  labInput,
  labResult,
  onLabInputChange,
  onLabCompute,
}: AlgorithmDetailProps) {
  const catColors = CATEGORY_COLORS[algorithm.category] ?? CATEGORY_COLORS['Cryptographic Algorithm'];
  const secKey = getSecurityColorKey(algorithm.securityLevel);
  const secColors = SECURITY_COLORS[secKey] ?? SECURITY_COLORS['moderate'];

  return (
    <div className="space-y-4">
      {/* Back Button & Header */}
      <Card className="glass-card">
        <CardContent className="p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground mb-3 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to algorithms
          </Button>
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
                {algorithm.name}
              </h3>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="outline"
                  className={`${catColors.text} ${catColors.bg} ${catColors.border}`}
                >
                  {algorithm.category}
                </Badge>
                <Badge
                  variant="outline"
                  className={`${secColors.text} ${secColors.bg} ${secColors.border}`}
                >
                  <Shield className="w-3 h-3 mr-1" />
                  {algorithm.securityLevel}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detail Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* History */}
        <DetailSection
          icon={SECTION_ICONS.history}
          iconColor="text-cf-blue"
          title="History"
        >
          <p className="text-sm text-muted-foreground leading-relaxed">
            {algorithm.history}
          </p>
        </DetailSection>

        {/* Purpose */}
        <DetailSection
          icon={SECTION_ICONS.purpose}
          iconColor="text-cf-cyan"
          title="Purpose"
        >
          <p className="text-sm text-muted-foreground leading-relaxed">
            {algorithm.purpose}
          </p>
        </DetailSection>

        {/* Security Level */}
        <DetailSection
          icon={SECTION_ICONS.security}
          iconColor={secColors.text}
          title="Security Level"
        >
          <div className="flex items-center gap-2">
            <Badge
              className={`${secColors.text} ${secColors.bg} border ${secColors.border} text-sm px-3 py-1`}
            >
              {algorithm.securityLevel}
            </Badge>
          </div>
        </DetailSection>

        {/* Known Weaknesses */}
        <DetailSection
          icon={SECTION_ICONS.weaknesses}
          iconColor="text-cf-amber"
          title="Known Weaknesses"
        >
          <p className="text-sm text-muted-foreground leading-relaxed">
            {algorithm.knownWeaknesses}
          </p>
        </DetailSection>

        {/* Recommended Usage */}
        <DetailSection
          icon={SECTION_ICONS.usage}
          iconColor="text-cf-green"
          title="Recommended Usage"
        >
          <p className="text-sm text-muted-foreground leading-relaxed">
            {algorithm.recommendedUsage}
          </p>
        </DetailSection>

        {/* Performance Notes */}
        <DetailSection
          icon={SECTION_ICONS.performance}
          iconColor="text-purple-400"
          title="Performance Notes"
        >
          <p className="text-sm text-muted-foreground leading-relaxed">
            {algorithm.performanceNote}
          </p>
        </DetailSection>

        {/* Example Command */}
        <DetailSection
          icon={SECTION_ICONS.command}
          iconColor="text-cf-cyan"
          title="Example Command"
          className="lg:col-span-2"
        >
          <div className="relative group">
            <div className="bg-black/40 rounded-lg border border-white/[0.06] p-4 pr-12 font-mono text-sm text-cf-cyan overflow-x-auto">
              <span className="text-muted-foreground/60 select-none">$ </span>
              {algorithm.exampleCommand}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
              onClick={() => onCopy(algorithm.exampleCommand, 'command')}
            >
              {copiedCommand ? (
                <Check className="w-3.5 h-3.5 text-cf-green" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </Button>
          </div>
        </DetailSection>

        {/* Use Cases */}
        <DetailSection
          icon={SECTION_ICONS.cases}
          iconColor="text-cf-blue"
          title="Use Cases"
          className="lg:col-span-2"
        >
          <div className="flex flex-wrap gap-2">
            {algorithm.useCases.map((useCase, i) => (
              <Badge
                key={i}
                variant="outline"
                className="text-xs bg-white/[0.02] border-white/[0.08] text-muted-foreground hover:text-foreground transition-colors"
              >
                {useCase}
              </Badge>
            ))}
          </div>
        </DetailSection>
      </div>

      {/* Interactive Lab */}
      <Card className="glass-card border-cf-blue/10">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="w-8 h-8 rounded-lg bg-cf-blue/10 flex items-center justify-center">
              <Terminal className="w-4 h-4 text-cf-blue" />
            </div>
            Interactive Lab
            <Badge variant="outline" className="ml-auto text-[10px] text-cf-cyan border-cf-cyan/20 bg-cf-cyan/10">
              Live Demo
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              Input Text
            </label>
            <Textarea
              placeholder="Enter text to hash..."
              value={labInput}
              onChange={(e) => onLabInputChange(e.target.value)}
              className="bg-white/[0.03] border-white/[0.08] focus:border-cf-blue/30 min-h-[80px] font-mono text-sm"
            />
          </div>
          <Button
            onClick={onLabCompute}
            disabled={!labInput.trim()}
            className="bg-cf-blue hover:bg-cf-blue/90 text-white w-full sm:w-auto"
          >
            <Zap className="w-4 h-4 mr-2" />
            Compute {algorithm.name}
          </Button>
          {labResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <label className="text-xs font-medium text-muted-foreground mb-2 block">
                Result
              </label>
              <div className="relative group">
                <div className="bg-black/40 rounded-lg border border-white/[0.06] p-4 pr-12 font-mono text-sm text-cf-green break-all leading-relaxed">
                  {labResult}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                  onClick={() => onCopy(labResult, 'result')}
                >
                  {copiedResult ? (
                    <Check className="w-3.5 h-3.5 text-cf-green" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Detail Section Sub-Component ────────────────────────────────────────────

interface DetailSectionProps {
  icon: React.ReactNode;
  iconColor: string;
  title: string;
  className?: string;
  children: React.ReactNode;
}

function DetailSection({ icon, iconColor, title, className = '', children }: DetailSectionProps) {
  return (
    <Card className={`glass-card ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className={`w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center ${iconColor}`}>
            {icon}
          </div>
          <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}
