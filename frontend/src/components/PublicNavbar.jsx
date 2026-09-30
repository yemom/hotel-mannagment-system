import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PublicNavbar = () => {
  const { currentUser, role, logout } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isStaffOrAdmin =
    role === 'receptionist' ||
    role === 'SUPER_ADMIN' ||
    role === 'HOUSEKEEPING' ||
    currentUser?.isSuperAdmin ||
    currentUser?.isAdmin;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className={`public-navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="public-nav-container">
        {/* Brand */}
        <Link to="/" className="public-nav-brand">
          <div className="public-brand-mark">A</div>
          <div className="public-brand-text">
            <span className="public-brand-title">Aurelia Grand</span>
            <span className="public-brand-subtitle">Luxury Sanctuary &amp; Spa</span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="public-nav-links">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `public-nav-link ${isActive ? 'active' : ''}`}
          >
            Home
          </NavLink>
          <NavLink
            to="/services"
            className={({ isActive }) => `public-nav-link ${isActive ? 'active' : ''}`}
          >
            Services
          </NavLink>
          <NavLink
            to="/about"
            className={({ isActive }) => `public-nav-link ${isActive ? 'active' : ''}`}
          >
            About
          </NavLink>
          <NavLink
            to="/contact"
            className={({ isActive }) => `public-nav-link ${isActive ? 'active' : ''}`}
          >
            Contact
          </NavLink>
        </div>

        {/* Auth / Action CTA */}
        <div className="public-nav-actions">
          {currentUser ? (
            <div className="public-user-menu">
              {isStaffOrAdmin ? (
                <Link to="/staff" className="public-cta-btn staff-portal-btn">
                  <span className="material-symbols-outlined">dashboard</span>
                  <span>Staff Terminal</span>
                </Link>
              ) : (
                <Link to="/client" className="public-cta-btn client-portal-btn">
                  <span className="material-symbols-outlined">account_circle</span>
                  <span>My Portal</span>
                </Link>
              )}
              <div className="public-user-info">
                <span className="public-user-name">
                  {currentUser.firstName} {currentUser.lastName || ''}
                </span>
                <span className="public-user-role">
                  {currentUser.isSuperAdmin ? 'Super Admin' : (role || 'Guest')}
                </span>
              </div>
              <button
                type="button"
                className="public-logout-btn"
                onClick={handleLogout}
                title="Sign Out"
                aria-label="Logout"
              >
                <span className="material-symbols-outlined">logout</span>
              </button>
            </div>
          ) : (
            <div className="public-auth-buttons">
              <Link to="/login" className="public-nav-login-btn">
                Sign In
              </Link>
              <Link 
                to="/login" 
                state={{ redirectTo: '/client' }}
                className="public-cta-btn"
              >
                Reserve
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            className="public-mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            <span className="material-symbols-outlined">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="public-mobile-menu">
          <Link
            to="/"
            className="public-mobile-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            Home
          </Link>
          <Link
            to="/services"
            className="public-mobile-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            Hotel Services
          </Link>
          <Link
            to="/about"
            className="public-mobile-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            About Us
          </Link>
          <Link
            to="/contact"
            className="public-mobile-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            Contact &amp; Concierge
          </Link>
          <div className="public-mobile-divider" />
          {currentUser ? (
            <div className="public-mobile-user">
              <Link
                to={isStaffOrAdmin ? '/staff' : '/client'}
                className="public-cta-btn"
                onClick={() => setMobileMenuOpen(false)}
              >
                {isStaffOrAdmin ? 'Staff Terminal' : 'Guest Portal'}
              </Link>
              <button
                type="button"
                className="public-outline-btn"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="public-mobile-auth">
              <Link
                to="/login"
                className="public-outline-btn"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link
                to="/login"
                state={{ redirectTo: '/client' }}
                className="public-cta-btn"
                onClick={() => setMobileMenuOpen(false)}
              >
                Reserve
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default PublicNavbar;
