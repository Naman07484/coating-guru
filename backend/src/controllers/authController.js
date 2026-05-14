const db = require('../db');
const jwt = require('jsonwebtoken');

// REGISTER — Name + Phone + Password + OTP verify
exports.register = async (req, res) => {
  const { name, phone, password } = req.body;
  if (!name || !phone || !password) return res.status(400).json({ error: 'Name, phone and password required' });
  try {
    const [existing] = await db.query('SELECT id FROM users WHERE phone=?', [phone]);
    if (existing.length) return res.status(409).json({ error: 'Phone already registered. Please login.' });
    const otp = '1234';
    const expires = new Date(Date.now() + 10 * 60 * 1000);
    await db.query('INSERT INTO users (name, phone, password, otp, otp_expires) VALUES (?,?,?,?,?)', [name, phone, password, otp, expires]);
    console.log(`📱 Registration OTP for ${phone}: ${otp}`);
    res.json({ success: true, message: 'OTP sent for verification' });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
};

// VERIFY OTP — completes registration
exports.verifyOTP = async (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) return res.status(400).json({ error: 'Phone and OTP required' });
  try {
    const [users] = await db.query('SELECT * FROM users WHERE phone=?', [phone]);
    if (!users.length) return res.status(404).json({ error: 'User not found' });
    const user = users[0];
    if (user.otp !== otp) return res.status(401).json({ error: 'Invalid OTP' });
    if (new Date() > new Date(user.otp_expires)) return res.status(401).json({ error: 'OTP expired' });
    await db.query('UPDATE users SET otp=NULL, otp_expires=NULL WHERE phone=?', [phone]);
    const token = jwt.sign({ id: user.id, phone: user.phone }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({
      success: true, token,
      user: { id: user.id, name: user.name, phone: user.phone, vehicle_type: user.vehicle_type, car_model: user.car_model, package_id: user.package_id, address: user.address, email: user.email }
    });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
};

// LOGIN — Phone + Password (no OTP)
exports.login = async (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) return res.status(400).json({ error: 'Phone and password required' });
  try {
    const [users] = await db.query('SELECT * FROM users WHERE phone=?', [phone]);
    if (!users.length) return res.status(404).json({ error: 'User not found. Please register first.' });
    const user = users[0];
    if (user.password !== password) return res.status(401).json({ error: 'Wrong password' });
    const token = jwt.sign({ id: user.id, phone: user.phone }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({
      success: true, token,
      user: { id: user.id, name: user.name, phone: user.phone, vehicle_type: user.vehicle_type, car_model: user.car_model, package_id: user.package_id, address: user.address, email: user.email }
    });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
};

// Send OTP (for re-send during registration)
exports.sendOTP = async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone required' });
  try {
    const otp = '1234';
    const expires = new Date(Date.now() + 10 * 60 * 1000);
    await db.query('UPDATE users SET otp=?, otp_expires=? WHERE phone=?', [otp, expires, phone]);
    res.json({ success: true });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
};

// Update profile
exports.updateProfile = async (req, res) => {
  const { name, vehicle_type, car_model, address, email } = req.body;
  const userId = req.user.id;
  try {
    await db.query('UPDATE users SET name=COALESCE(?,name), vehicle_type=COALESCE(?,vehicle_type), car_model=COALESCE(?,car_model), address=COALESCE(?,address), email=COALESCE(?,email) WHERE id=?',
      [name, vehicle_type, car_model, address, email, userId]);
    res.json({ success: true });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
};