const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }, // Legacy
    role: { type: String, enum: ['student', 'teacher', 'admin'], default: 'student' },
    title: { type: String, required: true },
    message: { type: String },
    body: { type: String }, // Legacy
    type: { type: String, enum: ['info', 'success', 'warning', 'error'], default: 'info' },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
    isRead: { type: Boolean, default: false },
    read: { type: Boolean, default: false }, // Legacy
    readAt: { type: Date, default: null },
    actionUrl: { type: String, default: '' },
    link: { type: String, default: '' }, // Legacy
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

// Pre-save synchronization hook
NotificationSchema.pre('save', function (next) {
  if (this.user && !this.userId) this.userId = this.user;
  if (this.userId && !this.user) this.user = this.userId;

  if (this.body && !this.message) this.message = this.body;
  if (this.message && !this.body) this.body = this.message;

  if (this.read !== undefined && this.isRead === undefined) this.isRead = this.read;
  if (this.isRead !== undefined && this.read === undefined) this.read = this.isRead;

  if (this.link && !this.actionUrl) this.actionUrl = this.link;
  if (this.actionUrl && !this.link) this.link = this.actionUrl;

  if (this.isRead && !this.readAt) this.readAt = new Date();

  next();
});

// Pre-insertMany synchronization hook
NotificationSchema.pre('insertMany', function (next, docs) {
  if (Array.isArray(docs)) {
    docs.forEach(doc => {
      if (doc.user && !doc.userId) doc.userId = doc.user;
      if (doc.userId && !doc.user) doc.user = doc.userId;
      if (doc.body && !doc.message) doc.message = doc.body;
      if (doc.message && !doc.body) doc.body = doc.message;
      if (doc.read !== undefined && doc.isRead === undefined) doc.isRead = doc.read;
      if (doc.isRead !== undefined && doc.read === undefined) doc.read = doc.isRead;
      if (doc.link && !doc.actionUrl) doc.actionUrl = doc.link;
      if (doc.actionUrl && !doc.link) doc.link = doc.actionUrl;
      if (doc.isRead && !doc.readAt) doc.readAt = new Date();
    });
  }
  next();
});

module.exports = mongoose.model('Notification', NotificationSchema);
