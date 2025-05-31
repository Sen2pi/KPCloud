const jwt = require('jsonwebtoken');
const User = require('../models/User');

// backend/src/middleware/auth.js - adicionar log
module.exports = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    console.log('Token recebido:', token ? 'Sim' : 'Não');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de acesso necessário'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'kpcloud-secret');
    console.log('Token decodificado:', decoded);
    
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }

    req.user = decoded;
    console.log('Utilizador autenticado:', decoded.userId);
    next();
  } catch (error) {
    console.error('Erro de autenticação:', error);
    res.status(401).json({
      success: false,
      message: 'Token inválido',
      error: error.message
    });
  }
};

