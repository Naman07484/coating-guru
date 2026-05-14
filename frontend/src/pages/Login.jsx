import { useState, useRef, useEffect } from 'react';
import { registerUser, loginUser, verifyOTP } from '../api';
import { useNavigate } from 'react-router-dom';

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'otp'
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const nav = useNavigate();

  // LOGIN
  const handleLogin = async () => {
    if (!phone || phone.length < 8) return setError('Enter a valid phone number');
    if (!password) return setError('Enter password');
    setLoading(true); setError('');
    try {
      const res = await loginUser(phone, password);
      onLogin(res.data.token, res.data.user);
      nav('/customer');
    } catch (e) { setError(e.response?.data?.error || 'Login failed'); }
    setLoading(false);
  };

  // REGISTER → sends OTP
  const handleRegister = async () => {
    if (!name.trim()) return setError('Enter your name');
    if (!phone || phone.length < 8) return setError('Enter a valid phone number');
    if (!password || password.length < 4) return setError('Password must be at least 4 characters');
    setLoading(true); setError('');
    try {
      await registerUser({ name: name.trim(), phone, password });
      setMode('otp'); setPin('');
    } catch (e) { setError(e.response?.data?.error || 'Registration failed'); }
    setLoading(false);
  };

  // OTP PIN
  const handlePinKey = (k) => {
    if (k === 'clear') { setPin(''); return; }
    if (k === 'back') { setPin(p => p.slice(0, -1)); return; }
    if (pin.length >= 4) return;
    const next = pin + k;
    setPin(next);
    if (next.length === 4) setTimeout(() => doVerify(next), 200);
  };

  const doVerify = async (code) => {
    setLoading(true); setError('');
    try {
      const res = await verifyOTP(phone, code);
      onLogin(res.data.token, res.data.user);
      nav('/customer');
    } catch { setError('Invalid OTP — Demo: 1234'); setPin(''); }
    setLoading(false);
  };

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--black)',backgroundImage:'radial-gradient(ellipse 50% 40% at 50% 0%,rgba(220,38,38,.1) 0%,transparent 70%)',padding:24}}>
      <div style={{background:'var(--black-3)',border:'1px solid var(--black-4)',borderTop:'2px solid var(--red)',borderRadius:4,padding:40,maxWidth:400,width:'100%',textAlign:'center'}}>
        <h1 style={{fontFamily:'var(--font-display)',fontSize:34,letterSpacing:2,marginBottom:4}}>THE <span style={{color:'var(--red)'}}>COATING</span> GURU</h1>
        <p style={{color:'var(--gray)',fontSize:13,marginBottom:24}}>
          {mode==='login'?'Login to your account':mode==='register'?'Create your account':'Verify your number'}
        </p>

        {/* LOGIN */}
        {mode==='login' && (<>
          <div className="field" style={{textAlign:'left'}}>
            <label className="field-label">Mobile Number</label>
            <input type="tel" placeholder="9876543210" value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g,'').slice(0,12))} onKeyDown={e=>e.key==='Enter'&&handleLogin()}/>
          </div>
          <div className="field" style={{textAlign:'left'}}>
            <label className="field-label">Password</label>
            <input type="password" placeholder="Enter password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleLogin()}/>
          </div>
          {error && <div style={{color:'var(--red-bright)',fontSize:12,marginBottom:10}}>{error}</div>}
          <button className="btn-red" style={{width:'100%'}} onClick={handleLogin} disabled={loading}>
            {loading ? 'LOGGING IN...' : 'LOGIN'}
          </button>
          <div style={{marginTop:16,fontSize:13,color:'var(--gray)'}}>
            Don't have an account? <span style={{color:'var(--red)',cursor:'pointer',fontWeight:600}} onClick={()=>{setMode('register');setError('');}}>Register</span>
          </div>
          <div style={{marginTop:16,paddingTop:14,borderTop:'1px solid var(--black-4)'}}>
            <button className="btn-ghost" style={{width:'100%'}} onClick={()=>nav('/admin')}>⚙ ADMIN LOGIN</button>
          </div>
        </>)}

        {/* REGISTER */}
        {mode==='register' && (<>
          <div className="field" style={{textAlign:'left'}}>
            <label className="field-label field-required">Full Name</label>
            <input placeholder="Your full name" value={name} onChange={e=>setName(e.target.value)}/>
          </div>
          <div className="field" style={{textAlign:'left'}}>
            <label className="field-label field-required">Mobile Number</label>
            <input type="tel" placeholder="9876543210" value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g,'').slice(0,12))}/>
          </div>
          <div className="field" style={{textAlign:'left'}}>
            <label className="field-label field-required">Create Password</label>
            <input type="password" placeholder="Min 4 characters" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleRegister()}/>
          </div>
          {error && <div style={{color:'var(--red-bright)',fontSize:12,marginBottom:10}}>{error}</div>}
          <button className="btn-red" style={{width:'100%'}} onClick={handleRegister} disabled={loading}>
            {loading ? 'REGISTERING...' : 'REGISTER & SEND OTP'}
          </button>
          <div style={{marginTop:16,fontSize:13,color:'var(--gray)'}}>
            Already have an account? <span style={{color:'var(--red)',cursor:'pointer',fontWeight:600}} onClick={()=>{setMode('login');setError('');}}>Login</span>
          </div>
        </>)}

        {/* OTP */}
        {mode==='otp' && (<>
          <p style={{color:'var(--gray)',fontSize:12,marginBottom:4}}>OTP sent to <span style={{color:'var(--white)'}}>{phone}</span></p>
          <p style={{color:'var(--red)',fontSize:11,marginBottom:4}}>[DEMO: Use 1234]</p>
          {error && <div style={{color:'var(--red-bright)',fontSize:12,margin:'8px 0'}}>{error}</div>}
          <div className="pin-display">
            {[0,1,2,3].map(i => (
              <div key={i} className={`pin-dot${i<pin.length?' filled':''}`}>{i<pin.length?'●':'_'}</div>
            ))}
          </div>
          <div className="numpad">
            {['1','2','3','4','5','6','7','8','9'].map(n=>(
              <button key={n} className="numpad-btn" onClick={()=>handlePinKey(n)} disabled={loading}>{n}</button>
            ))}
            <button className="numpad-btn" style={{fontSize:13}} onClick={()=>handlePinKey('clear')}>CLR</button>
            <button className="numpad-btn" onClick={()=>handlePinKey('0')}>0</button>
            <button className="numpad-btn" style={{color:'var(--red)'}} onClick={()=>handlePinKey('back')}>⌫</button>
          </div>
          {loading && <div style={{marginTop:12,color:'var(--gray)',fontSize:12}}>Verifying...</div>}
          <button className="btn-ghost" style={{width:'100%',marginTop:14}} onClick={()=>{setMode('register');setPin('');setError('');}}>← Back to Register</button>
        </>)}
      </div>
    </div>
  );
}
