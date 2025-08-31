import React, { useEffect, useState } from 'react';
import api from '../api.js';

function Item({ r, onAccept, onReject }) {
  const other = r.from?._id && r.to?._id ? (r.from?._id === r.to?._id ? r.to : r.from) : r.from;
  const name = other?.name || 'User';
  const avatar = other?.avatarUrl || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}`;

  return (
    <div className="rounded-2xl p-3 flex items-center justify-between bg-slate-900/80 border border-white/10">
      <div className="flex items-center gap-3">
        <img src={avatar} alt={name} className="w-10 h-10 rounded-full" />
        <div>
          <div className="font-medium text-white">{name}</div>
          <div className="text-xs text-slate-400 capitalize">Status: {r.status}</div>
        </div>
      </div>
      {r.status === 'pending' && r.to?._id && (
        <div className="flex gap-2">
          <button className="px-3 py-1 rounded-xl border border-white/20 text-slate-200 hover:bg-white/5" onClick={() => onReject(r)}>Reject</button>
          <button className="px-3 py-1 rounded-xl bg-brand-500 hover:bg-brand-400 text-white" onClick={() => onAccept(r)}>Accept</button>
        </div>
      )}
    </div>
  );
}

export default function Requests() {
  const [inbox, setInbox] = useState([]);
  const [outbox, setOutbox] = useState([]);

  const load = async () => {
    const [inRes, outRes] = await Promise.all([
      api.get('/requests', { params: { box: 'inbox' } }),
      api.get('/requests', { params: { box: 'outbox' } })
    ]);
    setInbox(inRes.data);
    setOutbox(outRes.data);
  };

  useEffect(() => { load(); }, []);
  const accept = async (r) => { await api.post(`/requests/${r._id}/accept`); load(); };
  const reject = async (r) => { await api.post(`/requests/${r._id}/reject`); load(); };

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div>
        <h2 className="text-xl font-semibold mb-2 text-white">Inbox</h2>
        <div className="space-y-2">{inbox.map(r => <Item key={r._id} r={r} onAccept={accept} onReject={reject} />)}</div>
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-2 text-white">Outbox</h2>
        <div className="space-y-2">{outbox.map(r => <Item key={r._id} r={r} onAccept={accept} onReject={reject} />)}</div>
      </div>
    </div>
  );
}