import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ClientNavbar = ({ activeTab, onTabChange, reservationCount = 0 }) => {
  const navigate = useNavigate();
  const { currentUser, logout, switchRole } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const initials = currentUser
    ? `${currentUser.firstName?.[0] || ''}${currentUser.lastName?.[0] || ''}`.toUpperCase() || 'G'
    : 'G';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSwitchToStaff = () => {
    switchRole('receptionist');
    navigate('/staff');
  };

  return (
    <header className="client-navbar">
      <div className="client-navbar-container">
        {/* Brand Logo */}
        <div className="client-brand" onClick={() => onTabChange('book')} role="button" tabIndex={0}>
          <div className="client-brand-mark">የ</div>
          <div>
            <span className="client-brand-name">የ-mom Hotel</span>
            <span className="client-brand-tagline">Boutique Luxury Stays & Dining</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="client-nav-links" aria-label="Guest portal navigation">
          <button
            type="button"
            className={`client-nav-link ${activeTab === 'book' ? 'active' : ''}`}
            onClick={() => onTabChange('book')}
          >
            <span className="material-symbols-outlined">search</span>
            <span>Book a Room</span>
          </button>

          <button
            type="button"
            className={`client-nav-link ${activeTab === 'restaurant' ? 'active' : ''}`}
            onClick={() => onTabChange('restaurant')}
          >
            <span className="material-symbols-outlined">restaurant</span>
            <span>Reserve a Table</span>
          </button>

          <button
            type="button"
            className={`client-nav-link ${activeTab === 'reservations' ? 'active' : ''}`}
            onClick={() => onTabChange('reservations')}
          >
            <span className="material-symbols-outlined">calendar_today</span>
            <span>My Reservations</span>
            {reservationCount > 0 && (
              <span className="nav-badge-pill">{reservationCount}</span>
            )}
          </button>

          <button
            type="button"
            className={`client-nav-link ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => onTabChange('profile')}
          >
            <span className="material-symbols-outlined">person</span>
            <span>Profile</span>
          </button>
        </nav>

        {/* User Menu */}
        <div className="client-nav-actions">
          <div className="user-profile-menu">
            <button
              type="button"
              className="client-profile-chip"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              aria-expanded={dropdownOpen}
            >
              <div className="avatar-circle">{initials}</div>
              <div className="profile-text">
                <span className="guest-name">
                  {currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Guest Member'}
                </span>
                <span className="guest-level">Guest Member</span>
              </div>
              <span className="material-symbols-outlined dropdown-arrow">
                {dropdownOpen ? 'expand_less' : 'expand_more'}
              </span>
            </button>

            {dropdownOpen && (
              <div className="client-dropdown-menu">
                <div className="dropdown-header">
                  <strong>{currentUser?.firstName} {currentUser?.lastName}</strong>
                  <span>{currentUser?.email}</span>
                </div>

                <div className="dropdown-divider" />

                <button
                  type="button"
                  className="dropdown-item"
                  onClick={() => {
                    onTabChange('profile');
                    setDropdownOpen(false);
                  }}
                >
                  <span className="material-symbols-outlined">settings</span>
                  <span>My Profile & Preferences</span>
                </button>

                <div className="dropdown-divider" />

                <button
                  type="button"
                  className="dropdown-item logout-item"
                  onClick={handleLogout}
                >
                  <span className="material-symbols-outlined">logout</span>
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default ClientNavbar;
