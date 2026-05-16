import{useState,useEffect}from'react';
import{Routes,Route,useNavigate,useLocation}from'react-router-dom';
import ProfileSetup from'./ProfileSetup';
import BookingWizard from'./BookingWizard';
import MyBookings from'./MyBookings';

export default function CustomerApp({onLogout}){
const nav=useNavigate();
const loc=useLocation();
const user=JSON.parse(localStorage.getItem('user')||'{}');
const[open,setOpen]=useState(false);
const[theme,setTheme]=useState(localStorage.getItem('tcg-theme')||'dark');
const isActive=(p)=>loc.pathname.includes(p);
const go=(p)=>{nav(p);setOpen(false);};
const toggleTheme=()=>{const t=theme==='dark'?'light':'dark';setTheme(t);document.documentElement.setAttribute('data-theme',t);localStorage.setItem('tcg-theme',t);};
// Apply theme on mount
useEffect(()=>{if(theme==='light')document.documentElement.setAttribute('data-theme','light');},[]);

return(
<div>
  <nav id="tcg-nav">
    <div className="nav-logo" onClick={()=>nav('/customer')} style={{cursor:'pointer'}}>THE <span>COATING</span> GURU</div>
    {/* Desktop nav */}
    <div className="nav-links">
      <button className="nav-btn" onClick={()=>nav('/')}>Home</button>
      <button className={`nav-btn${isActive('/book')?' active':''}`} style={isActive('/book')?{color:'var(--white)'}:{}} onClick={()=>nav('/customer/book')}>Book Now</button>
      <button className={`nav-btn${isActive('/bookings')?' active':''}`} style={isActive('/bookings')?{color:'var(--white)'}:{}} onClick={()=>nav('/customer/bookings')}>My Bookings</button>
      <button className="nav-btn" onClick={toggleTheme}>{theme==='dark'?'☀️ Light':'🌙 Dark'}</button>
      <button className="nav-btn" onClick={onLogout}>Logout</button>
    </div>
    <button className="nav-hamburger" onClick={()=>setOpen(o=>!o)}>{open?'✕':'☰'}</button>
  </nav>

  {/* Mobile menu */}
  <div className={`nav-mobile-menu${open?' open':''}`}>
    <button className="nav-mobile-btn" onClick={()=>go('/')}>🏠 Home</button>
    <button className="nav-mobile-btn" onClick={()=>go('/customer/book')}>🚗 Book Now</button>
    <button className="nav-mobile-btn" onClick={()=>go('/customer/bookings')}>📋 My Bookings</button>
    <button className="nav-mobile-btn" onClick={()=>{onLogout();setOpen(false);}}>🚪 Logout</button>
    <button className="nav-mobile-btn" onClick={()=>{toggleTheme();setOpen(false);}}>{theme==='dark'?'☀️ Light Mode':'🌙 Dark Mode'}</button>
  </div>

  <div className="page-top">
    <Routes>
      <Route index element={
        <div style={{padding:'80px 20px 40px',textAlign:'center',maxWidth:600,margin:'0 auto'}}>
          <h1 style={{fontFamily:'var(--font-display)',fontSize:36,letterSpacing:2,marginBottom:8}}>
            WELCOME, <span style={{color:'var(--red)'}}>{user.name||'CUSTOMER'}</span>
          </h1>
          <p style={{color:'var(--gray)',fontSize:15,marginBottom:36}}>What would you like to do today?</p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:14}}>
            <div className="card" style={{cursor:'pointer',textAlign:'center',padding:32}} onClick={()=>nav('/customer/book')}>
              <div style={{fontSize:40,marginBottom:8}}>🚗</div>
              <div style={{fontFamily:'var(--font-display)',fontSize:22,marginBottom:4}}>BOOK A SERVICE</div>
              <div style={{fontSize:14,color:'var(--gray)'}}>Detailing, coating or wash</div>
            </div>
            <div className="card" style={{cursor:'pointer',textAlign:'center',padding:32}} onClick={()=>nav('/customer/bookings')}>
              <div style={{fontSize:40,marginBottom:8}}>📋</div>
              <div style={{fontFamily:'var(--font-display)',fontSize:22,marginBottom:4}}>MY BOOKINGS</div>
              <div style={{fontSize:14,color:'var(--gray)'}}>View history, PDFs & washes</div>
            </div>
          </div>
        </div>
      }/>
      <Route path="profile-setup" element={<ProfileSetup/>}/>
      <Route path="book" element={<BookingWizard/>}/>
      <Route path="bookings" element={<MyBookings/>}/>
    </Routes>
  </div>
</div>
);}
