import React from 'react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  return (
    <div className="space-y-12">
      {/* HERO */}
      <section className="rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 shadow-soft">
        <div className="relative px-8 py-14 md:px-14 md:py-20">
          {/* Background image overlay */}
          <img
            src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=1600&auto=format&fit=crop"
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-20"
          />
          <div className="relative max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
              ConnectUp: Where <span className="text-brand-400">Entrepreneurs</span> and <span className="text-brand-400">Investors</span> Meet
            </h1>
            <p className="mt-4 text-slate-300">
              Join a vibrant community of innovators and funders. Connect, collaborate, and grow your ventures.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register" className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-white font-medium shadow-soft">
                Get Started
              </Link>
              <Link to="/profiles" className="px-5 py-2 rounded-xl border border-white/20 text-slate-200 hover:bg-white/5">
                Browse Profiles
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section>
        <h2 className="text-2xl md:text-3xl font-bold mb-6">Empowering Your Network</h2>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            {title:'Find Your Match', desc:'Connect with like-minded entrepreneurs and investors.', icon:'💡'},
            {title:'Smart Search', desc:'Filter by role, sector, skills to discover the right people.', icon:'🔎'},
            {title:'Seamless Collaboration', desc:'Send requests and chat in real time with Socket.IO.', icon:'🤝'},
          ].map((f) => (
            <div key={f.title} className="bg-slate-900/70 border border-white/10 rounded-2xl p-6 hover:border-brand-400/40 transition-colors">
              <div className="text-2xl">{f.icon}</div>
              <div className="mt-3 font-semibold text-white">{f.title}</div>
              <div className="mt-1 text-slate-300 text-sm">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA STRIP */}
      <section className="rounded-2xl bg-slate-900/80 border border-white/10 p-6 md:p-8 flex items-center justify-between gap-4">
        <div>
          <div className="text-xl md:text-2xl font-semibold">Ready to Elevate Your Network?</div>
          <div className="text-slate-300 text-sm">Join today and start building meaningful connections.</div>
        </div>
        <Link to="/register" className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-white font-medium shadow-soft">
          Sign Up Now
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="py-6 text-sm text-slate-400 flex flex-wrap gap-4 justify-between border-t border-white/10">
        <div>© {new Date().getFullYear()} Business Nexus. All rights reserved.</div>
        <div className="flex gap-4">
          <a className="hover:text-white" href="#">About</a>
          <a className="hover:text-white" href="#">Contact</a>
          <a className="hover:text-white" href="#">Terms</a>
          <a className="hover:text-white" href="#">Privacy</a>
        </div>
      </footer>
    </div>
  );
}
