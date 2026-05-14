const router = require('express').Router();
const {
  getDashboardStats, getAllBookings, updateBookingStatus,
  createJobCard, getJobCard, getAllJobCards, completeJob,
  notifyCustomer, getAdminNotifications, getBookingDetail,
  getTodayWashList, getTodayServiceList
} = require('../controllers/adminController');

router.get('/stats', getDashboardStats);
router.get('/bookings', getAllBookings);
router.put('/bookings/:id/status', updateBookingStatus);
router.post('/job-cards', createJobCard);
router.get('/job-cards', getAllJobCards);
router.get('/job-cards/:booking_id', getJobCard);
router.put('/job-cards/:booking_id/complete', completeJob);
router.post('/bookings/:booking_id/notify', notifyCustomer);
router.get('/notifications', getAdminNotifications);
router.get('/booking-detail/:booking_id', getBookingDetail);
router.get('/today-wash', getTodayWashList);
router.get('/today-services', getTodayServiceList);

module.exports = router;