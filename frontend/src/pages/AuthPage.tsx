import { useState, type FormEvent } from 'react';
import { api, type User } from '../api';

interface AuthPageProps {
  onLogin: (authToken: string, authenticatedUser: User) => void;
}

interface AuthFormState {
  name: string;
  email: string;
  password: string;
  interests: string;
}

const initialAuthFormValues: AuthFormState = {
  name: '',
  email: '',
  password: '',
  interests: '',
};

export default function AuthPage({ onLogin }: AuthPageProps) {
  const [authenticationMode, setAuthenticationMode] = useState<'login' | 'register'>('login');
  const [authFormState, setAuthFormState] = useState<AuthFormState>(initialAuthFormValues);
  const [authErrorMessage, setAuthErrorMessage] = useState<string>('');
  const [isSubmittingAuthRequest, setIsSubmittingAuthRequest] = useState<boolean>(false);

  const handleFormFieldChange =
    (fieldName: keyof AuthFormState) => (event: { target: { value: string } }) => {
      setAuthFormState({ ...authFormState, [fieldName]: event.target.value });
    };

  async function handleAuthenticationFormSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmittingAuthRequest(true);
    setAuthErrorMessage('');
    try {
      const response =
        authenticationMode === 'login'
          ? await api.post<{ token: string; user: User }>('/auth/login', {
              email: authFormState.email,
              password: authFormState.password,
            })
          : await api.post<{ token: string; user: User }>('/auth/register', {
              name: authFormState.name,
              email: authFormState.email,
              password: authFormState.password,
              interests: authFormState.interests
                .split(',')
                .map((interestSegment) => interestSegment.trim())
                .filter(Boolean),
            });
      onLogin(response.token, response.user);
    } catch (caughtError) {
      setAuthErrorMessage((caughtError as Error).message);
    } finally {
      setIsSubmittingAuthRequest(false);
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

        <p>
          Keep your notes private, share posts with everyone, and find people who like the same things you do.
        </p>
      </div>

      <div className="auth-main">
        <form className="auth-form" onSubmit={handleAuthenticationFormSubmit}>
          <h1>{authenticationMode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
          <p className="muted lead">
            {authenticationMode === 'login' ? 'Log in to see your notes.' : 'It only takes a minute.'}
          </p>

          {authenticationMode === 'register' && (
            <label>
              Name
              <input
                value={authFormState.name}
                onChange={handleFormFieldChange('name')}
                autoComplete="name"
                required
              />
            </label>
          )}
          <label>
            Email
            <input
              type="email"
              value={authFormState.email}
              onChange={handleFormFieldChange('email')}
              autoComplete="email"
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={authFormState.password}
              onChange={handleFormFieldChange('password')}
              minLength={authenticationMode === 'register' ? 8 : undefined}
              autoComplete={authenticationMode === 'login' ? 'current-password' : 'new-password'}
              required
            />
          </label>
          {authenticationMode === 'register' && (
            <label>
              Interests <span className="muted hint">optional, separate with commas</span>
              <input
                value={authFormState.interests}
                onChange={handleFormFieldChange('interests')}
                placeholder="chess, reading"
              />
            </label>
          )}

          {authErrorMessage && <p className="error">{authErrorMessage}</p>}

          <button className="button primary large" disabled={isSubmittingAuthRequest}>
            {isSubmittingAuthRequest
              ? 'Please wait…'
              : authenticationMode === 'login'
                ? 'Log in'
                : 'Create account'}
          </button>

          <p className="muted switch">
            {authenticationMode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              type="button"
              className="link"
              onClick={() => {
                setAuthenticationMode(authenticationMode === 'login' ? 'register' : 'login');
                setAuthErrorMessage('');
              }}
            >
              {authenticationMode === 'login' ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
