import { NextRequest, NextResponse } from 'next/server';
import CryptoJS from 'crypto-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ciphertext, key, mode = 'AES-CBC' } = body;

    if (!ciphertext || !key) {
      return NextResponse.json({ error: 'Ciphertext and key are required' }, { status: 400 });
    }

    if (mode === 'AES-CBC') {
      const parts = ciphertext.split(':');
      if (parts.length !== 2) {
        return NextResponse.json({ error: 'Invalid ciphertext format. Expected iv:ciphertext' }, { status: 400 });
      }
      const keyBytes = CryptoJS.enc.Utf8.parse(key.padEnd(32).slice(0, 32));
      const ivBytes = CryptoJS.enc.Hex.parse(parts[0]);
      const decrypted = CryptoJS.AES.decrypt(parts[1], keyBytes, {
        iv: ivBytes,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });
      const plaintext = decrypted.toString(CryptoJS.enc.Utf8);
      if (!plaintext) {
        return NextResponse.json({ error: 'Decryption failed. Invalid key or ciphertext.' }, { status: 400 });
      }
      return NextResponse.json({
        algorithm: `AES-256-${mode}`,
        plaintext,
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      error: 'Only AES-CBC server-side decryption is supported.',
      hint: 'AES-GCM decryption requires the Web Crypto API which only works in the browser.'
    }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Decryption failed' }, { status: 500 });
  }
}
