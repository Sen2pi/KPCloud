const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  // ADICIONAR CAMPOS PARA FOTO DE PERFIL
  profilePicture: {
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    path: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  storageQuota: {
    type: Number,
    default: 5 * 1024 * 1024 * 1024 // 5GB em bytes
  },
  storageUsed: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: String,
  // ADICIONAR CAMPOS ADICIONAIS PARA PERFIL
  bio: {
    type: String,
    maxlength: 500
  },
  location: {
    type: String,
    maxlength: 100
  },
  website: {
    type: String,
    maxlength: 200
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light'
    },
    language: {
      type: String,
      default: 'pt'
    },
    notifications: {
      email: { type: Boolean, default: true },
      desktop: { type: Boolean, default: true }
    }
  }
}, {
  timestamps: true
});

// Middleware para hash da password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Método para comparar password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Método para obter URL da foto de perfil
userSchema.methods.getProfilePictureUrl = function() {
  if (this.profilePicture && this.profilePicture.filename) {
    return `/uploads/profiles/${this.profilePicture.filename}`;
  }
  return null;
};

// Método para limpar dados sensíveis
userSchema.methods.toSafeObject = function() {
  const user = this.toObject();
  delete user.password;
  delete user.twoFactorSecret;
  
  // Adicionar URL da foto de perfil
  if (user.profilePicture) {
    user.profilePictureUrl = this.getProfilePictureUrl();
  }
  
  return user;
};

module.exports = mongoose.model('User', userSchema);
