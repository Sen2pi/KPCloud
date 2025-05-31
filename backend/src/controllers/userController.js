const User = require('../models/User');
const File = require('../models/File');
const Folder = require('../models/Folder');
const bcrypt = require('bcryptjs');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const fs = require('fs').promises;
const path = require('path');

// Atualizar perfil básico
exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, username, bio, location, website } = req.body;
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilizador não encontrado'
      });
    }

    // Verificar se o username já existe (se foi alterado)
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Nome de utilizador já existe'
        });
      }
      user.username = username;
    }

    // Atualizar campos
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (bio !== undefined) user.bio = bio;
    if (location !== undefined) user.location = location;
    if (website !== undefined) user.website = website;

    await user.save();

    res.json({
      success: true,
      message: 'Perfil atualizado com sucesso',
      user: user.toSafeObject()
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar perfil',
      error: error.message
    });
  }
};

// Upload de foto de perfil
exports.uploadProfilePicture = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilizador não encontrado'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Nenhuma imagem foi enviada'
      });
    }

    console.log('Ficheiro recebido:', req.file);

    // Eliminar foto anterior se existir
    if (user.profilePicture && user.profilePicture.path) {
      try {
        await fs.unlink(user.profilePicture.path);
        console.log('Foto anterior eliminada');
      } catch (error) {
        console.log('Erro ao eliminar foto anterior:', error);
      }
    }

    // Atualizar informações da nova foto
    user.profilePicture = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      uploadedAt: new Date()
    };

    await user.save();

    console.log('Utilizador atualizado:', user.profilePicture);

    const profilePictureUrl = user.getProfilePictureUrl();
    console.log('URL da foto:', profilePictureUrl);

    res.json({
      success: true,
      message: 'Foto de perfil atualizada com sucesso',
      profilePictureUrl: profilePictureUrl,
      user: user.toSafeObject() // INCLUIR O UTILIZADOR COMPLETO
    });
  } catch (error) {
    console.error('Erro ao fazer upload da foto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao fazer upload da foto de perfil',
      error: error.message
    });
  }
};


// Eliminar foto de perfil
exports.deleteProfilePicture = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilizador não encontrado'
      });
    }

    if (!user.profilePicture || !user.profilePicture.path) {
      return res.status(400).json({
        success: false,
        message: 'Utilizador não tem foto de perfil'
      });
    }

    // Eliminar ficheiro físico
    try {
      await fs.unlink(user.profilePicture.path);
    } catch (error) {
      console.log('Erro ao eliminar ficheiro físico:', error);
    }

    // Remover da base de dados
    user.profilePicture = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Foto de perfil eliminada com sucesso',
      user: user.toSafeObject()
    });
  } catch (error) {
    console.error('Erro ao eliminar foto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao eliminar foto de perfil',
      error: error.message
    });
  }
};

// Alterar password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilizador não encontrado'
      });
    }

    // Verificar password atual
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Password atual incorreta'
      });
    }

    // Atualizar password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password alterada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao alterar password:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao alterar password',
      error: error.message
    });
  }
};

// Atualizar preferências
exports.updatePreferences = async (req, res) => {
  try {
    const { theme, language, notifications } = req.body;
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilizador não encontrado'
      });
    }

    // Atualizar preferências
    if (theme) user.preferences.theme = theme;
    if (language) user.preferences.language = language;
    if (notifications) {
      user.preferences.notifications = {
        ...user.preferences.notifications,
        ...notifications
      };
    }

    await user.save();

    res.json({
      success: true,
      message: 'Preferências atualizadas com sucesso',
      preferences: user.preferences
    });
  } catch (error) {
    console.error('Erro ao atualizar preferências:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar preferências',
      error: error.message
    });
  }
};

// Obter estatísticas de armazenamento
exports.getStorageStats = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const fileCount = await File.countDocuments({ 
      owner: req.user.userId,
      isDeleted: false
    });
    const folderCount = await Folder.countDocuments({ 
      owner: req.user.userId,
      isDeleted: false
    });

    // Estatísticas por tipo de ficheiro
    const filesByType = await File.aggregate([
      { 
        $match: { 
          owner: user._id,
          isDeleted: false
        }
      },
      { 
        $group: { 
          _id: '$mimetype', 
          count: { $sum: 1 }, 
          size: { $sum: '$size' } 
        } 
      }
    ]);

    res.json({
      success: true,
      stats: {
        storageUsed: user.storageUsed,
        storageQuota: user.storageQuota,
        storagePercentage: (user.storageUsed / user.storageQuota) * 100,
        fileCount,
        folderCount,
        filesByType
      }
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter estatísticas',
      error: error.message
    });
  }
};

// ... resto das funções 2FA e shared files que já tens ...
exports.enable2FA = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (user.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: '2FA já está ativado'
      });
    }

    const secret = speakeasy.generateSecret({
      name: `KPCloud (${user.email})`,
      issuer: 'KPCloud'
    });

    user.twoFactorSecret = secret.base32;
    await user.save();

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    res.json({
      success: true,
      secret: secret.base32,
      qrCode: qrCodeUrl
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao ativar 2FA',
      error: error.message
    });
  }
};

exports.verify2FA = async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findById(req.user.userId);

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 2
    });

    if (!verified) {
      return res.status(400).json({
        success: false,
        message: 'Token inválido'
      });
    }

    user.twoFactorEnabled = true;
    await user.save();

    res.json({
      success: true,
      message: '2FA ativado com sucesso'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao verificar 2FA',
      error: error.message
    });
  }
};

exports.disable2FA = async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.user.userId);

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Password incorreta'
      });
    }

    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    await user.save();

    res.json({
      success: true,
      message: '2FA desativado com sucesso'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao desativar 2FA',
      error: error.message
    });
  }
};

exports.getSharedFiles = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const files = await File.find({
      'sharedWith.user': req.user.userId,
      isDeleted: false
    })
    .populate('owner', 'username firstName lastName')
    .populate('folder', 'name')
    .sort({ 'sharedWith.sharedAt': -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await File.countDocuments({
      'sharedWith.user': req.user.userId,
      isDeleted: false
    });

    res.json({
      success: true,
      files,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao obter ficheiros partilhados',
      error: error.message
    });
  }
};
