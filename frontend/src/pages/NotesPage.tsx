import { useState, type FormEvent } from 'react';
import { api, type Note, type User } from '../api';
import Avatar from '../components/Avatar';
import Pager from '../components/Pager';
import { usePaged } from '../components/usePaged';

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

export default function NotesPage({ user }: { user: User }) {
  const isAdmin = user.role === 'admin';
  const [showAll, setShowAll] = useState(false);
  const { result, error, setPage, reload } = usePaged<Note>(showAll ? '/notes?scope=all' : '/notes');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editing, setEditing] = useState<Note | null>(null);
  const [actionError, setActionError] = useState('');

  async function run(action: () => Promise<unknown>) {
    try {
      setActionError('');
      await action();
      await reload();
    } catch (err) {
      setActionError((err as Error).message);
    }
  }

  function addNote(e: FormEvent) {
    e.preventDefault();
    run(async () => {
      await api.post('/notes', { title, content });
      setTitle('');
      setContent('');
    });
  }

  function saveEdit(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    run(async () => {
      await api.patch(`/notes/${editing._id}`, { title: editing.title, content: editing.content });
      setEditing(null);
    });
  }

  const ownerId = (n: Note) => (typeof n.owner === 'string' ? n.owner : n.owner._id);
  const ownerName = (n: Note) => (typeof n.owner === 'string' ? '' : n.owner.name);
  const total = result?.pagination.total ?? 0;

  return (
    <section>
      <header className="page-header">
        <div>
          <h1>{showAll ? 'All notes' : 'My notes'}</h1>
          {result && (
            <p className="subtitle">
              {total} {total === 1 ? 'note' : 'notes'}
              {showAll ? ' across all users' : ''}
            </p>
          )}
        </div>
        {isAdmin && (
          <div className="segmented" role="group" aria-label="Whose notes">
            <button className={!showAll ? 'on' : ''} onClick={() => setShowAll(false)}>
              Mine
            </button>
            <button className={showAll ? 'on' : ''} onClick={() => setShowAll(true)}>
              Everyone
            </button>
          </div>
        )}
      </header>

      <form className="composer" onSubmit={addNote}>
        <input className="composer-title" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <textarea placeholder="Take a note…" rows={2} value={content} onChange={(e) => setContent(e.target.value)} />
        <div className="composer-actions">
          <button className="button primary" disabled={!title.trim()}>
            Add note
          </button>
        </div>
      </form>

      {(error || actionError) && <p className="error">{error || actionError}</p>}

      {result && result.data.length === 0 && (
        <div className="empty">
          <p className="empty-title">No notes yet</p>
          <p>Write your first one above. Only you can see it.</p>
        </div>
      )}

      <div className="board">
        {result?.data.map((note) => {
          const mine = ownerId(note) === user._id;

          if (editing?._id === note._id) {
            return (
              <form key={note._id} className="sheet editing" onSubmit={saveEdit}>
                <input
                  className="sheet-input-title"
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  required
                  autoFocus
                />
                <textarea
                  rows={5}
                  value={editing.content}
                  onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                />
                <div className="sheet-foot">
                  <button type="button" className="button ghost small" onClick={() => setEditing(null)}>
                    Cancel
                  </button>
                  <button className="button primary small">Save</button>
                </div>
              </form>
            );
          }

          return (
            <article key={note._id} className={mine ? 'sheet' : 'sheet other'}>
              {!mine && (
                <div className="sheet-owner">
                  <Avatar name={ownerName(note)} size="sm" />
                  {ownerName(note)}
                </div>
              )}
              <h3>{note.title}</h3>
              {note.content && <p className="prose">{note.content}</p>}
              <div className="sheet-foot">
                <span className="muted small">{formatDate(note.updatedAt)}</span>
                {mine && (
                  <span className="sheet-actions">
                    <button className="link" onClick={() => setEditing(note)}>
                      Edit
                    </button>
                    <button
                      className="link danger"
                      onClick={() => confirm('Delete this note?') && run(() => api.delete(`/notes/${note._id}`))}
                    >
                      Delete
                    </button>
                  </span>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {result && <Pager pagination={result.pagination} onChange={setPage} />}
    </section>
  );
}
