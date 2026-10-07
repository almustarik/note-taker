import { useEffect, useState, type ReactNode } from 'react';
import { api, hasToken, setToken, type User } from './api';
import Avatar from './components/Avatar';
import { FeedIcon, LogoutIcon, NoteIcon, TagIcon, UsersIcon } from './components/icons';
import AuthPage from './pages/AuthPage';
import InterestsPage from './pages/InterestsPage';
import NotesPage from './pages/NotesPage';
import PostsPage from './pages/PostsPage';
import UsersPage from './pages/UsersPage';

type Tab = 'notes' | 'posts' | 'interests' | 'users';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(hasToken());
  const [tab, setTab] = useState<Tab>('notes');
  const [postsAuthor, setPostsAuthor] = useState<string | null>(null);

  useEffect(() => {
    if (!hasToken()) return;
    api
      .get<User>('/auth/me')
      .then(setUser)
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  function handleLogin(token: string, user: User) {
    setToken(token);
    setUser(user);
    setTab('notes');
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  function showPostsBy(authorId: string) {
    setPostsAuthor(authorId);
    setTab('posts');
  }

  if (loading) return null;
  if (!user) return <AuthPage onLogin={handleLogin} />;

  const tabs: { id: Tab; label: string; icon: ReactNode }[] = [
    { id: 'notes', label: 'My notes', icon: <NoteIcon /> },
    { id: 'posts', label: 'Posts', icon: <FeedIcon /> },
    { id: 'interests', label: 'Interests', icon: <TagIcon /> },
  ];
  if (user.role === 'admin') tabs.push({ id: 'users', label: 'Users', icon: <UsersIcon /> });

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">Notes</div>
        <nav>
          {tabs.map((t) => (
            <button
              key={t.id}
              className={tab === t.id ? 'nav-item active' : 'nav-item'}
              onClick={() => {
                setTab(t.id);
                if (t.id === 'posts') setPostsAuthor(null);
              }}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </nav>
        <div className="account">
          <Avatar name={user.name} />
          <div className="account-info">
            <div className="account-name">
              {user.name}
              {user.role === 'admin' && <span className="badge">Admin</span>}
            </div>
            <div className="account-email">{user.email}</div>
          </div>
          <button className="icon-button" onClick={logout} title="Log out" aria-label="Log out">
            <LogoutIcon />
          </button>
        </div>
      </aside>

      <main className="content">
        {tab === 'notes' && <NotesPage user={user} />}
        {tab === 'posts' && <PostsPage user={user} authorId={postsAuthor} onSelectAuthor={setPostsAuthor} />}
        {tab === 'interests' && <InterestsPage user={user} onUserChange={setUser} onSelectUser={showPostsBy} />}
        {tab === 'users' && <UsersPage currentUser={user} />}
      </main>
    </div>
  );
}
