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
