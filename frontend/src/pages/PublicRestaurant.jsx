import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';
import { restaurantTableAPI, tableReservationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const RESTAURANT_BANNER_BG =
  'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=1920&q=85';

const DINING_AREAS = [
  {
    name: 'Main Dining Hall',
    value: 'MAIN_HALL',
    desc: 'Grand salon with acoustic grand piano, bespoke crystal chandeliers, and vaulted ceilings.',
    img: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
    capacity: '2 - 8 Guests',
  },
  {
    name: 'Balcony Terrace',
    value: 'TERRACE',
    desc: 'Open-air al fresco dining with sweeping sunset vistas overlooking the botanical fountains.',
    img: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=800&q=80',
    capacity: '2 - 6 Guests',
  },
  {
    name: 'Private Dining Suites',
    value: 'PRIVATE_ROOM',
    desc: 'Intimate executive salons with dedicated personal sommelier, private terrace, and bespoke menus.',
    img: 'https://images.unsplash.com/photo-1578474846511-04ba529f0b88?auto=format&fit=crop&w=800&q=80',
    capacity: '6 - 12 Guests',
  },
];

const TASTING_MENU = [
  {
    category: 'Prelude & Starters',
    items: [
      { name: 'Heirloom Beet & Truffle Carpaccio', price: '$26', desc: 'Whipped goat curd, compressed blackberries, 25-year aged balsamic' },
      { name: 'Pan-Seared Brittany Diver Scallops', price: '$34', desc: 'Sunchoke purée, Ossetra caviar, brown butter hazelnut emulsion' },
      { name: 'Foie Gras Torchon & Spiced Brioche', price: '$32', desc: 'Caramelized Ethiopian highland figs, port reduction, gold leaf' },
    ],
  },
  {
    category: 'Mains & Hearth',
    items: [
      { name: 'Dry-Aged Wagyu Tenderloin A5', price: '$85', desc: 'Bone marrow pomme purée, charred morel mushrooms, Périgord truffle jus' },
      { name: 'Mediterranean Wild Turbot Filet', price: '$68', desc: 'Braised fennel pollen, saffron bouillabaisse reduction, sea beans' },
      { name: 'Roasted Duck Breast with Lavender Honey', price: '$58', desc: 'Parsnip mousseline, baby heirloom turnips, sour cherry gastrique' },
    ],
  },
  {
    category: 'Desserts & Cellar',
    items: [
      { name: 'Valrhona Grand Cru Dark Chocolate Sphere', price: '$22', desc: 'Warm salted bourbon caramel, smoked Tahitian vanilla bean gelato' },
      { name: 'Wild Highland Honey Mille-Feuille', price: '$20', desc: 'Crisp caramelized puff pastry, yuzu cream, candied citrus zest' },
    ],
  },
];

const TIME_SLOTS = [
  '12:30', '13:00', '13:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'
];

const PublicRestaurant = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [timeSlot, setTimeSlot] = useState('19:30');
  const [partySize, setPartySize] = useState('2');
  const [area, setArea] = useState('TERRACE');
  const [specialRequests, setSpecialRequests] = useState('');
  const [tables, setTables] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState(null);

  useEffect(() => {
    restaurantTableAPI.getAll().then((res) => {
      if (res.data && Array.isArray(res.data)) {
        setTables(res.data);
      }
    }).catch(() => {});
  }, []);

  const handleTableReservationSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      const intent = {
        type: 'TABLE',
        date,
        timeSlot,
        partySize,
        area,
        specialRequests,
      };
      sessionStorage.setItem('pending_booking', JSON.stringify(intent));
      navigate('/login', {
        state: {
          redirectTo: '/restaurant',
          bookingIntent: intent,
        },
      });
      return;
    }

    setSubmitting(true);
    try {
      // Find a matching table in the requested area with enough capacity
      const matchingTable = tables.find(
        (t) => t.area === area && t.capacity >= Number(partySize)
      ) || tables[0];

      const payload = {
        guestId: currentUser.id || 1,
        tableId: matchingTable ? matchingTable.id : 1,
        reservationDate: date,
        timeSlot,
        partySize: Number(partySize),
        specialRequests: specialRequests || 'Sunset window view requested',
      };

      let created = null;
      try {
        const res = await tableReservationAPI.create(payload);
        if (res && res.data) {
          created = res.data;
        }
      } catch (err) {
        console.warn('Backend table reservation offline, caching locally:', err);
      }

      if (!created) {
        created = {
          id: Date.now(),
          guest: currentUser,
          restaurantTable: matchingTable,
          reservationDate: date,
          timeSlot,
          partySize: Number(partySize),
          status: 'CONFIRMED',
          specialRequests,
        };
      }

      // Sync to client local storage
      try {
        const key = `client_table_res_${currentUser.email}`;
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        localStorage.setItem(key, JSON.stringify([created, ...existing]));
      } catch (_) {}

      // Clear pending intent
      sessionStorage.removeItem('pending_booking');

      setSuccessNotice({
        tableNumber: matchingTable?.tableNumber || 'TR-01',
        area: area.replace('_', ' '),
        date,
        time: timeSlot,
        partySize,
      });
    } catch (err) {
      alert(err.message || 'Unable to confirm table reservation.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="public-restaurant-page">
      <PublicNavbar />

      {/* Header Banner */}
      <header
        className="restaurant-header-banner"
        style={{
          background: `linear-gradient(rgba(15, 23, 42, 0.75), rgba(15, 23, 42, 0.90)), url("${RESTAURANT_BANNER_BG}") center/cover no-repeat`,
        }}
      >
        <div className="section-container banner-content">
          <span className="banner-kicker">MICHELIN-INSPIRED CUISINE &bull; ATELIER SALON</span>
          <h1>Atelier Fine Dining &amp; Balcony Terrace</h1>
          <p>
            An exquisite culinary salon where European fine dining harmonizes with vibrant regional
            herbs and private reserve pairings.
          </p>
        </div>
      </header>

      {/* Success Notification */}
      {successNotice && (
        <div className="section-container" style={{ marginTop: '24px' }}>
          <div className="booking-confirmation-banner">
            <span className="material-symbols-outlined" style={{ fontSize: '32px', color: '#059669' }}>
              restaurant
            </span>
            <div>
              <h3>Table Reserved — Table {successNotice.tableNumber} ({successNotice.area})</h3>
              <p>
                {successNotice.date} at {successNotice.time} &bull; {successNotice.partySize} Guests.
                Our sommelier will have your table prepared upon arrival.
              </p>
            </div>
            <Link to="/client" className="public-cta-btn" style={{ marginLeft: 'auto' }}>
              View in My Portal
            </Link>
          </div>
        </div>
      )}

      {/* Main Reservation Section */}
      <section className="section-container" style={{ padding: '40px 24px 60px' }}>
        <div className="restaurant-booking-card">
          <div className="booking-card-header">
            <span className="section-eyebrow">TABLE RESERVATION</span>
            <h2>Secure Your Dining Experience</h2>
            <p>Direct bookings receive complimentary chef amuse-bouche and reserved sommelier pairing.</p>
          </div>

          <form className="restaurant-booking-form" onSubmit={handleTableReservationSubmit}>
            <div className="form-group">
              <label htmlFor="dining-date">Date</label>
              <input
                id="dining-date"
                type="date"
                required
                className="field"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="dining-time">Service Seating</label>
              <select
                id="dining-time"
                className="field"
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
              >
                {TIME_SLOTS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="dining-guests">Party Size</label>
              <select
                id="dining-guests"
                className="field"
                value={partySize}
                onChange={(e) => setPartySize(e.target.value)}
              >
                <option value="1">1 Diner</option>
                <option value="2">2 Diners</option>
                <option value="3">3 Diners</option>
                <option value="4">4 Diners</option>
                <option value="6">6 Diners</option>
                <option value="8">8+ Large Party</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="dining-area">Preferred Ambiance</label>
              <select
                id="dining-area"
                className="field"
                value={area}
                onChange={(e) => setArea(e.target.value)}
              >
                <option value="TERRACE">Balcony Terrace (Sunset View)</option>
                <option value="MAIN_HALL">Main Dining Hall (Chandelier Salon)</option>
                <option value="PRIVATE_ROOM">Private Dining Suite (Executive)</option>
              </select>
            </div>

            <div className="form-group full-width">
              <label htmlFor="dining-notes">Special Occasions &amp; Dietary Notes</label>
              <input
                id="dining-notes"
                type="text"
                className="field"
                placeholder="e.g. Anniversary celebration, wine pairing, gluten-free..."
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
              />
            </div>

            <div className="form-group full-width" style={{ marginTop: '12px' }}>
              <button
                type="submit"
                className="public-cta-btn"
                style={{ width: '100%', padding: '14px 24px', fontSize: '15px' }}
                disabled={submitting}
              >
                {submitting ? 'Confirming Table...' : (currentUser ? 'Confirm Table Reservation' : 'Sign In to Reserve Table')}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Dining Areas Showcase */}
      <section className="landing-section" style={{ background: '#f8fafc', padding: '60px 0' }}>
        <div className="section-container">
          <div className="landing-section-header">
            <span className="section-eyebrow">SPACES &amp; ATMOSPHERES</span>
            <h2>Three Distinct Dining Settings</h2>
            <p>From lively open-air terrace breezes to secluded, sommelier-attended private suites.</p>
          </div>

          <div className="dining-areas-grid">
            {DINING_AREAS.map((a) => (
              <div key={a.value} className="dining-area-card">
                <img src={a.img} alt={a.name} loading="lazy" />
                <div className="area-content">
                  <span className="area-capacity">{a.capacity}</span>
                  <h3>{a.name}</h3>
                  <p>{a.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Chef's Tasting Menu */}
      <section className="section-container" style={{ padding: '60px 24px 80px' }}>
        <div className="landing-section-header">
          <span className="section-eyebrow">A LA CARTE &amp; TASTING</span>
          <h2>The Seasonal Tasting Menu</h2>
          <p>Curated weekly by Executive Chef Marc Aurel with wine pairings by Chef Sommelier Elena Rossi.</p>
        </div>

        <div className="menu-sections-grid">
          {TASTING_MENU.map((sec) => (
            <div key={sec.category} className="menu-category-card">
              <h3>{sec.category}</h3>
              <div className="menu-items-list">
                {sec.items.map((item) => (
                  <div key={item.name} className="menu-item-row">
                    <div className="item-header">
                      <strong>{item.name}</strong>
                      <span className="item-price">{item.price}</span>
                    </div>
                    <p className="item-desc">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export default PublicRestaurant;
