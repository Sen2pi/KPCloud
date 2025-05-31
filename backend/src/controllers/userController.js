const User = require('../models/User');
const File = require('../models/File');
const Folder = require('../models/Folder');
const bcrypt = require('bcryptjs');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, username } = req.body;
    
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilizador não encontrado'
      });
    }

    // Verificar se o username já existe
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

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;

    await user.save();

    res.json({
      success: true,
      message: 'Perfil atualizado com sucesso',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar perfil',
      error: error.message
    });
  }
};

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
    res.status(500).json({
      success: false,
      message: 'Erro ao alterar password',
      error: error.message
    });
  }
};

exports.getStorageStats = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    const fileCount = await File.countDocuments({ owner: req.user.userId });
    const folderCount = await Folder.countDocuments({ owner: req.user.userId });
    
    const filesByType = await File.aggregate([
      { $match: { owner: user._id } },
      { $group: { _id: '$mimetype', count: { $sum: 1 }, size: { $sum: '$size' } } }
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
    res.status(500).json({
      success: false,
      message: 'Erro ao obter estatísticas',
      error: error.message
    });
  }
};

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
      'sharedWith.user': req.user.userId
    })
    .populate('owner', 'username firstName lastName')
    .populate('folder', 'name')
    .sort({ 'sharedWith.sharedAt': -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await File.countDocuments({
      'sharedWith.user': req.user.userId
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
