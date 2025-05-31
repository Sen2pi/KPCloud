const Share = require('../models/Share');
const User = require('../models/User');
const File = require('../models/File');
const Folder = require('../models/Folder');

// Pesquisar utilizadores
exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Termo de pesquisa deve ter pelo menos 2 caracteres'
      });
    }

    const users = await User.find({
      $and: [
        { _id: { $ne: req.user.userId } }, // Excluir utilizador atual
        { isActive: true },
        {
          $or: [
            { firstName: { $regex: q, $options: 'i' } },
            { lastName: { $regex: q, $options: 'i' } },
            { username: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } }
          ]
        }
      ]
    })
    .select('firstName lastName username email profilePicture')
    .limit(10);

    res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Erro ao pesquisar utilizadores:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao pesquisar utilizadores',
      error: error.message
    });
  }
};

// Partilhar ficheiro
exports.shareFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const { userId, permission = 'read' } = req.body;

    // Verificar se o ficheiro existe e se o utilizador é o dono
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

    // Verificar se o utilizador a partilhar existe
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Utilizador não encontrado'
      });
    }

    // Verificar se já existe partilha
    const existingShare = await Share.findOne({
      itemId: fileId,
      sharedWith: userId
    });

    if (existingShare) {
      return res.status(400).json({
        success: false,
        message: 'Ficheiro já está partilhado com este utilizador'
      });
    }

    // Criar nova partilha
    const share = new Share({
      itemId: fileId,
      itemType: 'file',
      itemModel: 'File',
      owner: req.user.userId,
      sharedWith: userId,
      permissions: permission
    });

    await share.save();

    res.json({
      success: true,
      message: 'Ficheiro partilhado com sucesso',
      share
    });
  } catch (error) {
    console.error('Erro ao partilhar ficheiro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao partilhar ficheiro',
      error: error.message
    });
  }
};

// Partilhar pasta
exports.shareFolder = async (req, res) => {
  try {
    const { folderId } = req.params;
    const { userId, permission = 'read' } = req.body;

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

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Utilizador não encontrado'
      });
    }

    const existingShare = await Share.findOne({
      itemId: folderId,
      sharedWith: userId
    });

    if (existingShare) {
      return res.status(400).json({
        success: false,
        message: 'Pasta já está partilhada com este utilizador'
      });
    }

    const share = new Share({
      itemId: folderId,
      itemType: 'folder',
      itemModel: 'Folder',
      owner: req.user.userId,
      sharedWith: userId,
      permissions: permission
    });

    await share.save();

    res.json({
      success: true,
      message: 'Pasta partilhada com sucesso',
      share
    });
  } catch (error) {
    console.error('Erro ao partilhar pasta:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao partilhar pasta',
      error: error.message
    });
  }
};

// Obter partilhas de um ficheiro
exports.getFileShares = async (req, res) => {
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

    const shares = await Share.find({
      itemId: fileId,
      isActive: true
    })
    .populate('sharedWith', 'firstName lastName username email profilePicture')
    .sort({ sharedAt: -1 });

    const formattedShares = shares.map(share => ({
      _id: share._id,
      user: share.sharedWith,
      permissions: share.permissions,
      sharedAt: share.sharedAt
    }));

    res.json({
      success: true,
      shares: formattedShares
    });
  } catch (error) {
    console.error('Erro ao obter partilhas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter partilhas',
      error: error.message
    });
  }
};

// Obter partilhas de uma pasta
exports.getFolderShares = async (req, res) => {
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

    const shares = await Share.find({
      itemId: folderId,
      isActive: true
    })
    .populate('sharedWith', 'firstName lastName username email profilePicture')
    .sort({ sharedAt: -1 });

    const formattedShares = shares.map(share => ({
      _id: share._id,
      user: share.sharedWith,
      permissions: share.permissions,
      sharedAt: share.sharedAt
    }));

    res.json({
      success: true,
      shares: formattedShares
    });
  } catch (error) {
    console.error('Erro ao obter partilhas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter partilhas',
      error: error.message
    });
  }
};

// Atualizar permissão
exports.updatePermission = async (req, res) => {
  try {
    const { shareId } = req.params;
    const { permission } = req.body;

    const share = await Share.findOne({
      _id: shareId,
      owner: req.user.userId
    });

    if (!share) {
      return res.status(404).json({
        success: false,
        message: 'Partilha não encontrada'
      });
    }

    share.permissions = permission;
    await share.save();

    res.json({
      success: true,
      message: 'Permissão atualizada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar permissão:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar permissão',
      error: error.message
    });
  }
};
exports.getSharedWithMe = async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;

    const filter = { 
      sharedWith: req.user.userId,
      isActive: true 
    };

    if (type && type !== 'all') {
      filter.itemType = type;
    }

    const shares = await Share.find(filter)
      .populate({
        path: 'owner',
        select: 'firstName lastName username email profilePicture'
      })
      .populate({
        path: 'itemId',
        select: 'originalName name size mimetype createdAt',
        // Nota: Mongoose irá automaticamente usar o modelo correto baseado no itemModel
      })
      .sort({ sharedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Share.countDocuments(filter);

    // Formatar dados para incluir informações do item
    const formattedItems = await Promise.all(shares.map(async (share) => {
      let item = null;
      
      try {
        if (share.itemType === 'file') {
          item = await File.findById(share.itemId)
            .select('originalName size mimetype createdAt filename path');
        } else {
          item = await Folder.findById(share.itemId)
            .select('name createdAt color');
        }
      } catch (error) {
        console.log('Item não encontrado:', share.itemId);
      }

      return {
        _id: share._id,
        itemType: share.itemType,
        item: item,
        owner: share.owner,
        permissions: share.permissions,
        sharedAt: share.sharedAt
      };
    }));

    // Filtrar itens onde o item ainda existe
    const validItems = formattedItems.filter(item => item.item !== null);

    res.json({
      success: true,
      items: validItems,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: validItems.length,
        pages: Math.ceil(validItems.length / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao obter itens partilhados comigo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter itens partilhados',
      error: error.message
    });
  }
};

exports.getSharedFolderContents = async (req, res) => {
  try {
    const { folderId } = req.params;
    
    console.log('=== GET SHARED FOLDER CONTENTS ===');
    console.log('Folder ID:', folderId);
    console.log('User ID:', req.user.userId);

    // Verificar se o utilizador tem acesso à pasta
    const share = await Share.findOne({
      itemId: folderId,
      itemType: 'folder',
      sharedWith: req.user.userId,
      isActive: true
    });

    if (!share) {
      return res.status(403).json({
        success: false,
        message: 'Não tens permissão para aceder a esta pasta'
      });
    }

    console.log('User has access to folder, loading contents...');

    // Obter ficheiros da pasta
    const files = await File.find({
      folder: folderId,
      isDeleted: false
    }).select('filename originalName mimetype size createdAt');

    // Obter subpastas
    const folders = await Folder.find({
      parent: folderId,
      isDeleted: false
    }).select('name color createdAt');

    console.log(`Found ${files.length} files and ${folders.length} folders`);

    // Formatar resposta
    const items = [
      ...folders.map(folder => ({
        _id: folder._id,
        type: 'folder',
        itemType: 'folder',
        name: folder.name,
        color: folder.color,
        createdAt: folder.createdAt,
        permissions: share.permissions // Herdar permissões da pasta pai
      })),
      ...files.map(file => ({
        _id: file._id,
        type: 'file',
        itemType: 'file',
        filename: file.filename,
        originalName: file.originalName,
        mimetype: file.mimetype,
        size: file.size,
        createdAt: file.createdAt,
        permissions: share.permissions // Herdar permissões da pasta pai
      }))
    ];

    res.json({
      success: true,
      items,
      folderInfo: {
        permissions: share.permissions,
        sharedAt: share.sharedAt
      }
    });
  } catch (error) {
    console.error('Erro ao obter conteúdo da pasta partilhada:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter conteúdo da pasta',
      error: error.message
    });
  }
};

// Remover partilha
exports.removeShare = async (req, res) => {
  try {
    const { shareId } = req.params;

    const share = await Share.findOne({
      _id: shareId,
      owner: req.user.userId
    });

    if (!share) {
      return res.status(404).json({
        success: false,
        message: 'Partilha não encontrada'
      });
    }

    await Share.findByIdAndDelete(shareId);

    res.json({
      success: true,
      message: 'Partilha removida com sucesso'
    });
  } catch (error) {
    console.error('Erro ao remover partilha:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao remover partilha',
      error: error.message
    });
  }
};
