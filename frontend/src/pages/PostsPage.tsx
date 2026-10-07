import { useState, type FormEvent } from 'react';
import { api, type Page, type Post, type User } from '../api';
import Avatar from '../components/Avatar';
import { ListSkeleton } from '../components/Loading';
import Pager from '../components/Pager';
import { usePaged } from '../components/usePaged';

interface Props {
  user: User;
  authorId: string | null;
  onSelectAuthor: (id: string | null) => void;
}

type AuthorPosts = Page<Post> & { author: { _id: string; name: string } };

function timeAgo(date: string) {
  const minutes = Math.round((Date.now() - new Date(date).getTime()) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export default function PostsPage({ user, authorId, onSelectAuthor }: Props) {
  const { result, error, loading, setPage, reload } = usePaged<Post>(authorId ? `/users/${authorId}/posts` : '/posts');
  const author = authorId ? (result as AuthorPosts | null)?.author : null;

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
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

  function publish(e: FormEvent) {
    e.preventDefault();
    run(async () => {
      await api.post('/posts', { title, body });
      setTitle('');
      setBody('');
    });
  }

  function remove(post: Post) {
    if (confirm('Delete this post?')) run(() => api.delete(`/posts/${post._id}`));
  }

  const total = result?.pagination.total ?? 0;

  return (
    <section>
      {authorId ? (
        <header className="profile-header">
          <button className="button ghost small" onClick={() => onSelectAuthor(null)}>
            Back to all posts
          </button>
          {author && (
            <div className="profile">
              <Avatar name={author.name} size="lg" />
              <div>
                <h1>{author._id === user._id ? 'Your posts' : author.name}</h1>
                <p className="subtitle">
                  {total} {total === 1 ? 'post' : 'posts'}
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

      {!authorId && (
        <form className="composer" onSubmit={publish}>
          <div className="composer-row">
            <Avatar name={user.name} />
            <div className="composer-fields">
              <input className="composer-title" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              <textarea placeholder="What's on your mind?" rows={2} value={body} onChange={(e) => setBody(e.target.value)} required />
            </div>
          </div>
          <div className="composer-actions">
            <button className="button primary" disabled={busy || !title.trim() || !body.trim()}>
              {busy ? 'Publishing…' : 'Publish'}
            </button>
          </div>
        </form>
      )}

      {(error || actionError) && <p className="error">{error || actionError}</p>}

      {loading && !result && <ListSkeleton rows={4} />}

      {!loading && result && result.data.length === 0 && (
        <div className="empty">
          <p className="empty-title">No posts yet</p>
          <p>{authorId ? 'Nothing published here so far.' : 'Publish the first one above.'}</p>
        </div>
      )}

      <div className="feed" aria-busy={loading}>
        {result?.data.map((post) => {
          const postAuthor = post.author ?? author;
          const mine = postAuthor?._id === user._id;
          return (
            <article key={post._id} className="post">
              <div className="post-meta">
                {postAuthor && <Avatar name={postAuthor.name} size="sm" />}
                {postAuthor && !authorId ? (
                  <button className="post-author" onClick={() => onSelectAuthor(postAuthor._id)}>
                    {mine ? 'You' : postAuthor.name}
                  </button>
                ) : (
                  <span className="post-author static">{postAuthor?.name ?? 'Deleted user'}</span>
                )}
                <span className="muted small">{timeAgo(post.createdAt)}</span>
                {mine && (
                  <button className="link danger small push" disabled={busy} onClick={() => remove(post)}>
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

      {result && <Pager pagination={result.pagination} onChange={setPage} />}
    </section>
  );
}
