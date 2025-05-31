const Folder = require('../models/Folder');
const File = require('../models/File');
const { validationResult } = require('express-validator');

exports.createFolder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: errors.array()
      });
    }

    const { name, parentId, color } = req.body;

    // Verificar se a pasta pai existe (se especificada)
    let parentFolder = null;
    let path = name;

    if (parentId) {
      parentFolder = await Folder.findOne({
        _id: parentId,
        $or: [
          { owner: req.user.userId },
          { 'sharedWith.user': req.user.userId }
        ]
      });

      if (!parentFolder) {
        return res.status(404).json({
          success: false,
          message: 'Pasta pai não encontrada'
        });
      }

      path = `${parentFolder.path}/${name}`;
    }

    // Verificar se já existe uma pasta com o mesmo nome
    const existingFolder = await Folder.findOne({
      name,
      parent: parentId || null,
      owner: req.user.userId
    });

    if (existingFolder) {
      return res.status(400).json({
        success: false,
        message: 'Já existe uma pasta com este nome'
      });
    }

    const folder = new Folder({
      name,
      owner: req.user.userId,
      parent: parentId || null,
      path,
      color: color || '#3498db'
    });

    await folder.save();

    // Emitir evento via Socket.IO
    const { io } = require('../../server');
    io.to(parentId || 'root').emit('folder-created', {
      folder: await folder.populate('owner', 'username firstName lastName')
    });

    res.status(201).json({
      success: true,
      message: 'Pasta criada com sucesso',
      folder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao criar pasta',
      error: error.message
    });
  }
};

exports.getFolders = async (req, res) => {
  try {
    const { parentId, search } = req.query;

    const query = {
      $or: [
        { owner: req.user.userId },
        { 'sharedWith.user': req.user.userId }
      ]
    };

    if (parentId && parentId !== 'null') {
      query.parent = parentId;
    } else {
      query.parent = null;
    }

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const folders = await Folder.find(query)
      .populate('owner', 'username firstName lastName')
      .populate('parent', 'name')
      .sort({ name: 1 });

    res.json({
      success: true,
      folders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao obter pastas',
      error: error.message
    });
  }
};

exports.updateFolder = async (req, res) => {
  try {
    const { folderId } = req.params;
    const { name, color } = req.body;

    const folder = await Folder.findOne({
      _id: folderId,
      owner: req.user.userId
    });

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Pasta não encontrada'
      });
    }

    if (name) folder.name = name;
    if (color) folder.color = color;

    await folder.save();

    // Emitir evento via Socket.IO
    const { io } = require('../../server');
    io.to(folder.parent || 'root').emit('folder-updated', { folder });

    res.json({
      success: true,
      message: 'Pasta atualizada com sucesso',
      folder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar pasta',
      error: error.message
    });
  }
};

exports.deleteFolder = async (req, res) => {
  try {
    const { folderId } = req.params;

    const folder = await Folder.findOne({
      _id: folderId,
      owner: req.user.userId
    });

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Pasta não encontrada'
      });
    }

    // Verificar se a pasta tem subpastas ou ficheiros
    const hasSubfolders = await Folder.countDocuments({ parent: folderId });
    const hasFiles = await File.countDocuments({ folder: folderId });

    if (hasSubfolders > 0 || hasFiles > 0) {
      return res.status(400).json({
        success: false,
        message: 'Não é possível eliminar uma pasta que contém ficheiros ou subpastas'
      });
    }

    await Folder.findByIdAndDelete(folderId);

    // Emitir evento via Socket.IO
    const { io } = require('../../server');
    io.to(folder.parent || 'root').emit('folder-deleted', { folderId });

    res.json({
      success: true,
      message: 'Pasta eliminada com sucesso'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao eliminar pasta',
      error: error.message
    });
  }
};

exports.shareFolder = async (req, res) => {
  try {
    const { folderId } = req.params;
    const { userEmail, permissions = 'read' } = req.body;

    const folder = await Folder.findOne({
      _id: folderId,
      owner: req.user.userId
    });

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Pasta não encontrada'
      });
    }

    const User = require('../models/User');
    const targetUser = await User.findOne({ email: userEmail });
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Utilizador não encontrado'
      });
    }

    // Verificar se já está partilhado
    const existingShare = folder.sharedWith.find(
      share => share.user.toString() === targetUser._id.toString()
    );

    if (existingShare) {
      existingShare.permissions = permissions;
    } else {
      folder.sharedWith.push({
        user: targetUser._id,
        permissions
      });
    }

    await folder.save();

    res.json({
      success: true,
      message: 'Pasta partilhada com sucesso'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao partilhar pasta',
      error: error.message
    });
  }
};
