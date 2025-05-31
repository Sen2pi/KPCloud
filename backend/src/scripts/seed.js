const mongoose = require('mongoose');
const User = require('../src/models/User');
require('dotenv').config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conectado à base de dados');

    // Criar utilizador administrador
    const adminUser = await User.findOne({ email: 'admin@kpcloud.com' });
    
    if (!adminUser) {
      const admin = new User({
        username: 'admin',
        email: 'admin@kpcloud.com',
        password: 'admin123',
        firstName: 'Administrador',
        lastName: 'KPCloud',
        role: 'admin',
        storageQuota: 100 * 1024 * 1024 * 1024 // 100GB
      });

      await admin.save();
      console.log('Utilizador administrador criado');
    }

    console.log('Seed concluído');
    process.exit(0);
  } catch (error) {
    console.error('Erro no seed:', error);
    process.exit(1);
  }
};

seedDatabase();
