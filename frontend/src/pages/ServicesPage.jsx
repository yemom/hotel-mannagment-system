import React from 'react';
import { Link } from 'react-router-dom';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';

const SERVICES = [
  {
    icon: 'spa',
    title: 'Wellness & Spa',
    desc: 'Our award-winning Atelier Spa offers 12 treatment rooms, couples suites, a hydrotherapy pool, steam rooms, and a full menu of massages, facials, and holistic rituals curated by world-class therapists.',
    link: '/spa',
    linkLabel: 'Explore Spa',
    highlights: ['12 Private Treatment Rooms', 'Couples Sanctuary', 'Hydrotherapy Pool', 'Steam & Sauna Suite'],
    color: 'var(--accent)',
  },
  {
    icon: 'restaurant',
    title: 'Fine Dining',
    desc: 'Four distinct culinary experiences: a rooftop farm-to-table restaurant, a subterranean wine cellar dining room, a poolside lounge, and an all-day bistro — each helmed by award-winning executive chefs.',
    link: '/restaurant',
    linkLabel: 'View Menus',
    highlights: ['Rooftop Farm-to-Table', 'Wine Cellar Events', 'Poolside Terrace Dining', 'All-Day Artisan Bistro'],
    color: 'var(--accent)',
  },
  {
    icon: 'pool',
    title: 'Pool & Recreation',
    desc: 'Two temperature-controlled infinity pools, a rooftop sunrise pool, private poolside cabanas, poolside dining, and a fully staffed towel and refreshment service throughout the day.',
    link: '/',
    linkLabel: 'Learn More',
    highlights: ['Rooftop Infinity Pool', 'Heated Indoor Pool', 'Private Cabanas', 'Poolside F&B Service'],
    color: 'var(--accent)',
  },
  {
    icon: 'fitness_center',
    title: 'Fitness Centre',
    desc: 'A 2,400 sq-ft state-of-the-art fitness facility open 24 hours. Features Peloton bikes, Technogym strength equipment, TRX, personal training sessions, and daily yoga and Pilates classes.',
    link: '/',
    linkLabel: 'Learn More',
    highlights: ['24-Hour Access', 'Personal Training', 'Daily Yoga Classes', 'Technogym Equipment'],
    color: 'var(--accent)',
  },
  {
    icon: 'meeting_room',
    title: 'Meetings & Events',
    desc: 'Eight flexible event spaces ranging from intimate boardrooms to grand ballrooms accommodating up to 400 guests. Full AV, catering, and dedicated event coordinator included.',
    link: '/contact',
    linkLabel: 'Enquire Now',
    highlights: ['8 Event Venues', 'Up to 400 Guests', 'Full AV & Catering', 'Event Coordinator'],
    color: 'var(--accent)',
  },
  {
    icon: 'local_parking',
    title: 'Concierge & Transport',
    desc: 'Round-the-clock concierge, valet parking, fleet of luxury house cars, helicopter transfer arrangements, private yacht charters, and curated city experiences for discerning guests.',
    link: '/contact',
    linkLabel: 'Contact Concierge',
    highlights: ['24/7 Concierge', 'Valet Parking', 'Luxury Fleet', 'Private Charters'],
    color: 'var(--text)',
  },
];

const FACILITIES = [
  { icon: 'wifi', label: 'Complimentary High-Speed WiFi' },
  { icon: 'local_laundry_service', label: 'Same-Day Laundry & Pressing' },
  { icon: 'room_service', label: '24-Hour In-Room Dining' },
  { icon: 'child_care', label: 'Babysitting & Kids Club' },
  { icon: 'pets', label: 'Pet-Friendly Accommodations' },
  { icon: 'shopping_bag', label: 'Luxury Retail Boutique' },
  { icon: 'medical_services', label: 'In-House Medical Attendant' },
  { icon: 'atm', label: 'Currency Exchange' },
  { icon: 'dry_cleaning', label: 'Shoe Shine & Dry Cleaning' },
  { icon: 'nightlife', label: 'Rooftop Champagne Bar' },
  { icon: 'library_books', label: 'Guest Library & Reading Room' },
  { icon: 'electric_car', label: 'EV Charging Stations' },
];

const ServicesPage = () => {
  return (
    <div className="public-rooms-page">
      <PublicNavbar />

      {/* Header Banner */}
      <header className="rooms-header-banner">
        <div className="section-container banner-content">
          <span className="banner-kicker">HOTEL SERVICES</span>
          <h1>Everything You Need</h1>
          <p>
            From world-class wellness to curated dining, discover the full breadth of services
            available during your stay at Yemom Grand.
          </p>
        </div>
      </header>

      {/* Main Services Grid */}
      <section style={{ padding: '80px 0' }}>
        <div className="section-container">
          <div className="services-page-grid">
            {SERVICES.map((svc) => (
              <article key={svc.title} className="svc-card">
                <div className="svc-card-icon-wrap" style={{ background: `${svc.color}18`, color: svc.color }}>
                  <span className="material-symbols-outlined">{svc.icon}</span>
                </div>
                <div className="svc-card-body">
                  <h2>{svc.title}</h2>
                  <p>{svc.desc}</p>
                  <ul className="svc-highlights">
                    {svc.highlights.map((h) => (
                      <li key={h}>
                        <span className="material-symbols-outlined" style={{ color: svc.color }}>check_circle</span>
                        {h}
                      </li>
                    ))}
                  </ul>
                  <Link to={svc.link} className="svc-link" style={{ color: svc.color }}>
                    {svc.linkLabel} <span className="material-symbols-outlined">arrow_forward</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Facilities Grid */}
      <section style={{ background: 'var(--surface-soft)', padding: '80px 0' }}>
        <div className="section-container">
          <div className="landing-section-header">
            <span className="section-eyebrow">STANDARD INCLUSIONS</span>
            <h2>Facilities for Every Guest</h2>
            <p>All services below are available to guests throughout their stay at no additional charge.</p>
          </div>
          <div className="facilities-grid">
            {FACILITIES.map((f) => (
              <div key={f.label} className="facility-item">
                <span className="material-symbols-outlined">{f.icon}</span>
                <span>{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="landing-invitation-banner">
        <div className="invitation-card">
          <span className="section-eyebrow">READY TO EXPERIENCE IT?</span>
          <h2>Reserve Your Suite Today</h2>
          <p>
            All hotel services are available to in-house guests. Book your room and unlock
            the full येm Hotel experience.
          </p>
          <div className="invitation-actions">
            <Link to="/rooms" className="public-cta-btn">
              <span className="material-symbols-outlined">hotel</span>
              Browse Rooms
            </Link>
            <Link to="/contact" className="public-outline-btn">
              Contact Concierge
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export default ServicesPage;
