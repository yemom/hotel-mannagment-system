import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';
import { roomAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { withRoomImage } from '../utils/propertyImages';
import { goToReserve } from '../utils/reserve';

const GALLERY_IMAGES = {
  SINGLE: [
    'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1566195992011-5f6b21e539aa?auto=format&fit=crop&w=800&q=80',
  ],
  DOUBLE: [
    'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1609949080158-9d7cc7d601a1?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1630585983312-2b9c3b1e46f2?auto=format&fit=crop&w=800&q=80',
  ],
  SUITE: [
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80',
  ],
  DELUXE: [
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=800&q=80',
  ],
  PENTHOUSE: [
    'https://images.unsplash.com/photo-1561501900-3701fa6a0864?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80',
  ],
};

const AMENITIES_BY_TYPE = {
  SINGLE: ['King Bed', 'En-Suite Bathroom', 'High-Speed WiFi', 'Smart TV', 'Air Conditioning', 'In-Room Safe', 'Coffee Maker', 'Daily Housekeeping'],
  DOUBLE: ['Two Queen Beds', 'Dual Vanity Bathroom', 'High-Speed WiFi', 'Smart TV', 'Mini Refrigerator', 'In-Room Safe', 'Coffee & Tea Station', 'Concierge Service'],
  SUITE: ['King Master Bed', 'Separate Living Area', 'Italian Marble Bathroom', 'Bathtub & Rain Shower', 'Premium WiFi', '4K Smart TV', 'Minibar', 'Butler On-Call', 'Evening Turndown'],
  DELUXE: ['King Bed', 'Walk-In Closet', 'Soaking Tub', 'Double Rain Showers', 'Premium Minibar', 'Smart Home Controls', 'Nespresso Machine', 'Panoramic Windows', 'Evening Canape Service'],
  PENTHOUSE: ['Master King Suite', 'Private Wraparound Terrace', 'Private Plunge Pool', 'Full Kitchen', 'Private Dining Room', 'Home Cinema', 'Dedicated Butler', 'Champagne Welcome', 'Complimentary Spa Credit'],
};

// Seed rooms in case backend is unavailable

const RoomDetail = () => {
  const { id } = useParams(); // id can be room number like "401" or numeric DB id
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [activeImg, setActiveImg] = useState(0);

  // Booking form state
  const [checkIn, setCheckIn] = useState(() => new Date().toISOString().slice(0, 10));
  const [checkOut, setCheckOut] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().slice(0, 10);
  });
  const [guests, setGuests] = useState('1');
  const [specialRequests, setSpecialRequests] = useState('');

  // Load the suite from the backend only — no seeded fallbacks.
  const loadRoom = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await roomAPI.getAll();
      const all = res.data && Array.isArray(res.data) ? res.data : [];
      const found = all.find((r) => r.roomNumber === id || String(r.id) === id);
      if (found) {
        setRoom(withRoomImage(found));
        setGuests(String(found.capacity || 1));
      } else {
        setRoom(null);
      }
    } catch (err) {
      setRoom(null);
      setLoadError(
        err?.response?.data?.message ||
          'We could not load this suite from the reservation service. Please retry.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const nights = Math.max(1, Math.ceil(
    (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)
  ));

  /**
   * Reservation is only ever created inside the authenticated client area, so a
   * visitor is routed to sign in (carrying their dates + selected suite), while
   * an authenticated client continues straight into the client booking flow.
   */
  const handleReserve = (e) => {
    e.preventDefault();
    if (!room) return;
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
        numberOfGuests: Number(guests),
        specialRequests: specialRequests || null,
      },
    });
  };

  if (loading) {
    return (
      <div className="public-rooms-page">
        <PublicNavbar />
        <div style={{ paddingTop: '120px', textAlign: 'center', color: 'var(--muted)', minHeight: '60vh' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 40, animation: 'spin 1s linear infinite' }}>refresh</span>
          <p style={{ marginTop: 12 }}>Loading suite details…</p>
        </div>
        <PublicFooter />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="public-rooms-page">
        <PublicNavbar />
        <div style={{ paddingTop: '140px', textAlign: 'center', minHeight: '60vh', padding: '140px 24px 80px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 56, color: 'var(--surface-line)' }}>hotel</span>
          <h2 style={{ margin: '16px 0 8px', color: 'var(--text)' }}>Suite Not Found</h2>
          <p style={{ color: 'var(--muted)', marginBottom: 24 }}>We couldn't locate room "{id}". It may have been updated.</p>
          <Link to="/rooms" className="public-cta-btn">Browse All Rooms</Link>
        </div>
        <PublicFooter />
      </div>
    );
  }

  const gallery = [room.image, ...(GALLERY_IMAGES[room.roomType] || [])];
  const amenities = AMENITIES_BY_TYPE[room.roomType] || [];

  return (
    <div className="public-rooms-page">
      <PublicNavbar />

      {/* Breadcrumb */}
      <nav className="rd-breadcrumb">
        <div className="rd-breadcrumb-inner">
          <Link to="/">Home</Link>
          <span className="material-symbols-outlined">chevron_right</span>
          <Link to="/rooms">Rooms</Link>
          <span className="material-symbols-outlined">chevron_right</span>
          <span>Suite {room.roomNumber}</span>
        </div>
      </nav>

      {/* Main Layout */}
      <div className="rd-layout">
        <div className="rd-content">
          {/* Gallery */}
          <div className="rd-gallery">
            <div className="rd-gallery-main">
              <img src={gallery[activeImg]} alt={`Suite ${room.roomNumber}`} />
              <span className={`rd-status-badge ${room.status === 'AVAILABLE' ? 'badge-available' : 'badge-occupied'}`}>
                {room.status === 'AVAILABLE' ? 'Available' : room.status}
              </span>
            </div>
            {gallery.length > 1 && (
              <div className="rd-gallery-thumbs">
                {gallery.map((src, i) => (
                  <button
                    key={i}
                    className={`rd-thumb${i === activeImg ? ' active' : ''}`}
                    onClick={() => setActiveImg(i)}
                    aria-label={`View photo ${i + 1}`}
                  >
                    <img src={src} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="rd-details">
            <div className="rd-details-header">
              <div>
                <span className="rd-type-badge">{room.roomType}</span>
                <h1>Suite {room.roomNumber}</h1>
                <p className="rd-desc">{room.description}</p>
              </div>
              <div className="rd-price-block">
                <span className="rd-price">${room.basePrice}</span>
                <span className="rd-price-unit">/night</span>
              </div>
            </div>

            {/* Quick features */}
            <div className="rd-features">
              <div className="rd-feature">
                <span className="material-symbols-outlined">group</span>
                <div>
                  <strong>Up to {room.capacity} Guests</strong>
                  <span>Capacity</span>
                </div>
              </div>
              {room.hasBathtub && (
                <div className="rd-feature">
                  <span className="material-symbols-outlined">bathtub</span>
                  <div>
                    <strong>Deep Soaking Tub</strong>
                    <span>Bathroom</span>
                  </div>
                </div>
              )}
              {room.hasBalcony && (
                <div className="rd-feature">
                  <span className="material-symbols-outlined">balcony</span>
                  <div>
                    <strong>Private Balcony</strong>
                    <span>Outdoor</span>
                  </div>
                </div>
              )}
              {room.hasMinibar && (
                <div className="rd-feature">
                  <span className="material-symbols-outlined">wine_bar</span>
                  <div>
                    <strong>Artisan Minibar</strong>
                    <span>In-Room</span>
                  </div>
                </div>
              )}
            </div>

            {/* Amenities */}
            <div className="rd-amenities">
              <h3>Suite Inclusions</h3>
              <ul className="rd-amenities-list">
                {amenities.map((a) => (
                  <li key={a}>
                    <span className="material-symbols-outlined">check_circle</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Booking Sidebar */}
        <aside className="rd-sidebar">
          <div className="rd-booking-card">
            <h2 className="rd-booking-title">
              {currentUser ? 'Reserve This Suite' : 'Check Availability'}
            </h2>
            <p className="rd-booking-subtitle">
              Best rate guaranteed for direct booking
            </p>

            <form onSubmit={handleReserve} className="rd-booking-form">
                {loadError && (
                  <div className="auth-alert auth-alert-error" role="alert" style={{ marginBottom: 14 }}>
                    <span className="material-symbols-outlined">error</span>
                    <span>{loadError}</span>
                  </div>
                )}

                <div className="rd-date-row">
                  <div className="form-group">
                    <label htmlFor="rd-checkin">Check-In</label>
                    <input
                      id="rd-checkin"
                      type="date"
                      value={checkIn}
                      min={new Date().toISOString().slice(0, 10)}
                      onChange={(e) => setCheckIn(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="rd-checkout">Check-Out</label>
                    <input
                      id="rd-checkout"
                      type="date"
                      value={checkOut}
                      min={checkIn}
                      onChange={(e) => setCheckOut(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="rd-guests">Guests</label>
                  <select
                    id="rd-guests"
                    value={guests}
                    onChange={(e) => setGuests(e.target.value)}
                  >
                    {Array.from({ length: room.capacity }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>{n} Guest{n > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>

                {currentUser && (
                  <div className="form-group">
                    <label htmlFor="rd-requests">Special Requests</label>
                    <textarea
                      id="rd-requests"
                      rows="2"
                      className="field"
                      placeholder="High floor, feather-free pillows, late checkout…"
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                    />
                  </div>
                )}

                {/* Price Summary */}
                <div className="rd-price-summary">
                  <div className="rd-price-row">
                    <span>${room.basePrice} × {nights} night{nights > 1 ? 's' : ''}</span>
                    <span>${(room.basePrice * nights).toLocaleString()}</span>
                  </div>
                  <div className="rd-price-row rd-price-row--total">
                    <strong>Total</strong>
                    <strong>${(room.basePrice * nights).toLocaleString()}</strong>
                  </div>
                </div>

                <button
                  type="submit"
                  className="public-cta-btn rd-reserve-btn"
                  disabled={room.status !== 'AVAILABLE'}
                >
                  {room.status !== 'AVAILABLE'
                    ? 'Currently Unavailable'
                    : currentUser
                    ? 'Continue to Reservation'
                    : 'Reserve Now — Login Required'}
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>

                {!currentUser && (
                  <p className="rd-auth-notice">
                    <span className="material-symbols-outlined">lock</span>
                    You'll be asked to sign in to complete the reservation. Your dates and room will be saved.
                  </p>
                )}
              </form>
          </div>

          {/* Need Help */}
          <div className="rd-help-card">
            <span className="material-symbols-outlined">support_agent</span>
            <div>
              <strong>Need Assistance?</strong>
              <p>Our concierge team is available 24/7.</p>
              <Link to="/contact" className="rd-help-link">Contact Concierge →</Link>
            </div>
          </div>
        </aside>
      </div>

      <PublicFooter />
    </div>
  );
};

export default RoomDetail;
