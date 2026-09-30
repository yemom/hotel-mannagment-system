import React, { useEffect, useMemo, useState } from 'react';
import { pricingAPI, roomAPI } from '../services/api';

const INITIAL_ROOM_RATES = {
  SINGLE: { name: 'Classic Single', inventory: 12, size: '22m²', view: 'Courtyard View • Queen Bed', base: 210, weekend: 262.50, minStay: '1 Night Min', extraGuest: 50, trigger: '95% (Automated +15% armed)', badge: null },
  DOUBLE: { name: 'Superior Double', inventory: 18, size: '32m²', view: 'Private Balcony • King or Twin', base: 285, weekend: 356.25, minStay: '2-Night Weekend Policy', extraGuest: 60, trigger: '80% (Automated +10% armed)', badge: null },
  DELUXE: { name: 'Deluxe Ocean King', inventory: 14, size: '45m²', view: 'Panoramic Coastal View + Soaking Tub', base: 380, weekend: 475.00, minStay: '2 Nights Min', extraGuest: 65, trigger: '95% (Current plan 93% occupancy • Active Surge Applied)', badge: 'HIGH DEMAND' },
  SUITE: { name: 'Junior Suite', inventory: 8, size: '55m²', view: 'Living Salon + Dual Vanities • Nespresso', base: 490, weekend: 612.50, minStay: '2 Nights Min', extraGuest: 75, trigger: '75% (Automated +15% armed)', badge: null },
  PENTHOUSE: { name: 'Atelier Presidential Penthouse', inventory: 2, size: '155m²', view: 'Private Butler • Private Rooftop Terrace & Spa', base: 1250, weekend: 1562.50, minStay: '3 Nights Min', extraGuest: 120, trigger: 'Manual GM Override Required for cancellations < 7 days', badge: 'VIP RESERVE' },
};

const INITIAL_AUDIT_LOG = [
  { time: 'Oct 22, 2024 • 14:15', type: 'Deluxe Ocean King', oldRate: '$350.00', newRate: '$380.00', trigger: 'Weekend Peak Demand Adjustment', user: 'Elena Vance (Front Desk Mgr)', status: 'Applied' },
  { time: 'Oct 21, 2024 • 09:30', type: 'Superior Double', oldRate: '$270.00', newRate: '$285.00', trigger: 'Autumn Season Benchmark Update', user: 'Marcus Laurent (Director of Revenue)', status: 'Applied' },
  { time: 'Oct 19, 2024 • 18:00', type: 'Atelier Presidential Penthouse', oldRate: '$1,150.00', newRate: '$1,250.00', trigger: 'VIP Holiday Season Alignment', user: 'Marcus Laurent (Director of Revenue)', status: 'Applied' },
  { time: 'Oct 18, 2024 • 11:10', type: 'Junior Suite', oldRate: '$465.00', newRate: '$490.00', trigger: 'Algorithmic Threshold (>86% Occupancy Auto-Bump)', user: 'Yield Algorithm (Auto)', status: 'Applied' },
  { time: 'Oct 16, 2024 • 16:02', type: 'Classic Single', oldRate: '$225.00', newRate: '$210.00', trigger: 'Mid-Week Low Pacing Flash Promotion', user: 'Elena Vance (Front Desk Mgr)', status: 'Archived' },
];

const Pricing = () => {
  const [rates, setRates] = useState(INITIAL_ROOM_RATES);
  const [auditLog, setAuditLog] = useState(INITIAL_AUDIT_LOG);
  const [toast, setToast] = useState(null);

  // Algorithmic Rules Engine Toggles
  const [smartPricing, setSmartPricing] = useState(true);
  const [weekendSurge, setWeekendSurge] = useState(true);
  const [corporateRate, setCorporateRate] = useState(true);
  const [parityLock, setParityLock] = useState(true);

  const showToast = (text) => {
    setToast(text);
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    pricingAPI.getAllBaseRates().then((res) => {
      if (res.data) {
        setRates((prev) => {
          const next = { ...prev };
          Object.keys(res.data).forEach((k) => {
            if (next[k]) {
              next[k].base = Number(res.data[k]);
              next[k].weekend = Math.round(Number(res.data[k]) * 1.25 * 100) / 100;
            }
          });
          return next;
        });
      }
    }).catch(() => {});
  }, []);

  const handleRateChange = (key, field, value) => {
    setRates((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      },
    }));
  };

  const handleApplyRate = (key) => {
    const item = rates[key];
    const newRateNum = Number(item.base);
    const logEntry = {
      time: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' • ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      type: item.name,
      oldRate: `$${(newRateNum * 0.95).toFixed(2)}`,
      newRate: `$${newRateNum.toFixed(2)}`,
      trigger: 'Manual Manager Yield Adjustment',
      user: 'Elena Vance (Front Desk Mgr)',
      status: 'Applied',
    };
    setAuditLog((prev) => [logEntry, ...prev]);
    showToast(`Updated nightly rate for ${item.name} to $${newRateNum.toFixed(2)}`);
  };

  return (
    <section className="page-section">
      {toast && (
        <div className="client-toast-container">
          <div className="client-toast client-toast-success">
            <span className="material-symbols-outlined">check_circle</span>
            <span>{toast}</span>
          </div>
        </div>
      )}

      {/* Header matching Image 4 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '22px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <span style={{ background: 'var(--surface-line)', color: 'var(--jade)', border: '1px solid var(--surface-line)', padding: '3px 10px', borderRadius: '14px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.04em' }}>
              &bull; AUTUMN HIGH-SEASON ACTIVE &bull; OCT 1 &ndash; NOV 30
            </span>
          </div>
          <h1 style={{ fontSize: '26px', margin: '4px 0 0', color: 'var(--text)' }}>Dynamic Rate &amp; Pricing Management</h1>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)' }}>
            Configure real-time yields, seasonal surcharges, and inventory-linked algorithm rules.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className="outline-button"
            onClick={() => showToast('Version history audit log generated')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '8px 14px' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>history</span>
            <span>Version History</span>
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={() => {
              showToast('Exporting current rate sheet to CSV/PDF...');
              window.print();
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '8px 16px', background: 'var(--jade)' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>
            <span>Export Rate Sheet</span>
          </button>
        </div>
      </div>

      {/* 4 Top KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
        <div style={{ background: '#fff', border: '1px solid var(--surface-line)', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>AVERAGE DAILY RATE (ADR)</span>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--jade)' }}>attach_money</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text)', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            $338.00
            <span style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 700, background: 'var(--surface-line)', padding: '2px 6px', borderRadius: '4px' }}>+5.8%</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '6px' }}>
            Target: $320.00 &bull; RevPAR: $287.20
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid var(--surface-line)', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>BASE RATE INDEX</span>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--accent)' }}>stacked_line_chart</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text)' }}>100.0%</div>
          <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '6px' }}>
            Portfolio Parity: Optimal Range
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid var(--surface-line)', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>WEEKEND SURGE</span>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--amber)' }}>trending_up</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text)', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            +25%
            <span style={{ fontSize: '11px', color: 'var(--amber)', fontWeight: 700, background: 'var(--surface-line)', padding: '2px 6px', borderRadius: '4px' }}>Fri &ndash; Sun</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '6px' }}>
            Applied automatically &bull; Max: $1,562
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid var(--surface-line)', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>HOLIDAY MULTIPLIER</span>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--accent)' }}>celebration</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text)', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            +40%
            <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 700, background: 'var(--surface-line)', padding: '2px 6px', borderRadius: '4px' }}>Nov 28 Active</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '6px' }}>
            Thanksgiving Gala Week &bull; 3-Night Min
          </div>
        </div>
      </div>

      {/* Main 2-Column Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start', marginBottom: '32px' }}>
        {/* Left Column: Room Type Rate Matrix */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <h2 style={{ fontSize: '18px', margin: 0, color: 'var(--text)' }}>Room Type Rate Matrix</h2>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)' }}>Direct base allocations, guest multipliers, and seasonal yields per category.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setRates(INITIAL_ROOM_RATES);
                showToast('Reset all rates to baseline defaults');
              }}
              style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>restart_alt</span>
              Reset All Defaults
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {Object.entries(rates).map(([key, item]) => (
              <div
                key={key}
                style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid var(--surface-line)',
                  padding: '18px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                }}
              >
                {/* Card Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: 'var(--surface-soft)', border: '1px solid var(--surface-line)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '24px', color: 'var(--jade)' }}>bed</span>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text)' }}>{item.name}</h3>
                        <span style={{ fontSize: '11px', color: 'var(--muted)', background: 'var(--surface-soft)', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>
                          {item.inventory} Rooms Active
                        </span>
                        {item.badge && (
                          <span style={{ fontSize: '10px', color: 'var(--amber)', background: 'var(--surface-line)', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--muted)' }}>
                        {item.size} &bull; {item.view}
                      </p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700 }}>CURRENT BASE</span>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text)' }}>${item.base} <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 500 }}>/ night</span></div>
                  </div>
                </div>

                {/* Card Inputs Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', background: 'var(--surface-soft)', padding: '12px', borderRadius: '8px', border: '1px solid var(--surface-soft)' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--muted)', marginBottom: '4px' }}>BASE NIGHTLY ($)</label>
                    <input
                      type="number"
                      value={item.base}
                      onChange={(e) => handleRateChange(key, 'base', Number(e.target.value))}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--surface-line)', fontSize: '13px', fontWeight: 700 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--muted)', marginBottom: '4px' }}>WEEKEND RATE</label>
                    <input
                      type="number"
                      value={item.weekend}
                      onChange={(e) => handleRateChange(key, 'weekend', Number(e.target.value))}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--surface-line)', fontSize: '13px', fontWeight: 700 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--muted)', marginBottom: '4px' }}>MIN STAY REQ.</label>
                    <select
                      value={item.minStay}
                      onChange={(e) => handleRateChange(key, 'minStay', e.target.value)}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--surface-line)', fontSize: '12px' }}
                    >
                      <option value="1 Night Min">1 Night Min</option>
                      <option value="2 Nights Min">2 Nights Min</option>
                      <option value="2-Night Weekend Policy">2-Night Weekend Policy</option>
                      <option value="3 Nights Min">3 Nights Min</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--muted)', marginBottom: '4px' }}>EXTRA GUEST / OCC.</label>
                    <input
                      type="number"
                      value={item.extraGuest}
                      onChange={(e) => handleRateChange(key, 'extraGuest', Number(e.target.value))}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--surface-line)', fontSize: '13px' }}
                    />
                  </div>
                </div>

                {/* Card Footer: Trigger note & Apply Button */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />
                    Occupancy Trigger: {item.trigger}
                  </span>
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => handleApplyRate(key)}
                    style={{ padding: '6px 14px', fontSize: '12px', background: 'var(--jade)', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>price_change</span>
                    <span>Apply Rate Update</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Algorithmic Rules Engine & Revenue Forecast */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Algorithmic Rules Engine */}
          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid var(--surface-line)', padding: '18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--jade)', fontSize: '20px' }}>tune</span>
              <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--text)' }}>Algorithmic Rules Engine</h3>
            </div>
            <p style={{ margin: '0 0 16px', fontSize: '12px', color: 'var(--muted)' }}>
              Control real-time distribution policies across direct booking engines and global distribution systems (GDS).
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { title: 'Smart Dynamic Pricing', desc: 'Auto-allocate rates by ±15% whenever overall property occupancy exceeds 82%.', state: smartPricing, set: setSmartPricing },
                { title: 'Weekend Surge Multiplier', desc: 'Imposes automatic +25% base uplift for Friday, Saturday, and Sunday bookings.', state: weekendSurge, set: setWeekendSurge },
                { title: 'Corporate Preferred Rate', desc: 'Applies negotiated -15% tariff for vetted corporate luxury consortium accounts.', state: corporateRate, set: setCorporateRate },
                { title: 'Channel Manager Rate Parity Lock', desc: 'Forces OTA rate blocking.', state: parityLock, set: setParityLock },
              ].map((rule) => (
                <div key={rule.title} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--surface-soft)' }}>
                  <div>
                    <strong style={{ fontSize: '13px', color: 'var(--text)', display: 'block' }}>{rule.title}</strong>
                    <span style={{ fontSize: '11px', color: 'var(--muted)', lineHeight: 1.3, display: 'block', marginTop: '2px' }}>{rule.desc}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={rule.state}
                    onChange={(e) => rule.set(e.target.checked)}
                    style={{ accentColor: 'var(--jade)', width: '18px', height: '18px', marginTop: '2px', cursor: 'pointer' }}
                  />
                </div>
              ))}
            </div>

            <button
              type="button"
              className="outline-button"
              onClick={() => showToast('Yield thresholds dialog configured')}
              style={{ width: '100%', marginTop: '16px', fontSize: '12px', padding: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>settings</span>
              <span>Configure Yield Thresholds</span>
            </button>
          </div>

          {/* Revenue Forecast Box */}
          <div style={{ background: 'var(--surface-line)', borderRadius: '12px', border: '1px solid var(--surface-line)', padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--jade)' }}>analytics</span>
              <strong style={{ color: 'var(--jade)', fontSize: '14px' }}>Revenue Manager Forecast</strong>
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text)', lineHeight: 1.4 }}>
              Occupancy for late October is pacing <strong>14.2% higher</strong> than same-time last year. Recommending shifting Deluxe Ocean King minimum stay requirement to 2 nights starting next Monday.
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--surface-line)' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text)' }}>Target RevPAR</span>
                <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--jade)' }}>$310</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', color: 'var(--text)' }}>Projected Rev</span>
                <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--jade)' }}>+$92,850</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing History & Audit Log */}
      <div className="panel" style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid var(--surface-line)', overflow: 'hidden' }}>
        <div className="panel-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--surface-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '16px', margin: 0, color: 'var(--text)' }}>Pricing History &amp; Audit Log</h2>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)' }}>Immutable change record of nightly tariffs, yield triggers, and manual staff overrides.</p>
          </div>
          <button
            type="button"
            className="outline-button"
            onClick={() => showToast('Audit log exported to compliance file')}
            style={{ fontSize: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>file_download</span>
            <span>Audit Export</span>
          </button>
        </div>

        <table className="table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>DATE &amp; TIME</th>
              <th>ROOM TYPE</th>
              <th>OLD RATE</th>
              <th>NEW RATE</th>
              <th>REASON / TRIGGER</th>
              <th>MODIFIED BY</th>
              <th style={{ textAlign: 'right' }}>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {auditLog.map((log, idx) => (
              <tr key={idx}>
                <td style={{ fontSize: '12px', color: 'var(--text-soft)' }}>{log.time}</td>
                <td><strong style={{ fontSize: '13px', color: 'var(--text)' }}>{log.type}</strong></td>
                <td style={{ fontSize: '13px', color: 'var(--muted)' }}>{log.oldRate}</td>
                <td><strong style={{ fontSize: '13px', color: 'var(--accent)' }}>{log.newRate}</strong></td>
                <td style={{ fontSize: '12px', color: 'var(--text-soft)' }}>{log.trigger}</td>
                <td style={{ fontSize: '12px', color: 'var(--muted)' }}>{log.user}</td>
                <td style={{ textAlign: 'right' }}>
                  <span style={{ background: log.status === 'Applied' ? 'var(--surface-line)' : 'var(--surface-soft)', color: log.status === 'Applied' ? 'var(--jade)' : 'var(--muted)', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
                    &bull; {log.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default Pricing;
