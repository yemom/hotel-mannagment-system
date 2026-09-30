import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { spaBookingAPI, spaServiceAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

/**
 * Wellness desk — spa appointments and the treatment catalogue.
 *
 * The appointments view mirrors the table-reservation desk: summary tiles,
 * search + status filters, per-row lifecycle actions (confirm, complete,
 * cancel, delete) and toast feedback. Everything is read from the backend;
 * nothing is stored locally.
 */

const STATUS_CONFIG = {
  PENDING: { label: 'Pending', color: 'var(--amber)', bg: 'var(--surface-soft)' },
  CONFIRMED: { label: 'Confirmed', color: 'var(--text)', bg: 'var(--surface-soft)' },
  COMPLETED: { label: 'Completed', color: 'var(--muted)', bg: 'var(--surface-line)' },
  CANCELLED: { label: 'Cancelled', color: 'var(--rose)', bg: '#fee2e2' },
};

const STATUS_ORDER = ['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];

const formatDate = (value) =>
  value
    ? new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '-';

const formatCategory = (category) => String(category || '').replace(/_/g, ' ');

const SpaManagement = () => {
  const { currentUser, role } = useAuth();
  const isSuperAdmin = currentUser?.isSuperAdmin || role === 'SUPER_ADMIN';

  const [activeTab, setActiveTab] = useState('appointments');
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [notice, setNotice] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [savingService, setSavingService] = useState(false);
  const [newService, setNewService] = useState({
    name: '',
    category: 'MASSAGE',
    description: '',
    durationMinutes: 60,
    price: 100,
    capacity: 2,
    imageUrl:
      'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80',
    active: true,
  });

  const flash = useCallback((type, message) => {
    setNotice({ type, message });
    window.setTimeout(() => setNotice(null), 4000);
  }, []);

  /** Loads every appointment and every catalogue entry from the backend. */
  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [appointmentsResponse, servicesResponse] = await Promise.all([
        spaBookingAPI.getAll(),
        spaServiceAPI.getAll(),
      ]);
      setAppointments(
        Array.isArray(appointmentsResponse.data) ? appointmentsResponse.data : []
      );
      setServices(Array.isArray(servicesResponse.data) ? servicesResponse.data : []);
    } catch (err) {
      setAppointments([]);
      setServices([]);
      setLoadError(
        err?.response?.data?.message ||
          'We could not load spa appointments from the server. Please retry.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredAppointments = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return appointments.filter((appointment) => {
      const guestName = `${appointment.guest?.firstName || ''} ${
        appointment.guest?.lastName || ''
      }`.trim();
      const matchesSearch =
        !search ||
        [
          guestName,
          appointment.guest?.email,
          appointment.spaService?.name,
          appointment.status,
          appointment.bookingDate,
          appointment.startTime,
        ].some((value) => String(value || '').toLowerCase().includes(search));
      const matchesStatus = statusFilter === 'ALL' || appointment.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [appointments, searchTerm, statusFilter]);

  const counts = useMemo(
    () =>
      STATUS_ORDER.reduce((acc, status) => {
        acc[status] =
          status === 'ALL'
            ? appointments.length
            : appointments.filter((a) => a.status === status).length;
        return acc;
      }, {}),
    [appointments]
  );

  const changeStatus = async (appointment, action, label) => {
    setActionLoading(`${appointment.id}${action}`);
    try {
      await spaBookingAPI[action](appointment.id);
      await loadData();
      flash('success', `Appointment #${appointment.id} ${label}.`);
    } catch (err) {
      flash(
        'error',
        err?.response?.data?.message || `Appointment #${appointment.id} could not be updated.`
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (appointment) => {
    if (
      !window.confirm(
        `Permanently delete appointment #${appointment.id}? This cannot be undone.`
      )
    ) {
      return;
    }
    setActionLoading(`${appointment.id}delete`);
    try {
      await spaBookingAPI.delete(appointment.id);
      setAppointments((prev) => prev.filter((a) => String(a.id) !== String(appointment.id)));
      await loadData();
      flash('success', `Appointment #${appointment.id} deleted.`);
    } catch (err) {
      flash(
        'error',
        err?.response?.data?.message || `Appointment #${appointment.id} could not be deleted.`
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleActiveService = async (service) => {
    setActionLoading(`service${service.id}`);
    try {
      if (service.active) {
        await spaServiceAPI.deactivate(service.id);
      } else {
        await spaServiceAPI.activate(service.id);
      }
      await loadData();
      flash('success', `${service.name} is now ${service.active ? 'inactive' : 'active'}.`);
    } catch (err) {
      flash('error', err?.response?.data?.message || `Could not update ${service.name}.`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateService = async (event) => {
    event.preventDefault();
    setSavingService(true);
    try {
      await spaServiceAPI.create(newService);
      setShowAddModal(false);
      setNewService((current) => ({ ...current, name: '', description: '' }));
      await loadData();
      flash('success', 'New spa ritual added to the catalogue.');
    } catch (err) {
      flash('error', err?.response?.data?.message || 'The spa ritual could not be saved.');
    } finally {
      setSavingService(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner-lg" />
        <p>Loading spa operations...</p>
      </div>
    );
  }

  return (
    <div className="table-reservations-page">
      <div className="section-heading table-reservation-heading">
        <div>
          <span className="eyebrow">Wellness operations</span>
          <h1>Spa Sanctuary Management</h1>
          <p>Review appointments, confirm treatments and maintain the ritual catalogue.</p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="pill-toggle">
            <button
              type="button"
              className={activeTab === 'appointments' ? 'active' : ''}
              onClick={() => setActiveTab('appointments')}
            >
              Appointments ({appointments.length})
            </button>
            <button
              type="button"
              className={activeTab === 'services' ? 'active' : ''}
              onClick={() => setActiveTab('services')}
            >
              Service Catalog ({services.length})
            </button>
          </div>
          <button className="secondary-button" type="button" onClick={loadData}>
            <span className="material-symbols-outlined">refresh</span>
            Refresh
          </button>
          {activeTab === 'services' && isSuperAdmin && (
            <button
              className="primary-button"
              type="button"
              onClick={() => setShowAddModal(true)}
            >
              <span className="material-symbols-outlined">add</span>
              Add Ritual
            </button>
          )}
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
            <strong>We couldn&apos;t load spa operations.</strong>
            <p>{loadError}</p>
          </div>
          <button className="outline-button" type="button" onClick={loadData}>
            Try Again
          </button>
        </div>
      )}

      {activeTab === 'appointments' && (
        <>
          <div className="table-reservation-summary">
            {[
              { label: 'All Appointments', value: counts.ALL, icon: 'event_available' },
              {
                label: 'Awaiting Confirmation',
                value: counts.PENDING,
                icon: 'notifications_active',
              },
              { label: 'Confirmed Treatments', value: counts.CONFIRMED, icon: 'check_circle' },
              { label: 'Completed', value: counts.COMPLETED, icon: 'spa' },
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
                placeholder="Search guest, ritual, date, or status"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search spa appointments"
              />
              <select
                className="select"
                style={{ width: 210 }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter appointments by status"
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
                  className={`filter-pill ${statusFilter === status ? 'filter-pill-active' : ''}`}
                  style={
                    statusFilter === status && status !== 'ALL'
                      ? { background: STATUS_CONFIG[status].bg, color: STATUS_CONFIG[status].color }
                      : {}
                  }
                  onClick={() => setStatusFilter(status)}
                >
                  {status === 'ALL' ? 'All' : STATUS_CONFIG[status].label}{' '}
                  <span className="filter-count">{counts[status]}</span>
                </button>
              ))}
            </div>

            {filteredAppointments.length === 0 ? (
              <div className="empty-state-card">
                <span className="material-symbols-outlined empty-state-icon">spa</span>
                <h3>No appointments found</h3>
                <p>
                  {appointments.length === 0
                    ? 'No spa appointment has been booked yet.'
                    : 'No appointment matches the current search or status filter.'}
                </p>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="table staff-reservation-table">
                  <thead>
                    <tr>
                      <th>Ref #</th>
                      <th>Guest</th>
                      <th>Ritual</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Guests</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>

                    {filteredAppointments.map((appointment) => {
                      const cfg = STATUS_CONFIG[appointment.status] || STATUS_CONFIG.PENDING;
                      const guestName =
                        `${appointment.guest?.firstName || ''} ${
                          appointment.guest?.lastName || ''
                        }`.trim() || 'Guest';
                      return (
                        <tr key={appointment.id}>
                          <td>#{appointment.id}</td>
                          <td>
                            <div className="guest-cell">
                              <strong>{guestName}</strong>
                              <small>
                                {appointment.guest?.email || `Appointment #${appointment.id}`}
                              </small>
                            </div>
                          </td>
                          <td>
                            <div className="guest-cell">
                              <strong>{appointment.spaService?.name || 'Spa ritual'}</strong>
                              <small>
                                {appointment.spaService
                                  ? `$${Number(appointment.spaService.price || 0).toFixed(2)} - ${
                                      appointment.spaService.durationMinutes
                                    } mins - ${formatCategory(
                                      appointment.spaService.category
                                    )}`
                                  : '-'}
                              </small>
                            </div>
                          </td>
                          <td>{formatDate(appointment.bookingDate)}</td>
                          <td>{appointment.startTime || '-'}</td>
                          <td>
                            {appointment.numberOfGuests} guest
                            {appointment.numberOfGuests === 1 ? '' : 's'}
                          </td>
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
                              {appointment.status === 'PENDING' && (
                                <button
                                  className="secondary-button"
                                  type="button"
                                  disabled={!!actionLoading}
                                  onClick={() => changeStatus(appointment, 'confirm', 'confirmed')}
                                >
                                  <span className="material-symbols-outlined">done</span>
                                  {actionLoading === `${appointment.id}confirm`
                                    ? 'Saving...'
                                    : 'Confirm'}
                                </button>
                              )}
                              {appointment.status === 'CONFIRMED' && (
                                <button
                                  className="secondary-button"
                                  type="button"
                                  disabled={!!actionLoading}
                                  onClick={() =>
                                    changeStatus(appointment, 'complete', 'completed')
                                  }
                                >
                                  <span className="material-symbols-outlined">task_alt</span>
                                  {actionLoading === `${appointment.id}complete`
                                    ? 'Saving...'
                                    : 'Complete'}
                                </button>
                              )}
                              {(appointment.status === 'PENDING' ||
                                appointment.status === 'CONFIRMED') && (
                                <button
                                  className="danger-button"
                                  type="button"
                                  disabled={!!actionLoading}
                                  onClick={() => changeStatus(appointment, 'cancel', 'cancelled')}
                                >
                                  <span className="material-symbols-outlined">close</span>
                                  Cancel
                                </button>
                              )}
                              <button
                                className="danger-button"
                                type="button"
                                disabled={!!actionLoading}
                                onClick={() => handleDelete(appointment)}
                                title="Permanently delete this appointment"
                              >
                                <span className="material-symbols-outlined">delete</span>
                                {actionLoading === `${appointment.id}delete`
                                  ? 'Deleting...'
                                  : 'Delete'}
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
        </>
      )}


      {activeTab === 'services' && (
        <div className="panel table-reservation-panel">
          <div className="panel-header toolbar table-reservation-toolbar">
            <input
              className="field"
              placeholder="Search ritual by name or category"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search spa rituals"
            />
            <span className="catalog-result-count">{services.length} rituals in catalogue</span>
          </div>

          {services.length === 0 ? (
            <div className="empty-state-card">
              <span className="material-symbols-outlined empty-state-icon">spa</span>
              <h3>No rituals in the catalogue</h3>
              <p>Add a treatment to make it bookable by guests.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="table staff-reservation-table">
                <thead>
                  <tr>
                    <th>Ritual</th>
                    <th>Category</th>
                    <th>Duration</th>
                    <th>Capacity</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {services
                    .filter((service) => {
                      const search = searchTerm.trim().toLowerCase();
                      if (!search) return true;
                      return [service.name, service.category, service.description].some((value) =>
                        String(value || '').toLowerCase().includes(search)
                      );
                    })
                    .map((service) => (
                      <tr key={service.id}>
                        <td>
                          <div className="guest-cell">
                            <strong>{service.name}</strong>
                            <small>{service.description || `Ritual #${service.id}`}</small>
                          </div>
                        </td>
                        <td>{formatCategory(service.category)}</td>
                        <td>{service.durationMinutes} mins</td>
                        <td>{service.capacity} guests</td>
                        <td>${Number(service.price || 0).toFixed(2)}</td>
                        <td>
                          <span
                            className="status-pill"
                            style={
                              service.active
                                ? { background: 'var(--surface-soft)', color: 'var(--text)' }
                                : { background: 'var(--surface-soft)', color: 'var(--amber)' }
                            }
                          >
                            {service.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="secondary-button"
                              type="button"
                              disabled={!!actionLoading}
                              onClick={() => handleToggleActiveService(service)}
                            >
                              <span className="material-symbols-outlined">
                                {service.active ? 'toggle_off' : 'toggle_on'}
                              </span>
                              {actionLoading === `service${service.id}`
                                ? 'Saving...'
                                : service.active
                                ? 'Deactivate'
                                : 'Activate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}


      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '560px' }}>
            <div className="section-heading">
              <div>
                <span className="eyebrow">CATALOGUE</span>
                <h2>Add Spa Ritual</h2>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setShowAddModal(false)}
                aria-label="Close"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateService} style={{ marginTop: '18px' }}>
              <div className="form-group">
                <label htmlFor="svc-name">Ritual Name</label>
                <input
                  id="svc-name"
                  type="text"
                  required
                  className="field"
                  placeholder="e.g. Himalayan Salt Stone Therapy"
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                />
              </div>

              <div className="form-grid-2" style={{ marginTop: '12px' }}>
                <div className="form-group">
                  <label htmlFor="svc-cat">Category</label>
                  <select
                    id="svc-cat"
                    className="field"
                    value={newService.category}
                    onChange={(e) => setNewService({ ...newService, category: e.target.value })}
                  >
                    <option value="MASSAGE">Massage</option>
                    <option value="FACIAL">Facial</option>
                    <option value="WELLNESS">Wellness</option>
                    <option value="COUPLES">Couples</option>
                    <option value="BODY_TREATMENT">Body Treatment</option>
                    <option value="BEAUTY">Beauty</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="svc-price">Price ($)</label>
                  <input
                    id="svc-price"
                    type="number"
                    required
                    min="10"
                    className="field"
                    value={newService.price}
                    onChange={(e) =>
                      setNewService({ ...newService, price: Number(e.target.value) })
                    }
                  />
                </div>
              </div>

              <div className="form-grid-2" style={{ marginTop: '12px' }}>
                <div className="form-group">
                  <label htmlFor="svc-duration">Duration (Minutes)</label>
                  <input
                    id="svc-duration"
                    type="number"
                    required
                    min="15"
                    step="5"
                    className="field"
                    value={newService.durationMinutes}
                    onChange={(e) =>
                      setNewService({ ...newService, durationMinutes: Number(e.target.value) })
                    }
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="svc-capacity">Capacity (Guests)</label>
                  <input
                    id="svc-capacity"
                    type="number"
                    required
                    min="1"
                    max="4"
                    className="field"
                    value={newService.capacity}
                    onChange={(e) =>
                      setNewService({ ...newService, capacity: Number(e.target.value) })
                    }
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '12px' }}>
                <label htmlFor="svc-desc">Description</label>
                <textarea
                  id="svc-desc"
                  rows="3"
                  required
                  className="field"
                  placeholder="Detailed description of the botanical ritual..."
                  value={newService.description}
                  onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                />
              </div>

              <div className="modal-actions" style={{ marginTop: '20px' }}>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowAddModal(false)}
                  disabled={savingService}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button" disabled={savingService}>
                  {savingService ? 'Saving...' : 'Save Ritual'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpaManagement;

