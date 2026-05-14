const db = require('../db');

const BANK_HOLIDAYS = [
  '2026-01-26','2026-03-25','2026-04-14','2026-04-17',
  '2026-08-15','2026-10-02','2026-10-20','2026-11-04','2026-12-25'
];

function isSunday(d){ return new Date(d).getDay() === 0; }
function isHoliday(d){ return BANK_HOLIDAYS.includes(d); }
function isBookable(d){ return !isSunday(d) && !isHoliday(d); }

exports.getLocations = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM locations');
    res.json(rows);
  } catch(e){ res.status(500).json({error:'Server error'}); }
};

exports.getPackages = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM packages');
    res.json(rows);
  } catch(e){ res.status(500).json({error:'Server error'}); }
};

exports.getAvailableSlots = async (req, res) => {
  const { date, location_id } = req.query;
  if (!isBookable(date))
    return res.json({ available: false, reason: 'Closed on this date (Sunday or Holiday)' });

  const allSlots = ['10:00','11:00','12:00','14:00','15:00','16:00','17:00','18:00'];

  try {
    // Get ALL booked slots for this date+location across ALL service types
    const [booked] = await db.query(
      'SELECT time_slot FROM bookings WHERE scheduled_date=? AND location_id=? AND status!="cancelled"',
      [date, location_id]
    );
    const taken = booked.map(b => b.time_slot);
    let available = allSlots.filter(s => !taken.includes(s));

    // If booking for today, filter out past time slots (must be at least 1 hour in the future)
    const now = new Date(); const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    if (date === today) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMin = now.getMinutes();
      available = available.filter(s => {
        const [h] = s.split(':').map(Number);
        // Slot must be at least 1 hour ahead of current time
        return h > currentHour + 1 || (h === currentHour + 1 && currentMin === 0);
      });
    }

    return res.json({ available: true, slots: available, taken });
  } catch(e){ res.status(500).json({error:'Server error'}); }
};

exports.checkWashEligibility = async (req, res) => {
  const userId = req.user.id;
  try {
    // Must have at least one service booking
    const [priorBookings] = await db.query('SELECT id FROM bookings WHERE user_id=? AND service_type="service" LIMIT 1', [userId]);
    if (!priorBookings.length) return res.json({ eligible: false, reason: 'Book a service package first to access free washes' });

    const [locs] = await db.query('SELECT * FROM locations WHERE id=?', [req.query.location_id]);
    if (!locs.length || !locs[0].allows_wash)
      return res.json({ eligible: false, reason: 'Wash not available at this location' });

    const month = new Date().toISOString().slice(0,7);
    const [usage] = await db.query('SELECT * FROM wash_usage WHERE user_id=? AND wash_month=?', [userId, month]);
    const count = usage.length ? usage[0].count : 0;
    if (count >= 2) return res.json({ eligible: false, reason: 'Monthly wash limit reached (2/2)' });
    res.json({ eligible: true, used: count, remaining: 2 - count });
  } catch(e){ res.status(500).json({error:'Server error'}); }
};

exports.createBooking = async (req, res) => {
  const userId = req.user.id;
  const {
    location_id, service_type, package_id, services, vehicle_type,
    vehicle_make, vehicle_model, vehicle_year, vehicle_color, vehicle_regn,
    customer_address, customer_email,
    pre_amount, total_amount, valid_till, payment_mode, warranty,
    scheduled_date, time_slot, notes
  } = req.body;

  if (!isBookable(scheduled_date))
    return res.status(400).json({ error: 'Cannot book on this date (Sunday or Holiday)' });

  try {
    // ── UNIVERSAL slot conflict: one slot booked = occupied for EVERYONE ──
    const [slotConflict] = await db.query(
      'SELECT id FROM bookings WHERE scheduled_date=? AND location_id=? AND time_slot=? AND status!="cancelled"',
      [scheduled_date, location_id, time_slot]
    );
    if (slotConflict.length) return res.status(400).json({ error: 'This time slot is already occupied' });

    // PPF limit
    const svcArr = services || [];
    if (JSON.stringify(svcArr).includes('Paint Protection Film')) {
      const [ppf] = await db.query(
        'SELECT COUNT(*) as c FROM bookings WHERE scheduled_date=? AND location_id=? AND JSON_CONTAINS(services,?) AND status!="cancelled"',
        [scheduled_date, location_id, '"Paint Protection Film (PPF)"']
      );
      if (ppf[0].c >= 1) return res.status(400).json({ error: 'Only 1 PPF booking per day allowed' });
    }

    // Coating limit
    if (service_type === 'service') {
      const [cnt] = await db.query(
        'SELECT COUNT(*) as c FROM bookings WHERE scheduled_date=? AND location_id=? AND service_type="service" AND status!="cancelled"',
        [scheduled_date, location_id]
      );
      if (cnt[0].c >= 4) return res.status(400).json({ error: 'Max 4 service bookings per day' });
    }

    // ── WASH eligibility ──
    if (service_type === 'wash') {
      // Daily wash limit per location: 10
      const [washDayLoc] = await db.query(
        'SELECT COUNT(*) as c FROM bookings WHERE scheduled_date=? AND location_id=? AND service_type="wash" AND status!="cancelled"',
        [scheduled_date, location_id]
      );
      if (washDayLoc[0].c >= 10) return res.status(400).json({ error: 'Max 10 wash slots per day reached at this location' });

      // Daily wash limit per USER: 1
      const [washDayUser] = await db.query(
        'SELECT COUNT(*) as c FROM bookings WHERE scheduled_date=? AND user_id=? AND service_type="wash" AND status!="cancelled"',
        [scheduled_date, userId]
      );
      if (washDayUser[0].c >= 1) return res.status(400).json({ error: 'Only 1 wash appointment allowed per day' });

      // Must have at least one service booking (existing customer)
      const [priorBookings] = await db.query('SELECT id FROM bookings WHERE user_id=? AND service_type="service" LIMIT 1', [userId]);
      if (!priorBookings.length) return res.status(400).json({ error: 'Book a service package first to access free washes' });

      // Monthly limit: 2
      const month = new Date().toISOString().slice(0,7);
      const [usage] = await db.query('SELECT * FROM wash_usage WHERE user_id=? AND wash_month=?', [userId, month]);
      const count = usage.length ? usage[0].count : 0;
      if (count >= 2) return res.status(400).json({ error: 'Monthly wash limit reached (2/month)' });
      if (!usage.length) await db.query('INSERT INTO wash_usage (user_id,wash_month,count) VALUES (?,?,1)', [userId, month]);
      else await db.query('UPDATE wash_usage SET count=count+1 WHERE user_id=? AND wash_month=?', [userId, month]);
    }

    const [result] = await db.query(
      `INSERT INTO bookings
        (user_id,location_id,service_type,package_id,services,vehicle_type,
         vehicle_make,vehicle_model,vehicle_year,vehicle_color,vehicle_regn,
         customer_address,customer_email,pre_amount,total_amount,valid_till,
         payment_mode,warranty,scheduled_date,time_slot,notes)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        userId, location_id, service_type, package_id||null, JSON.stringify(svcArr), vehicle_type,
        vehicle_make||null, vehicle_model||null, vehicle_year||null, vehicle_color||null, vehicle_regn||null,
        customer_address||null, customer_email||null,
        pre_amount||0, total_amount||0, valid_till||null,
        payment_mode||null, warranty||null,
        scheduled_date, time_slot, notes||null
      ]
    );

    const bookingId = result.insertId;
    const jobNo = 'TCG-' + String(bookingId).padStart(3,'0');

    // Update user address/email if provided
    if (customer_address || customer_email) {
      await db.query('UPDATE users SET address=COALESCE(?,address), email=COALESCE(?,email) WHERE id=?',
        [customer_address||null, customer_email||null, userId]);
    }

    console.log(`📱 WhatsApp → 919316668760 (Owner): New booking ${jobNo} — ${scheduled_date} at ${time_slot}`);
    res.json({ success: true, booking_id: bookingId, job_no: jobNo });
  } catch(e){
    console.error(e);
    res.status(500).json({error:'Server error'});
  }
};

exports.getUserBookings = async (req, res) => {
  const userId = req.user.id;
  try {
    const [rows] = await db.query(
      `SELECT b.*,l.name as location_name,p.name as package_name
       FROM bookings b
       LEFT JOIN locations l ON b.location_id=l.id
       LEFT JOIN packages p ON b.package_id=p.id
       WHERE b.user_id=? ORDER BY b.scheduled_date DESC`,
      [userId]
    );
    res.json(rows);
  } catch(e){ res.status(500).json({error:'Server error'}); }
};

exports.getUserNotifications = async (req, res) => {
  const userId = req.user.id;
  try {
    const [rows] = await db.query(
      `SELECT b.id, b.scheduled_date, b.time_slot, b.status,
              l.name as location_name, p.name as package_name, b.service_type
       FROM bookings b
       LEFT JOIN locations l ON b.location_id=l.id
       LEFT JOIN packages p ON b.package_id=p.id
       WHERE b.user_id=? AND b.status NOT IN ('cancelled')
       ORDER BY b.created_at DESC LIMIT 20`,
      [userId]
    );
    res.json(rows);
  } catch(e){ res.status(500).json({error:'Server error'}); }
};

// Get user's last vehicle info for autofill
exports.getLastVehicle = async (req, res) => {
  const userId = req.user.id;
  try {
    const [rows] = await db.query(
      `SELECT vehicle_type, vehicle_make, vehicle_model, vehicle_year, vehicle_color, vehicle_regn, customer_address
       FROM bookings WHERE user_id=? ORDER BY id DESC LIMIT 1`,
      [userId]
    );
    if (rows.length) return res.json(rows[0]);
    res.json(null);
  } catch(e){ res.status(500).json({error:'Server error'}); }
};