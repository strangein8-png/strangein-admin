'use client';

export default function Pager({ total, page, pageSize, onPage, noun = 'row' }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="adm-pager">
      <span>{total} {noun}{total === 1 ? '' : 's'}</span>
      <div>
        <button className="ghost" disabled={page <= 1} onClick={() => onPage(page - 1)}>Prev</button>
        <span className="pg">Page {Math.min(page, pages)} / {pages}</span>
        <button className="ghost" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</button>
      </div>
    </div>
  );
}