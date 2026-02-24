import { NextResponse } from 'next/server';
import { validateTokenFromRequest } from '@/lib/authTokens';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const PROJECTS_BUCKET = 'validate-projects';

const supabaseHeaders = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`
};

// Paths that are global (not namespaced per user)
const GLOBAL_PREFIXES = ['shares/', 'assets/'];

function namespacePath(path, userId) {
  if (GLOBAL_PREFIXES.some(p => path.startsWith(p))) {
    return path;
  }
  return `${userId}/${path}`;
}

// GET - Load file from Supabase
export async function GET(request) {
  const auth = validateTokenFromRequest(request);
  if (!auth.valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');

    if (!path) {
      return NextResponse.json({ error: 'Path required' }, { status: 400 });
    }

    const namespacedPath = namespacePath(path, auth.userId);

    const response = await fetch(
      `${SUPABASE_URL}/storage/v1/object/public/${PROJECTS_BUCKET}/${namespacedPath}?t=${Date.now()}`,
      {
        headers: supabaseHeaders,
        cache: 'no-store'
      }
    );

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data);
    }

    return NextResponse.json(null, { status: 404 });
  } catch (e) {
    console.error('Storage GET error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST - Save file to Supabase
export async function POST(request) {
  const auth = validateTokenFromRequest(request);
  if (!auth.valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { path, data } = await request.json();

    if (!path || data === undefined) {
      return NextResponse.json({ error: 'Path and data required' }, { status: 400 });
    }

    const namespacedPath = namespacePath(path, auth.userId);

    const response = await fetch(
      `${SUPABASE_URL}/storage/v1/object/${PROJECTS_BUCKET}/${namespacedPath}`,
      {
        method: 'POST',
        headers: {
          ...supabaseHeaders,
          'Content-Type': 'application/json',
          'x-upsert': 'true'
        },
        body: JSON.stringify(data)
      }
    );

    if (response.ok) {
      const result = await response.json();
      return NextResponse.json({ success: true, result });
    }

    const errorText = await response.text();
    console.error('Supabase save error:', errorText);
    return NextResponse.json({ error: errorText }, { status: response.status });
  } catch (e) {
    console.error('Storage POST error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE - Delete file from Supabase
export async function DELETE(request) {
  const auth = validateTokenFromRequest(request);
  if (!auth.valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Support both query params and body for path
    const { searchParams } = new URL(request.url);
    let path = searchParams.get('path');

    // If not in query params, try reading from body
    if (!path) {
      try {
        const body = await request.json();
        path = body.path;
      } catch {
        // Body parsing failed, path stays null
      }
    }

    if (!path) {
      return NextResponse.json({ error: 'Path required' }, { status: 400 });
    }

    const namespacedPath = namespacePath(path, auth.userId);

    const response = await fetch(
      `${SUPABASE_URL}/storage/v1/object/${PROJECTS_BUCKET}/${namespacedPath}`,
      {
        method: 'DELETE',
        headers: supabaseHeaders
      }
    );

    return NextResponse.json({ success: response.ok });
  } catch (e) {
    console.error('Storage DELETE error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
