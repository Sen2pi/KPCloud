const mongoose = require('mongoose');

const trashSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  file: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File'
  },
  folder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder'
  },
  originalPath: {
    type: String,
    required: true
  },
  deletedAt: {
    type: Date,
    default: Date.now
  },
  autoDeleteAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 dias
    }
  }
}, {
  timestamps: true
});

trashSchema.index({ autoDeleteAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Trash', trashSchema);
