import { useState, type FormEvent } from 'react';
import { api, type Note, type User } from '../api';
import Avatar from '../components/Avatar';
import Pager from '../components/Pager';
import { usePaged } from '../components/usePaged';

const formatDisplayDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

interface NotesPageProps {
  user: User;
}

export default function NotesPage({ user: currentUser }: NotesPageProps) {
  const isCurrentUserAdmin = currentUser.role === 'admin';
  const [isViewingAllUsersNotes, setIsViewingAllUsersNotes] = useState<boolean>(false);
  const {
    result: paginatedNotesResult,
    error: notesFetchError,
    setPage: setNotesCurrentPage,
    reload: reloadNotesList,
  } = usePaged<Note>(isViewingAllUsersNotes ? '/notes?scope=all' : '/notes');

  const [newNoteTitle, setNewNoteTitle] = useState<string>('');
  const [newNoteContent, setNewNoteContent] = useState<string>('');
  const [editingNoteTarget, setEditingNoteTarget] = useState<Note | null>(null);
  const [operationErrorMessage, setOperationErrorMessage] = useState<string>('');

  async function executeNoteMutationTask(mutationCallback: () => Promise<unknown>) {
    try {
      setOperationErrorMessage('');
      await mutationCallback();
      await reloadNotesList();
    } catch (caughtError) {
      setOperationErrorMessage((caughtError as Error).message);
    }
  }

  function handleCreateNoteSubmit(event: FormEvent) {
    event.preventDefault();
    executeNoteMutationTask(async () => {
      await api.post('/notes', { title: newNoteTitle, content: newNoteContent });
      setNewNoteTitle('');
      setNewNoteContent('');
    });
  }

  function handleSaveEditedNoteSubmit(event: FormEvent) {
    event.preventDefault();
    if (!editingNoteTarget) return;
    executeNoteMutationTask(async () => {
      await api.patch(`/notes/${editingNoteTarget._id}`, {
        title: editingNoteTarget.title,
        content: editingNoteContent,
      });
      setEditingNoteTarget(null);
    });
  }

  const [editingNoteContent, setEditingNoteContent] = useState<string>('');

  const extractNoteOwnerId = (note: Note) => (typeof note.owner === 'string' ? note.owner : note.owner._id);
  const extractNoteOwnerName = (note: Note) => (typeof note.owner === 'string' ? '' : note.owner.name);
  const totalNotesCount = paginatedNotesResult?.pagination.total ?? 0;

  return (
    <section>
      <header className="page-header">
        <div>
          <h1>{isViewingAllUsersNotes ? 'All notes' : 'My notes'}</h1>
          {paginatedNotesResult && (
            <p className="subtitle">
              {totalNotesCount} {totalNotesCount === 1 ? 'note' : 'notes'}
              {isViewingAllUsersNotes ? ' across all users' : ''}
            </p>
          )}
        </div>
        {isCurrentUserAdmin && (
          <div className="segmented" role="group" aria-label="Whose notes">
            <button
              className={!isViewingAllUsersNotes ? 'on' : ''}
              onClick={() => setIsViewingAllUsersNotes(false)}
            >
              Mine
            </button>
            <button
              className={isViewingAllUsersNotes ? 'on' : ''}
              onClick={() => setIsViewingAllUsersNotes(true)}
            >
              Everyone
            </button>
          </div>
        )}
      </header>

      <form className="composer" onSubmit={handleCreateNoteSubmit}>
        <input
          className="composer-title"
          placeholder="Title"
          value={newNoteTitle}
          onChange={(event) => setNewNoteTitle(event.target.value)}
          required
        />
        <textarea
          placeholder="Take a note…"
          rows={2}
          value={newNoteContent}
          onChange={(event) => setNewNoteContent(event.target.value)}
        />
        <div className="composer-actions">
          <button className="button primary" disabled={!newNoteTitle.trim()}>
            Add note
          </button>
        </div>
      </form>

      {(notesFetchError || operationErrorMessage) && (
        <p className="error">{notesFetchError || operationErrorMessage}</p>
      )}

      {paginatedNotesResult && paginatedNotesResult.data.length === 0 && (
        <div className="empty">
          <p className="empty-title">No notes yet</p>
          <p>Write your first one above. Only you can see it.</p>
        </div>
      )}

      <div className="board">
        {paginatedNotesResult?.data.map((note) => {
          const isCurrentUserNoteOwner = extractNoteOwnerId(note) === currentUser._id;

          if (editingNoteTarget?._id === note._id) {
            return (
              <form key={note._id} className="sheet editing" onSubmit={handleSaveEditedNoteSubmit}>
                <input
                  className="sheet-input-title"
                  value={editingNoteTarget.title}
                  onChange={(event) =>
                    setEditingNoteTarget({ ...editingNoteTarget, title: event.target.value })
                  }
                  required
                  autoFocus
                />
                <textarea
                  rows={5}
                  value={editingNoteContent}
                  onChange={(event) => setEditingNoteContent(event.target.value)}
                />
                <div className="sheet-foot">
                  <button
                    type="button"
                    className="button ghost small"
                    onClick={() => setEditingNoteTarget(null)}
                  >
                    Cancel
                  </button>
                  <button className="button primary small">Save</button>
                </div>
              </form>
            );
          }

          return (
            <article key={note._id} className={isCurrentUserNoteOwner ? 'sheet' : 'sheet other'}>
              {!isCurrentUserNoteOwner && (
                <div className="sheet-owner">
                  <Avatar name={extractNoteOwnerName(note)} size="sm" />
                  {extractNoteOwnerName(note)}
                </div>
              )}
              <h3>{note.title}</h3>
              {note.content && <p className="prose">{note.content}</p>}
              <div className="sheet-foot">
                <span className="muted small">{formatDisplayDate(note.updatedAt)}</span>
                {isCurrentUserNoteOwner && (
                  <span className="sheet-actions">
                    <button
                      className="link"
                      onClick={() => {
                        setEditingNoteTarget(note);
                        setEditingNoteContent(note.content || '');
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="link danger"
                      onClick={() =>
                        confirm('Delete this note?') &&
                        executeNoteMutationTask(() => api.delete(`/notes/${note._id}`))
                      }
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

      {paginatedNotesResult && (
        <Pager pagination={paginatedNotesResult.pagination} onChange={setNotesCurrentPage} />
      )}
    </section>
  );
}
