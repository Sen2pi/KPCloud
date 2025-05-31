const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async sendWelcomeEmail(user) {
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: user.email,
      subject: 'Bem-vindo ao KPCloud!',
      html: `
        <h1>Bem-vindo ao KPCloud, ${user.firstName}!</h1>
        <p>A tua conta foi criada com sucesso.</p>
        <p>Podes começar a fazer upload dos teus ficheiros e partilhá-los com outros utilizadores.</p>
        <p>Quota de armazenamento: ${(user.storageQuota / (1024 * 1024 * 1024)).toFixed(2)} GB</p>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('Email de boas-vindas enviado para:', user.email);
    } catch (error) {
      console.error('Erro ao enviar email:', error);
    }
  }

  async sendFileSharedNotification(user, file, sharedBy) {
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: user.email,
      subject: 'Ficheiro partilhado contigo - KPCloud',
      html: `
        <h2>Ficheiro Partilhado</h2>
        <p>Olá ${user.firstName},</p>
        <p>${sharedBy.firstName} ${sharedBy.lastName} partilhou o ficheiro "${file.originalName}" contigo.</p>
        <p>Podes aceder ao ficheiro na tua conta KPCloud.</p>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
    }
  }
}

module.exports = new EmailService();
