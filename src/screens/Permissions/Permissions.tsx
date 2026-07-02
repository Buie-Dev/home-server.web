import React, { ReactElement, useEffect, useState } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import AddIcon from '@mui/icons-material/Add';
import EmptyState from 'components/EmptyState/EmptyState';
import LoadingSpinner from 'components/LoadingSpinner/LoadingSpinner';
import PageContainer from 'components/PageContainer/PageContainer';
import { fetchAllUsers, setUserPermissions, createUser } from 'api/auth.api';
import { useAuth } from 'context/AuthContext';
import styles from './Permissions.module.scss';

const ALL_PAGES = [
  { key: 'irrigation', label: 'Irrigation' },
  { key: 'people', label: 'People' },
  { key: 'todo', label: 'To Do' },
  { key: 'events', label: 'Events' },
  { key: 'devices', label: 'Devices' },
  { key: 'admin', label: 'Admin' },
];

type UserRow = { id: number; username: string; permissions: Record<string, boolean> };

function Permissions(): ReactElement {
  const { userId: currentUserId } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [dirty, setDirty] = useState<Record<number, Record<string, boolean>>>({});
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [addError, setAddError] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchAllUsers()
      .then((data) => {
        setUsers(data);
        const initial: Record<number, Record<string, boolean>> = {};
        data.forEach((u) => { initial[u.id] = { ...u.permissions }; });
        setDirty(initial);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const togglePermission = (userId: number, page: string): void => {
    setDirty((prev) => {
      const current = prev[userId] ?? {};
      return { ...prev, [userId]: { ...current, [page]: !current[page] } };
    });
  };

  const handleAddUser = async (): Promise<void> => {
    setAddError('');
    setAdding(true);
    try {
      const created = await createUser({ username: newUsername.trim(), password: newPassword });
      const emptyPerms = Object.fromEntries(ALL_PAGES.map(({ key }) => [key, false]));
      setUsers((prev) => [...prev, { id: created.id, username: created.username, permissions: emptyPerms }]);
      setDirty((prev) => ({ ...prev, [created.id]: { ...emptyPerms } }));
      setShowAddDialog(false);
      setNewUsername('');
      setNewPassword('');
    } catch (e: any) {
      setAddError(e?.message ?? 'Failed to create user');
    } finally {
      setAdding(false);
    }
  };

  const handleSave = async (userId: number): Promise<void> => {
    setSaving(userId);
    try {
      await setUserPermissions(userId, dirty[userId] ?? {});
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, permissions: dirty[userId] } : u));
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <PageContainer>
      <div className={styles.pageHeader}>
        <span className={styles.pageTitle}>Users</span>
        <button type="button" className={styles.addBtn} onClick={() => setShowAddDialog(true)}>
          <AddIcon fontSize="small" />
          Add User
        </button>
      </div>

      {showAddDialog && (
        <div className={styles.dialogOverlay} onClick={() => setShowAddDialog(false)}>
          <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.dialogTitle}>Add User</h3>
            <input
              className={styles.dialogInput}
              placeholder="Username"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              autoFocus
            />
            <input
              className={styles.dialogInput}
              placeholder="Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddUser()}
            />
            {addError && <span className={styles.dialogError}>{addError}</span>}
            <div className={styles.dialogActions}>
              <button type="button" className={styles.cancelBtn} onClick={() => setShowAddDialog(false)}>
                Cancel
              </button>
              <button
                type="button"
                className={styles.saveBtn}
                onClick={handleAddUser}
                disabled={adding || !newUsername.trim() || !newPassword}
              >
                {adding ? <CircularProgress size={14} /> : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {users.length === 0 ? (
        <EmptyState icon={AdminPanelSettingsIcon} title="No users found" />
      ) : (
        <div className={styles.list}>
          {users.map((user) => {
            const userPerms = dirty[user.id] ?? {};
            const isDirty = JSON.stringify(userPerms) !== JSON.stringify(user.permissions);
            const isSelf = user.id === currentUserId;
            return (
              <div key={user.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <span className={styles.username}>{user.username}</span>
                  {isDirty && (
                    <button
                      type="button"
                      className={styles.saveBtn}
                      onClick={() => handleSave(user.id)}
                      disabled={saving === user.id}
                    >
                      {saving === user.id ? <CircularProgress size={14} /> : 'Save'}
                    </button>
                  )}
                </div>
                <div className={styles.permissionGrid}>
                  {ALL_PAGES.map(({ key, label }) => {
                    const granted = !!userPerms[key];
                    const locked = isSelf && key === 'admin';
                    return (
                      <button
                        key={key}
                        type="button"
                        title={locked ? "You can't remove your own admin access" : undefined}
                        className={`${styles.permChip} ${granted ? styles.permGranted : styles.permDenied} ${locked ? styles.permLocked : ''}`}
                        onClick={() => !locked && togglePermission(user.id, key)}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}

export default Permissions;
