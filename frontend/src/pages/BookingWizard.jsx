import{useState,useEffect}from'react';
import{getLocations,getPackages,getAvailableSlots,createBooking,getLastVehicle}from'../api';
import{useNavigate}from'react-router-dom';
import{HOLIDAYS,MONTHS,DAYNAMES,VTYPES,BRANDS,COLORS,YEARS,PAYMENTS,WARRANTIES,INDIVIDUAL_SVCS,INDIVIDUAL_SVC_PRICES,getPriceKey,warrantyFromPkg,validTillFromPkg,formatDate,formatTime}from'./bookingData';

export default function BookingWizard(){
const nav=useNavigate();
const user=JSON.parse(localStorage.getItem('user')||'{}');
const[step,setStep]=useState(1);
const[locs,setLocs]=useState([]);
const[pkgs,setPkgs]=useState([]);
const[err,setErr]=useState('');
const[loading,setLoading]=useState(false);
const[done,setDone]=useState(false);
const[jobNo,setJobNo]=useState('');
const[washInfo,setWashInfo]=useState(null);
const[availSlots,setAvailSlots]=useState([]);
const now=new Date();
const[calY,setCalY]=useState(now.getFullYear());
const[calM,setCalM]=useState(now.getMonth());

const[f,setF]=useState({
  location_id:'',location_name:'',package_id:'',selectedPkg:null,services:[],
  custName:user.name||'',custPhone:user.phone||'',custAddress:user.address||'',custEmail:user.email||'',
  vehicle_type:'',vehicle_make:'',vehicle_model:'',vehicle_year:'',vehicle_color:'',
  regnState:'GJ',regnDist:'06',regnAlpha:'XX',regnNum:'',
  bookingDate:now.toISOString().slice(0,10),validTill:'',
  pre_amount:'',total_amount:'',pending_amount:'',
  payment_mode:'',warranty:'',
  scheduled_date:'',scheduleDisplay:'',time_slot:'',notes:'',service_type:'service'
});

useEffect(()=>{getLocations().then(r=>setLocs(r.data));getPackages().then(r=>setPkgs(r.data));
  // Autofill vehicle from last booking
  getLastVehicle().then(r=>{if(r.data){const v=r.data;
    setF(p=>({...p,vehicle_type:v.vehicle_type||p.vehicle_type,vehicle_make:v.vehicle_make||p.vehicle_make,
      vehicle_model:v.vehicle_model||p.vehicle_model,vehicle_year:v.vehicle_year||p.vehicle_year,
      vehicle_color:v.vehicle_color||p.vehicle_color,
      custAddress:v.customer_address||p.custAddress,
      regnState:(v.vehicle_regn||'').split(' ')[0]||p.regnState,
      regnDist:(v.vehicle_regn||'').split(' ')[1]||p.regnDist,
      regnAlpha:(v.vehicle_regn||'').split(' ')[2]||p.regnAlpha,
      regnNum:(v.vehicle_regn||'').split(' ')[3]||p.regnNum
    }));
  }}).catch(()=>{});
},[]);

const set=(k,v)=>setF(p=>({...p,[k]:v}));

// Helper: calc individual services total from a services array
const svcTotal=(svcs)=>svcs.reduce((s,svc)=>s+(INDIVIDUAL_SVC_PRICES[svc]||0),0);

const togSvc=s=>setF(p=>{
  const newSvcs=p.services.includes(s)?p.services.filter(x=>x!==s):[...p.services,s];
  const pkgPrice=p.selectedPkg?(p.selectedPkg[getPriceKey(p.vehicle_type)]||0):0;
  const grand=pkgPrice+svcTotal(newSvcs);
  const pre=Number(p.pre_amount||0);
  return{...p,services:newSvcs,total_amount:grand?String(grand):p.total_amount,pending_amount:grand?String(grand-pre):p.pending_amount};
});

const regn=()=>`${f.regnState.toUpperCase()} ${f.regnDist} ${f.regnAlpha.toUpperCase()} ${f.regnNum}`;

const selectPkg=(pkg)=>{
  const isSelected=f.package_id===pkg.id;
  const newPkg=isSelected?null:pkg;
  const priceKey=getPriceKey(f.vehicle_type);
  const pkgPrice=newPkg?newPkg[priceKey]||0:0;
  const indivTotal=svcTotal(f.services);
  const grand=pkgPrice+indivTotal;
  const war=newPkg?warrantyFromPkg(newPkg):'';
  const vt=newPkg?validTillFromPkg(f.bookingDate,newPkg):'';
  const pre=f.pre_amount||0;
  setF(p=>({...p,package_id:isSelected?'':pkg.id,selectedPkg:newPkg,
    total_amount:grand?String(grand):'',warranty:war,validTill:vt,
    pending_amount:grand?String(grand-Number(pre)):''}));
};

const onVehicleTypeChange=(vt)=>{
  const priceKey=getPriceKey(vt);
  const pkgPrice=f.selectedPkg?f.selectedPkg[priceKey]||0:0;
  const indivTotal=svcTotal(f.services);
  const grand=pkgPrice+indivTotal;
  const pre=f.pre_amount||0;
  setF(p=>({...p,vehicle_type:vt,total_amount:grand?String(grand):p.total_amount,
    pending_amount:grand?String(grand-Number(pre)):p.pending_amount}));
};

const onPreAmountChange=(v)=>{
  const total=Number(f.total_amount)||0;
  setF(p=>({...p,pre_amount:v,pending_amount:String(total-Number(v||0))}));
};

const goStep=(n)=>{
  setErr('');
  if(n===2&&!f.location_id)return setErr('Select a location');
  if(n===3){if(!f.package_id&&f.services.length===0)return setErr('Choose a package or service');}
  if(n===4){
    if(!f.custName.trim())return setErr('Name required');
    if(!f.custAddress.trim())return setErr('Address required');
    if(!f.vehicle_type)return setErr('Vehicle type required');
    if(!f.vehicle_make)return setErr('Vehicle make required');
    if(!f.vehicle_model.trim())return setErr('Vehicle model required');
    if(!f.vehicle_year)return setErr('Vehicle year required');
    if(!f.vehicle_color)return setErr('Vehicle color required');
    if(!f.regnNum||f.regnNum.length!==4)return setErr('Enter 4-digit registration');
    if(!f.total_amount)return setErr('Total amount required');
    if(!f.payment_mode)return setErr('Select payment mode');
  }
  setStep(n);
};

// Load available slots when date is selected
const onDateSelect=(iso,display)=>{
  set('scheduled_date',iso);
  set('scheduleDisplay',display);
  set('time_slot','');
  getAvailableSlots(iso,f.location_id).then(r=>{
    if(r.data.available) setAvailSlots(r.data.slots||[]);
    else{setAvailSlots([]);setErr(r.data.reason||'No slots');}
  }).catch(()=>setAvailSlots([]));
};

const confirmBooking=async()=>{
  if(!f.scheduleDisplay)return setErr('Select a date');
  if(!f.time_slot)return setErr('Select a time slot');
  setLoading(true);setErr('');
  try{
    const war=f.warranty||(f.services.length>0&&!f.package_id?'No Warranty':'');
    const res=await createBooking({location_id:f.location_id,service_type:'service',
      package_id:f.package_id||null,services:f.services,vehicle_type:f.vehicle_type,
      vehicle_make:f.vehicle_make,vehicle_model:f.vehicle_model.toUpperCase(),
      vehicle_year:f.vehicle_year,vehicle_color:f.vehicle_color,vehicle_regn:regn(),
      customer_address:f.custAddress,customer_email:f.custEmail,
      pre_amount:f.pre_amount||0,total_amount:f.total_amount||0,
      valid_till:f.validTill||null,payment_mode:f.payment_mode,warranty:war,
      scheduled_date:f.scheduled_date,time_slot:f.time_slot,notes:f.notes});
    setJobNo(res.data.job_no);setDone(true);
  }catch(e){setErr(e.response?.data?.error||'Booking failed');}
  setLoading(false);
};

const downloadPDF=()=>{
  const{jsPDF}=window.jspdf;const doc=new jsPDF();
  const svc=f.selectedPkg?.name||f.services.join(', ')||'Custom';
  doc.setFillColor(220,38,38);doc.rect(0,0,210,28,'F');
  doc.setTextColor(255);doc.setFontSize(22);doc.setFont('helvetica','bold');
  doc.text('THE COATING GURU',14,16);
  doc.setFontSize(10);doc.setFont('helvetica','normal');
  doc.text('Premium Car Care | Vadodara',14,23);doc.text('WhatsApp: 9316668760',145,23);
  doc.setFillColor(17,17,17);doc.rect(0,28,210,12,'F');
  doc.setTextColor(220,38,38);doc.setFontSize(13);doc.setFont('helvetica','bold');
  doc.text('CUSTOMER BOOKING SHEET',14,37);
  doc.setTextColor(200);doc.setFontSize(10);doc.text(`Job No: ${jobNo}`,160,37);
  let y=52;
  const row=(l,v,hl)=>{doc.setFillColor(hl?255:240,hl?235:240,hl?235:240);doc.rect(14,y-5,182,9,'F');doc.setFont('helvetica','bold');doc.setTextColor(60);doc.setFontSize(10);doc.text(l,16,y);doc.setTextColor(hl?220:10,hl?38:10,hl?38:10);doc.setFontSize(11);doc.text(String(v||'-'),80,y);y+=12;};
  doc.setTextColor(220,38,38);doc.setFontSize(11);doc.setFont('helvetica','bold');
  doc.text('CUSTOMER INFORMATION',14,y-4);y+=4;
  row('Customer Name',f.custName);row('Phone',f.custPhone);row('Address',f.custAddress);
  if(f.custEmail)row('Email',f.custEmail);y+=2;
  doc.setTextColor(220,38,38);doc.text('VEHICLE DETAILS',14,y-4);y+=4;
  row('Type',f.vehicle_type);row('Make & Model',`${f.vehicle_make} ${f.vehicle_model}`);
  row('Year',f.vehicle_year);row('Color',f.vehicle_color);row('Registration',regn());y+=2;
  doc.setTextColor(220,38,38);doc.text('BOOKING DETAILS',14,y-4);y+=4;
  row('Package/Service',svc);if(f.services.length>0)row('Individual Services',f.services.join(', '));
  row('Location',f.location_name);
  row('Service Date',f.scheduleDisplay);row('Time Slot',formatTime(f.time_slot));
  row('Booking Date',formatDate(f.bookingDate));
  if(f.validTill)row('Valid Till',formatDate(f.validTill));
  row('Pre Amount',f.pre_amount?`Rs. ${f.pre_amount}`:'—');
  row('Total Amount',f.total_amount?`Rs. ${f.total_amount}`:'—',true);
  row('Pending',f.pending_amount?`Rs. ${f.pending_amount}`:'—');
  row('Payment Mode',f.payment_mode);row('Warranty',f.warranty||'No Warranty');
  if(f.notes)row('Notes',f.notes);
  if(y<250){doc.setFillColor(220,38,38);doc.rect(0,272,210,25,'F');doc.setTextColor(255);doc.setFont('helvetica','bold');doc.setFontSize(10);doc.text('Customer Signature: ____________________   Service Advisor: ____________________',14,283);}
  doc.save(`TCG_Booking_${jobNo}.pdf`);
};

const sendWA=(target)=>{
  const svc=f.selectedPkg?.name||f.services.join(', ')||'Service';
  const msg=`*THE COATING GURU*\n\nBooking Confirmation\nJob No: ${jobNo}\nCustomer: ${f.custName}\nPhone: ${f.custPhone}\nVehicle: ${f.vehicle_make} ${f.vehicle_model} (${f.vehicle_type})\nReg: ${regn()}\nService: ${svc}\nDate: ${f.scheduleDisplay}\nTime: ${formatTime(f.time_slot)}\nLocation: ${f.location_name}\nTotal: Rs.${f.total_amount||'—'}\nAdvance: Rs.${f.pre_amount||'0'}\nPending: Rs.${f.pending_amount||'—'}\nPayment: ${f.payment_mode}\nWarranty: ${f.warranty||'No Warranty'}\n\nThank you for choosing The Coating Guru!`;
  let phone='919316668760';
  if(target==='customer'){const raw=(f.custPhone||'').replace(/\D/g,'');phone=raw.startsWith('91')?raw:'91'+raw;}
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`,'_blank');
};

const renderCal=()=>{
  const first=new Date(calY,calM,1).getDay();const days=new Date(calY,calM+1,0).getDate();
  const today=new Date();today.setHours(0,0,0,0);
  const cells=[];
  DAYNAMES.forEach(d=>cells.push(<div key={'h'+d} className="cal-day-name">{d}</div>));
  for(let i=0;i<first;i++)cells.push(<div key={'e'+i} className="cal-day cal-empty"/>);
  for(let d=1;d<=days;d++){
    const dt=new Date(calY,calM,d);const iso=`${calY}-${String(calM+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dis=dt<today||dt.getDay()===0||HOLIDAYS.includes(iso);
    const sel=f.scheduled_date===iso;
    cells.push(<div key={d} className={`cal-day${dis?' cal-disabled':''}${sel?' cal-selected':''}`}
      onClick={()=>{if(!dis)onDateSelect(iso,`${d} ${MONTHS[calM]} ${calY}`);}}>{d}</div>);
  }
  return cells;
};

const titles=['Location','Package','Details','Schedule'];
const StepBar=()=>(<div className="steps">{titles.map((t,i)=>{const n=i+1;return(<div key={n} style={{display:'flex',alignItems:'center'}}>{i>0&&<div className="step-line" style={n<=step?{background:'var(--red)'}:{}}/>}<div className={`step-node${n<step?' done':''}${n===step?' active':''}`}><div className="step-circle">{n}</div><div className="step-label">{t}</div></div></div>);})}</div>);

if(done)return(
<div className="page-wrap fade-in" style={{paddingTop:80,textAlign:'center'}}>
  <div style={{fontSize:52,marginBottom:8}}>✅</div>
  <div style={{fontFamily:'var(--font-display)',fontSize:28,color:'var(--red)',marginBottom:4}}>JOB NO: {jobNo}</div>
  <div style={{color:'var(--gray)',fontSize:14,marginBottom:20}}>Booking confirmed!</div>
  <div className="card" style={{textAlign:'left',maxWidth:500,margin:'0 auto 16px'}}>
    <div style={{display:'grid',gap:8,fontSize:14}}>
      {[['Customer',f.custName],['Vehicle',`${f.vehicle_make} ${f.vehicle_model}`],['Service',f.selectedPkg?.name||f.services.join(', ')],['Date',f.scheduleDisplay],['Time',formatTime(f.time_slot)],['Location',f.location_name],['Total',`₹${f.total_amount}`],['Advance',`₹${f.pre_amount||'0'}`],['Pending',`₹${f.pending_amount||f.total_amount}`]].map(([l,v])=>(
        <div key={l} style={{display:'flex',justifyContent:'space-between'}}><span style={{color:'var(--gray)'}}>{l}</span><span>{v}</span></div>
      ))}
    </div>
  </div>
  <div style={{display:'flex',gap:8,justifyContent:'center',flexWrap:'wrap'}}>
    <button className="btn-red" onClick={downloadPDF}>DOWNLOAD PDF</button>
    <button className="btn-outline" onClick={()=>sendWA('admin')}>📱 SEND TO OWNER</button>
    <button className="btn-green" onClick={()=>sendWA('customer')}>📱 SEND TO ME</button>
    <button className="btn-ghost" onClick={()=>nav('/customer/bookings')}>VIEW MY BOOKINGS</button>
  </div>
</div>);

return(
<div className="page-wrap fade-in" style={{paddingTop:80,maxWidth:760}}>
  <h1 style={{fontFamily:'var(--font-display)',fontSize:36,letterSpacing:2,marginBottom:4}}>BOOK A <span style={{color:'var(--red)'}}>SERVICE</span></h1>
  <p style={{color:'var(--gray)',fontSize:14,marginBottom:20}}>Complete your booking in 4 steps</p>
  <StepBar/>
  {err&&<div style={{color:'var(--red-bright)',fontSize:13,marginBottom:12,padding:'8px 12px',background:'rgba(220,38,38,.1)',borderRadius:2}}>{err}</div>}

  {step===1&&(<div>
    <h2 style={{fontFamily:'var(--font-display)',fontSize:22,marginBottom:14}}>SELECT <span style={{color:'var(--red)'}}>LOCATION</span></h2>
    <div className="loc-grid">{locs.map(l=>(<div key={l.id} className={`loc-card${f.location_id===l.id?' selected':''}`} onClick={()=>{set('location_id',l.id);set('location_name',l.name);}}>
      <h3 style={{fontFamily:'var(--font-display)',fontSize:18,letterSpacing:1,marginBottom:4}}>{l.name}</h3>
      <p style={{fontSize:13,color:'var(--gray)',lineHeight:1.5}}>{l.address}</p>
      {!l.allows_wash&&<div style={{color:'#F59E0B',fontSize:12,marginTop:6,fontWeight:600}}>⚠ Wash not available</div>}
    </div>))}</div>
    <div style={{marginTop:18,display:'flex',justifyContent:'flex-end'}}><button className="btn-red" onClick={()=>goStep(2)}>CONTINUE →</button></div>
  </div>)}

  {step===2&&(<div>
    <h2 style={{fontFamily:'var(--font-display)',fontSize:22,marginBottom:4}}>SELECT <span style={{color:'var(--red)'}}>PACKAGE</span></h2>
    <p style={{fontSize:13,color:'var(--gray)',marginBottom:14}}>Choose a package OR individual services below</p>
    <div className="pkg-grid">{pkgs.map(p=>{
      const yrs=p.warranty_years>=99?'LIFETIME':p.warranty_years+' YEAR';
      return(<div key={p.id} className={`pkg-card${f.package_id===p.id?' selected':''}`} onClick={()=>selectPkg(p)}
        style={p.name?.includes('Ultra')?{border:'1px solid var(--red-dark)'}:{}}>
        {p.name?.includes('Ultra')&&<div className="pkg-badge">BEST</div>}
        <div className="pkg-name">{p.name?.replace('TCG ','')}</div>
        <div style={{fontFamily:'var(--font-display)',fontSize:28,color:'var(--red)',margin:'4px 0'}}>{yrs}</div>
        <div className="pkg-warranty">{yrs} WARRANTY</div>
        <div style={{fontSize:13,color:'var(--gray)',marginTop:4}}>{p.description}</div>
      </div>);})}</div>
    <div className="divider"/>
    <h3 style={{fontFamily:'var(--font-display)',fontSize:18,marginBottom:10}}>INDIVIDUAL <span style={{color:'var(--red)'}}>SERVICES</span></h3>
    <div className="check-grid">{INDIVIDUAL_SVCS.map(s=>(<div key={s} className={`check-item${f.services.includes(s)?' checked':''}`} onClick={()=>togSvc(s)}>
      <input type="checkbox" checked={f.services.includes(s)} readOnly/><label>{s}</label>
      <span style={{marginLeft:'auto',fontWeight:700,color:'var(--red)',fontSize:13}}>₹{INDIVIDUAL_SVC_PRICES[s]||0}</span>
    </div>))}</div>
    <div style={{marginTop:18,display:'flex',justifyContent:'space-between'}}>
      <button className="btn-ghost" onClick={()=>setStep(1)}>← BACK</button>
      <button className="btn-red" onClick={()=>goStep(3)}>CONTINUE →</button></div>
  </div>)}

  {step===3&&(<div>
    <h2 style={{fontFamily:'var(--font-display)',fontSize:22,marginBottom:14}}>CUSTOMER & VEHICLE <span style={{color:'var(--red)'}}>DETAILS</span></h2>
    <div className="sec-head">CUSTOMER INFORMATION</div>
    <div className="form-grid">
      <div className="field full"><label className="field-label field-required">Customer Name</label><input value={f.custName} onChange={e=>set('custName',e.target.value)} placeholder="Full Name"/></div>
      <div className="field full"><label className="field-label">Mobile Number</label><input value={f.custPhone} readOnly style={{opacity:.6}}/></div>
      <div className="field full"><label className="field-label field-required">Full Address</label><textarea rows={2} value={f.custAddress} onChange={e=>set('custAddress',e.target.value)} placeholder="House, Street, Area, City, Pincode"/></div>
      <div className="field full"><label className="field-label">Email (optional)</label><input type="email" value={f.custEmail} onChange={e=>set('custEmail',e.target.value)}/></div>
    </div>
    <div className="sec-head">VEHICLE INFORMATION</div>
    <div className="form-grid">
      <div className="field"><label className="field-label field-required">Vehicle Type</label><select value={f.vehicle_type} onChange={e=>onVehicleTypeChange(e.target.value)}><option value="">Select</option>{VTYPES.map(v=><option key={v}>{v}</option>)}</select></div>
      <div className="field"><label className="field-label field-required">Make (Brand)</label><select value={f.vehicle_make} onChange={e=>set('vehicle_make',e.target.value)}><option value="">Select Brand</option>{BRANDS.map(b=><option key={b}>{b}</option>)}</select></div>
      <div className="field"><label className="field-label field-required">Model</label><input value={f.vehicle_model} onChange={e=>set('vehicle_model',e.target.value)} placeholder="e.g. Creta, Swift"/></div>
      <div className="field"><label className="field-label field-required">Year</label><select value={f.vehicle_year} onChange={e=>set('vehicle_year',e.target.value)}><option value="">Select</option>{YEARS.map(y=><option key={y}>{y}</option>)}</select></div>
      <div className="field"><label className="field-label field-required">Color</label><select value={f.vehicle_color} onChange={e=>set('vehicle_color',e.target.value)}><option value="">Select</option>{COLORS.map(c=><option key={c}>{c}</option>)}</select></div>
      <div className="field"><label className="field-label field-required">Registration No.</label>
        <div className="reg-wrap"><span className="reg-prefix">{f.regnState.toUpperCase()} {f.regnDist} {f.regnAlpha.toUpperCase()}</span><input value={f.regnNum} onChange={e=>set('regnNum',e.target.value.replace(/\D/g,'').slice(0,4))} placeholder="0000" maxLength={4} style={{width:100}}/></div>
        <div style={{display:'flex',gap:6,marginTop:4}}>
          <input value={f.regnState} onChange={e=>set('regnState',e.target.value.slice(0,2))} placeholder="GJ" maxLength={2} style={{width:55,fontSize:12,padding:'5px 7px'}}/>
          <input value={f.regnDist} onChange={e=>set('regnDist',e.target.value.slice(0,2))} placeholder="06" maxLength={2} style={{width:55,fontSize:12,padding:'5px 7px'}}/>
          <input value={f.regnAlpha} onChange={e=>set('regnAlpha',e.target.value.toUpperCase().slice(0,2))} placeholder="XX" maxLength={2} style={{flex:1,fontSize:12,padding:'5px 7px'}}/>
        </div></div>
    </div>
    <div className="sec-head">BOOKING DETAILS</div>
    <div className="form-grid">
      <div className="field"><label className="field-label">Booking Date</label><input type="date" value={f.bookingDate} onChange={e=>{set('bookingDate',e.target.value);if(f.selectedPkg)set('validTill',validTillFromPkg(e.target.value,f.selectedPkg));}}/></div>
      {f.selectedPkg&&<div className="field"><label className="field-label">Valid Till</label><input value={f.validTill?formatDate(f.validTill):''} readOnly style={{opacity:.7}}/></div>}
      <div className="field"><label className="field-label">Pre Amount (₹)</label><input type="number" value={f.pre_amount} onChange={e=>onPreAmountChange(e.target.value)} min={0}/></div>
      <div className="field"><label className="field-label field-required">Total Amount (₹)</label><input type="number" value={f.total_amount} onChange={e=>{set('total_amount',e.target.value);set('pending_amount',String(Number(e.target.value)-Number(f.pre_amount||0)));}} min={0}/></div>
      <div className="field"><label className="field-label">Pending Amount (₹)</label><input value={f.pending_amount} readOnly style={{opacity:.7,color:'var(--red)'}}/></div>
    </div>
    <div className="sec-head">MODE OF PAYMENT</div>
    <div className="tick-grid" style={{marginBottom:16}}>{PAYMENTS.map(p=>(<div key={p} className={`tick-item${f.payment_mode===p?' ticked':''}`} onClick={()=>set('payment_mode',p)}><input type="radio" name="pay" checked={f.payment_mode===p} readOnly/><label>{p}</label></div>))}</div>
    {f.selectedPkg&&<><div className="sec-head">WARRANTY PACKAGE</div>
    <div className="tick-grid" style={{marginBottom:16}}>{WARRANTIES.map(w=>(<div key={w} className={`tick-item${f.warranty===w?' ticked':''}`} onClick={()=>set('warranty',w)}><input type="radio" name="war" checked={f.warranty===w} readOnly/><label>{w}</label></div>))}</div></>}
    {f.services.length>0&&<><div className="sec-head">INDIVIDUAL SERVICES SELECTED</div>
    <div style={{display:'grid',gap:6,marginBottom:12}}>
      {f.services.map(s=>(<div key={s} style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:'rgba(220,38,38,.06)',border:'1px solid var(--red)',padding:'8px 14px',borderRadius:2}}>
        <div><div style={{fontWeight:700,fontSize:14}}>◆ {s}</div>
        <div style={{fontSize:12,color:'var(--gray)'}}>{f.selectedPkg?'Warranty: Inclusive with package':'Warranty: Onetime'}</div></div>
        <div style={{fontFamily:'var(--font-display)',fontSize:18,color:'var(--red)'}}>₹{INDIVIDUAL_SVC_PRICES[s]||0}</div>
      </div>))}
    </div>
    <div style={{display:'flex',justifyContent:'space-between',padding:'10px 14px',background:'var(--black-4)',borderRadius:2,marginBottom:16,fontSize:15}}>
      <span style={{fontWeight:700}}>Individual Services Total</span>
      <span style={{fontWeight:700,color:'var(--red)'}}>₹{f.services.reduce((sum,s)=>sum+(INDIVIDUAL_SVC_PRICES[s]||0),0)}</span>
    </div>
    {f.selectedPkg&&<div style={{display:'flex',justifyContent:'space-between',padding:'10px 14px',background:'var(--black-4)',borderRadius:2,marginBottom:16,fontSize:15}}>
      <span style={{fontWeight:700}}>Grand Total (Package + Services)</span>
      <span style={{fontWeight:700,color:'var(--red)'}}>₹{f.total_amount||0}</span>
    </div>}
    </>}
    <div className="field"><label className="field-label">Special Notes</label><textarea rows={2} value={f.notes} onChange={e=>set('notes',e.target.value)}/></div>
    <div style={{marginTop:18,display:'flex',justifyContent:'space-between'}}>
      <button className="btn-ghost" onClick={()=>setStep(2)}>← BACK</button>
      <button className="btn-red" onClick={()=>goStep(4)}>CONTINUE →</button></div>
  </div>)}

  {step===4&&(<div>
    <h2 style={{fontFamily:'var(--font-display)',fontSize:22,marginBottom:14}}>SCHEDULE <span style={{color:'var(--red)'}}>SERVICE</span></h2>
    <div className="cal-wrap">
      <div className="cal-nav">
        <button className="cal-nav-btn" onClick={()=>{let m=calM-1,y=calY;if(m<0){m=11;y--;}setCalM(m);setCalY(y);}}>‹</button>
        <div className="cal-title">{MONTHS[calM]} {calY}</div>
        <button className="cal-nav-btn" onClick={()=>{let m=calM+1,y=calY;if(m>11){m=0;y++;}setCalM(m);setCalY(y);}}>›</button>
      </div>
      <div className="cal-grid">{renderCal()}</div>
    </div>
    {f.scheduleDisplay&&<div style={{marginTop:12,padding:12,background:'rgba(220,38,38,.1)',border:'1px solid var(--red)',borderRadius:2}}><span style={{fontSize:13,color:'var(--gray)'}}>Selected: </span><span style={{fontSize:15,fontWeight:700}}>{f.scheduleDisplay}</span></div>}
    {f.scheduled_date&&<div style={{marginTop:12}}><label className="field-label">Select Time Slot</label>
      {availSlots.length===0?<p style={{color:'var(--gray)',fontSize:13,marginTop:6}}>No slots available for this date</p>:
      <div className="tick-grid" style={{marginTop:6}}>{availSlots.map(s=>(<div key={s} className={`tick-item${f.time_slot===s?' ticked':''}`} onClick={()=>set('time_slot',s)}>
        <input type="radio" checked={f.time_slot===s} readOnly/><label style={{fontSize:13}}>{formatTime(s)}</label></div>))}</div>}
    </div>}
    <div style={{marginTop:18,display:'flex',justifyContent:'space-between'}}>
      <button className="btn-ghost" onClick={()=>setStep(3)}>← BACK</button>
      <button className="btn-red" onClick={confirmBooking} disabled={loading}>{loading?'BOOKING...':'CONFIRM BOOKING →'}</button>
    </div>
  </div>)}
</div>);
}
