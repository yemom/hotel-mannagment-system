import axios from "axios";

const API_BASE_URL =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_URL) ||
  (typeof process !== "undefined" &&
    process.env &&
    (process.env.REACT_APP_API_URL || process.env.VITE_API_URL)) ||
  "http://localhost:8085/api/api";

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

// Reservation API
export const reservationAPI = {
  create: (reservationData) => apiClient.post("/reservations", reservationData),
  getAll: () => apiClient.get("/reservations"),
  getById: (id) => apiClient.get(`/reservations/${id}`),
  getByGuestId: (guestId) => apiClient.get(`/reservations/guest/${guestId}`),
  getByRoomId: (roomId) => apiClient.get(`/reservations/room/${roomId}`),
  getById: (id) => apiClient.get(`/reservations/${id}`),
  getByGuestId: (guestId) => apiClient.get(`/reservations/guest/${guestId}`),
  getByRoomId: (roomId) => apiClient.get(`/reservations/room/${roomId}`),
  confirm: (id) => apiClient.post(`/reservations/${id}/confirm`),
  checkIn: (id) => apiClient.post(`/reservations/${id}/check-in`),
  checkOut: (id) => apiClient.post(`/reservations/${id}/check-out`),
  cancel: (id) => apiClient.post(`/reservations/${id}/cancel`),
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
  confirm: (id) => apiClient.post(`/restaurant/reservations/${id}/confirm`),
  seat: (id) => apiClient.post(`/restaurant/reservations/${id}/seat`),
  complete: (id) => apiClient.post(`/restaurant/reservations/${id}/complete`),
  cancel: (id) => apiClient.post(`/restaurant/reservations/${id}/cancel`),
  noShow: (id) => apiClient.post(`/restaurant/reservations/${id}/no-show`),
  delete: (id) => apiClient.delete(`/restaurant/reservations/${id}`),
};

export default apiClient;
