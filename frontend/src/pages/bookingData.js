export const HOLIDAYS=['2026-01-26','2026-03-25','2026-04-14','2026-04-17','2026-08-15','2026-10-02','2026-10-20','2026-11-04','2026-12-25'];
export const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
export const DAYNAMES=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
export const VTYPES=['Compact','Sedan','Luxury Sedan','SUV','Sports / Exotic'];
export const BRANDS=['Maruti Suzuki','Hyundai','Tata','Mahindra','Kia','Toyota','Honda','MG','Skoda','Volkswagen','BMW','Mercedes-Benz','Audi','Jeep','Renault','Nissan','Ford','Citroen','Lexus','Volvo','Porsche','Jaguar','Land Rover','Mini','Ferrari','Lamborghini','Maserati','Rolls Royce','Bentley','Other'];
export const COLORS=['Pearl White','Solid White','Silver','Grey','Dark Grey','Black','Red','Blue','Navy Blue','Brown','Beige','Gold','Green','Orange','Yellow','Maroon','Other'];
export const YEARS=Array.from({length:17},(_,i)=>String(2026-i));
export const PAYMENTS=['Cash','Cheque / DD','Credit Card','RTGS / NEFT'];
export const WARRANTIES=['2 Years','3 Years','5 Years','Lifetime','No Warranty'];
export const INDIVIDUAL_SVCS=['Headlight Restoration','Dashboard Coating','Wheel Protector','Interior Detailing','Engine Compartment','Leather Protector','Fabric Protector'];
export const INDIVIDUAL_SVC_PRICES={
  'Headlight Restoration':500,'Dashboard Coating':800,'Wheel Protector':600,
  'Interior Detailing':1500,'Engine Compartment':700,'Leather Protector':900,'Fabric Protector':800
};

export function getPriceKey(vtype){
  if(!vtype) return 'price_compact';
  const v=vtype.toLowerCase();
  if(v.includes('compact')) return 'price_compact';
  if(v.includes('luxury')) return 'price_luxury';
  if(v.includes('sedan')) return 'price_sedan';
  if(v.includes('suv')) return 'price_suv';
  if(v.includes('sport')||v.includes('exotic')) return 'price_sports';
  return 'price_compact';
}

export function warrantyFromPkg(pkg){
  if(!pkg) return '';
  if(pkg.warranty_years>=99) return 'Lifetime';
  return pkg.warranty_years+' Years';
}

export function validTillFromPkg(bookingDate, pkg){
  if(!pkg||!bookingDate) return '';
  const d=new Date(bookingDate);
  const yrs=pkg.warranty_years>=99?10:pkg.warranty_years;
  d.setFullYear(d.getFullYear()+yrs);
  return d.toISOString().slice(0,10);
}

// ─── DATE / TIME FORMATTING ───────────────────────────────
export function formatDate(iso){
  if(!iso) return '—';
  const str = String(iso);
  // If it contains 'T', it's an ISO datetime — parse as UTC to avoid timezone shift
  if(str.includes('T')){
    const d = new Date(str);
    return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  }
  // Plain date string like "2026-05-05"
  const parts = str.slice(0,10).split('-');
  if(parts.length!==3) return str;
  const y=parseInt(parts[0]), m=parseInt(parts[1])-1, d=parseInt(parts[2]);
  return `${d} ${MONTHS[m]} ${y}`;
}

export function formatTime(t){
  if(!t) return '—';
  // Handle "10:00", "14:00", "10:00-11:00" etc.
  const raw = String(t).replace(/T.*/, ''); // strip ISO tail
  const slot = String(t);
  // If already a range like "10:00-11:00", convert each part
  if(slot.includes('-') && !slot.includes('T')){
    return slot.split('-').map(p=>{
      const [h,mi]=p.trim().split(':').map(Number);
      if(isNaN(h)) return p;
      const ampm=h>=12?'PM':'AM';
      const hr=h%12||12;
      return mi?`${hr}:${String(mi).padStart(2,'0')} ${ampm}`:`${hr}:00 ${ampm}`;
    }).join(' – ');
  }
  // Single time like "14:00"
  const match = slot.match(/(\d{1,2}):(\d{2})/);
  if(!match) return slot;
  const h=parseInt(match[1]),mi=parseInt(match[2]);
  const ampm=h>=12?'PM':'AM';
  const hr=h%12||12;
  return mi?`${hr}:${String(mi).padStart(2,'0')} ${ampm}`:`${hr}:00 ${ampm}`;
}

export function formatDateTime(iso){
  if(!iso) return '—';
  const datePart = formatDate(iso);
  // If has time component
  const str = String(iso);
  if(str.includes('T')){
    const timePart = str.split('T')[1];
    if(timePart){
      const match = timePart.match(/(\d{1,2}):(\d{2})/);
      if(match){
        return `${datePart}, ${formatTime(match[0])}`;
      }
    }
  }
  return datePart;
}
