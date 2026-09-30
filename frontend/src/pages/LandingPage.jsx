import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';
import { roomAPI, spaServiceAPI } from '../services/api';
import { getRoomImage, getSpaImage } from '../utils/propertyImages';
import { goToReserve } from '../utils/reserve';
import { useAuth } from '../context/AuthContext';

const HERO_BG =
  'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=2000&q=85';
const RESTAURANT_BG =
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80';
const SPA_BG =
  'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80';

const LandingPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Search parameters for availability
  const [checkIn, setCheckIn] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [checkOut, setCheckOut] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().slice(0, 10);
  });
  const [guests, setGuests] = useState('2');
  const [roomType, setRoomType] = useState('ALL');

  // Live inventory — every value below is read from the backend, never invented.
  const [featuredRooms, setFeaturedRooms] = useState([]);
  const [featuredSpa, setFeaturedSpa] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [previewError, setPreviewError] = useState('');
  const [inventory, setInventory] = useState({ roomCount: null, spaCount: null });

  const loadPreview = async () => {
    setPreviewLoading(true);
    setPreviewError('');
    const [roomsResult, spaResult] = await Promise.allSettled([
      roomAPI.getAll(),
      spaServiceAPI.getActive(),
    ]);

    if (roomsResult.status === 'fulfilled') {
      const list = Array.isArray(roomsResult.value.data) ? roomsResult.value.data : [];
      setFeaturedRooms(list.slice(0, 3).map((r) => ({ ...r, image: getRoomImage(r) })));
      setInventory((prev) => ({ ...prev, roomCount: list.length }));
    } else {
      setFeaturedRooms([]);
      setInventory((prev) => ({ ...prev, roomCount: null }));
      setPreviewError('We could not reach the hotel reservation service.');
    }

    if (spaResult.status === 'fulfilled') {
      const list = Array.isArray(spaResult.value.data) ? spaResult.value.data : [];
      setFeaturedSpa(
        list.slice(0, 3).map((s) => ({ ...s, image: getSpaImage(s) }))
      );
      setInventory((prev) => ({ ...prev, spaCount: list.length }));
    } else {
      setFeaturedSpa([]);
      setInventory((prev) => ({ ...prev, spaCount: null }));
    }

    setPreviewLoading(false);
  };

  useEffect(() => {
    loadPreview();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    navigate(`/rooms?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}&type=${roomType}`);
  };

  /** Reservation CTAs: authenticated clients go to the client area, visitors sign in. */
  const handleReserveRoom = (room) =>
    goToReserve(navigate, {
      user: currentUser,
      target: '/client?tab=book',
      intent: room ? { type: 'ROOM', roomId: room.id, roomNumber: room.roomNumber } : null,
    });

  const handleReserveSpa = (service) =>
    goToReserve(navigate, {
      user: currentUser,
      target: '/client?tab=spa',
      intent: service ? { type: 'SPA', spaServiceId: service.id } : null,
    });

  const handleReserveTable = () =>
    goToReserve(navigate, { user: currentUser, target: '/client?tab=restaurant' });

  return (
    <div className="landing-page-root">
      {/* Public Top Navbar */}
      <PublicNavbar />

      {/* Hero Section */}
      <header
        className="landing-hero"
        style={{
          background: `linear-gradient(rgba(26, 26, 26, 0.4), rgba(26, 26, 26, 0.7)), url("${HERO_BG}") center/cover no-repeat`,
        }}
      >
        <div className="landing-hero-content">
          <div className="hero-kicker">
            <span className="hero-kicker-dot" />
            <span>AURELIA GRAND &bull; ADDIS ABABA &bull; EST. 2026</span>
          </div>

          <h1 className="hero-headline">
            Aurelia Grand — A Sanctuary of Timeless Luxury &amp; Bespoke Hospitality
          </h1>

          <p className="hero-subheadline">
            Experience quintessential elegance where quiet architecture meets intuitive
            white-glove service. Indulge in bespoke suites, chef-led dining, and
            restorative holistic wellness rituals.
          </p>

          <div className="hero-cta-group">
            {/* Explore Rooms drops the guest straight into the room reservation page.
                Anonymous visitors are sent to /login first and return here afterwards. */}
            <Link
              to="/client?tab=book"
              className="public-cta-btn"
              onClick={(e) => {
                e.preventDefault();
                handleReserveRoom(null);
              }}
            >
              <span>Explore Rooms</span>
              <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
            <Link to="/spa" className="public-outline-btn">
              <span className="material-symbols-outlined">spa</span>
              <span>Discover Spa</span>
            </Link>
          </div>

          {/* Quick Real-Time Booking Search Bar */}
          <form className="hero-search-bar" onSubmit={handleSearchSubmit}>
            <div className="search-field">
              <label htmlFor="search-check-in">CHECK-IN</label>
              <input
                id="search-check-in"
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                required
              />
            </div>

            <div className="search-field">
              <label htmlFor="search-check-out">CHECK-OUT</label>
              <input
                id="search-check-out"
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                required
              />
            </div>

            <div className="search-field">
              <label htmlFor="search-guests">GUESTS</label>
              <select
                id="search-guests"
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
              >
                <option value="1">1 Guest</option>
                <option value="2">2 Guests</option>
                <option value="3">3 Guests</option>
                <option value="4">4 Guests</option>
                <option value="5">5+ Guests</option>
              </select>
            </div>

            <div className="search-field">
              <label htmlFor="search-room-type">EXPERIENCE</label>
              <select
                id="search-room-type"
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
              >
                <option value="ALL">All Suites</option>
                <option value="SINGLE">Classic Single</option>
                <option value="DOUBLE">Executive Double</option>
                <option value="SUITE">Boutique Suite</option>
                <option value="DELUXE">Deluxe Panorama</option>
                <option value="PENTHOUSE">Presidential Penthouse</option>
              </select>
            </div>

            <button type="submit" className="hero-search-submit">
              <span className="material-symbols-outlined">search</span>
              <span>Check Availability</span>
            </button>
          </form>
        </div>
      </header>

      {/* Live Inventory Ribbon — values sourced from the backend */}
      <section className="landing-metrics-ribbon" aria-label="Live property information">
        <div className="metric-item">
          <strong>{inventory.roomCount !== null ? inventory.roomCount : '—'}</strong>
          <span>Rooms &amp; Suites</span>
        </div>
        <div className="metric-divider" />
        <div className="metric-item">
          <strong>{inventory.spaCount !== null ? inventory.spaCount : '—'}</strong>
          <span>Spa Rituals</span>
        </div>
        <div className="metric-divider" />
        <div className="metric-item">
          <strong>24/7</strong>
          <span>Concierge Desk</span>
        </div>
        <div className="metric-divider" />
        <div className="metric-item">
          <strong>Addis Ababa</strong>
          <span>Bole, Ethiopia</span>
        </div>
      </section>

      {/* Section 0: Welcome / Editorial Introduction */}
      <section className="landing-section welcome-section">
        <div className="section-container">
          <div className="welcome-split">
            <div className="welcome-media">
              <img
                src={HERO_BG}
                alt="The architecture and atrium of Aurelia Grand"
                loading="lazy"
              />
            </div>
            <div className="welcome-copy">
              <span className="section-eyebrow">WELCOME</span>
              <h2>Arrive as a guest. Leave as part of the house.</h2>
              <p>
                Aurelia Grand is an intimate luxury retreat in Bole, Addis Ababa — built around
                quiet architecture, warm materials, and hospitality that anticipates rather than
                reacts. Every suite, treatment, and table is designed to slow the pace of your day.
              </p>
              <p>
                From the moment you are welcomed at the atrium to your final morning on the
                terrace, our team curates each detail of your stay around you.
              </p>
              <div className="welcome-actions">
                <Link to="/about" className="public-outline-btn">
                  <span>Our Story</span>
                  <span className="material-symbols-outlined">arrow_forward</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 1: Featured Rooms & Suites */}
      <section className="landing-section">
        <div className="section-container">
          <div className="landing-section-header">
            <span className="section-eyebrow">ACCOMMODATIONS</span>
            <h2>Curated Suites &amp; Residences</h2>
            <p>
              Each residence is an intimate architectural statement featuring bespoke furnishings,
              plush Italian bedding, acoustic soundproofing, and panoramic views.
            </p>
          </div>

          {previewLoading && (
            <div className="catalog-loading">
              <span className="spinner" />
              <p>Loading current availability...</p>
            </div>
          )}

          {!previewLoading && previewError && (
            <div className="api-error-state" role="alert">
              <span className="material-symbols-outlined">cloud_off</span>
              <h3>Accommodations are temporarily unavailable</h3>
              <p>{previewError}</p>
              <button type="button" className="public-cta-btn" onClick={loadPreview}>
                Try Again
              </button>
            </div>
          )}

          {!previewLoading && !previewError && featuredRooms.length === 0 && (
            <div className="empty-card">
              <span className="material-symbols-outlined">hotel</span>
              <h3>No suites are currently listed</h3>
              <p>
                Our reservations team is updating availability. Please contact the concierge
                desk for immediate assistance.
              </p>
            </div>
          )}

          <div className="landing-rooms-grid">
            {featuredRooms.map((room) => (
              <div key={room.id} className="catalog-room-card">
                <div className="card-media">
                  <img
                    src={room.image}
                    alt={`Room ${room.roomNumber} - ${room.roomType}`}
                    loading="lazy"
                  />
                  <span className="card-type-badge">{room.roomType}</span>
                </div>
                <div className="card-content">
                  <div className="card-header-row">
                    <h3>Suite {room.roomNumber}</h3>
                    <div className="card-price">
                      <strong>${room.basePrice}</strong>
                      <span>/ night</span>
                    </div>
                  </div>
                  <p className="card-desc">{room.description}</p>
                  <div className="card-amenity-tags">
                    <span>
                      <span className="material-symbols-outlined">person</span> {room.capacity} Guests
                    </span>
                    {room.hasBathtub && (
                      <span>
                        <span className="material-symbols-outlined">bathtub</span> Soaking Tub
                      </span>
                    )}
                    {room.hasBalcony && (
                      <span>
                        <span className="material-symbols-outlined">balcony</span> Balcony
                      </span>
                    )}
                    {room.hasMinibar && (
                      <span>
                        <span className="material-symbols-outlined">wine_bar</span> Artisan Bar
                      </span>
                    )}
                  </div>
                  <div className="card-actions">
                    <button
                      type="button"
                      className="public-cta-btn"
                      onClick={() => handleReserveRoom(room)}
                    >
                      {currentUser ? 'Book Now' : 'Reserve'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="section-footer-cta">
            <Link to="/rooms" className="public-outline-btn">
              <span>
                {inventory.roomCount
                  ? `View All ${inventory.roomCount} Accommodations`
                  : 'View All Accommodations'}
              </span>
              <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Section 2: Spa & Wellness Sanctuary */}
      <section
        className="landing-section spa-showcase-section"
        style={{
          background: `linear-gradient(rgba(26, 26, 26, 0.8), rgba(26, 26, 26, 0.95)), url("${SPA_BG}") center/cover no-repeat`,
          color: '#ffffff',
        }}
      >
        <div className="section-container">
          <div className="landing-section-header" style={{ color: '#ffffff' }}>
            <span className="section-eyebrow" style={{ color: 'var(--accent-light)' }}>
              WELLNESS &amp; SERENITY
            </span>
            <h2 style={{ color: '#ffffff' }}>The Spa Sanctuary</h2>
            <p style={{ color: 'var(--accent-light)' }}>
              Surrender to restorative stillness. Our certified therapists blend ancient herbal
              rituals with modern botanical therapies to soothe body and mind.
            </p>
          </div>

          {!previewLoading && featuredSpa.length === 0 && (
            <div className="empty-card" style={{ background: 'rgba(250, 247, 242, 0.06)', color: '#ffffff', borderColor: 'rgba(223, 195, 138, 0.35)' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--accent-light)' }}>
                spa
              </span>
              <h3>No spa rituals are currently listed</h3>
              <p style={{ color: 'rgba(255,255,255,0.7)' }}>
                No spa services are currently available. Please check back shortly.
              </p>
            </div>
          )}

          <div className="landing-spa-grid">
            {featuredSpa.map((treatment) => (
              <div key={treatment.id} className="spa-treatment-card">
                <div className="treatment-media">
                  <img
                    src={treatment.image}
                    alt={treatment.name}
                    loading="lazy"
                  />
                  <span className="treatment-duration">
                    <span className="material-symbols-outlined">schedule</span>
                    {treatment.durationMinutes} min
                  </span>
                </div>
                <div className="treatment-content">
                  <span className="treatment-category">{treatment.category}</span>
                  <h3>{treatment.name}</h3>
                  <p>{treatment.description}</p>
                  <div className="treatment-footer">
                    <span className="treatment-price">${treatment.price}</span>
                    <button
                      type="button"
                      className="public-cta-btn"
                      onClick={() => handleReserveSpa(treatment)}
                    >
                      Book This Ritual
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="section-footer-cta">
            {/* Explore All Spa Rituals opens the spa sanctuary page — a grid of real
                spa imagery with reservation actions (login required). */}
            <Link
              to="/client?tab=spa"
              className="public-outline-btn"
              style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
              onClick={(e) => {
                e.preventDefault();
                handleReserveSpa(null);
              }}
            >
              <span>Explore All Spa Rituals</span>
              <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Section 3: Fine Dining & Culinary Experience */}
      <section className="landing-section">
        <div className="section-container">
          <div className="dining-split-card">
            <div className="dining-image-column">
              <img
                src={RESTAURANT_BG}
                alt="Fine Dining at Aurelia Grand"
                loading="lazy"
              />
            </div>
            <div className="dining-text-column">
              <span className="section-eyebrow">EPICUREAN EXCELLENCE</span>
              <h2>Atelier Fine Dining &amp; Terrace</h2>
              <p>
                A sensory journey led by executive culinary artisans. From open-air sunset dinners
                on our panoramic Balcony Terrace to intimate pairings in our subterranean wine cellar,
                every dish celebrates seasonal organic gastronomy.
              </p>
              <ul className="dining-highlights">
                <li>
                  <span className="material-symbols-outlined">restaurant</span>
                  <div>
                    <strong>Chef-Curated Tasting Menus</strong>
                    <span>Crafted daily with hand-picked regional harvest</span>
                  </div>
                </li>
                <li>
                  <span className="material-symbols-outlined">deck</span>
                  <div>
                    <strong>Open-Air Balcony &amp; Pergola</strong>
                    <span>Sunset vistas overlooking the fountain gardens</span>
                  </div>
                </li>
                <li>
                  <span className="material-symbols-outlined">wine_bar</span>
                  <div>
                    <strong>Sommelier Reserve Pairings</strong>
                    <span>Curated cellar of vintage Ethiopian and European reserves</span>
                  </div>
                </li>
              </ul>
              <div className="dining-cta-group">
                <button
                  type="button"
                  className="public-cta-btn"
                  onClick={handleReserveTable}
                >
                  Reserve a Table
                </button>
                <Link to="/restaurant" className="public-outline-btn">
                  View Dining Menu
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Signature Amenities */}
      <section className="landing-section amenities-section">
        <div className="section-container">
          <div className="landing-section-header">
            <span className="section-eyebrow">BESPOKE SERVICES</span>
            <h2>Thoughtful Touches, Exceptional Comfort</h2>
            <p>Every detail designed to elevate your stay beyond ordinary hospitality.</p>
          </div>

          <div className="amenities-grid">
            <div className="amenity-card">
              <div className="amenity-icon">
                <span className="material-symbols-outlined">concierge</span>
              </div>
              <h3>24/7 Private Butler</h3>
              <p>Dedicated round-the-clock white-glove concierge and personalized luggage assistance.</p>
            </div>

            <div className="amenity-card">
              <div className="amenity-icon">
                <span className="material-symbols-outlined">pool</span>
              </div>
              <h3>Infinity Plunge Pool</h3>
              <p>Temperature-controlled hydrotherapy pool with heated loungers and botanical garden view.</p>
            </div>

            <div className="amenity-card">
              <div className="amenity-icon">
                <span className="material-symbols-outlined">directions_car</span>
              </div>
              <h3>Executive Chauffeur</h3>
              <p>Complimentary luxury airport arrival transfers and private city chauffeur bookings.</p>
            </div>

            <div className="amenity-card">
              <div className="amenity-icon">
                <span className="material-symbols-outlined">wifi</span>
              </div>
              <h3>Ultra-Speed Connectivity</h3>
              <p>Dedicated fiber-optic gigabit Wi-Fi, ergonomic executive desks, and seamless workspace.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Invitation Banner */}
      <section className="landing-invitation-banner">
        <div className="section-container">
          <div className="invitation-card">
            <h2>Your Journey to Unrivaled Serenity Begins Here</h2>
            <p>
              Reserve directly with us to enjoy priority room upgrades, complimentary artisan breakfast,
              and flexible arrival schedules.
            </p>
            <div className="invitation-actions">
              <button
                type="button"
                className="public-cta-btn"
                onClick={() => handleReserveRoom(null)}
              >
                Reserve Your Stay Now
              </button>
              <Link to="/login" className="public-outline-btn">
                Member Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Section 6: Final Reservation CTA */}
      <section className="landing-section final-cta-section">
        <div className="section-container">
          <div className="final-cta-card">
            <span className="section-eyebrow" style={{ color: 'var(--accent)' }}>
              YOUR NEXT STAY
            </span>
            <h2 style={{ color: '#ffffff' }}>Begins Here</h2>
            <p style={{ color: 'rgba(255,255,255,0.78)' }}>
              Reserve directly with Aurelia Grand for preferred suite allocation, complimentary
              artisan breakfast, and flexible arrival scheduling.
            </p>
            <div className="final-cta-actions">
              <Link to="/login" state={{ redirectTo: '/client' }} className="public-cta-btn">
                <span>Reserve Your Stay</span>
                <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
              <Link to="/rooms" className="public-outline-btn" style={{ borderColor: '#ffffff', color: '#ffffff' }}>
                <span>Browse Accommodations</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Public Footer */}
      <PublicFooter />
    </div>
  );
};

export default LandingPage;
