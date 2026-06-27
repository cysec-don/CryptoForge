'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Hash, Lock, Unlock, Code2, Search, KeyRound,
  GraduationCap, BookOpen, Settings, LayoutDashboard,
  Menu, X, ChevronLeft, Zap, Globe, Sparkles, FileSignature, GitBranch, CheckSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { Dashboard } from '@/components/cryptoforge/dashboard';
import { Hashing } from '@/components/cryptoforge/hashing';
import { HashIdentifier } from '@/components/cryptoforge/hash-identifier';
import { Encryption } from '@/components/cryptoforge/encryption';
import { Decryption } from '@/components/cryptoforge/decryption';
import { Encoding } from '@/components/cryptoforge/encoding';
import { HMACModule } from '@/components/cryptoforge/hmac';
import { PasswordHashing } from '@/components/cryptoforge/password-hashing';
import { KeyGeneration } from '@/components/cryptoforge/key-generation';
import { AsymmetricCrypto } from '@/components/cryptoforge/asymmetric';
import { KDF } from '@/components/cryptoforge/kdf';
import { Checksums } from '@/components/cryptoforge/checksums';
import { LearningCenter } from '@/components/cryptoforge/learning-center';
import { APIDocs } from '@/components/cryptoforge/api-docs';
import { SettingsPage } from '@/components/cryptoforge/settings';

type PageId = 'dashboard' | 'hashing' | 'hash-identifier' | 'encryption' | 'decryption' | 'encoding' | 'hmac' | 'password-hashing' | 'key-generation' | 'asymmetric' | 'kdf' | 'checksums' | 'learning' | 'api-docs' | 'settings';

interface NavItem {
  id: PageId;
  label: string;
  icon: React.ReactNode;
  description: string;
  section?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" />, description: 'Overview & quick actions', section: 'main' },
  { id: 'hashing', label: 'Hashing', icon: <Hash className="w-4 h-4" />, description: 'Generate hashes', section: 'crypto' },
  { id: 'hash-identifier', label: 'Hash Identifier', icon: <Search className="w-4 h-4" />, description: 'Identify hash algorithms', section: 'crypto' },
  { id: 'encryption', label: 'Encryption', icon: <Lock className="w-4 h-4" />, description: 'Encrypt data', section: 'crypto' },
  { id: 'decryption', label: 'Decryption', icon: <Unlock className="w-4 h-4" />, description: 'Decrypt data', section: 'crypto' },
  { id: 'encoding', label: 'Encoding', icon: <Code2 className="w-4 h-4" />, description: 'Encode & decode data', section: 'crypto' },
  { id: 'hmac', label: 'HMAC', icon: <Shield className="w-4 h-4" />, description: 'Generate & verify HMACs', section: 'crypto' },
  { id: 'password-hashing', label: 'Password Hashing', icon: <KeyRound className="w-4 h-4" />, description: 'Secure password hashing', section: 'crypto' },
  { id: 'key-generation', label: 'Key Generation', icon: <Sparkles className="w-4 h-4" />, description: 'Generate cryptographic keys', section: 'crypto' },
  { id: 'asymmetric', label: 'Asymmetric Crypto', icon: <FileSignature className="w-4 h-4" />, description: 'Ed25519, X25519, ECDSA, RSA', section: 'crypto' },
  { id: 'kdf', label: 'Key Derivation', icon: <GitBranch className="w-4 h-4" />, description: 'HKDF, PBKDF2, scrypt, X9.63', section: 'crypto' },
  { id: 'checksums', label: 'Checksums', icon: <CheckSquare className="w-4 h-4" />, description: 'CRC, FNV, MurmurHash, xxHash', section: 'crypto' },
  { id: 'learning', label: 'Learning Center', icon: <GraduationCap className="w-4 h-4" />, description: 'Learn about cryptography', section: 'resources' },
  { id: 'api-docs', label: 'API Docs', icon: <BookOpen className="w-4 h-4" />, description: 'REST API reference', section: 'resources' },
  { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" />, description: 'App preferences', section: 'bottom' },
];

const SECTION_LABELS: Record<string, string> = {
  main: 'Overview',
  crypto: 'Cryptographic Tools',
  resources: 'Resources',
  bottom: 'System',
};

export default function Home() {
  const [activePage, setActivePage] = useState<PageId>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigateTo = useCallback((page: string) => {
    setActivePage(page as PageId);
    setMobileMenuOpen(false);
  }, []);

  const renderContent = () => {
    switch (activePage) {
      case 'dashboard': return <Dashboard onNavigate={navigateTo} />;
      case 'hashing': return <Hashing />;
      case 'hash-identifier': return <HashIdentifier />;
      case 'encryption': return <Encryption />;
      case 'decryption': return <Decryption />;
      case 'encoding': return <Encoding />;
      case 'hmac': return <HMACModule />;
      case 'password-hashing': return <PasswordHashing />;
      case 'key-generation': return <KeyGeneration />;
      case 'asymmetric': return <AsymmetricCrypto />;
      case 'kdf': return <KDF />;
      case 'checksums': return <Checksums />;
      case 'learning': return <LearningCenter />;
      case 'api-docs': return <APIDocs />;
      case 'settings': return <SettingsPage />;
      default: return <Dashboard onNavigate={navigateTo} />;
    }
  };

  const currentItem = NAV_ITEMS.find(i => i.id === activePage);

  return (
    <TooltipProvider delayDuration={0}>
      <div className="min-h-screen bg-background flex">
        {/* Background effects */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-[#2563EB]/[0.03] rounded-full blur-[150px]" />
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-[#06B6D4]/[0.03] rounded-full blur-[150px]" />
          <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-[#10B981]/[0.02] rounded-full blur-[120px]" />
          <div className="absolute inset-0 hero-grid opacity-30" />
        </div>

        {/* Desktop Sidebar */}
        <motion.aside
          initial={false}
          animate={{ width: sidebarOpen ? 260 : 68 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="hidden lg:flex flex-col relative z-20 border-r border-white/[0.06] bg-[#0a0e1a]/80 backdrop-blur-xl shrink-0"
        >
          {/* Sidebar Header */}
          <div className="flex items-center h-16 px-4 border-b border-white/[0.06]">
            <motion.div
              className="flex items-center gap-3 overflow-hidden"
              animate={{ opacity: 1 }}
            >
              <div className="flex items-center justify-center w-9 h-9 rounded-xl overflow-hidden bg-gradient-to-br from-[#2563EB]/20 to-[#06B6D4]/20 border border-white/[0.08] shrink-0">
                <img src="/logo.png" alt="CryptoForge" className="w-full h-full object-cover" />
              </div>
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden whitespace-nowrap"
                  >
                    <span className="text-base font-bold gradient-text">CryptoForge</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="ml-auto shrink-0 h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
            >
              <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${!sidebarOpen ? 'rotate-180' : ''}`} />
            </Button>
          </div>

          {/* Nav Items */}
          <ScrollArea className="flex-1 py-3">
            <div className="px-3 space-y-1">
              {['main', 'crypto', 'resources'].map(section => (
                <div key={section}>
                  {sidebarOpen && (
                    <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                      {SECTION_LABELS[section]}
                    </div>
                  )}
                  {NAV_ITEMS.filter(i => i.section === section).map(item => (
                    <Tooltip key={item.id}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setActivePage(item.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group mb-0.5 ${
                            activePage === item.id
                              ? 'bg-[#2563EB]/10 text-[#3B82F6] border border-[#2563EB]/20 shadow-lg shadow-[#2563EB]/5'
                              : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04] border border-transparent'
                          }`}
                        >
                          <span className={`shrink-0 transition-colors ${activePage === item.id ? 'text-[#3B82F6]' : 'text-muted-foreground group-hover:text-foreground'}`}>
                            {item.icon}
                          </span>
                          <AnimatePresence>
                            {sidebarOpen && (
                              <motion.span
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 'auto' }}
                                exit={{ opacity: 0, width: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden whitespace-nowrap"
                              >
                                {item.label}
                              </motion.span>
                            )}
                          </AnimatePresence>
                          {activePage === item.id && sidebarOpen && (
                            <motion.div
                              layoutId="sidebar-active"
                              className="ml-auto w-1.5 h-1.5 rounded-full bg-[#3B82F6] shrink-0"
                            />
                          )}
                        </button>
                      </TooltipTrigger>
                      {!sidebarOpen && (
                        <TooltipContent side="right" className="bg-[#1a1f35] border-white/10 text-foreground">
                          <div>
                            <div className="font-semibold">{item.label}</div>
                            <div className="text-xs text-muted-foreground">{item.description}</div>
                          </div>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  ))}
                  {section !== 'resources' && <div className="my-2 border-t border-white/[0.04]" />}
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Bottom section */}
          <div className="px-3 pb-3 border-t border-white/[0.06] pt-3">
            {NAV_ITEMS.filter(i => i.section === 'bottom').map(item => (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setActivePage(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                      activePage === item.id
                        ? 'bg-[#2563EB]/10 text-[#3B82F6] border border-[#2563EB]/20'
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04] border border-transparent'
                    }`}
                  >
                    <span className={`shrink-0 ${activePage === item.id ? 'text-[#3B82F6]' : 'text-muted-foreground group-hover:text-foreground'}`}>
                      {item.icon}
                    </span>
                    <AnimatePresence>
                      {sidebarOpen && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden whitespace-nowrap"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                </TooltipTrigger>
                {!sidebarOpen && (
                  <TooltipContent side="right" className="bg-[#1a1f35] border-white/10 text-foreground">
                    <div className="font-semibold">{item.label}</div>
                  </TooltipContent>
                )}
              </Tooltip>
            ))}

            {/* Status indicator */}
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-3 p-3 rounded-xl bg-[#10B981]/5 border border-[#10B981]/10"
              >
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                  <span className="text-[#10B981] font-medium">Client-Side Only</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">All crypto operations run locally</p>
              </motion.div>
            )}
          </div>
        </motion.aside>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Mobile Sidebar */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="fixed left-0 top-0 bottom-0 w-[280px] z-50 lg:hidden bg-[#0a0e1a]/95 backdrop-blur-xl border-r border-white/[0.06] flex flex-col"
            >
              <div className="flex items-center h-16 px-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-xl overflow-hidden bg-gradient-to-br from-[#2563EB]/20 to-[#06B6D4]/20 border border-white/[0.08]">
                    <img src="/logo.png" alt="CryptoForge" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-base font-bold gradient-text">CryptoForge</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(false)}
                  className="ml-auto h-8 w-8 text-muted-foreground"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <ScrollArea className="flex-1 py-3">
                <div className="px-3 space-y-1">
                  {['main', 'crypto', 'resources', 'bottom'].map(section => (
                    <div key={section}>
                      <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                        {SECTION_LABELS[section] || section}
                      </div>
                      {NAV_ITEMS.filter(i => i.section === section).map(item => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActivePage(item.id);
                            setMobileMenuOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 mb-0.5 ${
                            activePage === item.id
                              ? 'bg-[#2563EB]/10 text-[#3B82F6] border border-[#2563EB]/20'
                              : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04] border border-transparent'
                          }`}
                        >
                          {item.icon}
                          <span>{item.label}</span>
                        </button>
                      ))}
                      {section !== 'bottom' && <div className="my-2 border-t border-white/[0.04]" />}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 relative z-10">
          {/* Top Bar */}
          <header className="h-14 border-b border-white/[0.06] bg-[#0a0e1a]/60 backdrop-blur-xl flex items-center px-4 gap-3 shrink-0">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden h-8 w-8 text-muted-foreground"
            >
              <Menu className="w-5 h-5" />
            </Button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm">
              <img src="/logo.png" alt="CryptoForge" className="w-6 h-6 rounded object-cover" />
              <span className="text-muted-foreground">CryptoForge</span>
              <span className="text-muted-foreground/40">/</span>
              <span className="text-foreground font-medium">{currentItem?.label}</span>
            </div>

            {/* Right side */}
            <div className="ml-auto flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
                <Zap className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span>200+ Algorithms</span>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
                <Globe className="w-3.5 h-3.5 text-[#06B6D4]" />
                <span>Client-Side</span>
              </div>
              <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
                <Shield className="w-3.5 h-3.5 text-[#10B981]" />
                <span>Zero-Knowledge</span>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto custom-scrollbar">
            <AnimatePresence mode="wait">
              <motion.div
                key={activePage}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </main>

          {/* Footer */}
          <footer className="border-t border-white/[0.04] bg-[#0a0e1a]/40 backdrop-blur-sm py-3 px-4 shrink-0">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground/40">
              <span>CryptoForge v1.0.0</span>
              <span>All cryptographic operations run locally in your browser. No data leaves your device.</span>
            </div>
          </footer>
        </div>
      </div>
    </TooltipProvider>
  );
}
