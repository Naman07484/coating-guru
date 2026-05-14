import{useState,useEffect}from'react';
import{getAdminStats,getAllBookings,updateBookingStatus,getAllJobCards,completeJob,notifyCustomer,getTodayWashList,getTodayServiceList}from'../api';
import{useNavigate}from'react-router-dom';
import{formatDate,formatTime}from'./bookingData';
import{ServiceJCModal,WashJCModal}from'./AdminModals';
import{downloadSheetPDF,downloadTodayListPDF,downloadServiceJCpdf,downloadWashJCpdf}from'./adminHelpers';

export default function AdminPanel(){
const nav=useNavigate();
const[ok,setOk]=useState(false);
const[u,setU]=useState('');const[p,setP]=useState('');const[le,setLe]=useState('');
const[tab,setTab]=useState('dashboard');
const[stats,setStats]=useState(null);
const[bkgs,setBkgs]=useState([]);
const[jcs,setJcs]=useState([]);
const[twash,setTwash]=useState([]);
const[tsvc,setTsvc]=useState([]);
const[toast,setToast]=useState(null);
const[showSJC,setShowSJC]=useState(false);
const[showWJC,setShowWJC]=useState(false);
const[jcBid,setJcBid]=useState('');
const[wjcBkg,setWjcBkg]=useState(null);
const[wjcNum,setWjcNum]=useState(1);
const[search,setSearch]=useState('');
const[prevSub,setPrevSub]=useState('svc');

const shToast=(t,m)=>{setToast({t,m});setTimeout(()=>setToast(null),3500);};

const load=()=>{
  getAdminStats().then(r=>setStats(r.data)).catch(()=>{});
  getAllBookings().then(r=>setBkgs(r.data)).catch(()=>{});
  getAllJobCards().then(r=>setJcs(r.data)).catch(()=>{});
  getTodayWashList().then(r=>setTwash(r.data)).catch(()=>{});
  getTodayServiceList().then(r=>setTsvc(r.data)).catch(()=>{});
};

useEffect(()=>{if(ok)load();},[ok]);

const login=()=>{if(u==='admin'&&p==='admin123'){setOk(true);setLe('');}else setLe('Invalid credentials');};

const setStatus=async(id,s)=>{await updateBookingStatus(id,s);shToast('Updated',`#${id} → ${s}`);load();};
const doComplete=async(bid)=>{const r=await completeJob(bid);if(r.data.waUrl)window.open(r.data.waUrl,'_blank');shToast('Done','Job completed');load();};
const doNotify=async(bid)=>{const r=await notifyCustomer(bid);if(r.data.waUrl)window.open(r.data.waUrl,'_blank');shToast('WA','Sent');};

const openSJC=(bid)=>{setJcBid(bid);setShowSJC(true);};
const openWJC=(b)=>{
  const userWashes=bkgs.filter(x=>x.user_id===b.user_id&&x.service_type==='wash'&&x.status!=='cancelled');
  const n=userWashes.findIndex(x=>x.id===b.id)+1||1;
  setWjcBkg(b);setWjcNum(n);setShowWJC(true);
};

const badge=s=>{const m={pending:'badge-pending',confirmed:'badge-confirmed',in_progress:'badge-inprogress',completed:'badge-complete'};return<span className={`badge ${m[s]||'badge-pending'}`}>{(s||'pending').replace('_',' ')}</span>;};

const svcLabel=(b)=>{
  if(b.service_type==='wash')return'WASHING';
  if(b.package_name)return b.package_name;
  let s=[];try{s=JSON.parse(b.services||'[]')}catch{}return s.join(', ')||'Custom';
};

// Search filter
const matchSearch=(b)=>{
  if(!search.trim())return true;
  const q=search.toLowerCase();
  const jn='tcg-'+String(b.id).padStart(3,'0');
  return (b.customer_name||'').toLowerCase().includes(q)||(b.customer_phone||'').includes(q)||jn.includes(q);
};

// Booking row — section param controls which buttons show
const BRow=({b,section})=>{
  // Check if 24 hours have passed since scheduled date and not completed
  const isOverdue=b.status!=='completed'&&(()=>{
    const sched=new Date(b.scheduled_date+'T'+(b.time_slot||'18:00'));
    return(Date.now()-sched.getTime())>24*60*60*1000;
  })();
  return(
  <div className="card" style={{marginBottom:8,borderLeft:isOverdue?'4px solid #EF4444':'none'}}>
    {isOverdue&&<div style={{background:'#FEE2E2',color:'#991B1B',padding:'8px 12px',borderRadius:2,marginBottom:10,fontWeight:700,fontSize:14,border:'1px solid #FECACA'}}>
      ⚠️ KINDLY MARK AS COMPLETE OR INCOMPLETE — 24 HOURS HAVE PASSED SINCE SCHEDULED SERVICE
    </div>}
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:6,marginBottom:8}}>
      <span style={{fontFamily:'var(--font-display)',fontSize:17,color:'var(--red)'}}>TCG-{String(b.id).padStart(3,'0')}</span>
      <div style={{display:'flex',gap:6,alignItems:'center'}}>{badge(b.status)}{b.has_jc>0&&<span className="badge badge-jc">JC✓</span>}</div>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,fontSize:14,marginBottom:10}}>
      <div><span style={{color:'var(--gray)'}}>Customer: </span>{b.customer_name}</div>
      <div><span style={{color:'var(--gray)'}}>Phone: </span>{b.customer_phone}</div>
      <div><span style={{color:'var(--gray)'}}>Date: </span>{formatDate(b.scheduled_date)}</div>
      <div><span style={{color:'var(--gray)'}}>Time: </span>{formatTime(b.time_slot)}</div>
      <div><span style={{color:'var(--gray)'}}>Service: </span>{svcLabel(b)}</div>
      <div><span style={{color:'var(--gray)'}}>Vehicle: </span>{b.vehicle_make} {b.vehicle_model}</div>
      <div><span style={{color:'var(--gray)'}}>Location: </span>{b.location_name}</div>
      <div><span style={{color:'var(--gray)'}}>Amount: </span>₹{b.total_amount||'—'}</div>
    </div>
    <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
      {(section==='pending'||section==='previous')&&b.status!=='in_progress'&&b.status!=='completed'&&<button className="btn-ghost btn-sm" onClick={()=>setStatus(b.id,'in_progress')}>▶ In Progress</button>}
      {(section==='pending'||section==='previous')&&b.status!=='completed'&&<button className="btn-ghost btn-sm" onClick={()=>setStatus(b.id,'completed')}>✓ Complete</button>}
      {(section==='pending'||section==='previous')&&b.service_type!=='wash'&&<button className="btn-outline btn-sm" onClick={()=>openSJC(b.id)}>📋 Job Card</button>}
      {(section==='pending'||section==='previous')&&<button className="btn-ghost btn-sm" onClick={()=>downloadSheetPDF(b)}>📄 Sheet</button>}
      {section==='completed'&&<button className="btn-green btn-sm" onClick={()=>doNotify(b.id)}>📱 Notify Pickup</button>}
      {section==='completed'&&<button className="btn-ghost btn-sm" onClick={()=>downloadSheetPDF(b)}>📄 Sheet</button>}
      {(section==='washing'||section==='prev-wash')&&b.status!=='completed'&&<button className="btn-ghost btn-sm" onClick={()=>setStatus(b.id,'in_progress')}>▶ In Progress</button>}
      {(section==='washing'||section==='prev-wash')&&b.status!=='completed'&&<button className="btn-ghost btn-sm" onClick={()=>setStatus(b.id,'completed')}>✓ Complete</button>}
      {(section==='washing'||section==='prev-wash')&&<button className="btn-outline btn-sm" onClick={()=>openWJC(b)}>📋 Wash JC</button>}
      {(section==='washing'||section==='prev-wash')&&b.status==='completed'&&<button className="btn-green btn-sm" onClick={()=>doNotify(b.id)}>📱 Notify Pickup</button>}
      {section==='search'&&<button className="btn-ghost btn-sm" onClick={()=>downloadSheetPDF(b)}>📄 Sheet</button>}
    </div>
  </div>);
};

// JC card
const JCCard=({jc})=>{
  let cl=jc.checklist;if(typeof cl==='string')try{cl=JSON.parse(cl)}catch{cl={}}
  const svcs=Object.entries(cl||{}).filter(([,v])=>v).map(([s])=>s);
  const isWash=jc.service_type==='wash';
  return(
  <div className="card card-red-top" style={{marginBottom:8}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8,flexWrap:'wrap',gap:6}}>
      <div>
        <span style={{fontFamily:'var(--font-display)',fontSize:17}}>{isWash?'WJC':'JC'}-{String(jc.id).padStart(3,'0')}</span>
        <span style={{color:'var(--red)',fontFamily:'var(--font-display)',fontSize:15,marginLeft:8}}>TCG-{String(jc.booking_id).padStart(3,'0')}</span>
        <span style={{fontSize:13,color:'var(--white-3)',marginLeft:8}}>— {jc.customer_name}</span>
      </div>
      {badge(jc.status)}
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,fontSize:14,marginBottom:8}}>
      <div><span style={{color:'var(--gray)'}}>Tech: </span>{jc.technician||'—'}</div>
      <div><span style={{color:'var(--gray)'}}>Date: </span>{formatDate(jc.scheduled_date)}</div>
      <div><span style={{color:'var(--gray)'}}>Warranty: </span>{jc.warranty||jc.booking_warranty||'—'}</div>
      <div><span style={{color:'var(--gray)'}}>Vehicle: </span>{jc.vehicle_make} {jc.vehicle_model}</div>
    </div>
    {svcs.length>0&&<div style={{fontSize:12,color:'var(--gray)',marginBottom:8}}>Services: {svcs.join(', ')}</div>}
    {jc.notes&&<div style={{fontSize:13,color:'var(--gray)',marginBottom:8,padding:'6px 8px',background:'var(--black-4)',borderRadius:2}}>{jc.notes}</div>}
    <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
      <button className="btn-ghost btn-sm" onClick={()=>isWash?downloadWashJCpdf(jc):downloadServiceJCpdf(jc)}>📄 PDF</button>
      {jc.status!=='completed'&&<button className="btn-red btn-sm" onClick={()=>doComplete(jc.booking_id)}>✓ Complete</button>}
    </div>
  </div>);
};

// Donut chart
const DonutChart=({counts})=>{
  const items=[
    {label:'Ceramic',val:Number(counts?.ceramic||0),color:'#DC2626'},
    {label:'Graphene',val:Number(counts?.graphene||0),color:'#7C3AED'},
    {label:'PPF',val:Number(counts?.ppf||0),color:'#0891B2'},
    {label:'Detailing',val:Number(counts?.detailing||0),color:'#D97706'},
    {label:'Interior',val:Number(counts?.interior||0),color:'#059669'},
  ];
  const total=items.reduce((a,i)=>a+i.val,0)||1;
  let offset=0;
  const r=15.9155,c=2*Math.PI*r;
  return(
  <div style={{display:'flex',alignItems:'center',gap:20,flexWrap:'wrap'}}>
    <svg viewBox="0 0 42 42" style={{width:120,height:120,transform:'rotate(-90deg)'}}>
      <circle cx="21" cy="21" r={r} fill="none" stroke="var(--black-4)" strokeWidth="4"/>
      {items.map((it,i)=>{
        const dash=(it.val/total)*c;const gap=c-dash;
        const el=<circle key={i} cx="21" cy="21" r={r} fill="none" stroke={it.color} strokeWidth="4"
          strokeDasharray={`${dash} ${gap}`} strokeDashoffset={-offset}/>;
        offset+=dash;return el;
      })}
    </svg>
    <div style={{display:'grid',gap:6}}>
      {items.map(it=>(<div key={it.label} style={{display:'flex',alignItems:'center',gap:8,fontSize:13}}>
        <div style={{width:10,height:10,borderRadius:2,background:it.color,flexShrink:0}}/>
        <span style={{color:'var(--gray)'}}>{it.label}:</span>
        <span style={{fontWeight:700}}>{it.val}</span>
      </div>))}
    </div>
  </div>);
};

if(!ok)return(
  <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--black)'}}>
    <div style={{background:'var(--black-3)',border:'1px solid var(--black-4)',borderTop:'2px solid var(--red)',borderRadius:4,padding:40,maxWidth:400,width:'90%',textAlign:'center'}}>
      <h1 style={{fontFamily:'var(--font-display)',fontSize:34,letterSpacing:2,marginBottom:4}}>ADMIN <span style={{color:'var(--red)'}}>PANEL</span></h1>
      <p style={{color:'var(--gray)',fontSize:14,marginBottom:24}}>The Coating Guru</p>
      <div className="field"><input placeholder="Username" value={u} onChange={e=>setU(e.target.value)} onKeyDown={e=>e.key==='Enter'&&login()}/></div>
      <div className="field"><input placeholder="Password" type="password" value={p} onChange={e=>setP(e.target.value)} onKeyDown={e=>e.key==='Enter'&&login()}/></div>
      {le&&<div style={{color:'var(--red)',fontSize:13,marginBottom:10}}>{le}</div>}
      <button className="btn-red" style={{width:'100%'}} onClick={login}>LOGIN</button>
      <div style={{marginTop:16}}><a href="/" style={{color:'var(--gray)',fontSize:12,textDecoration:'none'}}>← Customer Login</a></div>
    </div>
  </div>
);

const today=new Date().toISOString().slice(0,10);
const svcBkgs=bkgs.filter(b=>b.service_type!=='wash');
// Active = today + future (or not completed)
const activeSvc=svcBkgs.filter(b=>b.scheduled_date>=today&&b.status!=='completed');
const completedSvc=svcBkgs.filter(b=>b.status==='completed'&&b.scheduled_date>=today);
const activeWash=bkgs.filter(b=>b.service_type==='wash'&&b.scheduled_date>=today);
// Previous = past dated (before today) — the old records
const prevSvc=svcBkgs.filter(b=>b.scheduled_date<today&&b.status!=='completed');
const prevSvcDone=svcBkgs.filter(b=>b.scheduled_date<today&&b.status==='completed');
const prevWash=bkgs.filter(b=>b.service_type==='wash'&&b.scheduled_date<today);
const prevCount=prevSvc.length+prevSvcDone.length+prevWash.length;

// Search results
const searchResults=search.trim()?bkgs.filter(matchSearch):[];

const TABS=[{k:'dashboard',l:'Dashboard'},{k:'pending',l:`Active (${activeSvc.length})`},{k:'completed',l:'Completed'},{k:'washing',l:`Washing (${activeWash.length})`},{k:'jobs',l:'Job Cards'},{k:'sheets',l:'Sheets'},{k:'today',l:"Today's List"},{k:'previous',l:`📁 Previous (${prevCount})`},{k:'search',l:'🔍 Search'}];

return(
<div>
  {toast&&<div className="toast-wrap"><div className="toast"><div className="toast-title">{toast.t}</div><div className="toast-msg">{toast.m}</div></div></div>}
  {showSJC&&<ServiceJCModal bid={jcBid} onClose={()=>setShowSJC(false)} onSaved={load} showToast={shToast}/>}
  {showWJC&&wjcBkg&&<WashJCModal booking={wjcBkg} washNumber={wjcNum} onClose={()=>setShowWJC(false)} onSaved={load} showToast={shToast}/>}

  <nav id="tcg-nav">
    <div className="nav-logo">THE <span>COATING</span> GURU <span style={{fontSize:11,color:'var(--gray)',marginLeft:8,letterSpacing:1}}>ADMIN</span></div>
    <div className="nav-links">
      <button className="btn-outline btn-sm" onClick={()=>{setJcBid('');setShowSJC(true);}}>+ JOB CARD</button>
      <button className="nav-btn" onClick={()=>{setOk(false);nav('/');}}>Logout</button>
    </div>
  </nav>

  <div className="page-wrap-wide" style={{paddingTop:70}}>
    <div style={{marginBottom:16}}>
      <div style={{fontFamily:'var(--font-display)',fontSize:30,letterSpacing:2}}>ADMIN <span style={{color:'var(--red)'}}>PANEL</span></div>
      <p style={{color:'var(--gray)',fontSize:13}}>The Coating Guru · Operations Dashboard</p>
    </div>

    <div style={{overflowX:'auto',marginBottom:20}}>
      <div className="tabs" style={{minWidth:'max-content'}}>
        {TABS.map(t=><button key={t.k} className={`tab${tab===t.k?' active':''}`} onClick={()=>setTab(t.k)}>{t.l}</button>)}
      </div>
    </div>

    {/* DASHBOARD — #4 removed collection, #5 separate month/year */}
    {tab==='dashboard'&&stats&&(<div>
      <div className="stats-row" style={{marginBottom:16}}>
        <div className="db-stat">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
            <div><div className="db-stat-label">Cars Serviced Today</div><div className="db-stat-num">{stats.cars?.today||0}</div></div>
            <span style={{fontSize:22}}>🚗</span>
          </div>
        </div>
        <div className="db-stat">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
            <div><div className="db-stat-label">Cars Serviced This Month</div><div className="db-stat-num" style={{color:'#10B981'}}>{stats.cars?.thisMonth||0}</div></div>
            <span style={{fontSize:22}}>📅</span>
          </div>
        </div>
        <div className="db-stat">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
            <div><div className="db-stat-label">Cars Serviced This Year</div><div className="db-stat-num" style={{color:'#7C3AED'}}>{stats.cars?.thisYear||0}</div></div>
            <span style={{fontSize:22}}>📊</span>
          </div>
        </div>
        <div className="db-stat">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
            <div><div className="db-stat-label">Pending Payments</div><div className="db-stat-num" style={{color:'#F59E0B'}}>{stats.pendingPayments||0}</div></div>
            <span style={{fontSize:22}}>⚠️</span>
          </div>
        </div>
        <div className="db-stat">
          <div><div className="db-stat-label">Total Bookings</div><div className="db-stat-num">{stats.totalBookings||0}</div></div>
        </div>
        <div className="db-stat">
          <div><div className="db-stat-label">Pending Jobs</div><div className="db-stat-num" style={{color:'#F59E0B'}}>{stats.pendingJobs||0}</div></div>
        </div>
        <div className="db-stat">
          <div><div className="db-stat-label">Job Cards</div><div className="db-stat-num">{stats.jobCards||0}</div></div>
        </div>
        <div className="db-stat">
          <div><div className="db-stat-label">Total Washes</div><div className="db-stat-num" style={{color:'#0891B2'}}>{stats.totalWash||0}</div></div>
        </div>
      </div>
      <div className="card" style={{marginBottom:16}}>
        <div style={{fontFamily:'var(--font-display)',fontSize:18,letterSpacing:1,marginBottom:16}}>SERVICE <span style={{color:'var(--red)'}}>DISTRIBUTION</span></div>
        <DonutChart counts={stats.serviceCounts}/>
      </div>
    </div>)}

    {/* ACTIVE SERVICES (today + future, not completed) */}
    {tab==='pending'&&(<div>
      <div style={{fontFamily:'var(--font-display)',fontSize:20,marginBottom:4}}>ACTIVE <span style={{color:'var(--red)'}}>SERVICES</span> <span style={{fontSize:14,color:'var(--gray)'}}>({activeSvc.length})</span></div>
      <p style={{color:'var(--gray)',fontSize:12,marginBottom:12}}>Today &amp; upcoming service bookings that need attention</p>
      {activeSvc.length===0?<p style={{color:'var(--gray)',textAlign:'center',padding:40}}>No active service bookings</p>:
      activeSvc.map(b=><BRow key={b.id} b={b} section="pending"/>)}
    </div>)}

    {/* COMPLETED (recent) */}
    {tab==='completed'&&(<div>
      <div style={{fontFamily:'var(--font-display)',fontSize:20,marginBottom:12}}>COMPLETED <span style={{color:'var(--red)'}}>BOOKINGS</span></div>
      {completedSvc.length===0?<p style={{color:'var(--gray)',textAlign:'center',padding:40}}>No recently completed bookings</p>:
      completedSvc.map(b=><BRow key={b.id} b={b} section="completed"/>)}
    </div>)}

    {/* ACTIVE WASHING (today + future) */}
    {tab==='washing'&&(<div>
      <div style={{fontFamily:'var(--font-display)',fontSize:20,marginBottom:4}}>ACTIVE <span style={{color:'var(--red)'}}>WASHING</span></div>
      <p style={{color:'var(--gray)',fontSize:12,marginBottom:12}}>Today &amp; upcoming wash appointments</p>
      {activeWash.length===0?<p style={{color:'var(--gray)',textAlign:'center',padding:40}}>No active wash appointments</p>:
      activeWash.map(b=><BRow key={b.id} b={b} section="washing"/>)}
    </div>)}

    {/* JOB CARDS — segregated */}
    {tab==='jobs'&&(<div>
      <div style={{fontFamily:'var(--font-display)',fontSize:20,marginBottom:12}}>JOB <span style={{color:'var(--red)'}}>CARDS</span></div>
      {jcs.length===0?<p style={{color:'var(--gray)',textAlign:'center',padding:40}}>No job cards yet</p>:<>
      <div style={{fontFamily:'var(--font-display)',fontSize:16,marginBottom:8,color:'var(--red)'}}>🛡️ SERVICE JOB CARDS ({jcs.filter(j=>j.service_type!=='wash').length})</div>
      {jcs.filter(j=>j.service_type!=='wash').length===0?<p style={{color:'var(--gray)',fontSize:13,marginBottom:16}}>No service job cards</p>:
      jcs.filter(j=>j.service_type!=='wash').map(jc=><JCCard key={jc.id} jc={jc}/>)}
      <div className="divider"/>
      <div style={{fontFamily:'var(--font-display)',fontSize:16,marginBottom:8,color:'var(--red)'}}>🚿 WASH JOB CARDS ({jcs.filter(j=>j.service_type==='wash').length})</div>
      {jcs.filter(j=>j.service_type==='wash').length===0?<p style={{color:'var(--gray)',fontSize:13}}>No wash job cards</p>:
      jcs.filter(j=>j.service_type==='wash').map(jc=><JCCard key={jc.id} jc={jc}/>)}
      </>}
    </div>)}

    {/* CUSTOMER SHEETS */}
    {tab==='sheets'&&(<div>
      <div style={{fontFamily:'var(--font-display)',fontSize:20,marginBottom:12}}>CUSTOMER <span style={{color:'var(--red)'}}>SERVICE SHEETS</span></div>
      {svcBkgs.length===0?<p style={{color:'var(--gray)',textAlign:'center',padding:40}}>No bookings</p>:
      svcBkgs.map(b=>(
        <div key={b.id} className="card" style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10,marginBottom:8}}>
          <div>
            <div style={{fontFamily:'var(--font-display)',fontSize:16,marginBottom:2}}>TCG-{String(b.id).padStart(3,'0')} — {b.customer_name}</div>
            <div style={{fontSize:13,color:'var(--gray)'}}>{svcLabel(b)} · {formatDate(b.scheduled_date)} · {b.location_name}</div>
          </div>
          <div style={{display:'flex',gap:6}}>
            {badge(b.status)}
            <button className="btn-outline btn-sm" onClick={()=>downloadSheetPDF(b)}>📄 Download</button>
          </div>
        </div>
      ))}
    </div>)}

    {/* TODAY'S LIST */}
    {tab==='today'&&(<div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16,flexWrap:'wrap',gap:10}}>
        <div style={{fontFamily:'var(--font-display)',fontSize:20}}>TODAY'S <span style={{color:'var(--red)'}}>SCHEDULE</span></div>
        <div style={{display:'flex',gap:8}}>
          <button className="btn-outline btn-sm" onClick={()=>downloadTodayListPDF('Wash List',twash)}>📄 Wash PDF</button>
          <button className="btn-outline btn-sm" onClick={()=>downloadTodayListPDF('Service List',tsvc)}>📄 Service PDF</button>
        </div>
      </div>
      <div style={{fontFamily:'var(--font-display)',fontSize:16,marginBottom:8,color:'var(--red)'}}>WASHING ({twash.length})</div>
      {twash.length===0?<p style={{color:'var(--gray)',fontSize:14,marginBottom:16}}>No wash today</p>:
      <div className="table-wrap" style={{marginBottom:20}}>
        <table><thead><tr><th>Ref No</th><th>Customer</th><th>Phone</th><th>Staff</th><th>Time</th><th>Status</th></tr></thead>
        <tbody>{twash.map(r=><tr key={r.id}>
          <td style={{fontFamily:'var(--font-display)',color:'var(--red)'}}>TCG-{String(r.id).padStart(3,'0')}</td>
          <td>{r.customer_name}</td><td>{r.customer_phone}</td>
          <td>{r.staff_name||'—'}</td>
          <td>{formatTime(r.time_slot)}</td><td>{badge(r.status||'pending')}</td>
        </tr>)}</tbody></table>
      </div>}
      <div style={{fontFamily:'var(--font-display)',fontSize:16,marginBottom:8,color:'var(--red)'}}>SERVICES ({tsvc.length})</div>
      {tsvc.length===0?<p style={{color:'var(--gray)',fontSize:14}}>No services today</p>:
      <div className="table-wrap">
        <table><thead><tr><th>Ref No</th><th>Customer</th><th>Phone</th><th>Staff</th><th>Time</th><th>Status</th></tr></thead>
        <tbody>{tsvc.map(r=><tr key={r.id}>
          <td style={{fontFamily:'var(--font-display)',color:'var(--red)'}}>TCG-{String(r.id).padStart(3,'0')}</td>
          <td>{r.customer_name}</td><td>{r.customer_phone}</td>
          <td>{r.staff_name||'—'}</td>
          <td>{formatTime(r.time_slot)}</td><td>{badge(r.status||'pending')}</td>
        </tr>)}</tbody></table>
      </div>}
    </div>)}

    {/* PREVIOUS RECORDS — #3 */}
    {tab==='previous'&&(<div>
      <div style={{fontFamily:'var(--font-display)',fontSize:20,marginBottom:4}}>PREVIOUS <span style={{color:'var(--red)'}}>RECORDS</span></div>
      <p style={{color:'var(--gray)',fontSize:12,marginBottom:12}}>Past bookings (before today) — archived for reference</p>
      <div className="tabs" style={{marginBottom:16}}>
        <button className={`tab${prevSub==='svc'?' active':''}`} onClick={()=>setPrevSub('svc')}>🛡️ Services ({prevSvc.length})</button>
        <button className={`tab${prevSub==='wash'?' active':''}`} onClick={()=>setPrevSub('wash')}>🚿 Washing ({prevWash.length})</button>
        <button className={`tab${prevSub==='done'?' active':''}`} onClick={()=>setPrevSub('done')}>✓ Completed ({prevSvcDone.length})</button>
      </div>
      {prevSub==='svc'&&(<div>
        {prevSvc.length===0?<p style={{color:'var(--gray)',textAlign:'center',padding:32}}>No previous pending services</p>:
        prevSvc.map(b=><BRow key={b.id} b={b} section="previous"/>)}
      </div>)}
      {prevSub==='wash'&&(<div>
        {prevWash.length===0?<p style={{color:'var(--gray)',textAlign:'center',padding:32}}>No previous wash records</p>:
        prevWash.map(b=><BRow key={b.id} b={b} section="prev-wash"/>)}
      </div>)}
      {prevSub==='done'&&(<div>
        {prevSvcDone.length===0?<p style={{color:'var(--gray)',textAlign:'center',padding:32}}>No previous completed services</p>:
        prevSvcDone.map(b=><BRow key={b.id} b={b} section="completed"/>)}
      </div>)}
    </div>)}

    {/* SEARCH */}
    {tab==='search'&&(<div>
      <div style={{fontFamily:'var(--font-display)',fontSize:20,marginBottom:12}}>SEARCH <span style={{color:'var(--red)'}}>BOOKINGS</span></div>
      <div className="field">
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name, phone number, or job card number (TCG-001)..." style={{fontSize:16,padding:'14px 16px'}}/>
      </div>
      {search.trim()&&(<div>
        <p style={{color:'var(--gray)',fontSize:13,marginBottom:10}}>{searchResults.length} result(s) found</p>
        {searchResults.map(b=><BRow key={b.id} b={b} section="search"/>)}
      </div>)}
      {!search.trim()&&<p style={{color:'var(--gray)',textAlign:'center',padding:40}}>Enter a name, phone number, or job card number to search</p>}
    </div>)}
  </div>
</div>);
}
