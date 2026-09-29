import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';
import { roomAPI, spaServiceAPI } from '../services/api';

const HERO_BG =
  'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=2000&q=85';
const RESTAURANT_BG =
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80';
const SPA_BG =
  'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80';

const FALLBACK_ROOMS = [
  {
    id: 401,
    roomNumber: '401',
    roomType: 'PENTHOUSE',
    basePrice: 480,
    capacity: 4,
    description: 'Top-floor presidential penthouse with private wraparound balcony, fireplace salon, and butler service.',
    image: 'https://images.unsplash.com/photo-1578474846511-04ba529f0b88?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 301,
    roomNumber: '301',
    roomType: 'DELUXE',
    basePrice: 290,
    capacity: 4,
    description: 'Ultra-luxurious corner suite with panoramic skyline views, walk-in dressing room, and deep soaking tub.',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 201,
    roomNumber: '201',
    roomType: 'SUITE',
    basePrice: 220,
    capacity: 3,
    description: 'Executive boutique suite with partitioned salon lounge, Italian marble bath, and private terrace.',
    image: 'https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?auto=format&fit=crop&w=800&q=80',
  },
];

const FALLBACK_SPA = [
  {
    id: 1,
    name: 'Swedish Relaxation Massage',
    category: 'MASSAGE',
    durationMinutes: 60,
    price: 95,
    description: 'Gentle full-body massage using rhythmic strokes and botanical oils to release muscle tension and cultivate deep calm.',
    imageUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 2,
    name: 'Luxury Radiance Facial',
    category: 'FACIAL',
    durationMinutes: 50,
    price: 120,
    description: 'Rejuvenating bespoke facial featuring ultrasonic deep-cleansing, warm botanical steam, and antioxidant serum.',
    imageUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 3,
    name: 'Couples Wellness Sanctuary',
    category: 'COUPLES',
    durationMinutes: 90,
    price: 240,
    description: 'Side-by-side signature massages in our private VIP couple suite, with hydrotherapy foot ritual and champagne.',
    imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
  },
];

const LandingPage = () => {
  const navigate = useNavigate();

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

  // Real backend data states
  const [featuredRooms, setFeaturedRooms] = useState(FALLBACK_ROOMS);
  const [featuredSpa, setFeaturedSpa] = useState(FALLBACK_SPA);

  useEffect(() => {
    // Load real rooms
    roomAPI
      .getAll()
      .then((res) => {
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          const formatted = res.data.slice(0, 3).map((r, i) => ({
            ...r,
            image: FALLBACK_ROOMS[i % FALLBACK_ROOMS.length].image,
          }));
          setFeaturedRooms(formatted);
        }
      })
      .catch((err) => {
        console.warn('Using fallback room inventory for landing showcase:', err);
      });

    // Load real spa services
    spaServiceAPI
      .getActive()
      .then((res) => {
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          setFeaturedSpa(res.data.slice(0, 3));
        }
      })
      .catch((err) => {
        console.warn('Using fallback spa services for landing showcase:', err);
      });
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    navigate(`/rooms?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}&type=${roomType}`);
  };

  return (
    <div className="landing-page-root">
      {/* Public Top Navbar */}
      <PublicNavbar />

      {/* Hero Section */}
      <header
        className="landing-hero"
        style={{
          background: `linear-gradient(rgba(15, 23, 42, 0.74), rgba(15, 23, 42, 0.88)), url("${HERO_BG}") center/cover no-repeat`,
        }}
      >
        <div className="landing-hero-content">
          <div className="hero-kicker">
            <span className="hero-kicker-dot" />
            <span>THE SANCTUARY COLLECTION &bull; ADDIS ABABA &bull; EST. 2026</span>
          </div>

          <h1 className="hero-headline">
            A Sanctuary of Timeless Luxury &amp; Bespoke Hospitality
          </h1>

          <p className="hero-subheadline">
            Experience quintessential elegance where quiet architecture meets intuitive
            white-glove service. Indulge in bespoke suites, Michelin-inspired dining, and
            restorative holistic wellness rituals.
          </p>

          <div className="hero-cta-group">
            <Link to="/rooms" className="public-cta-btn">
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

      {/* Metrics Ribbon */}
      <section className="landing-metrics-ribbon">
        <div className="metric-item">
          <strong>14</strong>
          <span>Curated Suites</span>
        </div>
        <div className="metric-divider" />
        <div className="metric-item">
          <strong>18</strong>
          <span>Fine Dining Tables</span>
        </div>
        <div className="metric-divider" />
        <div className="metric-item">
          <strong>6</strong>
          <span>Holistic Spa Rituals</span>
        </div>
        <div className="metric-divider" />
        <div className="metric-item">
          <strong>4.95 / 5</strong>
          <span>Forbes Travel Accolade</span>
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

          <div className="landing-rooms-grid">
            {featuredRooms.map((room) => (
              <div key={room.id} className="catalog-room-card">
                <div className="card-media">
                  <img
                    src={room.image || FALLBACK_ROOMS[0].image}
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
                    <Link
                      to={`/rooms?select=${room.roomNumber}`}
                      className="public-cta-btn"
                    >
                      Book Now
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="section-footer-cta">
            <Link to="/rooms" className="public-outline-btn">
              <span>View All 14 Suites</span>
              <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Section 2: Spa & Wellness Sanctuary */}
      <section
        className="landing-section spa-showcase-section"
        style={{
          background: `linear-gradient(rgba(15, 23, 42, 0.88), rgba(15, 23, 42, 0.94)), url("${SPA_BG}") center/cover no-repeat`,
          color: '#ffffff',
        }}
      >
        <div className="section-container">
          <div className="landing-section-header" style={{ color: '#ffffff' }}>
            <span className="section-eyebrow" style={{ color: '#34d399' }}>
              WELLNESS &amp; SERENITY
            </span>
            <h2 style={{ color: '#ffffff' }}>The Spa Sanctuary</h2>
            <p style={{ color: '#cbd5e1' }}>
              Surrender to restorative stillness. Our certified therapists blend ancient herbal
              rituals with modern botanical therapies to soothe body and mind.
            </p>
          </div>

          <div className="landing-spa-grid">
            {featuredSpa.map((treatment) => (
              <div key={treatment.id} className="spa-treatment-card">
                <div className="treatment-media">
                  <img
                    src={treatment.imageUrl || FALLBACK_SPA[0].imageUrl}
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
                    <Link to="/spa" className="public-cta-btn">
                      Book This Ritual
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="section-footer-cta">
            <Link to="/spa" className="public-outline-btn" style={{ borderColor: '#34d399', color: '#34d399' }}>
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
                alt="Fine Dining at Ye-mom Hotel"
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
                    <strong>Michelin-Inspired Tasting Menus</strong>
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
                <Link to="/restaurant" className="public-cta-btn">
                  Reserve a Table
                </Link>
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
              <Link to="/rooms" className="public-cta-btn">
                Reserve Your Stay Now
              </Link>
              <Link to="/login" className="public-outline-btn">
                Member Sign In
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
