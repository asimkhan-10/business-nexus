import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../api.js';

export default function ChatPage() {
  const params = useParams();
  const navigate = useNavigate();

  const [me, setMe] = useState(null);
  const [convos, setConvos] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);

  const socketRef = useRef(null);
  const listRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const prevActiveIdRef = useRef(null); // NEW: remember previous open thread

  // load my profile
  useEffect(() => {
    api.get('/profiles/me').then(({ data }) => setMe(data));
  }, []);

  // helper: load recent and force some ids' unread = 0 (prevents flicker)
  const loadConvos = async (forceZeroIds = []) => {
    const { data } = await api.get('/messages/recent');
    data.sort((a, b) => new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt));
    const forceSet = new Set(Array.isArray(forceZeroIds) ? forceZeroIds : [forceZeroIds].filter(Boolean));
    const fixed = data.map(c =>
      forceSet.has(c.otherUser._id) ? { ...c, unreadCount: 0 } : c
    );
    setConvos(fixed);
  };

  useEffect(() => { loadConvos(); }, []);

  // connect socket
  useEffect(() => {
    const token = localStorage.getItem('token');
    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000', {
      auth: { token }
    });
    socketRef.current = socket;

    const onPrivate = async (msg) => {
      const activeId = activeUser?._id;

      // if message belongs to the open thread, append it
      if (activeId && (msg.from === activeId || msg.to === activeId)) {
        setMessages(m => [...m, msg]);

        // if it was sent TO me while viewing this thread, mark-read then refresh
        if (msg.from === activeId && msg.to === me?._id) {
          try { await api.put(`/messages/mark-read/${activeId}`); } catch {}
          await loadConvos([activeId]); // keep active at 0
          return; // avoid extra refresh below
        }
      }

      // otherwise just refresh (but keep active at 0)
      await loadConvos([activeId].filter(Boolean));
    };

    const onTyping = ({ from }) => {
      if (activeUser && from === activeUser._id) setTyping(true);
    };
    const onStopTyping = ({ from }) => {
      if (activeUser && from === activeUser._id) setTyping(false);
    };

    socket.on('private_message', onPrivate);
    socket.on('typing', onTyping);
    socket.on('stop_typing', onStopTyping);

    return () => {
      socket.off('private_message', onPrivate);
      socket.off('typing', onTyping);
      socket.off('stop_typing', onStopTyping);
      socket.disconnect();
    };
  }, [activeUser?._id, me?._id]);

  // when /chat/:userId changes
  useEffect(() => {
    const userId = params.userId;
    if (!userId) return;

    const prevId = prevActiveIdRef.current;
    prevActiveIdRef.current = userId; // remember for next switch

    // optimistic: keep both current and previous badges at 0 locally
    setConvos(prev =>
      prev.map(c =>
        c.otherUser._id === userId || c.otherUser._id === prevId
          ? { ...c, unreadCount: 0 }
          : c
      )
    );

    // fast header (from sidebar if present)
    const found = convos.find(c => c.otherUser._id === userId)?.otherUser;
    if (found) setActiveUser(found);

    // load thread
    api.get(`/messages/thread/${userId}`).then(({ data }) => setMessages(data));

    // fetch profile if not in sidebar
    if (!found) {
      api.get(`/profiles/${userId}`).then(({ data }) => setActiveUser(data));
    }

    // mark both current and previous as read, then refresh and force them to 0
    (async () => {
      try {
        await Promise.all([
          api.put(`/messages/mark-read/${userId}`),
          prevId ? api.put(`/messages/mark-read/${prevId}`) : Promise.resolve()
        ]);
      } catch {}
      await loadConvos([userId, prevId].filter(Boolean));
    })();
  }, [params.userId]);

  // auto-scroll
  useEffect(() => {
    listRef.current?.scrollTo?.(0, listRef.current.scrollHeight);
  }, [messages]);

  const openThread = (u) => {
    // optimistic: hide badge instantly before route effect runs
    setConvos(prev =>
      prev.map(c => (c.otherUser._id === u._id ? { ...c, unreadCount: 0 } : c))
    );
    setActiveUser(u);
    navigate(`/chat/${u._id}`);
  };

  const onSend = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || !activeUser) return;
    socketRef.current.emit('private_message', { to: activeUser._id, body: text });
    setInput('');
    socketRef.current.emit('stop_typing', activeUser._id);
    setTyping(false);
  };

  const onInputChange = (e) => {
    const v = e.target.value;
    setInput(v);
    if (!activeUser) return;
    socketRef.current.emit('typing', activeUser._id);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current.emit('stop_typing', activeUser._id);
    }, 1200);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Sidebar */}
      <aside className="rounded-2xl p-3 md:col-span-1 h-[75vh] flex flex-col bg-slate-900/80 border border-white/10">
        <div className="font-semibold text-white mb-2">Chats</div>
        <div className="overflow-y-auto flex-1 divide-y divide-white/5">
          {convos.length === 0 && (
            <div className="text-sm text-slate-400 p-3">
              No conversations yet. Open a profile and click “Message”.
            </div>
          )}
          {convos.map(({ otherUser, lastMessage, unreadCount }) => (
            <button
              key={otherUser._id}
              onClick={() => openThread(otherUser)}
              className={`w-full text-left p-3 flex items-center gap-3 hover:bg-white/5 transition ${
                activeUser?._id === otherUser._id ? 'bg-white/5' : ''
              }`}
            >
              <img
                className="w-10 h-10 rounded-full"
                src={
                  otherUser.avatarUrl ||
                  `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(otherUser.name)}`
                }
                alt={otherUser.name}
              />
              <div className="min-w-0 flex-1">
                <div className="flex justify-between gap-2">
                  <div className="font-medium text-white truncate">{otherUser.name}</div>
                  <div className="text-[10px] text-slate-400">
                    {new Date(lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <div className="text-xs text-slate-400 truncate">{lastMessage.body}</div>
                  {unreadCount > 0 && (
                    <span className="ml-2 bg-brand-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Thread */}
      <section className="rounded-2xl p-4 md:col-span-2 h-[75vh] flex flex-col bg-slate-900/80 border border-white/10">
        {!activeUser ? (
          <div className="text-slate-300">
            Select a chat on the left (or go to <span className="font-medium text-white">Profiles</span> and click <span className="font-medium text-white">Message</span>).
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-white/10 pb-3 mb-3">
              <img
                className="w-10 h-10 rounded-full"
                src={
                  activeUser.avatarUrl ||
                  `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(activeUser.name)}`
                }
                alt={activeUser.name}
              />
              <div>
                <div className="font-semibold text-white">{activeUser.name}</div>
                <div className="text-xs text-slate-400 capitalize">{activeUser.role}</div>
              </div>
            </div>

            {/* Messages */}
            <div ref={listRef} className="flex-1 overflow-y-auto space-y-2">
              {messages.map((m) => {
                const mine = m.from === me?._id;
                return (
                  <div
                    key={m._id || m.createdAt + m.body}
                    className={`max-w-[75%] p-2 rounded-xl ${
                      mine ? 'ml-auto bg-brand-500 text-white' : 'mr-auto bg-slate-800 text-slate-100'
                    }`}
                  >
                    <div className="text-sm">{m.body}</div>
                    <div className="text-[10px] opacity-70 text-right">
                      {new Date(m.createdAt).toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Typing indicator */}
            {typing && activeUser && (
              <div className="text-xs text-slate-400 mt-2">{activeUser.name} is typing…</div>
            )}

            {/* Composer */}
            <form onSubmit={onSend} className="mt-3 flex gap-2">
              <input
                className="flex-1 rounded-xl px-3 py-2 bg-slate-800 border border-white/10 placeholder:text-slate-400 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                value={input}
                onChange={onInputChange}
                placeholder="Type a message…"
              />
              <button className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-white">
                Send
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
