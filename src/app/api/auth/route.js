import { NextResponse } from 'next/server';
import { createToken, validateTokenFromRequest } from '@/lib/authTokens';

function getUsers() {
  try {
    return JSON.parse(process.env.AUTH_USERS || '{}');
  } catch {
    return {};
  }
}

export async function POST(request) {
  const users = getUsers();
  if (Object.keys(users).length === 0) {
    return NextResponse.json(
      { error: 'Auth not configured' },
      { status: 500 }
    );
  }

  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password required' },
        { status: 401 }
      );
    }

    const user = users[username];
    if (!user || user.password !== password) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    const token = createToken(user.id, username);

    return NextResponse.json({
      success: true,
      token,
      userId: user.id,
      username,
    });
  } catch {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}

export async function GET(request) {
  const result = validateTokenFromRequest(request);

  if (result.valid) {
    return NextResponse.json({
      valid: true,
      userId: result.userId,
      username: result.username,
    });
  }

  return NextResponse.json({ valid: false }, { status: 401 });
}
