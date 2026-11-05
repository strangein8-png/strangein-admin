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

async function authed(path, init = {}) {
  const call = (token) =>
    fetch(`${BASE}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

  let res = await call(await getToken());
  if (res.status === 401) res = await call(await getToken(true)); // token rotated/expired

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.message || body.error?.message || `${path} responded ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json().catch(() => ({}));
}

const clean = (v) => String(v ?? '').trim();
const isEmail = (v) => clean(v).includes('@');
export const idOf = (u) => u.mobileNo || u.email || '';

async function safe(label, fn, warnings, fallback) {
  try {
    return await fn();
  } catch (e) {
    warnings.push(`${label} could not be loaded: ${e.message}`);
    return fallback;
  }
}

// Everything the dashboard needs, joined together on the server.
export async function fetchAdminData() {
  if (!BASE) throw new Error('STRANGEIN_API_URL is not set');
  const warnings = [];

  // Users are essential: if this fails, the whole request fails.
  const rawUsers = await authed('/Signup/');

  // These run ONE AFTER ANOTHER on purpose. Your authenticateKey middleware
  // saves the service account on every request (rate limiting), and parallel
  // saves of the same document can collide.
  const rawFeedback = await safe('Feedback', () => authed('/feedback/'), warnings, []);
  const rawReports = await safe('Reports', () => authed('/report/'), warnings, []);
  const issuesRes = await safe('Help center', () => authed('/helpcenter/issues'), warnings, { data: [] });
  const rawIssues = Array.isArray(issuesRes?.data) ? issuesRes.data : [];

  const serviceMobile = clean(process.env.STRANGEIN_SERVICE_MOBILE);
  const users = (Array.isArray(rawUsers) ? rawUsers : [])
    .filter((u) => clean(u.mobileNo) !== serviceMobile)
    .map(({ password, ...safeUser }) => ({
      ...safeUser,
      isBlocked: !!safeUser.isBlocked,
      isDeleted: false,
      reportCount: 0,
      reporters: [],
    }));

  const byMobile = new Map();
  const byEmail = new Map();
  users.forEach((u) => {
    if (clean(u.mobileNo)) byMobile.set(clean(u.mobileNo), u);
    if (clean(u.email)) byEmail.set(clean(u.email).toLowerCase(), u);
  });

  const findUser = (...ids) => {
    for (const id of ids) {
      const k = clean(id);
      if (!k) continue;
      const u = byMobile.get(k) || byEmail.get(k.toLowerCase());
      if (u) return u;
    }
    return null;
  };

  // Accounts that were deleted: the backend removes the profile, but their
  // feedback and the reports against them stay behind. We rebuild a stub row
  // for them so they show up as Inactive (Deleted).
  const deleted = new Map();
  const ghost = (mobileNo, email, fullName) => {
    const key = clean(mobileNo) || clean(email).toLowerCase();
    if (!key) return null;
    let g = deleted.get(key);
    if (!g) {
      g = {
        mobileNo: clean(mobileNo) || null,
        email: clean(email) || null,
        fullName: clean(fullName) || null,
        isDeleted: true,
        isBlocked: true,
        reportCount: 0,
        reporters: [],
      };
      deleted.set(key, g);
    } else if (!g.fullName && clean(fullName)) {
      g.fullName = clean(fullName);
    }
    return g;
  };

  // ── Reports: unique reporters per reported user ──
  const reportMap = new Map(); // user object -> Map(reporterKey -> info)
  for (const r of rawReports) {
    const target = clean(r.reportedUser);
    if (!target) continue;
    const found = isEmail(target) ? findUser(null, target) || findUser(target) : findUser(target);
    const user = found || (isEmail(target) ? ghost(null, target) : ghost(target, null));
    if (!user) continue;

    let set = reportMap.get(user);
    if (!set) {
      set = new Map();
      reportMap.set(user, set);
    }
    for (const by of Array.isArray(r.reportedBy) ? r.reportedBy : []) {
      const rk = clean(by.mobileNo) || clean(by.email).toLowerCase();
      if (!rk || set.has(rk)) continue;
      const reporter = findUser(by.mobileNo, by.email);
      set.set(rk, {
        mobileNo: clean(by.mobileNo) || null,
        email: clean(by.email) || null,
        name: reporter?.fullName || null,
        reason: clean(by.reason) || null,
        date: r.date || null,
      });
    }
  }
  for (const [user, set] of reportMap) {
    user.reportCount = set.size;
    user.reporters = [...set.values()];
  }

  // ── Feedback (requires login, so every sender is/was a real user) ──
  const feedback = rawFeedback
    .map((f) => {
      const user = findUser(f.mobileNo) || ghost(f.mobileNo, null, f.fullName);
      return {
        id: String(f._id),
        userKey: user ? idOf(user) : null,
        fullName: f.fullName || null,
        mobileNo: f.mobileNo || null,
        mood: f.mood || null,
        comment: f.usercomment || '',
        date: f.date || null,
      };
    })
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  // ── Help center (public endpoint, sender may not have an account) ──
  const issues = rawIssues
    .map((i) => {
      const user = findUser(i.mobileNo, i.email);
      return {
        id: String(i._id),
        userKey: user ? idOf(user) : null,
        mobileNo: i.mobileNo || null,
        email: i.email || null,
        title: i.issueTitle || '',
        description: i.issueDescription || '',
        date: i.createdAt || i.date || null,
      };
    })
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  return { users: [...users, ...deleted.values()], feedback, issues, warnings };
}

// Active/Inactive switch. Uses your existing POST /match/IsBlocked route.
export async function setUserBlocked(mobileNo, isBlocked) {
  return authed('/match/IsBlocked', {
    method: 'POST',
    body: JSON.stringify({ mobileNo, isBlocked }),
  });
}