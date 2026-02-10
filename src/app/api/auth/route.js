import { NextResponse } from 'next/server';
import crypto from 'crypto';

// In-memory token store: Map<token, { expiresAt: number }>
const tokens = new Map();

// Clean expired tokens periodically
function cleanExpired() {
  const now = Date.now();
  for (const [token, data] of tokens) {
    if (data.expiresAt < now) tokens.delete(token);
  }
}

const TOKEN_TTL = 24 * 60 * 60 * 1000; // 24 hours

export async function POST(request) {
  const sitePassword = process.env.SITE_PASSWORD;
  if (!sitePassword) {
    return NextResponse.json(
      { error: 'Site password not configured' },
      { status: 500 }
    );
  }

  try {
    const { password } = await request.json();

    if (!password || password !== sitePassword) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    cleanExpired();

    const token = crypto.randomBytes(32).toString('hex');
    tokens.set(token, { expiresAt: Date.now() + TOKEN_TTL });

    return NextResponse.json({ success: true, token });
  } catch {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}

export async function GET(request) {
  const token =
    request.headers.get('Authorization')?.replace('Bearer ', '') ||
    request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.json({ valid: false }, { status: 401 });
  }

  cleanExpired();

  const data = tokens.get(token);
  if (data && data.expiresAt > Date.now()) {
    return NextResponse.json({ valid: true });
  }

  tokens.delete(token);
  return NextResponse.json({ valid: false }, { status: 401 });
}
