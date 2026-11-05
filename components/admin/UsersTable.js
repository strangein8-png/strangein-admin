'use client';
import { useEffect, useMemo, useState } from 'react';
import Pager from './Pager';
import { getAge, normGender, fmtDate, downloadCsv, uid } from '../../lib/format';

const PAGE_SIZE = 20;

export default function UsersTable({ users, loading, busy, hasJoinDate, onOpen, onStatusChange }) {
  const [query, setQuery] = useState('');
  const [gender, setGender] = useState('all');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('default');
  const [page, setPage] = useState(1);

  const genders = useMemo(() => [...new Set(users.map((u) => normGender(u.gender)))], [users]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = users.filter((u) => {
      if (gender !== 'all' && normGender(u.gender) !== gender) return false;
      const inactive = u.isBlocked || u.isDeleted;
      if (status === 'active' && inactive) return false;
      if (status === 'inactive' && !inactive) return false;
      if (status === 'deleted' && !u.isDeleted) return false;
      if (!q) return true;
      return [u.fullName, u.mobileNo, u.email, u.city, u.state]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
    return sort === 'reports'
      ? [...list].sort((a, b) => (b.reportCount || 0) - (a.reportCount || 0))
      : list;
  }, [users, query, gender, status, sort]);

  useEffect(() => setPage(1), [query, gender, status, sort]);

  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const colCount = hasJoinDate ? 10 : 9;

  function exportCsv() {
    downloadCsv('strangein-users', [
      ['Name', (u) => u.fullName],
      ['Mobile', (u) => u.mobileNo],
      ['Email', (u) => u.email],
      ['Gender', (u) => u.gender],
      ['DOB', (u) => u.dob],
      ['City', (u) => u.city],
      ['State', (u) => u.state],
      ['Country', (u) => u.country],
      ['Joined', (u) => u.createdDate],
      ['Reports', (u) => u.reportCount || 0],
      ['Status', (u) => (u.isDeleted ? 'Inactive (Deleted)' : u.isBlocked ? 'Inactive' : 'Active')],
    ], filtered);
  }

  return (
    <>
      <div className="adm-toolbar">
        <input
          placeholder="Search name, mobile, email, city…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select value={gender} onChange={(e) => setGender(e.target.value)}>
          <option value="all">All genders</option>
          {genders.map((g) => <option key={g}>{g}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive (all)</option>
          <option value="deleted">Deleted accounts</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="default">Default order</option>
          <option value="reports">Most reported first</option>
        </select>
        <button className="ghost" onClick={exportCsv} disabled={!filtered.length}>Export CSV</button>
      </div>

      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th></th><th>Name</th><th>Mobile</th><th>Email</th>
              <th>Gender</th><th>Age</th><th>Location</th>
              {hasJoinDate && <th>Joined</th>}
              <th>Reports</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={colCount} className="center">Loading…</td></tr>}
            {!loading && rows.length === 0 && <tr><td colSpan={colCount} className="center">No users found</td></tr>}
            {rows.map((u) => (
              <tr key={uid(u)} onClick={() => onOpen(u)}>
                <td>
                  {u.images?.[0]
                    ? <img className="avatar" src={u.images[0]} alt="" />
                    : <div className="avatar ph">{(u.fullName || '?')[0]}</div>}
                </td>
                <td>{u.fullName || (u.isDeleted ? 'Deleted user' : '—')}</td>
                <td>{u.mobileNo || '—'}</td>
                <td>{u.email || '—'}</td>
                <td>{u.isDeleted ? '—' : normGender(u.gender)}</td>
                <td>{getAge(u.dob) ?? '—'}</td>
                <td>{[u.city, u.state].filter(Boolean).join(', ') || '—'}</td>
                {hasJoinDate && <td>{fmtDate(u.createdDate)}</td>}
                <td>
                  {u.reportCount
                    ? <span className={`badge ${u.reportCount >= 5 ? 'bad' : 'warn'}`}>{u.reportCount}</span>
                    : <span className="muted">0</span>}
                </td>
                <td onClick={(e) => e.stopPropagation()}>
                  {u.isDeleted ? (
                    <span className="badge bad">Inactive · Deleted</span>
                  ) : (
                    <select
                      className={`status-select ${u.isBlocked ? 'bad' : 'good'}`}
                      value={u.isBlocked ? 'inactive' : 'active'}
                      disabled={!!busy[uid(u)]}
                      onChange={(e) => onStatusChange(u, e.target.value)}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pager total={filtered.length} page={page} pageSize={PAGE_SIZE} onPage={setPage} noun="user" />
    </>
  );
}