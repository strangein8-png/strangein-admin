'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import UserDrawer from './UserDrawer';
import { getAge, normGender, fmtDate } from '../../lib/format';

const PAGE_SIZE = 20;

export default function Dashboard() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [gender, setGender] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/users', { cache: 'no-store' });
      if (res.status === 401) return router.replace('/admin/login');
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load');
      setUsers(data.users);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.replace('/admin/login');
    router.refresh();
  }

  const hasJoinDate = useMemo(() => users.some((u) => u.createdDate), [users]);

  const stats = useMemo(() => {
    const byGender = {};
    const byCity = {};
    let blocked = 0, withPhotos = 0, onboarded = 0, today = 0, week = 0;
    const startToday = new Date(); startToday.setHours(0, 0, 0, 0);
    const weekAgo = new Date(startToday.getTime() - 6 * 86400000);
    users.forEach((u) => {
      const g = normGender(u.gender);
      byGender[g] = (byGender[g] || 0) + 1;
      if (u.city) byCity[u.city] = (byCity[u.city] || 0) + 1;
      if (u.isBlocked) blocked++;
      if (u.images?.length) withPhotos++;
      if (u.onboardingComplete) onboarded++;
      if (u.createdDate) {
        const d = new Date(u.createdDate);
        if (d >= startToday) today++;
        if (d >= weekAgo) week++;
      }
    });
    const topCities = Object.entries(byCity).sort((a, b) => b[1] - a[1]).slice(0, 5);
    return { byGender, topCities, blocked, withPhotos, onboarded, today, week };
  }, [users]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (gender !== 'all' && normGender(u.gender) !== gender) return false;
      if (status === 'blocked' && !u.isBlocked) return false;
      if (status === 'active' && u.isBlocked) return false;
      if (!q) return true;
      return [u.fullName, u.mobileNo, u.email, u.city, u.state]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [users, query, gender, status]);

  useEffect(() => setPage(1), [query, gender, status]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const colCount = hasJoinDate ? 9 : 8;

  function exportCsv() {
    const cols = ['fullName', 'mobileNo', 'email', 'gender', 'dob', 'city', 'state', 'country', 'isBlocked', 'createdDate'];
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = [cols.join(','), ...filtered.map((u) => cols.map((c) => esc(u[c])).join(','))].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `strangein-users-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="adm">
      <header className="adm-header">
        <h1>StrangeIn Admin</h1>
        <div className="adm-actions">
          <button className="ghost" onClick={load} disabled={loading}>Refresh</button>
          <button className="ghost" onClick={exportCsv} disabled={!filtered.length}>Export CSV</button>
          <button className="ghost" onClick={logout}>Log out</button>
        </div>
      </header>

      <section className="adm-stats">
        <Stat label="Total signups" value={users.length} />
        {hasJoinDate && <Stat label="Signed up today" value={stats.today} />}
        {hasJoinDate && <Stat label="Last 7 days" value={stats.week} />}
        {Object.entries(stats.byGender).map(([g, n]) => <Stat key={g} label={g} value={n} />)}
        <Stat label="Onboarded" value={stats.onboarded} />
        <Stat label="With photos" value={stats.withPhotos} />
        <Stat label="Blocked" value={stats.blocked} />
      </section>

      {stats.topCities.length > 0 && (
        <div className="adm-cities">
          <strong>Top cities:</strong>
          {stats.topCities.map(([c, n]) => <span key={c} className="chip">{c} · {n}</span>)}
        </div>
      )}

      <div className="adm-toolbar">
        <input
          placeholder="Search name, mobile, email, city…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select value={gender} onChange={(e) => setGender(e.target.value)}>
          <option value="all">All genders</option>
          {Object.keys(stats.byGender).map((g) => <option key={g}>{g}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>

      {error && <div className="adm-error">{error}</div>}

      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th></th><th>Name</th><th>Mobile</th><th>Email</th>
              <th>Gender</th><th>Age</th><th>Location</th>
              {hasJoinDate && <th>Joined</th>}
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={colCount} className="center">Loading…</td></tr>}
            {!loading && rows.length === 0 && <tr><td colSpan={colCount} className="center">No users found</td></tr>}
            {rows.map((u) => (
              <tr key={u.mobileNo} onClick={() => setSelected(u)}>
                <td>
                  {u.images?.[0]
                    ? <img className="avatar" src={u.images[0]} alt="" />
                    : <div className="avatar ph">{(u.fullName || '?')[0]}</div>}
                </td>
                <td>{u.fullName || '—'}</td>
                <td>{u.mobileNo}</td>
                <td>{u.email || '—'}</td>
                <td>{normGender(u.gender)}</td>
                <td>{getAge(u.dob) ?? '—'}</td>
                <td>{[u.city, u.state].filter(Boolean).join(', ') || '—'}</td>
                {hasJoinDate && <td>{fmtDate(u.createdDate)}</td>}
                <td>
                  <span className={`badge ${u.isBlocked ? 'bad' : 'good'}`}>
                    {u.isBlocked ? 'Blocked' : 'Active'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="adm-pager">
        <span>{filtered.length} user{filtered.length === 1 ? '' : 's'}</span>
        <div>
          <button className="ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
          <span className="pg">Page {page} / {pages}</span>
          <button className="ghost" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      </div>

      {selected && <UserDrawer user={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="stat">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
