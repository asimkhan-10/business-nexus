import express from 'express';
import auth from '../middleware/auth.js';
import Message from '../models/Message.js';
import mongoose from 'mongoose';

const router = express.Router();

/**
 * Get all messages between me and another user
 */
router.get('/thread/:userId', auth, async (req, res) => {
  const { userId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ error: 'Invalid userId' });
  }

  const meId = new mongoose.Types.ObjectId(req.user._id);
  const otherId = new mongoose.Types.ObjectId(userId);

  const messages = await Message.find({
    $or: [{ from: meId, to: otherId }, { from: otherId, to: meId }]
  }).sort('createdAt');

  res.json(messages);
});

/**
 * Mark all messages from :userId → me as read
 * (treats missing `read` as unread for robustness)
 */
// Mark all messages from :userId → me as read (robust to legacy string IDs)
router.put('/mark-read/:userId', auth, async (req, res) => {
  const { userId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ error: 'Invalid userId' });
  }

  const fromId = new mongoose.Types.ObjectId(userId);
  const meId   = new mongoose.Types.ObjectId(req.user._id);
  const meStr  = meId.toString();

  // Update both variants: to === ObjectId(me) and to === meStr (legacy)
  const r1 = await Message.updateMany(
    { from: fromId, to: meId,  read: { $ne: true } },
    { $set: { read: true } }
  );
  const r2 = await Message.updateMany(
    { from: fromId, to: meStr, read: { $ne: true } },
    { $set: { read: true } }
  );

  const modified =
    (r1.modifiedCount ?? r1.nModified ?? 0) +
    (r2.modifiedCount ?? r2.nModified ?? 0);

  res.json({ ok: true, modified });
});

/**
 * Get recent conversations (WhatsApp-style sidebar)
 * Returns: otherUser info + lastMessage + unreadCount
 */
// Recent conversations with correct unreadCount (handles legacy string IDs)
router.get('/recent', auth, async (req, res) => {
  const meId  = new mongoose.Types.ObjectId(req.user._id);
  const meStr = meId.toString();

  const recent = await Message.aggregate([
    // Only conversations that involve me (both types)
    {
      $match: {
        $or: [
          { from: meId },
          { to: meId },
          { to: meStr } // legacy
        ]
      }
    },

    // Determine the other participant for each message
    {
      $addFields: {
        otherId: {
          $cond: [
            { $eq: ['$from', meId] },
            '$to',
            '$from'
          ]
        }
      }
    },

    // Newest first so $first gives latest message
    { $sort: { createdAt: -1 } },

    // Last message per conversation
    {
      $group: {
        _id: '$otherId',
        last: { $first: '$$ROOT' }
      }
    },

    // Join other user's profile
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'otherUser'
      }
    },
    { $unwind: '$otherUser' },

    // Precise unread count: messages FROM other -> TO me (as ObjectId or legacy string) where read != true
    {
      $lookup: {
        from: 'messages',
        let: { other: '$_id', me: meId, meStr: meStr },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$from', '$$other'] },
                  {
                    $or: [
                      { $eq: ['$to', '$$me'] },
                      { $eq: ['$to', '$$meStr'] } // legacy
                    ]
                  },
                  { $ne: ['$read', true] }
                ]
              }
            }
          },
          { $count: 'count' }
        ],
        as: 'unreadArr'
      }
    },

    // Extract the count
    {
      $addFields: {
        unreadCount: { $ifNull: [{ $arrayElemAt: ['$unreadArr.count', 0] }, 0] }
      }
    },

    // Shape response
    {
      $project: {
        _id: 0,
        otherUser: {
          _id: '$otherUser._id',
          name: '$otherUser.name',
          role: '$otherUser.role',
          avatarUrl: '$otherUser.avatarUrl'
        },
        lastMessage: {
          body: '$last.body',
          createdAt: '$last.createdAt',
          from: '$last.from',
          to: '$last.to'
        },
        unreadCount: 1
      }
    }
  ]);

  res.json(recent);
});
export default router;