import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
  const navItems = [
    { path: '/', icon: 'dashboard', label: 'Dashboard' },
    { path: '/rooms', icon: 'meeting_room', label: 'Rooms' },
    { path: '/reservations', icon: 'calendar_month', label: 'Reservations' },
    { path: '/guests', icon: 'group', label: 'Guests' },
    { path: '/pricing', icon: 'sell', label: 'Pricing' },
    { path: '/reports', icon: 'bar_chart', label: 'Reports' },
  ];

  return (
    <aside className="sidebar">
      <div>
        <div className="brand">
          <div className="brand-mark">የ</div>
          <div>
            <strong>የ-mom Hotel</strong>
            <span>Boutique Hotel PMS</span>
          </div>
        </div>
        <div className="property-card">Property PMS - Connected</div>
        <nav aria-label="Primary navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="sidebar-footer">
        <span className="status-badge status-green">Shift Active</span>
        <p style={{ marginTop: 8 }}>Front desk morning team</p>
      </div>
    </aside>
  );
};

export default Sidebar;
