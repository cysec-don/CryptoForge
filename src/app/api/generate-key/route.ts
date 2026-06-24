import { NextRequest, NextResponse } from 'next/server';
import CryptoJS from 'crypto-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type = 'aes', keySize = 256, tokenLength = 32, prefix = 'cf', wordCount = 6, byteLength = 32 } = body;

    let key: string;
    let metadata: Record<string, unknown> = {};

    switch (type) {
      case 'aes': {
        const randomWords = CryptoJS.lib.WordArray.random(keySize / 8);
        key = randomWords.toString();
        metadata = { algorithm: `AES-${keySize}`, keySize, format: 'hex' };
        break;
      }
      case 'jwt-secret': {
        const randomWords = CryptoJS.lib.WordArray.random(tokenLength);
        key = CryptoJS.enc.Base64.stringify(randomWords);
        metadata = { type: 'JWT Secret', length: tokenLength, format: 'base64' };
        break;
      }
      case 'token': {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const randomWords = CryptoJS.lib.WordArray.random(tokenLength);
        key = Array.from({ length: tokenLength }, (_, i) =>
          chars[Math.abs(randomWords.words[i >> 2] >> ((i % 4) * 8)) % chars.length]
        ).join('');
        metadata = { type: 'Random Token', length: tokenLength };
        break;
      }
      case 'api-key': {
        const randomWords = CryptoJS.lib.WordArray.random(24);
        const randomWords2 = CryptoJS.lib.WordArray.random(24);
        key = `${prefix}_${randomWords.toString().substring(0, 8)}_${randomWords2.toString().substring(0, 24)}`;
        metadata = { type: 'API Key', prefix };
        break;
      }
      case 'uuid': {
        const randomWords = CryptoJS.lib.WordArray.random(16);
        const hex = randomWords.toString();
        key = `${hex.substring(0, 8)}-${hex.substring(8, 12)}-4${hex.substring(13, 16)}-${((parseInt(hex.substring(16, 18), 16) & 0x3F) | 0x80).toString(16).padStart(2, '0')}${hex.substring(18, 20)}-${hex.substring(20, 32)}`;
        metadata = { type: 'UUID v4' };
        break;
      }
      case 'hex': {
        const randomWords = CryptoJS.lib.WordArray.random(byteLength);
        key = randomWords.toString();
        metadata = { type: 'Hex Random Bytes', byteLength, format: 'hex' };
        break;
      }
      default: {
        const randomWords = CryptoJS.lib.WordArray.random(32);
        key = randomWords.toString();
        metadata = { type: 'Default', format: 'hex' };
      }
    }

    return NextResponse.json({
      type,
      key,
      metadata,
      timestamp: new Date().toISOString()
    });
  } catch {
    return NextResponse.json({ error: 'Key generation failed' }, { status: 500 });
  }
}
