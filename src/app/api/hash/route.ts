import { NextRequest, NextResponse } from 'next/server';
import CryptoJS from 'crypto-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { input, algorithm = 'SHA256' } = body;

    if (!input) {
      return NextResponse.json({ error: 'Input is required' }, { status: 400 });
    }

    let result: string;
    switch (algorithm) {
      case 'MD4': result = CryptoJS.MD4(input).toString(); break;
      case 'MD5': result = CryptoJS.MD5(input).toString(); break;
      case 'SHA1': result = CryptoJS.SHA1(input).toString(); break;
      case 'SHA224': result = CryptoJS.SHA224(input).toString(); break;
      case 'SHA256': result = CryptoJS.SHA256(input).toString(); break;
      case 'SHA384': result = CryptoJS.SHA384(input).toString(); break;
      case 'SHA512': result = CryptoJS.SHA512(input).toString(); break;
      case 'SHA3-224': result = CryptoJS.SHA3(input, { outputLength: 224 }).toString(); break;
      case 'SHA3-256': result = CryptoJS.SHA3(input, { outputLength: 256 }).toString(); break;
      case 'SHA3-384': result = CryptoJS.SHA3(input, { outputLength: 384 }).toString(); break;
      case 'SHA3-512': result = CryptoJS.SHA3(input, { outputLength: 512 }).toString(); break;
      case 'RIPEMD160': result = CryptoJS.RIPEMD160(input).toString(); break;
      default: result = CryptoJS.SHA256(input).toString(); break;
    }

    return NextResponse.json({
      algorithm,
      input: input.substring(0, 50) + (input.length > 50 ? '...' : ''),
      hash: result,
      timestamp: new Date().toISOString()
    });
  } catch {
    return NextResponse.json({ error: 'Hash generation failed' }, { status: 500 });
  }
}
