'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import UsersTable from './UsersTable';
import FeedbackTable from './FeedbackTable';
import HelpCenterTable from './HelpCenterTable';
import UserDrawer from './UserDrawer';
import { normGender, uid } from '../../lib/format';

const EMPTY = { users: [], feedback: [], issues: [], warnings: [] };

export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('users');
  const [selectedKey, setSelectedKey] = useState(null);
  const [busy, setBusy] = useState({});

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/users', { cache: 'no-store' });
      if (res.status === 401) return router.replace('/admin/login');
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to load');
      setData({ ...EMPTY, ...json });
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

  function patchUser(key, isBlocked) {
    setData((d) => ({
      ...d,
      users: d.users.map((u) => (uid(u) === key ? { ...u, isBlocked } : u)),
    }));
  }

  // Active/Inactive dropdown. Updates the screen immediately, rolls back on failure.
  async function changeStatus(user, status) {
    const key = uid(user);
    const previous = user.isBlocked;
    setError('');
    setBusy((b) => ({ ...b, [key]: true }));
    patchUser(key, status === 'inactive');
    try {
      const res = await fetch('/api/admin/users/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobileNo: user.mobileNo, status }),
      });
      if (res.status === 401) return router.replace('/admin/login');
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || 'Could not update status');
    } catch (e) {
      patchUser(key, previous);
      setError(e.message);
    } finally {
      setBusy((b) => ({ ...b, [key]: false }));
    }
  }

  const { users, feedback, issues, warnings } = data;
  const byKey = useMemo(() => new Map(users.map((u) => [uid(u), u])), [users]);
  const realUsers = useMemo(() => users.filter((u) => !u.isDeleted), [users]);
  const hasJoinDate = useMemo(() => users.some((u) => u.createdDate), [users]);
  const hasOnboarding = useMemo(() => users.some((u) => u.onboardingComplete !== undefined), [users]);

  const stats = useMemo(() => {
    const byGender = {};
    const byCity = {};
    let inactive = 0, deleted = 0, reported = 0, withPhotos = 0, onboarded = 0, today = 0, week = 0;
    const startToday = new Date(); startToday.setHours(0, 0, 0, 0);
    const weekAgo = new Date(startToday.getTime() - 6 * 86400000);

    users.forEach((u) => {
      if (u.reportCount > 0) reported++;
      if (u.isDeleted) { deleted++; return; }
      const g = normGender(u.gender);
      byGender[g] = (byGender[g] || 0) + 1;
      if (u.city) byCity[u.city] = (byCity[u.city] || 0) + 1;
      if (u.isBlocked) inactive++;
      if (u.images?.length) withPhotos++;
      if (u.onboardingComplete) onboarded++;
      if (u.createdDate) {
        const d = new Date(u.createdDate);
        if (d >= startToday) today++;
        if (d >= weekAgo) week++;
      }
    });
    const topCities = Object.entries(byCity).sort((a, b) => b[1] - a[1]).slice(0, 5);
    return { byGender, topCities, inactive, deleted, reported, withPhotos, onboarded, today, week };
  }, [users]);

  const selectedUser = selectedKey ? byKey.get(selectedKey) : null;
  const userFeedback = selectedUser ? feedback.filter((f) => f.userKey === selectedKey) : [];
  const userIssues = selectedUser ? issues.filter((i) => i.userKey === selectedKey) : [];
  const openUser = (u) => setSelectedKey(uid(u));

  const tabs = [
    ['users', 'Users', realUsers.length + stats.deleted],
    ['feedback', 'Feedback', feedback.length],
    ['help', 'Help center', issues.length],
  ];

  return (
    <div className="adm">
      <header className="adm-header">
        <h1>StrangeIn Admin</h1>
        <div className="adm-actions">
          <button className="ghost" onClick={load} disabled={loading}>{loading ? 'Loading…' : 'Refresh'}</button>
          <button className="ghost" onClick={logout}>Log out</button>
        </div>
      </header>

      <section className="adm-stats">
        <Stat label="Total users" value={realUsers.length} />
        {/* <Stat label="Active" value={realUsers.length - stats.inactive} /> */}
        {/* <Stat label="Inactive" value={stats.inactive} /> */}
        {/* <Stat label="Deleted accounts" value={stats.deleted} /> */}
        {/* <Stat label="Reported users" value={stats.reported} /> */}
        {/* <Stat label="Feedback" value={feedback.length} /> */}
        {/* <Stat label="Help requests" value={issues.length} /> */}
        {hasJoinDate && <Stat label="Signed up today" value={stats.today} />}
        {hasJoinDate && <Stat label="Last 7 days" value={stats.week} />}
        {Object.entries(stats.byGender).map(([g, n]) => <Stat key={g} label={g} value={n} />)}
        {hasOnboarding && <Stat label="Onboarded" value={stats.onboarded} />}
        <Stat label="With photos" value={stats.withPhotos} />
      </section>

      {stats.topCities.length > 0 && (
        <div className="adm-cities">
          <strong>Top cities:</strong>
          {stats.topCities.map(([c, n]) => <span key={c} className="chip">{c} · {n}</span>)}
        </div>
      )}

      {error && <div className="adm-error">{error}</div>}
      {warnings.map((w) => <div className="adm-warn" key={w}>{w}</div>)}

      <nav className="tabs">
        {tabs.map(([key, label, count]) => (
          <button key={key} className={`tab ${tab === key ? 'on' : ''}`} onClick={() => setTab(key)}>
            {label} <span className="tab-count">{count}</span>
          </button>
        ))}
      </nav>

      {tab === 'users' && (
        <UsersTable
          users={users}
          loading={loading}
          busy={busy}
          hasJoinDate={hasJoinDate}
          onOpen={openUser}
          onStatusChange={changeStatus}
        />
      )}
      {tab === 'feedback' && (
        <FeedbackTable items={feedback} byKey={byKey} loading={loading} onOpen={openUser} />
      )}
      {tab === 'help' && (
        <HelpCenterTable items={issues} byKey={byKey} loading={loading} onOpen={openUser} />
      )}

      {selectedUser && (
        <UserDrawer
          user={selectedUser}
          feedback={userFeedback}
          issues={userIssues}
          onClose={() => setSelectedKey(null)}
        />
      )}
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