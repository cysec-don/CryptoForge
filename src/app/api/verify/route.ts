import { NextRequest, NextResponse } from 'next/server';
import CryptoJS from 'crypto-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { input, expectedHash, algorithm = 'SHA256' } = body;

    if (!input || !expectedHash) {
      return NextResponse.json({ error: 'Input and expectedHash are required' }, { status: 400 });
    }

    let computedHash: string;
    switch (algorithm) {
      case 'MD5': computedHash = CryptoJS.MD5(input).toString(); break;
      case 'SHA1': computedHash = CryptoJS.SHA1(input).toString(); break;
      case 'SHA256': computedHash = CryptoJS.SHA256(input).toString(); break;
      case 'SHA384': computedHash = CryptoJS.SHA384(input).toString(); break;
      case 'SHA512': computedHash = CryptoJS.SHA512(input).toString(); break;
      default: computedHash = CryptoJS.SHA256(input).toString(); break;
    }

    const match = computedHash.toLowerCase() === expectedHash.toLowerCase();

    return NextResponse.json({
      algorithm,
      match,
      computedHash,
      expectedHash,
      timestamp: new Date().toISOString()
    });
  } catch {
    return NextResponse.json({ error: 'Hash verification failed' }, { status: 500 });
  }
}
