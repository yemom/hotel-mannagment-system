import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ClientNavbar from "../components/ClientNavbar";
import ClientBookingModal from "../components/ClientBookingModal";
import ClientProfile from "../components/ClientProfile";
import ClientSpaView from "../components/ClientSpaView";
import StatusBadge from "../components/StatusBadge";
import RestaurantPage from "./RestaurantPage";
import { useAuth } from "../context/AuthContext";
import {
  reservationAPI,
  roomAPI,
  tableReservationAPI,
  spaBookingAPI,
  restaurantTableAPI,
  spaServiceAPI,
} from "../services/api";
import { withRoomImage } from "../utils/propertyImages";
import { readBookingIntent, clearBookingIntent } from "../utils/reserve";
import {
  CalendarGrid,
  AnalogClock,
} from "../components/ReservationDateTimePicker";

const ROOM_RESERVATION_IMAGE =
  "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1920&q=85";

// Spa sanctuary photography (used for the spa reservation page)
const SPA_RESERVATION_IMAGE =
  "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1920&q=85";

const ROOM_TYPES = ["ALL", "SINGLE", "DOUBLE", "SUITE", "DELUXE", "PENTHOUSE"];

// Format dates helpers
const getTodayStr = () => new Date().toISOString().slice(0, 10);
const getFutureDateStr = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const CLIENT_TABS = ["book", "restaurant", "spa", "reservations", "profile"];

const ClientDashboard = () => {
  const { currentUser } = useAuth();

  // Active navigation tab: 'book' | 'restaurant' | 'spa' | 'reservations' | 'profile'
  const [activeTab, setActiveTab] = useState("restaurant");
  // Sub-tab within 'reservations': 'all' | 'rooms' | 'tables'
  const [resSubTab, setResSubTab] = useState("all");

  // Deep-link support: /client?tab=book|restaurant|spa|reservations|profile
  const [searchParams] = useSearchParams();
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && CLIENT_TABS.includes(tab)) setActiveTab(tab);
  }, [searchParams]);
  const [resFilter, setResFilter] = useState("ALL");
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [rescheduleValues, setRescheduleValues] = useState({});
  const [rescheduleError, setRescheduleError] = useState("");
  const [rescheduleSubmitting, setRescheduleSubmitting] = useState(false);

  // Search parameters for availability
  const [searchDates, setSearchDates] = useState({
    checkIn: getTodayStr(),
    checkOut: getFutureDateStr(3),
    guests: "2",
  });

  // Filters
  const [selectedType, setSelectedType] = useState("ALL");
  const [maxPrice, setMaxPrice] = useState(550);

  // Data states
  const [rooms, setRooms] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [tableReservations, setTableReservations] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [roomsError, setRoomsError] = useState("");
  const [loadingReservations, setLoadingReservations] = useState(false);
  const [reservationsError, setReservationsError] = useState("");
  const [loadingTableRes, setLoadingTableRes] = useState(false);
  const [tableResError, setTableResError] = useState("");
  const [spaReservations, setSpaReservations] = useState([]);
  const [loadingSpaRes, setLoadingSpaRes] = useState(false);
  const [spaResError, setSpaResError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  // Calendar + analog clock panel on the room reservation page
  const [showRoomPicker, setShowRoomPicker] = useState(false);

  // Booking modal
  const [selectedRoomForBooking, setSelectedRoomForBooking] = useState(null);
  const [alertNotice, setAlertNotice] = useState(null);

  // Live dining-table and spa-ritual inventory for the booking page
  const [tableOptions, setTableOptions] = useState([]);
  const [bookableSpaServices, setBookableSpaServices] = useState([]);
  const [mixLoading, setMixLoading] = useState(true);
  const [mixError, setMixError] = useState("");

  // Promotional Code
  const [promoCode, setPromoCode] = useState("AMBASSADOR-CLUB");
  const [promoApplied, setPromoApplied] = useState(true);

  // ── Restore a reservation intent captured before login ──────────────────
  // A visitor who clicked "Reserve" on the public site arrives here after
  // authenticating; reopen exactly what they were trying to reserve.
  const [pendingSpaServiceId, setPendingSpaServiceId] = useState(null);
  const [intentRestored, setIntentRestored] = useState(false);

  useEffect(() => {
    if (intentRestored) return;
    const intent = readBookingIntent();

    if (!intent) {
      if (!loadingRooms) setIntentRestored(true);
      return;
    }

    if (intent.type === "ROOM") {
      if (loadingRooms) return;
      // Pre-fill the stay dates the guest chose on the public site.
      if (intent.checkInDate || intent.checkOutDate || intent.numberOfGuests) {
        setSearchDates((current) => ({
          checkIn: intent.checkInDate || current.checkIn,
          checkOut: intent.checkOutDate || current.checkOut,
          guests: intent.numberOfGuests
            ? String(intent.numberOfGuests)
            : current.guests,
        }));
      }
      const match = rooms.find(
        (r) =>
          (intent.roomId && String(r.id) === String(intent.roomId)) ||
          (intent.roomNumber &&
            String(r.roomNumber) === String(intent.roomNumber)),
      );
      if (match) {
        setActiveTab("book");
        setSelectedRoomForBooking(match);
        clearBookingIntent();
      } else if (rooms.length > 0) {
        setActiveTab("book");
        clearBookingIntent();
      } else {
        return; // rooms still empty — keep the intent for a later retry
      }
      setIntentRestored(true);
      return;
    }

    if (intent.type === "TABLE") {
      setActiveTab("restaurant");
      clearBookingIntent();
      setIntentRestored(true);
      return;
    }

    if (intent.type === "SPA") {
      setActiveTab("spa");
      if (intent.spaServiceId) setPendingSpaServiceId(intent.spaServiceId);
      clearBookingIntent();
      setIntentRestored(true);
    }
  }, [rooms, loadingRooms, intentRestored]);

  // Load rooms from backend (the database is the single source of truth)
  const loadRooms = async () => {
    try {
      setLoadingRooms(true);
      setRoomsError("");
      const res = await roomAPI.getAll();
      const serverRooms = res.data && Array.isArray(res.data) ? res.data : [];
      setRooms(
        serverRooms.map((r) => ({
          ...r,
          image: withRoomImage(r).image,
        })),
      );
    } catch (err) {
      setRooms([]);
      setRoomsError(
        err?.response?.data?.message ||
          "We could not load the room list. Please check your connection and retry.",
      );
    } finally {
      setLoadingRooms(false);
    }
  };

  // Load this client's room reservations from the backend.
  const loadReservations = async () => {
    setLoadingReservations(true);
    setReservationsError("");
    try {
      const userId = currentUser?.id;
      if (!userId) {
        setReservations([]);
        return;
      }
      // Scoped server-side query: only this guest's own reservations.
      const res = await reservationAPI.getByGuestId(userId);
      setReservations(res.data && Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setReservations([]);
      setReservationsError(
        err?.response?.data?.message ||
          "We could not load your reservations. Please retry.",
      );
    } finally {
      setLoadingReservations(false);
    }
  };

  // Load this client's table reservations from the backend.
  const loadTableReservations = async () => {
    setLoadingTableRes(true);
    setTableResError("");
    try {
      const userId = currentUser?.id;
      if (!userId) {
        setTableReservations([]);
        return;
      }
      const res = await tableReservationAPI.getByGuestId(userId);
      setTableReservations(res.data && Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setTableReservations([]);
      setTableResError(
        err?.response?.data?.message ||
          "We could not load your table reservations. Please retry.",
      );
    } finally {
      setLoadingTableRes(false);
    }
  };

  useEffect(() => {
    loadRooms();
    loadReservations();
    loadTableReservations();
    loadSpaReservations();
    loadBookableOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // Re-fetch every reservation type whenever the client opens My Reservations
  useEffect(() => {
    if (activeTab === "reservations") {
      loadReservations();
      loadTableReservations();
      loadSpaReservations();
    }
  }, [activeTab]);

  /** Opens the modify-date/time panel pre-filled with the current booking values. */
  const openReschedule = (item) => {
    setRescheduleError("");
    if (item.type === "ROOM") {
      setRescheduleValues({
        checkInDate: item.raw.checkInDate || "",
        checkOutDate: item.raw.checkOutDate || "",
        numberOfGuests: item.raw.numberOfGuests || 1,
      });
    } else if (item.type === "TABLE") {
      setRescheduleValues({
        reservationDate: item.raw.reservationDate || "",
        timeSlot: item.raw.timeSlot || "18:00",
        partySize: item.raw.partySize || 1,
      });
    } else {
      setRescheduleValues({
        bookingDate: item.raw.bookingDate || "",
        startTime: item.raw.startTime || "10:30",
        numberOfGuests: item.raw.numberOfGuests || 1,
      });
    }
    setRescheduleTarget(item);
  };

  const submitReschedule = async (e) => {
    e.preventDefault();
    if (!rescheduleTarget) return;
    setRescheduleSubmitting(true);
    setRescheduleError("");
    const result = await handleReschedule({
      type: rescheduleTarget.type,
      id: rescheduleTarget.id,
      values: rescheduleValues,
    });
    setRescheduleSubmitting(false);
    if (result.ok) {
      setRescheduleTarget(null);
      setAlertNotice({ type: "success", message: result.message });
      setTimeout(() => setAlertNotice(null), 8000);
    } else {
      // Keep the panel open and show the backend's real reason.
      setRescheduleError(result.message);
    }
  };

  // Handle Search Availability button — queries the real backend only.
  const handleSearchAvailability = async (e) => {
    e?.preventDefault();
    setLoadingRooms(true);
    setRoomsError("");
    try {
      const res = await roomAPI.getAvailable(
        searchDates.checkIn,
        searchDates.checkOut,
        searchDates.guests,
      );
      const available = res.data && Array.isArray(res.data) ? res.data : [];
      setRooms(
        available.map((r) => ({
          ...r,
          image: withRoomImage(r).image,
        })),
      );
    } catch (err) {
      setRoomsError(
        err?.response?.data?.message ||
          "We could not check availability right now. Please try again.",
      );
    } finally {
      setLoadingRooms(false);
    }
  };

  // Filter rooms reactively by type, price, guests, and search query
  const filteredRooms = useMemo(() => {
    const q = (searchQuery || "").trim().toLowerCase();
    return rooms.filter((room) => {
      const matchesType =
        selectedType === "ALL" || room.roomType === selectedType;
      const matchesPrice = Number(room.basePrice || 0) <= maxPrice;
      const matchesCapacity =
        !searchDates.guests ||
        Number(room.capacity || 1) >= Number(searchDates.guests);
      const matchesQuery =
        !q ||
        (room.roomNumber &&
          String(room.roomNumber).toLowerCase().includes(q)) ||
        (room.roomType && room.roomType.toLowerCase().includes(q)) ||
        (room.description && room.description.toLowerCase().includes(q)) ||
        (q.includes("bath") && room.hasBathtub) ||
        (q.includes("balcony") && room.hasBalcony) ||
        (q.includes("bar") && room.hasMinibar);

      return matchesType && matchesPrice && matchesCapacity && matchesQuery;
    });
  }, [rooms, selectedType, maxPrice, searchDates.guests, searchQuery]);

  // Handle Confirm Booking — submits to the real backend and reports PENDING.
  const handleConfirmBooking = async (bookingData) => {
    const res = await reservationAPI.create({
      guestId: currentUser?.id,
      roomId: bookingData.roomId,
      checkInDate: bookingData.checkInDate,
      checkOutDate: bookingData.checkOutDate,
      numberOfGuests: Number(bookingData.numberOfGuests || 1),
      specialRequests: bookingData.specialRequests || "",
    });

    const createdRes = res && res.data ? res.data : null;
    if (!createdRes) {
      throw new Error(
        "The server did not return a reservation. Please try again.",
      );
    }

    setSelectedRoomForBooking(null);
    const reservedRoomNumber =
      createdRes.room?.roomNumber || selectedRoomForBooking?.roomNumber || "";
    setAlertNotice({
      type: "success",
      message: `Reservation confirmed for Room ${reservedRoomNumber}. Status: ${
        createdRes.status || "PENDING"
      } — our front desk will review and confirm your stay shortly.`,
    });
    setResSubTab("rooms");
    setActiveTab("reservations");
    setTimeout(() => setAlertNotice(null), 8000);
  };

  // Smart Cancellation rule
  // A "Cancel Reservation" button appears on any reservation whose check-in date is still in the future,
  // regardless of Pending/Confirmed status — it disappears once the check-in date has passed or the guest has checked in.
  // Load this client's spa reservations from the backend.
  const loadSpaReservations = async () => {
    setLoadingSpaRes(true);
    setSpaResError("");
    try {
      const userId = currentUser?.id;
      if (!userId) {
        setSpaReservations([]);
        return;
      }
      const res = await spaBookingAPI.getByGuestId(userId);
      setSpaReservations(res.data && Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setSpaReservations([]);
      setSpaResError(
        err?.response?.data?.message ||
          "We could not load your spa reservations. Please retry.",
      );
    } finally {
      setLoadingSpaRes(false);
    }
  };

  const reloadAllReservations = async () => {
    await Promise.all([
      loadReservations(),
      loadTableReservations(),
      loadSpaReservations(),
    ]);
  };

  /**
   * Live department inventory for the booking page: every dining table and every
   * active spa ritual, read straight from the backend (no placeholder rows).
   */
  const loadBookableOptions = async () => {
    setMixLoading(true);
    setMixError("");
    try {
      const [tableResponse, spaResponse] = await Promise.all([
        restaurantTableAPI.getAll(),
        spaServiceAPI.getActive(),
      ]);
      setTableOptions(
        Array.isArray(tableResponse.data) ? tableResponse.data : [],
      );
      setBookableSpaServices(
        Array.isArray(spaResponse.data) ? spaResponse.data : [],
      );
    } catch (err) {
      setTableOptions([]);
      setBookableSpaServices([]);
      setMixError(
        err?.response?.data?.message ||
          "We could not load dining tables and spa rituals. Please retry.",
      );
    } finally {
      setMixLoading(false);
    }
  };

  /**
   * Unified, normalised view of every reservation belonging to the signed-in client.
   * Statuses are bucketed into PENDING / CONFIRMED / COMPLETED / CANCELLED exactly
   * as persisted by the backend.
   */
  const allReservations = useMemo(() => {
    const roomItems = reservations.map((r) => ({
      key: `ROOM-${r.id}`,
      type: "ROOM",
      id: r.id,
      title: r.room
        ? `Room ${r.room.roomNumber} · ${r.room.roomType}`
        : `Room reservation #${r.id}`,
      date: r.checkInDate,
      endDate: r.checkOutDate,
      time: "15:00 check-in · 11:00 check-out",
      status: r.status,
      amount: r.totalPrice,
      created: r.createdDate,
      guests: r.numberOfGuests,
      raw: r,
    }));

    const tableItems = tableReservations.map((r) => ({
      key: `TABLE-${r.id}`,
      type: "TABLE",
      id: r.id,
      title: r.restaurantTable
        ? `Table ${r.restaurantTable.tableNumber}${
            r.restaurantTable.area
              ? ` · ${String(r.restaurantTable.area).replace("_", " ")}`
              : ""
          }`
        : `Table reservation #${r.id}`,
      date: r.reservationDate,
      endDate: null,
      time: r.timeSlot,
      status: r.status,
      amount: null,
      created: r.createdAt,
      guests: r.partySize,
      raw: r,
    }));

    const spaItems = spaReservations.map((r) => ({
      key: `SPA-${r.id}`,
      type: "SPA",
      id: r.id,
      title: r.spaService ? r.spaService.name : `Spa booking #${r.id}`,
      date: r.bookingDate,
      endDate: null,
      time: r.startTime,
      status: r.status,
      amount: r.totalPrice,
      created: r.createdAt,
      guests: r.numberOfGuests,
      raw: r,
    }));

    return [...roomItems, ...tableItems, ...spaItems];
  }, [reservations, tableReservations, spaReservations]);

  /** Buckets a backend status into one of the four sections shown in the UI. */
  const statusBucket = (status) => {
    switch (status) {
      case "PENDING":
        return "PENDING";
      case "CONFIRMED":
      case "CHECKED_IN":
      case "SEATED":
        return "CONFIRMED";
      case "CHECKED_OUT":
      case "COMPLETED":
        return "COMPLETED";
      case "CANCELLED":
      case "NO_SHOW":
        return "CANCELLED";
      default:
        return "PENDING";
    }
  };

  const filteredReservations = useMemo(() => {
    if (resFilter === "ALL") return allReservations;
    return allReservations.filter((r) => statusBucket(r.status) === resFilter);
  }, [allReservations, resFilter]);

  /**
   * Soonest upcoming bookings (rooms, dining tables and spa rituals) exactly as
   * returned by the backend. Cancelled and completed records are omitted.
   */
  const upcomingBookings = useMemo(
    () =>
      allReservations
        .filter(
          (item) =>
            !["CANCELLED", "COMPLETED"].includes(statusBucket(item.status)),
        )
        .sort((a, b) =>
          String(a.date || "").localeCompare(String(b.date || "")),
        )
        .slice(0, 6),
    [allReservations],
  );

  /**
   * Free-text search across My Reservations. Every list below is filtered from the
   * real backend payloads, so the search box always queries actual database rows.
   */
  const [resSearchQuery, setResSearchQuery] = useState("");

  const matchesResQuery = (values) => {
    const q = resSearchQuery.trim().toLowerCase();
    if (!q) return true;
    return values.some((v) =>
      String(v ?? "")
        .toLowerCase()
        .includes(q),
    );
  };

  const searchedRoomReservations = useMemo(
    () =>
      reservations.filter((r) =>
        matchesResQuery([
          r.room?.roomNumber,
          r.room?.roomType,
          r.status,
          r.specialRequests,
          r.checkInDate,
          r.checkOutDate,
        ]),
      ),
    [reservations, resSearchQuery],
  );

  const searchedTableReservations = useMemo(
    () =>
      tableReservations.filter((r) =>
        matchesResQuery([
          r.restaurantTable?.tableNumber,
          r.restaurantTable?.area,
          r.status,
          r.specialRequests,
          r.timeSlot,
          r.reservationDate,
        ]),
      ),
    [tableReservations, resSearchQuery],
  );

  const searchedSpaReservations = useMemo(
    () =>
      spaReservations.filter((r) =>
        matchesResQuery([
          r.spaService?.name,
          r.spaService?.category,
          r.status,
          r.specialRequests,
          r.startTime,
          r.bookingDate,
        ]),
      ),
    [spaReservations, resSearchQuery],
  );

  const reservationCounts = useMemo(() => {
    const counts = {
      ALL: allReservations.length,
      PENDING: 0,
      CONFIRMED: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };
    for (const r of allReservations) {
      counts[statusBucket(r.status)] += 1;
    }
    return counts;
  }, [allReservations]);

  /**
   * Submits a date/time change for any reservation type to the real backend.
   * The backend validates ownership, availability and conflicts; its rejection
   * message is surfaced verbatim and the reservation is NOT shown as changed.
   */
  const handleReschedule = async ({ type, id, values }) => {
    const actingGuestId = currentUser?.id;
    if (!actingGuestId) {
      return {
        ok: false,
        message: "You must be signed in to modify a reservation.",
      };
    }

    try {
      if (type === "ROOM") {
        await reservationAPI.reschedule(id, {
          checkInDate: values.checkInDate,
          checkOutDate: values.checkOutDate,
          numberOfGuests: Number(values.numberOfGuests || 1),
          actingGuestId,
        });
      } else if (type === "TABLE") {
        await tableReservationAPI.reschedule(id, {
          reservationDate: values.reservationDate,
          timeSlot: values.timeSlot,
          partySize: Number(values.partySize || 1),
          actingGuestId,
        });
      } else {
        await spaBookingAPI.reschedule(id, {
          bookingDate: values.bookingDate,
          startTime: values.startTime,
          numberOfGuests: Number(values.numberOfGuests || 1),
          actingGuestId,
        });
      }

      await reloadAllReservations();
      return {
        ok: true,
        message:
          "Change submitted. The reservation is now PENDING and awaits staff re-approval.",
      };
    } catch (err) {
      return {
        ok: false,
        message:
          err?.response?.data?.message ||
          err?.message ||
          "The server rejected this change. Please review the date and time.",
      };
    }
  };

  const isFutureDate = (dateStr) => {
    if (!dateStr) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    return target >= today;
  };

  const canCancelReservation = (res) => {
    return ["PENDING", "CONFIRMED"].includes(res?.status);
  };

  const handleCancelReservation = async (reservationId) => {
    if (!window.confirm("Are you sure you want to cancel this reservation?")) {
      return;
    }

    try {
      await reservationAPI.cancel(reservationId, currentUser?.id);
      // Re-read from the server so the UI reflects the persisted status.
      await loadReservations();
      setAlertNotice({
        type: "success",
        message: "Reservation cancelled. We hope to welcome you again soon.",
      });
      setTimeout(() => setAlertNotice(null), 5000);
    } catch (err) {
      setAlertNotice({
        type: "error",
        message:
          err?.response?.data?.message ||
          err?.message ||
          "We could not cancel this reservation. Please try again.",
      });
      setTimeout(() => setAlertNotice(null), 7000);
    }
  };

  const handleCancelTableReservation = async (reservationId) => {
    if (
      !window.confirm("Are you sure you want to cancel this table reservation?")
    ) {
      return;
    }
    try {
      await tableReservationAPI.cancel(reservationId, currentUser?.id);
      await loadTableReservations();
      setAlertNotice({
        type: "success",
        message: "Table reservation cancelled.",
      });
      setTimeout(() => setAlertNotice(null), 5000);
    } catch (err) {
      setAlertNotice({
        type: "error",
        message:
          err?.response?.data?.message ||
          err?.message ||
          "We could not cancel this table reservation. Please try again.",
      });
      setTimeout(() => setAlertNotice(null), 7000);
    }
  };

  const handleCancelSpaReservation = async (reservationId) => {
    if (
      !window.confirm("Are you sure you want to cancel this spa reservation?")
    ) {
      return;
    }
    try {
      await spaBookingAPI.cancel(reservationId, currentUser?.id);
      await loadSpaReservations();
      setAlertNotice({
        type: "success",
        message: "Spa reservation cancelled.",
      });
      setTimeout(() => setAlertNotice(null), 5000);
    } catch (err) {
      setAlertNotice({
        type: "error",
        message:
          err?.response?.data?.message ||
          err?.message ||
          "We could not cancel this spa reservation. Please try again.",
      });
      setTimeout(() => setAlertNotice(null), 7000);
    }
  };

  const activeReservationsCount = tableReservations.filter(
    (r) => !["CANCELLED", "COMPLETED", "NO_SHOW"].includes(r.status),
  ).length;

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
              {alertNotice.type === "success" ? "check_circle" : "info"}
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
      {activeTab === "book" && (
        <main
          style={{
            width: "100%",
            maxWidth: "100%",
            margin: 0,
            padding: "0 0 60px",
            overflowX: "hidden",
          }}
        >
          {/* Compact cinematic banner (replaces the former full-screen hero) */}
          <section
            className="room-reservation-hero"
            style={{
              background: `linear-gradient(rgba(26, 26, 26, 0.7), rgba(26, 26, 26, 0.88)), url("${ROOM_RESERVATION_IMAGE}") center/cover no-repeat`,
            }}
          >
            <div className="room-reservation-hero-inner">
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "rgba(255,255,255,0.12)",
                  backdropFilter: "blur(8px)",
                  padding: "5px 16px",
                  borderRadius: "20px",
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginBottom: "16px",
                }}
              >
                <span
                  style={{
                    width: "7px",
                    height: "7px",
                    borderRadius: "50%",
                    background: "var(--accent)",
                  }}
                />
                THE SANCTUARY COLLECTION &bull; PARIS &bull; 874 BOULEVARD
                MONTAIGNE
              </div>
              <h1>Reserve Your Room</h1>
              <p>
                Choose from our signature suites and residences, each appointed
                with bespoke furnishings, plush Italian bedding and marble
                baths. Every stay includes artisan breakfast, complimentary
                thermal spa access and 24/7 floor butler service.
              </p>

              <div className="room-reservation-stat-row">
                <div className="room-reservation-stat">
                  <strong>{rooms.length}</strong>
                  <span>Suites &amp; Rooms</span>
                </div>
                <div className="room-reservation-stat">
                  <strong>{filteredRooms.length}</strong>
                  <span>Matching Search</span>
                </div>
                <div className="room-reservation-stat">
                  <strong>15:00 / 11:00</strong>
                  <span>Check-in / Check-out</span>
                </div>
              </div>

              {/* Active Modern Booking & Search Ribbon */}
              <form
                className="room-search-ribbon"
                onSubmit={handleSearchAvailability}
                style={{
                  background: "rgba(255, 255, 255, 0.98)",
                  backdropFilter: "blur(16px)",
                  borderRadius: "16px",
                  padding: "18px 24px",
                  boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35)",
                  textAlign: "left",
                  maxWidth: "1240px",
                  margin: "0 auto",
                  border: "1px solid rgba(255,255,255,0.5)",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "10px",
                      fontWeight: 800,
                      color: "var(--muted)",
                      textTransform: "uppercase",
                      marginBottom: "4px",
                    }}
                  >
                    KEYWORD / SUITE
                  </label>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: "16px", color: "var(--muted)" }}
                    >
                      search
                    </span>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="e.g. Penthouse, Ocean, Balcony, 201..."
                      style={{
                        width: "100%",
                        border: "none",
                        fontSize: "13px",
                        fontWeight: 700,
                        color: "var(--text)",
                        background: "transparent",
                        outline: "none",
                      }}
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 0,
                          display: "flex",
                          alignItems: "center",
                          color: "var(--muted)",
                        }}
                      >
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: "16px" }}
                        >
                          close
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    borderLeft: "1px solid var(--surface-line)",
                    paddingLeft: "12px",
                  }}
                >
                  <label
                    style={{
                      display: "block",
                      fontSize: "10px",
                      fontWeight: 800,
                      color: "var(--muted)",
                      textTransform: "uppercase",
                      marginBottom: "4px",
                    }}
                  >
                    CHECK-IN
                  </label>
                  <input
                    type="date"
                    required
                    value={searchDates.checkIn}
                    onChange={(e) =>
                      setSearchDates({
                        ...searchDates,
                        checkIn: e.target.value,
                      })
                    }
                    style={{
                      width: "100%",
                      border: "none",
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "var(--text)",
                      background: "transparent",
                      outline: "none",
                    }}
                  />
                </div>

                <div
                  style={{
                    borderLeft: "1px solid var(--surface-line)",
                    paddingLeft: "12px",
                  }}
                >
                  <label
                    style={{
                      display: "block",
                      fontSize: "10px",
                      fontWeight: 800,
                      color: "var(--muted)",
                      textTransform: "uppercase",
                      marginBottom: "4px",
                    }}
                  >
                    CHECK-OUT
                  </label>
                  <input
                    type="date"
                    required
                    value={searchDates.checkOut}
                    onChange={(e) =>
                      setSearchDates({
                        ...searchDates,
                        checkOut: e.target.value,
                      })
                    }
                    style={{
                      width: "100%",
                      border: "none",
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "var(--text)",
                      background: "transparent",
                      outline: "none",
                    }}
                  />
                </div>

                <div
                  style={{
                    borderLeft: "1px solid var(--surface-line)",
                    paddingLeft: "12px",
                  }}
                >
                  <label
                    style={{
                      display: "block",
                      fontSize: "10px",
                      fontWeight: 800,
                      color: "var(--muted)",
                      textTransform: "uppercase",
                      marginBottom: "4px",
                    }}
                  >
                    GUESTS &amp; ROOM
                  </label>
                  <select
                    value={searchDates.guests}
                    onChange={(e) =>
                      setSearchDates({ ...searchDates, guests: e.target.value })
                    }
                    style={{
                      width: "100%",
                      border: "none",
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "var(--text)",
                      background: "transparent",
                      outline: "none",
                    }}
                  >
                    <option value="1">1 Adult, 1 Room</option>
                    <option value="2">2 Adults, 1 Room</option>
                    <option value="3">3 Adults, Suite</option>
                    <option value="4">4+ Adults, Penthouse</option>
                  </select>
                </div>

                <div
                  style={{
                    borderLeft: "1px solid var(--surface-line)",
                    paddingLeft: "12px",
                  }}
                >
                  <label
                    style={{
                      display: "block",
                      fontSize: "10px",
                      fontWeight: 800,
                      color: "var(--muted)",
                      textTransform: "uppercase",
                      marginBottom: "4px",
                    }}
                  >
                    SUITE TIER
                  </label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    style={{
                      width: "100%",
                      border: "none",
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "var(--text)",
                      background: "transparent",
                      outline: "none",
                    }}
                  >
                    <option value="ALL">All Signature Suites</option>
                    <option value="SINGLE">Classic Single</option>
                    <option value="DOUBLE">Superior Double</option>
                    <option value="SUITE">Executive Suite</option>
                    <option value="DELUXE">Deluxe Ocean King</option>
                    <option value="PENTHOUSE">Presidential Penthouse</option>
                  </select>
                </div>

                <div
                  style={{
                    borderLeft: "1px solid var(--surface-line)",
                    paddingLeft: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <label
                      style={{
                        display: "block",
                        fontSize: "10px",
                        fontWeight: 800,
                        color: "var(--muted)",
                        textTransform: "uppercase",
                        marginBottom: "4px",
                      }}
                    >
                      PROMO CODE
                    </label>
                    {promoApplied && (
                      <span
                        style={{
                          fontSize: "9px",
                          fontWeight: 800,
                          color: "var(--accent)",
                          background: "var(--surface-line)",
                          padding: "1px 5px",
                          borderRadius: "4px",
                        }}
                      >
                        ✓ 15% APPLIED
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => {
                      setPromoCode(e.target.value);
                      setPromoApplied(
                        e.target.value.trim().toUpperCase() ===
                          "AMBASSADOR-CLUB",
                      );
                    }}
                    placeholder="AMBASSADOR-CLUB"
                    style={{
                      width: "100%",
                      border: "none",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "var(--text)",
                      background: "transparent",
                      outline: "none",
                      letterSpacing: "0.04em",
                    }}
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    background: "var(--primary)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "10px",
                    padding: "12px 22px",
                    fontWeight: 700,
                    fontSize: "13px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    boxShadow: "0 4px 10px rgba(26, 26, 26, 0.3)",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: "18px" }}
                  >
                    search
                  </span>
                  <span>Check &amp; Search</span>
                </button>
              </form>

              {/* Calendar + analog clock for choosing the stay dates visually */}
              <div className="rdt-toggle-row">
                <button
                  type="button"
                  className="public-outline-btn"
                  onClick={() => setShowRoomPicker((open) => !open)}
                  aria-expanded={showRoomPicker}
                >
                  <span className="material-symbols-outlined">
                    calendar_month
                  </span>
                  <span>
                    {showRoomPicker
                      ? "Hide calendar & clock"
                      : "Pick stay dates visually"}
                  </span>
                </button>
              </div>

              {showRoomPicker && (
                <div style={{ marginTop: "18px", textAlign: "left" }}>
                  <div className="rdt-picker">
                    <div className="rdt-picker-col">
                      <span className="rdt-col-label">
                        <span className="material-symbols-outlined">login</span>
                        Check-in date
                      </span>
                      <CalendarGrid
                        value={searchDates.checkIn}
                        onChange={(iso) =>
                          setSearchDates((current) => ({
                            ...current,
                            checkIn: iso,
                            checkOut:
                              !current.checkOut || current.checkOut <= iso
                                ? new Date(new Date(iso).getTime() + 86400000)
                                    .toISOString()
                                    .slice(0, 10)
                                : current.checkOut,
                          }))
                        }
                        minDate={getTodayStr()}
                        idPrefix="room-page-checkin"
                      />
                    </div>
                    <div className="rdt-picker-col">
                      <span className="rdt-col-label">
                        <span className="material-symbols-outlined">
                          logout
                        </span>
                        Check-out date
                      </span>
                      <CalendarGrid
                        value={searchDates.checkOut}
                        onChange={(iso) =>
                          setSearchDates((current) => ({
                            ...current,
                            checkOut: iso,
                          }))
                        }
                        minDate={searchDates.checkIn || getTodayStr()}
                        idPrefix="room-page-checkout"
                      />
                    </div>
                    <div className="rdt-picker-col">
                      <span className="rdt-col-label">
                        <span className="material-symbols-outlined">
                          schedule
                        </span>
                        Preferred arrival
                      </span>
                      <AnalogClock
                        value={searchDates.arrivalTime || "15:00"}
                        onChange={(t) =>
                          setSearchDates((current) => ({
                            ...current,
                            arrivalTime: t,
                          }))
                        }
                        label="Preferred arrival"
                        idPrefix="room-page-arrival"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Guarantees Bar */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "24px",
                  flexWrap: "wrap",
                  marginTop: "18px",
                  fontSize: "12px",
                  color: "var(--muted)",
                }}
              >
                <span
                  style={{ display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: "16px", color: "var(--accent)" }}
                  >
                    verified
                  </span>
                  Direct Reservation Privileges (AMBASSADOR-CLUB)
                </span>
                <span
                  style={{ display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: "16px", color: "var(--accent)" }}
                  >
                    spa
                  </span>
                  Complimentary Thermal Spa Access
                </span>
                <span
                  style={{ display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: "16px", color: "var(--accent)" }}
                  >
                    room_service
                  </span>
                  24/7 Dedicated Floor Butler
                </span>
              </div>
            </div>
          </section>

          {/* --- Live itinerary: real rows from the database for this guest --- */}
          <section className="itinerary-list-section">
            <div className="itinerary-list-head">
              <div>
                <span className="eyebrow" style={{ color: "var(--accent)" }}>
                  LIVE FROM YOUR FOLIO
                </span>
                <h2>Your Upcoming Reservations</h2>
                <p>
                  Every row below is read from the hotel database - room stays,
                  dining tables and spa rituals booked under your account.
                </p>
              </div>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="outline-button"
                  onClick={() => setActiveTab("reservations")}
                >
                  <span className="material-symbols-outlined">event_note</span>
                  <span>My Reservations</span>
                </button>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => setActiveTab("spa")}
                >
                  <span className="material-symbols-outlined">spa</span>
                  <span>Reserve Spa</span>
                </button>
              </div>
            </div>

            {loadingReservations || loadingTableRes || loadingSpaRes ? (
              <div className="catalog-loading">
                <span className="spinner" />
                <p>Loading your reservations...</p>
              </div>
            ) : reservationsError || tableResError || spaResError ? (
              <div className="api-error-panel" role="alert">
                <span className="material-symbols-outlined">error</span>
                <div>
                  <strong>We couldn&apos;t load your reservations.</strong>
                  <p>{reservationsError || tableResError || spaResError}</p>
                </div>
                <button
                  type="button"
                  className="outline-button"
                  onClick={reloadAllReservations}
                >
                  Try Again
                </button>
              </div>
            ) : upcomingBookings.length === 0 ? (
              <div
                className="empty-card"
                style={{ padding: "48px 20px", textAlign: "center" }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "44px", color: "var(--muted)" }}
                >
                  event_available
                </span>
                <h3 style={{ marginTop: "12px" }}>
                  No reservations on your account yet
                </h3>
                <p style={{ color: "var(--muted)" }}>
                  Choose a suite below to start a stay, or reserve a dining
                  table or spa ritual.
                </p>
              </div>
            ) : (
              <div className="itinerary-list-panel">
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Reference</th>
                        <th>Reservation</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Guests</th>
                        <th>Status</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {upcomingBookings.map((item) => {
                        const bucket = statusBucket(item.status);
                        const statusClass =
                          bucket === "CONFIRMED"
                            ? "status-green"
                            : bucket === "CANCELLED"
                              ? "status-red"
                              : bucket === "COMPLETED"
                                ? "status-navy"
                                : "status-amber";
                        const amount = Number(item.amount);
                        return (
                          <tr key={item.key}>
                            <td>
                              <span className="itinerary-type-chip">
                                {item.type === "ROOM"
                                  ? "Room"
                                  : item.type === "TABLE"
                                    ? "Dining"
                                    : "Spa"}
                              </span>
                              <div
                                style={{
                                  fontSize: "11px",
                                  color: "var(--muted)",
                                }}
                              >
                                #{item.id}
                              </div>
                            </td>
                            <td>
                              <strong>{item.title}</strong>
                            </td>
                            <td>
                              {item.date}
                              {item.endDate ? ` - ${item.endDate}` : ""}
                            </td>
                            <td>{item.time}</td>
                            <td>{item.guests || 1} Guests</td>
                            <td>
                              <span className={`status-badge ${statusClass}`}>
                                {item.status}
                              </span>
                            </td>
                            <td>
                              {Number.isFinite(amount) && item.amount != null
                                ? `$${amount.toFixed(2)}`
                                : "-"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          {/* ─── Curated Residences & Quarters Section ─── */}
          <section
            style={{
              maxWidth: "1200px",
              margin: "40px auto",
              padding: "0 20px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
                flexWrap: "wrap",
                gap: "14px",
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 800,
                    color: "var(--accent)",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  TAILORED ACCOMMODATIONS
                </span>
                <h2
                  style={{
                    fontSize: "24px",
                    fontWeight: 800,
                    margin: "2px 0 0",
                    color: "var(--text)",
                  }}
                >
                  Curated Residences &amp; Quarters
                </h2>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                {["ALL", "SUITE", "PENTHOUSE"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedType(t)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: 700,
                      border:
                        selectedType === t
                          ? "none"
                          : "1px solid var(--surface-line)",
                      background:
                        selectedType === t ? "var(--primary)" : "#ffffff",
                      color: selectedType === t ? "#ffffff" : "var(--muted)",
                      cursor: "pointer",
                    }}
                  >
                    {t === "ALL"
                      ? "All Keys (12)"
                      : t === "SUITE"
                        ? "King Suites (4)"
                        : "Penthouse (2)"}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Search & Filter Indicator */}
            {searchQuery && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "8px",
                  marginBottom: "20px",
                  background: "var(--surface-line)",
                  padding: "10px 16px",
                  borderRadius: "10px",
                  border: "1px solid var(--surface-line)",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: "20px", color: "var(--accent)" }}
                  >
                    search
                  </span>
                  <span
                    style={{
                      fontSize: "13px",
                      color: "var(--accent)",
                      fontWeight: 600,
                    }}
                  >
                    Keyword filter: <strong>"{searchQuery}"</strong> &bull;{" "}
                    {filteredRooms.length}{" "}
                    {filteredRooms.length === 1 ? "room" : "rooms"} matched
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  style={{
                    background: "var(--primary)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    padding: "4px 10px",
                    fontSize: "11px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: "14px" }}
                  >
                    close
                  </span>
                  Clear Search
                </button>
              </div>
            )}

            {/* Room Cards Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
                gap: "24px",
              }}
            >
              {filteredRooms.map((room) => (
                <article
                  key={room.id || room.roomNumber}
                  style={{
                    background: "#ffffff",
                    borderRadius: "16px",
                    border: "1px solid var(--surface-line)",
                    overflow: "hidden",
                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      height: "220px",
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={withRoomImage(room).image}
                      alt={room.roomType}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        top: "12px",
                        left: "12px",
                        background: "var(--text)",
                        color: "#ffffff",
                        padding: "3px 8px",
                        borderRadius: "4px",
                        fontSize: "11px",
                        fontWeight: 800,
                      }}
                    >
                      Room {room.roomNumber} &bull; {room.roomType}
                    </div>
                    <div
                      style={{
                        position: "absolute",
                        bottom: "12px",
                        right: "12px",
                        background: "rgba(26, 26, 26,0.85)",
                        color: "#ffffff",
                        padding: "4px 10px",
                        borderRadius: "6px",
                        fontSize: "13px",
                        fontWeight: 800,
                        backdropFilter: "blur(4px)",
                      }}
                    >
                      ${Number(room.basePrice || 0).toFixed(0)}{" "}
                      <span
                        style={{
                          fontSize: "10px",
                          color: "var(--surface-line)",
                        }}
                      >
                        / night
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "20px",
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          fontSize: "18px",
                          fontWeight: 800,
                          margin: "0 0 6px",
                          color: "var(--text)",
                        }}
                      >
                        {room.roomType === "PENTHOUSE"
                          ? "Atelier Presidential Penthouse"
                          : room.roomType === "DELUXE"
                            ? "Deluxe Ocean King"
                            : room.roomType === "SUITE"
                              ? "Executive Boutique Suite"
                              : `${room.roomType} Comfort Quarter`}
                      </h3>
                      <p
                        style={{
                          fontSize: "12px",
                          color: "var(--muted)",
                          margin: "0 0 14px",
                          lineHeight: 1.5,
                        }}
                      >
                        {room.description}
                      </p>
                    </div>

                    <div>
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          flexWrap: "wrap",
                          marginBottom: "16px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "11px",
                            background: "var(--surface-soft)",
                            color: "var(--muted)",
                            padding: "3px 8px",
                            borderRadius: "4px",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: "14px" }}
                          >
                            group
                          </span>
                          Sleeps {room.capacity}
                        </span>
                        {room.hasBathtub && (
                          <span
                            style={{
                              fontSize: "11px",
                              background: "var(--surface-soft)",
                              color: "var(--muted)",
                              padding: "3px 8px",
                              borderRadius: "4px",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <span
                              className="material-symbols-outlined"
                              style={{ fontSize: "14px" }}
                            >
                              bathtub
                            </span>
                            Soaking Tub
                          </span>
                        )}
                        {room.hasBalcony && (
                          <span
                            style={{
                              fontSize: "11px",
                              background: "var(--surface-soft)",
                              color: "var(--muted)",
                              padding: "3px 8px",
                              borderRadius: "4px",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <span
                              className="material-symbols-outlined"
                              style={{ fontSize: "14px" }}
                            >
                              balcony
                            </span>
                            Balcony
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedRoomForBooking(room)}
                        style={{
                          width: "100%",
                          background: "var(--primary)",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "8px",
                          padding: "10px",
                          fontWeight: 700,
                          fontSize: "13px",
                          cursor: "pointer",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <span>Reserve Suite</span>
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: "16px" }}
                        >
                          arrow_forward
                        </span>
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* --- Live dining tables & spa rituals straight from the database --- */}
          <section className="itinerary-list-section">
            <div className="itinerary-list-head">
              <div>
                <span className="eyebrow" style={{ color: "var(--accent)" }}>
                  LIVE AVAILABILITY
                </span>
                <h2>Dining Tables &amp; Spa Rituals</h2>
                <p>
                  Real inventory from the restaurant and wellness departments.
                  Select any item to continue into the reservation flow.
                </p>
              </div>
            </div>

            {mixError && (
              <div className="api-error-panel" role="alert">
                <span className="material-symbols-outlined">error</span>
                <div>
                  <strong>We couldn&apos;t load live availability.</strong>
                  <p>{mixError}</p>
                </div>
                <button
                  type="button"
                  className="outline-button"
                  onClick={loadBookableOptions}
                >
                  Try Again
                </button>
              </div>
            )}

            <div className="live-availability-grid">
              <div className="itinerary-list-panel">
                <div className="live-availability-head">
                  <span className="material-symbols-outlined">restaurant</span>
                  <div>
                    <strong>Restaurant Tables ({tableOptions.length})</strong>
                    <small>Main hall, terrace and private dining rooms</small>
                  </div>
                  <button
                    type="button"
                    className="outline-button"
                    onClick={() => setActiveTab("restaurant")}
                  >
                    Reserve
                  </button>
                </div>
                {mixLoading ? (
                  <div className="catalog-loading">
                    <span className="spinner" />
                    <p>Loading tables...</p>
                  </div>
                ) : tableOptions.length === 0 ? (
                  <p className="live-availability-empty">
                    No dining tables are currently listed.
                  </p>
                ) : (
                  <ul className="live-availability-list">
                    {tableOptions.map((table) => (
                      <li key={table.id}>
                        <div>
                          <strong>Table {table.tableNumber}</strong>
                          <small>
                            {String(table.area || "MAIN_HALL").replace(
                              /_/g,
                              " ",
                            )}{" "}
                            &bull; seats {table.capacity}
                          </small>
                        </div>
                        <span
                          className={`table-status-chip ${String(table.status || "").toLowerCase()}`}
                        >
                          {String(table.status || "AVAILABLE").replace(
                            /_/g,
                            " ",
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="itinerary-list-panel">
                <div className="live-availability-head">
                  <span className="material-symbols-outlined">spa</span>
                  <div>
                    <strong>Spa Rituals ({bookableSpaServices.length})</strong>
                    <small>Treatments currently open for reservation</small>
                  </div>
                  <button
                    type="button"
                    className="outline-button"
                    onClick={() => setActiveTab("spa")}
                  >
                    Reserve
                  </button>
                </div>
                {mixLoading ? (
                  <div className="catalog-loading">
                    <span className="spinner" />
                    <p>Loading rituals...</p>
                  </div>
                ) : bookableSpaServices.length === 0 ? (
                  <p className="live-availability-empty">
                    No spa rituals are currently listed.
                  </p>
                ) : (
                  <ul className="live-availability-list">
                    {bookableSpaServices.map((service) => (
                      <li key={service.id}>
                        <div>
                          <strong>{service.name}</strong>
                          <small>
                            {String(service.category || "").replace(/_/g, " ")}{" "}
                            &bull; {service.durationMinutes} min
                          </small>
                        </div>
                        <span className="live-availability-price">
                          ${service.price}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>

          {/* ─── Accreditations Banner matching Image 5 ─── */}
          <section
            style={{
              maxWidth: "1200px",
              margin: "40px auto",
              padding: "0 20px",
            }}
          >
            <div
              style={{
                background: "var(--surface-soft)",
                borderRadius: "12px",
                border: "1px solid var(--surface-line)",
                padding: "16px 24px",
                display: "flex",
                justifyContent: "space-around",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "16px",
                fontSize: "12px",
                fontWeight: 700,
                color: "var(--muted)",
              }}
            >
              <span>&bull; Michelin Guide 3 Keys 2024</span>
              <span>&bull; Forbes Travel Guide &bull; 5-Star Hotel</span>
              <span>&bull; Wine Spectator &bull; Grand Award</span>
              <span>&bull; Green Globe Platinum Certified</span>
            </div>
          </section>

          {/* ─── Private Member Newsletter Banner matching Image 5 ─── */}
          <section
            style={{
              maxWidth: "1200px",
              margin: "40px auto",
              padding: "0 20px",
            }}
          >
            <div
              style={{
                background:
                  "linear-gradient(135deg, var(--text) 0%, var(--accent) 100%)",
                borderRadius: "16px",
                padding: "40px",
                color: "#ffffff",
                textAlign: "center",
              }}
            >
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 800,
                  color: "var(--surface-soft)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                PRIVATE MEMBERSHIP
              </span>
              <h2
                style={{
                  fontSize: "26px",
                  fontWeight: 800,
                  margin: "6px 0 8px",
                  color: "#ffffff",
                }}
              >
                Gain Access to Private Member Allocations &amp; Seasonal
                Tastings
              </h2>
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--surface-line)",
                  maxWidth: "600px",
                  margin: "0 auto 20px",
                }}
              >
                Patrons receive invitation-only salon events, guaranteed suite
                upgrades, and bespoke airport transfers.
              </p>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "10px",
                  maxWidth: "480px",
                  margin: "0 auto",
                }}
              >
                <input
                  type="email"
                  placeholder="Enter your official or private email"
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "none",
                    fontSize: "13px",
                  }}
                />
                <button
                  type="button"
                  onClick={() =>
                    setAlertNotice({
                      type: "success",
                      message:
                        "Invitation requested. Our membership team will contact you shortly.",
                    })
                  }
                  style={{
                    background: "var(--accent)",
                    color: "var(--text)",
                    border: "none",
                    borderRadius: "8px",
                    padding: "10px 18px",
                    fontWeight: 800,
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  Request Invitation
                </button>
              </div>
            </div>
          </section>

          {/* ─── Luxury Dark Footer matching Image 5 ─── */}
        </main>
      )}

      {/* Tab 2: My Reservations Tab (with Sub-tabs for Rooms vs Tables) */}
      {activeTab === "reservations" && (
        <main className="client-main-content">
          <div className="reservations-page-header">
            <div>
              <span className="eyebrow" style={{ color: "var(--text)" }}>
                Guest Itinerary
              </span>
              <h1>My Reservations</h1>
              <p>
                Review your upcoming retreats, confirmed stays, and restaurant
                reservations.
              </p>
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button
                type="button"
                className="outline-button"
                onClick={reloadAllReservations}
                disabled={
                  loadingReservations || loadingTableRes || loadingSpaRes
                }
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
                title="Fetch latest room and table reservations"
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "18px" }}
                >
                  refresh
                </span>
                <span>Refresh</span>
              </button>
              <button
                type="button"
                className="outline-button"
                onClick={() => setActiveTab("restaurant")}
              >
                <span className="material-symbols-outlined">restaurant</span>
                <span>Reserve a Table</span>
              </button>
              <button
                type="button"
                className="outline-button"
                onClick={() => setActiveTab("spa")}
              >
                <span className="material-symbols-outlined">spa</span>
                <span>Reserve Spa</span>
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() => setActiveTab("book")}
              >
                <span className="material-symbols-outlined">add</span>
                <span>Book a Room</span>
              </button>
            </div>
          </div>

          {/* ─── Unified overview: rooms + tables + spa (real backend data) ─── */}
          <section className="client-section" style={{ marginBottom: "36px" }}>
            <div className="section-heading" style={{ marginBottom: "14px" }}>
              <div>
                <span className="eyebrow">ALL BOOKINGS</span>
                <h2>Your Complete Itinerary</h2>
              </div>
            </div>

            <div className="res-search-row">
              <div className="catalog-search">
                <span className="material-symbols-outlined">search</span>
                <input
                  type="search"
                  value={resSearchQuery}
                  onChange={(e) => setResSearchQuery(e.target.value)}
                  placeholder="Search by room, table, ritual, status or date..."
                  aria-label="Search my reservations"
                />
                {resSearchQuery && (
                  <button
                    type="button"
                    className="spa-search-clear"
                    onClick={() => setResSearchQuery("")}
                    aria-label="Clear search"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                )}
              </div>
              <span className="catalog-result-count">
                {searchedRoomReservations.length +
                  searchedTableReservations.length +
                  searchedSpaReservations.length}{" "}
                matching
              </span>
            </div>

            <div
              className="res-status-filters"
              role="tablist"
              aria-label="Filter reservations by status"
            >
              {[
                { id: "ALL", label: "All" },
                { id: "PENDING", label: "Pending" },
                { id: "CONFIRMED", label: "Confirmed" },
                { id: "COMPLETED", label: "Completed" },
                { id: "CANCELLED", label: "Cancelled" },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  role="tab"
                  aria-selected={resFilter === f.id}
                  className={`res-status-filter ${resFilter === f.id ? "active" : ""}`}
                  onClick={() => setResFilter(f.id)}
                >
                  {f.label}
                  <span className="res-status-count">
                    {reservationCounts[f.id]}
                  </span>
                </button>
              ))}
            </div>

            {(reservationsError || tableResError || spaResError) && (
              <div className="api-error-panel" role="alert">
                <span className="material-symbols-outlined">error</span>
                <div>
                  <strong>We couldn&apos;t load some reservations.</strong>
                  <p>{reservationsError || tableResError || spaResError}</p>
                </div>
                <button
                  type="button"
                  className="outline-button"
                  onClick={reloadAllReservations}
                >
                  Try Again
                </button>
              </div>
            )}

            {loadingReservations || loadingTableRes || loadingSpaRes ? (
              <div className="catalog-loading">
                <span className="spinner" />
                <p>Loading your reservations…</p>
              </div>
            ) : filteredReservations.length === 0 ? (
              <div className="empty-card">
                <span className="material-symbols-outlined">
                  event_available
                </span>
                <h3>
                  {resFilter === "ALL"
                    ? "You have no reservations yet"
                    : `No ${resFilter.toLowerCase()} reservations`}
                </h3>
                <p>
                  {resFilter === "ALL"
                    ? "Browse our suites, spa rituals and dining experiences to plan your stay."
                    : "Try selecting a different status filter."}
                </p>
              </div>
            ) : (
              <div className="itinerary-list-panel">
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Reservation</th>
                        <th>Date &amp; Details</th>
                        <th>Time / Stay</th>
                        <th>Guests</th>
                        <th>Status</th>
                        <th>Price</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReservations.map((item) => {
                        const bucket = statusBucket(item.status);
                        const statusClass =
                          bucket === "CONFIRMED"
                            ? "status-green"
                            : bucket === "CANCELLED"
                              ? "status-red"
                              : bucket === "COMPLETED"
                                ? "status-navy"
                                : "status-amber";
                        const canModify =
                          bucket === "PENDING" || bucket === "CONFIRMED";
                        const amount = Number(item.amount);
                        return (
                          <tr key={item.key}>
                            <td>
                              <span className="itinerary-type-chip">
                                {item.type === "ROOM"
                                  ? "Room"
                                  : item.type === "TABLE"
                                    ? "Dining"
                                    : "Spa"}
                              </span>
                              <div
                                style={{
                                  fontSize: "11px",
                                  color: "var(--muted)",
                                  marginTop: "2px",
                                }}
                              >
                                #{item.id}
                              </div>
                            </td>
                            <td>
                              <strong>{item.title}</strong>
                            </td>
                            <td>
                              {item.date}
                              {item.endDate ? ` → ${item.endDate}` : ""}
                            </td>
                            <td>{item.time}</td>
                            <td>{item.guests} Guests</td>
                            <td>
                              <span className={`status-badge ${statusClass}`}>
                                {item.status}
                              </span>
                            </td>
                            <td>
                              {Number.isFinite(amount)
                                ? `$${amount.toFixed(2)}`
                                : "—"}
                            </td>
                            <td>
                              {canModify && (
                                <div
                                  style={{
                                    display: "flex",
                                    gap: "6px",
                                    flexWrap: "wrap",
                                  }}
                                >
                                  <button
                                    type="button"
                                    className="outline-button"
                                    onClick={() => openReschedule(item)}
                                    style={{
                                      padding: "4px 10px",
                                      fontSize: "12px",
                                    }}
                                  >
                                    <span
                                      className="material-symbols-outlined"
                                      style={{ fontSize: "15px" }}
                                    >
                                      edit_calendar
                                    </span>
                                    <span>Modify</span>
                                  </button>
                                  <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={() =>
                                      item.type === "ROOM"
                                        ? handleCancelReservation(item.id)
                                        : item.type === "TABLE"
                                          ? handleCancelTableReservation(
                                              item.id,
                                            )
                                          : handleCancelSpaReservation(item.id)
                                    }
                                    style={{
                                      padding: "4px 10px",
                                      fontSize: "12px",
                                    }}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          <div className="reservation-subtabs">
            <button
              type="button"
              className={`subtab-btn ${resSubTab === "all" ? "active" : ""}`}
              onClick={() => setResSubTab("all")}
            >
              <span className="material-symbols-outlined">dashboard</span>
              <span>All Reservations</span>
              <span className="subtab-count">
                {reservations.length + tableReservations.length}
              </span>
            </button>
            <button
              type="button"
              className={`subtab-btn ${resSubTab === "rooms" ? "active" : ""}`}
              onClick={() => setResSubTab("rooms")}
            >
              <span className="material-symbols-outlined">hotel</span>
              <span>Room Bookings</span>
              <span className="subtab-count">{reservations.length}</span>
            </button>
            <button
              type="button"
              className={`subtab-btn ${resSubTab === "tables" ? "active" : ""}`}
              onClick={() => setResSubTab("tables")}
            >
              <span className="material-symbols-outlined">restaurant</span>
              <span>Dining Reservations</span>
              <span className="subtab-count">{tableReservations.length}</span>
            </button>
            <button
              type="button"
              className={`subtab-btn ${resSubTab === "spa" ? "active" : ""}`}
              onClick={() => setResSubTab("spa")}
            >
              <span className="material-symbols-outlined">spa</span>
              <span>Spa Rituals</span>
              <span className="subtab-count">{spaReservations.length}</span>
            </button>
          </div>

          {(loadingReservations || loadingTableRes || loadingSpaRes) && (
            <div className="catalog-loading-state" style={{ margin: "20px 0" }}>
              <span className="spinner-large" />
              <p>Fetching your reservations...</p>
            </div>
          )}

          {/* Combined Empty State when viewing All and nothing booked */}
          {resSubTab === "all" &&
            !loadingReservations &&
            !loadingTableRes &&
            !loadingSpaRes &&
            reservations.length === 0 &&
            tableReservations.length === 0 &&
            spaReservations.length === 0 && (
              <div
                className="empty-card"
                style={{ padding: "60px 20px", textAlign: "center" }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "48px", color: "var(--muted)" }}
                >
                  event_busy
                </span>
                <h2 style={{ marginTop: "16px" }}>No reservations found</h2>
                <p
                  style={{
                    color: "var(--muted)",
                    maxWidth: "440px",
                    margin: "8px auto 24px",
                  }}
                >
                  You have no active room stays, restaurant table reservations,
                  or spa rituals. Experience our hospitality by booking a suite,
                  reserving an artisanal table, or indulging in a spa treatment.
                </p>
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    justifyContent: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => setActiveTab("book")}
                  >
                    Book a Room
                  </button>
                  <button
                    type="button"
                    className="outline-button"
                    onClick={() => setActiveTab("restaurant")}
                  >
                    Reserve a Table
                  </button>
                  <button
                    type="button"
                    className="outline-button"
                    onClick={() => setActiveTab("spa")}
                  >
                    Reserve a Spa Ritual
                  </button>
                </div>
              </div>
            )}

          {/* Search produced no matches (but reservations do exist) */}
          {resSearchQuery.trim() &&
            !loadingReservations &&
            !loadingTableRes &&
            !loadingSpaRes &&
            searchedRoomReservations.length +
              searchedTableReservations.length +
              searchedSpaReservations.length ===
              0 &&
            reservations.length +
              tableReservations.length +
              spaReservations.length >
              0 && (
              <div
                className="empty-card"
                style={{ padding: "40px 20px", textAlign: "center" }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "42px", color: "var(--muted)" }}
                >
                  search_off
                </span>
                <h3 style={{ marginTop: "12px" }}>
                  No reservations match “{resSearchQuery}”
                </h3>
                <p style={{ color: "var(--muted)" }}>
                  Try a different room number, table, ritual name, status or
                  date.
                </p>
                <button
                  type="button"
                  className="outline-button"
                  onClick={() => setResSearchQuery("")}
                >
                  Clear Search
                </button>
              </div>
            )}

          {/* Room Bookings Table */}
          {(resSubTab === "all" || resSubTab === "rooms") && (
            <div style={{ marginBottom: resSubTab === "all" ? "32px" : "0" }}>
              {resSubTab === "all" && reservations.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "12px",
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ color: "var(--text)" }}
                  >
                    hotel
                  </span>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "18px",
                      color: "var(--text)",
                    }}
                  >
                    Hotel Room Stays ({searchedRoomReservations.length})
                  </h2>
                </div>
              )}

              {resSubTab === "rooms" &&
              !loadingReservations &&
              reservations.length === 0 ? (
                <div
                  className="empty-card"
                  style={{ padding: "60px 20px", textAlign: "center" }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: "48px", color: "var(--muted)" }}
                  >
                    calendar_today
                  </span>
                  <h2 style={{ marginTop: "16px" }}>
                    No room reservations yet
                  </h2>
                  <p
                    style={{
                      color: "var(--muted)",
                      maxWidth: "400px",
                      margin: "8px auto 24px",
                    }}
                  >
                    You have no active or historical room bookings. Search our
                    rooms and reserve your boutique getaway.
                  </p>
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => setActiveTab("book")}
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
                            <th style={{ textAlign: "right" }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {searchedRoomReservations.map((res) => {
                            const canCancel = canCancelReservation(res);
                            const isFuture = isFutureDate(res.checkInDate);

                            return (
                              <tr key={res.id}>
                                <td>
                                  <div className="table-room-cell">
                                    <span className="room-num-badge">
                                      {res.room?.roomNumber || "TBD"}
                                    </span>
                                    <div>
                                      <strong>
                                        {res.room?.roomType || "Boutique"} Room
                                      </strong>
                                      <span className="text-muted-sm">
                                        #{res.id}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <div className="table-date-cell">
                                    <span>
                                      {res.checkInDate} to {res.checkOutDate}
                                    </span>
                                  </div>
                                </td>
                                <td>
                                  <span>{res.numberOfGuests} Guests</span>
                                </td>
                                <td>
                                  <strong className="table-price-text">
                                    $
                                    {res.totalPrice
                                      ? Number(res.totalPrice).toFixed(2)
                                      : "0.00"}
                                  </strong>
                                </td>
                                <td>
                                  <StatusBadge status={res.status} />
                                </td>
                                <td style={{ textAlign: "right" }}>
                                  {canCancel ? (
                                    <button
                                      type="button"
                                      className="table-cancel-btn"
                                      onClick={() =>
                                        handleCancelReservation(res.id)
                                      }
                                    >
                                      <span className="material-symbols-outlined">
                                        cancel
                                      </span>
                                      <span>Cancel Reservation</span>
                                    </button>
                                  ) : (
                                    <span className="action-note">
                                      {res.status === "CANCELLED"
                                        ? "Cancelled"
                                        : res.status === "CHECKED_IN"
                                          ? "Active Stay"
                                          : !isFuture
                                            ? "Past Stay"
                                            : "No action needed"}
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
          {(resSubTab === "all" || resSubTab === "tables") && (
            <div>
              {resSubTab === "all" && tableReservations.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "12px",
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ color: "var(--text)" }}
                  >
                    restaurant
                  </span>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "18px",
                      color: "var(--text)",
                    }}
                  >
                    Dining Table Reservations (
                    {searchedTableReservations.length})
                  </h2>
                </div>
              )}

              {resSubTab === "tables" &&
              !loadingTableRes &&
              tableReservations.length === 0 ? (
                <div
                  className="empty-card"
                  style={{ padding: "60px 20px", textAlign: "center" }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: "48px", color: "var(--muted)" }}
                  >
                    restaurant
                  </span>
                  <h2 style={{ marginTop: "16px" }}>
                    No dining reservations yet
                  </h2>
                  <p
                    style={{
                      color: "var(--muted)",
                      maxWidth: "400px",
                      margin: "8px auto 24px",
                    }}
                  >
                    Enjoy an unforgettable culinary journey at Atelier
                    Restaurant. Reserve a table in the Main Hall, Terrace, or
                    Private Room.
                  </p>
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => setActiveTab("restaurant")}
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
                            <th style={{ textAlign: "right" }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {searchedTableReservations.map((tr) => {
                            const canCancel = ["PENDING", "CONFIRMED"].includes(
                              tr?.status,
                            );
                            return (
                              <tr key={tr.id}>
                                <td>
                                  <div className="table-room-cell">
                                    <span
                                      className="room-num-badge"
                                      style={{ backgroundColor: "var(--text)" }}
                                    >
                                      {tr.restaurantTable?.tableNumber ||
                                        "Table"}
                                    </span>
                                    <div>
                                      <strong>
                                        Table #
                                        {tr.restaurantTable?.tableNumber ||
                                          tr.id}
                                      </strong>
                                      <span className="text-muted-sm">
                                        #{tr.id}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <span className="tag-badge">
                                    {tr.restaurantTable?.area?.replace(
                                      "_",
                                      " ",
                                    ) || "Main Hall"}
                                  </span>
                                </td>
                                <td>
                                  <div>
                                    <strong>{tr.reservationDate}</strong>
                                    <span
                                      className="text-muted-sm"
                                      style={{ display: "block" }}
                                    >
                                      {tr.timeSlot}
                                    </span>
                                  </div>
                                </td>
                                <td>
                                  <span>
                                    {tr.partySize}{" "}
                                    {tr.partySize === 1 ? "Guest" : "Guests"}
                                  </span>
                                </td>
                                <td>
                                  <StatusBadge status={tr.status} />
                                </td>
                                <td>
                                  <span
                                    style={{
                                      color: "var(--muted)",
                                      fontSize: "0.85rem",
                                    }}
                                  >
                                    {tr.specialRequests || "—"}
                                  </span>
                                </td>
                                <td style={{ textAlign: "right" }}>
                                  {canCancel ? (
                                    <button
                                      type="button"
                                      className="table-cancel-btn"
                                      onClick={() =>
                                        handleCancelTableReservation(tr.id)
                                      }
                                    >
                                      <span className="material-symbols-outlined">
                                        cancel
                                      </span>
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
          {/* Spa Ritual Reservations Table — real spa_bookings rows for this guest */}
          {(resSubTab === "all" || resSubTab === "spa") && (
            <div style={{ marginTop: resSubTab === "all" ? "32px" : "0" }}>
              {resSubTab === "all" && spaReservations.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "12px",
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ color: "var(--text)" }}
                  >
                    spa
                  </span>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "18px",
                      color: "var(--text)",
                    }}
                  >
                    Spa Ritual Reservations ({searchedSpaReservations.length})
                  </h2>
                </div>
              )}

              {spaResError && (
                <div
                  className="api-error-panel"
                  role="alert"
                  style={{ marginBottom: "16px" }}
                >
                  <span className="material-symbols-outlined">error</span>
                  <div>
                    <strong>
                      We couldn&apos;t load your spa reservations.
                    </strong>
                    <p>{spaResError}</p>
                  </div>
                  <button
                    type="button"
                    className="outline-button"
                    onClick={loadSpaReservations}
                  >
                    Retry
                  </button>
                </div>
              )}

              {resSubTab === "spa" && loadingSpaRes ? (
                <div
                  className="catalog-loading-state"
                  style={{ margin: "20px 0" }}
                >
                  <span className="spinner-large" />
                  <p>Fetching your spa rituals...</p>
                </div>
              ) : resSubTab === "spa" && spaReservations.length === 0 ? (
                <div
                  className="empty-card"
                  style={{ padding: "60px 20px", textAlign: "center" }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: "48px", color: "var(--muted)" }}
                  >
                    spa
                  </span>
                  <h2 style={{ marginTop: "16px" }}>
                    No spa rituals reserved yet
                  </h2>
                  <p
                    style={{
                      color: "var(--muted)",
                      maxWidth: "420px",
                      margin: "8px auto 24px",
                    }}
                  >
                    Indulge in our botanical sanctuary. Browse the treatment
                    menu and secure your preferred date and arrival time.
                  </p>
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => setActiveTab("spa")}
                  >
                    Reserve a Spa Ritual
                  </button>
                </div>
              ) : (
                spaReservations.length > 0 && (
                  <div className="reservations-table-panel">
                    <div className="table-wrap">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Ritual</th>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Duration</th>
                            <th>Guests</th>
                            <th>Price</th>
                            <th>Status</th>
                            <th>Special Requests</th>
                            <th style={{ textAlign: "right" }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {searchedSpaReservations.map((sb) => {
                            const canCancel = ["PENDING", "CONFIRMED"].includes(
                              sb?.status,
                            );
                            const durationMinutes =
                              sb?.duration ||
                              sb?.spaService?.durationMinutes ||
                              0;
                            return (
                              <tr key={sb.id}>
                                <td>
                                  <div className="table-room-cell">
                                    <span
                                      className="room-num-badge"
                                      style={{
                                        backgroundColor: "var(--accent)",
                                      }}
                                    >
                                      <span
                                        className="material-symbols-outlined"
                                        style={{ fontSize: "16px" }}
                                      >
                                        spa
                                      </span>
                                    </span>
                                    <div>
                                      <strong>
                                        {sb.spaService?.name ||
                                          `Spa ritual #${sb.id}`}
                                      </strong>
                                      <span className="text-muted-sm">
                                        {sb.spaService?.category
                                          ? String(
                                              sb.spaService.category,
                                            ).replace("_", " ")
                                          : `#${sb.id}`}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td>{sb.bookingDate}</td>
                                <td>
                                  <span
                                    className="text-muted-sm"
                                    style={{ display: "block" }}
                                  >
                                    {sb.startTime}
                                  </span>
                                </td>
                                <td>
                                  {durationMinutes
                                    ? `${durationMinutes} min`
                                    : "—"}
                                </td>
                                <td>
                                  <span>
                                    {sb.numberOfGuests}{" "}
                                    {sb.numberOfGuests === 1
                                      ? "Guest"
                                      : "Guests"}
                                  </span>
                                </td>
                                <td>
                                  {sb.totalPrice != null
                                    ? `$${Number(sb.totalPrice).toFixed(2)}`
                                    : "—"}
                                </td>
                                <td>
                                  <StatusBadge status={sb.status} />
                                </td>
                                <td>
                                  <span
                                    style={{
                                      color: "var(--muted)",
                                      fontSize: "0.85rem",
                                    }}
                                  >
                                    {sb.specialRequests || "—"}
                                  </span>
                                </td>
                                <td
                                  style={{
                                    textAlign: "right",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {canCancel && (
                                    <button
                                      type="button"
                                      className="table-cancel-btn"
                                      onClick={() =>
                                        handleCancelSpaReservation(sb.id)
                                      }
                                    >
                                      <span className="material-symbols-outlined">
                                        cancel
                                      </span>
                                      <span>Cancel</span>
                                    </button>
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
      {activeTab === "restaurant" && (
        <main
          style={{
            width: "100%",
            maxWidth: "100%",
            margin: 0,
            padding: 0,
            overflowX: "hidden",
          }}
        >
          <RestaurantPage
            onReservationSuccess={(created) => {
              loadTableReservations();
              setActiveTab("reservations");
              setResSubTab("all");
              setAlertNotice({
                type: "success",
                message: `Table reservation confirmed! You can view your dining details on your reservations page.`,
              });
              setTimeout(() => setAlertNotice(null), 5000);
            }}
          />
        </main>
      )}

      {/* Tab: Spa Sanctuary */}
      {activeTab === "spa" && (
        <main className="client-main-content spa-main">
          <ClientSpaView initialServiceId={pendingSpaServiceId} />
        </main>
      )}

      {/* Tab 3: Profile Tab */}
      {activeTab === "profile" && (
        <main className="client-main-content">
          <div className="reservations-page-header">
            <div>
              <span className="eyebrow" style={{ color: "var(--text)" }}>
                Guest Account
              </span>
              <h1>Profile & Stay Preferences</h1>
              <p>
                Manage your contact information and customize your personalized
                hotel stay preferences.
              </p>
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

      {/* Modify Date / Time panel — submits to the real backend for re-approval */}
      {rescheduleTarget && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: "520px" }}>
            <div className="modal-header">
              <div>
                <span className="eyebrow" style={{ color: "var(--accent)" }}>
                  MODIFY RESERVATION
                </span>
                <h2>{rescheduleTarget.title}</h2>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setRescheduleTarget(null)}
                aria-label="Close"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={submitReschedule} style={{ marginTop: "18px" }}>
              {rescheduleError && (
                <div className="api-error-panel" role="alert">
                  <span className="material-symbols-outlined">error</span>
                  <div>
                    <strong>Change rejected</strong>
                    <p>{rescheduleError}</p>
                  </div>
                </div>
              )}

              {rescheduleTarget.type === "ROOM" && (
                <>
                  <div className="form-group">
                    <label htmlFor="res-checkin">New Check-in Date</label>
                    <input
                      id="res-checkin"
                      type="date"
                      className="field"
                      required
                      value={rescheduleValues.checkInDate || ""}
                      onChange={(e) =>
                        setRescheduleValues((v) => ({
                          ...v,
                          checkInDate: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="res-checkout">New Check-out Date</label>
                    <input
                      id="res-checkout"
                      type="date"
                      className="field"
                      required
                      value={rescheduleValues.checkOutDate || ""}
                      onChange={(e) =>
                        setRescheduleValues((v) => ({
                          ...v,
                          checkOutDate: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="res-guests">Guests</label>
                    <select
                      id="res-guests"
                      className="field"
                      value={rescheduleValues.numberOfGuests || 1}
                      onChange={(e) =>
                        setRescheduleValues((v) => ({
                          ...v,
                          numberOfGuests: e.target.value,
                        }))
                      }
                    >
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <option key={n} value={n}>
                          {n} Guest{n > 1 ? "s" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {rescheduleTarget.type === "TABLE" && (
                <>
                  <div className="form-group">
                    <label htmlFor="res-table-date">New Date</label>
                    <input
                      id="res-table-date"
                      type="date"
                      className="field"
                      required
                      value={rescheduleValues.reservationDate || ""}
                      onChange={(e) =>
                        setRescheduleValues((v) => ({
                          ...v,
                          reservationDate: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="res-table-time">Time Slot</label>
                    <select
                      id="res-table-time"
                      className="field"
                      value={rescheduleValues.timeSlot || "18:00"}
                      onChange={(e) =>
                        setRescheduleValues((v) => ({
                          ...v,
                          timeSlot: e.target.value,
                        }))
                      }
                    >
                      {[
                        "12:00",
                        "12:30",
                        "13:00",
                        "18:00",
                        "18:30",
                        "19:00",
                        "19:30",
                        "20:00",
                      ].map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="res-table-party">Party Size</label>
                    <select
                      id="res-table-party"
                      className="field"
                      value={rescheduleValues.partySize || 2}
                      onChange={(e) =>
                        setRescheduleValues((v) => ({
                          ...v,
                          partySize: e.target.value,
                        }))
                      }
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                        <option key={n} value={n}>
                          {n} Guest{n > 1 ? "s" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {rescheduleTarget.type === "SPA" && (
                <>
                  <div className="form-group">
                    <label htmlFor="res-spa-date">New Date</label>
                    <input
                      id="res-spa-date"
                      type="date"
                      className="field"
                      required
                      value={rescheduleValues.bookingDate || ""}
                      onChange={(e) =>
                        setRescheduleValues((v) => ({
                          ...v,
                          bookingDate: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="res-spa-time">Arrival Time</label>
                    <select
                      id="res-spa-time"
                      className="field"
                      value={rescheduleValues.startTime || "10:30"}
                      onChange={(e) =>
                        setRescheduleValues((v) => ({
                          ...v,
                          startTime: e.target.value,
                        }))
                      }
                    >
                      {[
                        "09:00",
                        "10:30",
                        "12:00",
                        "13:30",
                        "15:00",
                        "16:30",
                        "18:00",
                        "19:30",
                      ].map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="res-spa-guests">Guests</label>
                    <select
                      id="res-spa-guests"
                      className="field"
                      value={rescheduleValues.numberOfGuests || 1}
                      onChange={(e) =>
                        setRescheduleValues((v) => ({
                          ...v,
                          numberOfGuests: e.target.value,
                        }))
                      }
                    >
                      <option value="1">1 Guest</option>
                      <option value="2">2 Guests</option>
                    </select>
                  </div>
                </>
              )}

              <p
                style={{
                  fontSize: "12px",
                  color: "var(--muted)",
                  margin: "4px 0 0",
                }}
              >
                Changing a reservation returns it to <strong>PENDING</strong> so
                our team can re-confirm availability.
              </p>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setRescheduleTarget(null)}
                  disabled={rescheduleSubmitting}
                >
                  Keep Original
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={rescheduleSubmitting}
                >
                  {rescheduleSubmitting ? "Submitting…" : "Submit Change"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDashboard;
