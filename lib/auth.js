import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { sql, initDb } from './db';

const COOKIE = 'layr_session';
function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) throw new Error('SESSION_SECRET env var is missing or too short.');
  return new TextEncoder().encode(s);
}
export async function hashPassword(pw) { return bcrypt.hash(pw, 11); }
export async function verifyPassword(pw, hash) { return bcrypt.compare(pw, hash); }
export function newId(p = 'u') { return p + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

export async function createSession(userId) {
  const token = await new SignJWT({ uid: userId }).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('7d').sign(secret());
  cookies().set(COOKIE, token, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 7 });
}
export function destroySession() { cookies().set(COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 }); }

export async function currentUser() {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  let uid;
  try { ({ payload: { uid } } = await jwtVerify(token, secret())); } catch { return null; }
  await initDb();
  const rows = await sql`SELECT id, full_name, email, role FROM users WHERE id = ${uid}`;
  return rows[0] || null;
}
export async function requireUser() { const u = await currentUser(); if (!u) throw { status: 401, message: 'Not signed in' }; return u; }
export async function requireRole(...roles) { const u = await requireUser(); if (!roles.includes(u.role)) throw { status: 403, message: 'Insufficient permissions' }; return u; }
export const canEdit = (role) => role === 'admin' || role === 'team_lead';
