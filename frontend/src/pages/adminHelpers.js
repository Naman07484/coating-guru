import{formatDate,formatTime,INDIVIDUAL_SVC_PRICES}from'./bookingData';

export function downloadSheetPDF(b,user){
  const{jsPDF}=window.jspdf;const doc=new jsPDF();
  const svc=b.package_name||(()=>{let s=[];try{s=JSON.parse(b.services||'[]')}catch{}return s.join(', ');})()||'Custom';
  const jobNo='TCG-'+String(b.id).padStart(3,'0');
  // Parse individual services
  let indivSvcs=[];try{indivSvcs=JSON.parse(b.services||'[]')}catch{}
  // Filter to only individual (non-package) services
  const indivOnly=indivSvcs.filter(s=>INDIVIDUAL_SVC_PRICES[s]);
  const indivTotal=indivOnly.reduce((sum,s)=>sum+(INDIVIDUAL_SVC_PRICES[s]||0),0);

  doc.setFillColor(220,38,38);doc.rect(0,0,210,28,'F');
  doc.setTextColor(255);doc.setFontSize(22);doc.setFont('helvetica','bold');doc.text('THE COATING GURU',14,16);
  doc.setFontSize(10);doc.text('Premium Car Care | Vadodara',14,23);
  doc.setFillColor(17,17,17);doc.rect(0,28,210,12,'F');
  doc.setTextColor(220,38,38);doc.setFontSize(13);doc.text('CUSTOMER SERVICE SHEET',14,37);
  doc.setTextColor(200);doc.setFontSize(10);doc.text(`Job No: ${jobNo}`,160,37);
  let y=52;

  const row=(l,v,hl)=>{
    if(y>265){doc.addPage();y=20;}
    doc.setFillColor(hl?255:240,hl?235:240,hl?235:240);doc.rect(14,y-5,182,9,'F');
    doc.setFont('helvetica','bold');doc.setTextColor(60);doc.setFontSize(10);doc.text(l,16,y);
    doc.setTextColor(hl?220:10,hl?38:10,hl?38:10);doc.setFontSize(11);
    const val=String(v||'-');
    // Truncate long values to fit
    doc.text(val.length>55?val.slice(0,55)+'...':val,80,y);y+=12;
  };

  doc.setTextColor(220,38,38);doc.setFontSize(11);doc.setFont('helvetica','bold');
  doc.text('CUSTOMER',14,y-4);y+=4;
  row('Name',b.customer_name||user?.name||'-');row('Phone',b.customer_phone||user?.phone||'-');
  row('Address',b.customer_address||b.user_address||'-');y+=2;
  doc.setTextColor(220,38,38);doc.text('VEHICLE',14,y-4);y+=4;
  row('Type',b.vehicle_type);row('Make & Model',`${b.vehicle_make||''} ${b.vehicle_model||''}`);
  row('Year',b.vehicle_year);row('Color',b.vehicle_color);row('Registration',b.vehicle_regn||'-');y+=2;
  doc.setTextColor(220,38,38);doc.text('BOOKING',14,y-4);y+=4;
  row('Package/Service',svc);row('Location',b.location_name);
  row('Date',formatDate(b.scheduled_date));row('Time',formatTime(b.time_slot));
  if(b.valid_till)row('Valid Till',formatDate(b.valid_till));

  // Individual services section
  if(indivOnly.length>0){
    y+=2;
    if(y>265){doc.addPage();y=20;}
    doc.setTextColor(220,38,38);doc.setFontSize(11);doc.setFont('helvetica','bold');
    doc.text('INDIVIDUAL SERVICES',14,y-4);y+=4;
    indivOnly.forEach(s=>{
      if(y>265){doc.addPage();y=20;}
      doc.setFillColor(245,245,245);doc.rect(14,y-5,182,9,'F');
      doc.setFont('helvetica','bold');doc.setTextColor(60);doc.setFontSize(10);
      doc.text(`◆ ${s}`,16,y);
      doc.setTextColor(220,38,38);doc.text(`Rs. ${INDIVIDUAL_SVC_PRICES[s]||0}`,160,y);
      y+=12;
    });
    row('Indiv. Services Total',`Rs. ${indivTotal}`);
    y+=2;
  }

  // Payment section
  if(y>240){doc.addPage();y=20;}
  doc.setTextColor(220,38,38);doc.setFontSize(11);doc.setFont('helvetica','bold');
  doc.text('PAYMENT',14,y-4);y+=4;
  row('Pre Amount',b.pre_amount?`Rs. ${b.pre_amount}`:'—');
  row('Total Amount',b.total_amount?`Rs. ${Number(b.total_amount).toFixed(2)}`:'—',true);
  row('Pending',b.total_amount?`Rs. ${Number(b.total_amount)-Number(b.pre_amount||0)}`:'—');
  row('Payment Mode',b.payment_mode||'-');row('Warranty',b.warranty||'-');
  if(b.notes)row('Notes',b.notes);

  // Dynamic footer — place after content with gap
  const footerY=Math.max(y+10,272);
  if(footerY>280){doc.addPage();
    doc.setFillColor(220,38,38);doc.rect(0,272,210,25,'F');
  }else{
    doc.setFillColor(220,38,38);doc.rect(0,footerY,210,25,'F');
  }
  const sigY=footerY>280?283:footerY+11;
  doc.setTextColor(255);doc.setFont('helvetica','bold');doc.setFontSize(10);
  doc.text('Customer Signature: ____________________   Service Advisor: ____________________',14,sigY);
  doc.save(`TCG_Sheet_${jobNo}.pdf`);
}

export function downloadTodayListPDF(title,rows){
  const{jsPDF}=window.jspdf;const doc=new jsPDF('landscape');
  const today=new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'2-digit',year:'numeric'});
  doc.setFillColor(220,38,38);doc.rect(0,0,297,22,'F');
  doc.setTextColor(255);doc.setFontSize(16);doc.setFont('helvetica','bold');
  doc.text(`THE COATING GURU — ${title} (${today})`,10,15);
  let y=32;
  doc.setFillColor(30,30,30);doc.rect(10,y-5,277,10,'F');
  doc.setTextColor(200);doc.setFontSize(10);doc.setFont('helvetica','bold');
  const cols=[{x:12,t:'Ref No'},{x:45,t:'Customer Name'},{x:110,t:'Phone'},{x:155,t:'Staff'},{x:200,t:'Time'},{x:245,t:'Status'}];
  cols.forEach(c=>doc.text(c.t,c.x,y));y+=12;
  doc.setFont('helvetica','bold');doc.setTextColor(40);doc.setFontSize(10);
  rows.forEach(r=>{
    doc.setFillColor(y%24<12?245:235,y%24<12?245:235,y%24<12?245:235);doc.rect(10,y-5,277,10,'F');
    doc.text('TCG-'+String(r.id).padStart(3,'0'),12,y);
    doc.text(r.customer_name||'-',45,y);
    doc.text(r.customer_phone||'-',110,y);
    doc.text(r.staff_name||'-',155,y);
    doc.text(formatTime(r.time_slot)||'-',200,y);
    doc.text((r.status||'pending').replace('_',' '),245,y);
    y+=10;if(y>190){doc.addPage();y=20;}
  });
  doc.save(`TCG_${title.replace(/\s/g,'_')}_${today.replace(/\//g,'-')}.pdf`);
}

export function downloadWashJCpdf(jc){
  const{jsPDF}=window.jspdf;const doc=new jsPDF();
  const jobNo='WJC-'+String(jc.id).padStart(3,'0');
  doc.setFillColor(220,38,38);doc.rect(0,0,210,28,'F');
  doc.setTextColor(255);doc.setFontSize(22);doc.setFont('helvetica','bold');
  doc.text('THE COATING GURU',14,16);
  doc.setFontSize(10);doc.text('WASH JOB CARD',120,12);doc.text(`Job No: ${jobNo}`,120,20);
  let y=42;
  const row=(l,v)=>{if(y>265){doc.addPage();y=20;}doc.setFillColor(245,245,245);doc.rect(14,y-5,182,8,'F');doc.setFont('helvetica','bold');doc.setTextColor(60);doc.setFontSize(10);doc.text(l,16,y);doc.setTextColor(10);doc.setFontSize(11);doc.text(String(v||'-'),80,y);y+=12;};
  row('Customer',jc.customer_name||'-');row('Phone',jc.customer_phone||'-');
  row('Address',jc.customer_address||jc.user_address||'-');
  row('Vehicle',`${jc.vehicle_make||''} ${jc.vehicle_model||''} (${jc.vehicle_type||''})`);
  row('Registration',jc.vehicle_regn||'-');
  row('Package',jc.package_name||'WASHING');row('Location',jc.location_name||'-');
  row('Free Wash #',jc.wash_number||'-');
  row('Date',formatDate(jc.scheduled_date));row('Time',formatTime(jc.time_slot));
  row('Assigned To',jc.technician||'-');
  const footerY=Math.max(y+10,272);
  doc.setFillColor(220,38,38);doc.rect(0,footerY>280?272:footerY,210,25,'F');
  doc.setTextColor(255);doc.setFont('helvetica','bold');doc.setFontSize(10);
  doc.text('Worker Signature: ____________________   Service Advisor: ____________________',14,footerY>280?283:footerY+11);
  doc.save(`TCG_WashJC_${jobNo}.pdf`);
}

export function downloadServiceJCpdf(jc){
  const{jsPDF}=window.jspdf;const doc=new jsPDF();
  const jobNo='JC-'+String(jc.id).padStart(3,'0');
  doc.setFillColor(220,38,38);doc.rect(0,0,210,28,'F');
  doc.setTextColor(255);doc.setFontSize(22);doc.setFont('helvetica','bold');
  doc.text('THE COATING GURU',14,16);
  doc.setFontSize(10);doc.text('SERVICE JOB SHEET',120,12);doc.text(`Job No: ${jobNo}`,120,20);
  let y=42;
  const row=(l,v)=>{if(y>265){doc.addPage();y=20;}doc.setFillColor(245,245,245);doc.rect(14,y-5,182,8,'F');doc.setFont('helvetica','bold');doc.setTextColor(60);doc.setFontSize(10);doc.text(l,16,y);doc.setTextColor(10);doc.setFontSize(11);doc.text(String(v||'-'),80,y);y+=12;};
  row('Booking Ref','TCG-'+String(jc.booking_id).padStart(3,'0'));
  row('Customer',jc.customer_name||'-');row('Phone',jc.customer_phone||'-');
  row('Vehicle',`${jc.vehicle_make||''} ${jc.vehicle_model||''} (${jc.vehicle_type||''})`);
  row('Registration',jc.vehicle_regn||'-');
  row('Technician',jc.technician||'-');
  row('Condition',jc.condition_rating||'-');row('Warranty',jc.warranty||jc.booking_warranty||'-');
  if(jc.notes)row('Notes',jc.notes);y+=6;
  if(y>250){doc.addPage();y=20;}
  doc.setTextColor(220,38,38);doc.setFontSize(12);doc.setFont('helvetica','bold');
  doc.text('SERVICES CHECKLIST',14,y);y+=10;
  let cl=jc.checklist;if(typeof cl==='string')try{cl=JSON.parse(cl)}catch{cl={}}
  Object.entries(cl||{}).filter(([,v])=>v).forEach(([s])=>{
    if(y>265){doc.addPage();y=20;}
    doc.setTextColor(10);doc.setFont('helvetica','bold');doc.setFontSize(11);
    doc.text('✓ '+s,18,y);y+=8;
  });
  const footerY=Math.max(y+10,272);
  if(footerY>280){doc.addPage();
    doc.setFillColor(220,38,38);doc.rect(0,272,210,25,'F');
    doc.setTextColor(255);doc.setFont('helvetica','bold');doc.setFontSize(10);
    doc.text('Technician Signature: ____________________   Service Advisor: ____________________',14,283);
  }else{
    doc.setFillColor(220,38,38);doc.rect(0,footerY,210,25,'F');
    doc.setTextColor(255);doc.setFont('helvetica','bold');doc.setFontSize(10);
    doc.text('Technician Signature: ____________________   Service Advisor: ____________________',14,footerY+11);
  }
  doc.save(`TCG_JobCard_${jobNo}.pdf`);
}
