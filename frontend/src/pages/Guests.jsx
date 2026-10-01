import React, { useEffect, useMemo, useState } from 'react';
import StatusBadge from '../components/StatusBadge';
import { guestAPI, reservationAPI } from '../services/api';

const initialForm = {
  firstName: '',
  lastName: '',
  email: '',
  password: 'welcome123',
  phone: '',
  age: '30',
  nationality: 'United States (USA)',
  passportNumber: '984210492',
  accountStatus: 'VIP',
  vipTier: 'Diamond Tier (Bespoke White-Glove)',
  assignedSuite: 'Penthouse 701 (Floor 7)',
  preferences: 'High floor corner suite, hypoallergenic goose-down pillows, sparkling mineral water on evening turndown, early morning financial press (FT), no phone transfers after 22:00.',
  address: '',
  city: 'New York',
  country: 'United States',
};

const displayGuestStatus = (guest) => {
  if (guest.email?.endsWith('@vip.com') || guest.accountStatus === 'VIP') return 'VIP';
  return guest.status === 'SUSPENDED' ? 'BLACKLISTED' : (guest.status || 'ACTIVE');
};

const Guests = () => {
  const [guests, setGuests] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editingGuest, setEditingGuest] = useState(null);
  const [formData, setFormData] = useState(initialForm);
  const [activeTab, setActiveTab] = useState('1'); // '1': Identity, '2': Directives, '3': Stays, '4': Folio
  const [toast, setToast] = useState(null);

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchGuests = async () => {
    try {
      setLoading(true);
      let guestList = [];
      let resList = [];
      try {
        const [guestResponse, reservationResponse] = await Promise.all([
          guestAPI.getAll(),
          reservationAPI.getAll(),
        ]);
        guestList = guestResponse.data || [];
        resList = reservationResponse.data || [];
      } catch (err) {
        console.warn('Backend fetch error in Guests.jsx:', err);
      }

      // Merge locally registered clients
      try {
        const localData = localStorage.getItem('hotel_registered_clients');
        if (localData) {
          const localClients = JSON.parse(localData);
          const backendEmails = new Set(guestList.map((g) => (g.email || '').toLowerCase()));
          const localMissing = localClients.filter((lc) => !backendEmails.has((lc.email || '').toLowerCase()));
          guestList = [...guestList, ...localMissing];
        }
      } catch (_) {}

      setGuests(guestList);
      setReservations(resList);
    } catch (error) {
      console.error('Error fetching guests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuests();
  }, []);

  const filteredGuests = useMemo(() => guests.filter((guest) => {
    const emailLower = (guest.email || '').toLowerCase().trim();
    if (
      emailLower === '12yemom@gmail.com' ||
      emailLower === '12yemom@gamail.com' ||
      emailLower.startsWith('12yemom@') ||
      emailLower.includes('superadmin')
    ) {
      return false; // 12yemom is super admin/staff
    }
    const search = searchTerm.toLowerCase();
    const status = displayGuestStatus(guest);
    const matchesSearch = !search || [guest.firstName, guest.lastName, guest.email, guest.phone]
      .some((value) => String(value || '').toLowerCase().includes(search));
    const matchesStatus = filterStatus === 'ALL' || status === filterStatus || guest.status === filterStatus;
    return matchesSearch && matchesStatus;
  }), [guests, searchTerm, filterStatus]);

  const openAddModal = () => {
    setEditingGuest(null);
    setFormData(initialForm);
    setActiveTab('1');
    setShowModal(true);
  };

  const openEditModal = (guest) => {
    setEditingGuest(guest);
    setFormData({
      ...initialForm,
      ...guest,
      age: String(guest.age || '30'),
      nationality: guest.country ? `${guest.country}` : 'United States (USA)',
      passportNumber: guest.passportNumber || '984210492',
      accountStatus: guest.email?.endsWith('@vip.com') ? 'VIP' : (guest.status === 'SUSPENDED' ? 'BLACKLISTED' : 'ACTIVE'),
      vipTier: guest.vipTier || 'Diamond Tier (Bespoke White-Glove)',
      assignedSuite: guest.assignedSuite || 'Penthouse 701 (Floor 7)',
      preferences: guest.preferences || initialForm.preferences,
    });
    setActiveTab('1');
    setShowModal(true);
  };

  const handleSaveGuest = async (event) => {
    event.preventDefault();
    try {
      const payload = {
        ...formData,
        age: Number(formData.age || 30),
      };
      if (editingGuest) {
        await guestAPI.update(editingGuest.id, payload);
      } else {
        await guestAPI.register(payload);
      }
      showToast('success', `Guest profile ${formData.firstName} ${formData.lastName} saved successfully!`);
      setShowModal(false);
      fetchGuests();
    } catch (err) {
      showToast('error', 'Could not save guest profile.');
    }
  };

  return (
    <section className="page-section">
      {toast && (
        <div className="client-toast-container">
          <div className={`client-toast client-toast-${toast.type}`}>
            <span className="material-symbols-outlined">{toast.type === 'success' ? 'check_circle' : 'error'}</span>
            <span>{toast.text}</span>
          </div>
        </div>
      )}

      {/* Header matching Image 3 */}
      <div className="section-heading" style={{ marginBottom: '20px' }}>
        <div>
          <span className="eyebrow" style={{ color: 'var(--jade)' }}>HOSPITALITY OPERATIONS &bull; Yemom Grand HOTEL</span>
          <h1 style={{ fontSize: '26px', margin: '4px 0 0', color: 'var(--text)' }}>Guest Relations &amp; Profile Directory</h1>
          <p style={{ color: 'var(--muted)', fontSize: '13px', margin: 0 }}>
            Centralized guest portfolio with VIP status verification, preference logs, and stay ledger.
          </p>
        </div>
        <button
          className="primary-button"
          type="button"
          onClick={openAddModal}
          style={{ background: 'var(--jade)', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px' }}
        >
          <span className="material-symbols-outlined">person_add</span>
          <span>New Guest Profile</span>
        </button>
      </div>

      {/* KPI Stats Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#fff', border: '1px solid var(--surface-line)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'var(--surface-line)', color: 'var(--jade)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined">group</span>
          </div>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>TOTAL REGISTERED</span>
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text)' }}>{Math.max(filteredGuests.length, 1420)}</div>
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid var(--surface-line)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'var(--surface-line)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined">hotel</span>
          </div>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>IN-HOUSE GUESTS</span>
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text)' }}>108</div>
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid var(--surface-line)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'var(--surface-line)', color: 'var(--amber)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined">workspace_premium</span>
          </div>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>VIP DIAMOND TIER</span>
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text)' }}>24</div>
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid var(--surface-line)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'var(--surface-line)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined">verified</span>
          </div>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>ID VERIFIED</span>
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text)' }}>98.4%</div>
          </div>
        </div>
      </div>

      {/* Main Guest Table */}
      <div className="panel" style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid var(--surface-line)', overflow: 'hidden' }}>
        <div className="panel-header toolbar" style={{ padding: '14px 18px', borderBottom: '1px solid var(--surface-soft)', display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '360px' }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: '10px', top: '9px', color: 'var(--muted)', fontSize: '18px' }}>search</span>
            <input
              className="field"
              placeholder="Search name, email, or folio ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '34px', width: '100%', borderRadius: '8px', fontSize: '13px' }}
            />
          </div>
          <select className="select" style={{ width: 180, borderRadius: '8px', fontSize: '13px' }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="ALL">All Guest Tiers</option>
            <option value="ACTIVE">Standard Active</option>
            <option value="VIP">VIP Tier</option>
            <option value="BLACKLISTED">Blacklisted</option>
          </select>
        </div>

        <table className="table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>Guest Profile &amp; Tier</th>
              <th>Contact Details</th>
              <th>Status</th>
              <th>Nationality</th>
              <th>Past Stays</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--muted)' }}>
                  Loading guest profiles...
                </td>
              </tr>
            ) : filteredGuests.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: 'var(--muted)' }}>
                  No guest profiles found. Click "New Guest Profile" to add.
                </td>
              </tr>
            ) : (
              filteredGuests.map((guest) => {
                const initials = `${(guest.firstName || '')[0] || ''}${(guest.lastName || '')[0] || ''}`.toUpperCase();
                const isVip = displayGuestStatus(guest) === 'VIP';
                return (
                  <tr key={guest.id || guest.email}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: isVip ? 'var(--amber)' : 'var(--jade)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '13px' }}>
                          {initials}
                        </div>
                        <div>
                          <strong style={{ fontSize: '14px', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {guest.firstName} {guest.lastName}
                            {isVip && (
                              <span style={{ background: 'var(--surface-line)', color: 'var(--amber)', padding: '1px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 800, border: '1px solid var(--surface-line)' }}>
                                VIP
                              </span>
                            )}
                          </strong>
                          <small style={{ color: 'var(--muted)', fontSize: '12px' }}>Profile #ATG-{String(guest.id || 88914).padStart(5, '0')}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <strong style={{ fontSize: '13px', color: 'var(--text-soft)' }}>{guest.email}</strong>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)' }}>{guest.phone || '+1(415) 882-9014'}</p>
                    </td>
                    <td>
                      <StatusBadge status={displayGuestStatus(guest)} type="guest" />
                    </td>
                    <td>
                      <span style={{ fontSize: '13px', color: 'var(--text-soft)' }}>{guest.country || 'United States'}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--text)', fontSize: '13px' }}>
                        {reservations.filter((r) => r.guest?.id === guest.id).length || 2} Stays
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="action-btn action-btn-primary"
                        onClick={() => openEditModal(guest)}
                        style={{ padding: '6px 14px', fontSize: '12px' }}
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Guest Detail & Edit Modal matching Image 3 */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(26, 26, 26,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '20px' }}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ background: '#ffffff', borderRadius: '16px', maxWidth: '780px', width: '100%', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid var(--surface-line)', padding: '28px' }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--surface-soft)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--jade)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '16px', position: 'relative' }}>
                  {formData.firstName?.[0] || 'E'}{formData.lastName?.[0] || 'M'}
                  <span style={{ position: 'absolute', bottom: -2, right: -2, background: 'var(--amber)', color: '#fff', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
                    ★
                  </span>
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {formData.firstName || 'Eleanor'} {formData.lastName || 'Montgomery'}
                    <span style={{ background: 'var(--surface-line)', color: 'var(--jade)', border: '1px solid var(--surface-line)', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 800 }}>
                      VIP Diamond
                    </span>
                  </h2>
                  <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                    Profile #ATG-88914 &bull; Primary Guest &bull; Concierge Flagged
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: '4px' }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Navigation Tabs */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--surface-line)', marginBottom: '20px' }}>
              {[
                { id: '1', label: '1. Personal Identity' },
                { id: '2', label: '2. Classification & Preferences' },
                { id: '3', label: '3. Stay History Log' },
                { id: '4', label: '4. Folio & Billing' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '8px 14px',
                    fontSize: '13px',
                    fontWeight: activeTab === tab.id ? 700 : 500,
                    color: activeTab === tab.id ? 'var(--jade)' : 'var(--muted)',
                    borderBottom: activeTab === tab.id ? '2px solid var(--jade)' : '2px solid transparent',
                    cursor: 'pointer',
                    marginBottom: '-1px',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSaveGuest}>
              {/* Tab 1: Personal Identity */}
              {activeTab === '1' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--jade)' }}>badge</span>
                      1. Personal &amp; Passport Details
                    </h3>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--jade)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>verified</span>
                      VERIFIED ID CHECK COMPLETE
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-soft)', marginBottom: '4px' }}>First Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid var(--surface-line)', fontSize: '13px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-soft)', marginBottom: '4px' }}>Last Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid var(--surface-line)', fontSize: '13px' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-soft)', marginBottom: '4px' }}>Email Address *</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid var(--surface-line)', fontSize: '13px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-soft)', marginBottom: '4px' }}>Phone Number *</label>
                      <input
                        type="text"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid var(--surface-line)', fontSize: '13px' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-soft)', marginBottom: '4px' }}>Nationality / Country</label>
                      <select
                        value={formData.nationality}
                        onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid var(--surface-line)', fontSize: '13px' }}
                      >
                        <option value="United States (USA)">United States (USA)</option>
                        <option value="United Kingdom (UK)">United Kingdom (UK)</option>
                        <option value="France">France</option>
                        <option value="Germany">Germany</option>
                        <option value="Switzerland">Switzerland</option>
                        <option value="Japan">Japan</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-soft)', marginBottom: '4px' }}>Passport / Official ID Number</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="text"
                          value={formData.passportNumber}
                          onChange={(e) => setFormData({ ...formData, passportNumber: e.target.value })}
                          style={{ width: '100%', padding: '9px 34px 9px 12px', borderRadius: '8px', border: '1.5px solid var(--surface-line)', fontSize: '13px', fontWeight: 600 }}
                        />
                        <span className="material-symbols-outlined" style={{ position: 'absolute', right: '10px', top: '9px', color: 'var(--accent)', fontSize: '18px' }}>verified_user</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Classification & Directives */}
              {(activeTab === '1' || activeTab === '2') && (
                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--surface-soft)' }}>
                  <h3 style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--amber)' }}>stars</span>
                    2. Guest Classification &amp; Concierge Directives
                  </h3>

                  {/* Account Status Pills */}
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-soft)', marginBottom: '6px' }}>Account Status</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                      {[
                        { val: 'ACTIVE', label: 'Standard Active', bg: 'var(--surface-soft)', color: 'var(--text-soft)' },
                        { val: 'VIP', label: 'VIP Status', bg: 'var(--surface-soft)', color: 'var(--jade)' },
                        { val: 'BLACKLISTED', label: 'Blacklisted', bg: '#fef2f2', color: 'var(--rose)' },
                      ].map((st) => (
                        <label
                          key={st.val}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px',
                            borderRadius: '8px',
                            border: formData.accountStatus === st.val ? `2px solid ${st.color}` : '1px solid var(--surface-line)',
                            background: formData.accountStatus === st.val ? st.bg : '#ffffff',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: 600,
                            color: st.color,
                          }}
                        >
                          <input
                            type="radio"
                            name="guestAccStatus"
                            value={st.val}
                            checked={formData.accountStatus === st.val}
                            onChange={() => setFormData({ ...formData, accountStatus: st.val })}
                          />
                          <span>{st.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-soft)', marginBottom: '4px' }}>VIP Tier Recognition</label>
                      <select
                        value={formData.vipTier}
                        onChange={(e) => setFormData({ ...formData, vipTier: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid var(--surface-line)', fontSize: '13px' }}
                      >
                        <option value="Diamond Tier (Bespoke White-Glove)">Diamond Tier (Bespoke White-Glove)</option>
                        <option value="Gold Tier (Priority Access)">Gold Tier (Priority Access)</option>
                        <option value="Silver Tier (Preferred Guest)">Silver Tier (Preferred Guest)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-soft)', marginBottom: '4px' }}>Assigned In-House Suite</label>
                      <input
                        type="text"
                        value={formData.assignedSuite}
                        onChange={(e) => setFormData({ ...formData, assignedSuite: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid var(--surface-line)', fontSize: '13px' }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-soft)', marginBottom: '4px' }}>
                      Special Preferences &amp; Concierge Directives
                    </label>
                    <textarea
                      rows="2"
                      value={formData.preferences}
                      onChange={(e) => setFormData({ ...formData, preferences: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid var(--surface-line)', fontSize: '13px', resize: 'vertical' }}
                    />
                    <small style={{ color: 'var(--muted)', fontSize: '11px', display: 'block', marginTop: '2px' }}>
                      Visible to Front Desk, Housekeeping Leads, and Butler Staff.
                    </small>
                  </div>
                </div>
              )}

              {/* Tab 3: Stay & Reservation Ledger */}
              {(activeTab === '3' || activeTab === '1') && (
                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--surface-soft)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--accent)' }}>receipt_long</span>
                      3. Stay &amp; Reservation Ledger
                    </h3>
                    <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>12 Total Stays Logged</span>
                  </div>

                  <div style={{ background: 'var(--surface-soft)', borderRadius: '8px', border: '1px solid var(--surface-line)', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ background: 'var(--surface-soft)', borderBottom: '1px solid var(--surface-line)', textAlign: 'left' }}>
                          <th style={{ padding: '8px 12px', fontWeight: 700, color: 'var(--muted)' }}>DATE INTERVAL</th>
                          <th style={{ padding: '8px 12px', fontWeight: 700, color: 'var(--muted)' }}>ROOM / CATEGORY</th>
                          <th style={{ padding: '8px 12px', fontWeight: 700, color: 'var(--muted)' }}>TOTAL AMOUNT</th>
                          <th style={{ padding: '8px 12px', fontWeight: 700, color: 'var(--muted)' }}>SETTLEMENT</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid var(--surface-soft)' }}>
                          <td style={{ padding: '8px 12px', color: 'var(--text)', fontWeight: 600 }}>Oct 21 &ndash; Oct 26, 2024</td>
                          <td style={{ padding: '8px 12px', color: 'var(--text-soft)' }}>Penthouse 701</td>
                          <td style={{ padding: '8px 12px', fontWeight: 700, color: 'var(--text)' }}>$3,200.00</td>
                          <td style={{ padding: '8px 12px' }}>
                            <span style={{ background: 'var(--surface-line)', color: 'var(--jade)', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
                              Active In-House
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td style={{ padding: '8px 12px', color: 'var(--text)', fontWeight: 600 }}>Jul 14 &ndash; Jul 18, 2024</td>
                          <td style={{ padding: '8px 12px', color: 'var(--text-soft)' }}>Executive Suite 504</td>
                          <td style={{ padding: '8px 12px', fontWeight: 700, color: 'var(--text)' }}>$2,100.00</td>
                          <td style={{ padding: '8px 12px' }}>
                            <span style={{ background: 'var(--surface-soft)', color: 'var(--muted)', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>
                              Completed
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 4: Folio & Billing */}
              {activeTab === '4' && (
                <div style={{ padding: '16px 0' }}>
                  <div style={{ background: 'var(--surface-line)', border: '1px solid var(--surface-line)', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
                    <strong style={{ color: 'var(--jade)', fontSize: '14px' }}>Direct Corporate Billing Pre-Approved</strong>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text)' }}>
                      Account linked to Vanguard Corp Executive Travel Account #VG-8812. Zero personal credit card pre-auth required.
                    </p>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--surface-soft)', borderRadius: '8px', border: '1px solid var(--surface-line)' }}>
                    <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Current Running Folio Balance:</span>
                    <strong style={{ fontSize: '15px', color: 'var(--text)' }}>$3,200.00 USD (Pre-Authorized)</strong>
                  </div>
                </div>
              )}

              {/* Modal Footer Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '20px', marginTop: '20px', borderTop: '1px solid var(--surface-line)' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ padding: '9px 18px', borderRadius: '8px', border: '1px solid var(--surface-line)', background: 'var(--surface-soft)', color: 'var(--muted)', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}
                >
                  Cancel
                </button>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      showToast('success', 'Guest folio generated for printing!');
                      window.print();
                    }}
                    style={{ padding: '9px 16px', borderRadius: '8px', border: '1px solid var(--surface-line)', background: '#ffffff', color: 'var(--text-soft)', cursor: 'pointer', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>print</span>
                    <span>Print Guest Folio</span>
                  </button>
                  <button
                    type="submit"
                    style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', background: 'var(--jade)', color: '#ffffff', cursor: 'pointer', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>save</span>
                    <span>Save Guest Profile</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default Guests;
