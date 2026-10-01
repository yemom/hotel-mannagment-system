import React from 'react';
import { Link } from 'react-router-dom';

const PublicFooter = () => {
  return (
    <footer className="public-footer">
      <div className="public-footer-container">
        <div className="public-footer-grid">
          {/* Brand Column */}
          <div className="public-footer-col brand-col">
            <div className="footer-brand">
              <span className="footer-brand-mark">A</span>
              <div>
                <h3 className="footer-brand-name">Yemom Grand</h3>
                <span className="footer-brand-sub">Luxury Sanctuary &amp; Spa</span>
              </div>
            </div>
            <p className="footer-desc">
              Quintessential luxury where timeless architecture meets bespoke Ethiopian
              hospitality and European elegance. Discover restorative stillness and Michelin-inspired culinary artistry.
            </p>
            <div className="footer-badges">
              <span className="footer-badge">
                <span className="material-symbols-outlined">stars</span> 5-Star Luxury
              </span>
              <span className="footer-badge">
                <span className="material-symbols-outlined">restaurant</span> Michelin Selected
              </span>
              <span className="footer-badge">
                <span className="material-symbols-outlined">spa</span> Forbes Spa 2026
              </span>
            </div>
          </div>

          {/* Quick Links Column */}
          <div className="public-footer-col">
            <h4 className="footer-col-title">Sanctuary Stays</h4>
            <ul className="footer-links">
              <li><Link to="/rooms">Executive Suites</Link></li>
              <li><Link to="/rooms">Presidential Penthouses</Link></li>
              <li><Link to="/rooms">Deluxe Garden Rooms</Link></li>
              <li><Link to="/restaurant">Private Salon Dining</Link></li>
              <li><Link to="/spa">Holistic Spa Rituals</Link></li>
            </ul>
          </div>

          {/* Guest Services Column */}
          <div className="public-footer-col">
            <h4 className="footer-col-title">Guest Portals</h4>
            <ul className="footer-links">
              <li><Link to="/login">Guest Sign In</Link></li>
              <li><Link to="/signup">Member Privileges</Link></li>
              <li><Link to="/client">My Reservations</Link></li>
              <li><Link to="/services">Hotel Services</Link></li>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/contact">Contact Concierge</Link></li>
            </ul>
          </div>

          {/* Contact Column */}
          <div className="public-footer-col contact-col">
            <h4 className="footer-col-title">Concierge &amp; Location</h4>
            <ul className="footer-contact-list">
              <li>
                <span className="material-symbols-outlined">location_on</span>
                <span>Bole Medhanialem, Atlas Boulevard, Addis Ababa, Ethiopia</span>
              </li>
              <li>
                <span className="material-symbols-outlined">call</span>
                <span>+251 934 046 279</span>
              </li>
              <li>
                <span className="material-symbols-outlined">mail</span>
                <span>concierge@aureliagrand.com</span>
              </li>
              <li>
                <span className="material-symbols-outlined">schedule</span>
                <span>Front Desk: 24/7 White-Glove Concierge</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="public-footer-bottom">
          <p>&copy; {new Date().getFullYear()}  Grand Hotel Management System. All rights reserved.</p>
          <div className="footer-bottom-links">
            <a href="#privacy" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
            <span>&bull;</span>
            <a href="#terms" onClick={(e) => e.preventDefault()}>Terms of Service</a>
            <span>&bull;</span>
            <a href="#accessibility" onClick={(e) => e.preventDefault()}>Accessibility</a>
            <span>&bull;</span>
            <a href="#sustainability" onClick={(e) => e.preventDefault()}>Sustainability</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;
