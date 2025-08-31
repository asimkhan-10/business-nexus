import React, { useEffect, useState } from 'react';
import api from '../api.js';
import { Link } from 'react-router-dom';

function ProfileCard({ u, onConnect }) {
  return (
    <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4">
      <div className="flex items-center gap-3">
        <img
          src={u.avatarUrl || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(u.name)}`}
          alt={u.name}
          className="w-12 h-12 rounded-full"
        />
        <div>
          <div className="font-semibold text-white">{u.name}</div>
          <div className="text-xs text-slate-400 capitalize">{u.role}</div>
        </div>
      </div>
      <p className="mt-3 text-sm text-slate-300 line-clamp-3">{u.bio}</p>
      <div className="mt-3 flex flex-wrap gap-1">
        {u.sectors?.slice(0,4).map(s => (
          <span key={s} className="text-xs bg-slate-800 border border-white/10 px-2 py-1 rounded text-slate-200">{s}</span>
        ))}
      </div>
      <div className="mt-4 flex justify-between">
        <button onClick={() => onConnect(u)} className="px-3 py-1 rounded-xl border border-white/20 text-slate-200 hover:bg-white/5 text-sm">
          Connect
        </button>
        <Link to={`/chat/${u._id}`} className="px-3 py-1 rounded-xl bg-brand-500 hover:bg-brand-400 text-white text-sm">
          Message
        </Link>
      </div>
    </div>
  );
}

export default function Profiles() {
  const [list, setList] = useState([]);
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  const fetchProfiles = async () => {
    setLoading(true);
    const { data } = await api.get('/profiles', { params: { q, role } });
    setList(data);
    setLoading(false);
  };

  useEffect(() => { fetchProfiles(); }, []);

  const handleConnect = async (u) => {
    try {
      await api.post('/requests', { to: u._id });
      setToast(`Request sent to ${u.name}`);
    } catch (e) {
      setToast(e.response?.data?.error || 'Failed to send request');
    } finally {
      setTimeout(() => setToast(''), 2500);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4 text-white">Explore profiles</h1>
      {toast && <div className="mb-3 text-sm bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 p-2 rounded-xl">{toast}</div>}
      <div className="flex gap-2 mb-4">
        <input
          className="flex-1 rounded-xl px-3 py-2 bg-slate-900/80 border border-white/10 placeholder:text-slate-400 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          placeholder="Search by name, skills, sectors"
          value={q}
          onChange={e => setQ(e.target.value)}
        />
        <select
          className="rounded-xl px-3 py-2 bg-slate-900/80 border border-white/10 text-white"
          value={role}
          onChange={e => setRole(e.target.value)}
        >
          <option value="">All roles</option>
          <option value="investor">Investor</option>
          <option value="entrepreneur">Entrepreneur</option>
        </select>
        <button onClick={fetchProfiles} className="px-3 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-white">
          Search
        </button>
      </div>
      {loading ? (
        <div className="text-slate-300">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {list.map(u => <ProfileCard key={u._id} u={u} onConnect={handleConnect} />)}
        </div>
      )}
    </div>
  );
}
