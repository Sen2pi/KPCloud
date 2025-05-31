const mongoose = require('mongoose');

const forumPostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    maxlength: 10000
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    enum: ['geral', 'ajuda', 'discussao', 'anuncios', 'sugestoes'],
    default: 'geral'
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  isSticky: {
    type: Boolean,
    default: false
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  },
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    likedAt: {
      type: Date,
      default: Date.now
    }
  }],
  replies: [{
    content: {
      type: String,
      required: true,
      maxlength: 5000
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    likes: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      likedAt: {
        type: Date,
        default: Date.now
      }
    }],
    createdAt: {
      type: Date,
      default: Date.now
    },
    editedAt: {
      type: Date
    },
    isDeleted: {
      type: Boolean,
      default: false
    }
  }],
  lastActivity: {
    type: Date,
    default: Date.now
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Índices para performance
forumPostSchema.index({ author: 1, createdAt: -1 });
forumPostSchema.index({ category: 1, lastActivity: -1 });
forumPostSchema.index({ isSticky: -1, lastActivity: -1 });
forumPostSchema.index({ title: 'text', content: 'text' });

// Middleware para filtrar posts eliminados
forumPostSchema.pre(/^find/, function(next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
});

// Métodos do modelo
forumPostSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

forumPostSchema.methods.like = function(userId) {
  const alreadyLiked = this.likes.some(like => like.user.toString() === userId.toString());
  
  if (alreadyLiked) {
    this.likes = this.likes.filter(like => like.user.toString() !== userId.toString());
  } else {
    this.likes.push({ user: userId });
  }
  
  return this.save();
};

forumPostSchema.methods.addReply = function(content, authorId) {
  this.replies.push({
    content,
    author: authorId
  });
  this.lastActivity = new Date();
  return this.save();
};

module.exports = mongoose.model('ForumPost', forumPostSchema);
