import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';
import { restaurantTableAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { goToReserve } from '../utils/reserve';

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

// Photography keyed by the DiningArea enum value persisted on each table.
const TABLE_IMAGES = {
  MAIN_HALL:
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
  TERRACE:
    'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=800&q=80',
  PRIVATE_ROOM:
    'https://images.unsplash.com/photo-1578474846511-04ba529f0b88?auto=format&fit=crop&w=800&q=80',
};

const PublicRestaurant = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Every table rendered on this page comes straight from the database.
  // The public site only previews availability — reservations are created in the
  // authenticated client area so no fabricated status can ever be stored.
  const [tables, setTables] = useState([]);
  const [tablesLoading, setTablesLoading] = useState(true);
  const [tablesError, setTablesError] = useState('');

  const loadTables = async () => {
    setTablesLoading(true);
    setTablesError('');
    try {
      const res = await restaurantTableAPI.getAll();
      setTables(res.data && Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setTables([]);
      setTablesError(
        err?.response?.data?.message ||
          'We could not reach the restaurant reservation service. Please retry.'
      );
    } finally {
      setTablesLoading(false);
    }
  };

  useEffect(() => {
    loadTables();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Reservation CTA — visitors are sent to /login and returned here afterwards. */
  const handleReserveTable = () =>
    goToReserve(navigate, {
      user: currentUser,
      target: '/client?tab=restaurant',
      intent: { type: 'TABLE' },
    });

  return (
    <div className="public-restaurant-page">
      <PublicNavbar />

      {/* Header Banner */}
      <header
        className="restaurant-header-banner"
        style={{
          background: `linear-gradient(rgba(26, 26, 26, 0.75), rgba(26, 26, 26, 0.90)), url("${RESTAURANT_BANNER_BG}") center/cover no-repeat`,
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

      {/* Reservation CTA — the table booking form itself lives in the authenticated
          client area (Guest portal → Reserve a Table). */}
      <section className="section-container" style={{ padding: '40px 24px 16px' }}>
        <div className="restaurant-booking-card">
          <div className="booking-card-header">
            <span className="section-eyebrow">TABLE RESERVATION</span>
            <h2>Secure Your Dining Experience</h2>
            <p>
              Direct bookings receive a complimentary chef amuse-bouche and reserved sommelier pairing.
              Sign in to select your table, party size and seating time.
            </p>
          </div>

          <div className="restaurant-reserve-cta">
            <div className="reserve-cta-copy">
              <span className="material-symbols-outlined">event_available</span>
              <div>
                <strong>
                  {currentUser ? 'Continue to table reservation' : 'Sign in to reserve your table'}
                </strong>
                <span>
                  {currentUser
                    ? 'Choose a table, guest count and seating time from your guest dashboard.'
                    : 'Guests reserve tables, rooms and spa rituals from the secure guest portal.'}
                </span>
              </div>
            </div>
            <button type="button" className="public-cta-btn" onClick={handleReserveTable}>
              <span>Reserve a Table</span>
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        </div>
      </section>

      {/* Live table availability — real rows from the restaurant_tables table */}
      <section className="section-container" style={{ padding: '16px 24px 60px' }}>
        <div className="landing-section-header">
          <span className="section-eyebrow">LIVE AVAILABILITY</span>
          <h2>Our Dining Tables</h2>
          <p>
            {tablesLoading
              ? 'Checking live table availability...'
              : `${tables.length} tables across the Main Hall, Balcony Terrace and Private Dining Suites.`}
          </p>
        </div>

        {tablesError && (
          <div className="api-error-state" role="alert">
            <span className="material-symbols-outlined">cloud_off</span>
            <h3>Table availability is temporarily unavailable</h3>
            <p>{tablesError}</p>
            <button type="button" className="public-cta-btn" onClick={loadTables}>
              Try Again
            </button>
          </div>
        )}

        {tablesLoading && !tablesError && (
          <div className="catalog-loading">
            <span className="spinner" />
            <p>Loading tables...</p>
          </div>
        )}

        {!tablesLoading && !tablesError && tables.length === 0 && (
          <div className="empty-card">
            <span className="material-symbols-outlined">restaurant</span>
            <h3>No tables are currently listed</h3>
            <p>Please contact our concierge desk and we will arrange your seating personally.</p>
          </div>
        )}

        {!tablesLoading && !tablesError && tables.length > 0 && (
          <div className="dining-areas-grid">
            {tables.map((table) => (
              <div key={table.id} className="dining-area-card">
                <img
                  src={TABLE_IMAGES[table.area] || TABLE_IMAGES.MAIN_HALL}
                  alt={`Table ${table.tableNumber}`}
                  loading="lazy"
                />
                <div className="area-content">
                  <span className="area-capacity">
                    Table {table.tableNumber} &bull; {String(table.area || 'MAIN_HALL').replace('_', ' ')}
                  </span>
                  <h3>Seats {table.capacity} Guests</h3>
                  <p>{table.description}</p>
                  <span className={`table-status-chip ${String(table.status || '').toLowerCase()}`}>
                    {String(table.status || 'AVAILABLE').replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Dining Areas Showcase */}
      <section className="landing-section" style={{ background: 'var(--surface-soft)', padding: '60px 0' }}>
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
