import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import Login from './components/Login.jsx';
import Register from './components/Register.jsx';
import Profiles from './pages/Profiles.jsx';
import ChatPage from './pages/ChatPage.jsx';
import Dashboard from './pages/Dashboard.jsx';
import NotFound from './pages/NotFound.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Requests from './pages/Requests.jsx';

const Navbar = () => {
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem('token'));
  const navigate = useNavigate();

  useEffect(() => {
    const onStorage = () => setLoggedIn(!!localStorage.getItem('token'));
    window.addEventListener('storage', onStorage);
    const t = setInterval(onStorage, 400);
    return () => { window.removeEventListener('storage', onStorage); clearInterval(t); };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setLoggedIn(false);
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 backdrop-blur bg-slate-900/70 border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="font-bold text-xl tracking-tight">
          <span className="text-white">Business</span><span className="text-brand-400"> Nexus</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/profiles" className="text-sm text-slate-200/80 hover:text-white">Profiles</Link>
          <Link to="/requests" className="text-sm text-slate-200/80 hover:text-white">Requests</Link>
          <Link to="/chat" className="text-sm text-slate-200/80 hover:text-white">Chat</Link>
          {loggedIn ? (
            <button onClick={handleLogout} className="text-sm px-3 py-1 rounded-xl bg-brand-500 hover:bg-brand-400 text-white shadow-soft">
              Logout
            </button>
          ) : (
            <Link to="/login" className="text-sm px-3 py-1 rounded-xl bg-brand-500 hover:bg-brand-400 text-white shadow-soft">Login</Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-6xl mx-auto p-4">
        <Routes>
          <Route path="/" element={<Dashboard/>} />
          <Route path="/login" element={<Login/>} />
          <Route path="/register" element={<Register/>} />
          <Route path="/profiles" element={<ProtectedRoute><Profiles/></ProtectedRoute>} />
          <Route path="/requests" element={<ProtectedRoute><Requests/></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><ChatPage/></ProtectedRoute>} />
          <Route path="/chat/:userId" element={<ProtectedRoute><ChatPage/></ProtectedRoute>} />
          <Route path="*" element={<NotFound/>} />
        </Routes>
      </div>
    </div>
  );
}
