import React, { useEffect, useState } from 'react';
import { restaurantTableAPI } from '../services/api';

const STATUS_CONFIG = {
  AVAILABLE: { label: 'Available', color: '#16a34a', bg: '#dcfce7', icon: 'check_circle' },
  RESERVED: { label: 'Reserved', color: '#b45309', bg: '#fef3c7', icon: 'event_seat' },
  OCCUPIED: { label: 'Occupied', color: '#dc2626', bg: '#fee2e2', icon: 'person' },
  CLEANING: { label: 'Cleaning', color: '#d97706', bg: '#fef9c3', icon: 'cleaning_services' },
};

const AREA_LABELS = {
  MAIN_HALL: { label: 'Main Hall', icon: 'restaurant' },
  TERRACE: { label: 'Terrace', icon: 'deck' },
  PRIVATE_ROOM: { label: 'Private Room', icon: 'meeting_room' },
};

const initialForm = {
  tableNumber: '',
  capacity: '4',
  area: 'MAIN_HALL',
  status: 'AVAILABLE',
  description: '',
};

export const DEFAULT_18_TABLES = [
  { tableNumber: 'MH-01', capacity: 4, area: 'MAIN_HALL', status: 'AVAILABLE', description: 'Central Main Hall dining table' },
  { tableNumber: 'MH-02', capacity: 4, area: 'MAIN_HALL', status: 'AVAILABLE', description: 'Main Hall dining table' },
  { tableNumber: 'MH-03', capacity: 2, area: 'MAIN_HALL', status: 'AVAILABLE', description: 'Main Hall window booth for couples' },
  { tableNumber: 'MH-04', capacity: 4, area: 'MAIN_HALL', status: 'AVAILABLE', description: 'Main Hall dining table' },
  { tableNumber: 'MH-05', capacity: 6, area: 'MAIN_HALL', status: 'AVAILABLE', description: 'Main Hall family booth' },
  { tableNumber: 'MH-06', capacity: 4, area: 'MAIN_HALL', status: 'AVAILABLE', description: 'Main Hall dining table' },
  { tableNumber: 'MH-07', capacity: 2, area: 'MAIN_HALL', status: 'AVAILABLE', description: 'Main Hall intimate table' },
  { tableNumber: 'MH-08', capacity: 4, area: 'MAIN_HALL', status: 'AVAILABLE', description: 'Main Hall table' },
  { tableNumber: 'MH-09', capacity: 4, area: 'MAIN_HALL', status: 'AVAILABLE', description: 'Main Hall table' },
  { tableNumber: 'MH-10', capacity: 6, area: 'MAIN_HALL', status: 'AVAILABLE', description: 'Main Hall large table' },
  { tableNumber: 'TR-01', capacity: 4, area: 'TERRACE', status: 'AVAILABLE', description: 'Garden Terrace outdoor dining table' },
  { tableNumber: 'TR-02', capacity: 4, area: 'TERRACE', status: 'AVAILABLE', description: 'Garden Terrace seating' },
  { tableNumber: 'TR-03', capacity: 2, area: 'TERRACE', status: 'AVAILABLE', description: 'Outdoor Balcony view table' },
  { tableNumber: 'TR-04', capacity: 4, area: 'TERRACE', status: 'AVAILABLE', description: 'Garden Terrace seating' },
  { tableNumber: 'PR-01', capacity: 6, area: 'PRIVATE_ROOM', status: 'AVAILABLE', description: 'Executive Private Dining Suite' },
  { tableNumber: 'PR-02', capacity: 8, area: 'PRIVATE_ROOM', status: 'AVAILABLE', description: 'VIP Dining Room for large groups' },
  { tableNumber: 'PR-03', capacity: 6, area: 'PRIVATE_ROOM', status: 'AVAILABLE', description: 'Private Lounge suite' },
  { tableNumber: 'PR-04', capacity: 8, area: 'PRIVATE_ROOM', status: 'AVAILABLE', description: 'Presidential Dining Suite' },
];

const RestaurantTables = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadTables = async () => {
    setLoading(true);
    try {
      let serverTables = [];
      try {
        const res = await restaurantTableAPI.getAll();
        serverTables = res.data && Array.isArray(res.data) ? res.data : [];
      } catch (e) {
        console.warn('Could not load tables from backend:', e);
      }

      // Merge locally added custom tables
      try {
        const customData = localStorage.getItem('hotel_custom_tables');
        if (customData) {
          const customTables = JSON.parse(customData);
          const serverTableNums = new Set(serverTables.map((t) => t.tableNumber));
          const localOnly = customTables.filter((ct) => !serverTableNums.has(ct.tableNumber));
          serverTables = [...serverTables, ...localOnly];
        }
      } catch (_) {}

      // If no tables exist, auto seed default 18 tables
      if (serverTables.length === 0) {
        serverTables = DEFAULT_18_TABLES.map((t, idx) => ({ id: 1000 + idx, ...t }));
        try {
          localStorage.setItem('hotel_custom_tables', JSON.stringify(serverTables));
        } catch (_) {}
      }

      setTables(serverTables);
    } catch (err) {
      console.error('Failed to load restaurant tables:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInitDefaultTables = async () => {
    setLoading(true);
    try {
      const initialized = [];
      for (let i = 0; i < DEFAULT_18_TABLES.length; i++) {
        const t = DEFAULT_18_TABLES[i];
        let created = null;
        try {
          const res = await restaurantTableAPI.create(t);
          if (res && res.data) created = res.data;
        } catch (_) {}
        if (!created) {
          created = { id: 1000 + i, ...t };
        }
        initialized.push(created);
      }
      try {
        localStorage.setItem('hotel_custom_tables', JSON.stringify(initialized));
      } catch (_) {}
      await loadTables();
    } catch (err) {
      console.error('Failed to initialize default tables:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTables();
  }, []);

  const handleStatusChange = async (tableId, newStatus) => {
    setUpdatingId(tableId);
    try {
      try {
        await restaurantTableAPI.updateStatus(tableId, newStatus);
      } catch (e) {
        console.warn('Backend table update status skipped/offline:', e);
      }

      setTables((prev) =>
        prev.map((t) => {
          if (String(t.id) === String(tableId)) {
            const updated = { ...t, status: newStatus };
            // Update local storage if it's a custom table
            try {
              const customData = localStorage.getItem('hotel_custom_tables');
              if (customData) {
                const list = JSON.parse(customData);
                const updatedList = list.map((ct) => (String(ct.id) === String(tableId) ? { ...ct, status: newStatus } : ct));
                localStorage.setItem('hotel_custom_tables', JSON.stringify(updatedList));
              }
            } catch (_) {}
            return updated;
          }
          return t;
        })
      );
    } catch (err) {
      console.error('Failed to update table status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCreateTable = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.tableNumber.trim()) {
      setFormError('Please enter a table number (e.g., MH-07 or Table 19).');
      return;
    }

    setSubmitting(true);
    const payload = {
      tableNumber: formData.tableNumber.trim().toUpperCase(),
      capacity: Number(formData.capacity || 4),
      area: formData.area,
      status: formData.status,
      description: formData.description.trim(),
    };

    let newTable = null;
    try {
      const res = await restaurantTableAPI.create(payload);
      if (res && res.data) {
        newTable = res.data;
      }
    } catch (err) {
      console.warn('Backend table create skipped or offline, storing locally:', err);
    }

    if (!newTable) {
      newTable = {
        id: Date.now(),
        ...payload,
      };
    }

    // Save to local custom tables store
    try {
      const customData = localStorage.getItem('hotel_custom_tables');
      const customList = customData ? JSON.parse(customData) : [];
      const updatedList = [...customList.filter((ct) => ct.tableNumber !== newTable.tableNumber), newTable];
      localStorage.setItem('hotel_custom_tables', JSON.stringify(updatedList));
    } catch (_) {}

    setTables((prev) => [...prev.filter((t) => t.tableNumber !== newTable.tableNumber), newTable]);
    setShowAddModal(false);
    setFormData(initialForm);
    setSubmitting(false);
  };

  const handleDeleteTable = async (tableId, tableNum) => {
    if (!window.confirm(`Are you sure you want to delete ${tableNum}?`)) {
      return;
    }
    try {
      try {
        await restaurantTableAPI.delete(tableId);
      } catch (e) {
        console.warn('Backend delete table error:', e);
      }

      setTables((prev) => prev.filter((t) => String(t.id) !== String(tableId)));

      try {
        const customData = localStorage.getItem('hotel_custom_tables');
        if (customData) {
          const list = JSON.parse(customData);
          const updatedList = list.filter((ct) => String(ct.id) !== String(tableId));
          localStorage.setItem('hotel_custom_tables', JSON.stringify(updatedList));
        }
      } catch (_) {}
    } catch (err) {
      console.error('Failed to delete table:', err);
    }
  };

  // Group by area
  const grouped = tables.reduce((acc, t) => {
    const area = t.area || 'MAIN_HALL';
    (acc[area] = acc[area] || []).push(t);
    return acc;
  }, {});

  const areaOrder = ['MAIN_HALL', 'TERRACE', 'PRIVATE_ROOM'];

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner-lg" />
        <p>Loading restaurant floor plan...</p>
      </div>
    );
  }

  return (
    <div className="restaurant-tables-page">
      {/* Header with Add Table Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span className="eyebrow" style={{ color: '#0284c7' }}>Atelier Dining Floor</span>
          <h1 style={{ margin: '2px 0 0', fontSize: '24px', color: '#0f172a' }}>Restaurant Tables & Floor Plan</h1>
          <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
            Manage dining seating, active table statuses, and provision new restaurant tables.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            type="button"
            className="outline-button"
            onClick={handleInitDefaultTables}
            title="Initialize Default 18 Tables"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', backgroundColor: '#0284c7', color: '#ffffff', borderColor: '#0284c7', fontWeight: 600 }}
          >
            <span className="material-symbols-outlined">restart_alt</span>
            <span>Initialize Default Tables (18)</span>
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={() => {
              setFormData(initialForm);
              setFormError('');
              setShowAddModal(true);
            }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', backgroundColor: '#065f46' }}
          >
            <span className="material-symbols-outlined">add_circle</span>
            <span>Add New Table</span>
          </button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="table-status-summary">
        {Object.entries(STATUS_CONFIG).map(([status, cfg]) => {
          const count = tables.filter((t) => t.status === status).length;
          return (
            <div key={status} className="status-stat-card" style={{ borderColor: cfg.color }}>
              <span className="material-symbols-outlined" style={{ color: cfg.color }}>{cfg.icon}</span>
              <div>
                <strong style={{ color: cfg.color }}>{count}</strong>
                <span>{cfg.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floor plan by area */}
      {areaOrder.map((area) => {
        if (!grouped[area] || grouped[area].length === 0) return null;
        const areaInfo = AREA_LABELS[area] || { label: area, icon: 'table_restaurant' };
        return (
          <div key={area} className="floor-plan-section" style={{ marginBottom: '32px' }}>
            <div className="floor-plan-area-heading" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span className="material-symbols-outlined" style={{ color: '#0284c7' }}>{areaInfo.icon}</span>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>{areaInfo.label}</h3>
              <span className="table-count" style={{ backgroundColor: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>
                {grouped[area].length} table{grouped[area].length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="floor-plan-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
              {grouped[area].map((table) => {
                const cfg = STATUS_CONFIG[table.status] || STATUS_CONFIG.AVAILABLE;
                return (
                  <div
                    key={table.id}
                    className="floor-plan-table-card"
                    style={{
                      borderColor: cfg.color,
                      backgroundColor: cfg.bg + '30',
                      borderRadius: '12px',
                      border: `1.5px solid ${cfg.color}`,
                      padding: '16px',
                      position: 'relative',
                    }}
                  >
                    <div className="floor-table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span className="floor-table-number" style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                        {table.tableNumber}
                      </span>
                      <span
                        className="status-pill"
                        style={{ background: cfg.bg, color: cfg.color, padding: '3px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{cfg.icon}</span>
                        {cfg.label}
                      </span>
                    </div>

                    <div className="floor-table-capacity" style={{ fontSize: '13px', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>group</span>
                      Seats {table.capacity}
                    </div>

                    {table.description && (
                      <p className="floor-table-desc" style={{ fontSize: '12px', color: '#64748b', margin: '0 0 12px' }}>
                        {table.description}
                      </p>
                    )}

                    {/* Actions bar: Status dropdown & Delete button */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '12px' }}>
                      <select
                        className="field floor-table-status-select"
                        value={table.status}
                        disabled={updatingId === table.id}
                        onChange={(e) => handleStatusChange(table.id, e.target.value)}
                        style={{ flex: 1, padding: '6px 8px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      >
                        {Object.entries(STATUS_CONFIG).map(([s, c]) => (
                          <option key={s} value={s}>{c.label}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleDeleteTable(table.id, table.tableNumber)}
                        title="Delete Table"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px', display: 'flex', alignItems: 'center' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {tables.length === 0 && (
        <div className="empty-state-card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <span className="material-symbols-outlined empty-state-icon" style={{ fontSize: '48px', color: '#94a3b8' }}>table_restaurant</span>
          <h3 style={{ marginTop: '16px' }}>No Tables Found</h3>
          <p style={{ color: '#64748b', maxWidth: '400px', margin: '8px auto 24px' }}>
            Click "Add New Table" above to provision restaurant tables for your dining floor plan.
          </p>
          <button
            type="button"
            className="primary-button"
            onClick={() => setShowAddModal(true)}
          >
            Add New Table
          </button>
        </div>
      )}

      {/* Add New Table Modal Dialog */}
      {showAddModal && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal-card" style={{ background: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '460px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ color: '#065f46' }}>table_restaurant</span>
                <h2 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>Add New Restaurant Table</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {formError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateTable}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Table Number / Identifier *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MH-07, TR-05, Table 19"
                  value={formData.tableNumber}
                  onChange={(e) => setFormData({ ...formData, tableNumber: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Seating Capacity *
                  </label>
                  <select
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  >
                    <option value="2">2 Seats</option>
                    <option value="4">4 Seats</option>
                    <option value="6">6 Seats</option>
                    <option value="8">8+ Seats</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Dining Area *
                  </label>
                  <select
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  >
                    <option value="MAIN_HALL">Main Hall</option>
                    <option value="TERRACE">Terrace</option>
                    <option value="PRIVATE_ROOM">Private Room</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Initial Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                >
                  <option value="AVAILABLE">Available</option>
                  <option value="RESERVED">Reserved</option>
                  <option value="OCCUPIED">Occupied</option>
                  <option value="CLEANING">Cleaning</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Description / Location Notes
                </label>
                <textarea
                  rows="2"
                  placeholder="Optional description e.g. Window booth with garden views"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#475569', cursor: 'pointer', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: '#065f46', color: '#ffffff', cursor: 'pointer', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check</span>
                  <span>{submitting ? 'Adding...' : 'Create Table'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantTables;
