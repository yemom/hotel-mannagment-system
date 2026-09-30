import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';
import { spaServiceAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getSpaImage } from '../utils/propertyImages';
import { goToReserve } from '../utils/reserve';

const SPA_HERO_BG =
  'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1920&q=85';

// Treatment types persisted with each ritual (SpaCategory enum). The pills are
// rendered from the categories that actually exist in the database, in this
// preferred order, so the navigation always reflects real inventory.
const CATEGORY_ORDER = ['MASSAGE', 'FACIAL', 'BODY_TREATMENT', 'WELLNESS', 'COUPLES', 'BEAUTY'];

/** Turns BODY_TREATMENT into "BODY TREATMENT" for display. */
const formatCategory = (category) => String(category || '').replace(/_/g, ' ');

const SpaPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Load the treatment catalogue from the backend only — no seeded fallbacks.
  const loadServices = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await spaServiceAPI.getActive();
      setServices(res.data && Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setServices([]);
      setLoadError(
        err?.response?.data?.message ||
          'We could not load the spa treatment menu. Please retry.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredServices = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    return services.filter((s) => {
      const matchesCategory = selectedCategory === 'ALL' || s.category === selectedCategory;
      if (!matchesCategory) return false;
      if (!q) return true;
      return (
        (s.name || '').toLowerCase().includes(q) ||
        (s.description || '').toLowerCase().includes(q) ||
        formatCategory(s.category).toLowerCase().includes(q)
      );
    });
  }, [services, selectedCategory, searchQuery]);

  /** Categories that exist in the catalogue, with live counts and an ALL total. */
  const categoryCounts = useMemo(() => {
    const counts = { ALL: services.length };
    services.forEach((service) => {
      const key = service.category || 'OTHER';
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [services]);

  const visibleCategories = useMemo(() => {
    const present = services
      .map((service) => service.category)
      .filter((category, index, all) => category && all.indexOf(category) === index);
    const ordered = [
      ...CATEGORY_ORDER.filter((category) => present.includes(category)),
      ...present.filter((category) => !CATEGORY_ORDER.includes(category)),
    ];
    return ['ALL', ...ordered];
  }, [services]);

  // Reservation is created in the authenticated client area only.
  const handleBookClick = (treatment) =>
    goToReserve(navigate, {
      user: currentUser,
      target: '/client?tab=spa',
      intent: { type: 'SPA', spaServiceId: treatment.id },
    });

  return (
    <div className="public-spa-page">
      <PublicNavbar />

      {/* Required header banner selector: .spa-header-banner */}
      <header
        className="spa-header-banner"
        style={{
          background: `linear-gradient(rgba(26, 26, 26, 0.76), rgba(26, 26, 26, 0.90)), url("${SPA_HERO_BG}") center/cover no-repeat`,
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

      {/* Category Pills Navigation — rendered from the real treatment categories */}
      <div className="spa-filter-section">
        <div className="section-container">
          <div className="spa-category-nav" role="tablist" aria-label="Filter rituals by category">
            {visibleCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={selectedCategory === cat}
                className={`spa-category-pill ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat === 'ALL' ? 'All Rituals' : formatCategory(cat)}
                <span className="spa-category-pill-count">{categoryCounts[cat] || 0}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* API error state */}
      {loadError && (
        <div className="section-container" style={{ marginTop: '24px' }}>
          <div className="api-error-state" role="alert">
            <span className="material-symbols-outlined">cloud_off</span>
            <h3>We couldn&apos;t load our spa rituals</h3>
            <p>{loadError}</p>
            <button type="button" className="public-cta-btn" onClick={loadServices}>
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Main Catalog — dark sanctuary section so the glass ritual cards read clearly */}
      <section className="public-spa-section">
        <div className="section-container">
          <div className="spa-catalog-toolbar">
            <div className="spa-catalog-toolbar-title">
              <span className="section-eyebrow">
                {selectedCategory === 'ALL' ? 'FULL TREATMENT MENU' : formatCategory(selectedCategory)}
              </span>
              <h2>
                Holistic Therapies ({filteredServices.length})
              </h2>
              <p>
                {services.length === 0
                  ? 'Loading the live treatment menu...'
                  : `Live from our treatment catalogue - ${services.length} active ritual${
                      services.length === 1 ? '' : 's'
                    } across ${visibleCategories.length - 1} categor${
                      visibleCategories.length - 1 === 1 ? 'y' : 'ies'
                    }.`}
              </p>
            </div>

            <div className="spa-catalog-search">
              <span className="material-symbols-outlined">search</span>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search rituals by name, category or benefit..."
                aria-label="Search spa rituals"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="spa-search-clear"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="catalog-loading">
            <span className="spinner" />
            <p>Loading spa sanctuary rituals...</p>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="catalog-empty">
            <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--muted)' }}>
              spa
            </span>
            <h3>
              {services.length === 0
                ? 'No spa rituals are currently available'
                : 'No treatments match your search'}
            </h3>
            <p style={{ color: 'var(--muted)' }}>
              {services.length === 0
                ? 'Our wellness team is updating the treatment menu. Please check back shortly.'
                : 'Try a different keyword or browse every ritual category.'}
            </p>
            {services.length > 0 && (
              <button
                type="button"
                className="public-outline-btn"
                onClick={() => {
                  setSelectedCategory('ALL');
                  setSearchQuery('');
                }}
              >
                View All Rituals
              </button>
            )}
          </div>
        ) : (
          <div className="public-spa-grid">
            {filteredServices.map((treatment) => (
              <article key={treatment.id} className="spa-treatment-card">
                <div className="treatment-media">
                  <img
                    src={getSpaImage(treatment)}
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
                    <span className="treatment-category">{formatCategory(treatment.category)}</span>
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
      </section>

      <PublicFooter />
    </div>
  );
};

export default SpaPage;
