import { useState, type FormEvent } from 'react';
import { api, type InterestGroup, type User } from '../api';
import Avatar from '../components/Avatar';
import Pager from '../components/Pager';
import { usePaged } from '../components/usePaged';

interface Props {
  user: User;
  onUserChange: (user: User) => void;
  onSelectUser: (id: string) => void;
}

const splitList = (value: string) =>
  value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

export default function InterestsPage({ user, onUserChange, onSelectUser }: Props) {
  const [filterInput, setFilterInput] = useState('');
  const [filter, setFilter] = useState('');
  const { result, error, setPage, reload } = usePaged<InterestGroup>(
    filter ? `/users/interests?interest=${encodeURIComponent(filter)}` : '/users/interests',
  );

  const [mine, setMine] = useState(user.interests.join(', '));
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');

  async function saveInterests(e: FormEvent) {
    e.preventDefault();
    try {
      const updated = await api.patch<User>('/auth/me', { interests: splitList(mine) });
      onUserChange(updated);
      setMine(updated.interests.join(', '));
      setSaved(true);
      setSaveError('');
      await reload();
    } catch (err) {
      setSaveError((err as Error).message);
    }
  }

  function applyFilter(value: string) {
    setFilterInput(value);
    setFilter(splitList(value).join(','));
  }

  return (
    <section>
      <header className="page-header">
        <div>
          <h1>Interests</h1>
          <p className="subtitle">See who likes what, and find people with the same hobbies.</p>
        </div>
      </header>

      <form className="panel mine" onSubmit={saveInterests}>
        <label htmlFor="my-interests">Your interests</label>
        <div className="mine-row">
          <input
            id="my-interests"
            value={mine}
            onChange={(e) => {
              setMine(e.target.value);
              setSaved(false);
            }}
            placeholder="chess, reading, hiking"
          />
          <button className="button primary" disabled={saved}>
            {saved ? 'Saved' : 'Save'}
          </button>
        </div>
        {user.interests.length > 0 && (
          <div className="tags">
            {user.interests.map((i) => (
              <button type="button" key={i} className="tag hl" onClick={() => applyFilter(i)} title={`Show only ${i}`}>
                {i}
              </button>
            ))}
          </div>
        )}
        {saveError && <p className="error">{saveError}</p>}
      </form>

      <form
        className="search"
        onSubmit={(e) => {
          e.preventDefault();
          applyFilter(filterInput);
        }}
      >
        <input
          type="search"
          value={filterInput}
          onChange={(e) => setFilterInput(e.target.value)}
          placeholder="Filter by interest, e.g. chess, reading"
        />
        <button className="button ghost">Filter</button>
        {filter && (
          <button type="button" className="link" onClick={() => applyFilter('')}>
            Clear
          </button>
        )}
      </form>

      {error && <p className="error">{error}</p>}
      {result && result.data.length === 0 && (
        <div className="empty">
          <p className="empty-title">Nothing here</p>
          <p>Nobody has listed {filter ? 'these interests' : 'any interests'} yet.</p>
        </div>
      )}

      <div className="groups">
        {result?.data.map((group) => (
          <article key={group.interest} className="group">
            <div className="group-head">
              <h3>
                <mark className={user.interests.includes(group.interest) ? 'hl' : undefined}>{group.interest}</mark>
              </h3>
              <span className="count">{group.count}</span>
            </div>
            <div className="people">
              {group.users.map((u) => (
                <button key={u._id} className="person" onClick={() => onSelectUser(u._id)} title={`See ${u.name}'s posts`}>
                  <Avatar name={u.name} size="sm" />
                  {u._id === user._id ? 'You' : u.name}
                </button>
              ))}
              {group.count > group.users.length && (
                <span className="muted small">+{group.count - group.users.length} more</span>
              )}
            </div>
          </article>
        ))}
      </div>

      {result && <Pager pagination={result.pagination} onChange={setPage} />}
    </section>
  );
}
