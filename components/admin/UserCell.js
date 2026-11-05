'use client';

// Shows "who sent this" in feedback / help-center tables. Click opens the user drawer.
export default function UserCell({ user, fallback, onOpen }) {
  if (!user) {
    return (
      <div className="ucell-static">
        <span>{fallback || '—'}</span>
        <span className="tag">no account</span>
      </div>
    );
  }
  return (
    <button type="button" className="ucell" onClick={() => onOpen(user)}>
      <strong>{user.fullName || 'Unnamed user'}</strong>
      <small>{user.mobileNo || user.email}</small>
      {user.isDeleted && <span className="tag bad">deleted</span>}
    </button>
  );
}