import{useEffect,useState}from'react';
import{getUserBookings,checkWashEligibility,createBooking,getLocations,getAvailableSlots}from'../api';
import{MONTHS,DAYNAMES,HOLIDAYS,formatDate,formatTime}from'./bookingData';
import{getJsPDF}from'./pdfUtils';

export default function MyBookings(){
const[bookings,setBookings]=useState([]);
const[tab,setTab]=useState('services');
const[loading,setLoading]=useState(true);
const[locs,setLocs]=useState([]);
const user=JSON.parse(localStorage.getItem('user')||'{}');

const[washElig,setWashElig]=useState(null);
const[washLocId,setWashLocId]=useState('');
const[washDate,setWashDate]=useState('');
const[washSlot,setWashSlot]=useState('');
const[washMsg,setWashMsg]=useState('');
const[washLoading,setWashLoading]=useState(false);
const[washSlots,setWashSlots]=useState([]);
const now=new Date();
const[calY,setCalY]=useState(now.getFullYear());
const[calM,setCalM]=useState(now.getMonth());

useEffect(()=>{
  getUserBookings().then(r=>{setBookings(r.data);setLoading(false);}).catch(()=>setLoading(false));
  getLocations().then(r=>setLocs(r.data)).catch(()=>{});
},[]);

const checkWash=(locId)=>{
  setWashLocId(locId);
  checkWashEligibility(locId).then(r=>setWashElig(r.data)).catch(()=>setWashElig({eligible:false,reason:'Error'}));
};

const onWashDateSelect=(iso)=>{
  setWashDate(iso);setWashSlot('');
  getAvailableSlots(iso,washLocId).then(r=>{
    if(r.data.available) setWashSlots(r.data.slots||[]);
    else setWashSlots([]);
  }).catch(()=>setWashSlots([]));
};

const bookWash=async()=>{
  if(!washDate)return setWashMsg('Select a date');
  if(!washSlot)return setWashMsg('Select a time slot');
  setWashLoading(true);setWashMsg('');
  const lastBooking=bookings.find(b=>b.service_type==='service');
  try{
    await createBooking({location_id:washLocId,service_type:'wash',services:['Free Car Wash'],
      vehicle_type:lastBooking?.vehicle_type||'',
      vehicle_make:lastBooking?.vehicle_make||'',vehicle_model:lastBooking?.vehicle_model||'',
      vehicle_year:lastBooking?.vehicle_year||'',vehicle_color:lastBooking?.vehicle_color||'',
      vehicle_regn:lastBooking?.vehicle_regn||'',customer_address:user.address||'',
      scheduled_date:washDate,time_slot:washSlot,notes:'Free wash'});
    setWashMsg('✅ Wash booked!');
    getUserBookings().then(r=>setBookings(r.data));
    checkWash(washLocId);
  }catch(e){setWashMsg(e.response?.data?.error||'Failed');}
  setWashLoading(false);
};

const svcLabel=(b)=>{
  if(b.service_type==='wash') return 'WASHING';
  if(b.package_name) return b.package_name;
  let svcs=[];try{svcs=JSON.parse(b.services||'[]')}catch{}
  return svcs.join(', ')||'Custom';
};

const downloadPDF=async(b)=>{
  let jsPDF;try{jsPDF=await getJsPDF();}catch{alert('PDF library is loading, please try again.');return;}
  const doc=new jsPDF();
  const svc=svcLabel(b);
  const jobNo='TCG-'+String(b.id).padStart(3,'0');
  doc.setFillColor(220,38,38);doc.rect(0,0,210,28,'F');
  doc.setTextColor(255);doc.setFontSize(22);doc.setFont('helvetica','bold');doc.text('THE COATING GURU',14,16);
  doc.setFontSize(10);doc.setFont('helvetica','normal');doc.text('Premium Car Care | Vadodara',14,23);
  doc.setFillColor(17,17,17);doc.rect(0,28,210,12,'F');
  doc.setTextColor(220,38,38);doc.setFontSize(13);doc.setFont('helvetica','bold');doc.text('CUSTOMER BOOKING SHEET',14,37);
  doc.setTextColor(200);doc.setFontSize(10);doc.text(`Job No: ${jobNo}`,160,37);
  let y=52;
  const row=(l,v)=>{doc.setFillColor(240,240,240);doc.rect(14,y-5,182,9,'F');doc.setFont('helvetica','bold');doc.setTextColor(60);doc.setFontSize(10);doc.text(l,16,y);doc.setTextColor(10);doc.setFontSize(11);doc.text(String(v||'-'),80,y);y+=12;};
  row('Customer',user.name||'Customer');row('Phone',user.phone);
  row('Vehicle',`${b.vehicle_make||''} ${b.vehicle_model||''} (${b.vehicle_type})`);
  row('Registration',b.vehicle_regn||'-');row('Package/Service',svc);
  row('Location',b.location_name);row('Date',formatDate(b.scheduled_date));row('Time',formatTime(b.time_slot));
  row('Total',b.total_amount?`Rs. ${b.total_amount}`:'-');
  row('Advance',b.pre_amount?`Rs. ${b.pre_amount}`:'-');
  row('Pending',b.total_amount?`Rs. ${Number(b.total_amount)-Number(b.pre_amount||0)}`:'-');
  row('Payment',b.payment_mode||'-');row('Warranty',b.warranty||'-');
  doc.save(`TCG_${jobNo}.pdf`);
};

const sendWA=(b,target)=>{
  const svc=svcLabel(b);
  const jobNo='TCG-'+String(b.id).padStart(3,'0');
  const msg=`*THE COATING GURU*\n\nBooking: ${jobNo}\nCustomer: ${user.name}\nPhone: ${user.phone}\nService: ${svc}\nDate: ${formatDate(b.scheduled_date)}\nTime: ${formatTime(b.time_slot)}\nLocation: ${b.location_name}\nTotal: Rs.${b.total_amount||'—'}\n\nThank you!`;
  const phone=target==='admin'?'919316668760':'91'+(user.phone||'').replace(/\D/g,'');
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`,'_blank');
};

const badge=s=>{const m={pending:'badge-pending',confirmed:'badge-confirmed',in_progress:'badge-inprogress',completed:'badge-complete'};return<span className={`badge ${m[s]||'badge-pending'}`}>{(s||'pending').replace('_',' ')}</span>;};

const renderCal=()=>{
  const first=new Date(calY,calM,1).getDay();const days=new Date(calY,calM+1,0).getDate();
  const today=new Date();today.setHours(0,0,0,0);const cells=[];
  DAYNAMES.forEach(d=>cells.push(<div key={'h'+d} className="cal-day-name">{d}</div>));
  for(let i=0;i<first;i++)cells.push(<div key={'e'+i} className="cal-day cal-empty"/>);
  for(let d=1;d<=days;d++){
    const dt=new Date(calY,calM,d);const iso=`${calY}-${String(calM+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dis=dt<today||dt.getDay()===0||HOLIDAYS.includes(iso);const sel=washDate===iso;
    cells.push(<div key={d} className={`cal-day${dis?' cal-disabled':''}${sel?' cal-selected':''}`}
      onClick={()=>{if(!dis)onWashDateSelect(iso);}}>{d}</div>);
  }
  return cells;
};

if(loading)return<div style={{padding:80,textAlign:'center',color:'var(--gray)'}}>Loading...</div>;

const serviceBookings=bookings.filter(b=>b.service_type!=='wash');
const washBookings=bookings.filter(b=>b.service_type==='wash');
const total=serviceBookings.length;const upcoming=serviceBookings.filter(b=>b.status!=='completed').length;
const complete=serviceBookings.filter(b=>b.status==='completed').length;

const BookingCard=({b})=>{
  return(<div className="card" style={{marginBottom:10}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:6,marginBottom:8}}>
      <span style={{fontFamily:'var(--font-display)',fontSize:18,color:'var(--red)'}}>TCG-{String(b.id).padStart(3,'0')}</span>
      {badge(b.status)}
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,fontSize:14,marginBottom:8}}>
      <div><span style={{color:'var(--gray)'}}>Date: </span>{formatDate(b.scheduled_date)}</div>
      <div><span style={{color:'var(--gray)'}}>Time: </span>{formatTime(b.time_slot)}</div>
      <div><span style={{color:'var(--gray)'}}>Type: </span>{b.service_type==='wash'?'🚿 Wash':'🛡️ Service'}</div>
      <div><span style={{color:'var(--gray)'}}>Package: </span>{svcLabel(b)}</div>
      <div><span style={{color:'var(--gray)'}}>Vehicle: </span>{b.vehicle_make} {b.vehicle_model}</div>
      <div><span style={{color:'var(--gray)'}}>Location: </span>{b.location_name}</div>
    </div>
    <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
      {b.service_type!=='wash'&&<button className="btn-ghost btn-sm" onClick={()=>downloadPDF(b)}>📄 PDF</button>}
      <button className="btn-green btn-sm" onClick={()=>sendWA(b,'admin')}>📱 WhatsApp</button>
    </div>
  </div>);
};

return(
<div className="page-wrap-wide" style={{paddingTop:70}}>
  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24,flexWrap:'wrap',gap:10}}>
    <div><div style={{fontFamily:'var(--font-display)',fontSize:30,letterSpacing:2}}>MY <span style={{color:'var(--red)'}}>BOOKINGS</span></div>
    <p style={{color:'var(--gray)',fontSize:13}}>{user.name} · {user.phone}</p></div>
    <button className="btn-red" onClick={()=>window.location.href='/customer/book'}>+ NEW BOOKING</button>
  </div>
  <div className="stats-row">
    <div className="db-stat"><div className="db-stat-num">{total}</div><div className="db-stat-label">Services</div></div>
    <div className="db-stat"><div className="db-stat-num">{washBookings.length}</div><div className="db-stat-label">Washes</div></div>
    <div className="db-stat"><div className="db-stat-num">{upcoming}</div><div className="db-stat-label">Upcoming</div></div>
    <div className="db-stat"><div className="db-stat-num">{complete}</div><div className="db-stat-label">Completed</div></div>
  </div>
  <div className="tabs">
    {['services','washing','pdfs','wash'].map(t=>(<button key={t} className={`tab${tab===t?' active':''}`} onClick={()=>setTab(t)}>
      {t==='services'?`🛡️ Services (${serviceBookings.length})`:t==='washing'?`🚿 Washing (${washBookings.length})`:t==='pdfs'?'📄 My PDFs':'🚗 Free Wash'}
    </button>))}
  </div>

  {tab==='services'&&(<div>
    {serviceBookings.length===0?<p style={{color:'var(--gray)',textAlign:'center',padding:32}}>No service bookings yet</p>:
    serviceBookings.map(b=><BookingCard key={b.id} b={b}/>)}
  </div>)}

  {tab==='washing'&&(<div>
    {washBookings.length===0?<p style={{color:'var(--gray)',textAlign:'center',padding:32}}>No wash bookings yet</p>:
    washBookings.map(b=><BookingCard key={b.id} b={b}/>)}
  </div>)}

  {tab==='pdfs'&&(<div style={{display:'grid',gap:10}}>
    {serviceBookings.length===0?<p style={{color:'var(--gray)',textAlign:'center',padding:32}}>No PDFs</p>:
    serviceBookings.map(b=>{const jobNo='TCG-'+String(b.id).padStart(3,'0');
      return(<div key={b.id} className="card" style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10}}>
        <div><div style={{fontFamily:'var(--font-display)',fontSize:16}}>{jobNo} — {svcLabel(b)}</div>
        <div style={{fontSize:12,color:'var(--gray)'}}>{formatDate(b.scheduled_date)} · {b.location_name}</div></div>
        <div style={{display:'flex',gap:6}}>
          <button className="btn-outline btn-sm" onClick={()=>downloadPDF(b)}>DOWNLOAD</button>
          <button className="btn-green btn-sm" onClick={()=>sendWA(b,'admin')}>📱 WA</button>
        </div></div>);})}
  </div>)}

  {tab==='wash'&&(<div>
    <h3 style={{fontFamily:'var(--font-display)',fontSize:20,marginBottom:12}}>FREE <span style={{color:'var(--red)'}}>WASH</span> BOOKING</h3>
    {serviceBookings.length===0?(
      <div className="card" style={{textAlign:'center',padding:32}}><p style={{color:'var(--gray)'}}>⚠ You need to book a service package first to access free washes.</p></div>
    ):(<>
      <div className="field"><label className="field-label">Select Location</label>
        <select value={washLocId} onChange={e=>checkWash(e.target.value)}>
          <option value="">Select</option>{locs.filter(l=>l.allows_wash).map(l=><option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </div>
      {washElig&&!washElig.eligible&&<div style={{background:'rgba(245,158,11,.1)',border:'1px solid rgba(245,158,11,.3)',padding:'12px',borderRadius:2,color:'#F59E0B',fontSize:14,marginBottom:12}}>⚠ {washElig.reason}</div>}
      {washElig&&washElig.eligible&&(<>
        <div style={{background:'rgba(16,185,129,.1)',border:'1px solid rgba(16,185,129,.3)',padding:'12px',borderRadius:2,color:'#10B981',fontSize:14,marginBottom:12}}>✅ {washElig.remaining} free wash(es) remaining this month ({washElig.used}/2 used)</div>
        <div className="cal-wrap" style={{marginBottom:12}}>
          <div className="cal-nav">
            <button className="cal-nav-btn" onClick={()=>{let m=calM-1,y=calY;if(m<0){m=11;y--;}setCalM(m);setCalY(y);}}>‹</button>
            <div className="cal-title">{MONTHS[calM]} {calY}</div>
            <button className="cal-nav-btn" onClick={()=>{let m=calM+1,y=calY;if(m>11){m=0;y++;}setCalM(m);setCalY(y);}}>›</button>
          </div>
          <div className="cal-grid">{renderCal()}</div>
        </div>
        {washDate&&<div style={{marginBottom:12}}><label className="field-label">Select Time Slot</label>
          {washSlots.length===0?<p style={{color:'var(--gray)',fontSize:13,marginTop:6}}>No slots available</p>:
          <div className="tick-grid" style={{marginTop:6}}>{washSlots.map(s=>(<div key={s} className={`tick-item${washSlot===s?' ticked':''}`} onClick={()=>setWashSlot(s)}>
            <input type="radio" checked={washSlot===s} readOnly/><label style={{fontSize:13}}>{formatTime(s)}</label></div>))}</div>}
        </div>}
        {washMsg&&<div style={{color:washMsg.startsWith('✅')?'#10B981':'var(--red)',fontSize:13,marginBottom:8}}>{washMsg}</div>}
        <button className="btn-red" onClick={bookWash} disabled={washLoading||washElig.remaining<=0}>
          {washElig.remaining<=0?'FREE WASH OVER — COME NEXT MONTH':washLoading?'BOOKING...':'BOOK FREE WASH'}
        </button>
      </>)}
    </>)}
  </div>)}
</div>);
}
