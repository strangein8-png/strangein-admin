'use client';
import { getAge, fmtDate } from '../../lib/format';

const TAGS = [
  ['Interests', 'interests'], ['Sports', 'sports'], ['Creativity', 'creativity'],
  ['Reading', 'reading'], ['Food & drink', 'foodAndDrink'], ['Self care', 'selfCare'],
  ['Pets', 'pets'], ['Mother tongue', 'yourMotherTongue'], ['Preferred gender', 'yourPreferredGender'],
];

export default function UserDrawer({ user, onClose }) {
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
    ['Reported', user.isReported ? String(user.isReported) : null],
  ];

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="drawer" onClick={(e) => e.stopPropagation()}>
        <button className="drawer-close" onClick={onClose}>×</button>
        <h2>{user.fullName || 'Unnamed user'}</h2>
        <span className={`badge ${user.isBlocked ? 'bad' : 'good'}`}>
          {user.isBlocked ? 'Blocked' : 'Active'}
        </span>

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
          <div>
            <dt>Coordinates</dt>
            <dd>
              {hasCoords
                ? <a href={`https://www.google.com/maps?q=${lat},${lng}`} target="_blank" rel="noreferrer">{lat.toFixed(4)}, {lng.toFixed(4)}</a>
                : 'Not set'}
            </dd>
          </div>
        </dl>

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
