// Server-only helper. Never import this from a client component.
const BASE = (process.env.STRANGEIN_API_URL || '').replace(/\/+$/, '');

let cache = { token: null, expiresAt: 0 };

async function login() {
  if (!BASE) throw new Error('STRANGEIN_API_URL is not set');

  const res = await fetch(`${BASE}/Signup/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mobileNo: process.env.STRANGEIN_SERVICE_MOBILE,
      password: process.env.STRANGEIN_SERVICE_PASSWORD,
    }),
    cache: 'no-store',
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.token) {
    const err = new Error(data.message || 'Service account login failed');
    err.status = res.status;
    throw err;
  }

  // Backend JWT lasts 30 days; refresh well before that.
  cache = { token: data.token, expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 25 };
  return cache.token;
}

async function getToken(force = false) {
  if (!force && cache.token && Date.now() < cache.expiresAt) return cache.token;
  return login();
}

export async function fetchAllUsers() {
  if (!BASE) throw new Error('STRANGEIN_API_URL is not set');

  const call = (token) =>
    fetch(`${BASE}/Signup/`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

  let res = await call(await getToken());
  if (res.status === 401) res = await call(await getToken(true));

  if (!res.ok) {
    const err = new Error(`Backend responded ${res.status}`);
    err.status = res.status;
    throw err;
  }

  const users = await res.json();
  const serviceMobile = process.env.STRANGEIN_SERVICE_MOBILE;
  return (Array.isArray(users) ? users : [])
    .filter((u) => u.mobileNo !== serviceMobile)
    .map(({ password, ...safe }) => safe); // never send passwords to the browser
}
