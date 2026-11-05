'use client';
import { useEffect, useMemo, useState } from 'react';
import Pager from './Pager';
import UserCell from './UserCell';
import { fmtDateTime, downloadCsv } from '../../lib/format';

const PAGE_SIZE = 20;

export default function HelpCenterTable({ items, byKey, loading, onOpen }) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => {
      const u = byKey.get(i.userKey);
      return [i.title, i.description, i.email, i.mobileNo, u?.fullName]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [items, byKey, query]);

  useEffect(() => setPage(1), [query]);

  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function exportCsv() {
    downloadCsv('strangein-helpcenter', [
      ['Date', (i) => i.date],
      ['User', (i) => byKey.get(i.userKey)?.fullName],
      ['Mobile', (i) => i.mobileNo],
      ['Email', (i) => i.email],
      ['Title', (i) => i.title],
      ['Description', (i) => i.description],
    ], filtered);
  }

  return (
    <>
      <div className="adm-toolbar">
        <input
          placeholder="Search title, description, user, mobile, email…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="ghost" onClick={exportCsv} disabled={!filtered.length}>Export CSV</button>
      </div>

      <div className="adm-table-wrap">
        <table className="adm-table static">
          <thead>
            <tr><th>Date</th><th>User</th><th>Contact</th><th>Issue</th></tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={4} className="center">Loading…</td></tr>}
            {!loading && rows.length === 0 && <tr><td colSpan={4} className="center">No help center requests found</td></tr>}
            {rows.map((i) => (
              <tr key={i.id}>
                <td className="nowrap">{fmtDateTime(i.date)}</td>
                <td>
                  <UserCell
                    user={byKey.get(i.userKey)}
                    fallback={i.mobileNo || i.email}
                    onOpen={onOpen}
                  />
                </td>
                <td className="contact">
                  <div>{i.mobileNo || '—'}</div>
                  <div className="muted">{i.email || ''}</div>
                </td>
                <td className="wrap-text">
                  <strong>{i.title || '—'}</strong>
                  <div>{i.description}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pager total={filtered.length} page={page} pageSize={PAGE_SIZE} onPage={setPage} noun="request" />
    </>
  );
}