import { NextRequest, NextResponse } from 'next/server';
import CryptoJS from 'crypto-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { plaintext, key, mode = 'AES-GCM' } = body;

    if (!plaintext || !key) {
      return NextResponse.json({ error: 'Plaintext and key are required' }, { status: 400 });
    }

    if (mode === 'AES-CBC') {
      const keyBytes = CryptoJS.enc.Utf8.parse(key.padEnd(32).slice(0, 32));
      const ivBytes = CryptoJS.lib.WordArray.random(16);
      const encrypted = CryptoJS.AES.encrypt(plaintext, keyBytes, {
        iv: ivBytes,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });
      return NextResponse.json({
        algorithm: `AES-256-${mode}`,
        ciphertext: ivBytes.toString() + ':' + encrypted.toString(),
        iv: ivBytes.toString(),
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      error: 'Only AES-CBC server-side encryption is supported. Use client-side for AES-GCM.',
      hint: 'AES-GCM encryption requires the Web Crypto API which only works in the browser.'
    }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Encryption failed' }, { status: 500 });
  }
}
