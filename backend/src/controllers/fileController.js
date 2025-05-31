const File = require('../models/File');
const User = require('../models/User');
const Folder = require('../models/Folder');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

// Configuração do Multer
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads');
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  },
  fileFilter: (req, file, cb) => {
    // Lista de tipos de ficheiro permitidos
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|zip|rar/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Tipo de ficheiro não permitido'));
    }
  }
});

exports.uploadMiddleware = upload.single('file');

exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum ficheiro enviado'
      });
    }

    const { folderId, description, tags } = req.body;

    // Verificar quota de armazenamento
    const user = await User.findById(req.user.userId);
    if (user.storageUsed + req.file.size > user.storageQuota) {
      // Eliminar ficheiro enviado
      await fs.unlink(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Quota de armazenamento excedida'
      });
    }

    // Criar registo do ficheiro
    const file = new File({
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      owner: req.user.userId,
      folder: folderId || null,
      description,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : []
    });

    await file.save();

    // Atualizar armazenamento usado
    user.storageUsed += req.file.size;
    await user.save();

    // Emitir evento via Socket.IO
    const { io } = require('../../server');
    io.to(folderId || 'root').emit('file-uploaded', {
      file: await file.populate('owner', 'username firstName lastName')
    });

    res.status(201).json({
      success: true,
      message: 'Ficheiro enviado com sucesso',
      file
    });
  } catch (error) {
    // Limpar ficheiro em caso de erro
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    
    res.status(500).json({
      success: false,
      message: 'Erro ao enviar ficheiro',
      error: error.message
    });
  }
};

exports.getFiles = async (req, res) => {
  try {
    const { folderId, page = 1, limit = 20, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const query = {
      $or: [
        { owner: req.user.userId },
        { 'sharedWith.user': req.user.userId }
      ]
    };

    if (folderId && folderId !== 'null') {
      query.folder = folderId;
    } else {
      query.folder = null;
    }

    if (search) {
      query.originalName = { $regex: search, $options: 'i' };
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const files = await File.find(query)
      .populate('owner', 'username firstName lastName')
      .populate('folder', 'name')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await File.countDocuments(query);

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
      message: 'Erro ao obter ficheiros',
      error: error.message
    });
  }
};

exports.downloadFile = async (req, res) => {
  try {
    const { fileId } = req.params;

    const file = await File.findOne({
      _id: fileId,
      $or: [
        { owner: req.user.userId },
        { 'sharedWith.user': req.user.userId },
        { isPublic: true }
      ]
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'Ficheiro não encontrado'
      });
    }

    // Incrementar contador de downloads
    file.downloadCount += 1;
    await file.save();

    res.download(file.path, file.originalName);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao fazer download',
      error: error.message
    });
  }
};

exports.deleteFile = async (req, res) => {
  try {
    const { fileId } = req.params;

    const file = await File.findOne({
      _id: fileId,
      owner: req.user.userId
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'Ficheiro não encontrado'
      });
    }

    // Eliminar ficheiro físico
    await fs.unlink(file.path);

    // Atualizar armazenamento usado
    const user = await User.findById(req.user.userId);
    user.storageUsed -= file.size;
    await user.save();

    // Eliminar registo da base de dados
    await File.findByIdAndDelete(fileId);

    // Emitir evento via Socket.IO
    const { io } = require('../../server');
    io.to(file.folder || 'root').emit('file-deleted', { fileId });

    res.json({
      success: true,
      message: 'Ficheiro eliminado com sucesso'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao eliminar ficheiro',
      error: error.message
    });
  }
};

exports.shareFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const { userEmail, permissions = 'read' } = req.body;

    const file = await File.findOne({
      _id: fileId,
      owner: req.user.userId
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'Ficheiro não encontrado'
      });
    }

    const targetUser = await User.findOne({ email: userEmail });
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Utilizador não encontrado'
      });
    }

    // Verificar se já está partilhado
    const existingShare = file.sharedWith.find(
      share => share.user.toString() === targetUser._id.toString()
    );

    if (existingShare) {
      existingShare.permissions = permissions;
    } else {
      file.sharedWith.push({
        user: targetUser._id,
        permissions
      });
    }

    await file.save();

    res.json({
      success: true,
      message: 'Ficheiro partilhado com sucesso'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao partilhar ficheiro',
      error: error.message
    });
  }
};

exports.generatePublicLink = async (req, res) => {
  try {
    const { fileId } = req.params;

    const file = await File.findOne({
      _id: fileId,
      owner: req.user.userId
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'Ficheiro não encontrado'
      });
    }

    if (!file.publicLink) {
      file.publicLink = crypto.randomBytes(32).toString('hex');
      file.isPublic = true;
      await file.save();
    }

    res.json({
      success: true,
      publicLink: `${process.env.FRONTEND_URL}/public/${file.publicLink}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar link público',
      error: error.message
    });
  }
};
