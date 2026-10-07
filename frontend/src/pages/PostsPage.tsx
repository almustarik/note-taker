import { useState, type FormEvent } from 'react';
import { api, type Page, type Post, type User } from '../api';
import Avatar from '../components/Avatar';
import Pager from '../components/Pager';
import { usePaged } from '../components/usePaged';

interface PostsPageProps {
  user: User;
  authorId: string | null;
  onSelectAuthor: (authorId: string | null) => void;
}

type UserAggregatedPostsPageResponse = Page<Post> & {
  author: { _id: string; name: string };
};

function formatRelativeTimeAgo(isoDateString: string): string {
  const elapsedMinutes = Math.round((Date.now() - new Date(isoDateString).getTime()) / 60000);
  if (elapsedMinutes < 1) return 'just now';
  if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`;
  const elapsedHours = Math.round(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours}h ago`;
  return new Date(isoDateString).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export default function PostsPage({
  user: currentUser,
  authorId: filteredAuthorId,
  onSelectAuthor,
}: PostsPageProps) {
  const {
    result: paginatedPostsResult,
    error: postsFetchError,
    setPage: setPostsCurrentPage,
    reload: reloadPostsList,
  } = usePaged<Post>(filteredAuthorId ? `/users/${filteredAuthorId}/posts` : '/posts');

  const filteredAuthorProfile = filteredAuthorId
    ? (paginatedPostsResult as UserAggregatedPostsPageResponse | null)?.author
    : null;

  const [newPostTitle, setNewPostTitle] = useState<string>('');
  const [newPostBody, setNewPostBody] = useState<string>('');
  const [postOperationErrorMessage, setPostOperationErrorMessage] = useState<string>('');

  async function handleCreatePostSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      await api.post('/posts', { title: newPostTitle, body: newPostBody });
      setNewPostTitle('');
      setNewPostBody('');
      setPostOperationErrorMessage('');
      await reloadPostsList();
    } catch (caughtError) {
      setPostOperationErrorMessage((caughtError as Error).message);
    }
  }

  async function handleDeletePost(targetPost: Post) {
    if (!confirm('Delete this post?')) return;
    try {
      await api.delete(`/posts/${targetPost._id}`);
      await reloadPostsList();
    } catch (caughtError) {
      setPostOperationErrorMessage((caughtError as Error).message);
    }
  }

  const totalPostsCount = paginatedPostsResult?.pagination.total ?? 0;

  return (
    <section>
      {filteredAuthorId ? (
        <header className="profile-header">
          <button className="button ghost small" onClick={() => onSelectAuthor(null)}>
            Back to all posts
          </button>
          {filteredAuthorProfile && (
            <div className="profile">
              <Avatar name={filteredAuthorProfile.name} size="lg" />
              <div>
                <h1>
                  {filteredAuthorProfile._id === currentUser._id
                    ? 'Your posts'
                    : filteredAuthorProfile.name}
                </h1>
                <p className="subtitle">
                  {totalPostsCount} {totalPostsCount === 1 ? 'post' : 'posts'}
                </p>
              </div>
            </div>
          )}
        </header>
      ) : (
        <header className="page-header">
          <div>
            <h1>Posts</h1>
            <p className="subtitle">Everyone can read these.</p>
          </div>
        </header>
      )}

      {!filteredAuthorId && (
        <form className="composer" onSubmit={handleCreatePostSubmit}>
          <div className="composer-row">
            <Avatar name={currentUser.name} />
            <div className="composer-fields">
              <input
                className="composer-title"
                placeholder="Title"
                value={newPostTitle}
                onChange={(event) => setNewPostTitle(event.target.value)}
                required
              />
              <textarea
                placeholder="What's on your mind?"
                rows={2}
                value={newPostBody}
                onChange={(event) => setNewPostBody(event.target.value)}
                required
              />
            </div>
          </div>
          <div className="composer-actions">
            <button
              className="button primary"
              disabled={!newPostTitle.trim() || !newPostBody.trim()}
            >
              Publish
            </button>
          </div>
        </form>
      )}

      {(postsFetchError || postOperationErrorMessage) && (
        <p className="error">{postsFetchError || postOperationErrorMessage}</p>
      )}

      {paginatedPostsResult && paginatedPostsResult.data.length === 0 && (
        <div className="empty">
          <p className="empty-title">No posts yet</p>
          <p>{filteredAuthorId ? 'Nothing published here so far.' : 'Publish the first one above.'}</p>
        </div>
      )}

      <div className="feed">
        {paginatedPostsResult?.data.map((post) => {
          const resolvedPostAuthor =
            post.author && typeof post.author === 'object' && 'name' in post.author
              ? (post.author as { _id: string; name: string })
              : filteredAuthorProfile;
          const authorIdString =
            typeof post.author === 'string' ? post.author : (resolvedPostAuthor?._id ?? '');
          const isCurrentUserPostAuthor = authorIdString === currentUser._id;

          return (
            <article key={post._id} className="post">
              <div className="post-meta">
                {resolvedPostAuthor && <Avatar name={resolvedPostAuthor.name} size="sm" />}
                {resolvedPostAuthor && !filteredAuthorId ? (
                  <button
                    className="post-author"
                    onClick={() => onSelectAuthor(resolvedPostAuthor._id)}
                  >
                    {isCurrentUserPostAuthor ? 'You' : resolvedPostAuthor.name}
                  </button>
                ) : (
                  <span className="post-author static">
                    {resolvedPostAuthor?.name ?? 'Deleted user'}
                  </span>
                )}
                <span className="muted small">{formatRelativeTimeAgo(post.createdAt)}</span>
                {isCurrentUserPostAuthor && (
                  <button
                    className="link danger small push"
                    onClick={() => handleDeletePost(post)}
                  >
                    Delete
                  </button>
                )}
              </div>
              <h3>{post.title}</h3>
              <p className="prose">{post.body}</p>
            </article>
          );
        })}
      </div>

      {paginatedPostsResult && (
        <Pager pagination={paginatedPostsResult.pagination} onChange={setPostsCurrentPage} />
      )}
    </section>
  );
}
