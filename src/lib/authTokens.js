import crypto from 'crypto';

const TOKEN_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Use SUPABASE_KEY as signing secret (available server-side only)
function getSecret() {
  return process.env.SUPABASE_KEY || 'fallback-secret';
}

function sign(payload) {
  const hmac = crypto.createHmac('sha256', getSecret());
  hmac.update(payload);
  return hmac.digest('base64url');
}

// Create a signed token containing userId + username + expiry
export function createToken(userId, username) {
  const payload = JSON.stringify({
    userId,
    username,
    exp: Date.now() + TOKEN_TTL,
  });
  const payloadB64 = Buffer.from(payload).toString('base64url');
  const signature = sign(payloadB64);
  return `${payloadB64}.${signature}`;
}

// Validate token from request (cookie, Authorization header, or query param)
// Returns { valid, userId, username } or { valid: false }
export function validateTokenFromRequest(request) {
  // Try cookie first
  const cookieHeader = request.headers.get('cookie') || '';
  const cookieMatch = cookieHeader.match(/(?:^|;\s*)validate_token=([^;]+)/);
  let token = cookieMatch ? cookieMatch[1] : null;

  // Fall back to Authorization header
  if (!token) {
    token = request.headers.get('Authorization')?.replace('Bearer ', '') || null;
  }

  // Fall back to query param
  if (!token) {
    const url = new URL(request.url);
    token = url.searchParams.get('token');
  }

  if (!token) return { valid: false };

  // Verify signature
  const parts = token.split('.');
  if (parts.length !== 2) return { valid: false };

  const [payloadB64, signature] = parts;
  const expectedSig = sign(payloadB64);

  if (signature !== expectedSig) return { valid: false };

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
    if (payload.exp < Date.now()) return { valid: false };
    return { valid: true, userId: payload.userId, username: payload.username };
  } catch {
    return { valid: false };
  }
}
