const router = require('express').Router();
const { auth } = require('../middleware/auth');
const Notification = require('../models/Notification');

// GET /api/notifications - list and filter notifications for current user/role
router.get('/notifications', auth(), async (req, res) => {
  try {
    const { status, time, type, search, page = 1, limit = 20 } = req.query;
    const userRole = String(req.user.role || '').toLowerCase();
    
    // Base isolation query: Must belong to user OR be role-based for admins
    const query = {
      $or: [
        { userId: req.user._id },
        { user: req.user._id }
      ]
    };
    if (userRole === 'admin' || userRole === 'teacher') {
      query.$or.push({ role: 'admin', userId: null });
      query.$or.push({ role: 'teacher', userId: null });
    }

    // Filter by Read/Unread status
    if (status === 'unread') {
      query.$or = query.$or.map(cond => ({ ...cond, isRead: false }));
    } else if (status === 'read') {
      query.$or = query.$or.map(cond => ({ ...cond, isRead: true }));
    }

    // Filter by Type
    if (type) {
      const typeStr = String(type).toLowerCase();
      query.$or = query.$or.map(cond => ({ ...cond, type: typeStr }));
    }

    // Filter by Time Range
    if (time && time !== 'all') {
      const timeLimit = new Date();
      if (time === 'today') {
        timeLimit.setHours(0, 0, 0, 0);
      } else if (time === 'week') {
        timeLimit.setDate(timeLimit.getDate() - 7);
      } else if (time === 'month') {
        timeLimit.setMonth(timeLimit.getMonth() - 1);
      }
      query.$or = query.$or.map(cond => ({ ...cond, createdAt: { $gte: timeLimit } }));
    }

    // Filter by Search Keyword
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      const searchQuery = {
        $or: [
          { title: searchRegex },
          { message: searchRegex },
          { body: searchRegex }
        ]
      };
      
      // Merge base filters with search subquery
      const baseQuery = { ...query };
      const finalQuery = {
        $and: [
          baseQuery,
          searchQuery
        ]
      };

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const items = await Notification.find(finalQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));
      const total = await Notification.countDocuments(finalQuery);
      return res.json({ notifications: items, total, page: parseInt(page), limit: parseInt(limit) });
    }

    // Execute standard query
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const items = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Notification.countDocuments(query);
    res.json({ notifications: items, total, page: parseInt(page), limit: parseInt(limit) });

  } catch (e) {
    console.error('Fetch notifications error:', e);
    res.status(500).json({ message: 'Failed to retrieve notifications' });
  }
});

// POST /api/notifications/:id/read - mark specific notification as read
router.post('/notifications/:id/read', auth(), async (req, res) => {
  try {
    const n = await Notification.findById(req.params.id);
    if (!n) return res.status(404).json({ message: 'Notification not found' });

    // Validate ownership/role scope
    const isOwner = String(n.userId || n.user) === String(req.user._id);
    const isAdminTarget = !n.userId && (n.role === 'admin' || n.role === 'teacher') && (req.user.role === 'admin' || req.user.role === 'teacher');
    
    if (!isOwner && !isAdminTarget) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    n.isRead = true;
    n.read = true;
    n.readAt = new Date();
    await n.save();

    res.json({ notification: n });
  } catch (e) {
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
});

// POST /api/notifications/read-all - mark all unread notifications of user as read
router.post('/notifications/read-all', auth(), async (req, res) => {
  try {
    const userRole = String(req.user.role || '').toLowerCase();
    const query = {
      isRead: false,
      $or: [
        { userId: req.user._id },
        { user: req.user._id }
      ]
    };
    if (userRole === 'admin' || userRole === 'teacher') {
      query.$or.push({ role: 'admin', userId: null });
      query.$or.push({ role: 'teacher', userId: null });
    }

    await Notification.updateMany(query, {
      $set: {
        isRead: true,
        read: true,
        readAt: new Date()
      }
    });

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: 'Failed to mark all notifications as read' });
  }
});

// DELETE /api/notifications/:id - delete single notification
router.delete('/notifications/:id', auth(), async (req, res) => {
  try {
    const n = await Notification.findById(req.params.id);
    if (!n) return res.status(404).json({ message: 'Notification not found' });

    const isOwner = String(n.userId || n.user) === String(req.user._id);
    const isAdminTarget = !n.userId && (n.role === 'admin' || n.role === 'teacher') && (req.user.role === 'admin' || req.user.role === 'teacher');
    
    if (!isOwner && !isAdminTarget) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    await Notification.deleteOne({ _id: req.params.id });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: 'Failed to delete notification' });
  }
});

// POST /api/notifications/:id/delete - delete single notification POST fallback
router.post('/notifications/:id/delete', auth(), async (req, res) => {
  try {
    const n = await Notification.findById(req.params.id);
    if (!n) return res.status(404).json({ message: 'Notification not found' });

    const isOwner = String(n.userId || n.user) === String(req.user._id);
    const isAdminTarget = !n.userId && (n.role === 'admin' || n.role === 'teacher') && (req.user.role === 'admin' || req.user.role === 'teacher');
    
    if (!isOwner && !isAdminTarget) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    await Notification.deleteOne({ _id: req.params.id });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: 'Failed to delete notification' });
  }
});

// POST /api/notifications/delete - delete multiple notifications
router.post('/notifications/delete', auth(), async (req, res) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [req.body?.id].filter(Boolean);
    if (!ids || ids.length === 0) return res.status(400).json({ message: 'No ids provided' });

    // Validate ownership/role scope for all targeted notification documents
    const matchCount = await Notification.countDocuments({
      _id: { $in: ids },
      $or: [
        { userId: req.user._id },
        { user: req.user._id },
        { role: 'admin', userId: null },
        { role: 'teacher', userId: null }
      ]
    });

    if (matchCount !== ids.length) {
      return res.status(403).json({ message: 'Forbidden: one or more notifications cannot be deleted' });
    }

    await Notification.deleteMany({ _id: { $in: ids } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: 'Failed to delete notifications' });
  }
});

module.exports = router;
