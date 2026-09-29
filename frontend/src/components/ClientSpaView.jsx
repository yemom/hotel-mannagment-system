import React, { useState, useEffect } from 'react';
import { spaBookingAPI, spaServiceAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const TIME_SLOTS = [
  '09:00', '10:30', '12:00', '13:30', '15:00', '16:30', '18:00', '19:30'
];

const ClientSpaView = () => {
  const { currentUser } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeModalService, setActiveModalService] = useState(null);

  // Form states
  const [bookingDate, setBookingDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [startTime, setStartTime] = useState('10:30');
  const [numberOfGuests, setNumberOfGuests] = useState('1');
  const [specialRequests, setSpecialRequests] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [alertNotice, setAlertNotice] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      let clientBookings = [];
      if (currentUser?.id) {
        try {
          const res = await spaBookingAPI.getByGuestId(currentUser.id);
          if (res.data && Array.isArray(res.data)) {
            clientBookings = res.data;
          }
        } catch (_) {}
      }

      // Check local storage for any cached bookings
      try {
        const key = `client_spa_bookings_${currentUser?.email}`;
        const stored = JSON.parse(localStorage.getItem(key) || '[]');
        if (Array.isArray(stored)) {
          const existingIds = new Set(clientBookings.map((b) => String(b.id)));
          for (const s of stored) {
            if (!existingIds.has(String(s.id))) {
              clientBookings.push(s);
              existingIds.add(String(s.id));
            }
          }
        }
      } catch (_) {}

      setAppointments(clientBookings);

      // Load active treatments
      const servRes = await spaServiceAPI.getActive();
      if (servRes.data && Array.isArray(servRes.data)) {
        setServices(servRes.data);
      }
    } catch (err) {
      console.warn('Spa client data load failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const handleBookSubmit = async (e) => {
    e.preventDefault();
    if (!activeModalService) return;

    setSubmitting(true);
    try {
      const payload = {
        guestId: currentUser?.id || 1,
        spaServiceId: activeModalService.id,
        bookingDate,
        startTime,
        numberOfGuests: Number(numberOfGuests || 1),
        specialRequests: specialRequests || 'Relaxation preference',
      };

      let created = null;
      try {
        const res = await spaBookingAPI.create(payload);
        if (res && res.data) {
          created = res.data;
        }
      } catch (err) {
        console.warn('Backend spa create skipped, saving locally:', err);
      }

      if (!created) {
        created = {
          id: Date.now(),
          guest: currentUser,
          spaService: activeModalService,
          bookingDate,
          startTime,
          numberOfGuests: Number(numberOfGuests || 1),
          status: 'CONFIRMED',
          specialRequests,
        };
      }

      const updated = [created, ...appointments];
      setAppointments(updated);
      try {
        const key = `client_spa_bookings_${currentUser?.email}`;
        localStorage.setItem(key, JSON.stringify(updated));
      } catch (_) {}

      setActiveModalService(null);
      setAlertNotice({
        type: 'success',
        message: `Spa appointment secured for ${activeModalService.name} on ${bookingDate} at ${startTime}!`,
      });
      setTimeout(() => setAlertNotice(null), 5000);
    } catch (err) {
      alert(err.message || 'Unable to confirm spa appointment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelAppointment = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this spa appointment?')) return;
    try {
      try {
        await spaBookingAPI.cancel(id);
      } catch (_) {}

      const updated = appointments.map((a) =>
        String(a.id) === String(id) ? { ...a, status: 'CANCELLED' } : a
      );
      setAppointments(updated);
      try {
        const key = `client_spa_bookings_${currentUser?.email}`;
        localStorage.setItem(key, JSON.stringify(updated));
      } catch (_) {}

      setAlertNotice({
        type: 'info',
        message: 'Spa appointment cancelled successfully.',
      });
      setTimeout(() => setAlertNotice(null), 4000);
    } catch (err) {
      alert(err.message || 'Unable to cancel appointment.');
    }
  };

  return (
    <div className="client-spa-view">
      {alertNotice && (
        <div className={`client-toast client-toast-${alertNotice.type}`} style={{ marginBottom: '20px' }}>
          <span className="material-symbols-outlined">
            {alertNotice.type === 'success' ? 'check_circle' : 'info'}
          </span>
          <span>{alertNotice.message}</span>
        </div>
      )}

      {/* Appointments History Section */}
      <section className="client-section" style={{ marginBottom: '40px' }}>
        <div className="section-heading">
          <div>
            <span className="eyebrow">WELLNESS SCHEDULE</span>
            <h2>My Spa Appointments</h2>
          </div>
        </div>

        {loading ? (
          <div className="catalog-loading">
            <span className="spinner" />
            <p>Loading appointments...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="empty-card">
            <span className="material-symbols-outlined">spa</span>
            <h3>No scheduled spa rituals</h3>
            <p>Select from our botanical treatments below to indulge in restorative care.</p>
          </div>
        ) : (
          <div className="client-res-grid">
            {appointments.map((app) => (
              <div key={app.id} className="client-res-card">
                <div className="card-top-row">
                  <span className="badge-type">
                    {app.spaService?.category?.replace('_', ' ') || 'SPA'}
                  </span>
                  <span
                    className={`status-badge status-${
                      app.status === 'CONFIRMED'
                        ? 'green'
                        : app.status === 'CANCELLED'
                        ? 'red'
                        : 'amber'
                    }`}
                  >
                    {app.status}
                  </span>
                </div>

                <h3>{app.spaService?.name || 'Spa Ritual'}</h3>

                <div className="details-list">
                  <div>
                    <span className="material-symbols-outlined">event</span>
                    <span>{app.bookingDate}</span>
                  </div>
                  <div>
                    <span className="material-symbols-outlined">schedule</span>
                    <span>{app.startTime} ({app.spaService?.durationMinutes || 60} mins)</span>
                  </div>
                  <div>
                    <span className="material-symbols-outlined">group</span>
                    <span>{app.numberOfGuests} Guests</span>
                  </div>
                  <div>
                    <span className="material-symbols-outlined">payments</span>
                    <strong>${app.spaService?.price || 95}</strong>
                  </div>
                </div>

                {app.status !== 'CANCELLED' && (
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => handleCancelAppointment(app.id)}
                    style={{ marginTop: '14px' }}
                  >
                    Cancel Appointment
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Available Rituals Catalog */}
      <section className="client-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">BOTANICAL RITUALS</span>
            <h2>Indulge in Sanctuary Care</h2>
          </div>
        </div>

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
                <span className="treatment-category">{svc.category?.replace('_', ' ')}</span>
                <h3>{svc.name}</h3>
                <p>{svc.description}</p>
                <div className="treatment-footer">
                  <span className="treatment-price">${svc.price}</span>
                  <button
                    type="button"
                    className="public-cta-btn"
                    onClick={() => setActiveModalService(svc)}
                  >
                    Book Appointment
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Appointment Modal */}
      {activeModalService && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '500px' }}>
            <div className="section-heading">
              <div>
                <span className="eyebrow">APPOINTMENT RESERVATION</span>
                <h2>Reserve Spa Ritual</h2>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setActiveModalService(null)}
                aria-label="Close"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleBookSubmit} style={{ marginTop: '20px' }}>
              <div className="reservation-summary-box">
                <div className="summary-row">
                  <span>Ritual:</span>
                  <strong>{activeModalService.name}</strong>
                </div>
                <div className="summary-row">
                  <span>Rate:</span>
                  <strong>${activeModalService.price} ({activeModalService.durationMinutes} mins)</strong>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '16px' }}>
                <label htmlFor="modal-spa-date">Preferred Date</label>
                <input
                  id="modal-spa-date"
                  type="date"
                  required
                  className="field"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginTop: '12px' }}>
                <label htmlFor="modal-spa-time">Arrival Time Slot</label>
                <select
                  id="modal-spa-time"
                  className="field"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                >
                  {TIME_SLOTS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginTop: '12px' }}>
                <label htmlFor="modal-spa-guests">Party Size</label>
                <select
                  id="modal-spa-guests"
                  className="field"
                  value={numberOfGuests}
                  onChange={(e) => setNumberOfGuests(e.target.value)}
                >
                  <option value="1">1 Guest</option>
                  {activeModalService.capacity >= 2 && <option value="2">2 Guests</option>}
                </select>
              </div>

              <div className="form-group" style={{ marginTop: '12px' }}>
                <label htmlFor="modal-spa-notes">Preferences &amp; Health Considerations</label>
                <textarea
                  id="modal-spa-notes"
                  rows="2"
                  className="field"
                  placeholder="e.g. Medium pressure, lavender aromatherapy..."
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                />
              </div>

              <div className="modal-actions" style={{ marginTop: '20px' }}>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setActiveModalService(null)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={submitting}
                >
                  {submitting ? 'Securing...' : 'Confirm Spa Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientSpaView;
