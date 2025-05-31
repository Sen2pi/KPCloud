const mongoose = require('mongoose');

const shareSchema = new mongoose.Schema({
  // Item a ser partilhado
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  itemType: {
    type: String,
    enum: ['file', 'folder'],
    required: true
  },
  itemModel: {
    type: String,
    enum: ['File', 'Folder'],
    required: true
  },
  
  // Quem partilha
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Com quem é partilhado
  sharedWith: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Permissões
  permissions: {
    type: String,
    enum: ['read', 'write', 'admin'],
    default: 'read'
  },
  
  // Metadados
  sharedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Índices
shareSchema.index({ itemId: 1, itemType: 1 });
shareSchema.index({ owner: 1 });
shareSchema.index({ sharedWith: 1 });
shareSchema.index({ itemId: 1, sharedWith: 1 }, { unique: true });

module.exports = mongoose.model('Share', shareSchema);
