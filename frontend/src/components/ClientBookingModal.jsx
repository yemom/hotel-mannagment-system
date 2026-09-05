import React, { useState } from 'react';

const ClientBookingModal = ({
  room,
  searchDates,
  currentUser,
  onConfirm,
  onClose,
}) => {
  const [modalCheckIn, setModalCheckIn] = useState(searchDates.checkIn || new Date().toISOString().split('T')[0]);
  const [modalCheckOut, setModalCheckOut] = useState(
    searchDates.checkOut ||
      new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [modalGuests, setModalGuests] = useState(Number(searchDates.guests || 2));
  const [specialRequests, setSpecialRequests] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Calculate nights
  const start = new Date(modalCheckIn);
  const end = new Date(modalCheckOut);
  const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24));
  const nights = diffDays > 0 ? diffDays : 1;

  const pricePerNight = Number(room.basePrice || 120);
  const subtotal = pricePerNight * nights;
  const taxesAndFees = subtotal * 0.12; // 12% standard hotel tax
  const grandTotal = subtotal + taxesAndFees;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (new Date(modalCheckOut) <= new Date(modalCheckIn)) {
      setError('Check-out date must be after check-in date.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onConfirm({
        roomId: room.id,
        guestId: currentUser?.id,
        checkInDate: modalCheckIn,
        checkOutDate: modalCheckOut,
        numberOfGuests: Number(modalGuests || 1),
        specialRequests,
        totalPrice: grandTotal,
      });
    } catch (err) {
      setError(err.message || 'Failed to submit reservation.');
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card booking-summary-modal" style={{ maxWidth: '640px' }}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <span className="eyebrow" style={{ color: '#064e3b' }}>የ-mom Hotel Accommodations</span>
            <h2>Confirm Your Room Stay</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {error && (
          <div className="auth-alert auth-alert-error" style={{ marginTop: '12px' }}>
            <span className="material-symbols-outlined">error</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="modal-body-scroll">
            {/* Room Card Preview */}
            <div className="summary-room-preview">
              <img
                src={room.image}
                alt={room.roomType}
                className="summary-room-img"
              />
              <div className="summary-room-info">
                <span className="room-type-tag">{room.roomType} Room</span>
                <h3>Room {room.roomNumber}</h3>
                <p className="summary-room-desc">{room.description}</p>
                <div className="summary-amenities">
                  <span><span className="material-symbols-outlined">wifi</span> Free High-speed WiFi</span>
                  <span><span className="material-symbols-outlined">group</span> Up to {room.capacity} Guests</span>
                  {room.hasBalcony && <span><span className="material-symbols-outlined">balcony</span> Balcony View</span>}
                  {room.hasBathtub && <span><span className="material-symbols-outlined">bathtub</span> Soaking Tub</span>}
                </div>
              </div>
            </div>

            {/* Editable Stay Dates & Guests Selection */}
            <div className="summary-section" style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div className="summary-section-title" style={{ marginBottom: '12px' }}>
                <span className="material-symbols-outlined">calendar_month</span>
                <h4>Dates &amp; Guest Count</h4>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label htmlFor="modal-checkin">
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>login</span> Check-in Date
                  </label>
                  <input
                    id="modal-checkin"
                    type="date"
                    className="field"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={modalCheckIn}
                    onChange={(e) => setModalCheckIn(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="modal-checkout">
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>logout</span> Check-out Date
                  </label>
                  <input
                    id="modal-checkout"
                    type="date"
                    className="field"
                    required
                    min={modalCheckIn}
                    value={modalCheckOut}
                    onChange={(e) => setModalCheckOut(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '10px' }}>
                <label htmlFor="modal-guests">
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>group</span> Party Size / Number of Guests
                </label>
                <select
                  id="modal-guests"
                  className="field"
                  value={modalGuests}
                  onChange={(e) => setModalGuests(Number(e.target.value))}
                >
                  {Array.from({ length: room.capacity || 4 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? 'Guest' : 'Guests'} (Room fits up to {room.capacity})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#475569', marginTop: '8px' }}>
                <span>Duration: <strong>{nights} {nights === 1 ? 'Night' : 'Nights'}</strong></span>
                <span>Check-in: 3:00 PM · Check-out: 11:00 AM</span>
              </div>
            </div>

            {/* Guest Details (Pre-filled from Profile) */}
            <div className="summary-section">
              <div className="summary-section-title">
                <span className="material-symbols-outlined">person</span>
                <h4>Guest Profile Details</h4>
              </div>
              <div className="guest-prefill-grid">
                <div className="prefill-item">
                  <span className="prefill-label">Guest Name</span>
                  <span className="prefill-val">
                    {currentUser?.firstName} {currentUser?.lastName || 'Valued Guest'}
                  </span>
                </div>
                <div className="prefill-item">
                  <span className="prefill-label">Email Address</span>
                  <span className="prefill-val">{currentUser?.email}</span>
                </div>
                <div className="prefill-item">
                  <span className="prefill-label">Contact Phone</span>
                  <span className="prefill-val">{currentUser?.phone || '+251 900 000 000'}</span>
                </div>
                <div className="prefill-item">
                  <span className="prefill-label">Hotel Member</span>
                  <span className="prefill-val prefill-badge">የ-mom VIP Guest</span>
                </div>
              </div>
            </div>

            {/* Special Requests */}
            <div className="summary-section">
              <div className="summary-section-title">
                <span className="material-symbols-outlined">edit_note</span>
                <h4>Special Requests & Preferences</h4>
              </div>
              <textarea
                className="textarea"
                rows="2"
                placeholder="e.g., High floor, quiet corner, early check-in, extra pillows, balcony view..."
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
              />
            </div>

            {/* Price Calculation Card */}
            <div className="price-breakdown-card">
              <h4>Price Breakdown</h4>
              <div className="price-row">
                <span>${pricePerNight.toFixed(2)} × {nights} {nights === 1 ? 'night' : 'nights'}</span>
                <strong>${subtotal.toFixed(2)}</strong>
              </div>
              <div className="price-row">
                <span>Occupancy Taxes & City Fees (12%)</span>
                <span>${taxesAndFees.toFixed(2)}</span>
              </div>
              <div className="price-divider" />
              <div className="price-row total-row">
                <div>
                  <strong>Total Amount Due</strong>
                  <span className="price-note">Payable at hotel front-desk check-in</span>
                </div>
                <strong className="grand-total-amount">${grandTotal.toFixed(2)}</strong>
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="modal-actions" style={{ marginTop: '20px' }}>
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="primary-button confirm-booking-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">task_alt</span>
                  <span>Confirm Reservation (${grandTotal.toFixed(2)})</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientBookingModal;
