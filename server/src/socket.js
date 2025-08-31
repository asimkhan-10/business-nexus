import jwt from 'jsonwebtoken';
import Message from './models/Message.js';

export default function initSockets(io) {
  // auth every socket
  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers['authorization']?.split(' ')[1];
    if (!token) return next(new Error('No auth token'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'devsecret');
      socket.userId = decoded.id;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const me = socket.userId;
    socket.join(me);

    // send a private message (store as unread for recipient)
    socket.on('private_message', async ({ to, body }) => {
      if (!to || !body) return;
      const msg = await Message.create({ from: me, to, body, read: false });
      io.to(to).emit('private_message', msg);
      io.to(me).emit('private_message', msg);
    });

    // typing indicators
    socket.on('typing', (to) => {
      if (!to) return;
      io.to(to).emit('typing', { from: me });
    });

    socket.on('stop_typing', (to) => {
      if (!to) return;
      io.to(to).emit('stop_typing', { from: me });
    });
  });
}