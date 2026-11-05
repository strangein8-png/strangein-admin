'use client';
import { getAge, fmtDate, fmtDateTime } from '../../lib/format';

const TAGS = [
  ['Interests', 'interests'], ['Sports', 'sports'], ['Creativity', 'creativity'],
  ['Reading', 'reading'], ['Food & drink', 'foodAndDrink'], ['Self care', 'selfCare'],
  ['Pets', 'pets'], ['Mother tongue', 'yourMotherTongue'], ['Preferred gender', 'yourPreferredGender'],
];

export default function UserDrawer({ user, feedback = [], issues = [], onClose }) {
  const [lng, lat] = user.location?.coordinates || [];
  const hasCoords = typeof lat === 'number' && typeof lng === 'number' && (lat !== 0 || lng !== 0);
  const age = getAge(user.dob);

  const fields = [
    ['Mobile', user.mobileNo],
    ['Email', user.email],
    ['Gender', user.gender],
    ['DOB', user.dob ? `${user.dob}${age !== null ? ` (${age} yrs)` : ''}` : null],
    ['Height', user.height ? `${user.height}` : null],
    ['City', user.city],
    ['State', user.state],
    ['Country', user.country],
    ['Joined', user.createdDate ? fmtDate(user.createdDate) : null],
  ];

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="drawer" onClick={(e) => e.stopPropagation()}>
        <button className="drawer-close" onClick={onClose}>×</button>
        <h2>{user.fullName || (user.isDeleted ? 'Deleted user' : 'Unnamed user')}</h2>

        <div className="badges">
          {user.isDeleted ? (
            <span className="badge bad">Inactive · Account deleted</span>
          ) : (
            <span className={`badge ${user.isBlocked ? 'bad' : 'good'}`}>
              {user.isBlocked ? 'Inactive' : 'Active'}
            </span>
          )}
          <span className={`badge ${user.reportCount >= 5 ? 'bad' : user.reportCount ? 'warn' : 'neutral'}`}>
            {user.reportCount || 0} report{user.reportCount === 1 ? '' : 's'}
          </span>
        </div>

        {user.isDeleted && (
          <p className="note">
            This account no longer exists. Only the feedback and reports it left behind are shown.
          </p>
        )}

        {user.images?.length > 0 && (
          <div className="photos">
            {user.images.map((src) => (
              <a key={src} href={src} target="_blank" rel="noreferrer">
                <img src={src} alt="" />
              </a>
            ))}
          </div>
        )}

        <dl className="kv">
          {fields.map(([k, v]) => (
            <div key={k}><dt>{k}</dt><dd>{v || '—'}</dd></div>
          ))}
          {!user.isDeleted && (
            <div>
              <dt>Coordinates</dt>
              <dd>
                {hasCoords
                  ? <a href={`https://www.google.com/maps?q=${lat},${lng}`} target="_blank" rel="noreferrer">{lat.toFixed(4)}, {lng.toFixed(4)}</a>
                  : 'Not set'}
              </dd>
            </div>
          )}
        </dl>

        {user.reporters?.length > 0 && (
          <div className="block">
            <h3>Reported by ({user.reporters.length})</h3>
            {user.reporters.map((r) => (
              <div className="entry" key={r.mobileNo || r.email}>
                <div className="entry-head">
                  <strong>{r.name || r.mobileNo || r.email}</strong>
                  {r.name && <small>{r.mobileNo || r.email}</small>}
                </div>
                <p>{r.reason || 'No reason given'}</p>
              </div>
            ))}
          </div>
        )}

        {feedback.length > 0 && (
          <div className="block">
            <h3>Feedback ({feedback.length})</h3>
            {feedback.map((f) => (
              <div className="entry" key={f.id}>
                <div className="entry-head">
                  <small>{fmtDateTime(f.date)}</small>
                  {f.mood && <span className="chip">{f.mood}</span>}
                </div>
                <p>{f.comment}</p>
              </div>
            ))}
          </div>
        )}

        {issues.length > 0 && (
          <div className="block">
            <h3>Help center ({issues.length})</h3>
            {issues.map((i) => (
              <div className="entry" key={i.id}>
                <div className="entry-head">
                  <strong>{i.title}</strong>
                  <small>{fmtDateTime(i.date)}</small>
                </div>
                <p>{i.description}</p>
              </div>
            ))}
          </div>
        )}

        {(user.aboutme || user.moreAboutMe) && (
          <div className="block">
            <h3>About</h3>
            {user.aboutme && <p>{user.aboutme}</p>}
            {user.moreAboutMe && (
              <p>{typeof user.moreAboutMe === 'string' ? user.moreAboutMe : JSON.stringify(user.moreAboutMe)}</p>
            )}
          </div>
        )}

        {TAGS.map(([label, key]) =>
          Array.isArray(user[key]) && user[key].length > 0 ? (
            <div className="block" key={key}>
              <h3>{label}</h3>
              <div>{user[key].map((t) => <span key={t} className="chip">{t}</span>)}</div>
            </div>
          ) : null
        )}

        {user.videos?.length > 0 && (
          <div className="block">
            <h3>Videos</h3>
            {user.videos.map((v, i) => (
              <div key={v}><a href={v} target="_blank" rel="noreferrer">Video {i + 1}</a></div>
            ))}
          </div>
        )}
      </aside>
    </div>
  );
}