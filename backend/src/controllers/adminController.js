const db = require('../db');

exports.getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    const thisMonth = today.slice(0,7);
    const thisYear = today.slice(0,4);

    const [[{totalBookings}]] = await db.query('SELECT COUNT(*) as totalBookings FROM bookings WHERE service_type="service"');
    const [[{todayBookings}]] = await db.query('SELECT COUNT(*) as todayBookings FROM bookings WHERE scheduled_date=? AND service_type="service"',[today]);
    const [[{pendingJobs}]]   = await db.query('SELECT COUNT(*) as pendingJobs FROM bookings WHERE status IN ("pending","confirmed","in_progress") AND service_type="service"');
    const [[{completedToday}]]= await db.query('SELECT COUNT(*) as completedToday FROM bookings WHERE scheduled_date=? AND status="completed" AND service_type="service"',[today]);
    const [[{jobCards}]]      = await db.query('SELECT COUNT(*) as jobCards FROM job_cards');
    const [[{totalWash}]]     = await db.query('SELECT COUNT(*) as totalWash FROM bookings WHERE service_type="wash"');

    const [[carsToday]]     = await db.query('SELECT COUNT(*) as c FROM bookings WHERE scheduled_date=? AND status!="cancelled" AND service_type="service"',[today]);
    const [[carsMonth]]     = await db.query('SELECT COUNT(*) as c FROM bookings WHERE DATE_FORMAT(scheduled_date,"%Y-%m")=? AND status!="cancelled" AND service_type="service"',[thisMonth]);
    const [[carsYear]]      = await db.query('SELECT COUNT(*) as c FROM bookings WHERE YEAR(scheduled_date)=? AND status!="cancelled" AND service_type="service"',[thisYear]);

    // Today's collection (completed today)
    const [[{todayCollection}]] = await db.query(
      'SELECT COALESCE(SUM(total_amount),0) as todayCollection FROM bookings WHERE scheduled_date=? AND status="completed"', [today]
    );
    // Pending payments
    const [[{pendingPayments}]] = await db.query(
      'SELECT COUNT(*) as pendingPayments FROM bookings WHERE status IN ("pending","confirmed","in_progress") AND total_amount > 0 AND service_type="service"'
    );

    // Service distribution counts
    const [[svc]] = await db.query(`
      SELECT
        SUM(CASE WHEN JSON_CONTAINS(services,'"Ceramic Coating"') OR package_id IN (SELECT id FROM packages WHERE name LIKE '%Crystal%' OR name LIKE '%Silver%') THEN 1 ELSE 0 END) as ceramic,
        SUM(CASE WHEN JSON_CONTAINS(services,'"Graphene Coating"') OR package_id IN (SELECT id FROM packages WHERE name LIKE '%Elite%' OR name LIKE '%Ultra%') THEN 1 ELSE 0 END) as graphene,
        SUM(CASE WHEN JSON_CONTAINS(services,'"Paint Protection Film (PPF)"') THEN 1 ELSE 0 END) as ppf,
        SUM(CASE WHEN JSON_CONTAINS(services,'"Car Detailing"') THEN 1 ELSE 0 END) as detailing,
        SUM(CASE WHEN JSON_CONTAINS(services,'"Interior Cleaning"') OR JSON_CONTAINS(services,'"Interior Detailing"') THEN 1 ELSE 0 END) as interior,
        SUM(CASE WHEN JSON_CONTAINS(services,'"Headlight Restoration"') THEN 1 ELSE 0 END) as headlight,
        SUM(CASE WHEN JSON_CONTAINS(services,'"Engine Compartment"') THEN 1 ELSE 0 END) as engine
      FROM bookings WHERE status!="cancelled" AND service_type="service"
    `);

    res.json({
      totalBookings, todayBookings, pendingJobs, completedToday, jobCards, totalWash,
      cars: { today: carsToday.c, thisMonth: carsMonth.c, thisYear: carsYear.c },
      todayCollection, pendingPayments,
      serviceCounts: svc
    });
  } catch(e){ console.error(e); res.status(500).json({error:'Server error'}); }
};

exports.getAllBookings = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT b.*,u.name as customer_name,u.phone as customer_phone,u.address as customer_address,
             l.name as location_name,p.name as package_name,
             (SELECT COUNT(*) FROM job_cards jc WHERE jc.booking_id=b.id) as has_jc
      FROM bookings b
      LEFT JOIN users u ON b.user_id=u.id
      LEFT JOIN locations l ON b.location_id=l.id
      LEFT JOIN packages p ON b.package_id=p.id
      ORDER BY b.scheduled_date DESC
    `);
    res.json(rows);
  } catch(e){ res.status(500).json({error:'Server error'}); }
};

exports.updateBookingStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await db.query('UPDATE bookings SET status=? WHERE id=?', [status, id]);
    res.json({ success: true });
  } catch(e){ res.status(500).json({error:'Server error'}); }
};

exports.createJobCard = async (req, res) => {
  const { booking_id, checklist, car_condition, notes, technician, time_start, time_finish, condition_rating, warranty } = req.body;
  try {
    const [ex] = await db.query('SELECT id FROM job_cards WHERE booking_id=?', [booking_id]);
    if (ex.length) {
      await db.query(
        'UPDATE job_cards SET checklist=?,car_condition=?,notes=?,technician=?,time_start=?,time_finish=?,condition_rating=?,warranty=? WHERE booking_id=?',
        [JSON.stringify(checklist), JSON.stringify(car_condition), notes, technician, time_start, time_finish, condition_rating, warranty||null, booking_id]
      );
    } else {
      await db.query(
        'INSERT INTO job_cards (booking_id,checklist,car_condition,notes,technician,time_start,time_finish,condition_rating,warranty) VALUES (?,?,?,?,?,?,?,?,?)',
        [booking_id, JSON.stringify(checklist), JSON.stringify(car_condition), notes, technician, time_start, time_finish, condition_rating, warranty||null]
      );
    }
    res.json({ success: true });
  } catch(e){ console.error(e); res.status(500).json({error:'Server error'}); }
};

exports.getJobCard = async (req, res) => {
  const { booking_id } = req.params;
  try {
    const [rows] = await db.query(`
      SELECT jc.*,b.vehicle_type,b.vehicle_make,b.vehicle_model,b.vehicle_regn,
             b.scheduled_date,b.services,b.warranty as booking_warranty,b.notes as booking_notes,
             b.total_amount,b.pre_amount,b.payment_mode,b.service_type,b.time_slot,
             b.package_id,b.customer_address,b.customer_email,b.valid_till,
             u.name as customer_name,u.phone as customer_phone,u.address as user_address,
             l.name as location_name,p.name as package_name
      FROM job_cards jc
      LEFT JOIN bookings b ON jc.booking_id=b.id
      LEFT JOIN users u ON b.user_id=u.id
      LEFT JOIN locations l ON b.location_id=l.id
      LEFT JOIN packages p ON b.package_id=p.id
      WHERE jc.booking_id=?
    `, [booking_id]);
    res.json(rows.length ? rows[0] : null);
  } catch(e){ res.status(500).json({error:'Server error'}); }
};

// Get booking details for JC autofill (even before JC exists)
exports.getBookingDetail = async (req, res) => {
  const { booking_id } = req.params;
  try {
    const [rows] = await db.query(`
      SELECT b.*,u.name as customer_name,u.phone as customer_phone,u.address as user_address,
             l.name as location_name,p.name as package_name
      FROM bookings b
      LEFT JOIN users u ON b.user_id=u.id
      LEFT JOIN locations l ON b.location_id=l.id
      LEFT JOIN packages p ON b.package_id=p.id
      WHERE b.id=?
    `, [booking_id]);
    res.json(rows.length ? rows[0] : null);
  } catch(e){ res.status(500).json({error:'Server error'}); }
};

exports.getAllJobCards = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT jc.*,b.vehicle_type,b.vehicle_make,b.vehicle_model,b.vehicle_regn,
             b.scheduled_date,b.services,b.warranty as booking_warranty,b.total_amount,b.payment_mode,
             b.service_type,b.time_slot,b.customer_address,b.package_id,
             u.name as customer_name,u.phone as customer_phone,u.address as user_address,
             l.name as location_name,p.name as package_name
      FROM job_cards jc
      LEFT JOIN bookings b ON jc.booking_id=b.id
      LEFT JOIN users u ON b.user_id=u.id
      LEFT JOIN locations l ON b.location_id=l.id
      LEFT JOIN packages p ON b.package_id=p.id
      ORDER BY jc.created_at DESC
    `);
    res.json(rows);
  } catch(e){ res.status(500).json({error:'Server error'}); }
};

exports.completeJob = async (req, res) => {
  const { booking_id } = req.params;
  try {
    await db.query('UPDATE job_cards SET status="completed" WHERE booking_id=?', [booking_id]);
    await db.query('UPDATE bookings SET status="completed" WHERE id=?', [booking_id]);
    const [rows] = await db.query(
      `SELECT b.*,u.name,u.phone FROM bookings b LEFT JOIN users u ON b.user_id=u.id WHERE b.id=?`,
      [booking_id]
    );
    const b = rows[0] || {};
    const rawPhone = (b.phone||'').replace(/\D/g,'');
    const custPhone = rawPhone.startsWith('91') ? rawPhone : '91'+rawPhone;
    const waMsg = encodeURIComponent(
      `*THE COATING GURU*\n\nDear ${b.name||'Customer'},\n\nYour car has been serviced. Kindly pickup your vehicle at your earliest convenience.\n\nJob No: TCG-${String(booking_id).padStart(3,'0')}\n\nThank you for choosing The Coating Guru!\nContact: 9316668760`
    );
    res.json({ success: true, waUrl: `https://wa.me/${custPhone}?text=${waMsg}`, customerName: b.name, customerPhone: b.phone });
  } catch(e){ res.status(500).json({error:'Server error'}); }
};

exports.notifyCustomer = async (req, res) => {
  const { booking_id } = req.params;
  try {
    const [rows] = await db.query(
      `SELECT b.*,u.name,u.phone FROM bookings b LEFT JOIN users u ON b.user_id=u.id WHERE b.id=?`,
      [booking_id]
    );
    if (!rows.length) return res.status(404).json({error:'Not found'});
    const b = rows[0];
    const jobNo = 'TCG-' + String(booking_id).padStart(3,'0');
    const rawPhone = (b.phone||'').replace(/\D/g,'');
    const custPhone = rawPhone.startsWith('91') ? rawPhone : '91'+rawPhone;
    const msg = encodeURIComponent(
      `*THE COATING GURU*\n\nBooking Confirmation\nJob No: ${jobNo}\nCustomer: ${b.name}\nDate: ${b.scheduled_date}\nTime: ${b.time_slot}\n\nThank you for choosing The Coating Guru!`
    );
    res.json({ success: true, message: `Notification for ${b.name} (${b.phone})`, waUrl: `https://wa.me/${custPhone}?text=${msg}` });
  } catch(e){ res.status(500).json({error:'Server error'}); }
};

exports.getAdminNotifications = async (req, res) => {
  try {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    const tmr = new Date(now.getTime()+86400000);
    const tomorrow = `${tmr.getFullYear()}-${String(tmr.getMonth()+1).padStart(2,'0')}-${String(tmr.getDate()).padStart(2,'0')}`;
    const [todayRows] = await db.query(
      `SELECT b.*,u.name as customer_name,u.phone as customer_phone,l.name as location_name
       FROM bookings b LEFT JOIN users u ON b.user_id=u.id LEFT JOIN locations l ON b.location_id=l.id
       WHERE b.scheduled_date=? AND b.status!="cancelled"`, [today]
    );
    const [tomorrowRows] = await db.query(
      `SELECT b.*,u.name as customer_name,u.phone as customer_phone,l.name as location_name
       FROM bookings b LEFT JOIN users u ON b.user_id=u.id LEFT JOIN locations l ON b.location_id=l.id
       WHERE b.scheduled_date=? AND b.status!="cancelled"`, [tomorrow]
    );
    res.json({ today: todayRows, tomorrow: tomorrowRows });
  } catch(e){ res.status(500).json({error:'Server error'}); }
};

// Today's wash list
exports.getTodayWashList = async (req, res) => {
  try {
    const now = new Date(); const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    const [rows] = await db.query(`
      SELECT b.id, b.time_slot, b.status, b.scheduled_date,
             u.name as customer_name, u.phone as customer_phone,
             l.name as location_name,
             jc.id as jc_id, jc.technician as staff_name
      FROM bookings b
      LEFT JOIN users u ON b.user_id=u.id
      LEFT JOIN locations l ON b.location_id=l.id
      LEFT JOIN job_cards jc ON jc.booking_id=b.id
      WHERE b.scheduled_date=? AND b.service_type='wash' AND b.status!='cancelled'
      ORDER BY b.time_slot ASC
    `, [today]);
    res.json(rows);
  } catch(e){ res.status(500).json({error:'Server error'}); }
};

// Today's service list
exports.getTodayServiceList = async (req, res) => {
  try {
    const now = new Date(); const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    const [rows] = await db.query(`
      SELECT b.id, b.time_slot, b.status, b.scheduled_date, b.vehicle_make, b.vehicle_model,
             b.package_id, b.services,
             u.name as customer_name, u.phone as customer_phone,
             l.name as location_name, p.name as package_name,
             jc.id as jc_id, jc.technician as staff_name
      FROM bookings b
      LEFT JOIN users u ON b.user_id=u.id
      LEFT JOIN locations l ON b.location_id=l.id
      LEFT JOIN packages p ON b.package_id=p.id
      LEFT JOIN job_cards jc ON jc.booking_id=b.id
      WHERE b.scheduled_date=? AND b.service_type='service' AND b.status!='cancelled'
      ORDER BY b.time_slot ASC
    `, [today]);
    res.json(rows);
  } catch(e){ res.status(500).json({error:'Server error'}); }
};