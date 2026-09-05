import React from 'react';

const StatusBadge = ({ status, type = 'reservation' }) => {
  const getStatusStyle = () => {
    if (type === 'guest' && status === 'VIP') {
      return 'status-navy';
    }
    if (['AVAILABLE', 'CONFIRMED', 'CHECKED_IN', 'ACTIVE'].includes(status)) {
      return 'status-green';
    }
    if (['PENDING', 'MAINTENANCE', 'RESERVED'].includes(status)) {
      return 'status-amber';
    }
    if (['OCCUPIED', 'CANCELLED', 'BLACKLISTED', 'SUSPENDED', 'INACTIVE'].includes(status)) {
      return 'status-red';
    }
    return 'status-amber';
  };

  return (
    <span className={`status-badge ${getStatusStyle()}`}>
      {(status || 'UNKNOWN').replaceAll('_', ' ')}
    </span>
  );
};

export default StatusBadge;
