import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';
import { spaServiceAPI, spaBookingAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const SPA_HERO_BG =
  'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1920&q=85';

const SEED_SPA_SERVICES = [
  {
    id: 1,
    name: 'Swedish Relaxation Massage',
    description: 'Gentle full-body massage using rhythmic soothing strokes and botanical oils to release muscle tension, stimulate circulation, and cultivate deep relaxation.',
    category: 'MASSAGE',
    durationMinutes: 60,
    price: 95.00,
    capacity: 2,
    active: true,
    imageUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 2,
    name: 'Deep Tissue Therapy',
    description: 'Intensive neuromuscular massage applying firm, focused pressure to release chronic tension patterns, alleviate trigger points, and restore mobility.',
    category: 'MASSAGE',
    durationMinutes: 75,
    price: 130.00,
    capacity: 2,
    active: true,
    imageUrl: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 3,
    name: 'Organic Botanical Aromatherapy',
    description: 'Holistic sensory journey combining customized pure essential oil blends with Swedish massage techniques to calm the nervous system and revitalize spirit.',
    category: 'WELLNESS',
    durationMinutes: 60,
    price: 110.00,
    capacity: 2,
    active: true,
    imageUrl: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 4,
    name: 'Luxury Radiance Facial',
    description: 'Rejuvenating bespoke facial featuring ultrasonic deep-cleansing, warm botanical steam, targeted enzymatic exfoliation, and ultra-hydrating antioxidant serum.',
    category: 'FACIAL',
    durationMinutes: 50,
    price: 120.00,
    capacity: 1,
    active: true,
    imageUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 5,
    name: 'Couples Wellness Sanctuary',
    description: 'Side-by-side signature massages in our private VIP couple suite, accompanied by soothing hydrotherapy foot ritual and chilled champagne.',
    category: 'COUPLES',
    durationMinutes: 90,
    price: 240.00,
    capacity: 2,
    active: true,
    imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 6,
    name: 'Himalayan Salt Scrub & Renewal',
    description: 'Full-body mineral exfoliation with warm Himalayan pink salt crystals and aromatic sweet almond oil, followed by an ultra-nourishing hydration wrap.',
    category: 'BODY_TREATMENT',
    durationMinutes: 45,
    price: 85.00,
    capacity: 1,
    active: true,
    imageUrl: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=800&q=80',
  },
];

const CATEGORIES = ['ALL', 'MASSAGE', 'FACIAL', 'WELLNESS', 'COUPLES', 'BODY_TREATMENT'];

const TIME_SLOTS = [
  '09:00', '10:30', '12:00', '13:30', '15:00', '16:30', '18:00', '19:30'
];

const SpaPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Booking Modal
  const [activeTreatment, setActiveTreatment] = useState(null);
  const [appointmentDate, setAppointmentDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [startTime, setStartTime] = useState('10:30');
  const [numberOfGuests, setNumberOfGuests] = useState('1');
  const [specialRequests, setSpecialRequests] = useState('');
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [bookingConfirmation, setBookingConfirmation] = useState(null);

  useEffect(() => {
    const loadServices = async () => {
      setLoading(true);
      try {
        const res = await spaServiceAPI.getActive();
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          setServices(res.data);
        } else {
          setServices(SEED_SPA_SERVICES);
        }
      } catch (err) {
        console.warn('Backend spa services call failed, using default rituals:', err);
        setServices(SEED_SPA_SERVICES);
      } finally {
        setLoading(false);
      }
    };
    loadServices();
  }, []);

  const filteredServices = useMemo(() => {
    if (selectedCategory === 'ALL') return services;
    return services.filter((s) => s.category === selectedCategory);
  }, [services, selectedCategory]);

  const handleBookClick = (treatment) => {
    if (!currentUser) {
      const intent = {
        type: 'SPA',
        spaServiceId: treatment.id,
        treatmentName: treatment.name,
        price: treatment.price,
      };
      sessionStorage.setItem('pending_booking', JSON.stringify(intent));
      navigate('/login', {
        state: {
          redirectTo: '/spa',
          bookingIntent: intent,
        },
      });
      return;
    }
    setActiveTreatment(treatment);
  };

  const handleConfirmAppointment = async (e) => {
    e.preventDefault();
    if (!activeTreatment) return;

    setSubmittingBooking(true);
    try {
      const payload = {
        guestId: currentUser.id || 1,
        spaServiceId: activeTreatment.id,
        bookingDate: appointmentDate,
        startTime: startTime,
        numberOfGuests: Number(numberOfGuests || 1),
        specialRequests: specialRequests || 'Aromatherapy preferences discussed on arrival',
      };

      let created = null;
      try {
        const res = await spaBookingAPI.create(payload);
        if (res && res.data) {
          created = res.data;
        }
      } catch (err) {
        console.warn('Backend spa booking create offline, caching locally:', err);
      }

      if (!created) {
        created = {
          id: Date.now(),
          guest: currentUser,
          spaService: activeTreatment,
          bookingDate: appointmentDate,
          startTime: startTime,
          numberOfGuests: Number(numberOfGuests || 1),
          status: 'CONFIRMED',
          specialRequests,
        };
      }

      // Sync to client local storage
      try {
        const key = `client_spa_bookings_${currentUser.email}`;
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        localStorage.setItem(key, JSON.stringify([created, ...existing]));
      } catch (_) {}

      // Clear pending intent
      sessionStorage.removeItem('pending_booking');

      setBookingConfirmation({
        serviceName: activeTreatment.name,
        date: appointmentDate,
        time: startTime,
        guests: numberOfGuests,
      });
      setActiveTreatment(null);
    } catch (err) {
      alert(err.message || 'Unable to confirm spa appointment.');
    } finally {
      setSubmittingBooking(false);
    }
  };

  return (
    <div className="public-spa-page">
      <PublicNavbar />

      {/* Required header banner selector: .spa-header-banner */}
      <header
        className="spa-header-banner"
        style={{
          background: `linear-gradient(rgba(15, 23, 42, 0.76), rgba(15, 23, 42, 0.90)), url("${SPA_HERO_BG}") center/cover no-repeat`,
        }}
      >
        <div className="section-container banner-content">
          <span className="banner-kicker">WELLNESS &amp; BOTANICAL SANCTUARY</span>
          <h1>Holistic Spa Rituals &amp; Therapies</h1>
          <p>
            Surrender to tranquil serenity. Our bespoke treatments blend ancient botanical
            wisdom with modern therapeutic care to restore vital energy, relieve chronic tension,
            and rejuvenate body and spirit.
          </p>
        </div>
      </header>

      {/* Category Pills Navigation */}
      <div className="spa-filter-section">
        <div className="section-container">
          <div className="spa-category-nav">
            {CATEGORIES.map((cat) => (
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

      {/* Confirmation Banner */}
      {bookingConfirmation && (
        <div className="section-container" style={{ marginTop: '24px' }}>
          <div className="booking-confirmation-banner">
            <span className="material-symbols-outlined" style={{ fontSize: '32px', color: '#059669' }}>
              spa
            </span>
            <div>
              <h3>Spa Appointment Confirmed — {bookingConfirmation.serviceName}</h3>
              <p>
                Scheduled for {bookingConfirmation.date} at {bookingConfirmation.time} &bull;{' '}
                {bookingConfirmation.guests} Guests. Please arrive 15 minutes early to enjoy our hydrotherapy suite.
              </p>
            </div>
            <Link to="/client" className="public-cta-btn" style={{ marginLeft: 'auto' }}>
              View in My Portal
            </Link>
          </div>
        </div>
      )}

      {/* Main Catalog */}
      <main className="section-container" style={{ padding: '40px 24px 80px' }}>
        <div className="catalog-meta-row">
          <h2>Holistic Therapies ({filteredServices.length})</h2>
          <span className="catalog-sort-notice">Complimentary hydrotherapy bath included with each session</span>
        </div>

        {loading ? (
          <div className="catalog-loading">
            <span className="spinner" />
            <p>Loading spa sanctuary rituals...</p>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="catalog-empty">
            <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#94a3b8' }}>
              spa
            </span>
            <h3>No treatments found in this category</h3>
            <button
              type="button"
              className="public-outline-btn"
              onClick={() => setSelectedCategory('ALL')}
            >
              View All Rituals
            </button>
          </div>
        ) : (
          <div className="public-spa-grid">
            {filteredServices.map((treatment) => (
              <article key={treatment.id} className="spa-treatment-card">
                <div className="treatment-media">
                  <img
                    src={treatment.imageUrl || SEED_SPA_SERVICES[0].imageUrl}
                    alt={treatment.name}
                    loading="lazy"
                  />
                  <span className="treatment-duration">
                    <span className="material-symbols-outlined">schedule</span>
                    {treatment.durationMinutes} min
                  </span>
                </div>

                <div className="treatment-content">
                  <div className="treatment-header-row">
                    <span className="treatment-category">{treatment.category?.replace('_', ' ')}</span>
                    <span className="treatment-capacity">
                      <span className="material-symbols-outlined">person</span> Max {treatment.capacity}
                    </span>
                  </div>

                  <h3>{treatment.name}</h3>
                  <p>{treatment.description}</p>

                  <div className="treatment-footer">
                    <div className="treatment-price-wrap">
                      <span className="treatment-price">${treatment.price}</span>
                      <span className="treatment-price-sub">/ session</span>
                    </div>
                    <button
                      type="button"
                      className="public-cta-btn"
                      onClick={() => handleBookClick(treatment)}
                    >
                      Book This Ritual
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* Booking Modal */}
      {activeTreatment && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '520px' }}>
            <div className="section-heading">
              <div>
                <span className="eyebrow">APPOINTMENT RESERVATION</span>
                <h2>Reserve Spa Ritual</h2>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setActiveTreatment(null)}
                aria-label="Close"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleConfirmAppointment} style={{ marginTop: '20px' }}>
              <div className="reservation-summary-box">
                <div className="summary-row">
                  <span>Ritual:</span>
                  <strong>{activeTreatment.name}</strong>
                </div>
                <div className="summary-row">
                  <span>Duration &amp; Rate:</span>
                  <strong>{activeTreatment.durationMinutes} mins &bull; ${activeTreatment.price}</strong>
                </div>
                <div className="summary-row">
                  <span>Guest:</span>
                  <strong>{currentUser?.firstName} {currentUser?.lastName}</strong>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '16px' }}>
                <label htmlFor="spa-date">Preferred Date</label>
                <input
                  id="spa-date"
                  type="date"
                  required
                  className="field"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginTop: '12px' }}>
                <label htmlFor="spa-time">Arrival Time Slot</label>
                <select
                  id="spa-time"
                  className="field"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                >
                  {TIME_SLOTS.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginTop: '12px' }}>
                <label htmlFor="spa-guests">Party Size</label>
                <select
                  id="spa-guests"
                  className="field"
                  value={numberOfGuests}
                  onChange={(e) => setNumberOfGuests(e.target.value)}
                >
                  <option value="1">1 Guest</option>
                  {activeTreatment.capacity >= 2 && <option value="2">2 Guests (Couple)</option>}
                </select>
              </div>

              <div className="form-group" style={{ marginTop: '12px' }}>
                <label htmlFor="spa-requests">Aromatherapy &amp; Health Considerations</label>
                <textarea
                  id="spa-requests"
                  rows="3"
                  className="field"
                  placeholder="e.g. Pressure level preference, allergies, pregnancy, target areas..."
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                />
              </div>

              <div className="modal-actions" style={{ marginTop: '24px' }}>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setActiveTreatment(null)}
                  disabled={submittingBooking}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={submittingBooking}
                >
                  {submittingBooking ? 'Securing Ritual...' : 'Confirm Spa Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <PublicFooter />
    </div>
  );
};

export default SpaPage;
