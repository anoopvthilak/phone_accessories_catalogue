import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers.js';

export const SESSION_COOKIE_NAME = 'auth_session';
export const SESSION_DURATION_SECONDS = 7 * 24 * 60 * 60; // 7 days

// Key derived from AUTH_SECRET
function getSecretKey() {
  const secret = process.env.AUTH_SECRET || 'development_secret_key_change_in_production_1234567890';
  return new TextEncoder().encode(secret);
}

/**
 * Hash a plain text password using bcrypt
 */
export async function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, 10);
}

/**
 * Verify a plain text password against a hash
 */
export async function verifyPassword(plainPassword, hashedPassword) {
  return bcrypt.compare(plainPassword, hashedPassword);
}

/**
 * Create and sign a JWT session token
 */
export async function createSessionToken(payload) {
  const secretKey = getSecretKey();
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(secretKey);
}

/**
 * Verify a session token and return its decoded payload
 */
export async function verifySessionToken(token) {
  if (!token) return null;
  try {
    const secretKey = getSecretKey();
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch (_error) {
    return null;
  }
}

/**
 * Cookie options for the session
 */
export function getSessionCookieOptions() {
  return {
    name: SESSION_COOKIE_NAME,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURATION_SECONDS,
  };
}

/**
 * Get current session from Next.js cookies() in Server Components / Actions / Handlers
 */
export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/**
 * Check if the session user possesses an allowed role
 */
export function hasRole(session, allowedRoles = []) {
  if (!session || !session.role) return false;
  if (allowedRoles.length === 0) return true;
  return allowedRoles.includes(session.role);
}
