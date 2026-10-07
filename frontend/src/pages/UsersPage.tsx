import { useState, type FormEvent } from 'react';
import { api, type Role, type User } from '../api';
import Avatar from '../components/Avatar';
import { ListSkeleton } from '../components/Loading';
import Pager from '../components/Pager';
import { usePaged } from '../components/usePaged';

const emptyForm = { name: '', email: '', password: '', role: 'user' as Role };

export default function UsersPage({ currentUser }: { currentUser: User }) {
  const { result, error, loading, setPage, reload } = usePaged<User>('/users');
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    try {
      setActionError('');
      await action();
      await reload();
    } catch (err) {
      setActionError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function addUser(e: FormEvent) {
    e.preventDefault();
    run(async () => {
      await api.post('/users', form);
      setForm(emptyForm);
      setShowForm(false);
    });
  }

  function saveEdit() {
    if (!editing) return;
    run(async () => {
      await api.patch(`/users/${editing._id}`, { name: editing.name, email: editing.email, role: editing.role });
      setEditing(null);
    });
  }

  return (
    <section>
      <header className="page-header">
        <div>
          <h1>Users</h1>
          {result && <p className="subtitle">{result.pagination.total} accounts</p>}
        </div>
        <button className="button primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Close' : 'Add user'}
        </button>
      </header>

      {showForm && (
        <form className="panel grid-form" onSubmit={addUser}>
          <h2 className="form-title">New user</h2>
          <label>
            Name
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </label>
          <label>
            Email
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </label>
          <label>
            Password
            <input
              type="password"
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </label>
          <label>
            Role
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <div className="row">
            <button className="button primary" disabled={busy}>
              {busy ? 'Creating…' : 'Create user'}
            </button>
          </div>
        </form>
      )}

      {(error || actionError) && <p className="error">{error || actionError}</p>}

      {loading && !result && <ListSkeleton rows={5} />}

      <div className="panel table-wrap" hidden={!result} aria-busy={loading}>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Interests</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {result?.data.map((u) =>
              editing?._id === u._id ? (
                <tr key={u._id}>
                  <td>
                    <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                  </td>
                  <td>
                    <input value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} />
                  </td>
                  <td>
                    <select
                      value={editing.role}
                      disabled={u._id === currentUser._id}
                      onChange={(e) => setEditing({ ...editing, role: e.target.value as Role })}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="muted">{u.interests.join(', ')}</td>
                  <td className="actions">
                    <button className="link" disabled={busy} onClick={saveEdit}>
                      {busy ? 'Saving…' : 'Save'}
                    </button>
                    <button className="link" onClick={() => setEditing(null)}>
                      Cancel
                    </button>
                  </td>
                </tr>
              ) : (
                <tr key={u._id}>
                  <td>
                    <span className="user-cell">
                      <Avatar name={u.name} size="sm" />
                      {u.name}
                      {u._id === currentUser._id && <span className="muted small">(you)</span>}
                    </span>
                  </td>
                  <td className="muted">{u.email}</td>
                  <td>
                    <span className={u.role === 'admin' ? 'pill admin' : 'pill'}>{u.role === 'admin' ? 'Admin' : 'User'}</span>
                  </td>
                  <td className="muted">{u.interests.join(', ') || '–'}</td>
                  <td className="actions">
                    <button className="link" onClick={() => setEditing(u)}>
                      Edit
                    </button>
                    {u._id !== currentUser._id && (
                      <button
                        className="link danger"
                        disabled={busy}
                        onClick={() =>
                          confirm(`Remove ${u.name}? Their notes and posts will be deleted too.`) &&
                          run(() => api.delete(`/users/${u._id}`))
                        }
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>

      {result && <Pager pagination={result.pagination} onChange={setPage} />}
    </section>
  );
}
