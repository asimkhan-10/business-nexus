import express from 'express';
import http from 'http';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profiles.js';
import requestRoutes from './routes/requests.js';
import messageRoutes from './routes/messages.js';
import initSockets from './socket.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

/* ------------------------ Allowlist (from env) ------------------------ */
/* Set on Railway:
   CLIENT_ORIGIN = https://spontaneous-meerkat-610356.netlify.app, http://localhost:5173
   (no trailing slashes; leave blank to temporarily allow all origins) */
const allowlist = (process.env.CLIENT_ORIGIN || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

/* --------------- Minimal, safe CORS shim (preflight OK) --------------- */
/* This alone handles ALL CORS (no need for cors() package). */
app.use((req, res, next) => {
  const origin = req.headers.origin || '';
  const allowed = allowlist.length === 0 || allowlist.includes(origin);

  // helpful logs while debugging CORS
  if (req.method === 'OPTIONS' || req.path.startsWith('/api/')) {
    console.log('[CORS]', req.method, req.path, 'Origin:', origin || '(none)', 'Allowed:', allowed);
  }

  // allow server-to-server/no-origin (curl, health checks)
  if (!origin) return req.method === 'OPTIONS' ? res.sendStatus(204) : next();

  if (allowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin'); // cache per-origin
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader(
      'Access-Control-Allow-Headers',
      req.headers['access-control-request-headers'] || 'Content-Type,Authorization'
    );
  }

  if (req.method === 'OPTIONS') {
    // Short-circuit preflight
    return res.sendStatus(allowed ? 204 : 403);
  }

  return next();
});

/* ----------------------------- Middleware ----------------------------- */
connectDB();
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

/* ------------------------------ Healthcheck --------------------------- */
app.get('/health', (_req, res) => res.send('OK'));
app.get('/', (_req, res) => res.json({ ok: true, service: 'Business Nexus API' }));

/* -------------------------------- Routes ------------------------------ */
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/messages', messageRoutes);

// 404 for unknown API paths
app.use('/api/*', (_req, res) => res.status(404).json({ error: 'Not found' }));

/* ------------------------------ Socket.IO ----------------------------- */
const io = new Server(server, {
  cors: {
    origin(origin, cb) {
      // never throw; do not 500 on OPTIONS
      if (!origin) return cb(null, true);
      if (allowlist.length === 0 || allowlist.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }
});
initSockets(io);

/* -------------------------------- Server ------------------------------ */
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log('API listening on', PORT);
  console.log('CORS allowlist:', allowlist.length ? allowlist : '(empty → allowing all origins)');
});