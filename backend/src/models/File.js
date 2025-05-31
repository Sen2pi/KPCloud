const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  mimetype: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  folder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    default: null
  },
  sharedWith: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permissions: {
      type: String,
      enum: ['read', 'write', 'admin'],
      default: 'read'
    },
    sharedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  publicLink: {
    type: String,
    unique: true,
    sparse: true
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  tags: [String],
  description: String,
  version: {
    type: Number,
    default: 1
  },
  versions: [{
    version: Number,
    filename: String,
    size: Number,
    uploadedAt: Date,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }]
}, {
  timestamps: true
});

fileSchema.index({ owner: 1, folder: 1 });
fileSchema.index({ 'sharedWith.user': 1 });
fileSchema.index({ publicLink: 1 });

module.exports = mongoose.model('File', fileSchema);
