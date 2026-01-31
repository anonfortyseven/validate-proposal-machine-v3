import { NextResponse } from 'next/server';

// Authentication bypassed - always return success
// This file is kept for compatibility but login is disabled

export async function POST() {
  return NextResponse.json({ success: true, token: 'bypass_token' });
}

export async function GET() {
  return NextResponse.json({ valid: true });
}
