import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { tableReservationAPI } from '../services/api';

const STATUS_CONFIG = {
  PENDING:   { label: 'Pending',   color: '#b45309', bg: '#fef3c7' },
  CONFIRMED: { label: 'Confirmed', color: '#047857', bg: '#d1fae5' },
  SEATED:    { label: 'Seated',    color: '#15803d', bg: '#dcfce7' },
  COMPLETED: { label: 'Completed', color: '#6b7280', bg: '#f3f4f6' },
  CANCELLED: { label: 'Cancelled', color: '#dc2626', bg: '#fee2e2' },
  NO_SHOW:   { label: 'No-show',   color: '#7c2d12', bg: '#fef2f2' },
};

const AREA_LABELS = { MAIN_HALL: 'Main Hall', TERRACE: 'Terrace', PRIVATE_ROOM: 'Private Room' };

const formatTime = (t) => {
  if (!t) return '—';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
};

const formatDate = (d) =>
  d ? new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

const getLocalTableReservations = () => {
  const list = [];
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.startsWith('client_table_res_') ||
          key === 'hotel_table_reservations' ||
          key === 'hotel_restaurant_table_reservations')
      ) {
        const parsed = JSON.parse(localStorage.getItem(key) || '[]');
        if (Array.isArray(parsed)) list.push(...parsed);
      }
    }
  } catch (_) {}
  return list;
};

const localTableReservationKeys = (key) =>
  key &&
  (key.startsWith('client_table_res_') ||
    key === 'hotel_table_reservations' ||
    key === 'hotel_restaurant_table_reservations');

const updateLocalTableReservationStatus = (id, status) => {
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!localTableReservationKeys(key)) continue;
      const parsed = JSON.parse(localStorage.getItem(key) || '[]');
      if (!Array.isArray(parsed)) continue;
      localStorage.setItem(
        key,
        JSON.stringify(parsed.map((r) => (String(r.id) === String(id) ? { ...r, status } : r)))
      );
    }
  } catch (_) {}
};

const deleteLocalTableReservation = (id) => {
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!localTableReservationKeys(key)) continue;
      const parsed = JSON.parse(localStorage.getItem(key) || '[]');
      if (!Array.isArray(parsed)) continue;
      localStorage.setItem(
        key,
        JSON.stringify(parsed.filter((r) => String(r.id) !== String(id)))
      );
    }
  } catch (_) {}
};

const TableReservations = () => {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await tableReservationAPI.getAll();
      const serverList = res.data || [];
      const localList = getLocalTableReservations();
      const seen = new Set(serverList.map((r) => String(r.id)));
      setReservations([
        ...serverList,
        ...localList.filter((r) => !seen.has(String(r.id))),
      ]);
    } catch (err) {
      console.error('Failed to load table reservations:', err);
      setReservations(getLocalTableReservations());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, 8000);
    return () => clearInterval(timer);
  }, []);

  const doAction = async (id, action) => {
    setActionLoading(id + action);
    const nextStatusByAction = {
      confirm: 'CONFIRMED',
      seat: 'SEATED',
      complete: 'COMPLETED',
      cancel: 'CANCELLED',
      noShow: 'NO_SHOW',
    };
    const nextStatus = nextStatusByAction[action];
    try {
      await tableReservationAPI[action](id);
    } catch (err) {
      console.error(`Action ${action} failed:`, err);
    } finally {
      if (nextStatus) {
        updateLocalTableReservationStatus(id, nextStatus);
        setReservations((prev) =>
          prev.map((r) => (String(r.id) === String(id) ? { ...r, status: nextStatus } : r))
        );
      }
      await load();
      setActionLoading(null);
    }
  };

  const doDelete = async (id) => {
    if (!window.confirm('Permanently delete this reservation? This cannot be undone.')) return;
    setActionLoading(id + 'delete');
    try {
      await tableReservationAPI.delete(id);
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      deleteLocalTableReservation(id);
      setReservations((prev) => prev.filter((r) => String(r.id) !== String(id)));
      await load();
      setActionLoading(null);
    }
  };

  const filtered = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return reservations.filter((r) => {
      const guestName = `${r.guest?.firstName || ''} ${r.guest?.lastName || ''}`;
      const tableNumber = r.restaurantTable?.tableNumber || '';
      const area = AREA_LABELS[r.restaurantTable?.area] || r.restaurantTable?.area || '';
      const matchesSearch =
        !search ||
        [guestName, r.guest?.email, tableNumber, area, r.status, r.reservationDate, r.timeSlot]
          .some((value) => String(value || '').toLowerCase().includes(search));
      const matchesStatus = filter === 'ALL' || r.status === filter;
      return matchesSearch && matchesStatus;
    });
  }, [reservations, searchTerm, filter]);

  const counts = Object.keys(STATUS_CONFIG).reduce((acc, s) => {
    acc[s] = reservations.filter((r) => r.status === s).length;
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner-lg" />
        <p>Loading table reservations...</p>
      </div>
    );
  }

  return (
    <div className="table-reservations-page">
      <div className="section-heading table-reservation-heading">
        <div>
          <span className="eyebrow">Dining desk</span>
          <h1>Table Reservation Management</h1>
          <p>Monitor table bookings, seat guests, complete service, and progress reservation status.</p>
        </div>
        <button className="primary-button" type="button" onClick={() => navigate('/client')}>
          <span className="material-symbols-outlined">add</span>
          New Table Reservation
        </button>
      </div>

      <div className="table-reservation-summary">
        {[
          { label: 'All Reservations', value: reservations.length, icon: 'event_seat', color: '#064e3b', bg: '#ecfdf5' },
          { label: 'Pending Review', value: counts.PENDING || 0, icon: 'notifications_active', color: '#b45309', bg: '#fffbeb' },
          { label: 'Confirmed Tables', value: counts.CONFIRMED || 0, icon: 'check_circle', color: '#047857', bg: '#d1fae5' },
          { label: 'Seated Now', value: counts.SEATED || 0, icon: 'chair', color: '#15803d', bg: '#dcfce7' },
        ].map((item) => (
          <div key={item.label} className="table-reservation-stat">
            <span className="material-symbols-outlined" style={{ background: item.bg, color: item.color }}>
              {item.icon}
            </span>
            <div>
              <strong>{item.value}</strong>
              <small>{item.label}</small>
            </div>
          </div>
        ))}
      </div>

      <div className="panel table-reservation-panel">
        <div className="panel-header toolbar table-reservation-toolbar">
          <input
            className="field"
            placeholder="Search guest, table, area, date, or status"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select className="select" style={{ width: 210 }} value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="ALL">All Statuses</option>
            {Object.entries(STATUS_CONFIG).map(([s, cfg]) => (
              <option key={s} value={s}>{cfg.label}</option>
            ))}
          </select>
        </div>

        <div className="reservation-filter-bar table-reservation-filters">
          <button
            type="button"
            className={`filter-pill ${filter === 'ALL' ? 'filter-pill-active' : ''}`}
            onClick={() => setFilter('ALL')}
          >
            All <span className="filter-count">{reservations.length}</span>
          </button>
          {Object.entries(STATUS_CONFIG).map(([s, cfg]) => (
            <button
              key={s}
              type="button"
              className={`filter-pill ${filter === s ? 'filter-pill-active' : ''}`}
              style={filter === s ? { background: cfg.bg, color: cfg.color } : {}}
              onClick={() => setFilter(s)}
            >
              {cfg.label} <span className="filter-count">{counts[s]}</span>
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state-card">
            <span className="material-symbols-outlined empty-state-icon">event_seat</span>
            <h3>No reservations found</h3>
            <p>No table reservations match the current filter.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table staff-reservation-table">
            <thead>
              <tr>
                <th>Guest Name</th>
                <th>Table</th>
                <th>Date</th>
                <th>Time</th>
                <th>Party</th>
                <th>Area</th>
                <th>Status</th>
                <th>Requests</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.PENDING;
                const guestName = `${r.guest?.firstName || ''} ${r.guest?.lastName || ''}`.trim() || 'Guest';
                return (
                  <tr key={r.id}>
                    <td>
                      <div className="guest-cell">
                        <strong>{guestName}</strong>
                        <small>{r.guest?.email || `Reservation #${r.id}`}</small>
                      </div>
                    </td>
                    <td>{r.restaurantTable?.tableNumber || <span style={{ color: '#9ca3af' }}>Unassigned</span>}</td>
                    <td>{formatDate(r.reservationDate)}</td>
                    <td>{formatTime(r.timeSlot)}</td>
                    <td>{r.partySize} guest{r.partySize !== 1 ? 's' : ''}</td>
                    <td>{AREA_LABELS[r.restaurantTable?.area] || '—'}</td>
                    <td>
                      <span
                        className="status-pill"
                        style={{ background: cfg.bg, color: cfg.color }}
                      >
                        {cfg.label}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: '#6b7280', fontSize: '0.82rem' }}>
                        {r.specialRequests || '—'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        {r.status === 'PENDING' && (
                          <button
                            className="secondary-button"
                            disabled={!!actionLoading}
                            onClick={() => doAction(r.id, 'confirm')}
                          >
                            <span className="material-symbols-outlined">done</span>
                            {actionLoading === r.id + 'confirm' ? 'Saving...' : 'Confirm'}
                          </button>
                        )}
                        {r.status === 'CONFIRMED' && (
                          <>
                            <button
                              className="secondary-button"
                              disabled={!!actionLoading}
                              onClick={() => doAction(r.id, 'seat')}
                            >
                              <span className="material-symbols-outlined">login</span>
                              {actionLoading === r.id + 'seat' ? 'Saving...' : 'Seat'}
                            </button>
                            <button
                              className="secondary-button"
                              disabled={!!actionLoading}
                              onClick={() => doAction(r.id, 'noShow')}
                            >
                              <span className="material-symbols-outlined">event_busy</span>
                              No-show
                            </button>
                          </>
                        )}
                        {r.status === 'SEATED' && (
                          <button
                            className="secondary-button"
                            disabled={!!actionLoading}
                            onClick={() => doAction(r.id, 'complete')}
                          >
                            <span className="material-symbols-outlined">logout</span>
                            {actionLoading === r.id + 'complete' ? 'Saving...' : 'Complete'}
                          </button>
                        )}
                        {(r.status === 'PENDING' || r.status === 'CONFIRMED') && (
                          <button
                            className="danger-button"
                            disabled={!!actionLoading}
                            onClick={() => doAction(r.id, 'cancel')}
                          >
                            <span className="material-symbols-outlined">close</span>
                            Cancel
                          </button>
                        )}
                        <button
                          className="danger-button"
                          disabled={!!actionLoading}
                          onClick={() => doDelete(r.id)}
                          title="Permanently delete this reservation"
                        >
                          <span className="material-symbols-outlined">delete</span>
                          {actionLoading === r.id + 'delete' ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TableReservations;
