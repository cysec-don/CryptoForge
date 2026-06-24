import { NextRequest, NextResponse } from 'next/server';

interface HashCandidate {
  name: string;
  confidence: number;
  description: string;
  hashcatMode?: string;
  johnFormat?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { hash } = body;

    if (!hash) {
      return NextResponse.json({ error: 'Hash is required' }, { status: 400 });
    }

    const trimmed = hash.trim();
    const length = trimmed.length;
    const isHex = /^[0-9a-fA-F]+$/.test(trimmed);
    const isAlphanumeric = /^[0-9a-zA-Z]+$/.test(trimmed);
    const startsWithDollar = trimmed.startsWith('$');

    let charset = 'unknown';
    if (isHex) charset = 'hexadecimal';
    else if (isAlphanumeric) charset = 'alphanumeric';
    else charset = 'mixed';

    const results: HashCandidate[] = [];

    if (startsWithDollar) {
      if (trimmed.startsWith('$2a$') || trimmed.startsWith('$2b$') || trimmed.startsWith('$2y$')) {
        results.push({ name: 'bcrypt', confidence: 95, description: 'bcrypt password hash', hashcatMode: '3200', johnFormat: 'bcrypt' });
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
      if (trimmed.startsWith('$argon2')) {
        results.push({ name: 'Argon2', confidence: 95, description: 'Argon2 password hash' });
      }
    }

    if (isHex) {
      if (length === 32) {
        results.push({ name: 'MD5', confidence: 85, description: 'MD5 hash (128-bit)', hashcatMode: '0', johnFormat: 'raw-md5' });
        results.push({ name: 'MD4', confidence: 60, description: 'MD4 hash (128-bit)', hashcatMode: '900', johnFormat: 'raw-md4' });
      }
      if (length === 40) {
        results.push({ name: 'SHA1', confidence: 85, description: 'SHA-1 hash (160-bit)', hashcatMode: '100', johnFormat: 'raw-sha1' });
      }
      if (length === 56) {
        results.push({ name: 'SHA224', confidence: 80, description: 'SHA-224 hash (224-bit)', hashcatMode: '1300', johnFormat: 'raw-sha224' });
      }
      if (length === 64) {
        results.push({ name: 'SHA256', confidence: 85, description: 'SHA-256 hash (256-bit)', hashcatMode: '1400', johnFormat: 'raw-sha256' });
      }
      if (length === 96) {
        results.push({ name: 'SHA384', confidence: 85, description: 'SHA-384 hash (384-bit)', hashcatMode: '10800', johnFormat: 'raw-sha384' });
      }
      if (length === 128) {
        results.push({ name: 'SHA512', confidence: 85, description: 'SHA-512 hash (512-bit)', hashcatMode: '1700', johnFormat: 'raw-sha512' });
      }
    }

    results.sort((a, b) => b.confidence - a.confidence);

    return NextResponse.json({
      hash: trimmed.substring(0, 20) + (trimmed.length > 20 ? '...' : ''),
      length,
      charset,
      possibleAlgorithms: results.length > 0 ? results : [{ name: 'Unknown', confidence: 0, description: 'Could not identify the hash algorithm' }],
      timestamp: new Date().toISOString()
    });
  } catch {
    return NextResponse.json({ error: 'Hash identification failed' }, { status: 500 });
  }
}
