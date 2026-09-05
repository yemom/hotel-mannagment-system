import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const ClientProfile = () => {
  const { currentUser, updateProfile, changePassword } = useAuth();

  const [formData, setFormData] = useState({
    firstName: currentUser?.firstName || '',
    lastName: currentUser?.lastName || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    address: currentUser?.address || '',
    city: currentUser?.city || '',
    country: currentUser?.country || '',
  });

  const [preferences, setPreferences] = useState({
    highFloor: currentUser?.preferences?.highFloor ?? false,
    quietRoom: currentUser?.preferences?.quietRoom ?? false,
    featherPillows: currentUser?.preferences?.featherPillows ?? false,
    lateCheckout: currentUser?.preferences?.lateCheckout ?? false,
    ecoCleaning: currentUser?.preferences?.ecoCleaning ?? false,
    terraceDining: currentUser?.preferences?.terraceDining ?? false,
    vegetarianOptions: currentUser?.preferences?.vegetarianOptions ?? false,
    sommelierRecommendations: currentUser?.preferences?.sommelierRecommendations ?? false,
  });

  // Password change state
  const [pwData, setPwData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwError, setPwError] = useState('');

  const handleTextChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePrefToggle = (key) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      await updateProfile({ ...formData, preferences });
      setSuccessMessage('Your profile and stay preferences were saved successfully!');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');

    if (pwData.newPassword !== pwData.confirmPassword) {
      setPwError('New passwords do not match.');
      return;
    }
    if (pwData.newPassword.length < 6) {
      setPwError('New password must be at least 6 characters.');
      return;
    }

    setSavingPw(true);
    try {
      await changePassword(pwData.currentPassword, pwData.newPassword);
      setPwSuccess('Password changed successfully!');
      setPwData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPwSuccess(''), 4000);
    } catch (err) {
      setPwError(err?.response?.data?.message || err.message || 'Current password is incorrect.');
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="client-profile-container">
      {/* Profile Hero Header — shows real user data */}
      <div className="profile-hero-card">
        <div className="profile-hero-content">
          <div className="profile-large-avatar">
            {currentUser?.firstName?.[0] || 'G'}{currentUser?.lastName?.[0] || ''}
          </div>
          <div className="profile-hero-info">
            <h2>{currentUser?.firstName} {currentUser?.lastName}</h2>
            <p className="profile-email-badge">
              <span className="material-symbols-outlined">verified</span>
              {currentUser?.email}
            </p>
            <div className="profile-tags">
              <span className="profile-chip-tag">Atelier Guest Member</span>
              <span className="profile-chip-tag">Guest ID #{currentUser?.id}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Global alerts */}
      {successMessage && (
        <div className="auth-alert auth-alert-success" style={{ marginTop: '20px' }}>
          <span className="material-symbols-outlined">check_circle</span>
          <span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="auth-alert auth-alert-error" style={{ marginTop: '20px' }}>
          <span className="material-symbols-outlined">error</span>
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="profile-form-grid">
        {/* ─── Personal Information ─── */}
        <div className="profile-card">
          <div className="card-heading">
            <span className="material-symbols-outlined icon-accent">badge</span>
            <div>
              <h3>Personal Information</h3>
              <p>Used to auto-populate your booking reservations and invoices.</p>
            </div>
          </div>

          <div className="form-grid-2" style={{ marginTop: '16px' }}>
            <div className="form-group">
              <label>First Name</label>
              <input
                type="text"
                name="firstName"
                required
                className="field"
                value={formData.firstName}
                onChange={handleTextChange}
              />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input
                type="text"
                name="lastName"
                className="field"
                value={formData.lastName}
                onChange={handleTextChange}
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                disabled
                className="field"
                title="Email is your account identifier and cannot be changed"
                value={formData.email}
              />
            </div>
            <div className="form-group">
              <label>Contact Phone</label>
              <input
                type="tel"
                name="phone"
                className="field"
                value={formData.phone}
                onChange={handleTextChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Street Address</label>
            <input
              type="text"
              name="address"
              className="field"
              placeholder="123 Main Street"
              value={formData.address}
              onChange={handleTextChange}
            />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label>City</label>
              <input
                type="text"
                name="city"
                className="field"
                value={formData.city}
                onChange={handleTextChange}
              />
            </div>
            <div className="form-group">
              <label>Country</label>
              <input
                type="text"
                name="country"
                className="field"
                value={formData.country}
                onChange={handleTextChange}
              />
            </div>
          </div>

          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              className="primary-button"
              disabled={saving}
              style={{ minWidth: '180px' }}
            >
              {saving ? (
                <>
                  <span className="spinner" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">save</span>
                  <span>Save Profile</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ─── Stay Preferences ─── */}
        <div className="profile-card">
          <div className="card-heading">
            <span className="material-symbols-outlined icon-accent">hotel_class</span>
            <div>
              <h3>Saved Stay Preferences</h3>
              <p>Customize your stay experience. We apply these to all new reservations.</p>
            </div>
          </div>

          <div className="preference-toggles-list" style={{ marginTop: '16px' }}>
            {[
              { key: 'highFloor', label: 'High Floor Placement', desc: 'Prefer upper floor suites away from ground street level', icon: 'apartment' },
              { key: 'quietRoom', label: 'Quiet Wing Preference', desc: 'Rooms located away from elevators and high-traffic areas', icon: 'volume_off' },
              { key: 'featherPillows', label: 'Hypoallergenic Feather Pillows', desc: 'Complimentary premium bedding setup upon arrival', icon: 'bed' },
              { key: 'lateCheckout', label: 'Late Check-out Request', desc: 'Request 1:00 PM late check-out when availability permits', icon: 'alarm' },
              { key: 'ecoCleaning', label: 'Eco-Friendly Housekeeping', desc: 'Towel & linen refresh every 3 days to conserve water & energy', icon: 'eco' },
              { key: 'terraceDining', label: 'Al Fresco / Terrace Seating', desc: 'Prioritize garden and terrace seating for restaurant bookings', icon: 'deck' },
              { key: 'vegetarianOptions', label: 'Vegetarian / Plant-Based Menu', desc: 'Highlight vegetarian and plant-crafted options on arrival', icon: 'nutrition' },
              { key: 'sommelierRecommendations', label: 'Sommelier Pairings', desc: 'Curate wine pairing suggestions alongside dining reservations', icon: 'wine_bar' },
            ].map(({ key, label, desc, icon }) => (
              <label key={key} className="pref-toggle-card">
                <input
                  type="checkbox"
                  checked={preferences[key]}
                  onChange={() => handlePrefToggle(key)}
                />
                <div className="pref-text">
                  <strong>{label}</strong>
                  <span>{desc}</span>
                </div>
                <span className="material-symbols-outlined pref-icon">{icon}</span>
              </label>
            ))}
          </div>

          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              className="primary-button"
              disabled={saving}
              style={{ minWidth: '200px' }}
            >
              {saving ? (
                <>
                  <span className="spinner" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">save</span>
                  <span>Save Preferences</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* ─── Change Password ─── (separate form so it doesn't conflict with profile save) */}
      <form onSubmit={handlePasswordChange} className="profile-form-grid" style={{ marginTop: '0' }}>
        <div className="profile-card">
          <div className="card-heading">
            <span className="material-symbols-outlined icon-accent">lock_reset</span>
            <div>
              <h3>Change Password</h3>
              <p>Enter your current password then choose a strong new one.</p>
            </div>
          </div>

          {pwSuccess && (
            <div className="auth-alert auth-alert-success" style={{ marginTop: '16px' }}>
              <span className="material-symbols-outlined">check_circle</span>
              <span>{pwSuccess}</span>
            </div>
          )}
          {pwError && (
            <div className="auth-alert auth-alert-error" style={{ marginTop: '16px' }}>
              <span className="material-symbols-outlined">error</span>
              <span>{pwError}</span>
            </div>
          )}

          <div className="form-group" style={{ marginTop: '16px' }}>
            <label>Current Password</label>
            <div className="input-with-icon" style={{ position: 'relative' }}>
              <span className="material-symbols-outlined">lock</span>
              <input
                type={showCurrentPw ? 'text' : 'password'}
                className="field"
                required
                placeholder="••••••••"
                value={pwData.currentPassword}
                onChange={(e) => setPwData((p) => ({ ...p, currentPassword: e.target.value }))}
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowCurrentPw(!showCurrentPw)}
                title={showCurrentPw ? 'Hide password' : 'Show password'}
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
                  {showCurrentPw ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label>New Password</label>
              <div className="input-with-icon" style={{ position: 'relative' }}>
                <span className="material-symbols-outlined">lock_open</span>
                <input
                  type={showNewPw ? 'text' : 'password'}
                  className="field"
                  required
                  minLength={6}
                  placeholder="Min. 6 characters"
                  value={pwData.newPassword}
                  onChange={(e) => setPwData((p) => ({ ...p, newPassword: e.target.value }))}
                  style={{ paddingRight: '40px' }}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowNewPw(!showNewPw)}
                  title={showNewPw ? 'Hide password' : 'Show password'}
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
                    {showNewPw ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <div className="input-with-icon" style={{ position: 'relative' }}>
                <span className="material-symbols-outlined">lock_open</span>
                <input
                  type={showConfirmPw ? 'text' : 'password'}
                  className="field"
                  required
                  placeholder="Repeat new password"
                  value={pwData.confirmPassword}
                  onChange={(e) => setPwData((p) => ({ ...p, confirmPassword: e.target.value }))}
                  style={{ paddingRight: '40px' }}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowConfirmPw(!showConfirmPw)}
                  title={showConfirmPw ? 'Hide password' : 'Show password'}
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
                    {showConfirmPw ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              className="primary-button"
              disabled={savingPw}
              style={{ minWidth: '200px' }}
            >
              {savingPw ? (
                <>
                  <span className="spinner" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">key</span>
                  <span>Update Password</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ClientProfile;
