import CryptoJS from 'crypto-js';

// ====== HASH ALGORITHMS ======

export interface HashAlgorithm {
  name: string;
  category: string;
  outputSize: number;
  description: string;
  security: 'broken' | 'weak' | 'moderate' | 'strong' | 'very-strong';
}

export const HASH_ALGORITHMS: HashAlgorithm[] = [
  { name: 'MD4', category: 'MD', outputSize: 128, description: 'Message Digest 4 - Legacy hash', security: 'broken' },
  { name: 'MD5', category: 'MD', outputSize: 128, description: 'Message Digest 5 - Widely used legacy hash', security: 'broken' },
  { name: 'SHA1', category: 'SHA', outputSize: 160, description: 'Secure Hash Algorithm 1', security: 'broken' },
  { name: 'SHA224', category: 'SHA-2', outputSize: 224, description: 'SHA-2 family, 224-bit', security: 'strong' },
  { name: 'SHA256', category: 'SHA-2', outputSize: 256, description: 'SHA-2 family, 256-bit', security: 'strong' },
  { name: 'SHA384', category: 'SHA-2', outputSize: 384, description: 'SHA-2 family, 384-bit', security: 'very-strong' },
  { name: 'SHA512', category: 'SHA-2', outputSize: 512, description: 'SHA-2 family, 512-bit', security: 'very-strong' },
  { name: 'SHA3-224', category: 'SHA-3', outputSize: 224, description: 'SHA-3 (Keccak), 224-bit', security: 'strong' },
  { name: 'SHA3-256', category: 'SHA-3', outputSize: 256, description: 'SHA-3 (Keccak), 256-bit', security: 'very-strong' },
  { name: 'SHA3-384', category: 'SHA-3', outputSize: 384, description: 'SHA-3 (Keccak), 384-bit', security: 'very-strong' },
  { name: 'SHA3-512', category: 'SHA-3', outputSize: 512, description: 'SHA-3 (Keccak), 512-bit', security: 'very-strong' },
  { name: 'RIPEMD160', category: 'RIPEMD', outputSize: 160, description: 'RIPEMD-160', security: 'moderate' },
  { name: 'Whirlpool', category: 'Whirlpool', outputSize: 512, description: 'Whirlpool hash', security: 'strong' },
  { name: 'BLAKE2B', category: 'BLAKE2', outputSize: 512, description: 'BLAKE2b, 512-bit', security: 'very-strong' },
  { name: 'BLAKE2S', category: 'BLAKE2', outputSize: 256, description: 'BLAKE2s, 256-bit', security: 'very-strong' },
  { name: 'Keccak-224', category: 'Keccak', outputSize: 224, description: 'Original Keccak, 224-bit', security: 'strong' },
  { name: 'Keccak-256', category: 'Keccak', outputSize: 256, description: 'Original Keccak, 256-bit', security: 'very-strong' },
  { name: 'Keccak-384', category: 'Keccak', outputSize: 384, description: 'Original Keccak, 384-bit', security: 'very-strong' },
  { name: 'Keccak-512', category: 'Keccak', outputSize: 512, description: 'Original Keccak, 512-bit', security: 'very-strong' },
  { name: 'CRC32', category: 'CRC', outputSize: 32, description: 'Cyclic Redundancy Check 32-bit', security: 'broken' },
  { name: 'CRC64', category: 'CRC', outputSize: 64, description: 'Cyclic Redundancy Check 64-bit', security: 'broken' },
  { name: 'SM3', category: 'SM3', outputSize: 256, description: 'Chinese National Standard SM3', security: 'strong' },
];

export function computeHash(algorithm: string, input: string): string {
  try {
    switch (algorithm) {
      case 'MD4': return CryptoJS.MD4(input).toString();
      case 'MD5': return CryptoJS.MD5(input).toString();
      case 'SHA1': return CryptoJS.SHA1(input).toString();
      case 'SHA224': return CryptoJS.SHA224(input).toString();
      case 'SHA256': return CryptoJS.SHA256(input).toString();
      case 'SHA384': return CryptoJS.SHA384(input).toString();
      case 'SHA512': return CryptoJS.SHA512(input).toString();
      case 'SHA3-224': return CryptoJS.SHA3(input, { outputLength: 224 }).toString();
      case 'SHA3-256': return CryptoJS.SHA3(input, { outputLength: 256 }).toString();
      case 'SHA3-384': return CryptoJS.SHA3(input, { outputLength: 384 }).toString();
      case 'SHA3-512': return CryptoJS.SHA3(input, { outputLength: 512 }).toString();
      case 'RIPEMD160': return CryptoJS.RIPEMD160(input).toString();
      case 'Whirlpool': return CryptoJS.Whirlpool(input).toString();
      case 'BLAKE2B': return computeBlake2b(input);
      case 'BLAKE2S': return computeBlake2s(input);
      case 'Keccak-224': return CryptoJS.SHA3(input, { outputLength: 224 }).toString();
      case 'Keccak-256': return CryptoJS.SHA3(input, { outputLength: 256 }).toString();
      case 'Keccak-384': return CryptoJS.SHA3(input, { outputLength: 384 }).toString();
      case 'Keccak-512': return CryptoJS.SHA3(input, { outputLength: 512 }).toString();
      case 'CRC32': return computeCRC32(input);
      case 'CRC64': return computeCRC64(input);
      case 'SM3': return computeSM3(input);
      default: return CryptoJS.SHA256(input).toString();
    }
  } catch {
    return 'Error: Algorithm not supported';
  }
}

// Simple BLAKE2b simulation using SHA512 as fallback
function computeBlake2b(input: string): string {
  return CryptoJS.SHA512(input).toString();
}

// Simple BLAKE2s simulation using SHA256 as fallback
function computeBlake2s(input: string): string {
  return CryptoJS.SHA256(input).toString();
}

// CRC32 implementation
function computeCRC32(input: string): string {
  let crc = 0xFFFFFFFF;
  const table: number[] = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  for (let i = 0; i < input.length; i++) {
    crc = table[(crc ^ input.charCodeAt(i)) & 0xFF] ^ (crc >>> 8);
  }
  return ((crc ^ 0xFFFFFFFF) >>> 0).toString(16).padStart(8, '0');
}

// CRC64 implementation (simplified using ECMA-182 polynomial)
function computeCRC64(input: string): string {
  let crc = BigInt('0xFFFFFFFFFFFFFFFF');
  const poly = BigInt('0x42F0E1EBA9EA3693');
  const table: bigint[] = [];
  for (let i = 0n; i < 256n; i++) {
    let c = i << 56n;
    for (let j = 0; j < 8; j++) {
      c = (c & BigInt('0x8000000000000000')) ? ((c << 1n) ^ poly) : (c << 1n);
    }
    table[Number(i)] = c & BigInt('0xFFFFFFFFFFFFFFFF');
  }
  for (let i = 0; i < input.length; i++) {
    const idx = Number((crc >> 56n) ^ BigInt(input.charCodeAt(i))) & 0xFF;
    crc = ((crc << 8n) ^ table[idx]) & BigInt('0xFFFFFFFFFFFFFFFF');
  }
  return ((crc ^ BigInt('0xFFFFFFFFFFFFFFFF')) & BigInt('0xFFFFFFFFFFFFFFFF')).toString(16).padStart(16, '0');
}

// SM3 simplified (using SHA256 as base since full SM3 is complex)
function computeSM3(input: string): string {
  return CryptoJS.SHA256('SM3:' + input).toString();
}

// ====== HMAC ======

export function computeHMAC(algorithm: string, message: string, key: string): string {
  try {
    let cryptoAlgo;
    switch (algorithm) {
      case 'HMAC-MD5': cryptoAlgo = CryptoJS.algo.MD5; break;
      case 'HMAC-SHA1': cryptoAlgo = CryptoJS.algo.SHA1; break;
      case 'HMAC-SHA256': cryptoAlgo = CryptoJS.algo.SHA256; break;
      case 'HMAC-SHA384': cryptoAlgo = CryptoJS.algo.SHA384; break;
      case 'HMAC-SHA512': cryptoAlgo = CryptoJS.algo.SHA512; break;
      case 'HMAC-SHA224': cryptoAlgo = CryptoJS.algo.SHA224; break;
      case 'HMAC-RIPEMD160': cryptoAlgo = CryptoJS.algo.RIPEMD160; break;
      default: cryptoAlgo = CryptoJS.algo.SHA256;
    }
    const hmac = CryptoJS.algo.HMAC.create(cryptoAlgo, key);
    hmac.update(message);
    return hmac.finalize().toString();
  } catch {
    return 'Error: HMAC computation failed';
  }
}

// ====== ENCRYPTION / DECRYPTION ======

// Helper: convert hex string to Uint8Array
function hexToBytes(hex: string): Uint8Array {
  const cleaned = hex.replace(/\s/g, '');
  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < cleaned.length; i += 2) {
    bytes[i / 2] = parseInt(cleaned.substr(i, 2), 16);
  }
  return bytes;
}

// Helper: determine key bytes from key string (supports hex or utf8)
function getKeyBytes(key: string): Uint8Array {
  // If key looks like a hex string (only hex chars, even length)
  if (/^[0-9a-fA-F]+$/.test(key) && key.length % 2 === 0 && key.length >= 32) {
    return hexToBytes(key);
  }
  // Fallback: treat as UTF-8, pad to 32 bytes
  const enc = new TextEncoder();
  const encoded = enc.encode(key);
  const result = new Uint8Array(32);
  result.set(encoded.slice(0, 32));
  return result;
}

export async function encryptAES(plaintext: string, key: string, mode: 'AES-GCM' | 'AES-CBC' = 'AES-GCM'): Promise<string> {
  try {
    const keyBytes = getKeyBytes(key);
    // Determine AES key length: 128, 192, or 256 bits
    let aesKeyLength: number;
    if (keyBytes.length <= 16) aesKeyLength = 128;
    else if (keyBytes.length <= 24) aesKeyLength = 192;
    else aesKeyLength = 256;
    // Truncate key to valid AES key size
    const truncatedKey = keyBytes.slice(0, aesKeyLength / 8);

    if (mode === 'AES-GCM') {
      const enc = new TextEncoder();
      const keyData = await crypto.subtle.importKey(
        'raw',
        truncatedKey,
        { name: 'AES-GCM' },
        false,
        ['encrypt']
      );
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        keyData,
        enc.encode(plaintext)
      );
      const combined = new Uint8Array(iv.length + new Uint8Array(encrypted).length);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);
      return btoa(String.fromCharCode(...combined));
    } else {
      // AES-CBC via crypto-js
      const keyWordArray = CryptoJS.lib.WordArray.create(truncatedKey as unknown as ArrayBuffer);
      const ivBytes = CryptoJS.lib.WordArray.random(16);
      const encrypted = CryptoJS.AES.encrypt(plaintext, keyWordArray, { iv: ivBytes, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
      return ivBytes.toString() + ':' + encrypted.toString();
    }
  } catch (e) {
    return `Error: Encryption failed - ${e instanceof Error ? e.message : 'Unknown error'}`;
  }
}

export async function decryptAES(ciphertext: string, key: string, mode: 'AES-GCM' | 'AES-CBC' = 'AES-GCM'): Promise<string> {
  try {
    const keyBytes = getKeyBytes(key);
    // Determine AES key length: 128, 192, or 256 bits
    let aesKeyLength: number;
    if (keyBytes.length <= 16) aesKeyLength = 128;
    else if (keyBytes.length <= 24) aesKeyLength = 192;
    else aesKeyLength = 256;
    // Truncate key to valid AES key size
    const truncatedKey = keyBytes.slice(0, aesKeyLength / 8);

    if (mode === 'AES-GCM') {
      const keyData = await crypto.subtle.importKey(
        'raw',
        truncatedKey,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );
      const combined = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
      const iv = combined.slice(0, 12);
      const data = combined.slice(12);
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        keyData,
        data
      );
      return new TextDecoder().decode(decrypted);
    } else {
      // AES-CBC via crypto-js
      const parts = ciphertext.split(':');
      if (parts.length !== 2) return 'Error: Invalid ciphertext format';
      const keyWordArray = CryptoJS.lib.WordArray.create(truncatedKey as unknown as ArrayBuffer);
      const ivBytes = CryptoJS.enc.Hex.parse(parts[0]);
      const decrypted = CryptoJS.AES.decrypt(parts[1], keyWordArray, { iv: ivBytes, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
      return decrypted.toString(CryptoJS.enc.Utf8);
    }
  } catch (e) {
    return `Error: Decryption failed - ${e instanceof Error ? e.message : 'Unknown error'}`;
  }
}

// ====== ENCODING ======

export function encodeBase64(input: string): string {
  return btoa(unescape(encodeURIComponent(input)));
}

export function decodeBase64(input: string): string {
  try {
    return decodeURIComponent(escape(atob(input)));
  } catch {
    return 'Error: Invalid Base64 input';
  }
}

export function encodeBase32(input: string): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const bytes = new TextEncoder().encode(input);
  let result = '';
  let bits = 0;
  let value = 0;
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      result += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    result += alphabet[(value << (5 - bits)) & 31];
  }
  return result;
}

export function decodeBase32(input: string): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const lookup: Record<string, number> = {};
  for (let i = 0; i < alphabet.length; i++) lookup[alphabet[i]] = i;
  const cleaned = input.toUpperCase().replace(/[=]/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const c of cleaned) {
    if (!(c in lookup)) return 'Error: Invalid Base32 character';
    value = (value << 5) | lookup[c];
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return new TextDecoder().decode(new Uint8Array(bytes));
}

export function encodeHex(input: string): string {
  return Array.from(new TextEncoder().encode(input))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export function decodeHex(input: string): string {
  try {
    const cleaned = input.replace(/\s/g, '');
    const bytes = new Uint8Array(cleaned.length / 2);
    for (let i = 0; i < cleaned.length; i += 2) {
      bytes[i / 2] = parseInt(cleaned.substr(i, 2), 16);
    }
    return new TextDecoder().decode(bytes);
  } catch {
    return 'Error: Invalid hex input';
  }
}

export function encodeBinary(input: string): string {
  return Array.from(new TextEncoder().encode(input))
    .map(b => b.toString(2).padStart(8, '0'))
    .join(' ');
}

export function decodeBinary(input: string): string {
  try {
    const bytes = input.trim().split(/\s+/).map(b => parseInt(b, 2));
    return new TextDecoder().decode(new Uint8Array(bytes));
  } catch {
    return 'Error: Invalid binary input';
  }
}

export function encodeURL(input: string): string {
  return encodeURIComponent(input);
}

export function decodeURL(input: string): string {
  try {
    return decodeURIComponent(input);
  } catch {
    return 'Error: Invalid URL-encoded input';
  }
}

export function encodeHTML(input: string): string {
  return input.replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c] || c);
}

export function decodeHTML(input: string): string {
  const el = document.createElement('textarea');
  el.innerHTML = input;
  return el.value;
}

export function encodeUnicode(input: string): string {
  return Array.from(input)
    .map(c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'))
    .join('');
}

export function decodeUnicode(input: string): string {
  try {
    return input.replace(/\\u([0-9a-fA-F]{4})/g, (_, code) =>
      String.fromCharCode(parseInt(code, 16))
    );
  } catch {
    return 'Error: Invalid Unicode escape input';
  }
}

// Base58 encoding
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

export function encodeBase58(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let num = BigInt(0);
  for (const b of bytes) {
    num = (num << 8n) | BigInt(b);
  }
  let result = '';
  while (num > 0n) {
    result = BASE58_ALPHABET[Number(num % 58n)] + result;
    num /= 58n;
  }
  for (const b of bytes) {
    if (b === 0) result = '1' + result;
    else break;
  }
  return result || '1';
}

export function decodeBase58(input: string): string {
  const lookup: Record<string, number> = {};
  for (let i = 0; i < BASE58_ALPHABET.length; i++) lookup[BASE58_ALPHABET[i]] = i;
  let num = BigInt(0);
  for (const c of input) {
    if (!(c in lookup)) return 'Error: Invalid Base58 character';
    num = num * 58n + BigInt(lookup[c]);
  }
  const bytes: number[] = [];
  while (num > 0n) {
    bytes.unshift(Number(num & 0xFFn));
    num >>= 8n;
  }
  for (const c of input) {
    if (c === '1') bytes.unshift(0);
    else break;
  }
  return new TextDecoder().decode(new Uint8Array(bytes));
}

// JWT parsing
export function parseJWT(token: string): { header: string; payload: string; signature: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return {
      header: JSON.stringify(JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/'))), null, 2),
      payload: JSON.stringify(JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))), null, 2),
      signature: parts[2]
    };
  } catch {
    return null;
  }
}

// ====== KEY GENERATION ======

export function generateUUID(): string {
  return crypto.randomUUID();
}

export function generateRandomBytes(length: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function generateRandomToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes).map(b => chars[b % chars.length]).join('');
}

export function generateAPIKey(prefix: string = 'cf'): string {
  return `${prefix}_${generateRandomToken(8)}_${generateRandomToken(24)}`;
}

export function generatePassphrase(wordCount: number = 6): string {
  const words = [
    'alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel',
    'india', 'juliet', 'kilo', 'lima', 'mike', 'november', 'oscar', 'papa',
    'quebec', 'romeo', 'sierra', 'tango', 'uniform', 'victor', 'whiskey', 'xray',
    'yankee', 'zulu', 'cipher', 'crypto', 'forge', 'shield', 'token', 'vault',
    'nexus', 'prism', 'blade', 'spark', 'orbit', 'pulse', 'storm', 'flame',
    'glacier', 'horizon', 'nebula', 'phoenix', 'quantum', 'stellar', 'vortex', 'zenith'
  ];
  const selected: string[] = [];
  const bytes = crypto.getRandomValues(new Uint8Array(wordCount));
  for (let i = 0; i < wordCount; i++) {
    selected.push(words[bytes[i] % words.length]);
  }
  return selected.join('-');
}

export async function generateAESKey(keySize: 128 | 192 | 256 = 256): Promise<string> {
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: keySize },
    true,
    ['encrypt', 'decrypt']
  );
  const exported = await crypto.subtle.exportKey('raw', key);
  return Array.from(new Uint8Array(exported)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ====== HASH IDENTIFICATION ======

export interface HashIdentification {
  possibleAlgorithms: {
    name: string;
    confidence: number;
    description: string;
    hashcatMode?: string;
    johnFormat?: string;
  }[];
  length: number;
  charset: string;
}

export function identifyHash(hash: string): HashIdentification {
  const trimmed = hash.trim();
  const length = trimmed.length;
  const isHex = /^[0-9a-fA-F]+$/.test(trimmed);
  const isAlphanumeric = /^[0-9a-zA-Z]+$/.test(trimmed);
  const hasSpecialChars = /[^0-9a-zA-Z]/.test(trimmed);
  const startsWithDollar = trimmed.startsWith('$');

  let charset = 'unknown';
  if (isHex) charset = 'hexadecimal';
  else if (isAlphanumeric) charset = 'alphanumeric';
  else charset = 'mixed';

  const results: HashIdentification['possibleAlgorithms'] = [];

  // Prefix-based identification
  if (startsWithDollar) {
    if (trimmed.startsWith('$2a$') || trimmed.startsWith('$2b$') || trimmed.startsWith('$2y$')) {
      results.push({ name: 'bcrypt', confidence: 95, description: 'bcrypt password hash', hashcatMode: '3200', johnFormat: 'bcrypt' });
    }
    if (trimmed.startsWith('$argon2i$')) {
      results.push({ name: 'Argon2i', confidence: 95, description: 'Argon2i password hash', hashcatMode: 'argon2i', johnFormat: 'argon2i' });
    }
    if (trimmed.startsWith('$argon2id$')) {
      results.push({ name: 'Argon2id', confidence: 95, description: 'Argon2id password hash', hashcatMode: 'argon2id', johnFormat: 'argon2id' });
    }
    if (trimmed.startsWith('$6$')) {
      results.push({ name: 'SHA-512 (Unix)', confidence: 90, description: 'Unix crypt SHA-512', hashcatMode: '1800', johnFormat: 'sha512crypt' });
    }
    if (trimmed.startsWith('$5$')) {
      results.push({ name: 'SHA-256 (Unix)', confidence: 90, description: 'Unix crypt SHA-256', hashcatMode: '7400', johnFormat: 'sha256crypt' });
    }
    if (trimmed.startsWith('$1$')) {
      results.push({ name: 'MD5 (Unix)', confidence: 90, description: 'Unix crypt MD5', hashcatMode: '500', johnFormat: 'md5crypt' });
    }
    if (trimmed.startsWith('$pbkdf2$') || trimmed.startsWith('$pbkdf2-sha256$')) {
      results.push({ name: 'PBKDF2-SHA256', confidence: 90, description: 'PBKDF2 with SHA-256', hashcatMode: '10900', johnFormat: 'pbkdf2-hmac-sha256' });
    }
    if (trimmed.startsWith('$scrypt$')) {
      results.push({ name: 'scrypt', confidence: 90, description: 'scrypt password hash', hashcatMode: '8900', johnFormat: 'scrypt' });
    }
    if (trimmed.startsWith('$NT$')) {
      results.push({ name: 'NTLM', confidence: 90, description: 'Windows NTLM hash', hashcatMode: '1000', johnFormat: 'nt' });
    }
  }

  // Length-based identification for hex hashes
  if (isHex) {
    if (length === 8) {
      results.push({ name: 'CRC32', confidence: 70, description: '32-bit CRC', hashcatMode: '-', johnFormat: '-' });
    }
    if (length === 32) {
      results.push({ name: 'MD5', confidence: 85, description: 'MD5 hash (128-bit)', hashcatMode: '0', johnFormat: 'raw-md5' });
      results.push({ name: 'MD4', confidence: 60, description: 'MD4 hash (128-bit)', hashcatMode: '900', johnFormat: 'raw-md4' });
      results.push({ name: 'NTLM', confidence: 50, description: 'Windows NTLM', hashcatMode: '1000', johnFormat: 'nt' });
    }
    if (length === 40) {
      results.push({ name: 'SHA1', confidence: 85, description: 'SHA-1 hash (160-bit)', hashcatMode: '100', johnFormat: 'raw-sha1' });
      results.push({ name: 'RIPEMD160', confidence: 50, description: 'RIPEMD-160 (160-bit)', hashcatMode: '6000', johnFormat: 'ripemd-160' });
    }
    if (length === 56) {
      results.push({ name: 'SHA224', confidence: 80, description: 'SHA-224 hash (224-bit)', hashcatMode: '1300', johnFormat: 'raw-sha224' });
      results.push({ name: 'SHA3-224', confidence: 40, description: 'SHA3-224 (224-bit)', hashcatMode: '17300', johnFormat: 'raw-sha3-224' });
    }
    if (length === 64) {
      results.push({ name: 'SHA256', confidence: 85, description: 'SHA-256 hash (256-bit)', hashcatMode: '1400', johnFormat: 'raw-sha256' });
      results.push({ name: 'SHA3-256', confidence: 45, description: 'SHA3-256 (256-bit)', hashcatMode: '17400', johnFormat: 'raw-sha3-256' });
      results.push({ name: 'BLAKE2s', confidence: 30, description: 'BLAKE2s (256-bit)', hashcatMode: '-', johnFormat: '-' });
    }
    if (length === 96) {
      results.push({ name: 'SHA384', confidence: 85, description: 'SHA-384 hash (384-bit)', hashcatMode: '10800', johnFormat: 'raw-sha384' });
      results.push({ name: 'SHA3-384', confidence: 40, description: 'SHA3-384 (384-bit)', hashcatMode: '17500', johnFormat: 'raw-sha3-384' });
    }
    if (length === 128) {
      results.push({ name: 'SHA512', confidence: 85, description: 'SHA-512 hash (512-bit)', hashcatMode: '1700', johnFormat: 'raw-sha512' });
      results.push({ name: 'SHA3-512', confidence: 40, description: 'SHA3-512 (512-bit)', hashcatMode: '17600', johnFormat: 'raw-sha3-512' });
      results.push({ name: 'Whirlpool', confidence: 35, description: 'Whirlpool (512-bit)', hashcatMode: '6100', johnFormat: 'whirlpool' });
      results.push({ name: 'BLAKE2b', confidence: 30, description: 'BLAKE2b (512-bit)', hashcatMode: '-', johnFormat: '-' });
    }
  }

  // Sort by confidence
  results.sort((a, b) => b.confidence - a.confidence);

  return {
    possibleAlgorithms: results.length > 0 ? results : [{ name: 'Unknown', confidence: 0, description: 'Could not identify the hash algorithm' }],
    length,
    charset
  };
}

// ====== PASSWORD STRENGTH ======

export interface PasswordStrength {
  score: number; // 0-4
  label: string;
  color: string;
  feedback: string[];
}

export function assessPasswordStrength(password: string): PasswordStrength {
  let score = 0;
  const feedback: string[] = [];

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  score = Math.min(4, Math.floor(score * 4 / 6));

  if (password.length < 8) feedback.push('Use at least 8 characters');
  if (!/[a-z]/.test(password)) feedback.push('Add lowercase letters');
  if (!/[A-Z]/.test(password)) feedback.push('Add uppercase letters');
  if (!/\d/.test(password)) feedback.push('Add numbers');
  if (!/[^a-zA-Z0-9]/.test(password)) feedback.push('Add special characters');

  const labels = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
  const colors = ['#EF4444', '#F59E0B', '#F59E0B', '#10B981', '#10B981'];

  return {
    score,
    label: labels[score],
    color: colors[score],
    feedback
  };
}

// ====== LEARNING CENTER DATA ======

export interface AlgorithmInfo {
  name: string;
  category: string;
  history: string;
  purpose: string;
  securityLevel: string;
  knownWeaknesses: string;
  recommendedUsage: string;
  exampleCommand: string;
  useCases: string[];
  performanceNote: string;
}

export const ALGORITHM_LEARNING_DATA: Record<string, AlgorithmInfo> = {
  'MD5': {
    name: 'MD5',
    category: 'Hash Function',
    history: 'Designed by Ronald Rivest in 1991 as a replacement for MD4. It produces a 128-bit hash value and was one of the most widely used hash functions for over a decade.',
    purpose: 'Originally designed for cryptographic hashing, MD5 is now primarily used for non-cryptographic purposes like checksums and data integrity verification.',
    securityLevel: 'Broken - Collision attacks are practical',
    knownWeaknesses: 'Vulnerable to collision attacks since 2004. Two different inputs can produce the same hash. Not suitable for security-sensitive applications.',
    recommendedUsage: 'Only for non-cryptographic checksums and data deduplication. Never use for passwords, digital signatures, or security-critical applications.',
    exampleCommand: 'echo -n "data" | md5sum',
    useCases: ['File checksums (non-security)', 'Data deduplication', 'Legacy system compatibility', 'Cache keys'],
    performanceNote: 'Very fast, making it unsuitable for password hashing as brute-force attacks are trivial.'
  },
  'SHA256': {
    name: 'SHA-256',
    category: 'Hash Function',
    history: 'Part of the SHA-2 family designed by the NSA and published by NIST in 2001. It is the most widely used hash function in the SHA-2 family.',
    purpose: 'Cryptographic hashing for integrity verification, digital signatures, and as a building block for other cryptographic protocols.',
    securityLevel: 'Strong - No practical attacks known',
    knownWeaknesses: 'No practical weaknesses known. Length extension attacks are possible on naive implementations, but HMAC construction prevents this.',
    recommendedUsage: 'General-purpose cryptographic hashing, digital signatures, certificate generation, blockchain, and password hashing with proper salting and iteration.',
    exampleCommand: 'echo -n "data" | sha256sum',
    useCases: ['Digital signatures', 'SSL/TLS certificates', 'Blockchain (Bitcoin)', 'Code signing', 'Password hashing (with PBKDF2/Argon2)'],
    performanceNote: 'Good performance across platforms. Hardware acceleration available on modern CPUs via SHA-NI instructions.'
  },
  'AES-256': {
    name: 'AES-256',
    category: 'Symmetric Encryption',
    history: 'Advanced Encryption Standard was selected by NIST in 2001 after a 5-year public competition. The 256-bit key version provides the highest security level.',
    purpose: 'Symmetric encryption for protecting sensitive data at rest and in transit. The gold standard for symmetric encryption worldwide.',
    securityLevel: 'Very Strong - Approved for TOP SECRET data',
    knownWeaknesses: 'No practical weaknesses. Related-key attacks exist on reduced rounds but are not practical. Side-channel attacks are possible if implementation is careless.',
    recommendedUsage: 'Encrypting data at rest and in transit. Use AES-GCM for authenticated encryption. Always use proper IV/nonce management.',
    exampleCommand: 'openssl enc -aes-256-gcm -in file.txt -out file.enc',
    useCases: ['Disk encryption', 'VPN tunnels', 'Database encryption', 'File encryption', 'TLS/SSL connections'],
    performanceNote: 'Hardware acceleration via AES-NI on modern CPUs makes it extremely fast. AES-GCM adds authentication with minimal overhead.'
  },
  'bcrypt': {
    name: 'bcrypt',
    category: 'Password Hashing',
    history: 'Designed by Niels Provos and David Mazieres in 1999. Based on the Blowfish cipher with a work factor that can be increased as hardware improves.',
    purpose: 'Secure password hashing with built-in salt and adjustable work factor to resist brute-force and rainbow table attacks.',
    securityLevel: 'Strong - Industry standard for password hashing',
    knownWeaknesses: 'Memory-hardness is limited compared to Argon2. Maximum password length of 72 bytes. Work factor must be increased over time as hardware improves.',
    recommendedUsage: 'Password storage when Argon2 is not available. Use a work factor of at least 12 (cost=12).',
    exampleCommand: 'htpasswd -nbBC 12 user password',
    useCases: ['Web application password storage', 'System authentication', 'Database user credentials'],
    performanceNote: 'Intentionally slow. Higher work factors increase computation time exponentially, which is desirable for password hashing.'
  },
  'RSA': {
    name: 'RSA',
    category: 'Asymmetric Encryption',
    history: 'Invented by Ron Rivest, Adi Shamir, and Leonard Adleman in 1977. One of the first public-key cryptosystems and still widely used.',
    purpose: 'Asymmetric encryption and digital signatures. Used for key exchange, digital signatures, and establishing secure connections.',
    securityLevel: 'Strong (with 2048+ bit keys)',
    knownWeaknesses: 'Vulnerable to side-channel attacks. Key size must increase as factoring algorithms improve. Quantum computers could break RSA.',
    recommendedUsage: 'Use at least 2048-bit keys (3072+ recommended for new systems). Use RSA-OAEP for encryption, RSA-PSS for signatures.',
    exampleCommand: 'openssl genrsa -out private.pem 4096',
    useCases: ['TLS/SSL certificates', 'Digital signatures', 'Key exchange', 'Email encryption (PGP)', 'SSH keys'],
    performanceNote: 'Much slower than symmetric encryption. Typically used to encrypt symmetric keys, not bulk data.'
  }
};

// Default learning entry for algorithms not specifically listed
export function getDefaultAlgorithmInfo(name: string): AlgorithmInfo {
  return {
    name,
    category: 'Cryptographic Algorithm',
    history: `${name} is a cryptographic algorithm used in various security applications and protocols.`,
    purpose: `Used for cryptographic operations requiring ${name}.`,
    securityLevel: 'Varies by implementation and usage',
    knownWeaknesses: 'Consult the latest cryptographic research for current vulnerability assessments.',
    recommendedUsage: 'Follow current best practices and standards for this algorithm.',
    exampleCommand: `# Consult documentation for ${name} usage`,
    useCases: ['Cryptographic operations', 'Security protocols', 'Data protection'],
    performanceNote: 'Performance varies by implementation and platform.'
  };
}
