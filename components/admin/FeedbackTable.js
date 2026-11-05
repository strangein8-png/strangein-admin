'use client';
import { useEffect, useMemo, useState } from 'react';
import Pager from './Pager';
import UserCell from './UserCell';
import { fmtDateTime, downloadCsv } from '../../lib/format';

const PAGE_SIZE = 20;

export default function FeedbackTable({ items, byKey, loading, onOpen }) {
  const [query, setQuery] = useState('');
  const [mood, setMood] = useState('all');
  const [page, setPage] = useState(1);

  const moods = useMemo(() => [...new Set(items.map((i) => i.mood).filter(Boolean))], [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((i) => {
      if (mood !== 'all' && i.mood !== mood) return false;
      if (!q) return true;
      const u = byKey.get(i.userKey);
      return [i.comment, i.mood, i.fullName, i.mobileNo, u?.fullName, u?.mobileNo]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [items, byKey, query, mood]);

  useEffect(() => setPage(1), [query, mood]);

  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function exportCsv() {
    downloadCsv('strangein-feedback', [
      ['Date', (i) => i.date],
      ['User', (i) => byKey.get(i.userKey)?.fullName || i.fullName],
      ['Mobile', (i) => i.mobileNo],
      ['Mood', (i) => i.mood],
      ['Feedback', (i) => i.comment],
    ], filtered);
  }

  return (
    <>
      <div className="adm-toolbar">
        <input
          placeholder="Search feedback, user name or mobile…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select value={mood} onChange={(e) => setMood(e.target.value)}>
          <option value="all">All moods</option>
          {moods.map((m) => <option key={m}>{m}</option>)}
        </select>
        <button className="ghost" onClick={exportCsv} disabled={!filtered.length}>Export CSV</button>
      </div>

      <div className="adm-table-wrap">
        <table className="adm-table static">
          <thead>
            <tr><th>Date</th><th>User</th><th>Mood</th><th>Feedback</th></tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={4} className="center">Loading…</td></tr>}
            {!loading && rows.length === 0 && <tr><td colSpan={4} className="center">No feedback found</td></tr>}
            {rows.map((i) => (
              <tr key={i.id}>
                <td className="nowrap">{fmtDateTime(i.date)}</td>
                <td>
                  <UserCell
                    user={byKey.get(i.userKey)}
                    fallback={i.fullName || i.mobileNo}
                    onOpen={onOpen}
                  />
                </td>
                <td>{i.mood ? <span className="chip">{i.mood}</span> : <span className="muted">—</span>}</td>
                <td className="wrap-text">{i.comment || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pager total={filtered.length} page={page} pageSize={PAGE_SIZE} onPage={setPage} noun="feedback" />
    </>
  );
}