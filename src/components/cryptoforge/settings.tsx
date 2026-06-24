'use client';

import { useState } from 'react';
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
  { value: 'sha-256', label: 'SHA-256' },
  { value: 'sha-384', label: 'SHA-384' },
  { value: 'sha-512', label: 'SHA-512' },
  { value: 'sha-1', label: 'SHA-1' },
  { value: 'sha3-256', label: 'SHA3-256' },
  { value: 'sha3-512', label: 'SHA3-512' },
  { value: 'md5', label: 'MD5' },
];

const ENCRYPTION_ALGORITHMS = [
  { value: 'aes-256-gcm', label: 'AES-256-GCM' },
  { value: 'aes-128-gcm', label: 'AES-128-GCM' },
  { value: 'aes-256-cbc', label: 'AES-256-CBC' },
  { value: 'aes-128-cbc', label: 'AES-128-CBC' },
];

const CLIPBOARD_TIMERS = [
  { value: '15', label: '15 seconds' },
  { value: '30', label: '30 seconds' },
  { value: '60', label: '1 minute' },
  { value: '120', label: '2 minutes' },
  { value: 'never', label: 'Never' },
];

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
  const [isDark, setIsDark] = useState(true);
  const [isCompact, setIsCompact] = useState(false);
  const [clipboardTimer, setClipboardTimer] = useState('30');
  const [defaultHashAlgo, setDefaultHashAlgo] = useState('sha-256');
  const [defaultEncAlgo, setDefaultEncAlgo] = useState('aes-256-gcm');
  const [clearConfirm, setClearConfirm] = useState(false);
  const [exportDone, setExportDone] = useState(false);

  const handleClearHistory = () => {
    if (!clearConfirm) {
      setClearConfirm(true);
      return;
    }
    setClearConfirm(false);
    // In a real app, this would clear actual history
  };

  const handleExportSettings = () => {
    const settings = {
      appearance: { darkMode: isDark, compactMode: isCompact },
      security: { autoClearClipboard: clipboardTimer },
      defaults: { hashAlgorithm: defaultHashAlgo, encryptionAlgorithm: defaultEncAlgo },
    };
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
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
    // In a real app, this would clear all local storage / data
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
        </div>
        <p className="text-muted-foreground leading-relaxed max-w-2xl">
          Configure CryptoForge to match your workflow. Adjust appearance, security preferences,
          and default algorithms.
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
              checked={isDark}
              onCheckedChange={setIsDark}
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
            checked={isCompact}
            onCheckedChange={setIsCompact}
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
        {/* Auto-clear clipboard */}
        <SettingRow
          label="Auto-Clear Clipboard"
          description="Automatically clear copied values after a timeout"
        >
          <Select value={clipboardTimer} onValueChange={setClipboardTimer}>
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
          <Select value={defaultHashAlgo} onValueChange={setDefaultHashAlgo}>
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
          <Select value={defaultEncAlgo} onValueChange={setDefaultEncAlgo}>
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
            className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Clear All
          </Button>
        </SettingRow>
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
              <p className="text-lg font-semibold">1.0.0</p>
              <Badge variant="secondary" className="bg-[#06B6D4]/10 text-[#06B6D4] border-[#06B6D4]/20 text-[10px]">
                Stable
              </Badge>
            </div>
          </div>
          <div className="rounded-lg p-4 bg-white/[0.02] border border-white/5">
            <p className="text-xs text-muted-foreground mb-1">License</p>
            <p className="text-sm font-medium">MIT License</p>
          </div>
          <div className="rounded-lg p-4 bg-white/[0.02] border border-white/5">
            <p className="text-xs text-muted-foreground mb-1">Credits</p>
            <p className="text-sm font-medium">CryptoForge Team</p>
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
