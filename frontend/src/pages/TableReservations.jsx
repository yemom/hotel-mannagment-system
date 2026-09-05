import React, { useEffect, useState } from 'react';
import { tableReservationAPI } from '../services/api';

const STATUS_CONFIG = {
  PENDING:   { label: 'Pending',   color: '#b45309', bg: '#fef3c7' },
  CONFIRMED: { label: 'Confirmed', color: '#1d4ed8', bg: '#dbeafe' },
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

const TableReservations = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [filter, setFilter] = useState('ALL');

  const load = async () => {
    setLoading(true);
    try {
      const res = await tableReservationAPI.getAll();
      setReservations(res.data || []);
    } catch (err) {
      console.error('Failed to load table reservations:', err);
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
    try {
      await tableReservationAPI[action](id);
      await load();
    } catch (err) {
      console.error(`Action ${action} failed:`, err);
    } finally {
      setActionLoading(null);
    }
  };

  const doDelete = async (id) => {
    if (!window.confirm('Permanently delete this reservation? This cannot be undone.')) return;
    setActionLoading(id + 'delete');
    try {
      await tableReservationAPI.delete(id);
      setReservations((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error('Delete failed:', err);
      await load();
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = filter === 'ALL'
    ? reservations
    : reservations.filter((r) => r.status === filter);

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
      {/* Quick filter pills */}
      <div className="reservation-filter-bar">
        <button
          className={`filter-pill ${filter === 'ALL' ? 'filter-pill-active' : ''}`}
          onClick={() => setFilter('ALL')}
        >
          All <span className="filter-count">{reservations.length}</span>
        </button>
        {Object.entries(STATUS_CONFIG).map(([s, cfg]) => (
          <button
            key={s}
            className={`filter-pill ${filter === s ? 'filter-pill-active' : ''}`}
            style={filter === s ? { background: cfg.bg, color: cfg.color } : {}}
            onClick={() => setFilter(s)}
          >
            {cfg.label} <span className="filter-count">{counts[s]}</span>
          </button>
        ))}
      </div>

      {/* Reservations table */}
      {filtered.length === 0 ? (
        <div className="empty-state-card">
          <span className="material-symbols-outlined empty-state-icon">event_seat</span>
          <h3>No reservations found</h3>
          <p>No table reservations match the current filter.</p>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Guest</th>
                <th>Date</th>
                <th>Time</th>
                <th>Party</th>
                <th>Table</th>
                <th>Area</th>
                <th>Status</th>
                <th>Requests</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.PENDING;
                return (
                  <tr key={r.id}>
                    <td>#{r.id}</td>
                    <td>
                      <div className="guest-cell">
                        <strong>{r.guest?.firstName} {r.guest?.lastName}</strong>
                        <small>{r.guest?.email}</small>
                      </div>
                    </td>
                    <td>{formatDate(r.reservationDate)}</td>
                    <td>{formatTime(r.timeSlot)}</td>
                    <td>{r.partySize} guest{r.partySize !== 1 ? 's' : ''}</td>
                    <td>{r.restaurantTable?.tableNumber || <span style={{ color: '#9ca3af' }}>Unassigned</span>}</td>
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
                            className="action-btn action-btn-confirm"
                            disabled={!!actionLoading}
                            onClick={() => doAction(r.id, 'confirm')}
                          >
                            {actionLoading === r.id + 'confirm' ? '...' : 'Confirm'}
                          </button>
                        )}
                        {r.status === 'CONFIRMED' && (
                          <>
                            <button
                              className="action-btn action-btn-primary"
                              disabled={!!actionLoading}
                              onClick={() => doAction(r.id, 'seat')}
                            >
                              {actionLoading === r.id + 'seat' ? '...' : 'Seat Now'}
                            </button>
                            <button
                              className="action-btn action-btn-warning"
                              disabled={!!actionLoading}
                              onClick={() => doAction(r.id, 'noShow')}
                            >
                              No-show
                            </button>
                          </>
                        )}
                        {r.status === 'SEATED' && (
                          <button
                            className="action-btn action-btn-success"
                            disabled={!!actionLoading}
                            onClick={() => doAction(r.id, 'complete')}
                          >
                            {actionLoading === r.id + 'complete' ? '...' : 'Complete'}
                          </button>
                        )}
                        {(r.status === 'PENDING' || r.status === 'CONFIRMED') && (
                          <button
                            className="action-btn action-btn-danger"
                            disabled={!!actionLoading}
                            onClick={() => doAction(r.id, 'cancel')}
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          className="action-btn"
                          disabled={!!actionLoading}
                          onClick={() => doDelete(r.id)}
                          style={{
                            background: '#fef2f2',
                            color: '#b91c1c',
                            border: '1px solid #fecaca',
                          }}
                          title="Permanently delete this reservation"
                        >
                          {actionLoading === r.id + 'delete' ? '...' : '🗑 Delete'}
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
  );
};

export default TableReservations;
