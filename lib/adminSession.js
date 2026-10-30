import crypto from 'crypto';
import { cookies } from 'next/headers';

export const COOKIE_NAME = 'strangein_admin';
const TTL_SECONDS = 60 * 60 * 8; // 8 hours

function secret() {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s) throw new Error('ADMIN_SESSION_SECRET is not set');
  return s;
}

const sign = (value) => crypto.createHmac('sha256', secret()).update(value).digest('base64url');

export function createSessionValue() {
  const exp = String(Math.floor(Date.now() / 1000) + TTL_SECONDS);
  return `${exp}.${sign(exp)}`;
}

export function verifySessionValue(value) {
  if (!value) return false;
  const [exp, sig] = value.split('.');
  if (!exp || !sig) return false;
  const a = Buffer.from(sig);
  const b = Buffer.from(sign(exp));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  return Number(exp) > Date.now() / 1000;
}

export async function isAdmin() {
  const store = await cookies();
  return verifySessionValue(store.get(COOKIE_NAME)?.value);
}

export const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: TTL_SECONDS,
};
