import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';
import { roomAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { withRoomImage } from '../utils/propertyImages';
import { goToReserve } from '../utils/reserve';

// Guest room & bed photography by room type

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

  // Booking state — the public catalogue only *browses*; reserving happens in the client area.
  const [catalogError, setCatalogError] = useState('');
  const [roomTypeOptions, setRoomTypeOptions] = useState([]);

  // Fetch real rooms from the backend. The database is the single source of truth.
  const loadCatalog = async () => {
    setLoading(true);
    setCatalogError('');
    try {
      const res = await roomAPI.getAll();
      const serverList = res.data && Array.isArray(res.data) ? res.data : [];
      setRooms(serverList.map(withRoomImage));
      setRoomTypeOptions(
        Array.from(new Set(serverList.map((r) => r.roomType).filter(Boolean))).sort()
      );
    } catch (err) {
      setRooms([]);
      setCatalogError(
        err?.response?.data?.message ||
          'We could not load the room catalogue. Please check your connection and retry.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When arriving from the landing page search with ?select=<roomNumber>,
  // send the visitor straight into the reservation flow for that room.
  useEffect(() => {
    if (!selectedParamRoom || rooms.length === 0) return;
    const target = rooms.find((r) => String(r.roomNumber) === String(selectedParamRoom));
    if (target) {
      goToReserve(navigate, {
        user: currentUser,
        target: '/client?tab=book',
        intent: {
          type: 'ROOM',
          roomId: target.id,
          roomNumber: target.roomNumber,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          numberOfGuests: Number(guests || 1),
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rooms, selectedParamRoom]);

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

  // ── Reserve a room ──────────────────────────────────────────────────────
  // The public catalogue never creates reservations (and never fabricates a
  // "CONFIRMED" record). Visitors are sent to sign in; authenticated clients
  // continue into the reservation flow on the client area.
  const handleReserveRoom = (room) =>
    goToReserve(navigate, {
      user: currentUser,
      target: '/client?tab=book',
      intent: {
        type: 'ROOM',
        roomId: room.id,
        roomNumber: room.roomNumber,
        roomType: room.roomType,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        numberOfGuests: Number(guests || 1),
      },
    });

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

      {/* API error state with retry */}
      {catalogError && (
        <div className="section-container" style={{ marginTop: '24px' }}>
          <div className="api-error-state" role="alert">
            <span className="material-symbols-outlined">cloud_off</span>
            <h3>We couldn&apos;t load our accommodations</h3>
            <p>{catalogError}</p>
            <button type="button" className="public-cta-btn" onClick={loadCatalog}>
              Try Again
            </button>
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
            <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--muted)' }}>
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
                    src={room.image}
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
                      onClick={() => handleReserveRoom(room)}
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

      <PublicFooter />
    </div>
  );
};

export default PublicRooms;
