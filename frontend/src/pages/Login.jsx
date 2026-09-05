import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const isValidEmail = (str) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str.trim());

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address (e.g., name@example.com).');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const user = await login(email.trim(), password, rememberMe);
      if (user?.role === 'receptionist') {
        navigate('/staff');
      } else {
        navigate('/client');
      }
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = (e) => {
    e.preventDefault();
    if (!isValidEmail(forgotEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    setForgotSuccess(true);
    setTimeout(() => {
      setShowForgotPassword(false);
      setForgotSuccess(false);
      setForgotEmail('');
    }, 2500);
  };

  return (
    <div className="auth-container">
      {/* Full-bleed hotel hero background with warm vignette */}
      <div className="auth-backdrop" />

      <div className="auth-card-wrap">
        <div className="auth-card">
          {/* Hotel Brand Header */}
          <div className="auth-brand">
            <div className="auth-brand-mark">የ</div>
            <div>
              <h2 className="auth-brand-title">የ-mom Hotel</h2>
              <span className="auth-brand-subtitle">Boutique Stays & Hospitality PMS</span>
            </div>
          </div>

          <div className="auth-header">
            <h1>Welcome back</h1>
            <p>Please enter your credentials to access your account</p>
          </div>

          {error && (
            <div className="auth-alert auth-alert-error" role="alert">
              <span className="material-symbols-outlined">error</span>
              <span>{error}</span>
            </div>
          )}

          {/* Shared Login Form */}
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="login-email">Email address</label>
              <div className="input-with-icon">
                <span className="material-symbols-outlined">mail</span>
                <input
                  id="login-email"
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="login-password">Password</label>
              <div className="input-with-icon" style={{ position: 'relative' }}>
                <span className="material-symbols-outlined">lock</span>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingRight: '40px' }}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#64748b',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <div className="auth-form-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember me</span>
              </label>

              <button
                type="button"
                className="link-button"
                onClick={() => setShowForgotPassword(true)}
              >
                Forgot password?
              </button>
            </div>

            <button type="submit" className="primary-action-button" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Log In</span>
                  <span className="material-symbols-outlined">arrow_forward</span>
                </>
              )}
            </button>
          </form>


          {/* Client Sign-up link (Staff accounts provisioned internally) */}
          <div className="auth-footer">
            <p>
              Don't have an account?{' '}
              <Link to="/signup" className="auth-action-link">
                Sign Up
              </Link>
            </p>
            <span className="auth-footnote">
              Staff accounts are provisioned internally by hotel administration.
            </span>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '440px' }}>
            <div className="section-heading">
              <div>
                <span className="eyebrow">Account Recovery</span>
                <h2>Reset your password</h2>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setShowForgotPassword(false)}
                aria-label="Close"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {forgotSuccess ? (
              <div className="auth-alert auth-alert-success" style={{ marginTop: '16px' }}>
                <span className="material-symbols-outlined">check_circle</span>
                <div>
                  <strong>Check your inbox</strong>
                  <p>A recovery link has been sent to {forgotEmail}.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} style={{ marginTop: '16px' }}>
                <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.5' }}>
                  Enter your registered email address and we'll send you instructions to reset your password.
                </p>
                <div className="form-group" style={{ marginTop: '16px' }}>
                  <label htmlFor="recovery-email">Email address</label>
                  <input
                    id="recovery-email"
                    type="email"
                    required
                    className="field"
                    placeholder="name@example.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                  />
                </div>
                <div className="modal-actions" style={{ marginTop: '24px' }}>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setShowForgotPassword(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="primary-button">
                    Send Reset Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
