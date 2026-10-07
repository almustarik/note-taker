import { useState, type FormEvent } from 'react';
import { api, type User } from '../api';

interface Props {
  onLogin: (token: string, user: User) => void;
}

export default function AuthPage({ onLogin }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', interests: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const update = (field: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm({ ...form, [field]: e.target.value });

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res =
        mode === 'login'
          ? await api.post<{ token: string; user: User }>('/auth/login', { email: form.email, password: form.password })
          : await api.post<{ token: string; user: User }>('/auth/register', {
              name: form.name,
              email: form.email,
              password: form.password,
              interests: form.interests.split(',').map((s) => s.trim()).filter(Boolean),
            });
      onLogin(res.token, res.user);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth">
      <div className="auth-side">
        <div className="brand">Notes</div>

        <div className="sheet-art" aria-hidden>
          <div className="sheet-art-title">Saturday</div>
          <ul>
            <li className="done">Pick up books from library</li>
            <li>
              <mark className="hl">Chess club at 4pm</mark>
            </li>
            <li>Write post about the hike</li>
            <li>Call Dan back</li>
          </ul>
        </div>

        <p>Keep your notes private, share posts with everyone, and find people who like the same things you do.</p>
      </div>

      <div className="auth-main">
        <form className="auth-form" onSubmit={submit}>
          <h1>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
          <p className="muted lead">
            {mode === 'login' ? 'Log in to see your notes.' : 'It only takes a minute.'}
          </p>

          {mode === 'register' && (
            <label>
              Name
              <input value={form.name} onChange={update('name')} autoComplete="name" required />
            </label>
          )}
          <label>
            Email
            <input type="email" value={form.email} onChange={update('email')} autoComplete="email" required />
          </label>
          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={update('password')}
              minLength={mode === 'register' ? 8 : undefined}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
            />
          </label>
          {mode === 'register' && (
            <label>
              Interests <span className="muted hint">optional, separate with commas</span>
              <input value={form.interests} onChange={update('interests')} placeholder="chess, reading" />
            </label>
          )}

          {error && <p className="error">{error}</p>}

          <button className="button primary large" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
          </button>

          <p className="muted switch">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              type="button"
              className="link"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError('');
              }}
            >
              {mode === 'login' ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
