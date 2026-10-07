import { useEffect, useState, type ReactNode } from 'react';
import { api, hasToken, setToken, type User } from './api';
import Avatar from './components/Avatar';
import { FeedIcon, LogoutIcon, NoteIcon, TagIcon, UsersIcon } from './components/icons';
import AuthPage from './pages/AuthPage';
import InterestsPage from './pages/InterestsPage';
import NotesPage from './pages/NotesPage';
import PostsPage from './pages/PostsPage';
import UsersPage from './pages/UsersPage';

type NavigationTabIdentifier = 'notes' | 'posts' | 'interests' | 'users';

interface NavigationTabConfig {
  id: NavigationTabIdentifier;
  label: string;
  icon: ReactNode;
}

export default function App() {
  const [authenticatedUser, setAuthenticatedUser] = useState<User | null>(null);
  const [isInitialAuthLoading, setIsInitialAuthLoading] = useState<boolean>(hasToken());
  const [activeNavigationTab, setActiveNavigationTab] =
    useState<NavigationTabIdentifier>('notes');
  const [selectedPostsAuthorIdFilter, setSelectedPostsAuthorIdFilter] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!hasToken()) return;
    api
      .get<User>('/auth/me')
      .then((userProfile) => setAuthenticatedUser(userProfile))
      .catch(() => setToken(null))
      .finally(() => setIsInitialAuthLoading(false));
  }, []);

  function handleUserLoginSuccess(authToken: string, loggedInUser: User) {
    setToken(authToken);
    setAuthenticatedUser(loggedInUser);
    setActiveNavigationTab('notes');
  }

  function handleUserLogout() {
    setToken(null);
    setAuthenticatedUser(null);
  }

  function handleNavigateToAuthorPosts(targetAuthorId: string) {
    setSelectedPostsAuthorIdFilter(targetAuthorId);
    setActiveNavigationTab('posts');
  }

  if (isInitialAuthLoading) return null;
  if (!authenticatedUser) return <AuthPage onLogin={handleUserLoginSuccess} />;

  const availableNavigationTabs: NavigationTabConfig[] = [
    { id: 'notes', label: 'My notes', icon: <NoteIcon /> },
    { id: 'posts', label: 'Posts', icon: <FeedIcon /> },
    { id: 'interests', label: 'Interests', icon: <TagIcon /> },
  ];
  if (authenticatedUser.role === 'admin') {
    availableNavigationTabs.push({ id: 'users', label: 'Users', icon: <UsersIcon /> });
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">Notes</div>
        <nav>
          {availableNavigationTabs.map((navigationTab) => (
            <button
              key={navigationTab.id}
              className={activeNavigationTab === navigationTab.id ? 'nav-item active' : 'nav-item'}
              onClick={() => {
                setActiveNavigationTab(navigationTab.id);
                if (navigationTab.id === 'posts') setSelectedPostsAuthorIdFilter(null);
              }}
            >
              {navigationTab.icon}
              <span>{navigationTab.label}</span>
            </button>
          ))}
        </nav>
        <div className="account">
          <Avatar name={authenticatedUser.name} />
          <div className="account-info">
            <div className="account-name">
              {authenticatedUser.name}
              {authenticatedUser.role === 'admin' && <span className="badge">Admin</span>}
            </div>
            <div className="account-email">{authenticatedUser.email}</div>
          </div>
          <button
            className="icon-button"
            onClick={handleUserLogout}
            title="Log out"
            aria-label="Log out"
          >
            <LogoutIcon />
          </button>
        </div>
      </aside>

      <main className="content">
        {activeNavigationTab === 'notes' && <NotesPage user={authenticatedUser} />}
        {activeNavigationTab === 'posts' && (
          <PostsPage
            user={authenticatedUser}
            authorId={selectedPostsAuthorIdFilter}
            onSelectAuthor={setSelectedPostsAuthorIdFilter}
          />
        )}
        {activeNavigationTab === 'interests' && (
          <InterestsPage
            user={authenticatedUser}
            onUserChange={setAuthenticatedUser}
            onSelectUser={handleNavigateToAuthorPosts}
          />
        )}
        {activeNavigationTab === 'users' && <UsersPage currentUser={authenticatedUser} />}
      </main>
    </div>
  );
}
