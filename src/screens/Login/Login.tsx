import React, { ReactElement, useState } from 'react';
import { Navigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import { useAuth } from 'context/AuthContext';
import { PAGE_PATHS } from 'lib/pagesPaths';
import styles from './Login.module.scss';

function Login(): ReactElement {
  const { login, isAuthenticated } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (isAuthenticated) {
    return <Navigate to={PAGE_PATHS.ZONES} replace />;
  }

  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Username and password are required');
      return;
    }
    setLoading(true);
    setError('');
    const success = await login(username, password);
    setLoading(false);
    if (!success) {
      setError('Invalid username or password');
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <WaterDropIcon className={styles.logo} />
          <h1 className={styles.appName}>Dandelion Lane</h1>
          <p className={styles.subtitle}>Irrigation Control</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <TextField
            label="Username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            fullWidth
            size="small"
            className={styles.field}
            disabled={loading}
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            fullWidth
            size="small"
            className={styles.field}
            disabled={loading}
          />

          {error && <p className={styles.error}>{error}</p>}

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
            className={styles.submitBtn}
          >
            {loading ? <CircularProgress size={20} className={styles.spinner} /> : 'Sign In'}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default Login;
