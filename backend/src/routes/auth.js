const router = require('express').Router();
const { register, login, sendOTP, verifyOTP, updateProfile } = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.put('/profile', auth, updateProfile);

module.exports = router;