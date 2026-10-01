import axios from "axios";

// VITE_API_URL should be the full base path to the API (no trailing slash).
// For local dev:        http://localhost:8085/api   (or use the Vite proxy: /api)
// For production:       https://your-backend.com/api
const API_BASE_URL = (
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_URL) ||
  "/api"
).replace(/\/+$/, "");

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Guest API
export const guestAPI = {
  register: (guestData) => apiClient.post("/guests/register", guestData),
  login: (email, password) =>
    apiClient.post("/guests/login", null, { params: { email, password } }),
  getAll: () => apiClient.get("/guests"),
  getById: (id) => apiClient.get(`/guests/${id}`),
  getByEmail: (email) => apiClient.get(`/guests/email/${email}`),
  getActive: () => apiClient.get("/guests/active/list"),
  update: (id, guestData) => apiClient.put(`/guests/${id}`, guestData),
  suspend: (id) => apiClient.post(`/guests/${id}/suspend`),
  reactivate: (id) => apiClient.post(`/guests/${id}/reactivate`),
  changePassword: (id, currentPassword, newPassword) =>
    apiClient.post(`/guests/${id}/change-password`, null, {
      params: { currentPassword, newPassword },
    }),
  delete: (id) => apiClient.delete(`/guests/${id}`),
};

// Room API
export const roomAPI = {
  create: (roomData) => apiClient.post("/rooms", roomData),
  getAll: () => apiClient.get("/rooms"),
  getById: (id) => apiClient.get(`/rooms/${id}`),
  getByType: (type) => apiClient.get(`/rooms/type/${type}`),
  getAvailableByType: (type) => apiClient.get(`/rooms/type/${type}/available`),
  getByStatus: (status) => apiClient.get(`/rooms/status/${status}`),
  getAvailable: (checkIn, checkOut, guests) =>
    apiClient.get("/rooms/available", {
      params: { checkIn, checkOut, guests },
    }),
  updateStatus: (id, status) =>
    apiClient.put(`/rooms/${id}/status`, null, { params: { status } }),
  sendMaintenance: (id) => apiClient.post(`/rooms/${id}/maintenance`),
  markAvailable: (id) => apiClient.post(`/rooms/${id}/available`),
};

export const reservationAPI = {
  create: (reservationData) => apiClient.post("/reservations", reservationData),
  getAll: () => apiClient.get("/reservations"),
  getById: (id) => apiClient.get(`/reservations/${id}`),
  getByGuestId: (guestId) => apiClient.get(`/reservations/guest/${guestId}`),
  getByRoomId: (roomId) => apiClient.get(`/reservations/room/${roomId}`),
  /** Admin queue: reservations awaiting approval */
  getPending: () => apiClient.get("/reservations/pending"),
  confirm: (id, actingGuestId) =>
    apiClient.post(`/reservations/${id}/confirm`, null, {
      params: actingGuestId ? { actingGuestId } : {},
    }),
  checkIn: (id) => apiClient.post(`/reservations/${id}/check-in`),
  checkOut: (id) => apiClient.post(`/reservations/${id}/check-out`),
  cancel: (id, actingGuestId) =>
    apiClient.post(`/reservations/${id}/cancel`, null, {
      params: actingGuestId ? { actingGuestId } : {},
    }),
  /** Client reschedules their own stay dates. Resets status to PENDING for re-approval. */
  reschedule: (id, data) => apiClient.put(`/reservations/${id}/reschedule`, data),
  /** Booking desk cleanup: permanently removes a reservation row. */
  delete: (id) => apiClient.delete(`/reservations/${id}`),
};

// Pricing API
export const pricingAPI = {
  getAllBaseRates: () => apiClient.get("/pricing/base-rates"),
  getBasePriceForType: (roomType) =>
    apiClient.get(`/pricing/base-price/${roomType}`),
  getPriceCategory: (price) =>
    apiClient.get(`/pricing/category`, { params: { price } }),
};

// Restaurant Table API
export const restaurantTableAPI = {
  getAll: () => apiClient.get("/restaurant/tables"),
  getById: (id) => apiClient.get(`/restaurant/tables/${id}`),
  getAvailable: (date, timeSlot, partySize) =>
    apiClient.get("/restaurant/tables/available", {
      params: { date, timeSlot, partySize },
    }),
  create: (tableData) => apiClient.post("/restaurant/tables", tableData),
  updateStatus: (id, status) =>
    apiClient.put(`/restaurant/tables/${id}/status`, null, {
      params: { status },
    }),
  delete: (id) => apiClient.delete(`/restaurant/tables/${id}`),
};

// Table Reservation API
export const tableReservationAPI = {
  create: (data) => apiClient.post("/restaurant/reservations", data),
  getAll: () => apiClient.get("/restaurant/reservations"),
  getById: (id) => apiClient.get(`/restaurant/reservations/${id}`),
  getByGuestId: (guestId) =>
    apiClient.get(`/restaurant/reservations/guest/${guestId}`),
  getByDate: (date) => apiClient.get(`/restaurant/reservations/date/${date}`),
  /** Admin queue: table reservations awaiting approval */
  getPending: () => apiClient.get("/restaurant/reservations/pending"),
  confirm: (id) => apiClient.post(`/restaurant/reservations/${id}/confirm`),
  seat: (id) => apiClient.post(`/restaurant/reservations/${id}/seat`),
  complete: (id) => apiClient.post(`/restaurant/reservations/${id}/complete`),
  cancel: (id, actingGuestId) =>
    apiClient.post(`/restaurant/reservations/${id}/cancel`, null, {
      params: actingGuestId ? { actingGuestId } : {},
    }),
  noShow: (id) => apiClient.post(`/restaurant/reservations/${id}/no-show`),
  delete: (id) => apiClient.delete(`/restaurant/reservations/${id}`),
  /** Client reschedules their own table booking. Resets status to PENDING for re-approval. */
  reschedule: (id, data) =>
    apiClient.put(`/restaurant/reservations/${id}/reschedule`, data),
};

// Spa Service API
export const spaServiceAPI = {
  getAll: (activeOnly) => apiClient.get("/spa-services", { params: { activeOnly } }),
  getActive: () => apiClient.get("/spa-services/active"),
  getById: (id) => apiClient.get(`/spa-services/${id}`),
  getByCategory: (category) => apiClient.get(`/spa-services/category/${category}`),
  create: (serviceData) => apiClient.post("/spa-services", serviceData),
  update: (id, serviceData) => apiClient.put(`/spa-services/${id}`, serviceData),
  delete: (id) => apiClient.delete(`/spa-services/${id}`),
  activate: (id) => apiClient.post(`/spa-services/${id}/activate`),
  deactivate: (id) => apiClient.post(`/spa-services/${id}/deactivate`),
};

// Spa Booking API
export const spaBookingAPI = {
  create: (bookingData) => apiClient.post("/spa-bookings", bookingData),
  getAll: () => apiClient.get("/spa-bookings"),
  getById: (id) => apiClient.get(`/spa-bookings/${id}`),
  getByGuestId: (guestId) => apiClient.get(`/spa-bookings/guest/${guestId}`),
  getByDate: (date) => apiClient.get(`/spa-bookings/date/${date}`),
  /** Admin queue: spa bookings awaiting approval */
  getPending: () => apiClient.get("/spa-bookings/pending"),
  confirm: (id) => apiClient.post(`/spa-bookings/${id}/confirm`),
  complete: (id) => apiClient.post(`/spa-bookings/${id}/complete`),
  cancel: (id, actingGuestId) =>
    apiClient.post(`/spa-bookings/${id}/cancel`, null, {
      params: actingGuestId ? { actingGuestId } : {},
    }),
  /** Wellness desk cleanup: permanently removes an appointment row. */
  delete: (id) => apiClient.delete(`/spa-bookings/${id}`),
  /** Client reschedules their own spa appointment. Resets status to PENDING for re-approval. */
  reschedule: (id, data) => apiClient.put(`/spa-bookings/${id}/reschedule`, data),
};

export default apiClient;
