const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');


// Função auxiliar para criar diretórios
const createDirectoryIfNotExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// CONFIGURAÇÃO ORIGINAL - Upload geral de ficheiros
const generalStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/temp');
    createDirectoryIfNotExists(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = crypto.randomBytes(16).toString('hex') + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

// NOVA CONFIGURAÇÃO - Upload de fotos de perfil
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/profiles');
    createDirectoryIfNotExists(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Para perfis: userId_timestamp.extensão (mais organizado)
    const uniqueName = `${req.user.userId}_${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// FILTROS DE FICHEIROS

// Filtro original - todos os tipos permitidos
const generalFileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain', 'text/csv',
    'application/zip', 'application/x-rar-compressed',
    'video/mp4', 'video/avi', 'video/mov',
    'audio/mp3', 'audio/wav', 'audio/ogg'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de ficheiro não permitido: ${file.mimetype}`), false);
  }
};

// Filtro específico para imagens (fotos de perfil)
const imageFilter = (req, file, cb) => {
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedImageTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de ficheiro não permitido. Apenas JPEG, PNG, GIF e WebP são aceites.'), false);
  }
};

// CONFIGURAÇÕES MULTER

// Upload geral (mantém a tua configuração original)
const uploadGeneral = multer({
  storage: generalStorage,
  fileFilter: generalFileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 100 * 1024 * 1024, // 100MB
    files: 10 // máximo 10 ficheiros por upload
  }
});

// Upload de fotos de perfil (novo)
const uploadProfilePicture = multer({
  storage: profileStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo para fotos de perfil
    files: 1 // apenas 1 ficheiro por vez
  }
}).single('profilePicture');

// MIDDLEWARES PARA EXPORT

// Middleware original (mantém compatibilidade)
const upload = uploadGeneral;

// Middleware para fotos de perfil com tratamento de erros
const handleProfilePictureUpload = (req, res, next) => {
  uploadProfilePicture(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      console.error('Multer Error:', err);
      
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'Ficheiro muito grande. Máximo 5MB permitido para fotos de perfil.'
        });
      }
      
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          success: false,
          message: 'Apenas 1 ficheiro permitido por upload.'
        });
      }
      
      return res.status(400).json({
        success: false,
        message: 'Erro no upload: ' + err.message
      });
    } else if (err) {
      console.error('Upload Error:', err);
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    
    next();
  });
};

// Middleware para upload geral com tratamento de erros melhorado
const handleGeneralUpload = (req, res, next) => {
  const uploadMiddleware = upload.array('files', 10);
  
  uploadMiddleware(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      console.error('Multer Error:', err);
      
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: `Ficheiro muito grande. Máximo ${(parseInt(process.env.MAX_FILE_SIZE) || 100 * 1024 * 1024) / (1024 * 1024)}MB permitido.`
        });
      }
      
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          success: false,
          message: 'Máximo 10 ficheiros permitidos por upload.'
        });
      }
      
      return res.status(400).json({
        success: false,
        message: 'Erro no upload: ' + err.message
      });
    } else if (err) {
      console.error('Upload Error:', err);
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    
    next();
  });
};

// FUNÇÕES AUXILIARES

// Função para limpar ficheiros temporários antigos
const cleanupTempFiles = async (maxAge = 24 * 60 * 60 * 1000) => { // 24 horas por padrão
  try {
    const tempDir = path.join(__dirname, '../../uploads/temp');
    const files = await fs.promises.readdir(tempDir);
    const now = Date.now();
    
    for (const file of files) {
      const filePath = path.join(tempDir, file);
      const stats = await fs.promises.stat(filePath);
      
      if (now - stats.mtime.getTime() > maxAge) {
        await fs.promises.unlink(filePath);
        console.log(`Ficheiro temporário eliminado: ${file}`);
      }
    }
  } catch (error) {
    console.error('Erro ao limpar ficheiros temporários:', error);
  }
};

// Função para obter informações de um ficheiro
const getFileInfo = (file) => {
  return {
    filename: file.filename,
    originalName: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    path: file.path,
    destination: file.destination
  };
};

// Função para validar se é uma imagem
const isImage = (mimetype) => {
  return mimetype && mimetype.startsWith('image/');
};

// Função para obter extensão do ficheiro
const getFileExtension = (filename) => {
  return path.extname(filename).toLowerCase();
};

// EXPORTS
module.exports = {
  // Exports originais (mantém compatibilidade)
  upload,
  
  // Novos exports específicos
  uploadGeneral,
  uploadProfilePicture,
  
  // Middlewares prontos a usar
  handleGeneralUpload,
  handleProfilePictureUpload,
  
  // Funções auxiliares
  cleanupTempFiles,
  getFileInfo,
  isImage,
  getFileExtension,
  createDirectoryIfNotExists,
  
  // Configurações específicas (se precisares customizar)
  generalStorage,
  profileStorage,
  generalFileFilter,
  imageFilter
};
