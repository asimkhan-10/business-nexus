import express from 'express';
import auth from '../middleware/auth.js';
import Request from '../models/Request.js';
import User from '../models/User.js';

const router = express.Router();

router.post('/', auth, async (req, res) => {
  const { to, message } = req.body;
  if (to === req.user._id.toString()) return res.status(400).json({ error: 'Cannot request yourself' });
  try {
    const exists = await User.findById(to);
    if (!exists) return res.status(404).json({ error: 'Recipient not found' });
    const reqDoc = await Request.create({ from: req.user._id, to, message });
    res.json(reqDoc);
  } catch (e) {
    if (e.code === 11000) return res.status(400).json({ error: 'Request already sent' });
    res.status(500).json({ error: e.message });
  }
});

router.get('/', auth, async (req, res) => {
  const { box = 'inbox' } = req.query;
  const filter = box === 'outbox' ? { from: req.user._id } : { to: req.user._id };
  const items = await Request.find(filter).populate('from to', 'name role avatarUrl').sort('-createdAt');
  res.json(items);
});

router.post('/:id/accept', auth, async (req, res) => {
  const reqDoc = await Request.findById(req.params.id);
  if (!reqDoc || reqDoc.to.toString() !== req.user._id.toString()) return res.status(404).json({ error: 'Not found' });
  reqDoc.status = 'accepted';
  await reqDoc.save();
  res.json(reqDoc);
});

router.post('/:id/reject', auth, async (req, res) => {
  const reqDoc = await Request.findById(req.params.id);
  if (!reqDoc || reqDoc.to.toString() !== req.user._id.toString()) return res.status(404).json({ error: 'Not found' });
  reqDoc.status = 'rejected';
  await reqDoc.save();
  res.json(reqDoc);
});

export default router;
