import { NextResponse } from 'next/server';
import pako from 'pako';
import crypto from 'crypto';
import { rateLimit, getClientIP, rateLimits } from '@/lib/rateLimit';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const PROJECTS_BUCKET = 'validate-projects';

const supabaseHeaders = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`
};

// Generate a random share ID (21 characters, URL-safe) using crypto
function generateShareId() {
  const bytes = crypto.randomBytes(16);
  return bytes.toString('base64url').substring(0, 21);
}

// Cryptographically secure password hashing using PBKDF2
// Format: salt:hash (both hex encoded)
const HASH_ITERATIONS = 100000;
const HASH_KEYLEN = 64;
const HASH_DIGEST = 'sha512';

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, HASH_ITERATIONS, HASH_KEYLEN, HASH_DIGEST).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  // Handle legacy hashes (simple numeric hashes from old implementation)
  if (!storedHash.includes(':')) {
    // Legacy hash - compare using old method for backward compatibility
    let legacyHash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      legacyHash = ((legacyHash << 5) - legacyHash) + char;
      legacyHash = legacyHash & legacyHash;
    }
    return storedHash === legacyHash.toString(36);
  }

  // New secure hash format: salt:hash
  const [salt, hash] = storedHash.split(':');
  const verifyHash = crypto.pbkdf2Sync(password, salt, HASH_ITERATIONS, HASH_KEYLEN, HASH_DIGEST).toString('hex');

  // Use timing-safe comparison to prevent timing attacks
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(verifyHash, 'hex'));
}

// GET - Fetch share by ID
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Share ID required' }, { status: 400 });
    }

    const response = await fetch(
      `${SUPABASE_URL}/storage/v1/object/public/${PROJECTS_BUCKET}/shares/${id}.json?t=${Date.now()}`,
      {
        headers: supabaseHeaders,
        cache: 'no-store'
      }
    );

    if (!response.ok) {
      return NextResponse.json({ error: 'Share not found' }, { status: 404 });
    }

    const share = await response.json();

    // Check if expired
    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Share link has expired' }, { status: 410 });
    }

    // Return share data (without password hash for security)
    const { passwordHash, ...safeShare } = share;
    return NextResponse.json({
      ...safeShare,
      hasPassword: !!passwordHash
    });
  } catch (e) {
    console.error('Share GET error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST - Create new share or verify password
export async function POST(request) {
  // Rate limiting for share creation
  const ip = getClientIP(request);
  const { success, remaining, reset, limit } = rateLimit(ip, 'share', rateLimits.share);

  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait before creating more share links.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Remaining': String(remaining),
          'X-RateLimit-Reset': String(reset),
          'Retry-After': String(reset)
        }
      }
    );
  }

  try {
    let body;

    // Check if the request is gzip-compressed
    const contentEncoding = request.headers.get('Content-Encoding');
    if (contentEncoding === 'gzip') {
      // Decompress the gzip payload
      const compressedData = await request.arrayBuffer();
      const decompressed = pako.ungzip(new Uint8Array(compressedData), { to: 'string' });
      body = JSON.parse(decompressed);
    } else {
      // Regular JSON body
      body = await request.json();
    }

    // Handle password verification
    if (body.action === 'verify') {
      const { id, password } = body;

      const response = await fetch(
        `${SUPABASE_URL}/storage/v1/object/public/${PROJECTS_BUCKET}/shares/${id}.json?t=${Date.now()}`,
        {
          headers: supabaseHeaders,
          cache: 'no-store'
        }
      );

      if (!response.ok) {
        return NextResponse.json({ error: 'Share not found' }, { status: 404 });
      }

      const share = await response.json();

      if (verifyPassword(password, share.passwordHash)) {
        // Return the full share data on successful verification
        const { passwordHash, ...safeShare } = share;
        return NextResponse.json({ success: true, share: safeShare });
      } else {
        return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
      }
    }

    // Create new share
    const { projectId, projectName, clientName, slides, password, expiresInDays, contactName, contactEmail, contactPhone, allowPdfDownload } = body;

    if (!slides || !Array.isArray(slides)) {
      return NextResponse.json({ error: 'Slides array required' }, { status: 400 });
    }

    const shareId = generateShareId();
    const now = new Date().toISOString();

    const share = {
      id: shareId,
      projectId: projectId || null,
      projectName: projectName || '',
      clientName: clientName || '',
      createdAt: now,
      expiresAt: expiresInDays ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString() : null,
      passwordHash: password ? hashPassword(password) : null,
      viewCount: 0,
      lastViewedAt: null,
      contactName: contactName || '',
      contactEmail: contactEmail || '',
      contactPhone: contactPhone || '',
      allowPdfDownload: allowPdfDownload !== false,
      slides
    };

    // Save to Supabase
    const response = await fetch(
      `${SUPABASE_URL}/storage/v1/object/${PROJECTS_BUCKET}/shares/${shareId}.json`,
      {
        method: 'POST',
        headers: {
          ...supabaseHeaders,
          'Content-Type': 'application/json',
          'x-upsert': 'true'
        },
        body: JSON.stringify(share)
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Supabase save error:', errorText);
      return NextResponse.json({ error: 'Failed to create share' }, { status: 500 });
    }

    // Return share info (without slides to keep response small)
    return NextResponse.json({
      id: shareId,
      url: `/p/${shareId}`,
      createdAt: now,
      expiresAt: share.expiresAt,
      hasPassword: !!password
    });
  } catch (e) {
    console.error('Share POST error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PATCH - Update view count
export async function PATCH(request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Share ID required' }, { status: 400 });
    }

    // Fetch current share
    const getResponse = await fetch(
      `${SUPABASE_URL}/storage/v1/object/public/${PROJECTS_BUCKET}/shares/${id}.json?t=${Date.now()}`,
      {
        headers: supabaseHeaders,
        cache: 'no-store'
      }
    );

    if (!getResponse.ok) {
      return NextResponse.json({ error: 'Share not found' }, { status: 404 });
    }

    const share = await getResponse.json();

    // Update view count
    share.viewCount = (share.viewCount || 0) + 1;
    share.lastViewedAt = new Date().toISOString();

    // Save updated share
    const saveResponse = await fetch(
      `${SUPABASE_URL}/storage/v1/object/${PROJECTS_BUCKET}/shares/${id}.json`,
      {
        method: 'POST',
        headers: {
          ...supabaseHeaders,
          'Content-Type': 'application/json',
          'x-upsert': 'true'
        },
        body: JSON.stringify(share)
      }
    );

    if (!saveResponse.ok) {
      return NextResponse.json({ error: 'Failed to update view count' }, { status: 500 });
    }

    return NextResponse.json({ success: true, viewCount: share.viewCount });
  } catch (e) {
    console.error('Share PATCH error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE - Remove share
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Share ID required' }, { status: 400 });
    }

    const response = await fetch(
      `${SUPABASE_URL}/storage/v1/object/${PROJECTS_BUCKET}/shares/${id}.json`,
      {
        method: 'DELETE',
        headers: supabaseHeaders
      }
    );

    return NextResponse.json({ success: response.ok });
  } catch (e) {
    console.error('Share DELETE error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
