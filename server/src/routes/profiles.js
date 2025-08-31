import express from 'express';
import auth from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

router.get('/', auth, async (req, res) => {
  const { role, q, sector } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (sector) filter.sectors = sector;
  if (q) filter.$or = [
    { name: new RegExp(q, 'i') },
    { bio: new RegExp(q, 'i') },
    { skills: new RegExp(q, 'i') },
    { sectors: new RegExp(q, 'i') }
  ];
  const users = await User.find(filter).select('-password').limit(50).sort('-createdAt');
  res.json(users.filter(u => u._id.toString() !== req.user._id.toString()));
});

router.get('/me', auth, async (req, res) => {
  const me = await User.findById(req.user._id).select('-password');
  res.json(me);
});

router.put('/me', auth, async (req, res) => {
  const { name, bio, sectors, skills, avatarUrl } = req.body;
  const update = { name, bio, avatarUrl };
  if (Array.isArray(sectors)) update.sectors = sectors;
  if (Array.isArray(skills)) update.skills = skills;
  const me = await User.findByIdAndUpdate(req.user._id, update, { new: true }).select('-password');
  res.json(me);
});

router.get('/:id', auth, async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json(user);
});

export default router;
