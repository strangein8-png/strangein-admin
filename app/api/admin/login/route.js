import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { COOKIE_NAME, cookieOptions, createSessionValue } from '../../../../lib/adminSession';

export const dynamic = 'force-dynamic';

const hash = (v) => crypto.createHash('sha256').update(String(v)).digest();

export async function POST(request) {
  const { password } = await request.json().catch(() => ({}));
  const expected = process.env.ADMIN_PANEL_PASSWORD;

  console.log('DEBUG expected set?', !!expected, '| expected len:', expected?.length, '| typed len:', password?.length);

  const ok = expected && password && crypto.timingSafeEqual(hash(password), hash(expected));

  if (!ok) {
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ message: 'Invalid password' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, createSessionValue(), cookieOptions);
  return res;
}