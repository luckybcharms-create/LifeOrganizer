import { useState } from 'react';
import { Lock } from 'lucide-react';
import { getAccount, saveAccount, hashPassword, SESSION_KEY } from '../utils/auth';

export default function Login({ onSuccess }) {
  const [account] = useState(() => getAccount());
  const isCreating = !account;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    if (!email.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    const passwordHash = await hashPassword(password);
    saveAccount(email.trim(), passwordHash);
    sessionStorage.setItem(SESSION_KEY, '1');
    setBusy(false);
    onSuccess();
  }

  async function handleSignIn(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const passwordHash = await hashPassword(password);
    setBusy(false);
    if (passwordHash === account.passwordHash) {
      sessionStorage.setItem(SESSION_KEY, '1');
      onSuccess();
    } else {
      setError('Incorrect password.');
    }
  }

  function handleReset() {
    const confirmed = window.confirm(
      'This will permanently erase all data in Life Organizer on this device, including your account. This cannot be undone. Continue?'
    );
    if (!confirmed) return;
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-icon">
          <Lock size={24} />
        </div>
        <h1>{isCreating ? 'Create Your Account' : 'Welcome Back'}</h1>
        <p className="muted" style={{ marginBottom: 20 }}>
          {isCreating
            ? 'Set an email and password to protect your data on this device.'
            : `Signing in as ${account.email}`}
        </p>

        {isCreating ? (
          <form className="form" onSubmit={handleCreate}>
            <div className="field">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                required
              />
            </div>
            <div className="field">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>
            <div className="field">
              <label>Confirm Password</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                minLength={6}
                required
              />
            </div>
            {error && <p className="auth-error">{error}</p>}
            <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
              {busy ? 'Creating...' : 'Create Account'}
            </button>
          </form>
        ) : (
          <form className="form" onSubmit={handleSignIn}>
            <div className="field">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                required
              />
            </div>
            {error && <p className="auth-error">{error}</p>}
            <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
              {busy ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        )}

        <button type="button" className="auth-reset-link" onClick={handleReset}>
          {isCreating ? 'Already have data on this device? Reset app' : 'Forgot password? Reset app'}
        </button>
      </div>
    </div>
  );
}
