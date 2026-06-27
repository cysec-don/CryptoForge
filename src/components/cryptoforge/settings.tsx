'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Settings as SettingsIcon,
  Palette,
  Shield,
  Trash2,
  Download,
  Info,
  Moon,
  Sun,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const HASH_ALGORITHMS = [
  { value: 'SHA256', label: 'SHA-256' },
  { value: 'SHA384', label: 'SHA-384' },
  { value: 'SHA512', label: 'SHA-512' },
  { value: 'SHA1', label: 'SHA-1' },
  { value: 'SHA3-256', label: 'SHA3-256' },
  { value: 'SHA3-512', label: 'SHA3-512' },
  { value: 'BLAKE2B', label: 'BLAKE2b' },
  { value: 'BLAKE3', label: 'BLAKE3' },
  { value: 'MD5', label: 'MD5 (legacy)' },
];

const ENCRYPTION_ALGORITHMS = [
  { value: 'aes-256-gcm', label: 'AES-256-GCM' },
  { value: 'aes-128-gcm', label: 'AES-128-GCM' },
  { value: 'aes-256-cbc', label: 'AES-256-CBC' },
  { value: 'aes-128-cbc', label: 'AES-128-CBC' },
  { value: 'chacha20-poly1305', label: 'ChaCha20-Poly1305' },
];

const CLIPBOARD_TIMERS = [
  { value: '15', label: '15 seconds' },
  { value: '30', label: '30 seconds' },
  { value: '60', label: '1 minute' },
  { value: '120', label: '2 minutes' },
  { value: 'never', label: 'Never' },
];

const STORAGE_KEY = 'cryptoforge-settings';

interface AppSettings {
  isDark: boolean;
  isCompact: boolean;
  autoClearClipboard: boolean;
  clipboardTimer: string;
  defaultHashAlgo: string;
  defaultEncAlgo: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  isDark: true,
  isCompact: false,
  autoClearClipboard: false,
  clipboardTimer: '30',
  defaultHashAlgo: 'SHA256',
  defaultEncAlgo: 'aes-256-gcm',
};

/* ------------------------------------------------------------------ */
/*  Section Wrapper                                                    */
/* ------------------------------------------------------------------ */

function SettingsSection({
  icon,
  title,
  description,
  children,
  delay = 0,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <Card className="glass-card overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            {icon}
            {title}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardHeader>
        <CardContent className="space-y-5">{children}</CardContent>
      </Card>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Setting Row                                                        */
/* ------------------------------------------------------------------ */

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-0.5 min-w-0">
        <Label className="text-sm font-medium text-foreground/90">{label}</Label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function SettingsPage() {
  // Load settings from localStorage (lazy initialization to avoid effect-based setState)
  const [settings, setSettings] = useState<AppSettings>(() => {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<AppSettings>;
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch {
      // ignore corrupted settings
    }
    return DEFAULT_SETTINGS;
  });
  const [clearConfirm, setClearConfirm] = useState(false);
  const [exportDone, setExportDone] = useState(false);
  const [allDataConfirm, setAllDataConfirm] = useState(false);
  const [saved, setSaved] = useState(false);

  // Apply dark mode to <html> element
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (settings.isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [settings.isDark]);

  // Apply compact mode to body
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const body = document.body;
      if (settings.isCompact) {
        body.classList.add('compact-mode');
      } else {
        body.classList.remove('compact-mode');
      }
    }
  }, [settings.isCompact]);

  // Persist settings to localStorage whenever they change
  const updateSetting = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }, []);

  // Auto-clear clipboard logic
  useEffect(() => {
    if (!settings.autoClearClipboard || settings.clipboardTimer === 'never') return;
    const seconds = parseInt(settings.clipboardTimer, 10);
    if (isNaN(seconds)) return;
    const interval = setInterval(() => {
      // Check if clipboard has content and clear it
      // Note: browser clipboard clearing requires user gesture in some browsers
      if (navigator.clipboard) {
        navigator.clipboard.writeText('').catch(() => {});
      }
    }, seconds * 1000);
    return () => clearInterval(interval);
  }, [settings.autoClearClipboard, settings.clipboardTimer]);

  const handleClearHistory = () => {
    if (!clearConfirm) {
      setClearConfirm(true);
      return;
    }
    setClearConfirm(false);
    // Clear any history-related keys from localStorage
    try {
      const keys = Object.keys(localStorage).filter(k => k.includes('history') || k.includes('recent'));
      keys.forEach(k => localStorage.removeItem(k));
    } catch {
      // ignore
    }
  };

  const handleExportSettings = () => {
    const exportData = {
      app: 'CryptoForge',
      version: '1.1.0',
      exportedAt: new Date().toISOString(),
      settings,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cryptoforge-settings.json';
    a.click();
    URL.revokeObjectURL(url);
    setExportDone(true);
    setTimeout(() => setExportDone(false), 2000);
  };

  const handleClearAllData = () => {
    if (!allDataConfirm) {
      setAllDataConfirm(true);
      return;
    }
    setAllDataConfirm(false);
    try {
      localStorage.clear();
      setSettings(DEFAULT_SETTINGS);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-[#2563EB]/10 glow-blue">
            <SettingsIcon className="h-6 w-6 text-[#2563EB]" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold gradient-text">Settings</h2>
          {saved && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1.5 text-xs text-[#10B981]"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Saved
            </motion.div>
          )}
        </div>
        <p className="text-muted-foreground leading-relaxed max-w-2xl">
          Configure CryptoForge to match your workflow. Settings are persisted to your browser&apos;s local storage.
          Adjust appearance, security preferences, and default algorithms.
        </p>
      </motion.div>

      {/* ── Appearance ── */}
      <SettingsSection
        icon={<Palette className="h-5 w-5 text-[#06B6D4]" />}
        title="Appearance"
        description="Customize the look and feel of the application."
        delay={0.1}
      >
        {/* Theme toggle */}
        <SettingRow
          label="Dark Mode"
          description="Use dark theme across the application"
        >
          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4 text-muted-foreground" />
            <Switch
              checked={settings.isDark}
              onCheckedChange={(v) => updateSetting('isDark', v)}
              aria-label="Toggle dark mode"
              className="data-[state=checked]:bg-[#2563EB]"
            />
            <Moon className="h-4 w-4 text-muted-foreground" />
          </div>
        </SettingRow>

        <Separator className="bg-white/5" />

        {/* Compact mode */}
        <SettingRow
          label="Compact Mode"
          description="Reduce spacing and padding for denser layouts"
        >
          <Switch
            checked={settings.isCompact}
            onCheckedChange={(v) => updateSetting('isCompact', v)}
            aria-label="Toggle compact mode"
            className="data-[state=checked]:bg-[#2563EB]"
          />
        </SettingRow>
      </SettingsSection>

      {/* ── Security ── */}
      <SettingsSection
        icon={<Shield className="h-5 w-5 text-[#2563EB]" />}
        title="Security"
        description="Manage security and privacy settings."
        delay={0.2}
      >
        {/* Auto-clear clipboard enable toggle */}
        <SettingRow
          label="Auto-Clear Clipboard"
          description="Automatically clear copied values after a timeout"
        >
          <Switch
            checked={settings.autoClearClipboard}
            onCheckedChange={(v) => updateSetting('autoClearClipboard', v)}
            aria-label="Enable auto-clear clipboard"
            className="data-[state=checked]:bg-[#2563EB]"
          />
        </SettingRow>

        {settings.autoClearClipboard && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <SettingRow
              label="Clear After"
              description="How long to wait before clearing the clipboard"
            >
              <Select
                value={settings.clipboardTimer}
                onValueChange={(v) => updateSetting('clipboardTimer', v)}
              >
                <SelectTrigger className="w-[160px] bg-white/[0.03] border-white/10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CLIPBOARD_TIMERS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </SettingRow>
          </motion.div>
        )}

        <Separator className="bg-white/5" />

        {/* Clear history */}
        <SettingRow
          label="Clear History"
          description="Remove all operation history from local storage"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearHistory}
            className={
              clearConfirm
                ? 'border-red-500/50 text-red-400 hover:bg-red-500/10'
                : 'border-white/10 hover:bg-white/5'
            }
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            {clearConfirm ? 'Confirm Clear' : 'Clear History'}
          </Button>
        </SettingRow>
        {clearConfirm && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-xs text-red-400 -mt-2"
          >
            Click again to confirm. This action cannot be undone.
          </motion.p>
        )}
      </SettingsSection>

      {/* ── Default Algorithm ── */}
      <SettingsSection
        icon={<SettingsIcon className="h-5 w-5 text-[#06B6D4]" />}
        title="Default Algorithms"
        description="Set the algorithms that are pre-selected when you open each tool."
        delay={0.3}
      >
        {/* Default hash algorithm */}
        <SettingRow
          label="Hash Algorithm"
          description="Default algorithm for the hashing tool"
        >
          <Select
            value={settings.defaultHashAlgo}
            onValueChange={(v) => updateSetting('defaultHashAlgo', v)}
          >
            <SelectTrigger className="w-[200px] bg-white/[0.03] border-white/10 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HASH_ALGORITHMS.map((a) => (
                <SelectItem key={a.value} value={a.value}>
                  {a.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingRow>

        <Separator className="bg-white/5" />

        {/* Default encryption algorithm */}
        <SettingRow
          label="Encryption Algorithm"
          description="Default algorithm for the encryption tool"
        >
          <Select
            value={settings.defaultEncAlgo}
            onValueChange={(v) => updateSetting('defaultEncAlgo', v)}
          >
            <SelectTrigger className="w-[200px] bg-white/[0.03] border-white/10 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ENCRYPTION_ALGORITHMS.map((a) => (
                <SelectItem key={a.value} value={a.value}>
                  {a.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingRow>
      </SettingsSection>

      {/* ── Data ── */}
      <SettingsSection
        icon={<Download className="h-5 w-5 text-[#2563EB]" />}
        title="Data"
        description="Export or clear your application data."
        delay={0.4}
      >
        <SettingRow
          label="Export Settings"
          description="Download all settings as a JSON file"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportSettings}
            className="border-white/10 hover:bg-white/5"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            {exportDone ? 'Exported!' : 'Export'}
          </Button>
        </SettingRow>

        <Separator className="bg-white/5" />

        <SettingRow
          label="Clear All Data"
          description="Reset all settings and remove all stored data"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearAllData}
            className={
              allDataConfirm
                ? 'border-red-500/50 text-red-400 hover:bg-red-500/10'
                : 'border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50'
            }
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            {allDataConfirm ? 'Confirm Reset' : 'Clear All'}
          </Button>
        </SettingRow>
        {allDataConfirm && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-xs text-red-400 -mt-2"
          >
            Click again to confirm. This will reset all settings to defaults.
          </motion.p>
        )}
      </SettingsSection>

      {/* ── About ── */}
      <SettingsSection
        icon={<Info className="h-5 w-5 text-[#06B6D4]" />}
        title="About"
        description="Application information."
        delay={0.5}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-lg p-4 bg-white/[0.02] border border-white/5">
            <p className="text-xs text-muted-foreground mb-1">Version</p>
            <div className="flex items-center gap-2">
              <p className="text-lg font-semibold">1.1.0</p>
              <Badge variant="secondary" className="bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20 text-[10px]">
                Stable
              </Badge>
            </div>
          </div>
          <div className="rounded-lg p-4 bg-white/[0.02] border border-white/5">
            <p className="text-xs text-muted-foreground mb-1">License</p>
            <p className="text-sm font-medium">CryptoForge Attribution</p>
          </div>
          <div className="rounded-lg p-4 bg-white/[0.02] border border-white/5">
            <p className="text-xs text-muted-foreground mb-1">Author</p>
            <p className="text-sm font-medium">CySec Don</p>
            <p className="text-xs text-muted-foreground">cysecdon@gmail.com</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="secondary" className="bg-white/5 text-muted-foreground">
            Next.js 16
          </Badge>
          <Badge variant="secondary" className="bg-white/5 text-muted-foreground">
            TypeScript
          </Badge>
          <Badge variant="secondary" className="bg-white/5 text-muted-foreground">
            Web Crypto API
          </Badge>
          <Badge variant="secondary" className="bg-white/5 text-muted-foreground">
            @noble/libraries
          </Badge>
          <Badge variant="secondary" className="bg-white/5 text-muted-foreground">
            hash-wasm
          </Badge>
          <Badge variant="secondary" className="bg-white/5 text-muted-foreground">
            Tailwind CSS
          </Badge>
          <Badge variant="secondary" className="bg-white/5 text-muted-foreground">
            Framer Motion
          </Badge>
        </div>
      </SettingsSection>
    </div>
  );
}
