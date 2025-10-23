import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface AuthProps {
  onClose: () => void;
}

export default function Auth({ onClose }: AuthProps) {
  const { signIn, signUp, isSupabaseConfigured } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setError('Authentication is currently unavailable. Please configure Supabase to enable sign in.');
    }
  }, [isSupabaseConfigured]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signin') {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-modal">
      <div className="auth-backdrop" onClick={onClose}></div>
      <div className="auth-content">
        <button className="close-btn" onClick={onClose}>×</button>

        <h2>{mode === 'signin' ? 'Sign In' : 'Sign Up'}</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
              disabled={!isSupabaseConfigured}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              minLength={6}
              disabled={!isSupabaseConfigured}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            className="submit-btn"
            disabled={loading || !isSupabaseConfigured}
          >
            {loading ? 'Loading...' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div className="auth-switch">
          {mode === 'signin' ? (
            <p>
              Don't have an account?{' '}
              <button onClick={() => setMode('signup')} disabled={!isSupabaseConfigured}>
                Sign Up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button onClick={() => setMode('signin')} disabled={!isSupabaseConfigured}>
                Sign In
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
