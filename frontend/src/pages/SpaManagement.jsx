import React, { useState, useEffect } from 'react';
import { spaBookingAPI, spaServiceAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const SpaManagement = () => {
  const { currentUser, role } = useAuth();
  const isSuperAdmin = currentUser?.isSuperAdmin || role === 'SUPER_ADMIN';

  const [activeTab, setActiveTab] = useState('appointments'); // 'appointments' | 'services'
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [notice, setNotice] = useState(null);

  // New Service Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newService, setNewService] = useState({
    name: '',
    category: 'MASSAGE',
    description: '',
    durationMinutes: 60,
    price: 100,
    capacity: 2,
    imageUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80',
    active: true,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [resApp, resSvc] = await Promise.all([
        spaBookingAPI.getAll().catch(() => ({ data: [] })),
        spaServiceAPI.getAll().catch(() => ({ data: [] })),
      ]);

      let serverBookings = resApp.data && Array.isArray(resApp.data) ? resApp.data : [];
      let serverServices = resSvc.data && Array.isArray(resSvc.data) ? resSvc.data : [];

      // Also gather any local storage bookings
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('client_spa_bookings_')) {
            const parsed = JSON.parse(localStorage.getItem(key) || '[]');
            if (Array.isArray(parsed)) {
              const existingIds = new Set(serverBookings.map((b) => String(b.id)));
              for (const p of parsed) {
                if (!existingIds.has(String(p.id))) {
                  serverBookings.push(p);
                  existingIds.add(String(p.id));
                }
              }
            }
          }
        }
      } catch (_) {}

      setAppointments(serverBookings);
      setServices(serverServices);
    } catch (err) {
      console.warn('Failed to load spa management data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredAppointments = appointments.filter((app) => {
    if (statusFilter === 'ALL') return true;
    return app.status === statusFilter;
  });

  const handleConfirm = async (id) => {
    try {
      await spaBookingAPI.confirm(id).catch(() => {});
      setAppointments((prev) =>
        prev.map((a) => (String(a.id) === String(id) ? { ...a, status: 'CONFIRMED' } : a))
      );
      setNotice('Appointment confirmed.');
      setTimeout(() => setNotice(null), 3000);
    } catch (e) {
      alert('Could not confirm appointment');
    }
  };

  const handleComplete = async (id) => {
    try {
      await spaBookingAPI.complete(id).catch(() => {});
      setAppointments((prev) =>
        prev.map((a) => (String(a.id) === String(id) ? { ...a, status: 'COMPLETED' } : a))
      );
      setNotice('Appointment completed.');
      setTimeout(() => setNotice(null), 3000);
    } catch (e) {
      alert('Could not complete appointment');
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this spa appointment?')) return;
    try {
      await spaBookingAPI.cancel(id).catch(() => {});
      setAppointments((prev) =>
        prev.map((a) => (String(a.id) === String(id) ? { ...a, status: 'CANCELLED' } : a))
      );
      setNotice('Appointment cancelled.');
      setTimeout(() => setNotice(null), 3000);
    } catch (e) {
      alert('Could not cancel appointment');
    }
  };

  const handleToggleActiveService = async (service) => {
    try {
      if (service.active) {
        await spaServiceAPI.deactivate(service.id).catch(() => {});
        setServices((prev) =>
          prev.map((s) => (s.id === service.id ? { ...s, active: false } : s))
        );
      } else {
        await spaServiceAPI.activate(service.id).catch(() => {});
        setServices((prev) =>
          prev.map((s) => (s.id === service.id ? { ...s, active: true } : s))
        );
      }
    } catch (_) {}
  };

  const handleCreateService = async (e) => {
    e.preventDefault();
    try {
      const res = await spaServiceAPI.create(newService);
      const created = res.data || { ...newService, id: Date.now() };
      setServices([created, ...services]);
      setShowAddModal(false);
      setNotice('New spa service added successfully.');
      setTimeout(() => setNotice(null), 3000);
    } catch (err) {
      alert('Failed to create spa service: ' + (err.message || ''));
    }
  };

  return (
    <div className="page-section">
      <div className="section-heading">
        <div>
          <span className="eyebrow">WELLNESS OPERATIONS</span>
          <h1>Spa Sanctuary Management</h1>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
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

          {activeTab === 'services' && isSuperAdmin && (
            <button
              type="button"
              className="primary-button"
              onClick={() => setShowAddModal(true)}
            >
              <span className="material-symbols-outlined">add</span>
              Add Ritual
            </button>
          )}
        </div>
      </div>

      {notice && (
        <div className="auth-alert auth-alert-success" style={{ marginBottom: '16px' }}>
          <span className="material-symbols-outlined">check_circle</span>
          <span>{notice}</span>
        </div>
      )}

      {/* Tab 1: Appointments */}
      {activeTab === 'appointments' && (
        <div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            {['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((st) => (
              <button
                key={st}
                type="button"
                className={`filter-pill ${statusFilter === st ? 'filter-pill-active' : ''}`}
                onClick={() => setStatusFilter(st)}
              >
                {st}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="catalog-loading">
              <span className="spinner" />
              <p>Loading appointments...</p>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="empty-card">
              <span className="material-symbols-outlined">spa</span>
              <h3>No spa appointments in this view</h3>
            </div>
          ) : (
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Ref #</th>
                    <th>Guest</th>
                    <th>Ritual</th>
                    <th>Date &amp; Time</th>
                    <th>Guests</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.map((app) => (
                    <tr key={app.id}>
                      <td>#{app.id}</td>
                      <td>
                        <strong>
                          {app.guest ? `${app.guest.firstName} ${app.guest.lastName}` : 'Guest User'}
                        </strong>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          {app.guest?.email || ''}
                        </div>
                      </td>
                      <td>
                        <strong>{app.spaService?.name || 'Spa Ritual'}</strong>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          ${app.spaService?.price} &bull; {app.spaService?.durationMinutes} mins
                        </div>
                      </td>
                      <td>
                        <div>{app.bookingDate}</div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>
                          {app.startTime}
                        </div>
                      </td>
                      <td>{app.numberOfGuests} Guests</td>
                      <td>
                        <span
                          className={`status-badge status-${
                            app.status === 'CONFIRMED'
                              ? 'green'
                              : app.status === 'COMPLETED'
                              ? 'green'
                              : app.status === 'CANCELLED'
                              ? 'red'
                              : 'amber'
                          }`}
                        >
                          {app.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {app.status === 'PENDING' && (
                            <button
                              type="button"
                              className="action-btn action-btn-green"
                              onClick={() => handleConfirm(app.id)}
                              title="Confirm Appointment"
                            >
                              Confirm
                            </button>
                          )}
                          {app.status === 'CONFIRMED' && (
                            <button
                              type="button"
                              className="action-btn action-btn-blue"
                              onClick={() => handleComplete(app.id)}
                              title="Complete Treatment"
                            >
                              Complete
                            </button>
                          )}
                          {['PENDING', 'CONFIRMED'].includes(app.status) && (
                            <button
                              type="button"
                              className="action-btn action-btn-red"
                              onClick={() => handleCancel(app.id)}
                              title="Cancel Appointment"
                            >
                              Cancel
                            </button>
                          )}
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

      {/* Tab 2: Service Catalog */}
      {activeTab === 'services' && (
        <div className="public-spa-grid">
          {services.map((svc) => (
            <div key={svc.id} className="spa-treatment-card">
              <div className="treatment-media">
                <img src={svc.imageUrl} alt={svc.name} loading="lazy" />
                <span className="treatment-duration">
                  <span className="material-symbols-outlined">schedule</span>
                  {svc.durationMinutes} min
                </span>
              </div>
              <div className="treatment-content">
                <div className="treatment-header-row">
                  <span className="treatment-category">{svc.category}</span>
                  <span
                    className={`status-badge status-${svc.active ? 'green' : 'amber'}`}
                  >
                    {svc.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <h3>{svc.name}</h3>
                <p>{svc.description}</p>
                <div className="treatment-footer">
                  <span className="treatment-price">${svc.price}</span>
                  {isSuperAdmin && (
                    <button
                      type="button"
                      className={`action-btn action-btn-${svc.active ? 'red' : 'green'}`}
                      onClick={() => handleToggleActiveService(svc)}
                    >
                      {svc.active ? 'Deactivate' : 'Activate'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Service Modal */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '520px' }}>
            <div className="section-heading">
              <div>
                <span className="eyebrow">SERVICE CATALOG</span>
                <h2>Add New Spa Ritual</h2>
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

            <form onSubmit={handleCreateService} style={{ marginTop: '20px' }}>
              <div className="form-group">
                <label htmlFor="svc-name">Treatment Name</label>
                <input
                  id="svc-name"
                  type="text"
                  required
                  className="field"
                  placeholder="e.g. Hot Stone Thermal Therapy"
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
                    onChange={(e) => setNewService({ ...newService, price: Number(e.target.value) })}
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
                    onChange={(e) => setNewService({ ...newService, durationMinutes: Number(e.target.value) })}
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
                    onChange={(e) => setNewService({ ...newService, capacity: Number(e.target.value) })}
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
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  Save Ritual
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
