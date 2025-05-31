const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./src/routes/auth');
const fileRoutes = require('./src/routes/files');
const userRoutes = require('./src/routes/users');
const folderRoutes = require('./src/routes/folders');
const trashRoutes = require('./src/routes/trash');
const systemRoutes = require('./src/routes/system');
const forumRoutes = require('./src/routes/forum');
const shareRoutes = require('./src/routes/share');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware de segurança
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "http://localhost:3000", "http://localhost:5000"],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// CORRIGIR: Rate limiting mais permissivo durante desenvolvimento
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 200, // Aumentado para 200 requests por minuto
  message: {
    success: false,
    message: 'Muitas requisições. Aguarda 1 minuto.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Permitir bypass para desenvolvimento
  skip: (req) => {
    return process.env.NODE_ENV === 'development' && req.ip === '::1';
  }
});

// Rate limiting específico para uploads
const uploadLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 50, // Aumentado para 50 uploads por minuto
  message: {
    success: false,
    message: 'Muitos uploads. Aguarda 1 minuto.'
  }
});

// Rate limiting específico para APIs que são chamadas frequentemente
const frequentApiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 300, // Muito permissivo para APIs frequentes
  message: {
    success: false,
    message: 'Muitas requisições para esta API.'
  }
});

// Aplicar rate limiting geral
app.use('/api', generalLimiter);

// Rate limiting específico para rotas que precisam de mais permissões
app.use('/api/files/upload', uploadLimiter);
app.use('/api/folders', frequentApiLimiter);
app.use('/api/files', frequentApiLimiter);
app.use('/api/users/storage-stats', frequentApiLimiter);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Middleware de log para debug
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Middleware específico para uploads com headers CORS
app.use('/uploads', (req, res, next) => {
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Conectar à base de dados
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kpcloud')
  .then(() => {
    console.log('Conectado ao MongoDB com sucesso');
  })
  .catch((error) => {
    console.error('Erro ao conectar ao MongoDB:', error);
    process.exit(1);
  });

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/users', userRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/trash', trashRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/share', shareRoutes);

// Servir ficheiros estáticos
app.use('/uploads/profiles', express.static(path.join(__dirname, 'uploads/profiles')));

// Socket.IO
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  socket.on('join-folder', (folderId) => {
    socket.join(folderId);
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Servidor KPCloud a correr na porta ${PORT}`);
  console.log('Rotas disponíveis:');
  console.log('- /api/auth');
  console.log('- /api/files');
  console.log('- /api/users');
  console.log('- /api/folders');
  console.log('- /api/trash');
  console.log('- /api/system');
  console.log('- /api/forum');
  console.log('- /api/share');
});

module.exports = { app, io };
