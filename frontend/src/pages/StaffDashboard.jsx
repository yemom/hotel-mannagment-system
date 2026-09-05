import React, { useEffect, useMemo, useState } from 'react';
import { Routes, Route, NavLink, useNavigate, useLocation } from 'react-router-dom';
import Dashboard from './Dashboard.jsx';
import Rooms from './Rooms.jsx';
import Reservations from './Reservations.jsx';
import Guests from './Guests.jsx';
import Pricing from './Pricing.jsx';
import RestaurantTables from './RestaurantTables.jsx';
import TableReservations from './TableReservations.jsx';
import StaffManagement from './StaffManagement.jsx';
import { useAuth } from '../context/AuthContext';
import { reservationAPI, tableReservationAPI } from '../services/api';

const pageTitles = {
  '/staff': 'Front-Desk Overview',
  '/staff/rooms': 'Room Management',
  '/staff/reservations': 'Reservation Management (All Guests)',
  '/staff/restaurant': 'Restaurant Tables',
  '/staff/table-reservations': 'Table Reservations',
  '/staff/team': 'Staff Team',
  '/staff/guests': 'Guest Management',
  '/staff/pricing': 'Pricing & Rates',
  '/staff/reports': 'Reports',
};

const StaffTopBar = ({
  roomReservations = [],
  tableReservations = [],
  onRefresh,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout, switchRole } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifFilter, setNotifFilter] = useState('ALL');
  const [readIds, setReadIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('staff_read_notifs') || '[]');
    } catch {
      return [];
    }
  });

  const is12Yemom =
    currentUser?.isSuperAdmin ||
    currentUser?.email?.toLowerCase().includes('12yemom');

  const today = new Intl.DateTimeFormat('en', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date());

  const handleSwitchToClient = () => {
    if (is12Yemom) return; // 12yemom is strictly Super Admin & Staff only
    switchRole('client');
    navigate('/client');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Compile combined notifications
  const allNotifications = useMemo(() => {
    const roomNotifs = (roomReservations || []).map((r) => ({
      id: `room-${r.id}`,
      rawId: r.id,
      type: 'ROOM',
      title: `Room ${r.room?.roomNumber || 'Key'} Booking`,
      guestName: r.guest ? `${r.guest.firstName} ${r.guest.lastName}` : 'Guest',
      details: `${r.checkInDate} to ${r.checkOutDate} · ${r.numberOfGuests} Guests`,
      status: r.status,
      timestamp: r.checkInDate,
      link: '/staff/reservations',
    }));

    const tableNotifs = (tableReservations || []).map((t) => ({
      id: `table-${t.id}`,
      rawId: t.id,
      type: 'TABLE',
      title: `Table ${t.restaurantTable?.tableNumber || t.id} Dining`,
      guestName: t.guest ? `${t.guest.firstName} ${t.guest.lastName}` : 'Diner',
      details: `${t.reservationDate} at ${t.timeSlot} · ${t.partySize} Guests (${t.restaurantTable?.area?.replace('_', ' ') || 'Main Hall'})`,
      status: t.status,
      timestamp: t.reservationDate,
      link: '/staff/table-reservations',
    }));

    return [...roomNotifs, ...tableNotifs].sort((a, b) => (b.rawId || 0) - (a.rawId || 0));
  }, [roomReservations, tableReservations]);

  const unreadNotifications = useMemo(() => {
    return allNotifications.filter(
      (n) => n.status === 'PENDING' && !readIds.includes(n.id)
    );
  }, [allNotifications, readIds]);

  const unreadCount = unreadNotifications.length;

  const markAllAsRead = () => {
    const allIds = allNotifications.map((n) => n.id);
    setReadIds(allIds);
    try {
      localStorage.setItem('staff_read_notifs', JSON.stringify(allIds));
    } catch {}
  };

  const displayedNotifications = useMemo(() => {
    if (notifFilter === 'ROOM') return allNotifications.filter((n) => n.type === 'ROOM');
    if (notifFilter === 'TABLE') return allNotifications.filter((n) => n.type === 'TABLE');
    return allNotifications;
  }, [allNotifications, notifFilter]);

  const handleToggleNotifications = () => {
    const next = !showNotifications;
    setShowNotifications(next);
    if (next && unreadCount > 0) {
      markAllAsRead();
    }
  };

  return (
    <header className="topbar">
      <div className="topbar-search">
        <span className="material-symbols-outlined">search</span>
        <input
          placeholder="Search bookings, guests, rooms, tables..."
          aria-label="Global admin search"
        />
      </div>

      <div className="topbar-actions">
        <div className="topbar-date">
          <strong>{today}</strong>
          <span>Front Desk Terminal</span>
        </div>

        {/* Real-time Notification Bell with Badge & Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            className="icon-button"
            onClick={handleToggleNotifications}
            title="Reservation notifications"
            style={{ position: 'relative' }}
          >
            <span className="material-symbols-outlined">notifications</span>
            {unreadCount > 0 && (
              <span className="notification-dot" style={{ fontWeight: 700 }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div
              className="dropdown-menu"
              style={{
                position: 'absolute',
                right: 0,
                top: '48px',
                width: '380px',
                maxHeight: '480px',
                overflowY: 'auto',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                zIndex: 1000,
                padding: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '15px', color: '#0f172a' }}>
                    Live Reservation Alerts
                  </h4>
                  <small style={{ color: '#64748b' }}>
                    {unreadCount} pending review
                  </small>
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    style={{
                      border: 'none',
                      background: 'none',
                      color: '#0284c7',
                      fontSize: '12px',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    Mark read
                  </button>
                )}
              </div>

              {/* Notification Type Filters */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                <button
                  type="button"
                  className={`filter-pill ${notifFilter === 'ALL' ? 'filter-pill-active' : ''}`}
                  style={{ fontSize: '11px', padding: '3px 8px' }}
                  onClick={() => setNotifFilter('ALL')}
                >
                  All ({allNotifications.length})
                </button>
                <button
                  type="button"
                  className={`filter-pill ${notifFilter === 'ROOM' ? 'filter-pill-active' : ''}`}
                  style={{ fontSize: '11px', padding: '3px 8px' }}
                  onClick={() => setNotifFilter('ROOM')}
                >
                  Rooms ({(roomReservations || []).length})
                </button>
                <button
                  type="button"
                  className={`filter-pill ${notifFilter === 'TABLE' ? 'filter-pill-active' : ''}`}
                  style={{ fontSize: '11px', padding: '3px 8px' }}
                  onClick={() => setNotifFilter('TABLE')}
                >
                  Dining ({(tableReservations || []).length})
                </button>
              </div>

              {displayedNotifications.length === 0 ? (
                <div style={{ padding: '24px 12px', textAlign: 'center', color: '#94a3b8' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>
                    notifications_off
                  </span>
                  <p style={{ margin: '6px 0 0', fontSize: '13px' }}>No reservation notifications</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {displayedNotifications.slice(0, 10).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        setShowNotifications(false);
                        navigate(n.link);
                      }}
                      style={{
                        display: 'flex',
                        gap: '10px',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        background: n.status === 'PENDING' ? '#fef3c7' : '#f8fafc',
                        borderLeft: `4px solid ${n.type === 'ROOM' ? '#059669' : '#0284c7'}`,
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{
                          color: n.type === 'ROOM' ? '#059669' : '#0284c7',
                          fontSize: '20px',
                          marginTop: '2px',
                        }}
                      >
                        {n.type === 'ROOM' ? 'hotel' : 'restaurant'}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ fontSize: '13px', color: '#0f172a' }}>{n.title}</strong>
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '999px',
                              background: n.status === 'PENDING' ? '#fde68a' : '#e2e8f0',
                              color: n.status === 'PENDING' ? '#92400e' : '#475569',
                            }}
                          >
                            {n.status}
                          </span>
                        </div>
                        <p style={{ margin: '2px 0', fontSize: '12px', color: '#334155' }}>
                          Guest: <strong>{n.guestName}</strong>
                        </p>
                        <small style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>
                          {n.details}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowNotifications(false);
                    navigate('/staff/reservations');
                  }}
                  style={{ border: 'none', background: 'none', color: '#059669', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
                >
                  Manage Rooms →
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNotifications(false);
                    navigate('/staff/table-reservations');
                  }}
                  style={{ border: 'none', background: 'none', color: '#0284c7', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
                >
                  Manage Tables →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Client Portal Button only for regular staff; hidden for 12yemom Super Admin */}
        {!is12Yemom ? (
          <button
            type="button"
            className="secondary-button"
            onClick={handleSwitchToClient}
            title="Open consumer guest booking portal"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span className="material-symbols-outlined">travel_explore</span>
            <span>Client Portal</span>
          </button>
        ) : (
          <span
            className="status-badge status-green"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 10px',
              fontSize: '12px',
              fontWeight: 700,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>verified_user</span>
            Super Admin
          </span>
        )}

        <button
          className="primary-button"
          type="button"
          onClick={() => navigate('/staff/reservations')}
        >
          <span className="material-symbols-outlined">add</span>
          Quick Booking
        </button>

        <div className="profile-chip">
          <div className="avatar">
            {currentUser?.firstName?.[0] || 'Y'}{currentUser?.lastName?.[0] || 'A'}
          </div>
          <div>
            <strong>{currentUser?.firstName} {currentUser?.lastName || 'Admin'}</strong>
            <span style={{ color: is12Yemom ? '#059669' : '' }}>
              {is12Yemom ? 'Super Admin / Staff' : 'Receptionist'}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="icon-button"
          onClick={handleLogout}
          title="Sign out of staff terminal"
          aria-label="Logout"
        >
          <span className="material-symbols-outlined">logout</span>
        </button>
      </div>
      <span className="sr-only">{pageTitles[location.pathname]}</span>
    </header>
  );
};

const StaffReports = () => (
  <section className="page-section">
    <div className="section-heading">
      <div>
        <span className="eyebrow">Analytics</span>
        <h1>Operational Reports</h1>
      </div>
    </div>
    <div className="empty-card">
      <span className="material-symbols-outlined">bar_chart</span>
      <h2>Operational reports and night audit logs</h2>
      <p>Front-desk revenue, housekeeping cycles, and reservation metrics are synchronized.</p>
    </div>
  </section>
);

const StaffDashboard = () => {
  const [roomReservations, setRoomReservations] = useState([]);
  const [tableReservations, setTableReservations] = useState([]);

  const loadReservations = async () => {
    try {
      const [resRoom, resTable] = await Promise.all([
        reservationAPI.getAll(),
        tableReservationAPI.getAll(),
      ]);
      setRoomReservations(resRoom.data || []);
      setTableReservations(resTable.data || []);
    } catch (err) {
      console.warn('Failed to refresh reservations in StaffDashboard:', err);
    }
  };

  useEffect(() => {
    loadReservations();
    // Live polling interval every 8 seconds
    const interval = setInterval(loadReservations, 8000);
    return () => clearInterval(interval);
  }, []);

  const pendingRoomCount = roomReservations.filter((r) => r.status === 'PENDING').length;
  const pendingTableCount = tableReservations.filter((t) => t.status === 'PENDING').length;

  const navItems = [
    { path: '/staff', icon: 'dashboard', label: 'Dashboard', end: true },
    { path: '/staff/rooms', icon: 'meeting_room', label: 'Rooms' },
    {
      path: '/staff/reservations',
      icon: 'calendar_month',
      label: 'Room Reservations',
      badge: pendingRoomCount > 0 ? pendingRoomCount : null,
    },
    { path: '/staff/restaurant', icon: 'restaurant', label: 'Restaurant Tables' },
    {
      path: '/staff/table-reservations',
      icon: 'event_seat',
      label: 'Table Reservations',
      badge: pendingTableCount > 0 ? pendingTableCount : null,
    },
    { path: '/staff/team', icon: 'badge', label: 'Staff Team (Create Staff)' },
    { path: '/staff/guests', icon: 'group', label: 'Guests' },
    { path: '/staff/pricing', icon: 'sell', label: 'Pricing' },
    { path: '/staff/reports', icon: 'bar_chart', label: 'Reports' },
  ];

  return (
    <div className="app-shell">
      {/* Dense Staff Sidebar */}
      <aside className="sidebar">
        <div>
          <div className="brand">
            <div className="brand-mark">የ</div>
            <div>
              <strong>የ-mom Hotel</strong>
              <span>Front-Desk PMS (Staff)</span>
            </div>
          </div>

          <div className="property-card">
            Terminal #01 - Shift Active
          </div>

          <nav aria-label="Staff navigation">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge && (
                  <span
                    style={{
                      background: '#ef4444',
                      color: '#ffffff',
                      borderRadius: '999px',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 7px',
                      marginLeft: 'auto',
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="sidebar-footer">
          <span className="status-badge status-green">Staff Terminal Online</span>
          <p style={{ marginTop: 8 }}>Internal administrative mode</p>
        </div>
      </aside>

      {/* Admin Workspace */}
      <div className="workspace">
        <StaffTopBar
          roomReservations={roomReservations}
          tableReservations={tableReservations}
          onRefresh={loadReservations}
        />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/rooms" element={<Rooms />} />
            <Route path="/reservations" element={<Reservations />} />
            <Route path="/restaurant" element={<RestaurantTables />} />
            <Route path="/table-reservations" element={<TableReservations />} />
            <Route path="/team" element={<StaffManagement />} />
            <Route path="/guests" element={<Guests />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/reports" element={<StaffReports />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default StaffDashboard;
