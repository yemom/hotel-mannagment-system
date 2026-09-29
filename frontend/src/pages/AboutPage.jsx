import React from 'react';
import { Link } from 'react-router-dom';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';

const TEAM = [
  {
    name: 'Yemane Hadgu',
    role: 'General Manager',
    bio: '18 years in luxury hospitality across Europe and East Africa. Passionate about personalised service and sustainable luxury.',
    img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80',
  },
  {
    name: 'Hanna Tekeste',
    role: 'Director of Guest Experience',
    bio: 'Former lead concierge at The Ritz Paris. Fluent in five languages. Specialises in crafting unforgettable guest journeys.',
    img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=300&q=80',
  },
  {
    name: 'Dawit Mekonnen',
    role: 'Executive Chef',
    bio: 'Trained at Le Cordon Bleu, London. Brings a modern East African culinary narrative to every dish, honouring indigenous ingredients.',
    img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
  },
  {
    name: 'Sara Alemu',
    role: 'Head of Wellness & Spa',
    bio: 'Certified in Ayurvedic and Thai massage traditions. Leads a team of 24 therapists with 11 years of luxury spa management.',
    img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  },
];

const MILESTONES = [
  { year: '2008', event: 'Hotel founded as a boutique 14-room property in the heart of the city.' },
  { year: '2012', event: 'First expansion — added Atelier Spa and fine dining restaurant. Awarded 4-star status.' },
  { year: '2016', event: 'Full renovation and rebrand. Penthouse collection launched. 5-star designation achieved.' },
  { year: '2019', event: 'Awarded "Best Luxury Boutique Hotel — East Africa" by Condé Nast Traveller readers.' },
  { year: '2022', event: 'Launched sustainable operations programme — 80% renewable energy, zero single-use plastics.' },
  { year: '2024', event: 'Opened Rooftop Sunset Bar and expanded wellness wing with hydrotherapy pool.' },
];

const AboutPage = () => {
  return (
    <div className="public-rooms-page">
      <PublicNavbar />

      {/* Header Banner */}
      <header className="rooms-header-banner">
        <div className="section-container banner-content">
          <span className="banner-kicker">OUR STORY</span>
          <h1>About የ-mom Hotel</h1>
          <p>
            A boutique sanctuary where timeless Ethiopian hospitality meets world-class luxury.
            Founded with a single vision: to make every guest feel completely at home.
          </p>
        </div>
      </header>

      {/* Mission Statement */}
      <section style={{ padding: '80px 0' }}>
        <div className="section-container">
          <div className="about-mission-grid">
            <div className="about-mission-text">
              <span className="section-eyebrow">OUR PHILOSOPHY</span>
              <h2>Luxury with Soul</h2>
              <p>
                At የ-mom Hotel, we believe luxury is not defined by marble floors or thread counts alone —
                it is the invisible art of making a person feel seen, valued, and entirely cared for from
                the moment they arrive until long after they depart.
              </p>
              <p>
                Our 40+ bespoke suites are furnished with locally crafted artisan pieces, natural stone,
                and curated collections of Ethiopian art. Every touchpoint — from the hand-pressed linen
                to the locally-roasted morning coffee — is chosen with intention and reverence for craft.
              </p>
              <div className="about-values">
                {['Authentic Warmth', 'Sustainable Luxury', 'Artisan Quality', 'Community Rooted'].map((v) => (
                  <div key={v} className="about-value-pill">
                    <span className="material-symbols-outlined">favorite</span>
                    {v}
                  </div>
                ))}
              </div>
            </div>
            <div className="about-mission-img">
              <img
                src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80"
                alt="Hotel lobby interior"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section style={{ background: '#f8fafc', padding: '80px 0' }}>
        <div className="section-container">
          <div className="landing-section-header">
            <span className="section-eyebrow">OUR JOURNEY</span>
            <h2>A Legacy of Excellence</h2>
          </div>
          <div className="about-timeline">
            {MILESTONES.map((m, i) => (
              <div key={m.year} className={`timeline-item ${i % 2 === 0 ? 'left' : 'right'}`}>
                <div className="timeline-year">{m.year}</div>
                <div className="timeline-connector" />
                <div className="timeline-event">{m.event}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section style={{ padding: '80px 0' }}>
        <div className="section-container">
          <div className="landing-section-header">
            <span className="section-eyebrow">LEADERSHIP</span>
            <h2>The People Behind Your Stay</h2>
            <p>Our award-winning team brings decades of collective luxury hospitality expertise from around the world.</p>
          </div>
          <div className="about-team-grid">
            {TEAM.map((member) => (
              <div key={member.name} className="team-card">
                <div className="team-card-img">
                  <img src={member.img} alt={member.name} />
                </div>
                <div className="team-card-info">
                  <h3>{member.name}</h3>
                  <span className="team-role">{member.role}</span>
                  <p>{member.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Awards */}
      <section style={{ background: '#0f172a', padding: '64px 0' }}>
        <div className="section-container" style={{ textAlign: 'center' }}>
          <span className="section-eyebrow" style={{ color: '#6ee7b7' }}>RECOGNITION</span>
          <h2 style={{ color: '#ffffff', fontSize: 'clamp(26px,3.5vw,40px)', fontWeight: 800, margin: '12px 0 40px' }}>
            Awards & Accolades
          </h2>
          <div className="about-awards">
            {[
              'Condé Nast Traveller — Best Boutique Hotel 2019',
              'Forbes Travel Guide — 5-Star Rated 2021–2024',
              'TripAdvisor Travellers\' Choice — Top 1% Worldwide',
              'World Luxury Hotel Awards — Africa Winner 2023',
              'Sustainable Luxury Certification — EarthCheck Gold 2022',
            ].map((award) => (
              <div key={award} className="about-award-badge">
                <span className="material-symbols-outlined">emoji_events</span>
                <span>{award}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="landing-invitation-banner">
        <div className="invitation-card">
          <span className="section-eyebrow">JOIN US</span>
          <h2>Experience It for Yourself</h2>
          <p>
            Words can only convey so much. We invite you to visit, stay, and discover what
            makes የ-mom Hotel unlike anywhere else.
          </p>
          <div className="invitation-actions">
            <Link to="/rooms" className="public-cta-btn">
              <span className="material-symbols-outlined">hotel</span>
              Reserve a Suite
            </Link>
            <Link to="/contact" className="public-outline-btn">
              Get in Touch
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export default AboutPage;
