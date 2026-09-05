import React, { useEffect, useMemo, useState } from 'react';
import ClientNavbar from '../components/ClientNavbar';
import ClientBookingModal from '../components/ClientBookingModal';
import ClientProfile from '../components/ClientProfile';
import StatusBadge from '../components/StatusBadge';
import RestaurantPage from './RestaurantPage';
import { useAuth } from '../context/AuthContext';
import { reservationAPI, roomAPI, tableReservationAPI } from '../services/api';

// Curated high-resolution hospitality room images
const ROOM_IMAGES = {
  SINGLE: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=900&q=80',
  DOUBLE: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=900&q=80',
  SUITE: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80',
  DELUXE: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=900&q=80',
  PENTHOUSE: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=900&q=80',
};

// Seed catalog in case backend starts with blank H2 DB
const SEED_ROOMS = [
  {
    id: 101,
    roomNumber: '101',
    roomType: 'SINGLE',
    basePrice: 85,
    capacity: 1,
    status: 'AVAILABLE',
    description: 'Cozy boutique retreat with a plush queen bed, dedicated ergonomic workstation, and quiet garden views.',
    hasBathtub: false,
    hasBalcony: false,
    hasMinibar: true,
  },
  {
    id: 102,
    roomNumber: '102',
    roomType: 'DOUBLE',
    basePrice: 140,
    capacity: 2,
    status: 'AVAILABLE',
    description: 'Spacious modern room featuring two premium queen beds, artisan coffee bar, and skyline windows.',
    hasBathtub: true,
    hasBalcony: false,
    hasMinibar: true,
  },
  {
    id: 103,
    roomNumber: '103',
    roomType: 'SINGLE',
    basePrice: 95,
    capacity: 1,
    status: 'AVAILABLE',
    description: 'Serene corner single with floor-to-ceiling windows, rain shower, and acoustic soundproofing.',
    hasBathtub: false,
    hasBalcony: true,
    hasMinibar: true,
  },
  {
    id: 104,
    roomNumber: '104',
    roomType: 'SINGLE',
    basePrice: 90,
    capacity: 1,
    status: 'AVAILABLE',
    description: 'Sunlit garden single with French doors leading to a private botanical courtyard.',
    hasBathtub: false,
    hasBalcony: false,
    hasMinibar: false,
  },
  {
    id: 201,
    roomNumber: '201',
    roomType: 'SUITE',
    basePrice: 220,
    capacity: 3,
    status: 'AVAILABLE',
    description: 'Executive boutique suite with a partitioned salon lounge, Italian marble bath, and private terrace.',
    hasBathtub: true,
    hasBalcony: true,
    hasMinibar: true,
  },
  {
    id: 202,
    roomNumber: '202',
    roomType: 'DOUBLE',
    basePrice: 155,
    capacity: 2,
    status: 'AVAILABLE',
    description: 'Superior double with sweeping courtyard views, king featherbed, and complimentary artisan refreshments.',
    hasBathtub: true,
    hasBalcony: true,
    hasMinibar: true,
  },
  {
    id: 203,
    roomNumber: '203',
    roomType: 'DOUBLE',
    basePrice: 145,
    capacity: 2,
    status: 'AVAILABLE',
    description: 'Artisan twin double with custom timber furnishings, designer reading nook, and espresso bar.',
    hasBathtub: false,
    hasBalcony: false,
    hasMinibar: true,
  },
  {
    id: 204,
    roomNumber: '204',
    roomType: 'DOUBLE',
    basePrice: 160,
    capacity: 2,
    status: 'AVAILABLE',
    description: 'Corner double suite with wrap-around city panorama, heated bathroom floors, and balcony.',
    hasBathtub: true,
    hasBalcony: true,
    hasMinibar: true,
  },
  {
    id: 301,
    roomNumber: '301',
    roomType: 'DELUXE',
    basePrice: 290,
    capacity: 4,
    status: 'AVAILABLE',
    description: 'Ultra-luxurious corner suite with panoramic skyline views, walk-in dressing room, and soaking tub.',
    hasBathtub: true,
    hasBalcony: true,
    hasMinibar: true,
  },
  {
    id: 302,
    roomNumber: '302',
    roomType: 'SUITE',
    basePrice: 240,
    capacity: 3,
    status: 'AVAILABLE',
    description: 'Grand family suite with dual vanity bath, private sun deck, and plush sleeper sofa for extra comfort.',
    hasBathtub: true,
    hasBalcony: true,
    hasMinibar: true,
  },
  {
    id: 303,
    roomNumber: '303',
    roomType: 'SUITE',
    basePrice: 255,
    capacity: 3,
    status: 'AVAILABLE',
    description: 'Romantic bridal suite with private jacuzzi whirlpool, chilled champagne service, and city lights.',
    hasBathtub: true,
    hasBalcony: true,
    hasMinibar: true,
  },
  {
    id: 304,
    roomNumber: '304',
    roomType: 'DELUXE',
    basePrice: 310,
    capacity: 4,
    status: 'AVAILABLE',
    description: 'Royal deluxe family suite with dual king suites, private dining nook, and full luxury amenities.',
    hasBathtub: true,
    hasBalcony: true,
    hasMinibar: true,
  },
  {
    id: 401,
    roomNumber: '401',
    roomType: 'PENTHOUSE',
    basePrice: 480,
    capacity: 4,
    status: 'AVAILABLE',
    description: 'Top-floor presidential penthouse with private wraparound balcony, fireplace salon, and butler service.',
    hasBathtub: true,
    hasBalcony: true,
    hasMinibar: true,
  },
  {
    id: 402,
    roomNumber: '402',
    roomType: 'PENTHOUSE',
    basePrice: 520,
    capacity: 5,
    status: 'AVAILABLE',
    description: 'Sky-level penthouse estate with private rooftop plunge pool, dedicated chef service, and helipad views.',
    hasBathtub: true,
    hasBalcony: true,
    hasMinibar: true,
  },
];

const ROOM_TYPES = ['ALL', 'SINGLE', 'DOUBLE', 'SUITE', 'DELUXE', 'PENTHOUSE'];

// Format dates helpers
const getTodayStr = () => new Date().toISOString().slice(0, 10);
const getFutureDateStr = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const ClientDashboard = () => {
  const { currentUser } = useAuth();

  // Active navigation tab: 'book' | 'restaurant' | 'reservations' | 'profile'
  const [activeTab, setActiveTab] = useState('book');
  // Sub-tab within 'reservations': 'all' | 'rooms' | 'tables'
  const [resSubTab, setResSubTab] = useState('all');

  // Search parameters for availability
  const [searchDates, setSearchDates] = useState({
    checkIn: getTodayStr(),
    checkOut: getFutureDateStr(3),
    guests: '2',
  });

  // Filters
  const [selectedType, setSelectedType] = useState('ALL');
  const [maxPrice, setMaxPrice] = useState(550);

  // Data states
  const [rooms, setRooms] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [tableReservations, setTableReservations] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingReservations, setLoadingReservations] = useState(false);
  // Booking modal
  const [selectedRoomForBooking, setSelectedRoomForBooking] = useState(null);
  const [alertNotice, setAlertNotice] = useState(null);

  // Promotional Code & Carousel Reel
  const [promoCode, setPromoCode] = useState('AMBASSADOR-CLUB');
  const [promoApplied, setPromoApplied] = useState(true);
  const carouselRef = React.useRef(null);
  const [isCarouselHovered, setIsCarouselHovered] = useState(false);

  // Automated Horizontal Auto-Scrolling with Hover Pause
  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    const interval = setInterval(() => {
      if (!isCarouselHovered && el) {
        if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 5) {
          el.scrollLeft = 0;
        } else {
          el.scrollLeft += 1.2;
        }
      }
    }, 25);
    return () => clearInterval(interval);
  }, [isCarouselHovered]);

  const scrollCarousel = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -380 : 380;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Load rooms from backend
  const loadRooms = async () => {
    try {
      setLoadingRooms(true);
      const res = await roomAPI.getAll();
      const serverRooms = res.data && Array.isArray(res.data) ? res.data : [];
      const serverRoomNumbers = new Set(serverRooms.map((r) => r.roomNumber));
      const missingSeeds = SEED_ROOMS.filter((s) => !serverRoomNumbers.has(s.roomNumber));
      const combined = [...serverRooms, ...missingSeeds].map((r) => ({
        ...r,
        image: ROOM_IMAGES[r.roomType] || ROOM_IMAGES.SINGLE,
      }));
      setRooms(combined);
    } catch (err) {
      console.warn('Backend rooms fetch failed, utilizing guest seed catalog:', err);
      setRooms(
        SEED_ROOMS.map((r) => ({
          ...r,
          image: ROOM_IMAGES[r.roomType] || ROOM_IMAGES.SINGLE,
        }))
      );
    } finally {
      setLoadingRooms(false);
    }
  };

  // Load client reservations
  const loadReservations = async () => {
    setLoadingReservations(true);
    try {
      let clientBookings = [];
      if (currentUser?.id) {
        try {
          const res = await reservationAPI.getByGuestId(currentUser.id);
          if (res.data && Array.isArray(res.data)) {
            clientBookings = res.data;
          }
        } catch {
          // Fallback: filter all reservations by guest id/email
          try {
            const allRes = await reservationAPI.getAll();
            if (allRes.data) {
              clientBookings = allRes.data.filter(
                (r) =>
                  r.guest?.id === currentUser.id ||
                  r.guest?.email === currentUser?.email
              );
            }
          } catch (innerErr) {
            console.warn('Could not load reservations from backend:', innerErr);
          }
        }
      }

      // Merge in any locally created reservations (created while backend was offline)
      const storedLocal = localStorage.getItem(`client_res_${currentUser?.email}`);
      if (storedLocal) {
        const local = JSON.parse(storedLocal);
        // Only keep local entries that aren't already from the backend
        const backendIds = new Set(clientBookings.map((r) => r.id));
        const localOnly = local.filter((r) => !backendIds.has(r.id));
        clientBookings = [...clientBookings, ...localOnly];
      }

      setReservations(clientBookings);
    } catch (err) {
      console.warn('Reservation load error:', err);
    } finally {
      setLoadingReservations(false);
    }
  };


  // Load client table reservations
  const loadTableReservations = async () => {
    setLoadingTableRes(true);
    try {
      let clientTableBookings = [];
      if (currentUser?.id) {
        try {
          const res = await tableReservationAPI.getByGuestId(currentUser.id);
          if (res.data && Array.isArray(res.data)) {
            clientTableBookings = res.data;
          }
        } catch (e) {
          console.warn('Could not load by guest id, fallback to all:', e);
        }
      }

      if (clientTableBookings.length === 0) {
        try {
          const all = await tableReservationAPI.getAll();
          if (all.data && Array.isArray(all.data)) {
            clientTableBookings = all.data.filter(
              (r) =>
                (currentUser?.id && r.guest?.id === currentUser.id) ||
                (currentUser?.email && r.guest?.email?.toLowerCase() === currentUser.email.toLowerCase())
            );
          }
        } catch (err) {
          console.warn('Table reservation fetch all error:', err);
        }
      }

      const storageKey = `client_table_res_${currentUser?.email || 'guest'}`;
      let local = [];
      try {
        local = JSON.parse(localStorage.getItem(storageKey) || '[]');
      } catch {}
      const backendIds = new Set(clientTableBookings.map((r) => r.id));
      const localOnly = local.filter((r) => !backendIds.has(r.id));
      const merged = [...clientTableBookings, ...localOnly];

      setTableReservations(merged);
    } catch (err) {
      console.warn('Could not load table reservations:', err);
    } finally {
      setLoadingTableRes(false);
    }
  };

  useEffect(() => {
    loadRooms();
    loadReservations();
    loadTableReservations();
  }, [currentUser]);

  // Handle Search Availability button
  const handleSearchAvailability = async (e) => {
    e?.preventDefault();
    setLoadingRooms(true);
    try {
      const res = await roomAPI.getAvailable(
        searchDates.checkIn,
        searchDates.checkOut,
        searchDates.guests
      );
      let matched = res.data && Array.isArray(res.data) ? res.data : [];
      const matchedNumbers = new Set(matched.map((r) => r.roomNumber));
      const additional = SEED_ROOMS.filter(
        (r) =>
          Number(r.capacity) >= Number(searchDates.guests) &&
          !matchedNumbers.has(r.roomNumber)
      );
      const fullList = [...matched, ...additional].map((r) => ({
        ...r,
        image: ROOM_IMAGES[r.roomType] || ROOM_IMAGES.SINGLE,
      }));
      setRooms(fullList);
    } catch {
      loadRooms();
    } finally {
      setLoadingRooms(false);
    }
  };

  // Filter rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const matchesType =
        selectedType === 'ALL' || room.roomType === selectedType;
      const matchesPrice = Number(room.basePrice || 0) <= maxPrice;
      const matchesCapacity =
        !searchDates.guests ||
        Number(room.capacity || 1) >= Number(searchDates.guests);
      return matchesType && matchesPrice && matchesCapacity;
    });
  }, [rooms, selectedType, maxPrice, searchDates.guests]);

  // Handle Confirm Booking
  const handleConfirmBooking = async (bookingData) => {
    try {
      let createdRes = null;
      try {
        const res = await reservationAPI.create({
          guestId: currentUser?.id || 1,
          roomId: bookingData.roomId,
          checkInDate: bookingData.checkInDate,
          checkOutDate: bookingData.checkOutDate,
          numberOfGuests: Number(bookingData.numberOfGuests || 1),
          specialRequests: bookingData.specialRequests || '',
        });
        if (res && res.data) {
          createdRes = {
            ...res.data,
            room: res.data.room || selectedRoomForBooking,
            guest: res.data.guest || currentUser,
            status: res.data.status || 'CONFIRMED',
            totalPrice: res.data.totalPrice || bookingData.totalPrice,
          };
        }
      } catch (err) {
        console.warn('Backend reservation create skipped or offline, storing record locally:', err);
      }

      if (!createdRes) {
        createdRes = {
          id: Date.now(),
          room: selectedRoomForBooking,
          guest: currentUser,
          checkInDate: bookingData.checkInDate,
          checkOutDate: bookingData.checkOutDate,
          numberOfGuests: Number(bookingData.numberOfGuests || 1),
          status: 'CONFIRMED',
          totalPrice: bookingData.totalPrice,
          specialRequests: bookingData.specialRequests || '',
        };
      }

      // Add to client state and client local storage
      const nextList = [createdRes, ...reservations];
      setReservations(nextList);
      localStorage.setItem(`client_res_${currentUser?.email}`, JSON.stringify(nextList));

      // Add to global room reservations store for staff dashboard live fetching
      try {
        const existingGlobalData = localStorage.getItem('hotel_global_room_reservations');
        const existingGlobal = existingGlobalData ? JSON.parse(existingGlobalData) : [];
        const updatedGlobal = [createdRes, ...existingGlobal.filter((r) => String(r.id) !== String(createdRes.id))];
        localStorage.setItem('hotel_global_room_reservations', JSON.stringify(updatedGlobal));
      } catch (_) {}

      // Close modal, show toast, and switch tab
      setSelectedRoomForBooking(null);
      setAlertNotice({
        type: 'success',
        message: `Reservation confirmed for Room ${selectedRoomForBooking.roomNumber}! Welcome to የ-mom Hotel.`,
      });
      setActiveTab('reservations');
      setTimeout(() => setAlertNotice(null), 5000);
    } catch (err) {
      throw new Error(err.message || 'Unable to confirm reservation.');
    }
  };

  // Smart Cancellation rule
  // A "Cancel Reservation" button appears on any reservation whose check-in date is still in the future,
  // regardless of Pending/Confirmed status — it disappears once the check-in date has passed or the guest has checked in.
  const isFutureDate = (dateStr) => {
    if (!dateStr) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    return target >= today;
  };

  const canCancelReservation = (res) => {
    return ['PENDING', 'CONFIRMED'].includes(res?.status);
  };

  const handleCancelReservation = async (reservationId) => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) {
      return;
    }

    try {
      try {
        await reservationAPI.cancel(reservationId);
      } catch (e) {
        console.warn('Backend cancel call skipped or offline:', e);
      }

      const updated = reservations.map((r) =>
        String(r.id) === String(reservationId) ? { ...r, status: 'CANCELLED' } : r
      );
      setReservations(updated);
      localStorage.setItem(
        `client_res_${currentUser?.email}`,
        JSON.stringify(updated)
      );

      setAlertNotice({
        type: 'info',
        message: 'Reservation cancelled. We hope to welcome you again soon.',
      });
      setTimeout(() => setAlertNotice(null), 4000);
    } catch (err) {
      console.error('Failed to cancel reservation:', err);
    }
  };

  const handleCancelTableReservation = async (reservationId) => {
    if (!window.confirm('Are you sure you want to cancel this table reservation?')) {
      return;
    }
    try {
      try {
        await tableReservationAPI.cancel(reservationId);
      } catch (e) {
        console.warn('Backend cancel table call skipped or offline:', e);
      }

      const updated = tableReservations.map((r) =>
        String(r.id) === String(reservationId) ? { ...r, status: 'CANCELLED' } : r
      );
      setTableReservations(updated);
      const storageKey = `client_table_res_${currentUser?.email || 'guest'}`;
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (_) {}

      setAlertNotice({
        type: 'info',
        message: 'Table reservation cancelled.',
      });
      setTimeout(() => setAlertNotice(null), 4000);
    } catch (err) {
      console.error('Failed to cancel table reservation:', err);
    }
  };

  const activeReservationsCount =
    reservations.filter((r) => r.status !== 'CANCELLED').length +
    tableReservations.filter((r) => !['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(r.status)).length;

  return (
    <div className="client-portal-shell">
      {/* Top Navbar */}
      <ClientNavbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        reservationCount={activeReservationsCount}
      />

      {/* Toast Notice */}
      {alertNotice && (
        <div className="client-toast-container">
          <div className={`client-toast client-toast-${alertNotice.type}`}>
            <span className="material-symbols-outlined">
              {alertNotice.type === 'success' ? 'check_circle' : 'info'}
            </span>
            <span>{alertNotice.message}</span>
            <button
              type="button"
              className="toast-close-btn"
              onClick={() => setAlertNotice(null)}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 1: Book a Room (Consumer Booking Flow with Luxury Sanctuary & Slidable Carousel) */}
      {activeTab === 'book' && (
        <main className="client-main-content" style={{ padding: '0 0 40px' }}>
          {/* Luxury Hero Banner matching Image 5 */}
          <section
            style={{
              background: 'linear-gradient(rgba(15, 23, 42, 0.72), rgba(15, 23, 42, 0.85)), url("https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1600&q=80") center/cover no-repeat',
              color: '#ffffff',
              padding: '64px 24px 50px',
              textAlign: 'center',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <div style={{ maxWidth: '960px', margin: '0 auto' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', padding: '5px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '16px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                THE SANCTUARY COLLECTION &bull; PARIS &bull; 874 BOULEVARD MONTAIGNE
              </div>
              <h1 style={{ fontSize: '38px', fontWeight: 800, margin: '0 0 12px', letterSpacing: '-0.02em', lineHeight: 1.2, color: '#ffffff' }}>
                A Sanctuary of Timeless Luxury &amp; Bespoke Hospitality
              </h1>
              <p style={{ fontSize: '15px', color: '#cbd5e1', maxWidth: '720px', margin: '0 auto 28px', lineHeight: 1.6 }}>
                Experience quintessential European grace where quiet architecture meets intuitive white-glove service. Welcome to our private hotel, grand residences, and Michelin-accorded culinary salon.
              </p>

              {/* Booking Search Bar Card with Promo Code Verification */}
              <form
                onSubmit={handleSearchAvailability}
                style={{
                  background: 'rgba(255, 255, 255, 0.98)',
                  backdropFilter: 'blur(16px)',
                  borderRadius: '16px',
                  padding: '18px 22px',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr 1.1fr 1.2fr auto',
                  gap: '12px',
                  alignItems: 'center',
                  textAlign: 'left',
                  maxWidth: '1080px',
                  margin: '0 auto',
                }}
              >
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                    CHECK-IN
                  </label>
                  <input
                    type="date"
                    required
                    value={searchDates.checkIn}
                    onChange={(e) => setSearchDates({ ...searchDates, checkIn: e.target.value })}
                    style={{ width: '100%', border: 'none', fontSize: '13px', fontWeight: 700, color: '#0f172a', background: 'transparent', outline: 'none' }}
                  />
                </div>

                <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '12px' }}>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                    CHECK-OUT
                  </label>
                  <input
                    type="date"
                    required
                    value={searchDates.checkOut}
                    onChange={(e) => setSearchDates({ ...searchDates, checkOut: e.target.value })}
                    style={{ width: '100%', border: 'none', fontSize: '13px', fontWeight: 700, color: '#0f172a', background: 'transparent', outline: 'none' }}
                  />
                </div>

                <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '12px' }}>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                    GUESTS &amp; ROOM
                  </label>
                  <select
                    value={searchDates.guests}
                    onChange={(e) => setSearchDates({ ...searchDates, guests: e.target.value })}
                    style={{ width: '100%', border: 'none', fontSize: '13px', fontWeight: 700, color: '#0f172a', background: 'transparent', outline: 'none' }}
                  >
                    <option value="1">1 Adult, 1 Room</option>
                    <option value="2">2 Adults, 1 Room</option>
                    <option value="3">3 Adults, Suite</option>
                    <option value="4">4+ Adults, Penthouse</option>
                  </select>
                </div>

                <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '12px' }}>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                    SUITE TIER
                  </label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    style={{ width: '100%', border: 'none', fontSize: '13px', fontWeight: 700, color: '#0f172a', background: 'transparent', outline: 'none' }}
                  >
                    <option value="ALL">All Signature Suites</option>
                    <option value="SINGLE">Classic Single</option>
                    <option value="DOUBLE">Superior Double</option>
                    <option value="SUITE">Executive Suite</option>
                    <option value="DELUXE">Deluxe Ocean King</option>
                    <option value="PENTHOUSE">Presidential Penthouse</option>
                  </select>
                </div>

                <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                      PROMO CODE
                    </label>
                    {promoApplied && (
                      <span style={{ fontSize: '9px', fontWeight: 800, color: '#059669', background: '#d1fae5', padding: '1px 5px', borderRadius: '4px' }}>
                        ✓ 15% APPLIED
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => {
                      setPromoCode(e.target.value);
                      setPromoApplied(e.target.value.trim().toUpperCase() === 'AMBASSADOR-CLUB');
                    }}
                    placeholder="AMBASSADOR-CLUB"
                    style={{ width: '100%', border: 'none', fontSize: '12px', fontWeight: 700, color: '#047857', background: 'transparent', outline: 'none', letterSpacing: '0.04em' }}
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    background: '#065f46',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '12px 22px',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 10px rgba(6, 95, 70, 0.3)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>search</span>
                  <span>Check Availability</span>
                </button>
              </form>

              {/* Guarantees Bar */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap', marginTop: '18px', fontSize: '12px', color: '#94a3b8' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#10b981' }}>verified</span>
                  Direct Reservation Privileges (AMBASSADOR-CLUB)
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#10b981' }}>spa</span>
                  Complimentary Thermal Spa Access
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#10b981' }}>room_service</span>
                  24/7 Dedicated Floor Butler
                </span>
              </div>
            </div>
          </section>

          {/* ─── Seamless Auto-Scrolling Showcase Reel (Image 5 & Stitch Specs) ─── */}
          <section style={{ maxWidth: '1240px', margin: '40px auto 20px', padding: '0 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '18px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#065f46', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  EXCLUSIVE RESIDENTIAL WINGS &bull; ACCLAIMED DINING
                </span>
                <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '2px 0 0', color: '#0f172a' }}>
                  Signature Living &amp; Culinary Tables
                </h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#10b981' }}>auto_awesome</span>
                  Auto-scrolling &bull; Hover to pause
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => scrollCarousel('left')}
                    style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_left</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollCarousel('right')}
                    style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_right</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Auto-scrolling Track with Hover Pause */}
            <div
              ref={carouselRef}
              onMouseEnter={() => setIsCarouselHovered(true)}
              onMouseLeave={() => setIsCarouselHovered(false)}
              style={{
                display: 'flex',
                gap: '20px',
                overflowX: 'auto',
                paddingBottom: '14px',
                scrollSnapType: 'x mandatory',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'thin',
              }}
            >
              {/* Slidable Card 1: Grand Horizon Bedroom Suite */}
              <div
                style={{
                  minWidth: '380px',
                  flex: '0 0 auto',
                  scrollSnapAlign: 'start',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  background: '#0f172a',
                  color: '#ffffff',
                  position: 'relative',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
                  height: '360px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '24px',
                  backgroundImage: 'linear-gradient(180deg, rgba(15,23,42,0.3) 0%, rgba(15,23,42,0.85) 100%), url("https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1000&q=80")',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ background: '#065f46', color: '#ffffff', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
                    Featured Bedroom
                  </span>
                  <span style={{ background: 'rgba(0,0,0,0.5)', color: '#34d399', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, border: '1px solid rgba(52, 211, 153, 0.4)' }}>
                    AVAILABLE &bull; OCEAN PANORAMA
                  </span>
                </div>

                <div>
                  <h3 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 6px', color: '#ffffff' }}>
                    Grand Horizon Suite
                  </h3>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#cbd5e1', marginBottom: '14px' }}>
                    <span>88 m²</span>
                    <span>&bull;</span>
                    <span>King Bed</span>
                    <span>&bull;</span>
                    <span>Soaking Tub</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>FROM</span>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff' }}>€780 <span style={{ fontSize: '12px', color: '#cbd5e1' }}>/ Night</span></div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const suiteRoom = rooms.find((r) => r.roomType === 'SUITE' || r.roomType === 'DELUXE') || rooms[0];
                        setSelectedRoomForBooking(suiteRoom);
                      }}
                      style={{ background: '#ffffff', color: '#0f172a', border: 'none', borderRadius: '8px', padding: '8px 16px', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}
                    >
                      Explore Quarters
                    </button>
                  </div>
                </div>
              </div>

              {/* Slidable Card 2: Chef Jean-Luc Fine Dining Table */}
              <div
                style={{
                  minWidth: '380px',
                  flex: '0 0 auto',
                  scrollSnapAlign: 'start',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  background: '#0f172a',
                  color: '#ffffff',
                  position: 'relative',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
                  height: '360px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '24px',
                  backgroundImage: 'linear-gradient(180deg, rgba(15,23,42,0.3) 0%, rgba(15,23,42,0.85) 100%), url("https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=1000&q=80")',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ background: '#b45309', color: '#ffffff', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
                    Culinary &amp; Tables
                  </span>
                  <span style={{ background: 'rgba(0,0,0,0.5)', color: '#fbbf24', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, border: '1px solid rgba(251, 191, 36, 0.4)' }}>
                    8 MICHELIN STARS &bull; 2024
                  </span>
                </div>

                <div>
                  <h3 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 6px', color: '#ffffff' }}>
                    Chef Jean-Luc's Table
                  </h3>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#cbd5e1', marginBottom: '14px' }}>
                    <span>1,200 Cellar Labels</span>
                    <span>&bull;</span>
                    <span>7-Course Degustation</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>SEATING</span>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff' }}>Main Salon &amp; Terrace</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('restaurant')}
                      style={{ background: '#b45309', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '8px 16px', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}
                    >
                      Reserve Dining Table
                    </button>
                  </div>
                </div>
              </div>

              {/* Slidable Card 3: Presidential Salon & Library */}
              <div
                style={{
                  minWidth: '380px',
                  flex: '0 0 auto',
                  scrollSnapAlign: 'start',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  background: '#0f172a',
                  color: '#ffffff',
                  position: 'relative',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
                  height: '360px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '24px',
                  backgroundImage: 'linear-gradient(180deg, rgba(15,23,42,0.3) 0%, rgba(15,23,42,0.85) 100%), url("https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1000&q=80")',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ background: '#6b21a8', color: '#ffffff', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
                    Penthouse Wing
                  </span>
                  <span style={{ background: 'rgba(0,0,0,0.5)', color: '#c084fc', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, border: '1px solid rgba(192, 132, 252, 0.4)' }}>
                    TOP FLOOR SUITE
                  </span>
                </div>

                <div>
                  <h3 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 6px', color: '#ffffff' }}>
                    Presidential Salon &amp; Library
                  </h3>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#cbd5e1', marginBottom: '14px' }}>
                    <span>145 m²</span>
                    <span>&bull;</span>
                    <span>Duo-Pillow King</span>
                    <span>&bull;</span>
                    <span>Salon 32m²</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>FROM</span>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff' }}>€1,450 <span style={{ fontSize: '12px', color: '#cbd5e1' }}>/ Night</span></div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const pent = rooms.find((r) => r.roomType === 'PENTHOUSE') || rooms[0];
                        setSelectedRoomForBooking(pent);
                      }}
                      style={{ background: '#ffffff', color: '#0f172a', border: 'none', borderRadius: '8px', padding: '8px 16px', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}
                    >
                      Explore Quarters
                    </button>
                  </div>
                </div>
              </div>

              {/* Slidable Card 4: L’Orangerie Garden Quarters */}
              <div
                style={{
                  minWidth: '380px',
                  flex: '0 0 auto',
                  scrollSnapAlign: 'start',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  background: '#0f172a',
                  color: '#ffffff',
                  position: 'relative',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
                  height: '360px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '24px',
                  backgroundImage: 'linear-gradient(180deg, rgba(15,23,42,0.3) 0%, rgba(15,23,42,0.85) 100%), url("https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80")',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ background: '#047857', color: '#ffffff', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
                    Garden Wing
                  </span>
                  <span style={{ background: 'rgba(0,0,0,0.5)', color: '#6ee7b7', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, border: '1px solid rgba(110, 231, 183, 0.4)' }}>
                    BOTANICAL SUITE
                  </span>
                </div>

                <div>
                  <h3 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 6px', color: '#ffffff' }}>
                    L’Orangerie Garden Quarters
                  </h3>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#cbd5e1', marginBottom: '14px' }}>
                    <span>96 m²</span>
                    <span>&bull;</span>
                    <span>King Canopy</span>
                    <span>&bull;</span>
                    <span>Private Courtyard</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>FROM</span>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff' }}>€920 <span style={{ fontSize: '12px', color: '#cbd5e1' }}>/ Night</span></div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const gardenRoom = rooms.find((r) => r.roomType === 'SUITE' || r.roomType === 'DELUXE') || rooms[0];
                        setSelectedRoomForBooking(gardenRoom);
                      }}
                      style={{ background: '#ffffff', color: '#0f172a', border: 'none', borderRadius: '8px', padding: '8px 16px', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}
                    >
                      Explore Quarters
                    </button>
                  </div>
                </div>
              </div>

              {/* Slidable Card 5: Alabaster Thermal Spa & Sommelier Salon */}
              <div
                style={{
                  minWidth: '380px',
                  flex: '0 0 auto',
                  scrollSnapAlign: 'start',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  background: '#0f172a',
                  color: '#ffffff',
                  position: 'relative',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
                  height: '360px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '24px',
                  backgroundImage: 'linear-gradient(180deg, rgba(15,23,42,0.3) 0%, rgba(15,23,42,0.85) 100%), url("https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1000&q=80")',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ background: '#0f766e', color: '#ffffff', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
                    Wellness &amp; Dining
                  </span>
                  <span style={{ background: 'rgba(0,0,0,0.5)', color: '#5eead4', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, border: '1px solid rgba(94, 234, 212, 0.4)' }}>
                    EXCLUSIVE PRIVILEGE
                  </span>
                </div>

                <div>
                  <h3 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 6px', color: '#ffffff' }}>
                    Alabaster Thermal Spa &amp; Salon
                  </h3>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#cbd5e1', marginBottom: '14px' }}>
                    <span>Private Mineral Pools</span>
                    <span>&bull;</span>
                    <span>Rare Vintage Cellar</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>PRIVILEGE</span>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff' }}>Complimentary with Suite</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('restaurant')}
                      style={{ background: '#0f766e', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '8px 16px', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}
                    >
                      Reserve Experience
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ─── Curated Residences & Quarters Section ─── */}
          <section style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#065f46', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  TAILORED ACCOMMODATIONS
                </span>
                <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '2px 0 0', color: '#0f172a' }}>
                  Curated Residences &amp; Quarters
                </h2>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['ALL', 'SUITE', 'PENTHOUSE'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedType(t)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 700,
                      border: selectedType === t ? 'none' : '1px solid #cbd5e1',
                      background: selectedType === t ? '#065f46' : '#ffffff',
                      color: selectedType === t ? '#ffffff' : '#475569',
                      cursor: 'pointer',
                    }}
                  >
                    {t === 'ALL' ? 'All Keys (12)' : t === 'SUITE' ? 'King Suites (4)' : 'Penthouse (2)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Room Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
              {filteredRooms.map((room) => (
                <article
                  key={room.id || room.roomNumber}
                  style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    overflow: 'hidden',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ position: 'relative', height: '220px', overflow: 'hidden' }}>
                    <img
                      src={room.image || ROOM_IMAGES[room.roomType] || ROOM_IMAGES.SINGLE}
                      alt={room.roomType}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{ position: 'absolute', top: '12px', left: '12px', background: '#0f172a', color: '#ffffff', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 800 }}>
                      Room {room.roomNumber} &bull; {room.roomType}
                    </div>
                    <div style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'rgba(15,23,42,0.85)', color: '#ffffff', padding: '4px 10px', borderRadius: '6px', fontSize: '13px', fontWeight: 800, backdropFilter: 'blur(4px)' }}>
                      ${Number(room.basePrice || 0).toFixed(0)} <span style={{ fontSize: '10px', color: '#cbd5e1' }}>/ night</span>
                    </div>
                  </div>

                  <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px', color: '#0f172a' }}>
                        {room.roomType === 'PENTHOUSE' ? 'Atelier Presidential Penthouse' : room.roomType === 'DELUXE' ? 'Deluxe Ocean King' : room.roomType === 'SUITE' ? 'Executive Boutique Suite' : `${room.roomType} Comfort Quarter`}
                      </h3>
                      <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 14px', lineHeight: 1.5 }}>
                        {room.description}
                      </p>
                    </div>

                    <div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                        <span style={{ fontSize: '11px', background: '#f1f5f9', color: '#475569', padding: '3px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>group</span>
                          Sleeps {room.capacity}
                        </span>
                        {room.hasBathtub && (
                          <span style={{ fontSize: '11px', background: '#f1f5f9', color: '#475569', padding: '3px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>bathtub</span>
                            Soaking Tub
                          </span>
                        )}
                        {room.hasBalcony && (
                          <span style={{ fontSize: '11px', background: '#f1f5f9', color: '#475569', padding: '3px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>balcony</span>
                            Balcony
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedRoomForBooking(room)}
                        style={{
                          width: '100%',
                          background: '#065f46',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '10px',
                          fontWeight: 700,
                          fontSize: '13px',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <span>Reserve Suite</span>
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* ─── Sensory Indulgence Section matching Image 5 ─── */}
          <section style={{ maxWidth: '1200px', margin: '60px auto', padding: '0 20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'center' }}>
              <div style={{ position: 'relative', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.15)', height: '420px' }}>
                <img
                  src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80"
                  alt="Fine Dining"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', borderRadius: '12px', padding: '16px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: '#b45309', textTransform: 'uppercase' }}>★ SOMMELIER CELLAR</span>
                  <h4 style={{ margin: '2px 0 4px', fontSize: '14px', color: '#0f172a' }}>Chef de Cave Wine Cellar</h4>
                  <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>
                    Cellar-poured bottle tastings at 19:30 with Grand Cru pairings.
                  </p>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#065f46', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  GASTRONOMY &bull; THERMAL WELL-BEING
                </span>
                <h2 style={{ fontSize: '32px', fontWeight: 800, margin: '6px 0 16px', color: '#0f172a', lineHeight: 1.2 }}>
                  Sensory Indulgence, Refined Down to the Candle Flame
                </h2>
                <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, margin: '0 0 24px' }}>
                  Atelier's Michelin-starred restaurant champions heritage French techniques infused with modern biodynamic ingredients. Each table is choreographed as an intimate theatrical setting.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <span className="material-symbols-outlined" style={{ color: '#b45309', fontSize: '20px' }}>wine_bar</span>
                    <strong style={{ display: 'block', fontSize: '13px', color: '#0f172a', margin: '4px 0 2px' }}>Private Sommelier Salon</strong>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Daily cellar reserve tastings paired with raw French artisan cheeses.</span>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <span className="material-symbols-outlined" style={{ color: '#065f46', fontSize: '20px' }}>spa</span>
                    <strong style={{ display: 'block', fontSize: '13px', color: '#0f172a', margin: '4px 0 2px' }}>Alabaster Thermal Spa</strong>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Hammam, magnesium immersion baths, and personalized herbal care.</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setActiveTab('restaurant')}
                    style={{ background: '#065f46', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
                  >
                    Reserve a Table
                  </button>
                  <button
                    type="button"
                    onClick={() => setAlertNotice({ type: 'info', message: 'Spa concierge catalog sent to your folio inbox.' })}
                    style={{ background: '#ffffff', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '10px 18px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
                  >
                    Explore Spa Menu
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* ─── Distinguished Praise (Testimonials) matching Image 5 ─── */}
          <section style={{ maxWidth: '1200px', margin: '60px auto', padding: '0 20px', textAlign: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#065f46', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              PATRON ENDORSEMENTS
            </span>
            <h2 style={{ fontSize: '26px', fontWeight: 800, margin: '4px 0 32px', color: '#0f172a' }}>
              Distinguished Praise
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', textAlign: 'left' }}>
              {[
                {
                  stars: '★★★★★',
                  quote: 'Waking up in the Grand Horizon Suite with the sun glowing over our balcony unforgettable. The piano salon concert at 10pm is deep thinking.',
                  author: 'Lady Constance Sterling',
                  location: 'London • Member since 2017',
                },
                {
                  stars: '★★★★★',
                  quote: 'Chef Jean-Luc\'s sommelier table exceeded our highest expectations. Universal hospitality and absolute discretion for our board dinner.',
                  author: 'Henrik Lindqvist',
                  location: 'Stockholm • Private Residence Guest',
                },
                {
                  stars: '★★★★★',
                  quote: 'Truly an oasis in Paris. Heated courtyard pool, museum access tickets in minutes, and a flawless concierge team. Truly world-class.',
                  author: 'Camilla D\'Albis',
                  location: 'Milan • Ambassador Guild Patron',
                },
              ].map((t, idx) => (
                <div key={idx} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.04)' }}>
                  <div style={{ color: '#f59e0b', fontSize: '16px', marginBottom: '12px' }}>{t.stars}</div>
                  <p style={{ fontSize: '13px', color: '#334155', lineHeight: 1.6, margin: '0 0 16px', fontStyle: 'italic' }}>
                    "{t.quote}"
                  </p>
                  <div>
                    <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block' }}>{t.author}</strong>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>{t.location}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ─── Accreditations Banner matching Image 5 ─── */}
          <section style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px' }}>
            <div style={{ background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px 24px', display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: '16px', fontSize: '12px', fontWeight: 700, color: '#475569' }}>
              <span>&bull; Michelin Guide 3 Keys 2024</span>
              <span>&bull; Forbes Travel Guide &bull; 5-Star Hotel</span>
              <span>&bull; Wine Spectator &bull; Grand Award</span>
              <span>&bull; Green Globe Platinum Certified</span>
            </div>
          </section>

          {/* ─── Private Member Newsletter Banner matching Image 5 ─── */}
          <section style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px' }}>
            <div style={{ background: 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)', borderRadius: '16px', padding: '40px', color: '#ffffff', textAlign: 'center' }}>
              <span style={{ fontSize: '10px', fontWeight: 800, color: '#a7f3d0', letterSpacing: '0.08em', textTransform: 'uppercase' }}>PRIVATE MEMBERSHIP</span>
              <h2 style={{ fontSize: '26px', fontWeight: 800, margin: '6px 0 8px', color: '#ffffff' }}>
                Gain Access to Private Member Allocations &amp; Seasonal Tastings
              </h2>
              <p style={{ fontSize: '13px', color: '#cbd5e1', maxWidth: '600px', margin: '0 auto 20px' }}>
                Patrons receive invitation-only salon events, guaranteed suite upgrades, and bespoke airport transfers.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', maxWidth: '480px', margin: '0 auto' }}>
                <input
                  type="email"
                  placeholder="Enter your official or private email"
                  style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: 'none', fontSize: '13px' }}
                />
                <button
                  type="button"
                  onClick={() => setAlertNotice({ type: 'success', message: 'Invitation requested. Our membership team will contact you shortly.' })}
                  style={{ background: '#34d399', color: '#064e3b', border: 'none', borderRadius: '8px', padding: '10px 18px', fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}
                >
                  Request Invitation
                </button>
              </div>
            </div>
          </section>

          {/* ─── Luxury Dark Footer matching Image 5 ─── */}
          <footer style={{ background: '#0f172a', color: '#ffffff', padding: '48px 20px 24px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '32px', marginBottom: '36px' }}>
              <div>
                <strong style={{ fontSize: '16px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="material-symbols-outlined" style={{ color: '#10b981' }}>apartment</span>
                  Atelier Grand Hotel
                </strong>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: '8px 0', lineHeight: 1.5 }}>
                  874 Avenue Montaigne, 75008 Paris, France.<br />
                  Direct Concierge: +33 (0)1 45 62 40 00<br />
                  reservations@ateliergrand.com
                </p>
              </div>

              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>SANCTUARY SUITES</span>
                <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0', fontSize: '12px', color: '#cbd5e1', lineHeight: 2 }}>
                  <li>Grand Horizon Chambers</li>
                  <li>Presidential Study &amp; Salon</li>
                  <li>L'Orangerie Garden Quarters</li>
                  <li>Private Penthouse Residences</li>
                </ul>
              </div>

              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>DINING &amp; LEISURE</span>
                <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0', fontSize: '12px', color: '#cbd5e1', lineHeight: 2 }}>
                  <li>Chef Jean-Luc's Table (3 Star)</li>
                  <li>The Alabaster Thermal Baths</li>
                  <li>Courtyard Sommelier Tastings</li>
                  <li>Private Yacht Launches</li>
                </ul>
              </div>

              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>GUEST LEDGER &amp; PMS</span>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: '8px 0 14px' }}>
                  Already registered as Access Keycard holder or corporate entity? Switch to Staff Operations.
                </p>
                <button
                  type="button"
                  onClick={() => window.location.href = '/staff'}
                  style={{ background: 'rgba(255,255,255,0.1)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>lock</span>
                  Access Operator Portal
                </button>
              </div>
            </div>

            <div style={{ maxWidth: '1200px', margin: '0 auto', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b' }}>
              <span>&copy; 2026 ATELIER GRAND HOTEL &amp; RESIDENCES SAS. ALL RIGHTS RESERVED.</span>
              <div style={{ display: 'flex', gap: '16px' }}>
                <span>PRIVACY POLICY</span>
                <span>TERMS &amp; SERVICE</span>
                <span>PMS CONNECTIVITY</span>
              </div>
            </div>
          </footer>
        </main>
      )}

      {/* Tab 2: My Reservations Tab (with Sub-tabs for Rooms vs Tables) */}
      {activeTab === 'reservations' && (
        <main className="client-main-content">
          <div className="reservations-page-header">
            <div>
              <span className="eyebrow" style={{ color: '#064e3b' }}>Guest Itinerary</span>
              <h1>My Reservations</h1>
              <p>Review your upcoming retreats, confirmed stays, and restaurant reservations.</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="outline-button"
                onClick={() => setActiveTab('restaurant')}
              >
                <span className="material-symbols-outlined">restaurant</span>
                <span>Reserve a Table</span>
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() => setActiveTab('book')}
              >
                <span className="material-symbols-outlined">add</span>
                <span>Book a Room</span>
              </button>
            </div>
          </div>

          {/* Sub-tabs header */}
          <div className="reservation-subtabs">
            <button
              type="button"
              className={`subtab-btn ${resSubTab === 'all' ? 'active' : ''}`}
              onClick={() => setResSubTab('all')}
            >
              <span className="material-symbols-outlined">dashboard</span>
              <span>All Reservations</span>
              <span className="subtab-count">{reservations.length + tableReservations.length}</span>
            </button>
            <button
              type="button"
              className={`subtab-btn ${resSubTab === 'rooms' ? 'active' : ''}`}
              onClick={() => setResSubTab('rooms')}
            >
              <span className="material-symbols-outlined">hotel</span>
              <span>Room Bookings</span>
              <span className="subtab-count">{reservations.length}</span>
            </button>
            <button
              type="button"
              className={`subtab-btn ${resSubTab === 'tables' ? 'active' : ''}`}
              onClick={() => setResSubTab('tables')}
            >
              <span className="material-symbols-outlined">restaurant</span>
              <span>Dining Reservations</span>
              <span className="subtab-count">{tableReservations.length}</span>
            </button>
          </div>

          {(loadingReservations || loadingTableRes) && (
            <div className="catalog-loading-state" style={{ margin: '20px 0' }}>
              <span className="spinner-large" />
              <p>Fetching your reservations...</p>
            </div>
          )}

          {/* Combined Empty State when viewing All and nothing booked */}
          {resSubTab === 'all' && !loadingReservations && !loadingTableRes && reservations.length === 0 && tableReservations.length === 0 && (
            <div className="empty-card" style={{ padding: '60px 20px', textAlign: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#94a3b8' }}>
                event_busy
              </span>
              <h2 style={{ marginTop: '16px' }}>No reservations found</h2>
              <p style={{ color: '#64748b', maxWidth: '440px', margin: '8px auto 24px' }}>
                You have no active room stays or restaurant table reservations. Experience our hospitality by booking a room or reserving an artisanal table.
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => setActiveTab('book')}
                >
                  Book a Room
                </button>
                <button
                  type="button"
                  className="outline-button"
                  onClick={() => setActiveTab('restaurant')}
                >
                  Reserve a Table
                </button>
              </div>
            </div>
          )}

          {/* Room Bookings Table */}
          {(resSubTab === 'all' || resSubTab === 'rooms') && (
            <div style={{ marginBottom: resSubTab === 'all' ? '32px' : '0' }}>
              {resSubTab === 'all' && reservations.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <span className="material-symbols-outlined" style={{ color: '#064e3b' }}>hotel</span>
                  <h2 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>Hotel Room Stays ({reservations.length})</h2>
                </div>
              )}

              {resSubTab === 'rooms' && !loadingReservations && reservations.length === 0 ? (
                <div className="empty-card" style={{ padding: '60px 20px', textAlign: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#94a3b8' }}>
                    calendar_today
                  </span>
                  <h2 style={{ marginTop: '16px' }}>No room reservations yet</h2>
                  <p style={{ color: '#64748b', maxWidth: '400px', margin: '8px auto 24px' }}>
                    You have no active or historical room bookings. Search our rooms and reserve your boutique getaway.
                  </p>
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => setActiveTab('book')}
                  >
                    Browse Available Rooms
                  </button>
                </div>
              ) : (
                reservations.length > 0 && (
                  <div className="reservations-table-panel">
                    <div className="table-wrap">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Room</th>
                            <th>Dates</th>
                            <th>Guests</th>
                            <th>Total Price</th>
                            <th>Status</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reservations.map((res) => {
                            const canCancel = canCancelReservation(res);
                            const isFuture = isFutureDate(res.checkInDate);

                            return (
                              <tr key={res.id}>
                                <td>
                                  <div className="table-room-cell">
                                    <span className="room-num-badge">
                                      {res.room?.roomNumber || 'TBD'}
                                    </span>
                                    <div>
                                      <strong>{res.room?.roomType || 'Boutique'} Room</strong>
                                      <span className="text-muted-sm">
                                        #{res.id}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <div className="table-date-cell">
                                    <span>{res.checkInDate} to {res.checkOutDate}</span>
                                  </div>
                                </td>
                                <td>
                                  <span>{res.numberOfGuests} Guests</span>
                                </td>
                                <td>
                                  <strong className="table-price-text">
                                    ${res.totalPrice ? Number(res.totalPrice).toFixed(2) : '0.00'}
                                  </strong>
                                </td>
                                <td>
                                  <StatusBadge status={res.status} />
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                  {canCancel ? (
                                    <button
                                      type="button"
                                      className="table-cancel-btn"
                                      onClick={() => handleCancelReservation(res.id)}
                                    >
                                      <span className="material-symbols-outlined">cancel</span>
                                      <span>Cancel Reservation</span>
                                    </button>
                                  ) : (
                                    <span className="action-note">
                                      {res.status === 'CANCELLED'
                                        ? 'Cancelled'
                                        : res.status === 'CHECKED_IN'
                                        ? 'Active Stay'
                                        : !isFuture
                                        ? 'Past Stay'
                                        : 'No action needed'}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          {/* Dining Table Reservations Table */}
          {(resSubTab === 'all' || resSubTab === 'tables') && (
            <div>
              {resSubTab === 'all' && tableReservations.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <span className="material-symbols-outlined" style={{ color: '#1a3a5c' }}>restaurant</span>
                  <h2 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>Dining Table Reservations ({tableReservations.length})</h2>
                </div>
              )}

              {resSubTab === 'tables' && !loadingTableRes && tableReservations.length === 0 ? (
                <div className="empty-card" style={{ padding: '60px 20px', textAlign: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#94a3b8' }}>
                    restaurant
                  </span>
                  <h2 style={{ marginTop: '16px' }}>No dining reservations yet</h2>
                  <p style={{ color: '#64748b', maxWidth: '400px', margin: '8px auto 24px' }}>
                    Enjoy an unforgettable culinary journey at Atelier Restaurant. Reserve a table in the Main Hall, Terrace, or Private Room.
                  </p>
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => setActiveTab('restaurant')}
                  >
                    Reserve a Table
                  </button>
                </div>
              ) : (
                tableReservations.length > 0 && (
                  <div className="reservations-table-panel">
                    <div className="table-wrap">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Table</th>
                            <th>Area</th>
                            <th>Date & Time</th>
                            <th>Party Size</th>
                            <th>Status</th>
                            <th>Special Requests</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tableReservations.map((tr) => {
                            const canCancel = ['PENDING', 'CONFIRMED'].includes(tr?.status);
                            return (
                              <tr key={tr.id}>
                                <td>
                                  <div className="table-room-cell">
                                    <span className="room-num-badge" style={{ backgroundColor: '#1a3a5c' }}>
                                      {tr.restaurantTable?.tableNumber || 'Table'}
                                    </span>
                                    <div>
                                      <strong>Table #{tr.restaurantTable?.tableNumber || tr.id}</strong>
                                      <span className="text-muted-sm">#{tr.id}</span>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <span className="tag-badge">
                                    {tr.restaurantTable?.area?.replace('_', ' ') || 'Main Hall'}
                                  </span>
                                </td>
                                <td>
                                  <div>
                                    <strong>{tr.reservationDate}</strong>
                                    <span className="text-muted-sm" style={{ display: 'block' }}>
                                      {tr.timeSlot}
                                    </span>
                                  </div>
                                </td>
                                <td>
                                  <span>{tr.partySize} {tr.partySize === 1 ? 'Guest' : 'Guests'}</span>
                                </td>
                                <td>
                                  <StatusBadge status={tr.status} />
                                </td>
                                <td>
                                  <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                                    {tr.specialRequests || '—'}
                                  </span>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                  {canCancel ? (
                                    <button
                                      type="button"
                                      className="table-cancel-btn"
                                      onClick={() => handleCancelTableReservation(tr.id)}
                                    >
                                      <span className="material-symbols-outlined">cancel</span>
                                      <span>Cancel</span>
                                    </button>
                                  ) : (
                                    <span className="action-note">
                                      {tr.status}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </main>
      )}

      {/* Tab 2b: Restaurant — Reserve a Table */}
      {activeTab === 'restaurant' && (
        <main className="client-main-content">
          <RestaurantPage
            onReservationSuccess={(created) => {
              loadTableReservations();
              setActiveTab('reservations');
              setResSubTab('all');
              setAlertNotice({
                type: 'success',
                message: `Table reservation confirmed! You can view your dining details on your reservations page.`,
              });
              setTimeout(() => setAlertNotice(null), 5000);
            }}
          />
        </main>
      )}

      {/* Tab 3: Profile Tab */}
      {activeTab === 'profile' && (
        <main className="client-main-content">
          <div className="reservations-page-header">
            <div>
              <span className="eyebrow" style={{ color: '#064e3b' }}>Guest Account</span>
              <h1>Profile & Stay Preferences</h1>
              <p>Manage your contact information and customize your personalized hotel stay preferences.</p>
            </div>
          </div>

          <ClientProfile />
        </main>
      )}

      {/* Booking Summary Modal */}
      {selectedRoomForBooking && (
        <ClientBookingModal
          room={selectedRoomForBooking}
          searchDates={searchDates}
          currentUser={currentUser}
          onConfirm={handleConfirmBooking}
          onClose={() => setSelectedRoomForBooking(null)}
        />
      )}
    </div>
  );
};

export default ClientDashboard;
