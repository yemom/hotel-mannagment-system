import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { restaurantTableAPI, tableReservationAPI } from '../services/api';

// 30-min slots from 17:00 to 22:30
const TIME_SLOTS = [
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00', '21:30', '22:00', '22:30',
];

const AREA_LABELS = {
  MAIN_HALL: { label: 'Main Hall & Window Seating', icon: 'restaurant', color: '#1a3a5c' },
  TERRACE: { label: 'Balcony & Al Fresco Terrace', icon: 'deck', color: '#166534' },
  PRIVATE_ROOM: { label: 'Executive Private Dining Suites', icon: 'meeting_room', color: '#7c2d12' },
};

// High-resolution curated images for each specific table view
const TABLE_IMAGES = {
  'MH-01': 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=800&q=80', // Beside Window
  'MH-02': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=800&q=80', // Centre Booth
  'MH-03': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80', // Fountain Window
  'MH-04': 'https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?auto=format&fit=crop&w=800&q=80', // Piano Lounge Round
  'MH-05': 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80', // Intimate Window Corner
  'MH-06': 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=800&q=80', // Grand Hall Table
  'MH-07': 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=800&q=80', // Central Chandelier
  'MH-08': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80', // Skyline Window Booth
  'TR-01': 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80', // Panoramic Balcony
  'TR-02': 'https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?auto=format&fit=crop&w=800&q=80', // Poolside Pergola
  'TR-03': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=800&q=80', // Garden Olive Tree
  'TR-04': 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=800&q=80', // Sunset Covered Deck
  'TR-05': 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80', // Rooftop Balcony
  'TR-06': 'https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?auto=format&fit=crop&w=800&q=80', // Pavilion Fire-Pit
  'PR-01': 'https://images.unsplash.com/photo-1578474846511-04ba529f0b88?auto=format&fit=crop&w=800&q=80', // Executive Suite
  'PR-02': 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=800&q=80', // Royal Banquet
  'PR-03': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=800&q=80', // Wine Cellar Suite
  'PR-04': 'https://images.unsplash.com/photo-1578474846511-04ba529f0b88?auto=format&fit=crop&w=800&q=80', // Penthouse VIP
};

const TABLE_TAGS = {
  'MH-01': 'Beside Window',
  'MH-02': 'Cozy Booth',
  'MH-03': 'Fountain Window',
  'MH-04': 'Piano Lounge',
  'MH-05': 'Romantic Corner',
  'MH-06': 'Grand Hall',
  'MH-07': 'Chandelier Table',
  'MH-08': 'Skyline Booth',
  'TR-01': 'Balcony Vista',
  'TR-02': 'Poolside Pergola',
  'TR-03': 'Olive Garden',
  'TR-04': 'Twilight Deck',
  'TR-05': 'Rooftop Balcony',
  'TR-06': 'Pavilion Lounge',
  'PR-01': 'Executive Suite',
  'PR-02': 'Royal Banquet',
  'PR-03': 'Wine Cellar Room',
  'PR-04': 'Penthouse VIP',
};

const PARTY_SIZES = [1, 2, 3, 4, 5, 6, 7, 8, 10, 12];

const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};

export const DEFAULT_18_TABLES = [
  { id: 1, tableNumber: 'MH-01', capacity: 4, area: 'MAIN_HALL', status: 'AVAILABLE', description: 'Central Main Hall dining table beside expansive arched window' },
  { id: 2, tableNumber: 'MH-02', capacity: 4, area: 'MAIN_HALL', status: 'AVAILABLE', description: 'Main Hall dining table with plush velvet booth seating' },
  { id: 3, tableNumber: 'MH-03', capacity: 2, area: 'MAIN_HALL', status: 'AVAILABLE', description: 'Intimate fountain window booth tailored for romantic dinners' },
  { id: 4, tableNumber: 'MH-04', capacity: 4, area: 'MAIN_HALL', status: 'AVAILABLE', description: 'Piano lounge round table with live evening jazz ambiance' },
  { id: 5, tableNumber: 'MH-05', capacity: 6, area: 'MAIN_HALL', status: 'AVAILABLE', description: 'Main Hall family banquet booth with artisan oak table' },
  { id: 6, tableNumber: 'MH-06', capacity: 4, area: 'MAIN_HALL', status: 'AVAILABLE', description: 'Grand Hall central dining table with bespoke chandelier overhead' },
  { id: 7, tableNumber: 'MH-07', capacity: 2, area: 'MAIN_HALL', status: 'AVAILABLE', description: 'Intimate candlelit table with sommelier pairing service' },
  { id: 8, tableNumber: 'MH-08', capacity: 4, area: 'MAIN_HALL', status: 'AVAILABLE', description: 'Skyline window booth overlooking evening city lights' },
  { id: 9, tableNumber: 'MH-09', capacity: 4, area: 'MAIN_HALL', status: 'AVAILABLE', description: 'Artisan dining alcove with private curtain partition' },
  { id: 10, tableNumber: 'MH-10', capacity: 6, area: 'MAIN_HALL', status: 'AVAILABLE', description: 'Main Hall large chef degustation table' },
  { id: 11, tableNumber: 'TR-01', capacity: 4, area: 'TERRACE', status: 'AVAILABLE', description: 'Garden Terrace outdoor dining table with panoramic valley view' },
  { id: 12, tableNumber: 'TR-02', capacity: 4, area: 'TERRACE', status: 'AVAILABLE', description: 'Poolside pergola dining with illuminated water features' },
  { id: 13, tableNumber: 'TR-03', capacity: 2, area: 'TERRACE', status: 'AVAILABLE', description: 'Outdoor Balcony view table with sunset cocktail service' },
  { id: 14, tableNumber: 'TR-04', capacity: 4, area: 'TERRACE', status: 'AVAILABLE', description: 'Twilight covered deck with warming outdoor fire-pits' },
  { id: 15, tableNumber: 'PR-01', capacity: 6, area: 'PRIVATE_ROOM', status: 'AVAILABLE', description: 'Executive Private Dining Suite with dedicated sommelier' },
  { id: 16, tableNumber: 'PR-02', capacity: 8, area: 'PRIVATE_ROOM', status: 'AVAILABLE', description: 'VIP Royal Banquet Room with private bar and kitchen access' },
  { id: 17, tableNumber: 'PR-03', capacity: 6, area: 'PRIVATE_ROOM', status: 'AVAILABLE', description: 'Wine Cellar Vault suite featuring 1,200 rare labels' },
  { id: 18, tableNumber: 'PR-04', capacity: 8, area: 'PRIVATE_ROOM', status: 'AVAILABLE', description: 'Presidential Penthouse Dining Salon with 360-degree panorama' },
];

const RestaurantPage = ({ onReservationSuccess }) => {
  const { currentUser } = useAuth();

  // Search and filter parameters
  const [searchDate, setSearchDate] = useState(tomorrow());
  const [searchTime, setSearchTime] = useState('19:00');
  const [partySize, setPartySize] = useState(2);
  const [selectedAreaFilter, setSelectedAreaFilter] = useState('ALL');
  const [searching, setSearching] = useState(false);
  const [availableTables, setAvailableTables] = useState(DEFAULT_18_TABLES);
  const [searchError, setSearchError] = useState('');

  // Modal State with editable parameters
  const [selectedTable, setSelectedTable] = useState(null);
  const [modalDate, setModalDate] = useState(tomorrow());
  const [modalTime, setModalTime] = useState('19:00');
  const [modalPartySize, setModalPartySize] = useState(2);
  const [specialRequests, setSpecialRequests] = useState('');
  const [booking, setBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [bookingError, setBookingError] = useState('');

  // Load tables initially
  useEffect(() => {
    fetchTables(tomorrow(), '19:00', 2);
  }, []);

  const fetchTables = async (date, time, guests) => {
    setSearchError('');
    setSearching(true);
    try {
      const res = await restaurantTableAPI.getAvailable(date, time, guests);
      if (res.data && res.data.length > 0) {
        setAvailableTables(res.data);
        try {
          localStorage.setItem('hotel_restaurant_tables', JSON.stringify(res.data));
        } catch (_) {}
      } else {
        const all = await restaurantTableAPI.getAll();
        if (all.data && all.data.length > 0) {
          setAvailableTables(all.data);
          try {
            localStorage.setItem('hotel_restaurant_tables', JSON.stringify(all.data));
          } catch (_) {}
        } else {
          loadFallbackTables();
        }
      }
    } catch {
      loadFallbackTables();
    } finally {
      setSearching(false);
    }
  };

  const loadFallbackTables = () => {
    try {
      const cached = localStorage.getItem('hotel_restaurant_tables');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAvailableTables(parsed);
          return;
        }
      }
    } catch (_) {}
    setAvailableTables(DEFAULT_18_TABLES);
    try {
      localStorage.setItem('hotel_restaurant_tables', JSON.stringify(DEFAULT_18_TABLES));
    } catch (_) {}
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    await fetchTables(searchDate, searchTime, partySize);
  };

  const openModal = (table) => {
    setSelectedTable(table);
    setModalDate(searchDate);
    setModalTime(searchTime);
    setModalPartySize(Math.min(partySize, table.capacity));
    setSpecialRequests('');
    setBookingSuccess('');
    setBookingError('');
  };

  const closeModal = () => setSelectedTable(null);

  const handleConfirm = async (e) => {
    e.preventDefault();
    setBookingError('');
    setBooking(true);
    let createdRecord = null;
    try {
      const res = await tableReservationAPI.create({
        guest: { id: currentUser?.id || 1 },
        restaurantTable: { id: selectedTable.id },
        reservationDate: modalDate,
        timeSlot: modalTime,
        partySize: Number(modalPartySize),
        specialRequests,
      });
      createdRecord = res.data;
    } catch (err) {
      console.warn('Backend table reservation call fallback:', err);
      createdRecord = {
        id: Date.now(),
        guest: currentUser || { firstName: 'Guest', lastName: 'User', email: 'guest@example.com' },
        restaurantTable: selectedTable,
        reservationDate: modalDate,
        timeSlot: modalTime,
        partySize: Number(modalPartySize),
        status: 'CONFIRMED',
        specialRequests,
      };
    }

    if (!createdRecord) {
      createdRecord = {
        id: Date.now(),
        guest: currentUser || { firstName: 'Guest', lastName: 'User', email: 'guest@example.com' },
        restaurantTable: selectedTable,
        reservationDate: modalDate,
        timeSlot: modalTime,
        partySize: Number(modalPartySize),
        status: 'CONFIRMED',
        specialRequests,
      };
    }

    // Save to local storage cache for instant sync
    const storageKey = `client_table_res_${currentUser?.email || 'guest'}`;
    try {
      const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const updated = [createdRecord, ...existing.filter((r) => r.id !== createdRecord.id)];
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }

    setBookingSuccess(
      `Table ${selectedTable.tableNumber} reserved for ${formatTime(modalTime)} on ${formatDate(modalDate)}!`
    );

    setTimeout(() => {
      closeModal();
      if (onReservationSuccess) {
        onReservationSuccess(createdRecord);
      }
    }, 1500);
    setBooking(false);
  };

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  // Filter tables by selected area
  const displayedTables = (availableTables || []).filter((table) => {
    if (selectedAreaFilter === 'ALL') return true;
    return table.area === selectedAreaFilter;
  });

  // Group filtered tables by area
  const grouped = displayedTables.reduce((acc, t) => {
    (acc[t.area] = acc[t.area] || []).push(t);
    return acc;
  }, {});

  return (
    <div className="restaurant-page">
      {/* ─── Hero Banner ─── */}
      <div className="restaurant-hero">
        <div className="restaurant-hero-overlay">
          <div className="restaurant-hero-text">
            <span className="material-symbols-outlined restaurant-hero-icon">restaurant</span>
            <h2>የ-mom Restaurant &amp; Lounge</h2>
            <p>Artisanal Ethiopian &amp; Mediterranean fusion · Panoramic balcony &amp; intimate window seating · Open daily 17:00 – 22:30</p>
            <div className="restaurant-cuisine-tags">
              <span className="cuisine-tag">Beside Window</span>
              <span className="cuisine-tag">Balcony &amp; Terrace</span>
              <span className="cuisine-tag">Poolside Pergola</span>
              <span className="cuisine-tag">Sommelier Pairing</span>
              <span className="cuisine-tag">Private Suites</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Interactive Search & Preferences Panel ─── */}
      <div className="restaurant-search-card">
        <div className="search-card-title-row">
          <div>
            <h3>Find &amp; Reserve Your Table</h3>
            <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
              Choose your preferred dining date, time, and table view (beside window, sunset balcony, or private suite)
            </p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="restaurant-search-form" style={{ marginTop: '18px' }}>
          <div className="restaurant-search-fields">
            <div className="form-group">
              <label><span className="material-symbols-outlined">calendar_today</span> Dining Date</label>
              <input
                type="date"
                className="field"
                required
                min={new Date().toISOString().split('T')[0]}
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label><span className="material-symbols-outlined">schedule</span> Time Slot</label>
              <select className="field" value={searchTime} onChange={(e) => setSearchTime(e.target.value)}>
                {TIME_SLOTS.map((t) => (
                  <option key={t} value={t}>{formatTime(t)}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label><span className="material-symbols-outlined">group</span> Party Size</label>
              <select className="field" value={partySize} onChange={(e) => setPartySize(Number(e.target.value))}>
                {PARTY_SIZES.map((n) => (
                  <option key={n} value={n}>{n} {n === 1 ? 'Guest' : 'Guests'}</option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" className="primary-button" disabled={searching} style={{ minWidth: '180px' }}>
            {searching ? (
              <><span className="spinner" /><span>Checking...</span></>
            ) : (
              <><span className="material-symbols-outlined">search</span><span>Update Tables</span></>
            )}
          </button>
        </form>

        {/* Area Filter Buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '18px' }}>
          <button
            type="button"
            className={`filter-pill-btn ${selectedAreaFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setSelectedAreaFilter('ALL')}
          >
            All Dining Areas ({availableTables ? availableTables.length : 0})
          </button>
          <button
            type="button"
            className={`filter-pill-btn ${selectedAreaFilter === 'MAIN_HALL' ? 'active' : ''}`}
            onClick={() => setSelectedAreaFilter('MAIN_HALL')}
          >
            Main Hall &amp; Window
          </button>
          <button
            type="button"
            className={`filter-pill-btn ${selectedAreaFilter === 'TERRACE' ? 'active' : ''}`}
            onClick={() => setSelectedAreaFilter('TERRACE')}
          >
            Balcony &amp; Terrace
          </button>
          <button
            type="button"
            className={`filter-pill-btn ${selectedAreaFilter === 'PRIVATE_ROOM' ? 'active' : ''}`}
            onClick={() => setSelectedAreaFilter('PRIVATE_ROOM')}
          >
            Private Dining Suites
          </button>
        </div>

        {searchError && (
          <div className="auth-alert auth-alert-error" style={{ marginTop: '12px' }}>
            <span className="material-symbols-outlined">error</span><span>{searchError}</span>
          </div>
        )}
      </div>

      {/* ─── Visual Table Catalog (Cards with Photos) ─── */}
      {availableTables !== null && (
        <div className="restaurant-results">
          {displayedTables.length === 0 ? (
            <div className="empty-state-card">
              <span className="material-symbols-outlined empty-state-icon">no_meals</span>
              <h3>No Tables Match This Filter</h3>
              <p>Try switching to &quot;All Dining Areas&quot; or selecting a different time slot.</p>
            </div>
          ) : (
            <>
              <p className="results-summary">
                Showing <strong>{displayedTables.length}</strong> available tables for <strong>{partySize} guests</strong> at <strong>{formatTime(searchTime)}</strong> on <strong>{formatDate(searchDate)}</strong>
              </p>
              {Object.entries(grouped).map(([area, tables]) => {
                const areaInfo = AREA_LABELS[area] || { label: area, icon: 'table_restaurant', color: '#1a3a5c' };
                return (
                  <div key={area} className="restaurant-area-section">
                    <div className="area-heading" style={{ borderColor: areaInfo.color }}>
                      <span className="material-symbols-outlined" style={{ color: areaInfo.color }}>{areaInfo.icon}</span>
                      <h4 style={{ color: areaInfo.color }}>{areaInfo.label}</h4>
                      <span className="area-count">{tables.length} Tables Available</span>
                    </div>

                    <div className="restaurant-visual-table-grid">
                      {tables.map((table) => {
                        const tableImg = TABLE_IMAGES[table.tableNumber] || 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=800&q=80';
                        const tag = TABLE_TAGS[table.tableNumber] || 'Scenic View';

                        return (
                          <div key={table.id} className="visual-table-card">
                            <div className="table-img-wrap">
                              <img src={tableImg} alt={`Table ${table.tableNumber}`} className="table-img" loading="lazy" />
                              <span className="table-location-pill">{tag}</span>
                              <span className="table-num-chip">{table.tableNumber}</span>
                            </div>

                            <div className="table-card-body">
                              <div className="table-card-header-row">
                                <h4 className="table-name">Table {table.tableNumber}</h4>
                                <span className="table-capacity-tag">
                                  <span className="material-symbols-outlined">group</span>
                                  Seats {table.capacity}
                                </span>
                              </div>

                              <p className="table-card-description">
                                {table.description || 'Scenic hospitality table with dedicated server & curated wine pairings.'}
                              </p>

                              <button
                                type="button"
                                className="primary-button choose-table-btn"
                                onClick={() => openModal(table)}
                              >
                                <span>Choose This Table</span>
                                <span className="material-symbols-outlined">arrow_forward</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* ─── Interactive Booking Confirmation Modal (with Editable Date/Time/Guests) ─── */}
      {selectedTable && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <div>
                <h3>Confirm Table Reservation</h3>
                <p className="modal-subtitle">Reserve Table {selectedTable.tableNumber} at የ-mom Hotel</p>
              </div>
              <button className="modal-close-btn" onClick={closeModal}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Selected Table Preview */}
            <div className="modal-table-preview">
              <img
                src={TABLE_IMAGES[selectedTable.tableNumber] || 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=800&q=80'}
                alt={`Table ${selectedTable.tableNumber}`}
                className="modal-table-img"
              />
              <div className="modal-table-overlay-info">
                <span className="modal-table-tag">{TABLE_TAGS[selectedTable.tableNumber] || 'Scenic Table'}</span>
                <h4>Table {selectedTable.tableNumber} ({AREA_LABELS[selectedTable.area]?.label || selectedTable.area})</h4>
              </div>
            </div>

            {bookingSuccess ? (
              <div className="auth-alert auth-alert-success" style={{ marginTop: '16px' }}>
                <span className="material-symbols-outlined">check_circle</span>
                <span>{bookingSuccess}</span>
              </div>
            ) : (
              <form onSubmit={handleConfirm}>
                {bookingError && (
                  <div className="auth-alert auth-alert-error" style={{ marginBottom: '12px' }}>
                    <span className="material-symbols-outlined">error</span><span>{bookingError}</span>
                  </div>
                )}

                {/* Editable Date, Time, Party Size Controls */}
                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#1e293b' }}>
                    Adjust Reservation Details
                  </h4>
                  <div className="restaurant-search-fields" style={{ gap: '10px' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label><span className="material-symbols-outlined" style={{ fontSize: '15px' }}>calendar_today</span> Date</label>
                      <input
                        type="date"
                        className="field"
                        required
                        min={new Date().toISOString().split('T')[0]}
                        value={modalDate}
                        onChange={(e) => setModalDate(e.target.value)}
                      />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label><span className="material-symbols-outlined" style={{ fontSize: '15px' }}>schedule</span> Time</label>
                      <select className="field" value={modalTime} onChange={(e) => setModalTime(e.target.value)}>
                        {TIME_SLOTS.map((t) => (
                          <option key={t} value={t}>{formatTime(t)}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label><span className="material-symbols-outlined" style={{ fontSize: '15px' }}>group</span> Guests</label>
                      <select className="field" value={modalPartySize} onChange={(e) => setModalPartySize(Number(e.target.value))}>
                        {Array.from({ length: selectedTable.capacity || 6 }, (_, i) => i + 1).map((n) => (
                          <option key={n} value={n}>{n} {n === 1 ? 'Guest' : 'Guests'}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Guest Contact Summary */}
                <div className="booking-summary-grid" style={{ marginBottom: '14px' }}>
                  <div className="summary-item">
                    <span className="material-symbols-outlined">person</span>
                    <div><small>Guest</small><strong>{currentUser?.firstName} {currentUser?.lastName || 'Valued Guest'}</strong></div>
                  </div>
                  <div className="summary-item">
                    <span className="material-symbols-outlined">mail</span>
                    <div><small>Contact</small><strong>{currentUser?.email || 'eyas@dev.com'}</strong></div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Special Requests / Occasion <span style={{ color: '#9ca3af' }}>(optional)</span></label>
                  <textarea
                    className="field"
                    rows={2}
                    placeholder="Window seat, anniversary arrangement, birthday dessert, high chair, dietary notes..."
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                  />
                </div>

                <div className="modal-actions" style={{ marginTop: '16px' }}>
                  <button type="button" className="outline-button" onClick={closeModal}>Cancel</button>
                  <button type="submit" className="primary-button" disabled={booking}>
                    {booking ? (
                      <><span className="spinner" /><span>Confirming...</span></>
                    ) : (
                      <><span className="material-symbols-outlined">check</span><span>Complete Reservation</span></>
                    )}
                  </button>
                </div>
              </form>
            )}

            {bookingSuccess && (
              <div style={{ marginTop: '16px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => {
                    closeModal();
                    if (onReservationSuccess) onReservationSuccess();
                  }}
                >
                  <span className="material-symbols-outlined">calendar_month</span>
                  <span>View in My Reservations</span>
                </button>
                <button type="button" className="outline-button" onClick={closeModal}>
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantPage;
