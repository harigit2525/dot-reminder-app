import React, { useState } from 'react';
import { registerUser, loginUser } from '../services/auth';
import { LogIn, UserPlus, Mail, Lock, User, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function Auth({ onAuthSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const resetForm = () => {
    setUsername('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
  };

  const handleToggleMode = () => {
    setIsRegister(!isRegister);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Simple Validations
    if (isRegister) {
      if (!username.trim() || !email.trim() || !password || !confirmPassword) {
        setError('All fields are required.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    } else {
      if (!email.trim() || !password) {
        setError('Please fill in all fields.');
        return;
      }
    }

    setLoading(true);
    try {
      if (isRegister) {
        const user = await registerUser(username, email, password);
        setSuccess('Registration successful! Redirecting...');
        setTimeout(() => {
          onAuthSuccess(user);
        }, 1500);
      } else {
        const user = await loginUser(email, password);
        setSuccess('Success! Logging in...');
        setTimeout(() => {
          onAuthSuccess(user);
        }, 1000);
      }
    } catch (err) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container animate-fade-in">
      <style>{`
        .auth-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 2rem 1rem;
        }

        .auth-card {
          width: 100%;
          max-width: 440px;
          padding: 2.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .auth-header {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .app-logo {
          font-size: 3rem;
          font-weight: 800;
          letter-spacing: -0.05em;
          color: var(--text-primary);
          display: flex;
          align-items: center;
          gap: 0.1rem;
        }

        .logo-dot {
          color: var(--accent-color);
          animation: logoPulse 2s infinite ease-in-out;
        }

        @keyframes logoPulse {
          0%, 100% { opacity: 0.5; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.3); filter: drop-shadow(0 0 8px var(--accent-color)); }
        }

        .auth-subtitle {
          color: var(--text-secondary);
          font-size: 0.95rem;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1.2rem;
        }

        .input-icon-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon-wrapper input {
          width: 100%;
          padding-left: 2.75rem;
          padding-right: 2.75rem;
        }

        .input-prefix-icon {
          position: absolute;
          left: 1rem;
          color: var(--text-muted);
          pointer-events: none;
        }

        .password-toggle-btn {
          position: absolute;
          right: 0.5rem;
          background: transparent;
          border: none;
          color: var(--text-muted);
          width: 2rem;
          height: 2rem;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .password-toggle-btn:hover {
          color: var(--text-primary);
        }

        .alert-banner {
          padding: 0.75rem 1rem;
          border-radius: var(--radius-sm);
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          animation: slideUp 0.2s ease-out;
        }

        .alert-error {
          background: var(--danger-glow);
          border: 1px solid rgba(239, 68, 68, 0.25);
          color: var(--danger);
        }

        .alert-success {
          background: var(--success-glow);
          border: 1px solid rgba(16, 185, 129, 0.25);
          color: var(--success);
        }

        .auth-footer {
          text-align: center;
          font-size: 0.9rem;
          color: var(--text-secondary);
          margin-top: 0.5rem;
        }

        .auth-toggle-link {
          color: var(--accent-color);
          background: transparent;
          border: none;
          padding: 0;
          font-weight: 600;
          cursor: pointer;
          transition: color var(--transition-fast);
        }

        .auth-toggle-link:hover {
          color: var(--accent-color-hover);
          text-decoration: underline;
        }
      `}</style>

      <div className="auth-card glass-panel animate-scale-in">
        <div className="auth-header">
          <div className="app-logo">
            dot<span className="logo-dot">.</span>
          </div>
          <p className="auth-subtitle">
            {isRegister ? 'Create an account to start tracking tasks' : 'Welcome back! Organize your schedule'}
          </p>
        </div>

        {error && (
          <div className="alert-banner alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert-banner alert-success">
            <AlertCircle size={18} />
            <span>{success}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          {isRegister && (
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <div className="input-icon-wrapper">
                <User className="input-prefix-icon" size={18} />
                <input
                  id="username"
                  type="text"
                  placeholder="e.g. JohnDoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-icon-wrapper">
              <Mail className="input-prefix-icon" size={18} />
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-icon-wrapper">
              <Lock className="input-prefix-icon" size={18} />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {isRegister && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="input-icon-wrapper">
                <Lock className="input-prefix-icon" size={18} />
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? (
              <span>Processing...</span>
            ) : isRegister ? (
              <>
                <UserPlus size={18} />
                <span>Sign Up</span>
              </>
            ) : (
              <>
                <LogIn size={18} />
                <span>Log In</span>
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          {isRegister ? (
            <>
              Already have an account?{' '}
              <button type="button" className="auth-toggle-link" onClick={handleToggleMode} disabled={loading}>
                Sign In
              </button>
            </>
          ) : (
            <>
              Don't have an account?{' '}
              <button type="button" className="auth-toggle-link" onClick={handleToggleMode} disabled={loading}>
                Create Account
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
