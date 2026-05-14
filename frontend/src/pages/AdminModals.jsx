import{useState,useEffect}from'react';
import{getJobCard,createJobCard,getBookingDetail}from'../api';
import{formatDate,formatTime}from'./bookingData';

const JC_SVCS=['TCG Crystal Series','TCG Silver Series','TCG Elite Series','TCG Ultra Series','TCG Top Coat','Headlight Restoration','Dashboard Coating','Wheel Protector','Interior Detailing','Engine Compartment','Leather Protector','Fabric Protector','Re-Visit'];
const CONDITIONS=['1 — Brand New','2 — Good Condition','3 — Fair Condition','4 — Poor Condition','Paint Touch-up Required'];
const JC_WARR=['2 Years','3 Years','5 Years','Lifetime','No Warranty','2 Year Coating','3 Year Coating','5 Year Coating','Lifetime Coating (10 year)','Onetime','5 Years PPF','7 Years PPF'];

// ── SERVICE JOB CARD MODAL ──────────────────────────────────
export function ServiceJCModal({bid,onClose,onSaved,showToast}){
  const[tech,setTech]=useState('');
  const[tStart,setTStart]=useState('');
  const[tEnd,setTEnd]=useState('');
  const[cond,setCond]=useState('');
  const[warr,setWarr]=useState(JC_WARR[0]);
  const[notes,setNotes]=useState('');
  const[checked,setChecked]=useState({});
  const[bkgInfo,setBkgInfo]=useState(null);// booking info for display

  useEffect(()=>{
    const init={};JC_SVCS.forEach(s=>init[s]=false);setChecked(init);
    if(!bid)return;
    // Load existing JC or booking detail for autofill
    getJobCard(bid).then(r=>{
      if(r.data){
        const d=r.data;
        setTech(d.technician||'');setTStart(d.time_start||'');setTEnd(d.time_finish||'');
        setCond(d.condition_rating||'');setNotes(d.notes||d.booking_notes||'');
        setWarr(d.warranty||d.booking_warranty||JC_WARR[0]);
        let cl=d.checklist;if(typeof cl==='string')try{cl=JSON.parse(cl)}catch{cl={}}
        // Autofill checklist from booking services if JC checklist empty
        let filled={...init,...(cl||{})};
        const allFalse=Object.values(filled).every(v=>!v);
        if(allFalse&&d.services){
          let svcs=d.services;if(typeof svcs==='string')try{svcs=JSON.parse(svcs)}catch{svcs=[];}
          svcs.forEach(s=>{if(init[s]!==undefined)filled[s]=true;});
          // Also check package name
          if(d.package_name)JC_SVCS.forEach(s=>{if(s.toLowerCase().includes((d.package_name||'').toLowerCase().replace('tcg ','').trim()))filled[s]=true;});
        }
        setChecked(filled);
        setBkgInfo(d);
      } else {
        // No JC yet — load booking detail for autofill
        getBookingDetail(bid).then(r2=>{
          if(!r2.data)return;
          const d=r2.data;
          setNotes(d.notes||'');setWarr(d.warranty||d.booking_warranty||JC_WARR[0]);
          let svcs=d.services;if(typeof svcs==='string')try{svcs=JSON.parse(svcs)}catch{svcs=[];}
          const filled={...init};
          svcs.forEach(s=>{if(filled[s]!==undefined)filled[s]=true;});
          if(d.package_name)JC_SVCS.forEach(s=>{if(s.toLowerCase().includes((d.package_name||'').toLowerCase().replace('tcg ','').trim()))filled[s]=true;});
          setChecked(filled);setBkgInfo(d);
        }).catch(()=>{});
      }
    }).catch(()=>{});
  },[bid]);

  const save=async()=>{
    await createJobCard({booking_id:parseInt(bid),checklist:checked,car_condition:{},notes,technician:tech,time_start:tStart,time_finish:tEnd,condition_rating:cond,warranty:warr});
    showToast('Saved','Job card saved');onSaved();onClose();
  };

  return(
  <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
    <div className="modal">
      <div className="modal-header">
        <div className="modal-title">SERVICE JOB SHEET</div>
        <button className="modal-close" onClick={onClose}>✕</button>
      </div>
      <div className="modal-body">
        {bkgInfo&&<div style={{background:'var(--black-4)',padding:'8px 12px',borderRadius:2,marginBottom:14,fontSize:13}}>
          <span style={{color:'var(--red)',fontWeight:700}}>TCG-{String(bid).padStart(3,'0')}</span>
          {' · '}{bkgInfo.customer_name} · {bkgInfo.customer_phone}
          {' · '}{bkgInfo.vehicle_make} {bkgInfo.vehicle_model} ({bkgInfo.vehicle_regn})
          {' · '}{formatDate(bkgInfo.scheduled_date)} {formatTime(bkgInfo.time_slot)}
        </div>}
        <div className="form-grid" style={{marginBottom:14}}>
          <div className="field"><label className="field-label">Booking Ref</label><input value={'TCG-'+String(bid).padStart(3,'0')} readOnly style={{opacity:.6}}/></div>
          <div className="field"><label className="field-label">Technician</label><input value={tech} onChange={e=>setTech(e.target.value)} placeholder="Worker name"/></div>
        </div>
        <label className="field-label" style={{display:'block',marginBottom:8}}>Vehicle Condition</label>
        <div className="cond-grid" style={{marginBottom:14}}>
          {CONDITIONS.map(c=>(<div key={c} className={`cond-item${cond===c?' selected':''}`} onClick={()=>setCond(c)}>
            <input type="radio" name="cond" checked={cond===c} readOnly/><label style={{fontSize:13}}>{c}</label>
          </div>))}
        </div>
        <label className="field-label" style={{display:'block',marginBottom:8}}>Services Checklist <span style={{color:'var(--gray)',fontWeight:400}}>(auto-filled from booking)</span></label>
        <div className="check-grid" style={{marginBottom:14}}>
          {JC_SVCS.map(s=>(<div key={s} className={`check-item${checked[s]?' checked':''}`} style={{padding:'7px 10px'}} onClick={()=>setChecked(p=>({...p,[s]:!p[s]}))}>
            <input type="checkbox" checked={!!checked[s]} readOnly/><label style={{fontSize:13}}>{s}</label>
          </div>))}
        </div>
        <div className="field"><label className="field-label">Warranty</label>
          <select value={warr} onChange={e=>setWarr(e.target.value)}>
            {JC_WARR.map(w=><option key={w}>{w}</option>)}
          </select>
        </div>
        <div className="field"><label className="field-label">Notes</label><textarea rows={3} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Paint condition, special requests..."/></div>
      </div>
      <div className="modal-footer">
        <button className="btn-red" onClick={save}>SAVE JOB CARD</button>
        <button className="btn-ghost" onClick={onClose}>CANCEL</button>
      </div>
    </div>
  </div>);
}

// ── WASH JOB CARD MODAL ─────────────────────────────────────
export function WashJCModal({booking,washNumber,onClose,onSaved,showToast}){
  const[tech,setTech]=useState('');

  const save=async()=>{
    await createJobCard({
      booking_id:parseInt(booking.id),checklist:{'Free Car Wash':true},
      car_condition:{},notes:`Free wash #${washNumber}`,
      technician:tech,time_start:booking.time_slot,time_finish:'',condition_rating:'',
      warranty:'No Warranty'
    });
    showToast('Saved','Wash job card saved');onSaved();onClose();
  };

  const b=booking;
  return(
  <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
    <div className="modal">
      <div className="modal-header">
        <div className="modal-title">WASH JOB CARD</div>
        <button className="modal-close" onClick={onClose}>✕</button>
      </div>
      <div className="modal-body">
        <div style={{display:'grid',gap:8,fontSize:14,marginBottom:16}}>
          {[['Customer',b.customer_name],['Phone',b.customer_phone],['Address',b.customer_address||b.user_address||'—'],
            ['Vehicle',`${b.vehicle_make||''} ${b.vehicle_model||''}`],['Reg No',b.vehicle_regn||'—'],
            ['Package',b.package_name||'WASHING'],['Location',b.location_name],
            ['Free Wash #',`Wash ${washNumber} of 2`],
            ['Date',formatDate(b.scheduled_date)],['Time',formatTime(b.time_slot)]
          ].map(([l,v])=>(<div key={l} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid var(--black-4)'}}>
            <span style={{color:'var(--gray)'}}>{l}</span><span style={{fontWeight:600}}>{v||'—'}</span>
          </div>))}
        </div>
        <div className="field"><label className="field-label field-required">Job Assigned To (Worker Name)</label>
          <input value={tech} onChange={e=>setTech(e.target.value)} placeholder="Worker name"/>
        </div>
      </div>
      <div className="modal-footer">
        <button className="btn-red" onClick={save}>SAVE WASH JOB CARD</button>
        <button className="btn-ghost" onClick={onClose}>CANCEL</button>
      </div>
    </div>
  </div>);
}
