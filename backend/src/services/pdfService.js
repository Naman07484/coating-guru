const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const PDF_DIR = path.join(__dirname, '../../pdfs');
if (!fs.existsSync(PDF_DIR)) {
  fs.mkdirSync(PDF_DIR, { recursive: true });
}

function drawLabel(doc, label, value, y) {
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#888888')
    .text(label, 50, y, { width: 140, lineBreak: false });
  doc.font('Helvetica').fontSize(10).fillColor('#333333')
    .text(String(value || '—'), 195, y, { width: 350 });
}

exports.generateBookingPDF = (data) => {
  return new Promise((resolve, reject) => {
    const fileName = `booking_${data.booking_id}_${Date.now()}.pdf`;
    const filePath = path.join(PDF_DIR, fileName);
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Header bar
    doc.rect(0, 0, 612, 80).fill('#e63946');
    doc.font('Helvetica-Bold').fontSize(22).fillColor('#ffffff')
      .text('THE COATING GURU', 0, 22, { width: 612, align: 'center' });
    doc.font('Helvetica').fontSize(9).fillColor('#ffcccc')
      .text('Premium Auto Detailing Studio', 0, 50, { width: 612, align: 'center' });

    // Title
    let y = 100;
    doc.font('Helvetica-Bold').fontSize(15).fillColor('#e63946')
      .text('BOOKING CONFIRMATION', 50, y);
    y += 28;
    doc.moveTo(50, y).lineTo(562, y).lineWidth(0.5).stroke('#dddddd');
    y += 18;

    // Details
    const rows = [
      ['Booking ID', `#${data.booking_id}`],
      ['Customer Name', data.customer_name],
      ['Phone Number', data.phone],
      ['Car Type', data.vehicle_type],
      ['Package', data.package_name || 'None'],
      ['Location', data.location_name],
      ['Scheduled Date', data.scheduled_date],
      ['Time Slot', data.time_slot],
    ];

    rows.forEach(([label, value]) => {
      drawLabel(doc, label, value, y);
      y += 22;
    });

    // Services
    const services = data.services || [];
    if (services.length > 0) {
      y += 10;
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#888888')
        .text('Selected Services:', 50, y);
      y += 18;
      services.forEach(s => {
        doc.font('Helvetica').fontSize(10).fillColor('#333333')
          .text(`•  ${s}`, 65, y, { width: 480 });
        y += 16;
      });
    }

    // Notes
    if (data.notes) {
      y += 10;
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#888888')
        .text('Notes:', 50, y);
      y += 18;
      doc.font('Helvetica').fontSize(10).fillColor('#333333')
        .text(data.notes, 65, y, { width: 480 });
    }

    // Footer
    doc.font('Helvetica').fontSize(8).fillColor('#999999')
      .text('PDF sent to owner: 9316668760', 50, 740, { width: 512, align: 'center' });
    doc.font('Helvetica').fontSize(8).fillColor('#bbbbbb')
      .text('The Coating Guru • Vadodara', 50, 755, { width: 512, align: 'center' });

    doc.end();
    stream.on('finish', () => resolve({ filePath, fileName }));
    stream.on('error', reject);
  });
};

exports.generateJobCardPDF = (data) => {
  return new Promise((resolve, reject) => {
    const fileName = `jobcard_${data.booking_id}_${Date.now()}.pdf`;
    const filePath = path.join(PDF_DIR, fileName);
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Header
    doc.rect(0, 0, 612, 80).fill('#e63946');
    doc.font('Helvetica-Bold').fontSize(22).fillColor('#ffffff')
      .text('THE COATING GURU', 0, 22, { width: 612, align: 'center' });
    doc.font('Helvetica').fontSize(9).fillColor('#ffcccc')
      .text('JOB CARD', 0, 50, { width: 612, align: 'center' });

    let y = 100;
    doc.font('Helvetica-Bold').fontSize(15).fillColor('#e63946')
      .text('JOB CARD REPORT', 50, y);
    y += 28;
    doc.moveTo(50, y).lineTo(562, y).lineWidth(0.5).stroke('#dddddd');
    y += 18;

    // Customer info
    const info = [
      ['Booking ID', `#${data.booking_id}`],
      ['Customer', data.customer_name],
      ['Phone', data.customer_phone],
      ['Vehicle', data.vehicle_type],
      ['Date', data.scheduled_date],
      ['Status', data.status === 'completed' ? 'COMPLETED' : 'OPEN'],
    ];
    info.forEach(([label, value]) => {
      drawLabel(doc, label, value, y);
      y += 22;
    });

    // Checklist
    y += 10;
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#e63946')
      .text('Service Checklist:', 50, y);
    y += 18;
    const checklist = data.checklist || {};
    Object.entries(checklist).forEach(([item, done]) => {
      const mark = done ? '☑' : '☐';
      doc.font('Helvetica').fontSize(10).fillColor('#333333')
        .text(`${mark}  ${item}`, 65, y, { width: 480 });
      y += 16;
    });

    // Car condition
    y += 10;
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#e63946')
      .text('Car Condition:', 50, y);
    y += 18;
    const condition = data.car_condition || {};
    Object.entries(condition).forEach(([item, checked]) => {
      const mark = checked ? '☑' : '☐';
      doc.font('Helvetica').fontSize(10).fillColor('#333333')
        .text(`${mark}  ${item}`, 65, y, { width: 480 });
      y += 16;
    });

    // Notes
    if (data.notes) {
      y += 10;
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#888888')
        .text('Notes:', 50, y);
      y += 16;
      doc.font('Helvetica').fontSize(10).fillColor('#333333')
        .text(data.notes, 65, y, { width: 480 });
    }

    // Footer
    doc.font('Helvetica').fontSize(8).fillColor('#999999')
      .text('The Coating Guru • Vadodara', 50, 755, { width: 512, align: 'center' });

    doc.end();
    stream.on('finish', () => resolve({ filePath, fileName }));
    stream.on('error', reject);
  });
};
