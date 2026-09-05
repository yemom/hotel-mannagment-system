import React from 'react';

const StatCard = ({ title, value, icon, subtitle, change, trend, progress }) => {
  return (
    <div className="metric-card">
      <div className="metric-top">
        <span className="eyebrow">{title}</span>
        {icon && <span className="material-symbols-outlined">{icon}</span>}
      </div>
      <div className="metric-value">
        <strong>{value}</strong>
        {subtitle && <span className="eyebrow">{subtitle}</span>}
      </div>
      {change && (
        <p style={{ marginTop: 10, color: trend === 'down' ? '#991b1b' : '#065f46', fontWeight: 700 }}>
          {change}
        </p>
      )}
      {progress !== undefined && (
        <div style={{ marginTop: 18 }}>
          <div style={{ display: 'flex', height: 8, overflow: 'hidden', borderRadius: 999, background: '#e5e7eb' }}>
            <div style={{ width: `${Math.min(Number(progress) || 0, 100)}%`, background: '#064e3b' }} />
          </div>
          <p style={{ marginTop: 8 }}>{progress}% occupancy</p>
        </div>
      )}
    </div>
  );
};

export default StatCard;
