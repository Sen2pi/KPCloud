const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

// CORS CONFIGURAÇÃO PARA TODOS OS ENDEREÇOS
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requisições sem origin (ex: aplicações móveis, Postman)
    if (!origin) return callback(null, true);
    
    // Permitir TODOS os origins
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With', 
    'Content-Type', 
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma'
  ],
  optionsSuccessStatus: 200 // Para suportar browsers legados
};

// Aplicar CORS ANTES de todas as outras configurações
app.use(cors(corsOptions));

// Headers CORS adicionais para garantir compatibilidade
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Permitir qualquer origin
  res.header('Access-Control-Allow-Origin', origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,Authorization,Cache-Control,Pragma');
  
  // Responder a requisições OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Middleware de segurança (DEPOIS do CORS)
app.use(helmet({
  contentSecurityPolicy: false, // Desativar CSP que pode interferir
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
}));

// Rate limiting mais permissivo
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 300, // Aumentado para 300 requests por minuto
  message: {
    success: false,
    message: 'Muitas requisições. Aguarda 1 minuto.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Permitir bypass para desenvolvimento
  skip: (req) => {
    return process.env.NODE_ENV === 'development';
  }
});

app.use('/api', generalLimiter);

// IMPORTANTE: Middleware para parsear JSON DEPOIS do CORS
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Middleware de log para debug
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - Origin: ${req.headers.origin || 'No origin'}`);
  next();
});

// Servir ficheiros estáticos com CORS
app.use('/uploads', (req, res, next) => {
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.header('Access-Control-Allow-Origin', '*');
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Conectar à base de dados
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kpcloud')
  .then(() => {
    console.log('✅ Conectado ao MongoDB com sucesso');
  })
  .catch((error) => {
    console.error('❌ Erro ao conectar ao MongoDB:', error);
    process.exit(1);
  });

// Importar rotas
const authRoutes = require('./src/routes/auth');
const fileRoutes = require('./src/routes/files');
const userRoutes = require('./src/routes/users');
const folderRoutes = require('./src/routes/folders');
const trashRoutes = require('./src/routes/trash');
const systemRoutes = require('./src/routes/system');
const forumRoutes = require('./src/routes/forum');
const shareRoutes = require('./src/routes/share');

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/users', userRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/trash', trashRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/share', shareRoutes);

// Rota de teste
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'KPCloud Backend está a funcionar!',
    timestamp: new Date().toISOString(),
    cors: 'Habilitado para todos os origins'
  });
});

// Tratamento de erros CORS
app.use((err, req, res, next) => {
  if (err.message && err.message.includes('CORS')) {
    console.error('Erro CORS:', err);
    return res.status(500).json({
      success: false,
      message: 'Erro de CORS',
      error: err.message
    });
  }
  
  console.error('Erro não tratado:', err);
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor'
  });
});

// Tratamento de rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada'
  });
});

// Socket.IO com CORS
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: "*", // Permitir todos os origins
    methods: ["GET", "POST"],
    credentials: true
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

server.listen(PORT, HOST, () => {
  console.log(`🚀 Servidor KPCloud a correr em http://${HOST}:${PORT}`);
  console.log(`🌐 CORS habilitado para TODOS os origins`);
  console.log('📍 Rotas disponíveis:');
  console.log('  - GET  /');
  console.log('  - POST /api/auth/register');
  console.log('  - POST /api/auth/login');
  console.log('  - GET  /api/auth/profile');
  console.log('  - GET  /api/health');
});

module.exports = { app, io };
