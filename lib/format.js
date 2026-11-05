// Client-safe helpers.
export function getAge(dob) {
  if (!dob) return null;
  let d = new Date(dob);
  if (isNaN(d)) {
    const m = String(dob).match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/); // dd/mm/yyyy
    if (m) d = new Date(+m[3], +m[2] - 1, +m[1]);
  }
  if (isNaN(d)) return null;
  const age = Math.floor((Date.now() - d.getTime()) / 31557600000);
  return age >= 0 && age < 120 ? age : null;
}

export function normGender(g) {
  const v = String(g || '').toLowerCase();
  if (['male', 'man', 'men'].includes(v)) return 'Male';
  if (['female', 'woman', 'women'].includes(v)) return 'Female';
  return g ? String(g) : 'Unknown';
}

export function fmtDate(d) {
  if (!d) return '—';
  const x = new Date(d);
  return isNaN(x) ? '—' : x.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function fmtDateTime(d) {
  if (!d) return '—';
  const x = new Date(d);
  return isNaN(x)
    ? '—'
    : x.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

// A user's stable identity in the panel (mobile first, email as fallback).
export const uid = (u) => (u && (u.mobileNo || u.email)) || '';

// Neutralise spreadsheet formulas in user-written text (feedback is untrusted input).
const csvSafe = (v) => {
  const s = String(v ?? '');
  if (/^\+?[\d\s()-]+$/.test(s)) return s; // plain phone numbers / numbers
  return /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
};

export function downloadCsv(name, columns, rows) {
  const esc = (v) => `"${csvSafe(v).replace(/"/g, '""')}"`;
  const csv = [
    columns.map(([h]) => esc(h)).join(','),
    ...rows.map((r) => columns.map(([, fn]) => esc(fn(r))).join(',')),
  ].join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}