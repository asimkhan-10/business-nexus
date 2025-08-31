import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api.js';

export default function Register() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'entrepreneur'
  });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/auth/register', form);
      localStorage.setItem('token', data.token);
      navigate('/profiles');
    } catch (e) {
      setError(e.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="max-w-md mx-auto bg-slate-900/80 border border-white/10 rounded-2xl shadow-soft p-6 mt-8">
      <h1 className="text-2xl font-bold text-white mb-2">Create an account</h1>
      <p className="text-slate-400 text-sm mb-4">Join Business Nexus and start connecting.</p>

      {error && (
        <div className="mb-3 text-sm bg-rose-500/15 text-rose-300 border border-rose-500/30 p-2 rounded-xl">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-3">
        {/* Name */}
        <label className="block">
          <span className="text-sm text-slate-300">Name</span>
          <input
            className="mt-1 w-full rounded-xl px-3 py-2 bg-slate-900 border border-white/10 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Jane Founder"
            required
          />
        </label>

        {/* Email */}
        <label className="block">
          <span className="text-sm text-slate-300">Email</span>
          <input
            className="mt-1 w-full rounded-xl px-3 py-2 bg-slate-900 border border-white/10 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@example.com"
            required
          />
        </label>

        {/* Password */}
        <label className="block">
          <span className="text-sm text-slate-300">Password</span>
          <div className="mt-1 flex items-stretch gap-2">
            <input
              className="flex-1 rounded-xl px-3 py-2 bg-slate-900 border border-white/10 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              type={showPw ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Minimum 6 characters"
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              className="px-3 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5"
              title={showPw ? 'Hide password' : 'Show password'}
            >
              {showPw ? 'Hide' : 'Show'}
            </button>
          </div>
        </label>

        {/* Role */}
        <div>
          <span className="text-sm text-slate-300">Role</span>
          <div className="mt-1 flex gap-2">
            {['entrepreneur', 'investor'].map((r) => (
              <label
                key={r}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer border ${
                  form.role === r
                    ? 'border-brand-500 bg-brand-500/10 text-white'
                    : 'border-white/10 text-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={r}
                  checked={form.role === r}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                />
                <span className="capitalize">{r}</span>
              </label>
            ))}
          </div>
        </div>

        <button className="w-full px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-white font-medium">
          Sign up
        </button>
      </form>

      <p className="text-sm text-slate-400 mt-4">
        Already have an account?{' '}
        <Link className="text-brand-400 hover:text-brand-300" to="/login">
          Log in
        </Link>
      </p>
    </div>
  );
}