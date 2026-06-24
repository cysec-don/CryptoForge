import { NextRequest, NextResponse } from 'next/server';
import CryptoJS from 'crypto-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, key, algorithm = 'HMAC-SHA256', expectedHmac } = body;

    if (!message || !key) {
      return NextResponse.json({ error: 'Message and key are required' }, { status: 400 });
    }

    let cryptoAlgo;
    switch (algorithm) {
      case 'HMAC-MD5': cryptoAlgo = CryptoJS.algo.MD5; break;
      case 'HMAC-SHA1': cryptoAlgo = CryptoJS.algo.SHA1; break;
      case 'HMAC-SHA256': cryptoAlgo = CryptoJS.algo.SHA256; break;
      case 'HMAC-SHA384': cryptoAlgo = CryptoJS.algo.SHA384; break;
      case 'HMAC-SHA512': cryptoAlgo = CryptoJS.algo.SHA512; break;
      case 'HMAC-SHA224': cryptoAlgo = CryptoJS.algo.SHA224; break;
      default: cryptoAlgo = CryptoJS.algo.SHA256;
    }

    const hmac = CryptoJS.algo.HMAC.create(cryptoAlgo, key);
    hmac.update(message);
    const result = hmac.finalize().toString();

    const response: Record<string, unknown> = {
      algorithm,
      hmac: result,
      timestamp: new Date().toISOString()
    };

    if (expectedHmac) {
      response.match = result.toLowerCase() === expectedHmac.toLowerCase();
      response.expectedHmac = expectedHmac;
    }

    return NextResponse.json(response);
  } catch {
    return NextResponse.json({ error: 'HMAC generation failed' }, { status: 500 });
  }
}
