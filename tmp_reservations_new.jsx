import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { guestAPI, reservationAPI, roomAPI } from '../services/api';

/**
 * Booking desk — room reservations.
 *
 * Every row shown here is read from the backend (`/reservations`). The layout
 * mirrors the table-reservation desk so both staff screens behave identically:
 * summary tiles, search + status filters, per-row lifecycle actions and a
 * confirmed destructive delete.
 */

const STATUS_CONFIG = {
  PENDING: { label: 'Pending', color: 'var(--amber)', bg: 'var(--surface-soft)' },
  CONFIRMED: { label: 'Confirmed', color: 'var(--text)', bg: 'var(--surface-soft)' },
  CHECKED_IN: { label: 'Checked in', color: 'var(--text)', bg: 'var(--surface-soft)' },
  CHECKED_OUT: { label: 'Checked out', color: 'var(--muted)', bg: 'var(--surface-line)' },
  CANCELLED: { label: 'Cancelled', color: 'var(--rose)', bg: '#fee2e2' },
};

const STATUS_ORDER = ['ALL', 'PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED'];

const today = new Date().toISOString().slice(0, 10);

const initialForm = {
  guestId: '',
  roomId: '',
  checkInDate: today,
  checkOutDate: '',
  numberOfGuests: '1',
  specialRequests: '',
};

const nightsBetween = (start, end) => {
  if (!start || !end) return 0;
  return Math.max(0, Math.round((new Date(end) - new Date(start)) / 86400000));
};

const formatDate = (value) =>
  value
    ? new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '-';

const Reservations = ({ guestFacing = false }) => {
  const [reservations, setReservations] = useState([]);
  const [guests, setGuests] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [notice, setNotice] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [showModal, setShowModal] = useState(guestFacing);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);

  const flash = useCallback((type, message) => {
    setNotice({ type, message });
    window.setTimeout(() => setNotice(null), 4500);
  }, []);

  /** Reads reservations, guests and rooms from the backend (no local copies). */
  const fetchData = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [reservationResponse, guestResponse, roomResponse] = await Promise.all([
        reservationAPI.getAll(),
        guestAPI.getAll(),
        roomAPI.getAll(),
      ]);
      setReservations(Array.isArray(reservationResponse.data) ? reservationResponse.data : []);
      setGuests(Array.isArray(guestResponse.data) ? guestResponse.data : []);
      const roomList = Array.isArray(roomResponse.data) ? roomResponse.data : [];
      setRooms(roomList);
      setAvailableRooms(roomList.filter((room) => room.status === 'AVAILABLE'));
    } catch (err) {
      setReservations([]);
      setLoadError(
        err?.response?.data?.message ||
          'We could not load reservations from the server. Please retry.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const canSearch = formData.checkInDate && formData.checkOutDate && formData.numberOfGuests;
    if (!canSearch || nightsBetween(formData.checkInDate, formData.checkOutDate) < 1) return;
    roomAPI
      .getAvailable(formData.checkInDate, formData.checkOutDate, formData.numberOfGuests)
      .then((response) => setAvailableRooms(response.data || []))
      .catch(() => setAvailableRooms(rooms.filter((room) => room.status === 'AVAILABLE')));
  }, [formData.checkInDate, formData.checkOutDate, formData.numberOfGuests, rooms]);

  const filteredReservations = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return reservations.filter((res) => {
      const guestName = `${res.guest?.firstName || ''} ${res.guest?.lastName || ''}`;
      const matchesSearch =
        !search ||
        [guestName, res.guest?.email, res.room?.roomNumber, res.room?.roomType, res.status].some(
          (value) => String(value || '').toLowerCase().includes(search)
        );
      const matchesStatus = filterStatus === 'ALL' || res.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [reservations, searchTerm, filterStatus]);

  const counts = useMemo(
    () =>
      STATUS_ORDER.reduce((acc, status) => {
        acc[status] =
          status === 'ALL'
            ? reservations.length
            : reservations.filter((r) => r.status === status).length;
        return acc;
      }, {}),
    [reservations]
  );

  const selectedRoom =
    rooms.find((room) => String(room.id) === String(formData.roomId)) ||
    availableRooms.find((room) => String(room.id) === String(formData.roomId));
  const nights = nightsBetween(formData.checkInDate, formData.checkOutDate);
  const quotedTotal = nights * Number(selectedRoom?.basePrice || 0);

  const handleCreateReservation = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await reservationAPI.create({
        guestId: Number(formData.guestId),
        roomId: Number(formData.roomId),
        checkInDate: formData.checkInDate,
        checkOutDate: formData.checkOutDate,
        numberOfGuests: Number(formData.numberOfGuests),
        specialRequests: formData.specialRequests,
      });
      setShowModal(false);
      setFormData(initialForm);
      setStep(1);
      await fetchData();
      flash('success', 'Reservation created and queued for confirmation.');
    } catch (err) {
      flash(
        'error',
        err?.response?.data?.message ||
          'The reservation could not be created. Please check the dates and room availability.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (reservation, action) => {
    setActionLoading(`${reservation.id}${action}`);
    try {
      await reservationAPI[action](reservation.id);
      await fetchData();
      flash('success', `Reservation #${reservation.id} updated.`);
    } catch (err) {
      flash(
        'error',
        err?.response?.data?.message || `Reservation #${reservation.id} could not be updated.`
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (reservation) => {
    if (
      !window.confirm(`Permanently delete reservation #${reservation.id}? This cannot be undone.`)
    ) {
      return;
    }
    setActionLoading(`${reservation.id}delete`);
    try {
      await reservationAPI.delete(reservation.id);
      setReservations((prev) => prev.filter((r) => String(r.id) !== String(reservation.id)));
      await fetchData();
      flash('success', `Reservation #${reservation.id} deleted.`);
    } catch (err) {
      flash(
        'error',
        err?.response?.data?.message || `Reservation #${reservation.id} could not be deleted.`
      );
    } finally {
      setActionLoading(null);
    }
  };

  if (guestFacing) {
    return (
      <section className="page-section">
        <div className="hero-panel">
          <h1>Book Your Stay</h1>
          <p>Search live room availability and submit a reservation request.</p>
        </div>
        {showModal && (
          <ReservationModal
            {...{
              formData,
              setFormData,
              guests,
              availableRooms,
              step,
              setStep,
              selectedRoom,
              nights,
              quotedTotal,
              onSubmit: handleCreateReservation,
              onClose: () => setShowModal(false),
              guestFacing,
              submitting,
            }}
          />
        )}
      </section>
    );
  }

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner-lg" />
        <p>Loading reservations...</p>
      </div>
    );
  }

  return (
    <div className="table-reservations-page">
      <div className="section-heading table-reservation-heading">
        <div>
          <span className="eyebrow">Booking desk</span>
          <h1>Reservation Management</h1>
          <p>Monitor arrivals and departures, confirm requests and progress reservation status.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="secondary-button" type="button" onClick={fetchData}>
            <span className="material-symbols-outlined">refresh</span>
            Refresh
          </button>
          <button className="primary-button" type="button" onClick={() => setShowModal(true)}>
            <span className="material-symbols-outlined">add</span>
            New Reservation
          </button>
        </div>
      </div>

      {notice && (
        <div
          className={`auth-alert ${
            notice.type === 'success' ? 'auth-alert-success' : 'auth-alert-error'
          }`}
          style={{ marginBottom: '16px' }}
          role="status"
        >
          <span className="material-symbols-outlined">
            {notice.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span>{notice.message}</span>
        </div>
      )}

      {loadError && (
        <div className="api-error-panel" role="alert">
          <span className="material-symbols-outlined">error</span>
          <div>
            <strong>We couldn&apos;t load reservations.</strong>
            <p>{loadError}</p>
          </div>
          <button className="outline-button" type="button" onClick={fetchData}>
            Try Again
          </button>
        </div>
      )}

      <div className="table-reservation-summary">
        {[
          { label: 'All Reservations', value: counts.ALL, icon: 'event_available' },
          { label: 'Pending Review', value: counts.PENDING, icon: 'notifications_active' },
          { label: 'Confirmed Stays', value: counts.CONFIRMED, icon: 'check_circle' },
          { label: 'In-House Guests', value: counts.CHECKED_IN, icon: 'hotel' },
        ].map((item) => (
          <div key={item.label} className="table-reservation-stat">
            <span
              className="material-symbols-outlined"
              style={{ background: 'var(--surface-soft)', color: 'var(--text)' }}
            >
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
            placeholder="Search guest, room, status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search reservations"
          />
          <select
            className="select"
            style={{ width: 210 }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            aria-label="Filter by status"
          >
            {STATUS_ORDER.map((status) => (
              <option key={status} value={status}>
                {status === 'ALL' ? 'All Statuses' : STATUS_CONFIG[status].label}
              </option>
            ))}
          </select>
        </div>

        <div className="reservation-filter-bar table-reservation-filters">
          {STATUS_ORDER.map((status) => (
            <button
              key={status}
              type="button"
              className={`filter-pill ${filterStatus === status ? 'filter-pill-active' : ''}`}
              style={
                filterStatus === status && status !== 'ALL'
                  ? { background: STATUS_CONFIG[status].bg, color: STATUS_CONFIG[status].color }
                  : {}
              }
              onClick={() => setFilterStatus(status)}
            >
              {status === 'ALL' ? 'All' : STATUS_CONFIG[status].label}{' '}
              <span className="filter-count">{counts[status]}</span>
            </button>
          ))}
        </div>

        {filteredReservations.length === 0 ? (
          <div className="empty-state-card">
            <span className="material-symbols-outlined empty-state-icon">event_available</span>
            <h3>No reservations found</h3>
            <p>
              {reservations.length === 0
                ? 'No reservation has been created yet.'
                : 'No reservation matches the current search or status filter.'}
            </p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table staff-reservation-table">
              <thead>
                <tr>
                  <th>Guest Name</th>
                  <th>Room</th>
                  <th>Check-in</th>
                  <th>Check-out</th>
                  <th>Nights</th>
                  <th>Guests</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReservations.map((res) => {
                  const cfg = STATUS_CONFIG[res.status] || STATUS_CONFIG.PENDING;
                  const guestName =
                    `${res.guest?.firstName || ''} ${res.guest?.lastName || ''}`.trim() || 'Guest';
                  const stayNights = nightsBetween(res.checkInDate, res.checkOutDate);
                  return (
                    <tr key={res.id}>
                      <td>
                        <div className="guest-cell">
                          <strong>{guestName}</strong>
                          <small>{res.guest?.email || `Reservation #${res.id}`}</small>
                        </div>
                      </td>
                      <td>
                        {res.room ? (
                          <>
                            <strong>Room {res.room.roomNumber}</strong>
                            <small
                              style={{ display: 'block', fontSize: '11px', color: 'var(--muted)' }}
                            >
                              {String(res.room.roomType || '').replace(/_/g, ' ')}
                            </small>
                          </>
                        ) : (
                          <span style={{ color: 'var(--muted)' }}>Unassigned</span>
                        )}
                      </td>
                      <td>{formatDate(res.checkInDate)}</td>
                      <td>{formatDate(res.checkOutDate)}</td>
                      <td>{stayNights}</td>
                      <td>
                        {res.numberOfGuests} guest{res.numberOfGuests === 1 ? '' : 's'}
                      </td>
                      <td>${Number(res.totalPrice || 0).toFixed(2)}</td>
                      <td>
                        <span
                          className="status-pill"
                          style={{ background: cfg.bg, color: cfg.color }}
                        >
                          {cfg.label}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">

                          {res.status === 'PENDING' && (
                            <button
                              className="secondary-button"
                              type="button"
                              disabled={!!actionLoading}
                              onClick={() => updateStatus(res, 'confirm')}
                            >
                              <span className="material-symbols-outlined">done</span>
                              {actionLoading === `${res.id}confirm` ? 'Saving...' : 'Confirm'}
                            </button>
                          )}
                          {res.status === 'CONFIRMED' && (
                            <button
                              className="secondary-button"
                              type="button"
                              disabled={!!actionLoading}
                              onClick={() => updateStatus(res, 'checkIn')}
                            >
                              <span className="material-symbols-outlined">login</span>
                              {actionLoading === `${res.id}checkIn` ? 'Saving...' : 'Check In'}
                            </button>
                          )}
                          {res.status === 'CHECKED_IN' && (
                            <button
                              className="secondary-button"
                              type="button"
                              disabled={!!actionLoading}
                              onClick={() => updateStatus(res, 'checkOut')}
                            >
                              <span className="material-symbols-outlined">logout</span>
                              {actionLoading === `${res.id}checkOut` ? 'Saving...' : 'Check Out'}
                            </button>
                          )}
                          {(res.status === 'PENDING' || res.status === 'CONFIRMED') && (
                            <button
                              className="danger-button"
                              type="button"
                              disabled={!!actionLoading}
                              onClick={() => updateStatus(res, 'cancel')}
                            >
                              <span className="material-symbols-outlined">close</span>
                              Cancel
                            </button>
                          )}
                          <button
                            className="danger-button"
                            type="button"
                            disabled={!!actionLoading}
                            onClick={() => handleDelete(res)}
                            title="Permanently delete this reservation"
                          >
                            <span className="material-symbols-outlined">delete</span>
                            {actionLoading === `${res.id}delete` ? 'Deleting...' : 'Delete'}
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

      {showModal && (
        <ReservationModal
          {...{
            formData,
            setFormData,
            guests,
            availableRooms,
            step,
            setStep,
            selectedRoom,
            nights,
            quotedTotal,
            onSubmit: handleCreateReservation,
            onClose: () => setShowModal(false),
            submitting,
          }}
        />
      )}
    </div>
  );
};


const ReservationModal = ({
  formData,
  setFormData,
  guests,
  availableRooms,
  step,
  setStep,
  selectedRoom,
  nights,
  quotedTotal,
  onSubmit,
  onClose,
  guestFacing,
  submitting = false,
}) => (
  <div className="modal-backdrop">
    <form className="modal-card" onSubmit={onSubmit}>
      <div className="section-heading">
        <div>
          <span className="eyebrow">Guided booking</span>
          <h2>{guestFacing ? 'Room Search & Booking' : 'New Reservation'}</h2>
        </div>
        <button className="icon-button" type="button" onClick={onClose} aria-label="Close">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
      <div className="flow-steps">
        {['Guest', 'Room', 'Dates', 'Confirm'].map((label, index) => (
          <button
            type="button"
            key={label}
            className={`flow-step${step === index + 1 ? ' active' : ''}`}
            onClick={() => setStep(index + 1)}
          >
            {index + 1}. {label}
          </button>
        ))}
      </div>

      {step === 1 && (
        <div className="form-grid">
          <label className="form-field" style={{ gridColumn: '1 / -1' }}>
            Guest
            <select
              className="select"
              required
              value={formData.guestId}
              onChange={(e) => setFormData({ ...formData, guestId: e.target.value })}
            >
              <option value="">Select guest</option>
              {guests.map((guest) => (
                <option key={guest.id} value={guest.id}>
                  {guest.firstName} {guest.lastName} - {guest.email}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {step === 2 && (
        <div className="booking-grid">
          {availableRooms.map((room) => (
            <button
              type="button"
              key={room.id}
              className="booking-card"
              style={{
                padding: 16,
                textAlign: 'left',
                borderColor:
                  String(room.id) === String(formData.roomId)
                    ? 'var(--accent)'
                    : 'var(--surface-line)',
              }}
              onClick={() => setFormData({ ...formData, roomId: room.id })}
            >
              <h3>Room {room.roomNumber}</h3>
              <p>
                {room.roomType} - {room.capacity} guests
              </p>
              <strong>${Number(room.basePrice || 0).toFixed(2)} / night</strong>
            </button>
          ))}
          {!availableRooms.length && <p>No available rooms for the selected date and guest count.</p>}
        </div>
      )}

      {step === 3 && (
        <div className="form-grid">
          <label className="form-field">
            Check-in
            <input
              className="field"
              type="date"
              required
              value={formData.checkInDate}
              onChange={(e) => setFormData({ ...formData, checkInDate: e.target.value })}
            />
          </label>
          <label className="form-field">
            Check-out
            <input
              className="field"
              type="date"
              required
              value={formData.checkOutDate}
              onChange={(e) => setFormData({ ...formData, checkOutDate: e.target.value })}
            />
          </label>
          <label className="form-field">
            Guests
            <input
              className="field"
              type="number"
              min="1"
              max="20"
              required
              value={formData.numberOfGuests}
              onChange={(e) => setFormData({ ...formData, numberOfGuests: e.target.value })}
            />
          </label>
          <div className="rate-card">
            <span className="eyebrow">Stay length</span>
            <p>
              {formData.checkInDate || 'Start'} to {formData.checkOutDate || 'End'} - {nights}{' '}
              night{nights === 1 ? '' : 's'}
            </p>
          </div>
          <label className="form-field" style={{ gridColumn: '1 / -1' }}>
            Special Requests
            <textarea
              className="textarea"
              rows="3"
              value={formData.specialRequests}
              onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
            />
          </label>
        </div>
      )}

      {step === 4 && (
        <div className="panel-body rate-card">
          <span className="eyebrow">Pricing confirmation</span>
          <h2>${quotedTotal.toFixed(2)}</h2>
          <p>
            {selectedRoom
              ? `Room ${selectedRoom.roomNumber}, ${selectedRoom.roomType}, ${nights} night${
                  nights === 1 ? '' : 's'
                } at $${Number(selectedRoom.basePrice || 0).toFixed(2)}.`
              : 'Select a room to confirm pricing.'}
          </p>
        </div>
      )}

      <div className="modal-actions" style={{ marginTop: 24 }}>
        <button
          className="secondary-button"
          type="button"
          onClick={() => setStep(Math.max(1, step - 1))}
          disabled={submitting}
        >
          Back
        </button>
        {step < 4 ? (
          <button
            className="primary-button"
            type="button"
            onClick={() => setStep(Math.min(4, step + 1))}
            disabled={submitting}
          >
            Continue
          </button>
        ) : (
          <button
            className="primary-button"
            type="submit"
            disabled={!formData.guestId || !formData.roomId || nights < 1 || submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Reservation'}
          </button>
        )}
      </div>
    </form>
  </div>
);

export default Reservations;

