import React, { useState, useEffect, useMemo } from 'react';
import { spaBookingAPI, spaServiceAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getSpaImage } from '../utils/propertyImages';
import ReservationDateTimePicker from './ReservationDateTimePicker';

const SPA_HERO_IMAGE =
  'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1920&q=85';

// Service types come from the SpaCategory enum persisted with each treatment.
const SPA_CATEGORIES = [
  'ALL',
  'MASSAGE',
  'FACIAL',
  'BODY_TREATMENT',
  'WELLNESS',
  'COUPLES',
  'BEAUTY',
];

const TIME_SLOTS = [
  '09:00', '10:30', '12:00', '13:30', '15:00', '16:30', '18:00', '19:30'
];

const ClientSpaView = ({ initialServiceId = null }) => {
  const { currentUser } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [activeModalService, setActiveModalService] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

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
    setLoadError('');
    try {
      let clientBookings = [];
      if (currentUser?.id) {
        try {
          const res = await spaBookingAPI.getByGuestId(currentUser.id);
          if (res.data && Array.isArray(res.data)) {
            clientBookings = res.data;
          }
        } catch (err) {
          setLoadError(
            err?.response?.data?.message ||
              'We could not load your spa appointments. Please retry.'
          );
        }
      }

      // Server is the single source of truth for reservations.
      setAppointments(clientBookings);

      // Load active treatments — the catalogue comes from the backend only.
      try {
        const servRes = await spaServiceAPI.getActive();
        setServices(servRes.data && Array.isArray(servRes.data) ? servRes.data : []);
      } catch (err) {
        setServices([]);
        setLoadError(
          err?.response?.data?.message ||
            'We could not load the spa treatment catalogue. Please retry.'
        );
      }
    } catch (err) {
      setLoadError(
        err?.response?.data?.message ||
          'The spa service is temporarily unavailable. Please retry.'
      );
      setServices([]);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // Open the treatment carried over from a pre-login reservation intent.
  useEffect(() => {
    if (!initialServiceId || services.length === 0 || activeModalService) return;
    const match = services.find((s) => String(s.id) === String(initialServiceId));
    if (match) setActiveModalService(match);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialServiceId, services]);

  const handleBookSubmit = async (e) => {
    e.preventDefault();
    if (!activeModalService) return;
    if (!currentUser?.id) {
      setAlertNotice({
        type: 'error',
        message: 'Your session has expired. Please sign in again to reserve a treatment.',
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        guestId: currentUser.id,
        spaServiceId: activeModalService.id,
        bookingDate,
        startTime,
        numberOfGuests: Number(numberOfGuests || 1),
        specialRequests: specialRequests || 'Relaxation preference',
      };

      // Submit to the real backend. Never fabricate a booking when the call fails.
      let created = null;
      try {
        const res = await spaBookingAPI.create(payload);
        created = res && res.data ? res.data : null;
      } catch (err) {
        setAlertNotice({
          type: 'error',
          message:
            err?.response?.data?.message ||
            err?.message ||
            'Unable to submit your spa reservation. Please try again.',
        });
        return;
      }

      if (!created) {
        setAlertNotice({
          type: 'error',
          message: 'The server did not return a reservation. Please try again.',
        });
        return;
      }

      setAppointments((prev) => [created, ...prev]);
      setActiveModalService(null);
      setAlertNotice({
        type: 'success',
        message: `Reservation request received for ${activeModalService.name} on ${bookingDate} at ${startTime}. Status: ${created.status || 'PENDING'} — our spa team will confirm shortly.`,
      });
      setTimeout(() => setAlertNotice(null), 7000);
    } catch (err) {
      setAlertNotice({
        type: 'error',
        message:
          err?.response?.data?.message ||
          err?.message ||
          'Unable to submit your spa reservation.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredServices = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    return services.filter((s) => {
      const matchesCategory = selectedCategory === 'ALL' || s.category === selectedCategory;
      if (!matchesCategory) return false;
      if (!q) return true;
      return (
        (s.name || '').toLowerCase().includes(q) ||
        (s.description || '').toLowerCase().includes(q) ||
        (s.category || '').replace('_', ' ').toLowerCase().includes(q)
      );
    });
  }, [services, selectedCategory, searchQuery]);

  const upcomingCount = useMemo(
    () => appointments.filter((a) => a.status !== 'CANCELLED').length,
    [appointments]
  );

  return (
    <div className="client-spa-view spa-reservation-page">
      {/* ─── Luxury Spa Hero Banner (matches room & table reservation pages) ─── */}
      <section
        className="spa-reservation-hero"
        style={{
          background: `linear-gradient(rgba(26, 26, 26, 0.72), rgba(26, 26, 26, 0.9)), url("${SPA_HERO_IMAGE}") center/cover no-repeat`,
        }}
      >
        <div className="spa-reservation-hero-inner">
          <span className="spa-hero-kicker">
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>spa</span>
            WELLNESS &amp; BOTANICAL SANCTUARY
          </span>
          <h1>Reserve Your Spa Ritual</h1>
          <p>
            Surrender to tranquil serenity. Our bespoke treatments blend ancient botanical
            wisdom with modern therapeutic care to restore vital energy and rejuvenate body
            and spirit.
          </p>
          <div className="spa-hero-stats">
            <div className="spa-hero-stat">
              <strong>{services.length}</strong>
              <span>Active Rituals</span>
            </div>
            <div className="spa-hero-stat">
              <strong>{upcomingCount}</strong>
              <span>My Appointments</span>
            </div>
            <div className="spa-hero-stat">
              <strong>09:00 – 19:30</strong>
              <span>Daily Opening</span>
            </div>
          </div>
        </div>
      </section>

      {/* Category filter bar */}
      <div className="spa-reservation-filter">
        <div className="section-container">
          <div className="spa-category-nav">
            {SPA_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`spa-category-pill ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 20px 0' }}>
      {alertNotice && (
        <div className={`client-toast client-toast-${alertNotice.type}`} style={{ marginBottom: '20px' }}>
          <span className="material-symbols-outlined">
            {alertNotice.type === 'success' ? 'check_circle' : 'info'}
          </span>
          <span>{alertNotice.message}</span>
        </div>
      )}

      {/* Schedule summary — full details & actions live in My Reservations */}
      <section className="client-section" style={{ marginBottom: '32px' }}>
        <div className="spa-schedule-strip">
          <span className="material-symbols-outlined">event_available</span>
          <div>
            <strong>
              {loading
                ? 'Checking your wellness schedule...'
                : upcomingCount > 0
                ? `${upcomingCount} spa ${upcomingCount === 1 ? 'ritual' : 'rituals'} on your schedule`
                : 'No spa rituals booked yet'}
            </strong>
            <span>
              Your spa reservations, their live status and cancellation options are listed with your
              room stays and dining tables under My Reservations.
            </span>
          </div>
        </div>

        {loadError && (
          <div className="api-error-state" role="alert" style={{ marginTop: '16px' }}>
            <span className="material-symbols-outlined">cloud_off</span>
            <h3>We couldn&apos;t load the spa collection</h3>
            <p>{loadError}</p>
            <button type="button" className="public-cta-btn" onClick={loadData}>
              Try Again
            </button>
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

        {/* Search / filter toolbar */}
        <div className="catalog-toolbar">
          <div className="catalog-search">
            <span className="material-symbols-outlined">search</span>
            <input
              type="search"
              placeholder="Search rituals by name, category or benefit..."
              aria-label="Search spa rituals"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="catalog-result-count">
            {filteredServices.length} {filteredServices.length === 1 ? 'ritual' : 'rituals'}
          </div>
        </div>

        {loadError && (
          <div className="api-error-state" role="alert">
            <span className="material-symbols-outlined">cloud_off</span>
            <h3>We couldn&apos;t load the spa collection</h3>
            <p>{loadError}</p>
            <button type="button" className="public-cta-btn" onClick={loadData}>
              Try Again
            </button>
          </div>
        )}

        {loading && (
          <div className="catalog-loading">
            <span className="spinner" />
            <p>Loading spa rituals...</p>
          </div>
        )}

        {!loading && !loadError && (
        <div className="public-spa-grid">
          {filteredServices.length === 0 && (
            <div className="empty-card" style={{ gridColumn: '1 / -1' }}>
              <span className="material-symbols-outlined">spa</span>
              <h3>No spa rituals available</h3>
              <p>
                {services.length === 0
                  ? 'No spa services are currently available. Please check back soon.'
                  : 'No treatments match your search. Try a different keyword or category.'}
              </p>
            </div>
          )}
          {filteredServices.map((svc) => (
            <div key={svc.id} className="spa-treatment-card">
              <div className="treatment-media">
                <img src={getSpaImage(svc)} alt={svc.name} loading="lazy" />
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
        )}
      </section>
      </div>

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

              {/* Calendar + analog clock — identical control to the room & table pages */}
              <div style={{ marginTop: '18px' }}>
                <ReservationDateTimePicker
                  date={bookingDate}
                  onDateChange={setBookingDate}
                  time={startTime}
                  onTimeChange={setStartTime}
                  dateLabel="Preferred date"
                  timeLabel="Arrival time"
                  timeSlots={TIME_SLOTS}
                  idPrefix="spa-modal"
                />
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
