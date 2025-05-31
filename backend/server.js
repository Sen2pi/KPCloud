const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./src/routes/auth');
const fileRoutes = require('./src/routes/files');
const userRoutes = require('./src/routes/users');
const folderRoutes = require('./src/routes/folders');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware de segurança
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // máximo 100 requests por IP
});
app.use(limiter);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Conectar à base de dados
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kpcloud', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/users', userRoutes);
app.use('/api/folders', folderRoutes);

// Servir ficheiros estáticos
app.use('/uploads', express.static('uploads'));

// Socket.IO para sincronização em tempo real
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
});

module.exports = { app, io };
