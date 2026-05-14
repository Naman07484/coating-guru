const cron = require('node-cron');
const db = require('../db');

function startCronJobs() {
  // Run daily at 8:00 AM
  cron.schedule('0 8 * * *', async () => {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().slice(0, 10);
      const today = new Date().toISOString().slice(0, 10);

      // Tomorrow's bookings
      const [tomorrowBookings] = await db.query(
        `SELECT b.*, u.name, u.phone, l.name as location_name
         FROM bookings b
         LEFT JOIN users u ON b.user_id = u.id
         LEFT JOIN locations l ON b.location_id = l.id
         WHERE b.scheduled_date = ? AND b.status != 'cancelled'`,
        [tomorrowStr]
      );

      // Today's bookings
      const [todayBookings] = await db.query(
        `SELECT b.*, u.name, u.phone, l.name as location_name
         FROM bookings b
         LEFT JOIN users u ON b.user_id = u.id
         LEFT JOIN locations l ON b.location_id = l.id
         WHERE b.scheduled_date = ? AND b.status != 'cancelled'`,
        [today]
      );

      // Customer reminders for tomorrow
      tomorrowBookings.forEach(b => {
        const type = b.service_type === 'wash' ? 'car wash' : 'service';
        console.log(`📱 WhatsApp → ${b.phone} (${b.name}): Your ${type} is scheduled TOMORROW at ${b.time_slot} at ${b.location_name}. — The Coating Guru`);
      });

      // Admin summary for tomorrow
      const washCount = tomorrowBookings.filter(b => b.service_type === 'wash').length;
      const serviceCount = tomorrowBookings.filter(b => b.service_type === 'service').length;
      console.log(`📱 WhatsApp → +919316668760 (Admin): Tomorrow (${tomorrowStr}) — ${washCount} wash(es), ${serviceCount} service(s). Total: ${tomorrowBookings.length} cars.`);

      // Same-day reminders
      todayBookings.forEach(b => {
        const type = b.service_type === 'wash' ? 'car wash' : 'service';
        console.log(`📱 WhatsApp → ${b.phone} (${b.name}): Reminder — Your ${type} is TODAY at ${b.time_slot} at ${b.location_name}. — The Coating Guru`);
      });

      console.log(`📱 WhatsApp → +919316668760 (Admin): Today (${today}) — ${todayBookings.length} car(s) scheduled.`);

    } catch (err) {
      console.error('Cron job error:', err);
    }
  });

  console.log('⏰ Cron jobs started — daily reminders at 8:00 AM');
}

module.exports = { startCronJobs };
