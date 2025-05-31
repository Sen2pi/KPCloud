const File = require('../models/File');
const Folder = require('../models/Folder');
const User = require('../models/User');
const fs = require('fs').promises;

exports.moveFileToTrash = async (req, res) => {
  console.log('=== BACKEND: moveFileToTrash chamado ===');
  console.log('File ID:', req.params.fileId);
  console.log('User ID:', req.user.userId);
  
  try {
    const { fileId } = req.params;
    console.log(`Tentando mover ficheiro ${fileId} para o lixo`);

    const file = await File.findOne({
      _id: fileId,
      owner: req.user.userId,
      isDeleted: false
    });

    if (!file) {
      console.log(`Ficheiro ${fileId} não encontrado`);
      return res.status(404).json({
        success: false,
        message: 'Ficheiro não encontrado'
      });
    }

    console.log(`Ficheiro encontrado: ${file.originalName}`);

    // Usar o método softDelete
    await file.softDelete(req.user.userId);

    console.log(`Ficheiro ${file.originalName} movido para o lixo com sucesso`);

    res.json({
      success: true,
      message: 'Ficheiro movido para o lixo com sucesso'
    });
  } catch (error) {
    console.error('=== ERRO BACKEND: moveFileToTrash ===');
    console.error('Erro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao mover ficheiro para o lixo',
      error: error.message
    });
  }
};


// Mover pasta para o lixo (com conteúdo)
exports.moveFolderToTrash = async (req, res) => {
  try {
    const { folderId } = req.params;
    console.log(`=== Tentando mover pasta ${folderId} para o lixo ===`);

    const folder = await Folder.findOne({
      _id: folderId,
      owner: req.user.userId,
      isDeleted: false
    });

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Pasta não encontrada'
      });
    }

    console.log(`Pasta encontrada: ${folder.name}`);

    // Verificar se a pasta tem conteúdo
    const [files, subfolders] = await Promise.all([
      File.find({ 
        folder: folderId, 
        isDeleted: false 
      }),
      Folder.find({ 
        parent: folderId, 
        isDeleted: false 
      })
    ]);

    console.log(`Pasta contém: ${files.length} ficheiros e ${subfolders.length} subpastas`);

    // Mover todos os ficheiros da pasta para o lixo
    for (const file of files) {
      await file.softDelete(req.user.userId);
      console.log(`Ficheiro ${file.originalName} movido para o lixo`);
    }

    // Mover todas as subpastas para o lixo (recursivo)
    for (const subfolder of subfolders) {
      await subfolder.softDelete(req.user.userId);
      console.log(`Subpasta ${subfolder.name} movida para o lixo`);
    }

    // Agora mover a pasta principal para o lixo
    await folder.softDelete(req.user.userId);

    console.log(`Pasta ${folder.name} e todo o seu conteúdo movidos para o lixo`);

    res.json({
      success: true,
      message: `Pasta "${folder.name}" e todo o seu conteúdo movidos para o lixo`,
      details: {
        filesDeleted: files.length,
        foldersDeleted: subfolders.length + 1
      }
    });
  } catch (error) {
    console.error('Erro ao mover pasta para o lixo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao mover pasta para o lixo',
      error: error.message
    });
  }
};


// Restaurar ficheiro do lixo
exports.restoreFile = async (req, res) => {
  try {
    const { fileId } = req.params;

    const file = await File.findOne({
      _id: fileId,
      owner: req.user.userId,
      isDeleted: true
    }).setOptions({ includeDeleted: true });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'Ficheiro não encontrado no lixo'
      });
    }

    // Usar o método restore
    await file.restore();

    console.log(`Ficheiro ${file.originalName} restaurado do lixo`);

    res.json({
      success: true,
      message: 'Ficheiro restaurado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao restaurar ficheiro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao restaurar ficheiro',
      error: error.message
    });
  }
};

// Restaurar pasta do lixo
exports.restoreFolder = async (req, res) => {
  try {
    const { folderId } = req.params;

    const folder = await Folder.findOne({
      _id: folderId,
      owner: req.user.userId,
      isDeleted: true
    }).setOptions({ includeDeleted: true });

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Pasta não encontrada no lixo'
      });
    }

    // Usar o método restore
    await folder.restore();

    console.log(`Pasta ${folder.name} restaurada do lixo`);

    res.json({
      success: true,
      message: 'Pasta restaurada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao restaurar pasta:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao restaurar pasta',
      error: error.message
    });
  }
};

// Eliminar ficheiro permanentemente
exports.deleteFilePermanently = async (req, res) => {
  try {
    const { fileId } = req.params;

    const file = await File.findOne({
      _id: fileId,
      owner: req.user.userId,
      isDeleted: true
    }).setOptions({ includeDeleted: true });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'Ficheiro não encontrado no lixo'
      });
    }

    // Eliminar ficheiro físico
    try {
      await fs.unlink(file.path);
      console.log(`Ficheiro físico eliminado: ${file.path}`);
    } catch (error) {
      console.error('Erro ao eliminar ficheiro físico:', error);
    }

    // Atualizar armazenamento usado
    const user = await User.findById(req.user.userId);
    if (user) {
      user.storageUsed = Math.max(0, user.storageUsed - file.size);
      await user.save();
    }

    // Eliminar registo da base de dados permanentemente
    await File.findByIdAndDelete(fileId);

    console.log(`Ficheiro ${file.originalName} eliminado permanentemente`);

    res.json({
      success: true,
      message: 'Ficheiro eliminado permanentemente'
    });
  } catch (error) {
    console.error('Erro ao eliminar ficheiro permanentemente:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao eliminar ficheiro permanentemente',
      error: error.message
    });
  }
};

// Eliminar pasta permanentemente
exports.deleteFolderPermanently = async (req, res) => {
  try {
    const { folderId } = req.params;

    const folder = await Folder.findOne({
      _id: folderId,
      owner: req.user.userId,
      isDeleted: true
    }).setOptions({ includeDeleted: true });

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Pasta não encontrada no lixo'
      });
    }

    // Eliminar registo da base de dados permanentemente
    await Folder.findByIdAndDelete(folderId);

    console.log(`Pasta ${folder.name} eliminada permanentemente`);

    res.json({
      success: true,
      message: 'Pasta eliminada permanentemente'
    });
  } catch (error) {
    console.error('Erro ao eliminar pasta permanentemente:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao eliminar pasta permanentemente',
      error: error.message
    });
  }
};

// Obter itens do lixo
exports.getTrash = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    console.log(`A carregar lixo para utilizador: ${req.user.userId}`);

    // Buscar ficheiros e pastas eliminados
    const [files, folders] = await Promise.all([
      File.find({
        owner: req.user.userId,
        isDeleted: true
      })
      .setOptions({ includeDeleted: true })
      .populate('owner', 'username firstName lastName')
      .sort({ deletedAt: -1 }),

      Folder.find({
        owner: req.user.userId,
        isDeleted: true
      })
      .setOptions({ includeDeleted: true })
      .populate('owner', 'username firstName lastName')
      .sort({ deletedAt: -1 })
    ]);

    // Adicionar tipo aos itens
    const filesWithType = files.map(file => ({
      ...file.toObject(),
      type: 'file'
    }));

    const foldersWithType = folders.map(folder => ({
      ...folder.toObject(),
      type: 'folder'
    }));

    // Combinar e ordenar por data de eliminação
    const trashedItems = [...filesWithType, ...foldersWithType]
      .sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt));

    console.log(`Encontrados ${trashedItems.length} itens no lixo`);

    res.json({
      success: true,
      trashedItems,
      total: trashedItems.length
    });
  } catch (error) {
    console.error('Erro ao obter itens do lixo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter itens do lixo',
      error: error.message
    });
  }
};

// Esvaziar lixo
exports.emptyTrash = async (req, res) => {
  try {
    console.log(`A esvaziar lixo para utilizador: ${req.user.userId}`);

    // Buscar todos os ficheiros eliminados
    const deletedFiles = await File.find({
      owner: req.user.userId,
      isDeleted: true
    }).setOptions({ includeDeleted: true });

    console.log(`Encontrados ${deletedFiles.length} ficheiros para eliminar permanentemente`);

    // Eliminar ficheiros físicos
    let totalSize = 0;
    for (const file of deletedFiles) {
      try {
        await fs.unlink(file.path);
        totalSize += file.size;
        console.log(`Ficheiro físico eliminado: ${file.path}`);
      } catch (error) {
        console.error(`Erro ao eliminar ficheiro físico ${file.path}:`, error);
      }
    }

    // Eliminar registos da base de dados permanentemente
    const [deletedFilesResult, deletedFoldersResult] = await Promise.all([
      File.deleteMany({
        owner: req.user.userId,
        isDeleted: true
      }),
      Folder.deleteMany({
        owner: req.user.userId,
        isDeleted: true
      })
    ]);

    console.log(`Eliminados ${deletedFilesResult.deletedCount} ficheiros e ${deletedFoldersResult.deletedCount} pastas`);

    // Atualizar armazenamento usado
    const user = await User.findById(req.user.userId);
    if (user) {
      user.storageUsed = Math.max(0, user.storageUsed - totalSize);
      await user.save();
      console.log(`Armazenamento atualizado: -${totalSize} bytes`);
    }

    res.json({
      success: true,
      message: 'Lixo esvaziado com sucesso',
      deletedFiles: deletedFilesResult.deletedCount,
      deletedFolders: deletedFoldersResult.deletedCount,
      freedSpace: totalSize
    });
  } catch (error) {
    console.error('Erro ao esvaziar lixo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao esvaziar lixo',
      error: error.message
    });
  }
};
