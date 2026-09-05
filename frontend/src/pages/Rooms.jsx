import React, { useEffect, useMemo, useState } from 'react';
import { roomAPI } from '../services/api';

const STATUS_CONFIG = {
  AVAILABLE:   { label: 'Available',   color: '#16a34a', bg: '#dcfce7', icon: 'check_circle' },
  OCCUPIED:    { label: 'Occupied',    color: '#dc2626', bg: '#fee2e2', icon: 'person' },
  RESERVED:    { label: 'Reserved',    color: '#b45309', bg: '#fef3c7', icon: 'event_available' },
  MAINTENANCE: { label: 'Maintenance', color: '#d97706', bg: '#fef9c3', icon: 'build' },
};

const TYPE_CONFIG = {
  SINGLE:    { label: 'Single Rooms',  icon: 'bed',       floor: '1st Floor' },
  DOUBLE:    { label: 'Double Rooms',  icon: 'king_bed',  floor: '1st & 2nd Floor' },
  SUITE:     { label: 'Suites',        icon: 'villa',     floor: '2nd & 3rd Floor' },
  DELUXE:    { label: 'Deluxe Rooms',  icon: 'star',      floor: '3rd Floor' },
  PENTHOUSE: { label: 'Penthouse',     icon: 'apartment', floor: 'Top Floor' },
};

const TYPE_ORDER   = ['SINGLE', 'DOUBLE', 'SUITE', 'DELUXE', 'PENTHOUSE'];
const roomTypes    = ['SINGLE', 'DOUBLE', 'SUITE', 'DELUXE', 'PENTHOUSE'];
const roomStatuses = ['AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'RESERVED'];

const DEFAULT_SEED_ROOMS = [
  { roomNumber: '101', roomType: 'SINGLE',    basePrice: 85,  capacity: 1, description: 'Cozy retreat with a plush queen bed, dedicated ergonomic workstation, and quiet garden views.', hasBathtub: false, hasBalcony: false, hasMinibar: true },
  { roomNumber: '102', roomType: 'DOUBLE',    basePrice: 140, capacity: 2, description: 'Spacious modern room featuring two premium queen beds, artisan coffee bar, and skyline windows.', hasBathtub: true,  hasBalcony: false, hasMinibar: true },
  { roomNumber: '103', roomType: 'SINGLE',    basePrice: 95,  capacity: 1, description: 'Serene corner single with floor-to-ceiling windows and acoustic soundproofing.', hasBathtub: false, hasBalcony: true,  hasMinibar: true },
  { roomNumber: '104', roomType: 'SINGLE',    basePrice: 90,  capacity: 1, description: 'Bright and airy garden-view single, perfect for solo travellers seeking a peaceful retreat.', hasBathtub: false, hasBalcony: false, hasMinibar: false },
  { roomNumber: '201', roomType: 'SUITE',     basePrice: 220, capacity: 3, description: 'Executive boutique suite with a partitioned salon lounge, Italian marble bath, and private terrace.', hasBathtub: true,  hasBalcony: true,  hasMinibar: true },
  { roomNumber: '202', roomType: 'DOUBLE',    basePrice: 155, capacity: 2, description: 'Superior double with sweeping courtyard views and complimentary artisan refreshments.', hasBathtub: true,  hasBalcony: true,  hasMinibar: true },
  { roomNumber: '203', roomType: 'DOUBLE',    basePrice: 145, capacity: 2, description: 'Elegant twin double room with a dedicated reading nook and premium blackout draping.', hasBathtub: false, hasBalcony: false, hasMinibar: true },
  { roomNumber: '204', roomType: 'DOUBLE',    basePrice: 160, capacity: 2, description: 'Corner double with wrap-around city views, handcrafted furniture, and luxury toiletries.', hasBathtub: true,  hasBalcony: true,  hasMinibar: true },
  { roomNumber: '301', roomType: 'DELUXE',    basePrice: 290, capacity: 4, description: 'Ultra-luxurious corner suite with panoramic city skyline panorama, walk-in dressing room, and deep tub.', hasBathtub: true,  hasBalcony: true,  hasMinibar: true },
  { roomNumber: '302', roomType: 'SUITE',     basePrice: 240, capacity: 3, description: 'Grand family suite with dual vanity bath, private sun deck, and plush sleeper sofa.', hasBathtub: true,  hasBalcony: true,  hasMinibar: true },
  { roomNumber: '303', roomType: 'SUITE',     basePrice: 255, capacity: 3, description: 'Romantic honeymoon suite with private jacuzzi, champagne service, and rose-petal turndown.', hasBathtub: true,  hasBalcony: true,  hasMinibar: true },
  { roomNumber: '304', roomType: 'DELUXE',    basePrice: 310, capacity: 4, description: 'Presidential deluxe with a dedicated in-room butler, dual fireplaces, and panoramic vistas.', hasBathtub: true,  hasBalcony: true,  hasMinibar: true },
  { roomNumber: '401', roomType: 'PENTHOUSE', basePrice: 480, capacity: 4, description: 'Top-floor presidential penthouse with private wraparound balcony, fireplace salon, and butler service pantry.', hasBathtub: true,  hasBalcony: true,  hasMinibar: true },
  { roomNumber: '402', roomType: 'PENTHOUSE', basePrice: 520, capacity: 5, description: 'Sky-level penthouse estate with private rooftop terrace, plunge pool, dedicated chef, and helipad access.', hasBathtub: true,  hasBalcony: true,  hasMinibar: true },
];

const initialForm = { roomNumber: '', roomType: 'SINGLE', basePrice: '', capacity: '1', description: '', hasBathtub: false, hasBalcony: false, hasMinibar: false };

const Rooms = () => {
  const [rooms, setRooms]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [updatingId, setUpdatingId]     = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData]         = useState(initialForm);
  const [submitting, setSubmitting]     = useState(false);
  const [toast, setToast]               = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterType, setFilterType]     = useState('ALL');

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchRooms = async () => {
    try {
      const res = await roomAPI.getAll();
      if (res.data && res.data.length > 0) {
        setRooms(res.data);
        try {
          localStorage.setItem('hotel_rooms_inventory', JSON.stringify(res.data));
        } catch (_) {}
      } else {
        const cached = localStorage.getItem('hotel_rooms_inventory');
        if (cached) {
          setRooms(JSON.parse(cached));
        } else {
          const defaults = DEFAULT_SEED_ROOMS.map((r, i) => ({ ...r, id: i + 1, status: 'AVAILABLE' }));
          setRooms(defaults);
          try {
            localStorage.setItem('hotel_rooms_inventory', JSON.stringify(defaults));
          } catch (_) {}
        }
      }
    } catch {
      const cached = localStorage.getItem('hotel_rooms_inventory');
      if (cached) {
        try {
          setRooms(JSON.parse(cached));
        } catch (_) {}
      } else {
        const defaults = DEFAULT_SEED_ROOMS.map((r, i) => ({ ...r, id: i + 1, status: 'AVAILABLE' }));
        setRooms(defaults);
        try {
          localStorage.setItem('hotel_rooms_inventory', JSON.stringify(defaults));
        } catch (_) {}
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    const timer = setInterval(fetchRooms, 8000);
    return () => clearInterval(timer);
  }, []);

  const handleSeedDefaultRooms = async () => {
    setLoading(true);
    let seeded = DEFAULT_SEED_ROOMS.map((r, idx) => ({ ...r, id: idx + 1, status: 'AVAILABLE' }));
    try {
      for (const r of DEFAULT_SEED_ROOMS) {
        try {
          await roomAPI.create({ ...r, status: 'AVAILABLE' });
        } catch (_) {}
      }
      try {
        const res = await roomAPI.getAll();
        if (res.data && res.data.length > 0) {
          seeded = res.data;
        }
      } catch (_) {}
    } catch (_) {}

    setRooms(seeded);
    try {
      localStorage.setItem('hotel_rooms_inventory', JSON.stringify(seeded));
    } catch (_) {}
    showToast('success', `Initialized ${seeded.length} hotel rooms into inventory!`);
    setLoading(false);
  };

  const handleStatusChange = async (roomId, newStatus) => {
    setUpdatingId(roomId);
    try {
      await roomAPI.updateStatus(roomId, newStatus);
    } catch (_) {}
    setRooms((prev) => {
      const updated = prev.map((r) => (r.id === roomId ? { ...r, status: newStatus } : r));
      try {
        localStorage.setItem('hotel_rooms_inventory', JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
    showToast('success', `Room status updated to ${STATUS_CONFIG[newStatus]?.label || newStatus}`);
    setUpdatingId(null);
  };

  const handleAddRoom = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const newRoomObj = {
      id: Date.now(),
      ...formData,
      basePrice: Number(formData.basePrice || 150),
      capacity: Number(formData.capacity || 2),
      status: formData.status || 'AVAILABLE',
    };
    try {
      const res = await roomAPI.create(newRoomObj);
      if (res && res.data) {
        newRoomObj.id = res.data.id;
      }
    } catch (_) {}

    setRooms((prev) => {
      const updated = [newRoomObj, ...prev];
      try {
        localStorage.setItem('hotel_rooms_inventory', JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
    setShowAddModal(false);
    setFormData(initialForm);
    showToast('success', `Room ${formData.roomNumber} added to inventory!`);
    setSubmitting(false);
  };

  const counts = useMemo(() => ({
    AVAILABLE:   rooms.filter((r) => r.status === 'AVAILABLE').length,
    OCCUPIED:    rooms.filter((r) => r.status === 'OCCUPIED').length,
    RESERVED:    rooms.filter((r) => r.status === 'RESERVED').length,
    MAINTENANCE: rooms.filter((r) => r.status === 'MAINTENANCE').length,
    total:       rooms.length,
  }), [rooms]);

  const displayRooms = useMemo(() => {
    return rooms.filter((r) => {
      const okStatus = filterStatus === 'ALL' || r.status === filterStatus;
      const okType   = filterType   === 'ALL' || r.roomType === filterType;
      return okStatus && okType;
    });
  }, [rooms, filterStatus, filterType]);

  const grouped = useMemo(() => {
    return displayRooms.reduce((acc, r) => {
      (acc[r.roomType] = acc[r.roomType] || []).push(r);
      return acc;
    }, {});
  }, [displayRooms]);

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner-lg" />
        <p>Loading hotel room inventory...</p>
      </div>
    );
  }

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

      {/* Page Header */}
      <div className="section-heading">
        <div>
          <span className="eyebrow">Inventory &amp; Rooms</span>
          <h1>Room Management</h1>
          <p>Live floor plan — hotel rooms grouped by category with real-time status control.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {rooms.length === 0 && (
            <button className="secondary-button" type="button" onClick={handleSeedDefaultRooms}>
              <span className="material-symbols-outlined">dataset</span>
              Initialize Default Rooms
            </button>
          )}
          <button className="primary-button" type="button" onClick={() => setShowAddModal(true)}>
            <span className="material-symbols-outlined">add</span>
            Add Room
          </button>
        </div>
      </div>

      {/* Status Summary Strip */}
      <div className="table-status-summary" style={{ marginBottom: '24px' }}>
        {Object.entries(STATUS_CONFIG).map(([status, cfg]) => (
          <div
            key={status}
            className="status-stat-card"
            style={{
              borderColor: cfg.color,
              cursor: 'pointer',
              outline: filterStatus === status ? `2px solid ${cfg.color}` : 'none',
            }}
            onClick={() => setFilterStatus(filterStatus === status ? 'ALL' : status)}
          >
            <span className="material-symbols-outlined" style={{ color: cfg.color }}>{cfg.icon}</span>
            <div>
              <strong style={{ color: cfg.color }}>{counts[status] ?? 0}</strong>
              <span>{cfg.label}</span>
            </div>
          </div>
        ))}
        <div
          className="status-stat-card"
          style={{
            borderColor: '#6366f1',
            cursor: 'pointer',
            outline: filterStatus === 'ALL' ? '2px solid #6366f1' : 'none',
          }}
          onClick={() => setFilterStatus('ALL')}
        >
          <span className="material-symbols-outlined" style={{ color: '#6366f1' }}>apartment</span>
          <div>
            <strong style={{ color: '#6366f1' }}>{counts.total}</strong>
            <span>All Rooms</span>
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="reservation-filter-bar" style={{ marginBottom: '24px' }}>
        <button
          className={`filter-pill ${filterType === 'ALL' ? 'filter-pill-active' : ''}`}
          onClick={() => setFilterType('ALL')}
        >
          All Categories <span className="filter-count">{rooms.length}</span>
        </button>
        {roomTypes.map((type) => {
          const cfg = TYPE_CONFIG[type];
          const count = rooms.filter((r) => r.roomType === type).length;
          if (!count) return null;
          return (
            <button
              key={type}
              className={`filter-pill ${filterType === type ? 'filter-pill-active' : ''}`}
              onClick={() => setFilterType(filterType === type ? 'ALL' : type)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{cfg.icon}</span>
              {cfg.label} <span className="filter-count">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Room Cards Grid Grouped by Category */}
      {displayRooms.length === 0 ? (
        <div className="empty-state-card">
          <span className="material-symbols-outlined empty-state-icon">bed</span>
          <h3>No Rooms Found</h3>
          <p>No rooms match the current filter. Try clearing the filter or add rooms.</p>
          {rooms.length === 0 && (
            <button className="primary-button" style={{ marginTop: '12px' }} onClick={handleSeedDefaultRooms}>
              Initialize Default Rooms
            </button>
          )}
        </div>
      ) : (
        TYPE_ORDER.map((type) => {
          if (!grouped[type]) return null;
          const typeCfg = TYPE_CONFIG[type];
          return (
            <div key={type} className="floor-plan-section">
              <div className="floor-plan-area-heading">
                <span className="material-symbols-outlined">{typeCfg.icon}</span>
                <h3>{typeCfg.label}</h3>
                <span className="table-count">
                  {grouped[type].length} room{grouped[type].length !== 1 ? 's' : ''} &middot; {typeCfg.floor}
                </span>
              </div>
              <div className="floor-plan-grid">
                {grouped[type].map((room) => {
                  const cfg = STATUS_CONFIG[room.status] || STATUS_CONFIG.AVAILABLE;
                  return (
                    <div
                      key={room.id}
                      className="floor-plan-table-card"
                      style={{ borderColor: cfg.color, backgroundColor: cfg.bg + '40' }}
                    >
                      {/* Card Header: Room number & status badge */}
                      <div className="floor-table-header">
                        <span className="floor-table-number">
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: '13px', verticalAlign: 'middle', marginRight: '3px' }}
                          >
                            meeting_room
                          </span>
                          {room.roomNumber}
                        </span>
                        <span className="status-pill" style={{ background: cfg.bg, color: cfg.color }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{cfg.icon}</span>
                          {cfg.label}
                        </span>
                      </div>

                      {/* Capacity & Price */}
                      <div className="floor-table-capacity">
                        <span className="material-symbols-outlined">group</span>
                        Sleeps {room.capacity}&nbsp;&middot;&nbsp;
                        <span style={{ color: '#059669', fontWeight: 700 }}>
                          ${Number(room.basePrice || 0).toFixed(0)}/night
                        </span>
                      </div>

                      {/* Amenity Chips */}
                      {(room.hasBathtub || room.hasBalcony || room.hasMinibar) && (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', margin: '4px 0' }}>
                          {room.hasBathtub && (
                            <span className="amenity-chip">
                              <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>bathtub</span>
                              Tub
                            </span>
                          )}
                          {room.hasBalcony && (
                            <span className="amenity-chip">
                              <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>balcony</span>
                              Balcony
                            </span>
                          )}
                          {room.hasMinibar && (
                            <span className="amenity-chip">
                              <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>local_bar</span>
                              Minibar
                            </span>
                          )}
                        </div>
                      )}

                      {/* Description */}
                      {room.description && <p className="floor-table-desc">{room.description}</p>}

                      {/* Interactive Live Status Selector */}
                      <select
                        className="field floor-table-status-select"
                        value={room.status}
                        disabled={updatingId === room.id}
                        onChange={(e) => handleStatusChange(room.id, e.target.value)}
                      >
                        {roomStatuses.map((s) => (
                          <option key={s} value={s}>
                            {STATUS_CONFIG[s]?.label || s}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}

      {/* Add Room Modal matching Stitch Design */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px' }}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ background: '#ffffff', borderRadius: '16px', maxWidth: '640px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid #e2e8f0', padding: '28px' }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#065f46', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '26px' }}>domain_add</span>
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>Add New Room to Inventory</h2>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    PROPERTY : ATELIER GRAND HOTEL &bull; CORE PMS REGISTRY
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}
                aria-label="Close"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddRoom}>
              {/* Row 1: Room Number, Floor Level, Room Category */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1.2fr', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Room Number <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 412"
                    value={formData.roomNumber}
                    onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '14px', color: '#0f172a', fontWeight: 600 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Floor Level <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    value={formData.floorLevel || '4th Floor (Ocean Panorama)'}
                    onChange={(e) => setFormData({ ...formData, floorLevel: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '13px', color: '#0f172a', background: '#fff' }}
                  >
                    <option value="4th Floor (Ocean Panorama)">4th Floor (Ocean Panorama)</option>
                    <option value="3rd Floor (Skyline)">3rd Floor (Skyline)</option>
                    <option value="2nd Floor (Atrium)">2nd Floor (Atrium)</option>
                    <option value="1st Floor (Courtyard Garden)">1st Floor (Courtyard Garden)</option>
                    <option value="Penthouse Level (Floor 7)">Penthouse Level (Floor 7)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Room Category <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    value={formData.roomType}
                    onChange={(e) => setFormData({ ...formData, roomType: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '13px', color: '#0f172a', background: '#fff' }}
                  >
                    <option value="DELUXE">Deluxe Ocean View</option>
                    <option value="SUITE">Executive Suite</option>
                    <option value="SINGLE">Classic Single</option>
                    <option value="DOUBLE">Superior Double</option>
                    <option value="PENTHOUSE">Atelier Penthouse</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Bed Configuration, Nightly Base Rate, Max Occupancy */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.2fr', gap: '14px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Bed Configuration <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    value={formData.bedConfig || '1 King Bed (European Plush)'}
                    onChange={(e) => setFormData({ ...formData, bedConfig: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '13px', color: '#0f172a', background: '#fff' }}
                  >
                    <option value="1 King Bed (European Plush)">1 King Bed (European Plush)</option>
                    <option value="2 Queen Beds (Plush)">2 Queen Beds (Plush)</option>
                    <option value="1 Queen Bed (Garden)">1 Queen Bed (Garden)</option>
                    <option value="2 Twin Beds (Luxury)">2 Twin Beds (Luxury)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Nightly Base Rate ($) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '10px', top: '9px', color: '#64748b', fontWeight: 700 }}>$</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="380.00"
                      value={formData.basePrice}
                      onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px 9px 24px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Max Occupancy <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '13px', color: '#0f172a', background: '#fff' }}
                  >
                    <option value="1">1 Adult</option>
                    <option value="2">2 Adults</option>
                    <option value="3">3 Adults (or 2 Adults + 1 Child)</option>
                    <option value="4">4 Adults</option>
                    <option value="5">5+ Adults (Estate)</option>
                  </select>
                </div>
              </div>

              {/* Room Amenities & Features */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '10px' }}>
                  Room Amenities &amp; Features
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {[
                    { key: 'hasBalcony', label: 'Balcony / Terrace' },
                    { key: 'hasOceanView', label: 'Ocean View' },
                    { key: 'hasMinibar', label: 'Mini Bar Station' },
                    { key: 'hasBathtub', label: 'Soaking Tub' },
                    { key: 'hasEspresso', label: 'Espresso Machine' },
                    { key: 'hasWalkInWardrobe', label: 'Walk-in Wardrobe' },
                  ].map(({ key, label }) => (
                    <label
                      key={key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        background: formData[key] ? '#f0fdf4' : '#ffffff',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: formData[key] ? '#065f46' : '#334155',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(formData[key])}
                        onChange={(e) => setFormData({ ...formData, [key]: e.target.checked })}
                        style={{ accentColor: '#065f46', width: '16px', height: '16px' }}
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Initial Operational Status */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '10px' }}>
                  Initial Operational Status
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <label
                    style={{
                      border: (formData.status || 'AVAILABLE') === 'AVAILABLE' ? '2px solid #10b981' : '1px solid #cbd5e1',
                      background: (formData.status || 'AVAILABLE') === 'AVAILABLE' ? '#f0fdf4' : '#ffffff',
                      borderRadius: '10px',
                      padding: '14px',
                      cursor: 'pointer',
                      display: 'flex',
                      gap: '10px',
                    }}
                  >
                    <input
                      type="radio"
                      name="opStatus"
                      value="AVAILABLE"
                      checked={(formData.status || 'AVAILABLE') === 'AVAILABLE'}
                      onChange={() => setFormData({ ...formData, status: 'AVAILABLE' })}
                      style={{ accentColor: '#10b981', marginTop: '3px' }}
                    />
                    <div>
                      <strong style={{ display: 'block', color: '#065f46', fontSize: '13px' }}>&bull; Available for Booking</strong>
                      <span style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.3, display: 'block', marginTop: '2px' }}>
                        Instantly released to booking engines, front desk, and GDS channels.
                      </span>
                    </div>
                  </label>

                  <label
                    style={{
                      border: formData.status === 'MAINTENANCE' ? '2px solid #f59e0b' : '1px solid #cbd5e1',
                      background: formData.status === 'MAINTENANCE' ? '#fffbeb' : '#ffffff',
                      borderRadius: '10px',
                      padding: '14px',
                      cursor: 'pointer',
                      display: 'flex',
                      gap: '10px',
                    }}
                  >
                    <input
                      type="radio"
                      name="opStatus"
                      value="MAINTENANCE"
                      checked={formData.status === 'MAINTENANCE'}
                      onChange={() => setFormData({ ...formData, status: 'MAINTENANCE' })}
                      style={{ accentColor: '#f59e0b', marginTop: '3px' }}
                    />
                    <div>
                      <strong style={{ display: 'block', color: '#b45309', fontSize: '13px' }}>&bull; Under Maintenance / Staging</strong>
                      <span style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.3, display: 'block', marginTop: '2px' }}>
                        Hold key until final housekeeping walkthrough inspection is signed off.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Housekeeping & Maintenance Notes */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Housekeeping &amp; Maintenance Notes
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. Newly refreshed parquet floor finish. Extra feather-free pillow set stored in high shelf cabinet."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '13px', resize: 'vertical' }}
                />
              </div>

              {/* Modal Footer Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  DRAFT AUTO-SAVED TO REGISTRY
                </span>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    style={{ padding: '9px 18px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#475569', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      padding: '9px 20px',
                      borderRadius: '8px',
                      border: 'none',
                      background: '#065f46',
                      color: '#ffffff',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '13px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 2px 4px rgba(6, 95, 70, 0.2)',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check_circle</span>
                    <span>{submitting ? 'Saving...' : 'Save Room to Inventory'}</span>
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

export default Rooms;
