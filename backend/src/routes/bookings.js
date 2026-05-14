const router = require('express').Router();
const auth = require('../middleware/auth');
const {
  getLocations, getPackages, getAvailableSlots,
  checkWashEligibility, createBooking, getUserBookings, getUserNotifications, getLastVehicle
} = require('../controllers/bookingController');

router.get('/locations', getLocations);
router.get('/packages', getPackages);
router.get('/slots', auth, getAvailableSlots);
router.get('/wash-eligibility', auth, checkWashEligibility);
router.post('/create', auth, createBooking);
router.get('/my-bookings', auth, getUserBookings);
router.get('/my-notifications', auth, getUserNotifications);
router.get('/last-vehicle', auth, getLastVehicle);

module.exports = router;