import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import Home from './pages/Home';
import Login from './pages/Login';
import CustomerApp from './pages/CustomerApp';
import AdminPanel from './pages/AdminPanel';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  const handleLogin = (tok, user) => {
    localStorage.setItem('token', tok);
    localStorage.setItem('user', JSON.stringify(user));
    setToken(tok);
  };

  const handleLogout = () => {
    localStorage.clear();
    setToken(null);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"         element={<Home />} />
        <Route path="/login"    element={token ? <Navigate to="/customer" /> : <Login onLogin={handleLogin} />} />
        <Route path="/customer/*" element={token ? <CustomerApp onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/admin/*"  element={<AdminPanel />} />
      </Routes>
    </BrowserRouter>
  );
}
