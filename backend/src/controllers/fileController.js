const File = require('../models/File');
const User = require('../models/User');
const Folder = require('../models/Folder');
const Share = require('../models/Share'); 
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises; // ADICIONAR: Para 
const crypto = require('crypto');

/*// SOLUÇÃO 1: Usar fs.mkdirSync (mais simples)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads');
    
    try {
      // Usar versão síncrona
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    } catch (error) {
      console.error('Erro ao criar diretório:', error);
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});*/

// ALTERNATIVA - SOLUÇÃO 2: Usar fs.mkdir com callback

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads');
    
    // Verificar se existe primeiro
    fs.access(uploadPath, fs.constants.F_OK, (err) => {
      if (err) {
        // Não existe, criar
        fs.mkdir(uploadPath, { recursive: true }, (mkdirErr) => {
          if (mkdirErr) {
            console.error('Erro ao criar diretório:', mkdirErr);
            return cb(mkdirErr);
          }
          cb(null, uploadPath);
        });
      } else {
        // Já existe
        cb(null, uploadPath);
      }
    });
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
    // Lista básica de tipos permitidos (expande conforme necessário)
    // Array completo para todas as categorias de estatísticas
    const allowedTypes = [
      // ========== IMAGENS ==========
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 
      'image/bmp', 'image/svg+xml', 'image/tiff', 'image/ico', 
      'image/vnd.microsoft.icon', 'image/avif',

      // ========== DOCUMENTOS ==========
      // PDF
      'application/pdf',
      
      // Microsoft Office
      'application/msword', // .doc
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/vnd.ms-excel', // .xls
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-powerpoint', // .ppt
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
      
      // Texto
      'text/plain', 'text/csv', 'text/rtf',
      
      // OpenDocument
      'application/vnd.oasis.opendocument.text', // .odt
      'application/vnd.oasis.opendocument.spreadsheet', // .ods
      'application/vnd.oasis.opendocument.presentation', // .odp
      
      // Outros documentos
      'application/rtf', 'application/vnd.visio',

      // ========== PROGRAMAÇÃO ==========
      // JavaScript/TypeScript
      'text/javascript', 'application/javascript',
      
      // Web
      'text/html', 'text/css', 'application/xhtml+xml',
      
      // Dados
      'application/json', 'application/ld+json',
      'application/xml', 'text/xml',
      
      // Scripts
      'application/x-sh', 'application/x-csh',
      'application/x-httpd-php',
      
      // Outros formatos de programação (como text/plain para extensões específicas)
      'text/x-python', 'text/x-java', 'text/x-c', 'text/x-c++',

      // ========== COMPACTADOS ==========
      'application/zip',
      'application/x-rar-compressed', 'application/vnd.rar',
      'application/x-7z-compressed',
      'application/gzip', 'application/x-gzip',
      'application/x-tar',
      'application/x-bzip', 'application/x-bzip2',
      'application/x-freearc',

      // ========== VÍDEOS ==========
      'video/mp4', 'video/mpeg', 'video/quicktime', // .mp4, .mpeg, .mov
      'video/x-msvideo', // .avi
      'video/webm', 'video/ogg',
      'video/x-flv', // .flv
      'video/x-matroska', // .mkv
      'video/3gpp', 'video/3gpp2', // .3gp, .3g2
      'video/mp2t', // .ts

      // ========== ÁUDIO ==========
      'audio/mpeg', 'audio/mp3', // .mp3
      'audio/wav', 'audio/x-wav',
      'audio/ogg', 'audio/opus',
      'audio/aac', 'audio/x-aac',
      'audio/webm',
      'audio/midi', 'audio/x-midi',
      'audio/3gpp', 'audio/3gpp2',

      // ========== OUTROS TIPOS COMUNS ==========
      // Fontes
      'font/otf', 'font/ttf', 'font/woff', 'font/woff2',
      'application/vnd.ms-fontobject',
      
      // E-books
      'application/epub+zip', 'application/vnd.amazon.ebook',
      
      // Arquivos
      'application/java-archive', // .jar
      'application/vnd.apple.installer+xml', // .mpkg
      
      // Calendário
      'text/calendar',
      
      // Binários genéricos
      'application/octet-stream',
      
      // Flash
      'application/x-shockwave-flash'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de ficheiro não permitido: ${file.mimetype}`), false);
    }
  }
});

// Middleware para upload
exports.uploadMiddleware = upload.single('file');

// Upload de ficheiros
exports.uploadFiles = async (req, res) => {
  try {
    console.log('=== UPLOAD FILES DEBUG ===');
    console.log('Req.file:', req.file);
    console.log('Req.files:', req.files);
    console.log('Req.body:', req.body);

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
      await fsPromises.unlink(req.file.path).catch(() => {});
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

    console.log('✅ Ficheiro uploadado com sucesso:', file.originalName);

    res.status(201).json({
      success: true,
      message: 'Ficheiro enviado com sucesso',
      file
    });

  } catch (error) {
    console.error('=== ERRO UPLOAD FILES ===');
    console.error('Error:', error);
    
    // Limpar ficheiro em caso de erro
    if (req.file) {
      await fsPromises.unlink(req.file.path).catch(() => {});
    }

    res.status(500).json({
      success: false,
      message: 'Erro ao enviar ficheiro',
      error: error.message
    });
  }
};
// Mover ficheiro para outra pasta
exports.moveFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const { folderId } = req.body;

    console.log('=== MOVE FILE CONTROLLER ===');
    console.log('File ID:', fileId);
    console.log('Target Folder ID:', folderId);
    console.log('User ID:', req.user.userId);
    console.log('Request body:', req.body);

    // Validar se fileId é um ObjectId válido
    if (!fileId || !fileId.match(/^[0-9a-fA-F]{24}$/)) {
      console.log('File ID inválido:', fileId);
      return res.status(400).json({
        success: false,
        message: 'ID de ficheiro inválido'
      });
    }

    // Verificar se o ficheiro existe e se o utilizador é o proprietário
    const file = await File.findOne({
      _id: fileId,
      owner: req.user.userId,
      isDeleted: false
    });

    console.log('Ficheiro encontrado:', file ? 'Sim' : 'Não');
    if (file) {
      console.log('- Nome:', file.originalName);
      console.log('- Pasta atual:', file.folder);
    }

    if (!file) {
      console.log('Ficheiro não encontrado ou não pertence ao utilizador');
      return res.status(404).json({
        success: false,
        message: 'Ficheiro não encontrado'
      });
    }

    // Se folderId for null ou undefined, está a mover para a raiz
    if (folderId && folderId !== 'null' && folderId !== 'undefined') {
      console.log('Verificando pasta de destino...');
      
      // Validar se folderId é um ObjectId válido
      if (!folderId.match(/^[0-9a-fA-F]{24}$/)) {
        console.log('Folder ID inválido:', folderId);
        return res.status(400).json({
          success: false,
          message: 'ID de pasta inválido'
        });
      }

      // Verificar se a pasta de destino existe e pertence ao utilizador
      const targetFolder = await Folder.findOne({
        _id: folderId,
        owner: req.user.userId,
        isDeleted: false
      });

      console.log('Pasta de destino encontrada:', targetFolder ? 'Sim' : 'Não');
      if (targetFolder) {
        console.log('- Nome da pasta:', targetFolder.name);
        console.log('- Path da pasta:', targetFolder.path);
      }

      if (!targetFolder) {
        console.log('Pasta de destino não encontrada');
        
        // Debug: Verificar se a pasta existe mas com outro owner
        const folderWithDifferentOwner = await Folder.findById(folderId);
        if (folderWithDifferentOwner) {
          console.log('Pasta existe mas pertence a outro utilizador:', folderWithDifferentOwner.owner);
        }
        
        return res.status(404).json({
          success: false,
          message: 'Pasta de destino não encontrada ou não tens permissão para aceder'
        });
      }

      // Verificar se não está a tentar mover para a mesma pasta
      if (file.folder && file.folder.toString() === folderId) {
        console.log('Tentativa de mover para a mesma pasta');
        return res.status(400).json({
          success: false,
          message: 'O ficheiro já está nesta pasta'
        });
      }
    } else {
      console.log('Movendo ficheiro para a raiz (sem pasta)');
    }

    // Guardar pasta antiga para logs
    const oldFolder = file.folder;

    // Atualizar a pasta do ficheiro
    file.folder = (folderId && folderId !== 'null' && folderId !== 'undefined') ? folderId : null;
    await file.save();

    console.log('Ficheiro movido com sucesso');
    console.log('- Pasta antiga:', oldFolder);
    console.log('- Pasta nova:', file.folder);

    res.json({
      success: true,
      message: 'Ficheiro movido com sucesso',
      file: {
        _id: file._id,
        originalName: file.originalName,
        folder: file.folder
      }
    });
  } catch (error) {
    console.error('=== ERRO MOVE FILE ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Erro ao mover ficheiro',
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
    console.log('=== DOWNLOAD FILE DEBUG ===');
    console.log('File ID:', fileId);
    console.log('User ID:', req.user.userId);

    // Validar se fileId é um ObjectId válido
    if (!fileId || !fileId.match(/^[0-9a-fA-F]{24}$/)) {
      console.log('File ID inválido:', fileId);
      return res.status(400).json({
        success: false,
        message: 'ID de ficheiro inválido'
      });
    }

    // Encontrar o ficheiro
    console.log('Procurando ficheiro na base de dados...');
    const file = await File.findById(fileId);

    if (!file) {
      console.log('Ficheiro não encontrado na base de dados');
      return res.status(404).json({
        success: false,
        message: 'Ficheiro não encontrado'
      });
    }

    console.log('Ficheiro encontrado:');
    console.log('- Nome:', file.originalName);
    console.log('- Path:', file.path);
    console.log('- Size:', file.size);
    console.log('- Owner:', file.owner);

    // Verificar permissões
    let hasAccess = false;
    let accessType = 'none';

    // 1. Verificar se é o proprietário
    if (file.owner.toString() === req.user.userId.toString()) {
      hasAccess = true;
      accessType = 'owner';
      console.log('✓ Acesso como proprietário');
    } else {
      console.log('Não é proprietário, verificando partilhas...');
      
      // 2. Verificar partilha direta do ficheiro
      const fileShare = await Share.findOne({
        itemId: fileId,
        itemType: 'file',
        sharedWith: req.user.userId,
        isActive: true
      });

      if (fileShare) {
        hasAccess = true;
        accessType = 'file_shared';
        console.log('✓ Acesso através de partilha de ficheiro:', fileShare.permissions);
      } else {
        console.log('Ficheiro não partilhado diretamente, verificando pasta...');
        
        // 3. Verificar se a pasta está partilhada
        if (file.folder) {
          console.log('Verificando partilha da pasta:', file.folder);
          const folderShare = await Share.findOne({
            itemId: file.folder,
            itemType: 'folder',
            sharedWith: req.user.userId,
            isActive: true
          });

          if (folderShare) {
            hasAccess = true;
            accessType = 'folder_shared';
            console.log('✓ Acesso através de pasta partilhada:', folderShare.permissions);
          } else {
            console.log('Pasta não partilhada');
          }
        } else {
          console.log('Ficheiro não está numa pasta');
        }
      }
    }

    if (!hasAccess) {
      console.log('❌ Utilizador não tem permissão');
      return res.status(403).json({
        success: false,
        message: 'Não tens permissão para fazer download deste ficheiro'
      });
    }

    // Verificar se o ficheiro físico existe
    console.log('Verificando se ficheiro físico existe:', file.path);
    
    if (!file.path) {
      console.log('❌ Path do ficheiro não definido');
      return res.status(500).json({
        success: false,
        message: 'Caminho do ficheiro não definido'
      });
    }

    // Verificar se o path é absoluto ou relativo
    let fullPath = file.path;
    if (!path.isAbsolute(file.path)) {
      fullPath = path.join(__dirname, '../../', file.path);
      console.log('Path relativo convertido para absoluto:', fullPath);
    }

    // CORRIGIR: Agora fs.existsSync funciona
    if (!fs.existsSync(fullPath)) {
      console.log('❌ Ficheiro físico não encontrado:', fullPath);
      
      // Tentar caminhos alternativos
      const alternativePaths = [
        path.join(__dirname, '../../uploads/', file.filename),
        path.join(__dirname, '../../uploads/temp/', file.filename),
        path.join(process.cwd(), 'uploads/', file.filename),
        path.join(process.cwd(), 'uploads/temp/', file.filename)
      ];

      let foundPath = null;
      for (const altPath of alternativePaths) {
        console.log('Tentando caminho alternativo:', altPath);
        if (fs.existsSync(altPath)) {
          foundPath = altPath;
          console.log('✓ Ficheiro encontrado em:', altPath);
          break;
        }
      }

      if (!foundPath) {
        return res.status(404).json({
          success: false,
          message: 'Ficheiro físico não encontrado no servidor',
          debug: {
            originalPath: file.path,
            fullPath,
            alternativesTried: alternativePaths
          }
        });
      }

      fullPath = foundPath;
    }

    console.log('✓ Ficheiro físico encontrado em:', fullPath);

    // Obter informações do ficheiro
    const stats = fs.statSync(fullPath);
    console.log('Stats do ficheiro:');
    console.log('- Tamanho real:', stats.size);
    console.log('- Tamanho BD:', file.size);

    // Incrementar contador de downloads
    try {
      file.downloadCount = (file.downloadCount || 0) + 1;
      await file.save();
      console.log('✓ Contador de downloads incrementado');
    } catch (error) {
      console.log('⚠️ Erro ao incrementar contador:', error.message);
    }

    console.log('🚀 Iniciando download... Acesso via:', accessType);

    // Configurar headers para download
    const headers = {
      'Content-Disposition': `attachment; filename="${encodeURIComponent(file.originalName)}"`,
      'Content-Type': file.mimetype || 'application/octet-stream',
      'Content-Length': stats.size,
      'Cache-Control': 'no-cache'
    };

    console.log('Headers definidos:', headers);
    res.set(headers);

    // Criar stream do ficheiro
    const fileStream = fs.createReadStream(fullPath);
    
    fileStream.on('error', (error) => {
      console.error('❌ Erro ao ler stream do ficheiro:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Erro ao ler ficheiro do disco'
        });
      }
    });

    fileStream.on('end', () => {
      console.log('✅ Download concluído com sucesso');
    });

    fileStream.on('close', () => {
      console.log('📁 Stream do ficheiro fechado');
    });

    // Pipe do stream para a resposta
    fileStream.pipe(res);

  } catch (error) {
    console.error('=== ERRO CRÍTICO DOWNLOAD FILE ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor durante download',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
      });
    }
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
    await fsPromises.unlink(file.path); // USAR fsPromises aqui

    // Atualizar armazenamento usado
    const user = await User.findById(req.user.userId);
    user.storageUsed -= file.size;
    await user.save();

    // Eliminar registo da base de dados
    await File.findByIdAndDelete(fileId);

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
