import React, { useEffect, useMemo, useState } from 'react';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { guestAPI, reservationAPI, roomAPI } from '../services/api';

const statuses = ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED'];
const today = new Date().toISOString().slice(0, 10);
const initialForm = {
  guestId: '',
  roomId: '',
  checkInDate: today,
  checkOutDate: '',
  numberOfGuests: '1',
  specialRequests: '',
};

const nightsBetween = (start, end) => {
  if (!start || !end) return 0;
  return Math.max(0, Math.round((new Date(end) - new Date(start)) / 86400000));
};

const Reservations = ({ guestFacing = false }) => {
  const [reservations, setReservations] = useState([]);
  const [guests, setGuests] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [showModal, setShowModal] = useState(guestFacing);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(initialForm);

  const fetchData = async () => {
    try {
      setLoading(true);
      let resList = [];
      let guestList = [];
      let roomList = [];
      try {
        const [reservationResponse, guestResponse, roomResponse] = await Promise.all([
          reservationAPI.getAll(),
          guestAPI.getAll(),
          roomAPI.getAll(),
        ]);
        resList = reservationResponse.data || [];
        guestList = guestResponse.data || [];
        roomList = roomResponse.data || [];
      } catch (err) {
        console.warn('Backend fetch error in Reservations.jsx:', err);
      }

      // Merge local client room reservations from localStorage
      try {
        const localResList = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('client_res_') || key === 'hotel_global_room_reservations')) {
            const val = localStorage.getItem(key);
            if (val) {
              const parsed = JSON.parse(val);
              if (Array.isArray(parsed)) localResList.push(...parsed);
            }
          }
        }
        const serverResIds = new Set(resList.map((r) => String(r.id)));
        const missingLocalRes = localResList.filter((lr) => !serverResIds.has(String(lr.id)));
        resList = [...resList, ...missingLocalRes];
      } catch (_) {}

      setReservations(resList);
      setGuests(guestList);
      setRooms(roomList);
      setAvailableRooms(roomList.filter((room) => room.status === 'AVAILABLE'));
    } catch (error) {
      console.error('Error fetching reservation data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, 8000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const canSearch = formData.checkInDate && formData.checkOutDate && formData.numberOfGuests;
    if (!canSearch || nightsBetween(formData.checkInDate, formData.checkOutDate) < 1) return;
    roomAPI.getAvailable(formData.checkInDate, formData.checkOutDate, formData.numberOfGuests)
      .then((response) => setAvailableRooms(response.data || []))
      .catch(() => setAvailableRooms(rooms.filter((room) => room.status === 'AVAILABLE')));
  }, [formData.checkInDate, formData.checkOutDate, formData.numberOfGuests, rooms]);

  const filteredReservations = useMemo(() => reservations.filter((res) => {
    const search = searchTerm.toLowerCase();
    const guestName = `${res.guest?.firstName || ''} ${res.guest?.lastName || ''}`;
    const matchesSearch = !search || [guestName, res.room?.roomNumber, res.status]
      .some((value) => String(value || '').toLowerCase().includes(search));
    const matchesStatus = filterStatus === 'ALL' || res.status === filterStatus;
    return matchesSearch && matchesStatus;
  }), [reservations, searchTerm, filterStatus]);

  const selectedRoom = rooms.find((room) => String(room.id) === String(formData.roomId)) ||
    availableRooms.find((room) => String(room.id) === String(formData.roomId));
  const nights = nightsBetween(formData.checkInDate, formData.checkOutDate);
  const quotedTotal = nights * Number(selectedRoom?.basePrice || 0);

  const handleCreateReservation = async (event) => {
    event.preventDefault();
    await reservationAPI.create({
      guestId: Number(formData.guestId),
      roomId: Number(formData.roomId),
      checkInDate: formData.checkInDate,
      checkOutDate: formData.checkOutDate,
      numberOfGuests: Number(formData.numberOfGuests),
      specialRequests: formData.specialRequests,
    });
    setShowModal(false);
    setFormData(initialForm);
    setStep(1);
    fetchData();
  };

  const updateStatus = async (reservation, status) => {
    const actions = {
      CONFIRMED: reservationAPI.confirm,
      CHECKED_IN: reservationAPI.checkIn,
      CHECKED_OUT: reservationAPI.checkOut,
      CANCELLED: reservationAPI.cancel,
    };
    if (actions[status]) {
      await actions[status](reservation.id);
      fetchData();
    }
  };

  const columns = [
    { key: 'guest', label: 'Guest Name', render: (guest) => guest ? `${guest.firstName} ${guest.lastName}` : 'N/A' },
    { key: 'room', label: 'Room', render: (room) => room ? `${room.roomNumber} - ${room.roomType}` : 'N/A' },
    { key: 'checkInDate', label: 'Check-in' },
    { key: 'checkOutDate', label: 'Check-out' },
    { key: 'status', label: 'Status', render: (status) => <StatusBadge status={status} /> },
    { key: 'totalPrice', label: 'Total Price', render: (price) => `$${Number(price || 0).toFixed(2)}`, numeric: true },
  ];

  if (guestFacing) {
    return (
      <section className="page-section">
        <div className="hero-panel">
          <h1>Book Your Stay</h1>
          <p>Search live room availability and submit a reservation request.</p>
        </div>
        {showModal && <ReservationModal {...{ formData, setFormData, guests, availableRooms, step, setStep, selectedRoom, nights, quotedTotal, onSubmit: handleCreateReservation, onClose: () => setShowModal(false), guestFacing }} />}
      </section>
    );
  }

  return (
    <section className="page-section">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Booking desk</span>
          <h1>Reservation Management</h1>
          <p>Create bookings, monitor arrivals and departures, and progress reservation status.</p>
        </div>
        <button className="primary-button" type="button" onClick={() => setShowModal(true)}>
          <span className="material-symbols-outlined">add</span>
          New Reservation
        </button>
      </div>

      <div className="panel">
        <div className="panel-header toolbar">
          <input className="field" placeholder="Search guest, room, or status" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <select className="select" style={{ width: 210 }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="ALL">All Statuses</option>
            {statuses.map((status) => <option key={status} value={status}>{status.replace('_', ' ')}</option>)}
          </select>
        </div>
        <DataTable
          columns={columns}
          data={filteredReservations}
          loading={loading}
          actions={[
            { label: 'Confirm', icon: 'done', onClick: (res) => updateStatus(res, 'CONFIRMED') },
            { label: 'Check In', icon: 'login', onClick: (res) => updateStatus(res, 'CHECKED_IN') },
            { label: 'Check Out', icon: 'logout', onClick: (res) => updateStatus(res, 'CHECKED_OUT') },
            { label: 'Cancel', icon: 'close', variant: 'danger', onClick: (res) => updateStatus(res, 'CANCELLED') },
          ]}
        />
      </div>

      {showModal && <ReservationModal {...{ formData, setFormData, guests, availableRooms, step, setStep, selectedRoom, nights, quotedTotal, onSubmit: handleCreateReservation, onClose: () => setShowModal(false) }} />}
    </section>
  );
};

const ReservationModal = ({ formData, setFormData, guests, availableRooms, step, setStep, selectedRoom, nights, quotedTotal, onSubmit, onClose, guestFacing }) => (
  <div className="modal-backdrop">
    <form className="modal-card" onSubmit={onSubmit}>
      <div className="section-heading">
        <div>
          <span className="eyebrow">Guided booking</span>
          <h2>{guestFacing ? 'Room Search & Booking' : 'New Reservation'}</h2>
        </div>
        <button className="icon-button" type="button" onClick={onClose} aria-label="Close">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
      <div className="flow-steps">
        {['Guest', 'Room', 'Dates', 'Confirm'].map((label, index) => (
          <button type="button" key={label} className={`flow-step${step === index + 1 ? ' active' : ''}`} onClick={() => setStep(index + 1)}>
            {index + 1}. {label}
          </button>
        ))}
      </div>

      {step === 1 && (
        <div className="form-grid">
          <label className="form-field" style={{ gridColumn: '1 / -1' }}>Guest<select className="select" required value={formData.guestId} onChange={(e) => setFormData({ ...formData, guestId: e.target.value })}>
            <option value="">Select guest</option>
            {guests.map((guest) => <option key={guest.id} value={guest.id}>{guest.firstName} {guest.lastName} - {guest.email}</option>)}
          </select></label>
        </div>
      )}

      {step === 2 && (
        <div className="booking-grid">
          {availableRooms.map((room) => (
            <button type="button" key={room.id} className="booking-card" style={{ padding: 16, textAlign: 'left', borderColor: String(room.id) === String(formData.roomId) ? '#064e3b' : '#e5e7eb' }} onClick={() => setFormData({ ...formData, roomId: room.id })}>
              <h3>Room {room.roomNumber}</h3>
              <p>{room.roomType} - {room.capacity} guests</p>
              <strong>${Number(room.basePrice || 0).toFixed(2)} / night</strong>
            </button>
          ))}
          {!availableRooms.length && <p>No available rooms for the selected date and guest count.</p>}
        </div>
      )}

      {step === 3 && (
        <div className="form-grid">
          <label className="form-field">Check-in<input className="field" type="date" required value={formData.checkInDate} onChange={(e) => setFormData({ ...formData, checkInDate: e.target.value })} /></label>
          <label className="form-field">Check-out<input className="field" type="date" required value={formData.checkOutDate} onChange={(e) => setFormData({ ...formData, checkOutDate: e.target.value })} /></label>
          <label className="form-field">Guests<input className="field" type="number" min="1" max="20" required value={formData.numberOfGuests} onChange={(e) => setFormData({ ...formData, numberOfGuests: e.target.value })} /></label>
          <div className="rate-card">
            <span className="eyebrow">Availability calendar</span>
            <p>{formData.checkInDate || 'Start'} to {formData.checkOutDate || 'End'} - {nights} nights</p>
          </div>
          <label className="form-field" style={{ gridColumn: '1 / -1' }}>Special Requests<textarea className="textarea" rows="3" value={formData.specialRequests} onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })} /></label>
        </div>
      )}

      {step === 4 && (
        <div className="panel-body rate-card">
          <span className="eyebrow">Pricing confirmation</span>
          <h2>${quotedTotal.toFixed(2)}</h2>
          <p>{selectedRoom ? `Room ${selectedRoom.roomNumber}, ${selectedRoom.roomType}, ${nights} nights at $${Number(selectedRoom.basePrice || 0).toFixed(2)}.` : 'Select a room to confirm pricing.'}</p>
        </div>
      )}

      <div className="modal-actions" style={{ marginTop: 24 }}>
        <button className="secondary-button" type="button" onClick={() => setStep(Math.max(1, step - 1))}>Back</button>
        {step < 4 ? (
          <button className="primary-button" type="button" onClick={() => setStep(Math.min(4, step + 1))}>Continue</button>
        ) : (
          <button className="primary-button" type="submit" disabled={!formData.guestId || !formData.roomId || nights < 1}>Submit Reservation</button>
        )}
      </div>
    </form>
  </div>
);

export default Reservations;
