import { useState, type FormEvent } from 'react';
import { api, type Role, type User } from '../api';
import Avatar from '../components/Avatar';
import Pager from '../components/Pager';
import { usePaged } from '../components/usePaged';

interface UsersPageProps {
  currentUser: User;
}

interface CreateUserFormValues {
  name: string;
  email: string;
  password: string;
  role: Role;
}

const initialCreateUserFormValues: CreateUserFormValues = {
  name: '',
  email: '',
  password: '',
  role: 'user',
};

export default function UsersPage({ currentUser }: UsersPageProps) {
  const {
    result: paginatedUsersResult,
    error: usersFetchErrorMessage,
    setPage: setUsersCurrentPage,
    reload: reloadUsersList,
  } = usePaged<User>('/users');

  const [createUserFormData, setCreateUserFormData] =
    useState<CreateUserFormValues>(initialCreateUserFormValues);
  const [isCreateUserFormVisible, setIsCreateUserFormVisible] = useState<boolean>(false);
  const [editingUserTarget, setEditingUserTarget] = useState<User | null>(null);
  const [userOperationErrorMessage, setUserOperationErrorMessage] = useState<string>('');

  async function executeUserManagementTask(mutationTask: () => Promise<unknown>) {
    try {
      setUserOperationErrorMessage('');
      await mutationTask();
      await reloadUsersList();
    } catch (caughtError) {
      setUserOperationErrorMessage((caughtError as Error).message);
    }
  }

  function handleCreateNewUserSubmit(event: FormEvent) {
    event.preventDefault();
    executeUserManagementTask(async () => {
      await api.post('/users', createUserFormData);
      setCreateUserFormData(initialCreateUserFormValues);
      setIsCreateUserFormVisible(false);
    });
  }

  function handleSaveEditedUserSubmit() {
    if (!editingUserTarget) return;
    executeUserManagementTask(async () => {
      await api.patch(`/users/${editingUserTarget._id}`, {
        name: editingUserTarget.name,
        email: editingUserTarget.email,
        role: editingUserTarget.role,
      });
      setEditingUserTarget(null);
    });
  }

  return (
    <section>
      <header className="page-header">
        <div>
          <h1>Users</h1>
          {paginatedUsersResult && (
            <p className="subtitle">{paginatedUsersResult.pagination.total} accounts</p>
          )}
        </div>
        <button
          className="button primary"
          onClick={() => setIsCreateUserFormVisible(!isCreateUserFormVisible)}
        >
          {isCreateUserFormVisible ? 'Close' : 'Add user'}
        </button>
      </header>

      {isCreateUserFormVisible && (
        <form className="panel grid-form" onSubmit={handleCreateNewUserSubmit}>
          <h2 className="form-title">New user</h2>
          <label>
            Name
            <input
              value={createUserFormData.name}
              onChange={(event) =>
                setCreateUserFormData({ ...createUserFormData, name: event.target.value })
              }
              required
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={createUserFormData.email}
              onChange={(event) =>
                setCreateUserFormData({ ...createUserFormData, email: event.target.value })
              }
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              minLength={8}
              value={createUserFormData.password}
              onChange={(event) =>
                setCreateUserFormData({ ...createUserFormData, password: event.target.value })
              }
              required
            />
          </label>
          <label>
            Role
            <select
              value={createUserFormData.role}
              onChange={(event) =>
                setCreateUserFormData({
                  ...createUserFormData,
                  role: event.target.value as Role,
                })
              }
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <div className="row">
            <button className="button primary">Create user</button>
          </div>
        </form>
      )}

      {(usersFetchErrorMessage || userOperationErrorMessage) && (
        <p className="error">{usersFetchErrorMessage || userOperationErrorMessage}</p>
      )}

      <div className="panel table-wrap">
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
            {paginatedUsersResult?.data.map((listedUser) =>
              editingUserTarget?._id === listedUser._id ? (
                <tr key={listedUser._id}>
                  <td>
                    <input
                      value={editingUserTarget.name}
                      onChange={(event) =>
                        setEditingUserTarget({ ...editingUserTarget, name: event.target.value })
                      }
                    />
                  </td>
                  <td>
                    <input
                      value={editingUserTarget.email}
                      onChange={(event) =>
                        setEditingUserTarget({ ...editingUserTarget, email: event.target.value })
                      }
                    />
                  </td>
                  <td>
                    <select
                      value={editingUserTarget.role}
                      disabled={listedUser._id === currentUser._id}
                      onChange={(event) =>
                        setEditingUserTarget({
                          ...editingUserTarget,
                          role: event.target.value as Role,
                        })
                      }
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="muted">{listedUser.interests.join(', ')}</td>
                  <td className="actions">
                    <button className="link" onClick={handleSaveEditedUserSubmit}>
                      Save
                    </button>
                    <button className="link" onClick={() => setEditingUserTarget(null)}>
                      Cancel
                    </button>
                  </td>
                </tr>
              ) : (
                <tr key={listedUser._id}>
                  <td>
                    <span className="user-cell">
                      <Avatar name={listedUser.name} size="sm" />
                      {listedUser.name}
                      {listedUser._id === currentUser._id && (
                        <span className="muted small">(you)</span>
                      )}
                    </span>
                  </td>
                  <td className="muted">{listedUser.email}</td>
                  <td>
                    <span className={listedUser.role === 'admin' ? 'pill admin' : 'pill'}>
                      {listedUser.role === 'admin' ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td className="muted">{listedUser.interests.join(', ') || '–'}</td>
                  <td className="actions">
                    <button className="link" onClick={() => setEditingUserTarget(listedUser)}>
                      Edit
                    </button>
                    {listedUser._id !== currentUser._id && (
                      <button
                        className="link danger"
                        onClick={() =>
                          confirm(
                            `Remove ${listedUser.name}? Their notes and posts will be deleted too.`,
                          ) &&
                          executeUserManagementTask(() => api.delete(`/users/${listedUser._id}`))
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

      {paginatedUsersResult && (
        <Pager
          pagination={paginatedUsersResult.pagination}
          onChange={setUsersCurrentPage}
        />
      )}
    </section>
  );
}
