import express from 'express';
import http from 'http';
import cors from 'cors';
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

/* ------------------------ CORS allowlist + config ------------------------ */

const allowlist = (process.env.CLIENT_ORIGIN || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

// explicit config so preflights (OPTIONS) succeed with credentials
const corsConfig = {
  origin(origin, cb) {
    // allow server-to-server (no Origin header) and any whitelisted origin
    if (!origin) return cb(null, true);
    if (allowlist.includes(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

/* ------------------------------ Middleware ------------------------------ */

connectDB();

app.use(cors(corsConfig));           // must be before routes
app.options('*', cors(corsConfig));  // handle all preflight requests

app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

/* ------------------------------- Healthcheck ---------------------------- */

app.get('/health', (_req, res) => res.send('OK'));
app.get('/', (_req, res) => res.json({ ok: true, service: 'Business Nexus API' }));

/* --------------------------------- Routes -------------------------------- */

app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/messages', messageRoutes);

// 404 for unknown API paths
app.use('/api/*', (_req, res) => res.status(404).json({ error: 'Not found' }));

/* --------------------------------- Socket.IO ----------------------------- */

const io = new Server(server, {
  cors: {
    origin(origin, cb) {
      if (!origin) return cb(null, true);
      if (allowlist.includes(origin)) return cb(null, true);
      return cb(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  },
});

initSockets(io);

/* --------------------------------- Server -------------------------------- */

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log('API listening on', PORT);
  console.log('CORS allowlist:', allowlist.length ? allowlist : '(none set; allowing no-origin requests only)');
});
