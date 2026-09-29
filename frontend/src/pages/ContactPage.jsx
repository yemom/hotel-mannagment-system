import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';

const CONTACT_METHODS = [
  {
    icon: 'phone',
    title: 'Reservations',
    detail: '+251 11 551 5050',
    sub: 'Mon – Sun, 7 AM – 10 PM',
    color: '#064e3b',
  },
  {
    icon: 'mail',
    title: 'Email Us',
    detail: 'reservations@yemom.hotel',
    sub: 'We reply within 2 hours',
    color: '#0284c7',
  },
  {
    icon: 'support_agent',
    title: 'Concierge Desk',
    detail: '+251 11 551 5060',
    sub: 'Available 24 hours, 7 days',
    color: '#7c3aed',
  },
  {
    icon: 'location_on',
    title: 'Our Address',
    detail: 'Bole Road, Addis Ababa',
    sub: 'Ethiopia — 1000 m from Airport',
    color: '#b45309',
  },
];

const FAQ = [
  { q: 'What time is check-in and check-out?', a: 'Check-in is from 3:00 PM and check-out by 12:00 PM. Early check-in and late check-out are available on request, subject to availability.' },
  { q: 'Is airport transfer available?', a: 'Yes. We offer complimentary airport transfers for all guests. Please provide your flight details at least 24 hours in advance.' },
  { q: 'Is the hotel pet-friendly?', a: 'We welcome small pets in select suites. A pet amenity fee of $35/night applies. Please notify us when booking.' },
  { q: 'Are children accommodated?', a: 'Absolutely. We offer family suites, a Kids Club (ages 4–12), babysitting, and special children\'s menus in our restaurants.' },
  { q: 'What is the cancellation policy?', a: 'Flexible reservations may be cancelled free of charge up to 48 hours before arrival. Non-refundable rates are also available at a discount.' },
  { q: 'Do you offer wedding and event packages?', a: 'Yes. Our Events team can arrange intimate ceremonies to grand receptions for up to 400 guests. Contact us for a bespoke proposal.' },
];

const ContactPage = () => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSubmitted(true);
    }, 1200);
  };

  return (
    <div className="public-rooms-page">
      <PublicNavbar />

      {/* Header Banner */}
      <header className="rooms-header-banner">
        <div className="section-container banner-content">
          <span className="banner-kicker">GET IN TOUCH</span>
          <h1>Contact & Concierge</h1>
          <p>
            Whether you are planning a stay, arranging an event, or need assistance during
            your visit — our team is here for you around the clock.
          </p>
        </div>
      </header>

      {/* Contact Methods */}
      <section style={{ padding: '64px 0 0' }}>
        <div className="section-container">
          <div className="contact-methods-grid">
            {CONTACT_METHODS.map((c) => (
              <div key={c.title} className="contact-method-card">
                <div className="contact-method-icon" style={{ background: `${c.color}15`, color: c.color }}>
                  <span className="material-symbols-outlined">{c.icon}</span>
                </div>
                <h3>{c.title}</h3>
                <p className="contact-method-detail">{c.detail}</p>
                <p className="contact-method-sub">{c.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form + Map */}
      <section style={{ padding: '64px 0' }}>
        <div className="section-container">
          <div className="contact-main-grid">
            {/* Form */}
            <div className="contact-form-wrap">
              <h2>Send Us a Message</h2>
              <p style={{ color: '#64748b', marginBottom: 28 }}>
                Use the form below for enquiries, special requests, or event planning. We'll
                respond within 2 business hours.
              </p>

              {submitted ? (
                <div className="booking-confirmation-banner">
                  <span className="material-symbols-outlined" style={{ fontSize: 32, color: '#059669' }}>check_circle</span>
                  <div>
                    <h3>Message Received</h3>
                    <p>
                      Thank you, {form.name}. Our team will reach you at {form.email} within 2 hours.
                    </p>
                    <button
                      type="button"
                      className="public-outline-btn"
                      style={{ marginTop: 14, color: '#064e3b', borderColor: '#064e3b', fontSize: 13 }}
                      onClick={() => { setSubmitted(false); setForm({ name: '', email: '', phone: '', subject: '', message: '' }); }}
                    >
                      Send Another Message
                    </button>
                  </div>
                </div>
              ) : (
                <form className="contact-form" onSubmit={handleSubmit}>
                  <div className="form-row-2">
                    <div className="form-group">
                      <label htmlFor="c-name">Full Name *</label>
                      <input
                        id="c-name"
                        name="name"
                        type="text"
                        required
                        placeholder="Your full name"
                        value={form.name}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="c-email">Email Address *</label>
                      <input
                        id="c-email"
                        name="email"
                        type="email"
                        required
                        placeholder="name@example.com"
                        value={form.email}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div className="form-row-2">
                    <div className="form-group">
                      <label htmlFor="c-phone">Phone Number</label>
                      <input
                        id="c-phone"
                        name="phone"
                        type="tel"
                        placeholder="+251 9XX XXX XXX"
                        value={form.phone}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="c-subject">Subject *</label>
                      <select
                        id="c-subject"
                        name="subject"
                        required
                        value={form.subject}
                        onChange={handleChange}
                      >
                        <option value="">Select a topic…</option>
                        <option>Room Reservation</option>
                        <option>Special Occasion</option>
                        <option>Event & Meetings</option>
                        <option>Spa & Wellness</option>
                        <option>Feedback</option>
                        <option>Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="c-message">Message *</label>
                    <textarea
                      id="c-message"
                      name="message"
                      rows="5"
                      required
                      placeholder="Tell us how we can help…"
                      value={form.message}
                      onChange={handleChange}
                    />
                  </div>
                  <button type="submit" className="public-cta-btn" style={{ width: '100%', justifyContent: 'center' }} disabled={sending}>
                    {sending ? (
                      <><span className="spinner" /> Sending…</>
                    ) : (
                      <><span className="material-symbols-outlined">send</span> Send Message</>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Map / Location visual */}
            <div className="contact-location">
              <div className="contact-map-placeholder">
                <span className="material-symbols-outlined">location_on</span>
                <p>Bole Road, Addis Ababa, Ethiopia</p>
                <a
                  href="https://maps.google.com/?q=Bole+Road+Addis+Ababa+Ethiopia"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="public-outline-btn"
                  style={{ marginTop: 16, display: 'inline-flex', gap: 6 }}
                >
                  <span className="material-symbols-outlined">open_in_new</span>
                  Open in Google Maps
                </a>
              </div>
              <div className="contact-hours-card">
                <h3>Desk Hours</h3>
                <div className="hours-row"><span>Front Desk</span><span>24 Hours</span></div>
                <div className="hours-row"><span>Concierge</span><span>24 Hours</span></div>
                <div className="hours-row"><span>Reservations Phone</span><span>7 AM – 10 PM</span></div>
                <div className="hours-row"><span>Email Enquiries</span><span>Reply within 2h</span></div>
                <div className="hours-row"><span>Spa Bookings</span><span>8 AM – 8 PM</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ background: '#f8fafc', padding: '64px 0' }}>
        <div className="section-container">
          <div className="landing-section-header">
            <span className="section-eyebrow">COMMON QUESTIONS</span>
            <h2>Frequently Asked Questions</h2>
          </div>
          <div className="faq-list">
            {FAQ.map((item, i) => (
              <div key={i} className="faq-item">
                <button
                  className="faq-question"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                >
                  <span>{item.q}</span>
                  <span className="material-symbols-outlined">
                    {openFaq === i ? 'expand_less' : 'expand_more'}
                  </span>
                </button>
                {openFaq === i && (
                  <div className="faq-answer">
                    <p>{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="landing-invitation-banner">
        <div className="invitation-card">
          <span className="section-eyebrow">READY?</span>
          <h2>Begin Your Stay</h2>
          <p>
            Browse our available suites and reserve directly for the best available rate,
            guaranteed.
          </p>
          <div className="invitation-actions">
            <Link to="/rooms" className="public-cta-btn">
              <span className="material-symbols-outlined">hotel</span>
              View Rooms
            </Link>
            <Link to="/spa" className="public-outline-btn">
              Explore Spa
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export default ContactPage;
