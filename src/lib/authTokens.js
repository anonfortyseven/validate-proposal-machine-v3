import crypto from 'crypto';

// In-memory token store: Map<token, { userId, username, expiresAt }>
const tokens = new Map();

const TOKEN_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Clean expired tokens
function cleanExpired() {
  const now = Date.now();
  for (const [token, data] of tokens) {
    if (data.expiresAt < now) tokens.delete(token);
  }
}

// Create a new token for a user
export function createToken(userId, username) {
  cleanExpired();
  const token = crypto.randomBytes(32).toString('hex');
  tokens.set(token, { userId, username, expiresAt: Date.now() + TOKEN_TTL });
  return token;
}

// Validate token from request (cookie or Authorization header)
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

  cleanExpired();

  const data = tokens.get(token);
  if (data && data.expiresAt > Date.now()) {
    return { valid: true, userId: data.userId, username: data.username };
  }

  if (data) tokens.delete(token);
  return { valid: false };
}

export { tokens };
