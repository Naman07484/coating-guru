import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:5000/api' });

API.interceptors.request.use(cfg => {
  const t = localStorage.getItem('token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

// Auth
export const registerUser  = (data) => API.post('/auth/register', data);
export const loginUser     = (phone, password) => API.post('/auth/login', { phone, password });
export const sendOTP       = (phone) => API.post('/auth/send-otp', { phone });
export const verifyOTP     = (phone, otp) => API.post('/auth/verify-otp', { phone, otp });
export const updateProfile = (data) => API.put('/auth/profile', data);

// Bookings
export const getLocations        = () => API.get('/bookings/locations');
export const getPackages         = () => API.get('/bookings/packages');
export const getAvailableSlots   = (date, location_id) =>
  API.get(`/bookings/slots?date=${date}&location_id=${location_id}`);
export const checkWashEligibility = (location_id) =>
  API.get(`/bookings/wash-eligibility?location_id=${location_id}`);
export const createBooking       = (data) => API.post('/bookings/create', data);
export const getUserBookings     = () => API.get('/bookings/my-bookings');
export const getUserNotifications = () => API.get('/bookings/my-notifications');
export const getLastVehicle      = () => API.get('/bookings/last-vehicle');

// Admin
export const getAdminStats       = () => API.get('/admin/stats');
export const getAllBookings       = () => API.get('/admin/bookings');
export const updateBookingStatus = (id, status) => API.put(`/admin/bookings/${id}/status`, { status });
export const createJobCard       = (data) => API.post('/admin/job-cards', data);
export const getJobCard          = (bid) => API.get(`/admin/job-cards/${bid}`);
export const getAllJobCards       = () => API.get('/admin/job-cards');
export const completeJob         = (bid) => API.put(`/admin/job-cards/${bid}/complete`);
export const notifyCustomer      = (bid) => API.post(`/admin/bookings/${bid}/notify`);
export const getAdminNotifications = () => API.get('/admin/notifications');
export const getBookingDetail    = (bid) => API.get(`/admin/booking-detail/${bid}`);
export const getTodayWashList    = () => API.get('/admin/today-wash');
export const getTodayServiceList = () => API.get('/admin/today-services');
