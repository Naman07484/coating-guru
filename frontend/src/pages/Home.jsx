import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const PACKAGES = [
  { name:'TCG Crystal Series', warranty:'2 Year Warranty', features:['2 Coat Crystal Coating','Windshield Protection','Wheel Protection','Trim Protection'] },
  { name:'TCG Silver Series',  warranty:'3 Year Warranty', features:['2 Coat Silver Coating','Windshield Protection','Wheel Protector','Trim Protection'] },
  { name:'TCG Elite Series',   warranty:'5 Year Warranty', features:['2 Coat Elite Coating','Windshield Protection','Wheel Protector','Trim Protection'] },
  { name:'TCG Ultra Series',   warranty:'Lifetime Warranty', features:['2 Coat Ultra Coating','Full Protection Suite','Windshield + Wheel + Trim','Priority Service'], popular:true },
  { name:'TCG Top Coat',       warranty:'2 Year Warranty', features:['Leather Coating','Fabric Coating','Dashboard Coating','Door Panels Coating'] },
];

const SERVICES = [
  { icon:'🛡️', name:'Ceramic Coating',            desc:'9H hardness, UV protection, self-cleaning nano technology' },
  { icon:'⚡', name:'Graphene Coating',            desc:'Next-gen graphene matrix, heat dissipation, superior durability' },
  { icon:'🎯', name:'Paint Protection Film (PPF)', desc:'Self-healing film, stonechip protection, invisible shield' },
  { icon:'✨', name:'Car Detailing',               desc:'Machine polishing, clay bar, full exterior restoration' },
  { icon:'🏠', name:'Interior Cleaning',           desc:'Seat shampooing, leather protection, AC vent cleaning' },
];

const LOCATIONS = [
  { name:'Race Course Studio',  addr:'SB 9-13, Race Course Tower, Opposite Citi Bank, Near Natubhai Circle, Vadodara – 391101' },
  { name:'Brookfield Studio',   addr:'Brookfield, Navayard Rd, Next to MG TechApollo, Ram Wadi, Vadodara – 390020' },
  { name:'Manjalpur Studio',    addr:'GF-3/4 Srikunj Height, Beside Bakers Hospital, Manjalpur GIDC Road, Vadodara' },
];

export default function Home() {
  const nav = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div>
      {/* NAV */}
      <nav id="tcg-nav">
        <div className="nav-logo">THE <span>COATING</span> GURU</div>
        <div className="nav-links">
          <button className="nav-btn" onClick={() => document.getElementById('sec-pkgs').scrollIntoView({behavior:'smooth'})}>Packages</button>
          <button className="nav-btn" onClick={() => document.getElementById('sec-locs').scrollIntoView({behavior:'smooth'})}>Locations</button>
          <button className="btn-red btn-sm" style={{marginLeft:8}} onClick={() => nav('/login')}>BOOK NOW</button>
        </div>
        <button className="nav-hamburger" onClick={() => setMenuOpen(o => !o)}>{menuOpen ? '✕' : '☰'}</button>
      </nav>

      {/* Mobile menu */}
      <div className={`nav-mobile-menu${menuOpen ? ' open' : ''}`}>
        <button className="nav-mobile-btn" onClick={() => {document.getElementById('sec-pkgs').scrollIntoView({behavior:'smooth'});setMenuOpen(false);}}>📦 Packages</button>
        <button className="nav-mobile-btn" onClick={() => {document.getElementById('sec-locs').scrollIntoView({behavior:'smooth'});setMenuOpen(false);}}>📍 Locations</button>
        <button className="nav-mobile-btn" onClick={() => {nav('/login');setMenuOpen(false);}}>🚗 Book Now</button>
      </div>

      {/* HERO */}
      <div className="hero">
        <div className="hero-eyebrow">Premium Car Care · Vadodara</div>
        <h1 className="hero-title">THE<br/><span>COATING</span><br/>GURU</h1>
        <p className="hero-sub">India's finest ceramic &amp; graphene coating specialists. Protect your investment, elevate your drive.</p>
        <div className="hero-cta">
          <button className="btn-red" onClick={() => nav('/login')}>BOOK A SERVICE</button>
          <button className="btn-outline" onClick={() => document.getElementById('sec-pkgs').scrollIntoView({behavior:'smooth'})}>VIEW PACKAGES</button>
        </div>
        <div className="hero-stats">
          <div className="stat-cell"><div className="stat-num">500+</div><div className="stat-label">Cars Coated</div></div>
          <div className="stat-cell"><div className="stat-num">5★</div><div className="stat-label">Rating</div></div>
          <div className="stat-cell"><div className="stat-num">8yr</div><div className="stat-label">Experience</div></div>
        </div>
      </div>

      {/* SERVICES */}
      <div className="section">
        <div className="section-title">OUR <span>SERVICES</span></div>
        <div className="section-sub">Comprehensive protection for every vehicle</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:12}}>
          {SERVICES.map(s => (
            <div key={s.name} className="card card-red-top">
              <div style={{fontSize:28,marginBottom:8}}>{s.icon}</div>
              <div style={{fontFamily:'var(--font-display)',fontSize:18,letterSpacing:1,marginBottom:6}}>{s.name}</div>
              <div style={{fontSize:12,color:'var(--gray)',lineHeight:1.6}}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* PACKAGES */}
      <div className="section" id="sec-pkgs">
        <div className="section-title">TCG <span>PACKAGES</span></div>
        <div className="section-sub">Choose the protection tier that suits your lifestyle</div>
        <div className="pkg-grid">
          {PACKAGES.map(p => (
            <div key={p.name} className={`pkg-card card-red-top${p.popular?' selected':''}`}>
              {p.popular && <div className="pkg-badge">POPULAR</div>}
              <div className="pkg-name">{p.name.replace('TCG ','')}</div>
              <div className="pkg-warranty" style={p.warranty==='Lifetime Warranty'?{background:'var(--red-bright)'}:{}}>{p.warranty}</div>
              <ul className="pkg-features">{p.features.map(f => <li key={f}>{f}</li>)}</ul>
            </div>
          ))}
        </div>
        <div style={{textAlign:'center',marginTop:28}}>
          <button className="btn-red" onClick={() => nav('/login')}>BOOK YOUR PACKAGE →</button>
        </div>
      </div>

      {/* LOCATIONS */}
      <div className="section" id="sec-locs">
        <div className="section-title">OUR <span>LOCATIONS</span></div>
        <div className="section-sub">Three premium studios across Vadodara</div>
        <div className="loc-grid">
          {LOCATIONS.map(l => (
            <div key={l.name} className="card">
              <h3 style={{fontFamily:'var(--font-display)',fontSize:18,color:'var(--red)',marginBottom:6}}>{l.name}</h3>
              <p style={{fontSize:13,color:'var(--gray)',lineHeight:1.6}}>{l.addr}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FOOTER */}
      <div style={{borderTop:'1px solid var(--black-4)',padding:'22px 24px',textAlign:'center'}}>
        <p style={{fontSize:12,color:'var(--gray-2)'}}>© 2024 The Coating Guru · All Rights Reserved · WhatsApp: 9316668760</p>
      </div>
    </div>
  );
}
