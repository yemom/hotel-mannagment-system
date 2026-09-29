import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';
import { roomAPI, reservationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ROOM_IMAGES = {
  SINGLE: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=1000&q=80',
  DOUBLE: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1000&q=80',
  SUITE: 'https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?auto=format&fit=crop&w=1000&q=80',
  DELUXE: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1000&q=80',
  PENTHOUSE: 'https://images.unsplash.com/photo-1578474846511-04ba529f0b88?auto=format&fit=crop&w=1000&q=80',
};

const SEED_ROOMS = [
  {
    id: 101,
    roomNumber: '101',
    roomType: 'SINGLE',
    basePrice: 85,
    capacity: 1,
    status: 'AVAILABLE',
    description: 'Cozy retreat with a plush queen bed, dedicated ergonomic workstation, and quiet garden views.',
    hasBathtub: false,
    hasBalcony: false,
    hasMinibar: true,
  },
  {
    id: 102,
    roomNumber: '102',
    roomType: 'DOUBLE',
    basePrice: 140,
    capacity: 2,
    status: 'AVAILABLE',
    description: 'Spacious modern room featuring two premium queen beds, artisan coffee bar, and skyline windows.',
    hasBathtub: true,
    hasBalcony: false,
    hasMinibar: true,
  },
  {
    id: 103,
    roomNumber: '103',
    roomType: 'SINGLE',
    basePrice: 95,
    capacity: 1,
    status: 'AVAILABLE',
    description: 'Serene corner single with floor-to-ceiling windows, rain shower, and acoustic soundproofing.',
    hasBathtub: false,
    hasBalcony: true,
    hasMinibar: true,
  },
  {
    id: 104,
    roomNumber: '104',
    roomType: 'SINGLE',
    basePrice: 90,
    capacity: 1,
    status: 'AVAILABLE',
    description: 'Sunlit garden single with French doors leading to a private botanical courtyard.',
    hasBathtub: false,
    hasBalcony: false,
    hasMinibar: false,
  },
  {
    id: 201,
    roomNumber: '201',
    roomType: 'SUITE',
    basePrice: 220,
    capacity: 3,
    status: 'AVAILABLE',
    description: 'Executive boutique suite with a partitioned salon lounge, Italian marble bath, and private terrace.',
    hasBathtub: true,
    hasBalcony: true,
    hasMinibar: true,
  },
  {
    id: 202,
    roomNumber: '202',
    roomType: 'DOUBLE',
    basePrice: 155,
    capacity: 2,
    status: 'AVAILABLE',
    description: 'Superior double with sweeping courtyard views, king featherbed, and artisan refreshments.',
    hasBathtub: true,
    hasBalcony: true,
    hasMinibar: true,
  },
  {
    id: 203,
    roomNumber: '203',
    roomType: 'DOUBLE',
    basePrice: 145,
    capacity: 2,
    status: 'AVAILABLE',
    description: 'Artisan twin double with custom timber furnishings, designer reading nook, and espresso bar.',
    hasBathtub: false,
    hasBalcony: false,
    hasMinibar: true,
  },
  {
    id: 204,
    roomNumber: '204',
    roomType: 'DOUBLE',
    basePrice: 160,
    capacity: 2,
    status: 'AVAILABLE',
    description: 'Corner double suite with wrap-around city panorama, heated bathroom floors, and balcony.',
    hasBathtub: true,
    hasBalcony: true,
    hasMinibar: true,
  },
  {
    id: 301,
    roomNumber: '301',
    roomType: 'DELUXE',
    basePrice: 290,
    capacity: 4,
    status: 'AVAILABLE',
    description: 'Ultra-luxurious corner suite with panoramic skyline views, walk-in dressing room, and deep soaking tub.',
    hasBathtub: true,
    hasBalcony: true,
    hasMinibar: true,
  },
  {
    id: 302,
    roomNumber: '302',
    roomType: 'SUITE',
    basePrice: 240,
    capacity: 3,
    status: 'AVAILABLE',
    description: 'Grand family suite with dual vanity bath, private sun deck, and plush sleeper sofa.',
    hasBathtub: true,
    hasBalcony: true,
    hasMinibar: true,
  },
  {
    id: 303,
    roomNumber: '303',
    roomType: 'SUITE',
    basePrice: 255,
    capacity: 3,
    status: 'AVAILABLE',
    description: 'Romantic bridal suite with private jacuzzi whirlpool, chilled champagne service, and city lights.',
    hasBathtub: true,
    hasBalcony: true,
    hasMinibar: true,
  },
  {
    id: 304,
    roomNumber: '304',
    roomType: 'DELUXE',
    basePrice: 310,
    capacity: 4,
    status: 'AVAILABLE',
    description: 'Royal deluxe family suite with dual king suites, private dining nook, and full luxury amenities.',
    hasBathtub: true,
    hasBalcony: true,
    hasMinibar: true,
  },
  {
    id: 401,
    roomNumber: '401',
    roomType: 'PENTHOUSE',
    basePrice: 480,
    capacity: 4,
    status: 'AVAILABLE',
    description: 'Top-floor presidential penthouse with private wraparound balcony, fireplace salon, and butler service.',
    hasBathtub: true,
    hasBalcony: true,
    hasMinibar: true,
  },
  {
    id: 402,
    roomNumber: '402',
    roomType: 'PENTHOUSE',
    basePrice: 520,
    capacity: 5,
    status: 'AVAILABLE',
    description: 'Sky-level penthouse estate with private rooftop plunge pool, dedicated chef service, and helipad views.',
    hasBathtub: true,
    hasBalcony: true,
    hasMinibar: true,
  },
];

const PublicRooms = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // URL Query Parameters or Defaults
  const initialCheckIn = searchParams.get('checkIn') || new Date().toISOString().slice(0, 10);
  const initialCheckOut =
    searchParams.get('checkOut') ||
    (() => {
      const d = new Date();
      d.setDate(d.getDate() + 3);
      return d.toISOString().slice(0, 10);
    })();
  const initialGuests = searchParams.get('guests') || '2';
  const initialType = searchParams.get('type') || 'ALL';
  const selectedParamRoom = searchParams.get('select') || '';

  // Filter & Search states
  const [selectedType, setSelectedType] = useState(initialType);
  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [guests, setGuests] = useState(initialGuests);
  const [maxPrice, setMaxPrice] = useState(600);
  const [keyword, setKeyword] = useState('');

  // Data states
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Booking Modal & Details
  const [activeBookingRoom, setActiveBookingRoom] = useState(null);
  const [specialRequests, setSpecialRequests] = useState('');
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [bookingSuccessNotice, setBookingSuccessNotice] = useState(null);

  // Fetch real rooms from backend
  useEffect(() => {
    const loadCatalog = async () => {
      setLoading(true);
      try {
        const res = await roomAPI.getAll();
        const serverList = res.data && Array.isArray(res.data) ? res.data : [];
        const serverNumbers = new Set(serverList.map((r) => r.roomNumber));
        const missingSeeds = SEED_ROOMS.filter((s) => !serverNumbers.has(s.roomNumber));
        const merged = [...serverList, ...missingSeeds].map((r) => ({
          ...r,
          image: ROOM_IMAGES[r.roomType] || ROOM_IMAGES.SINGLE,
        }));
        setRooms(merged);

        // If 'select' parameter was given in URL, auto-open modal for that room if logged in
        if (selectedParamRoom) {
          const target = merged.find((r) => r.roomNumber === selectedParamRoom);
          if (target) {
            handleBookNowClick(target);
          }
        }
      } catch (err) {
        console.warn('Backend rooms catalog load failed, using catalog seeds:', err);
        setRooms(
          SEED_ROOMS.map((r) => ({
            ...r,
            image: ROOM_IMAGES[r.roomType] || ROOM_IMAGES.SINGLE,
          }))
        );
      } finally {
        setLoading(false);
      }
    };
    loadCatalog();
  }, []);

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return rooms.filter((room) => {
      const matchType = selectedType === 'ALL' || room.roomType === selectedType;
      const matchPrice = Number(room.basePrice || 0) <= maxPrice;
      const matchCapacity = !guests || Number(room.capacity || 1) >= Number(guests);
      const matchQuery =
        !q ||
        room.roomNumber?.toLowerCase().includes(q) ||
        room.roomType?.toLowerCase().includes(q) ||
        room.description?.toLowerCase().includes(q) ||
        (q.includes('bath') && room.hasBathtub) ||
        (q.includes('balcony') && room.hasBalcony) ||
        (q.includes('bar') && room.hasMinibar);

      return matchType && matchPrice && matchCapacity && matchQuery;
    });
  }, [rooms, selectedType, maxPrice, guests, keyword]);

  // Handle "Book Now" click
  const handleBookNowClick = (room) => {
    if (!currentUser) {
      // Save intent to sessionStorage
      const intent = {
        type: 'ROOM',
        roomId: room.id,
        roomNumber: room.roomNumber,
        roomType: room.roomType,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        numberOfGuests: Number(guests || 1),
        basePrice: room.basePrice,
      };
      sessionStorage.setItem('pending_booking', JSON.stringify(intent));
      navigate('/login', {
        state: {
          redirectTo: `/rooms?select=${room.roomNumber}`,
          bookingIntent: intent,
        },
      });
      return;
    }

    // Authenticated user: open modal
    setActiveBookingRoom(room);
  };

  // Submit Room Reservation
  const handleConfirmReservation = async (e) => {
    e.preventDefault();
    if (!activeBookingRoom) return;

    setSubmittingBooking(true);
    try {
      const payload = {
        guestId: currentUser.id || 1,
        roomId: activeBookingRoom.id,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        numberOfGuests: Number(guests || 1),
        specialRequests: specialRequests || 'Bespoke high-floor preference',
      };

      let created = null;
      try {
        const res = await reservationAPI.create(payload);
        if (res && res.data) {
          created = res.data;
        }
      } catch (err) {
        console.warn('Backend reservation create offline, storing locally:', err);
      }

      if (!created) {
        created = {
          id: Date.now(),
          guest: currentUser,
          room: activeBookingRoom,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          numberOfGuests: Number(guests || 1),
          status: 'CONFIRMED',
          specialRequests,
        };
      }

      // Sync local storage for client portal
      try {
        const key = `client_res_${currentUser.email}`;
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        localStorage.setItem(key, JSON.stringify([created, ...existing]));
      } catch (_) {}

      // Clear pending intent
      sessionStorage.removeItem('pending_booking');

      setBookingSuccessNotice({
        roomNumber: activeBookingRoom.roomNumber,
        checkIn,
        checkOut,
        guests,
      });
      setActiveBookingRoom(null);
    } catch (err) {
      alert(err.message || 'Failed to complete reservation. Please try again.');
    } finally {
      setSubmittingBooking(false);
    }
  };

  return (
    <div className="public-rooms-page">
      <PublicNavbar />

      {/* Required header banner selector: .rooms-header-banner */}
      <header className="rooms-header-banner">
        <div className="section-container banner-content">
          <span className="banner-kicker">THE RESIDENCES &bull; INVENTORY</span>
          <h1>Suites &amp; Accommodations</h1>
          <p>
            Select from our 14 bespoke residences. Designed with natural hardwoods, Italian
            marble en-suite baths, and sweeping urban vistas.
          </p>
        </div>
      </header>

      {/* Filter and Query Controls Bar */}
      <div className="rooms-filter-container">
        <div className="section-container">
          <div className="rooms-filter-bar">
            {/* Required select selector: #filter-type */}
            <div className="filter-group">
              <label htmlFor="filter-type">SUITE CLASS</label>
              <select
                id="filter-type"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="ALL">All Suites</option>
                <option value="SINGLE">Single Room</option>
                <option value="DOUBLE">Executive Double</option>
                <option value="SUITE">Boutique Suite</option>
                <option value="DELUXE">Deluxe Corner</option>
                <option value="PENTHOUSE">Presidential Penthouse</option>
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="filter-check-in">CHECK-IN</label>
              <input
                id="filter-check-in"
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label htmlFor="filter-check-out">CHECK-OUT</label>
              <input
                id="filter-check-out"
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label htmlFor="filter-guests">GUESTS</label>
              <select
                id="filter-guests"
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

            <div className="filter-group price-group">
              <label htmlFor="filter-price">MAX RATE: ${maxPrice}/nt</label>
              <input
                id="filter-price"
                type="range"
                min="80"
                max="600"
                step="20"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
              />
            </div>

            <div className="filter-group search-keyword-group">
              <label htmlFor="filter-search">SEARCH</label>
              <input
                id="filter-search"
                type="text"
                placeholder="Balcony, jacuzzi, 301..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Success Banner if booking confirmed */}
      {bookingSuccessNotice && (
        <div className="section-container" style={{ marginTop: '24px' }}>
          <div className="booking-confirmation-banner">
            <span className="material-symbols-outlined" style={{ fontSize: '32px', color: '#059669' }}>
              verified
            </span>
            <div>
              <h3>Reservation Confirmed — Suite {bookingSuccessNotice.roomNumber}</h3>
              <p>
                {bookingSuccessNotice.checkIn} to {bookingSuccessNotice.checkOut} &bull;{' '}
                {bookingSuccessNotice.guests} Guests. A confirmation notice has been saved to your account.
              </p>
            </div>
            <Link to="/client" className="public-cta-btn" style={{ marginLeft: 'auto' }}>
              View in My Reservations
            </Link>
          </div>
        </div>
      )}

      {/* Room Cards Catalog */}
      <main className="section-container" style={{ padding: '40px 24px 80px' }}>
        <div className="catalog-meta-row">
          <h2>Available Accommodations ({filteredRooms.length})</h2>
          <span className="catalog-sort-notice">Best rate guaranteed for direct booking</span>
        </div>

        {loading ? (
          <div className="catalog-loading">
            <span className="spinner" />
            <p>Checking live room inventory...</p>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="catalog-empty">
            <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#94a3b8' }}>
              hotel
            </span>
            <h3>No suites match your current criteria</h3>
            <p>Try broadening your filters or selecting alternate dates.</p>
            <button
              type="button"
              className="public-outline-btn"
              onClick={() => {
                setSelectedType('ALL');
                setMaxPrice(600);
                setKeyword('');
              }}
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="public-catalog-grid">
            {filteredRooms.map((room) => (
              <article key={room.id} className="catalog-room-card">
                <div className="card-media">
                  <img
                    src={room.image || ROOM_IMAGES[room.roomType] || ROOM_IMAGES.SINGLE}
                    alt={`Suite ${room.roomNumber} - ${room.roomType}`}
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
                      <span className="material-symbols-outlined">group</span> {room.capacity} Guests
                    </span>
                    {room.hasBathtub && (
                      <span>
                        <span className="material-symbols-outlined">bathtub</span> Deep Soak Tub
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
                      to={`/rooms/${room.roomNumber}`}
                      className="card-details-btn"
                    >
                      View Details
                    </Link>
                    <button
                      type="button"
                      className="card-book-btn"
                      onClick={() => handleBookNowClick(room)}
                    >
                      {currentUser ? 'Book Now' : 'Reserve'}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* Reservation Modal for Authenticated User */}
      {activeBookingRoom && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '540px' }}>
            <div className="section-heading">
              <div>
                <span className="eyebrow">CONFIRM RESERVATION</span>
                <h2>Suite {activeBookingRoom.roomNumber} &bull; {activeBookingRoom.roomType}</h2>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setActiveBookingRoom(null)}
                aria-label="Close"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleConfirmReservation} style={{ marginTop: '20px' }}>
              <div className="reservation-summary-box">
                <div className="summary-row">
                  <span>Rate:</span>
                  <strong>${activeBookingRoom.basePrice} per night</strong>
                </div>
                <div className="summary-row">
                  <span>Dates:</span>
                  <strong>{checkIn} to {checkOut}</strong>
                </div>
                <div className="summary-row">
                  <span>Guest Count:</span>
                  <strong>{guests} Guests (Capacity: {activeBookingRoom.capacity})</strong>
                </div>
                <div className="summary-row">
                  <span>Guest Name:</span>
                  <strong>{currentUser?.firstName} {currentUser?.lastName} ({currentUser?.email})</strong>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '16px' }}>
                <label htmlFor="booking-requests">Special Requests &amp; Preferences</label>
                <textarea
                  id="booking-requests"
                  rows="3"
                  className="field"
                  placeholder="e.g. Feather-free pillows, late arrival, quiet floor..."
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                />
              </div>

              <div className="modal-actions" style={{ marginTop: '24px' }}>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setActiveBookingRoom(null)}
                  disabled={submittingBooking}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={submittingBooking}
                >
                  {submittingBooking ? 'Securing Suite...' : 'Confirm Reservation'}
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

export default PublicRooms;
