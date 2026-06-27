'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Hash,
  Lock,
  Unlock,
  ShieldCheck,
  Search,
  KeyRound,
  GraduationCap,
  Code2,
  Copy,
  Check,
  FileSignature,
  ArrowRight,
  Zap,
  Shield,
  Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { computeHash } from '@/lib/crypto';

interface DashboardProps {
  onNavigate: (page: string) => void;
}

/* ------------------------------------------------------------------ */
/*  Animated counter hook                                              */
/* ------------------------------------------------------------------ */
function useAnimatedCounter(target: number, duration = 2000) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    let rafId: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) {
        rafId = requestAnimationFrame(step);
      }
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration]);

  return count;
}

/* ------------------------------------------------------------------ */
/*  Counter Card                                                       */
/* ------------------------------------------------------------------ */
function CounterCard({
  label,
  value,
  suffix,
  icon: Icon,
  color,
  delay,
}: {
  label: string;
  value: number;
  suffix: string;
  icon: React.ElementType;
  color: string;
  delay: number;
}) {
  const count = useAnimatedCounter(value);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay }}
      className="glass-card rounded-xl p-6 text-center group hover:scale-[1.03] transition-transform duration-300"
    >
      <div
        className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon className="h-6 w-6" style={{ color }} />
      </div>
      <div className="text-3xl font-bold text-foreground">
        {count}
        <span className="text-lg" style={{ color }}>
          {suffix}
        </span>
      </div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Feature card                                                       */
/* ------------------------------------------------------------------ */
const features = [
  {
    icon: Hash,
    title: 'Hash Generation',
    description: 'Generate cryptographic hashes using 50+ algorithms including SHA-2, SHA-3, MD5, and RIPEMD.',
    page: 'hash',
    color: '#2563EB',
  },
  {
    icon: Lock,
    title: 'Encryption',
    description: 'Encrypt data with AES, TripleDES, Rabbit, and other symmetric ciphers securely.',
    page: 'encryption',
    color: '#06B6D4',
  },
  {
    icon: Unlock,
    title: 'Decryption',
    description: 'Decrypt cipher text back to plaintext with support for multiple encryption standards.',
    page: 'decryption',
    color: '#10B981',
  },
  {
    icon: ShieldCheck,
    title: 'Hash Verification',
    description: 'Verify file and text integrity by comparing computed hashes against known values.',
    page: 'verify',
    color: '#F59E0B',
  },
  {
    icon: Search,
    title: 'Algorithm Identification',
    description: 'Identify which algorithm produced a given hash through pattern analysis and length detection.',
    page: 'identify',
    color: '#EF4444',
  },
  {
    icon: KeyRound,
    title: 'Secure Key Generation',
    description: 'Generate cryptographically secure random keys and passphrases for your applications.',
    page: 'keygen',
    color: '#8B5CF6',
  },
  {
    icon: FileSignature,
    title: 'Asymmetric Cryptography',
    description: 'Sign, verify, encrypt, and decrypt with Ed25519, X25519, ECDSA, and RSA key pairs.',
    page: 'asymmetric',
    color: '#06B6D4',
  },
  {
    icon: GraduationCap,
    title: 'Educational Lab',
    description: 'Learn cryptography fundamentals with interactive examples and visual demonstrations.',
    page: 'learn',
    color: '#EC4899',
  },
  {
    icon: Code2,
    title: 'API Access',
    description: 'Programmatic access to all cryptographic operations via a clean RESTful API.',
    page: 'api',
    color: '#14B8A6',
  },
];

/* ------------------------------------------------------------------ */
/*  Live demo algorithm options                                        */
/* ------------------------------------------------------------------ */
const DEMO_ALGORITHMS = [
  'SHA256',
  'SHA512',
  'SHA384',
  'SHA224',
  'SHA1',
  'MD5',
  'SHA3-256',
  'SHA3-512',
  'RIPEMD160',
  'Whirlpool',
];

/* ================================================================== */
/*  DASHBOARD COMPONENT                                                */
/* ================================================================== */
export function Dashboard({ onNavigate }: DashboardProps) {
  /* ---- Live Demo state ---- */
  const [demoInput, setDemoInput] = useState('CryptoForge');
  const [demoAlgo, setDemoAlgo] = useState('SHA256');
  const [demoResult, setDemoResult] = useState(() =>
    computeHash('SHA256', 'CryptoForge')
  );
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = useCallback(() => {
    if (!demoInput.trim()) return;
    setIsGenerating(true);
    // Tiny delay for visual feedback
    setTimeout(() => {
      const result = computeHash(demoAlgo, demoInput);
      setDemoResult(result);
      setIsGenerating(false);
    }, 300);
  }, [demoAlgo, demoInput]);

  const handleCopy = useCallback(async () => {
    if (!demoResult) return;
    try {
      await navigator.clipboard.writeText(demoResult);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const textarea = document.createElement('textarea');
      textarea.value = demoResult;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [demoResult]);

  /* ---- Animation variants ---- */
  const containerVariants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.08 },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  /* ================================================================ */
  /*  RENDER                                                          */
  /* ================================================================ */
  return (
    <div className="min-h-screen bg-[#0a0e1a] text-foreground overflow-x-hidden">
      {/* ============================================================ */}
      {/*  HERO SECTION                                                 */}
      {/* ============================================================ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated grid background */}
        <div className="absolute inset-0 hero-grid" />
        {/* Radial gradient overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(37,99,235,0.08)_0%,transparent_70%)]" />
        {/* Top-right glow */}
        <div className="absolute -top-40 right-0 h-[500px] w-[500px] rounded-full bg-[#2563EB]/5 blur-[120px]" />
        {/* Bottom-left glow */}
        <div className="absolute -bottom-40 left-0 h-[500px] w-[500px] rounded-full bg-[#06B6D4]/5 blur-[120px]" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex flex-col items-center text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="glass-card mb-8 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm"
            >
              <Zap className="h-4 w-4 text-cf-cyan" />
              <span className="text-muted-foreground">
                Enterprise-Grade Cryptography Platform
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight"
            >
              <span className="gradient-text">Enterprise</span>
              <br />
              <span className="text-foreground">Cryptography Laboratory</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-6 max-w-2xl text-lg sm:text-xl text-muted-foreground leading-relaxed"
            >
              Generate, verify, encrypt, decrypt, and analyze cryptographic
              algorithms from a single platform.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-10 flex flex-col sm:flex-row items-center gap-4"
            >
              <Button
                size="lg"
                className="bg-[#2563EB] hover:bg-[#2563EB]/90 text-white rounded-lg px-8 h-12 text-base shadow-lg shadow-[#2563EB]/20"
                onClick={() => onNavigate('hash')}
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="glass-card border-white/10 text-foreground hover:bg-white/5 rounded-lg px-8 h-12 text-base"
                onClick={() => onNavigate('learn')}
              >
                View Algorithms
              </Button>
            </motion.div>

            {/* Floating glassmorphism stat cards */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="mt-16 grid w-full max-w-3xl grid-cols-1 sm:grid-cols-3 gap-4"
            >
              {[
                {
                  icon: Shield,
                  label: 'AES-256',
                  sub: 'Encryption',
                  color: '#2563EB',
                },
                {
                  icon: Hash,
                  label: 'SHA-3',
                  sub: 'Hashing',
                  color: '#06B6D4',
                },
                {
                  icon: Globe,
                  label: 'REST API',
                  sub: 'Access',
                  color: '#10B981',
                },
              ].map((card) => (
                <div
                  key={card.label}
                  className="glass-card rounded-xl p-5 flex items-center gap-4 group hover:scale-[1.03] transition-transform duration-300"
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${card.color}15` }}
                  >
                    <card.icon className="h-5 w-5" style={{ color: card.color }} />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-foreground text-sm">
                      {card.label}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {card.sub}
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0e1a] to-transparent" />
      </section>

      {/* ============================================================ */}
      {/*  ALGORITHM COUNTERS SECTION                                   */}
      {/* ============================================================ */}
      <section className="relative py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Comprehensive Algorithm Coverage
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Supporting over 200 cryptographic primitives across every major
              category of modern cryptography.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
            <CounterCard
              label="Total Algorithms"
              value={200}
              suffix="+"
              icon={Zap}
              color="#2563EB"
              delay={0}
            />
            <CounterCard
              label="Encryption Algos"
              value={25}
              suffix="+"
              icon={Lock}
              color="#06B6D4"
              delay={0.1}
            />
            <CounterCard
              label="Hash Algorithms"
              value={50}
              suffix="+"
              icon={Hash}
              color="#10B981"
              delay={0.2}
            />
            <CounterCard
              label="HMAC Algorithms"
              value={15}
              suffix="+"
              icon={Shield}
              color="#F59E0B"
              delay={0.3}
            />
            <CounterCard
              label="Encoding Formats"
              value={15}
              suffix="+"
              icon={Globe}
              color="#8B5CF6"
              delay={0.4}
            />
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  FEATURES GRID                                                */}
      {/* ============================================================ */}
      <section className="relative py-20">
        {/* Background accent */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.04)_0%,transparent_50%)]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Everything You Need for{' '}
              <span className="gradient-text">Cryptographic Operations</span>
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              From generating hashes to encrypting sensitive data, CryptoForge
              provides a full suite of enterprise-grade tools.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6"
          >
            {features.map((feature) => (
              <motion.div key={feature.title} variants={cardVariants}>
                <Card
                  className="glass-card border-0 cursor-pointer group hover:scale-[1.03] transition-all duration-300 py-0 overflow-hidden"
                  onClick={() => onNavigate(feature.page)}
                >
                  <CardContent className="p-6">
                    <div
                      className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg transition-colors duration-300"
                      style={{ backgroundColor: `${feature.color}12` }}
                    >
                      <feature.icon
                        className="h-6 w-6 transition-transform duration-300 group-hover:scale-110"
                        style={{ color: feature.color }}
                      />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                    <div
                      className="mt-4 flex items-center text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ color: feature.color }}
                    >
                      Explore
                      <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  LIVE DEMO SECTION                                            */}
      {/* ============================================================ */}
      <section className="relative py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Try It <span className="gradient-text">Live</span>
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Generate a hash instantly. Pick an algorithm, enter your text, and
              see the result in real-time.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mx-auto max-w-2xl"
          >
            <div className="glass-card rounded-2xl p-6 sm:p-8 space-y-6">
              {/* Input row */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Input
                    value={demoInput}
                    onChange={(e) => setDemoInput(e.target.value)}
                    placeholder="Enter text to hash..."
                    className="h-11 bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground/60 focus-visible:border-[#2563EB] focus-visible:ring-[#2563EB]/30 rounded-lg"
                  />
                </div>
                <Select value={demoAlgo} onValueChange={setDemoAlgo}>
                  <SelectTrigger className="w-full sm:w-[180px] h-11 bg-white/5 border-white/10 text-foreground rounded-lg">
                    <SelectValue placeholder="Algorithm" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#161b2e] border-white/10">
                    {DEMO_ALGORITHMS.map((algo) => (
                      <SelectItem
                        key={algo}
                        value={algo}
                        className="text-foreground focus:bg-white/5 focus:text-foreground"
                      >
                        {algo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Generate button */}
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !demoInput.trim()}
                className="w-full h-11 bg-[#2563EB] hover:bg-[#2563EB]/90 text-white rounded-lg shadow-lg shadow-[#2563EB]/20 disabled:opacity-50"
              >
                {isGenerating ? (
                  <span className="flex items-center gap-2">
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                      className="inline-block h-4 w-4 border-2 border-white/30 border-t-white rounded-full"
                    />
                    Generating...
                  </span>
                ) : (
                  <>
                    <Hash className="mr-2 h-4 w-4" />
                    Generate Hash
                  </>
                )}
              </Button>

              {/* Result display */}
              {demoResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="relative"
                >
                  <div className="rounded-lg bg-white/[0.03] border border-white/10 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {demoAlgo} Result
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopy}
                        className="h-7 px-2 text-muted-foreground hover:text-foreground hover:bg-white/5"
                      >
                        {copied ? (
                          <Check className="h-3.5 w-3.5 text-cf-green" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                        <span className="ml-1 text-xs">
                          {copied ? 'Copied!' : 'Copy'}
                        </span>
                      </Button>
                    </div>
                    <div className="result-display text-[#06B6D4]">
                      {demoResult}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Quick fact */}
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-6 text-center text-sm text-muted-foreground"
            >
              All computations run locally in your browser. No data is ever
              sent to a server.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  FOOTER CTA                                                   */}
      {/* ============================================================ */}
      <section className="relative py-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(37,99,235,0.06)_0%,transparent_60%)]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="glass-card rounded-2xl p-8 sm:p-12 text-center"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              Ready to Secure Your Data?
            </h2>
            <p className="mt-4 text-muted-foreground max-w-lg mx-auto">
              Start using CryptoForge today and experience enterprise-grade
              cryptography tools designed for developers and security
              professionals.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
              <Button
                size="lg"
                className="bg-[#2563EB] hover:bg-[#2563EB]/90 text-white rounded-lg px-8 h-12 shadow-lg shadow-[#2563EB]/20"
                onClick={() => onNavigate('hash')}
              >
                Start Hashing
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="glass-card border-white/10 text-foreground hover:bg-white/5 rounded-lg px-8 h-12"
                onClick={() => onNavigate('encryption')}
              >
                Try Encryption
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer bar */}
      <footer className="border-t border-white/5 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#2563EB]" />
            <span className="font-semibold text-foreground">CryptoForge</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Enterprise Cryptography Laboratory &mdash; All computations
            performed locally.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Dashboard;
