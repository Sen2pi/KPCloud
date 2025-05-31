const Folder = require('../models/Folder');
const File = require('../models/File');
const User = require('../models/User');

// Criar nova pasta
exports.createFolder = async (req, res) => {
  try {
    console.log('=== CREATE FOLDER BACKEND ===');
    console.log('Request body:', req.body);
    console.log('User ID:', req.user.userId);

    const { name, color, parent } = req.body;

    // Validação melhorada
    if (!name || typeof name !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Nome da pasta é obrigatório e deve ser uma string válida'
      });
    }

    const trimmedName = name.trim();
    
    if (!trimmedName) {
      return res.status(400).json({
        success: false,
        message: 'Nome da pasta não pode estar vazio'
      });
    }

    // PREVENIR LOOPS: Verificar se parent é diferente de si próprio
    if (parent && parent.toString() === 'self') {
      return res.status(400).json({
        success: false,
        message: 'Não é possível criar pasta dentro de si própria'
      });
    }

    // Verificar se já existe uma pasta com o mesmo nome na mesma localização
    const existingFolder = await Folder.findOne({
      name: trimmedName,
      parent: parent || null,
      owner: req.user.userId,
      isDeleted: false
    });

    if (existingFolder) {
      return res.status(400).json({
        success: false,
        message: 'Já existe uma pasta com este nome nesta localização'
      });
    }

    // Gerar path seguro baseado na hierarquia
    let folderPath;
    if (parent) {
      const parentFolder = await Folder.findOne({
        _id: parent,
        owner: req.user.userId,
        isDeleted: false
      });
      
      if (!parentFolder) {
        return res.status(404).json({
          success: false,
          message: 'Pasta pai não encontrada'
        });
      }
      
      // PREVENIR LOOPS: Verificar se não estamos a criar loop infinito
      if (parentFolder.path.includes(`/${trimmedName}/`)) {
        return res.status(400).json({
          success: false,
          message: 'Não é possível criar pasta que causaria loop infinito'
        });
      }
      
      folderPath = `${parentFolder.path}/${trimmedName}`;
    } else {
      folderPath = `/${trimmedName}`;
    }

    console.log('Creating folder with path:', folderPath);

    // VALIDAÇÃO ADICIONAL: Verificar se path já existe
    const existingPath = await Folder.findOne({
      path: folderPath,
      owner: req.user.userId,
      isDeleted: false
    });

    if (existingPath) {
      return res.status(400).json({
        success: false,
        message: 'Já existe uma pasta com este caminho'
      });
    }

    const folder = new Folder({
      name: trimmedName,
      color: color || '#3498db',
      parent: parent || null,
      path: folderPath,
      owner: req.user.userId
    });

    await folder.save();

    console.log('Pasta criada com sucesso:', folder);

    res.status(201).json({
      success: true,
      message: 'Pasta criada com sucesso',
      folder
    });
  } catch (error) {
    console.error('=== ERRO CREATE FOLDER ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Erro ao criar pasta',
      error: error.message
    });
  }
};

// Obter pastas
exports.getFolders = async (req, res) => {
  try {
    const { parent } = req.query;

    console.log('=== GET FOLDERS ===');
    console.log('Parent:', parent);
    console.log('User ID:', req.user.userId);

    // CORREÇÃO: Query mais específica para evitar loops
    const query = {
      owner: req.user.userId,
      isDeleted: false
    };

    // Se parent for especificado, usar só esse
    if (parent && parent !== 'null' && parent !== 'undefined') {
      query.parent = parent;
    } else {
      // Se não há parent, mostrar só pastas raiz
      query.parent = null;
    }

    const folders = await Folder.find(query).sort({ createdAt: -1 });

    // VALIDAÇÃO ADICIONAL: Filtrar pastas que possam causar loops
    const safeFolders = folders.filter(folder => {
      // Verificar se o path não contém loops óbvios
      const pathParts = folder.path.split('/').filter(p => p);
      const uniqueParts = [...new Set(pathParts)];
      return pathParts.length === uniqueParts.length; // Se diferentes, há duplicação
    });

    console.log('Folders found:', safeFolders.length);

    res.json({
      success: true,
      folders: safeFolders
    });
  } catch (error) {
    console.error('Erro ao obter pastas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter pastas',
      error: error.message
    });
  }
};

// Atualizar pasta
exports.updateFolder = async (req, res) => {
  try {
    const { folderId } = req.params;
    const { name, color } = req.body;

    console.log('=== UPDATE FOLDER ===');
    console.log('Folder ID:', folderId);
    console.log('Data:', { name, color });

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

    const oldPath = folder.path;

    if (name) {
      folder.name = name.trim();
      
      // Recalcular path se nome mudou
      if (folder.parent) {
        const parentFolder = await Folder.findById(folder.parent);
        if (parentFolder) {
          folder.path = `${parentFolder.path}/${folder.name}`;
        }
      } else {
        folder.path = `/${folder.name}`;
      }
    }
    
    if (color) folder.color = color;

    await folder.save();

    // Se path mudou, atualizar paths de todas as subpastas
    if (name && oldPath !== folder.path) {
      await updateChildrenPaths(folderId);
    }

    console.log('Pasta atualizada com sucesso');

    res.json({
      success: true,
      message: 'Pasta atualizada com sucesso',
      folder
    });
  } catch (error) {
    console.error('Erro ao atualizar pasta:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar pasta',
      error: error.message
    });
  }
};

// Mover pasta para outra pasta
exports.moveFolder = async (req, res) => {
  try {
    const { folderId } = req.params;
    const { targetFolderId } = req.body;

    console.log('=== MOVE FOLDER CONTROLLER ===');
    console.log('Folder ID:', folderId);
    console.log('Target Folder ID:', targetFolderId);

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

    if (folderId === targetFolderId) {
      return res.status(400).json({
        success: false,
        message: 'Não é possível mover uma pasta para si própria'
      });
    }

    // Gerar novo path
    let newPath;
    if (targetFolderId) {
      const targetFolder = await Folder.findOne({
        _id: targetFolderId,
        owner: req.user.userId,
        isDeleted: false
      });

      if (!targetFolder) {
        return res.status(404).json({
          success: false,
          message: 'Pasta de destino não encontrada'
        });
      }

      // VALIDAÇÃO CRÍTICA: Verificar loops
      const isDescendant = await checkIfDescendant(targetFolderId, folderId);
      if (isDescendant) {
        return res.status(400).json({
          success: false,
          message: 'Não é possível mover uma pasta para dentro de si mesma'
        });
      }

      newPath = `${targetFolder.path}/${folder.name}`;
    } else {
      newPath = `/${folder.name}`;
    }

    // Atualizar pasta
    folder.parent = targetFolderId || null;
    folder.path = newPath;
    await folder.save();

    // Atualizar paths de todas as subpastas
    await updateChildrenPaths(folderId);

    console.log('Pasta movida com sucesso');

    res.json({
      success: true,
      message: 'Pasta movida com sucesso',
      folder
    });
  } catch (error) {
    console.error('=== ERRO MOVE FOLDER ===');
    console.error('Error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Erro ao mover pasta',
      error: error.message
    });
  }
};

// Mover pasta para o lixo
exports.moveToTrash = async (req, res) => {
  try {
    const { folderId } = req.params;

    console.log('=== MOVE FOLDER TO TRASH ===');
    console.log('Folder ID:', folderId);

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

    // Usar o método softDelete do modelo
    await folder.softDelete(req.user.userId);

    // Mover hierarquia completa para o lixo
    await moveHierarchyToTrash(folderId, req.user.userId);

    console.log('Pasta movida para lixo com sucesso');

    res.json({
      success: true,
      message: 'Pasta movida para o lixo com sucesso'
    });
  } catch (error) {
    console.error('Erro ao mover pasta para lixo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao mover pasta para lixo',
      error: error.message
    });
  }
};

// Função auxiliar para verificar se uma pasta é descendente de outra
const checkIfDescendant = async (childId, potentialParentId) => {
  try {
    console.log('Checking if descendant:', { childId, potentialParentId });
    
    let currentFolder = await Folder.findById(childId);
    const visited = new Set(); // Prevenir loops infinitos
    
    while (currentFolder && currentFolder.parent) {
      console.log('Checking parent:', currentFolder.parent.toString());
      
      // Verificar se já visitámos esta pasta (loop detection)
      if (visited.has(currentFolder.parent.toString())) {
        console.log('Loop detectado, a parar verificação');
        return false;
      }
      
      visited.add(currentFolder.parent.toString());
      
      if (currentFolder.parent.toString() === potentialParentId) {
        return true;
      }
      currentFolder = await Folder.findById(currentFolder.parent);
    }
    
    return false;
  } catch (error) {
    console.error('Error checking descendant:', error);
    return false;
  }
};

// Função auxiliar para atualizar paths das subpastas
const updateChildrenPaths = async (parentId) => {
  try {
    const children = await Folder.find({ parent: parentId, isDeleted: false });
    
    for (const child of children) {
      const parent = await Folder.findById(child.parent);
      if (parent) {
        child.path = `${parent.path}/${child.name}`;
        await child.save();
        // Recursivamente atualizar filhos
        await updateChildrenPaths(child._id);
      }
    }
  } catch (error) {
    console.error('Error updating children paths:', error);
  }
};

// Função auxiliar para mover hierarquia completa para o lixo
const moveHierarchyToTrash = async (folderId, userId) => {
  try {
    const deletedAt = new Date();

    // Encontrar todas as subpastas
    const subfolders = await Folder.find({
      parent: folderId,
      owner: userId,
      isDeleted: false
    });

    // Recursivamente eliminar subpastas
    for (const subfolder of subfolders) {
      await subfolder.softDelete(userId);
      await moveHierarchyToTrash(subfolder._id, userId);
    }

    // Marcar todos os ficheiros desta pasta como eliminados
    await File.updateMany({
      folder: folderId,
      owner: userId,
      isDeleted: false
    }, {
      isDeleted: true,
      deletedAt,
      deletedBy: userId
    });
  } catch (error) {
    console.error('Error moving hierarchy to trash:', error);
    throw error;
  }
};
